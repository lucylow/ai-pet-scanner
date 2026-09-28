import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ActivityIndicator, AppState, Image, Linking, ScrollView, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { SafeBackButton } from "@/components/safe-back-button";
import { SafeRouteButton } from "@/components/safe-route-button";
import { analysisStatusAccessibilityHint, reduceAnalysisFlow, type AnalysisFlowState, type ScanFailureStage } from "@/lib/analysis-flow";
import { isRetryableScanError, runRemoteScanViaTrpcBatch } from "@/lib/scan-orchestrator";
import { classifyImagePickerOutcome, MAX_SCAN_PHOTOS, normalizeSelectedMediaAssets, type ImagePickerAssetLike } from "@/lib/media-upload";
import { Card, Label, PrimaryButton, SecondaryButton, SectionTitle, StatusPill } from "@/components/pet-ui";
import { ScanStageTimeline } from "@/components/scan-stage-timeline";
import { appendScanSafely, clearScanDraft, loadActivePetId, loadPets, loadScanDraft, saveScanDraft, validateImageForObservation, type BodyArea, type PetProfile, type ScanImage, type ScanObservationContext, type ScanResult } from "@/lib/pet-health";
import { createPhotoAsset, projectAttachmentReview, recoveredMediaStatusFromCounts, validateMultimodalAsset, type RecoveredMediaSummary } from "@/lib/multimodal";
import { useNetworkAwareness } from "@/hooks/use-network-awareness";
import { ENGLISH_CORE_COPY, bodyAreaCopyKeys, formatRecoveredMediaAccessibilityAnnouncement } from "@/lib/i18n-language";
import { mediaPermissionRecoveryAction } from "@/lib/media-sharing";
import { useLanguage } from "@/lib/language-provider";

const areas: BodyArea[] = ["skin", "eyes", "teeth", "ears", "paws", "other"];
const contextFields: { key: keyof ScanObservationContext; labelKey: keyof typeof ENGLISH_CORE_COPY; placeholderKey: keyof typeof ENGLISH_CORE_COPY }[] = [
  { key: "onset", labelKey: "scan.contextOnset", placeholderKey: "scan.contextOnsetPlaceholder" },
  { key: "changing", labelKey: "scan.contextChanging", placeholderKey: "scan.contextChangingPlaceholder" },
  { key: "behavior", labelKey: "scan.contextBehavior", placeholderKey: "scan.contextBehaviorPlaceholder" },
  { key: "appetite", labelKey: "scan.contextAppetite", placeholderKey: "scan.contextAppetitePlaceholder" },
  { key: "visibleNotes", labelKey: "scan.contextVisibleNotes", placeholderKey: "scan.contextVisibleNotesPlaceholder" },
];

export default function ScanScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const copy = useCallback((key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] }), [t]);
  const localizedAnalysisStatus = useCallback((state: AnalysisFlowState) => {
    if (state.status === "uploading") return copy("scan.preparing");
    if (state.status === "analyzing") return copy("scan.reviewing");
    if (state.status === "success") return copy("scan.ready");
    if (state.status === "error" && state.attempt >= 3 && state.retryable) return `${state.message} ${copy("scan.retryLimit")}`;
    if (state.status === "error") return state.message;
    return copy("scan.ready");
  }, [copy]);
  const localizedAttemptLabel = useCallback((state: AnalysisFlowState) => {
    if (state.status !== "uploading" && state.status !== "analyzing" && state.status !== "error") return null;
    const remaining = Math.max(0, 3 - state.attempt);
    return state.attempt >= 3
      ? copy("scan.finalAttempt")
      : t("scan.attempt", { defaultValue: ENGLISH_CORE_COPY["scan.attempt"], attempt: state.attempt, remaining });
  }, [copy, t]);
  const [area, setArea] = useState<BodyArea>("skin");
  const [image, setImage] = useState<ScanImage | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ScanImage[]>([]);
  const [recoverySummary, setRecoverySummary] = useState<RecoveredMediaSummary | null>(null);
  const [notes, setNotes] = useState<ScanObservationContext>({});
  const [review, setReview] = useState(false);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrationError, setHydrationError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [pendingCompletedScan, setPendingCompletedScan] = useState<ScanResult | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [cameraPermissionRecovery, setCameraPermissionRecovery] = useState<"retry" | "settings" | null>(null);
  const [openingCameraSettings, setOpeningCameraSettings] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [clearingDraft, setClearingDraft] = useState(false);
  const [draftClearFailed, setDraftClearFailed] = useState(false);
  const [selectingMedia, setSelectingMedia] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const selectingMediaRef = useRef(false);
  const [analysisState, dispatchAnalysis] = useReducer(reduceAnalysisFlow, { status: "idle" } as AnalysisFlowState);
  const photoCount = image ? 1 + additionalImages.length : 0;
  const network = useNetworkAwareness();
  const previousOfflineRef = useRef(false);
  const loadingRef = useRef(false);
  useEffect(() => { if (previousOfflineRef.current && !network.isOffline && !network.isChecking) { setReconnected(true); const timer = setTimeout(() => setReconnected(false), 4000); return () => clearTimeout(timer); } previousOfflineRef.current = network.isOffline; return undefined; }, [network.isOffline, network.isChecking]);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);

  const loadActivePet = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setHydrationError(false);
    try {
      const pets = (await loadPets()).filter((pet) => !pet.archived);
      const activeId = await loadActivePetId();
      const selectedPet = pets.find((pet) => pet.id === activeId) ?? pets[0] ?? null;
      setActivePet(selectedPet);
      const draft = await loadScanDraft();
      setPendingCompletedScan(null);
      if (selectedPet && draft?.petId === selectedPet.id) {
        if (draft.completedScan) {
          setPendingCompletedScan(draft.completedScan);
          try {
            const recovered = await appendScanSafely(draft.completedScan);
            if (recovered.saved) {
              await clearScanDraft();
              setSelectionError(copy("scan.recoveredCompletedScan"));
              setPendingCompletedScan(null);
              setRecoveredDraft(false);
              return;
            }
          } catch {
            // Keep the completed result in the draft and surface the normal retry state below.
          }
        }
        setArea(draft.area);
        setImage(draft.image);
        setAdditionalImages(draft.additionalImages ?? []);
        setNotes(draft.notes);
        const recovery = draft.recovery ?? { rejectedCount: 0, truncatedCount: 0 };
        setRecoverySummary(recovery.rejectedCount > 0 || recovery.truncatedCount > 0 ? { status: recoveredMediaStatusFromCounts(recovery.rejectedCount, recovery.truncatedCount), restoredCount: 1 + (draft.additionalImages?.length ?? 0), rejectedCount: recovery.rejectedCount, truncatedCount: recovery.truncatedCount, hasWarnings: true, accessibilityLiveRegion: "polite" } : null);
        setRecoveredDraft(true);
      }
    } catch {
      setHydrationError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [copy]);
  useEffect(() => { void loadActivePet(); }, [loadActivePet]);

  const clearDraftSafely = async () => {
    if (clearingDraft) return;
    setClearingDraft(true);
    setDraftClearFailed(false);
    setSelectionError(null);
    try {
      await clearScanDraft();
      setImage(null);
      setAdditionalImages([]);
      setNotes({});
      setReview(false);
      setRecoveredDraft(false);
      setDraftClearFailed(false);
      dispatchAnalysis({ type: "CANCEL" });
    } catch {
      setDraftClearFailed(true);
      setSelectionError(copy("scan.draftRemoval"));
    } finally {
      setClearingDraft(false);
    }
  };

  const saveDraftSafely = useCallback(async (completedScan?: ScanResult) => {
    if (!activePet || !image) return false;
    try {
      await saveScanDraft({ petId: activePet.id, area, image, additionalImages, notes, recovery: recoverySummary ? { rejectedCount: recoverySummary.rejectedCount, truncatedCount: recoverySummary.truncatedCount } : undefined, completedScan });
      return true;
    } catch {
      setSelectionError(copy("scan.draftSave"));
      return false;
    }
  }, [activePet, additionalImages, area, image, notes, copy, recoverySummary]);

  const applyPickedAssets = useCallback((assets: readonly ImagePickerAssetLike[], fromCamera: boolean) => {
    const normalized = normalizeSelectedMediaAssets(assets, MAX_SCAN_PHOTOS);
    const validAssets = normalized.media.filter((asset) => validateMultimodalAsset(createPhotoAsset({ id: `photo-${asset.uri}`, uri: asset.uri, mimeType: asset.mimeType, sizeBytes: asset.fileSize, width: asset.width, height: asset.height }, fromCamera ? "camera" : "library")).ok);
    if (validAssets.length === 0) { setSelectionError(normalized.firstError ?? copy("scan.unsupportedPhoto")); return false; }
    const current = fromCamera ? [] : (image ? [image, ...additionalImages] : []);
    const merged = [...current, ...validAssets].filter((asset, index, items) => items.findIndex((item) => item.uri === asset.uri) === index).slice(0, MAX_SCAN_PHOTOS);
    const skippedCount = normalized.rejectedCount + normalized.truncatedCount + Math.max(0, current.length + validAssets.length - merged.length);
    setRecoverySummary(skippedCount > 0 ? { status: recoveredMediaStatusFromCounts(skippedCount, 0), restoredCount: merged.length, rejectedCount: skippedCount, truncatedCount: 0, hasWarnings: true, accessibilityLiveRegion: "polite" } : null);
    setSelectionError(skippedCount > 0 ? t("scan.somePhotosSkipped", { defaultValue: ENGLISH_CORE_COPY["scan.somePhotosSkipped"], count: skippedCount }) : null);
    setCameraPermissionRecovery(null);
    setImage(merged[0] ?? null);
    setAdditionalImages(merged.slice(1));
    setReview(false);
    setRecoveredDraft(false);
    return merged.length > 0;
  }, [additionalImages, copy, image, t]);

  const pendingMediaRecoveryRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    const recoverPendingPickerResult = async () => {
      if (!mounted || pendingMediaRecoveryRef.current || selectingMediaRef.current) return;
      pendingMediaRecoveryRef.current = true;
      try {
        const pending = await ImagePicker.getPendingResultAsync();
        if (!mounted || !pending) return;
        if (!("canceled" in pending)) { setSelectionError(copy("scan.pickerError")); return; }
        const outcome = classifyImagePickerOutcome(pending);
        if (outcome === "cancelled") return;
        if (outcome === "missing-asset") { setSelectionError(copy("scan.pickerError")); return; }
        if (!pending.assets?.length) { setSelectionError(copy("scan.pickerError")); return; }
        applyPickedAssets(pending.assets, false);
      } catch {
        if (mounted) setSelectionError(copy("scan.pickerError"));
      } finally {
        pendingMediaRecoveryRef.current = false;
      }
    };
    void recoverPendingPickerResult();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void recoverPendingPickerResult(); });
    return () => { mounted = false; subscription.remove(); };
  }, [applyPickedAssets, copy]);

  const openCameraSettings = async () => {
    if (openingCameraSettings || saving || cancelling) return;
    setOpeningCameraSettings(true);
    try {
      await Linking.openSettings();
      setSelectionError(copy("scan.settingsOpened"));
    } catch {
      setSelectionError(copy("scan.settingsOpenError"));
    } finally {
      setOpeningCameraSettings(false);
    }
  };

  const pick = async (fromCamera: boolean) => {
    if (selectingMediaRef.current) return;
    selectingMediaRef.current = true;
    setSelectingMedia(true);
    setSelectionError(null);
    if (!fromCamera) setCameraPermissionRecovery(null);
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== "granted") {
          setCameraPermissionRecovery(mediaPermissionRecoveryAction(permission.canAskAgain !== false));
          setSelectionError(copy("scan.cameraPermission"));
          return;
        }
        setCameraPermissionRecovery(null);
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsMultipleSelection: true, selectionLimit: Math.max(1, MAX_SCAN_PHOTOS - photoCount) });
      const outcome = classifyImagePickerOutcome(result);
      if (outcome === "cancelled") return;
      if (outcome === "missing-asset") { setSelectionError(copy("scan.pickerError")); return; }
      if (!result.assets?.length) { setSelectionError(copy("scan.pickerError")); return; }
      if (!applyPickedAssets(result.assets, fromCamera)) return;
      setCameraPermissionRecovery(null);
    } catch {
      setSelectionError(copy("scan.pickerError"));
    } finally {
      selectingMediaRef.current = false;
      setSelectingMedia(false);
    }
  };

  const removePhoto = (index: number) => {
    const photos = [image, ...additionalImages].filter((item): item is ScanImage => Boolean(item));
    const remaining = photos.filter((_, photoIndex) => photoIndex !== index);
    setImage(remaining[0] ?? null);
    setAdditionalImages(remaining.slice(1));
    setReview(false);
    setRecoveredDraft(false);
    setRecoverySummary(null);
  };

  const finish = async () => {
    if (!activePet || !image || saving) return;
    const selectedImages = [image, ...additionalImages];
    const uploadableImages = selectedImages.map(({ fileSize, ...item }) => ({ ...item, size: fileSize }));
    if (network.isOffline) { setSelectionError(copy("scan.offlineDraftNotice")); await saveDraftSafely(); return; }
    setSaving(true);
    const runId = runRef.current + 1;
    runRef.current = runId;
    const attempt = analysisState.status === "error" ? analysisState.attempt : 1;
    dispatchAnalysis({ type: "START", attempt });
      const quality = validateImageForObservation(image);
    const scanId = `${Date.now()}`;
    const controller = new AbortController();
    abortRef.current = controller;
    let completedScan: ScanResult | null = null;
    let failureStage: ScanFailureStage = "upload";
    try {
      const remote = await runRemoteScanViaTrpcBatch(uploadableImages, { scanId, area, species: activePet.species, language, context: JSON.stringify(notes) }, {
        signal: controller.signal,
        onStage: (stage) => { if (stage === "analyzing") failureStage = "analysis"; if (runRef.current === runId && stage === "analyzing") dispatchAnalysis({ type: "UPLOADED", attempt }); },
      });
      if (runRef.current !== runId) return;
      const overallStatus: ScanResult["status"] = remote.analysis.overall === "urgent" ? "urgent-review" : remote.analysis.overall === "prompt-vet" || remote.analysis.overall === "watch" ? "needs-review" : "observation";
      const observations = remote.analysis.findings.length > 0
        ? remote.analysis.findings.map((finding) => `${finding.label}: ${finding.evidence.join(" ")} ${finding.limitations.join(" ")}`.trim())
        : [remote.analysis.imageQuality.usable ? copy("scan.imageAcceptedObservation") : copy("scan.imageQualityLimitedObservation"), copy("scan.nonDiagnosticObservation")];
      const scan: ScanResult = {
        id: scanId,
        petId: activePet.id,
        petName: activePet.name,
        bodyArea: area,
        imageUri: image.uri,
        imageUris: selectedImages.map((item) => item.uri),
        createdAt: new Date().toISOString(),
        quality: remote.analysis.imageQuality.usable && selectedImages.every((item) => validateImageForObservation(item).quality === "good") && quality.quality === "good" ? "good" : "limited",
        status: overallStatus,
        summary: remote.analysis.emergencyWarning ? copy("scan.emergencySummary") : copy("scan.structuredObservationSummary"),
        observations,
        nextSteps: remote.analysis.nextSteps,
        context: notes,
        remoteAnalysis: remote.analysis,
        sourceMediaUrl: remote.mediaUrls[0],
        sourceMediaKey: remote.mediaKeys[0],
        sourceMediaUrls: remote.mediaUrls,
        sourceMediaKeys: remote.mediaKeys,
      };
      completedScan = scan;
      failureStage = "local-save";
      const appendResult = await appendScanSafely(scan);
      if (!appendResult.saved) throw new Error("scan history storage unavailable");
      try {
        await clearScanDraft();
      } catch {
        try { await clearScanDraft(); } catch { setDraftClearFailed(true); setSelectionError(copy("scan.savedDraftClearError")); }
      }
      dispatchAnalysis({ type: "SUCCESS", scanId: scan.id });
      try {
        await router.replace({ pathname: "/history", params: { scanId: scan.id } } as never);
      } catch {
        setSelectionError(copy("scan.historyNavigationError"));
      }
    } catch (error) {
      const draftSaved = await saveDraftSafely(completedScan ?? undefined);
      if (runRef.current !== runId) return;
      if ((error as { name?: string }).name === "AbortError") dispatchAnalysis({ type: "FAIL", attempt, message: copy("scan.cancelled"), retryable: false, stage: "cancelled" });
      else {
        const retryable = failureStage === "local-save" || isRetryableScanError(error);
        const message = !draftSaved
          ? copy("scan.draftSaveFailed")
          : failureStage === "upload"
            ? copy("scan.uploadFailed")
            : failureStage === "local-save"
              ? copy("scan.localSaveFailed")
              : retryable
                ? copy("scan.connectionInterrupted")
                : copy("scan.analysisFailed");
        dispatchAnalysis({ type: "FAIL", attempt, message, retryable, stage: failureStage });
      }
    } finally {
      if (runRef.current === runId) { abortRef.current = null; setSaving(false); }
    }
  };

  const retryCompletedRecovery = async () => {
    if (!pendingCompletedScan || saving || cancelling) return;
    setSaving(true);
    setSelectionError(null);
    try {
      const recovered = await appendScanSafely(pendingCompletedScan);
      if (!recovered.saved) throw new Error("scan history storage unavailable");
      await clearScanDraft();
      setPendingCompletedScan(null);
      setRecoveredDraft(false);
      setSelectionError(copy("scan.recoveredCompletedScan"));
      try {
        await router.replace({ pathname: "/history", params: { scanId: pendingCompletedScan.id } } as never);
      } catch {
        setSelectionError(copy("scan.historyNavigationError"));
      }
    } catch {
      setSelectionError(copy("scan.completedRecoveryRetryFailed"));
    } finally {
      setSaving(false);
    }
  };

  const cancelAnalysis = async () => {
    if (cancelling) return;
    setCancelling(true);
    runRef.current += 1;
    abortRef.current?.abort();
    try {
      if (activePet && image) await saveDraftSafely();
      dispatchAnalysis({ type: "CANCEL" });
      setSaving(false);
    } finally {
      setCancelling(false);
    }
  };

  const activeStage = analysisState.status === "success" ? "saved" : analysisState.status === "error" ? "error" : analysisState.status === "uploading" ? "uploading" : analysisState.status === "analyzing" ? "analyzing" : "photo";
  const reviewProjection = recoverySummary ? projectAttachmentReview(recoverySummary) : null;

  if (loading) return <ScreenContainer className="px-5 pt-5"><Card><Text accessibilityRole="progressbar" accessibilityLiveRegion="polite" className="text-base text-muted">{copy("scan.loadingSetup")}</Text></Card></ScreenContainer>;
  if (hydrationError) return <ScreenContainer className="px-5 pt-5"><Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-lg font-bold text-foreground">{copy("scan.setupLoadErrorTitle")}</Text><Text className="mt-2 text-sm leading-5 text-foreground">{copy("scan.setupLoadErrorBody")}</Text><SecondaryButton disabled={loading} accessibilityLabel={loading ? copy("scan.loadingSetup") : copy("home.retry")} accessibilityHint={copy("scan.setupRetryHint")} accessibilityState={{ disabled: loading, busy: loading }} onPress={loadActivePet} style={{ marginTop: 14, opacity: loading ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{loading ? copy("scan.loadingSetup") : copy("home.retry")}</Text></SecondaryButton><SafeRouteButton path="/pets" label={copy("pets.managePets")} style={{ marginTop: 10 }} /></Card></ScreenContainer>;
  if (!activePet) return <ScreenContainer className="px-5 pt-5"><Card tone="amber"><Text className="text-lg font-bold text-foreground">{copy("scan.addPetTitle")}</Text><Text className="mt-2 text-sm leading-5 text-foreground">{copy("scan.addPetBody")}</Text><SafeRouteButton path="/pets" label={copy("pets.addPet")} variant="primary" style={{ marginTop: 14 }} /><SafeBackButton label={copy("scan.cancel")} hint={copy("scan.cancelNavigationHint")} busyLabel={copy("scan.opening")} /></Card></ScreenContainer>;

  return <ScreenContainer className="px-5 pt-5"><ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 36 }}>
    <SectionTitle eyebrow={copy("scan.eyebrow")}>{copy("scan.title")}</SectionTitle><Card><ScanStageTimeline activeStage={activeStage} /></Card>{selectingMedia ? <Card tone="sage"><View accessibilityRole="progressbar" accessibilityLabel={copy("scan.validatingPhoto")} accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><ActivityIndicator color="#2F735E" /><Text className="text-sm leading-5 text-foreground">{copy("scan.validatingPhoto")}</Text></View></Card> : null}{saving ? <Card tone="sage"><View accessibilityRole="progressbar" accessibilityLabel={copy("scan.savingObservation")} accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><ActivityIndicator color="#2F735E" /><Text className="text-sm leading-5 text-foreground">{copy("scan.savingObservation")}</Text></View></Card> : null}{reconnected ? <Card tone="sage"><Text accessibilityRole="text" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("scan.connectionRestored")}</Text></Card> : null}{network.isOffline ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("scan.offlineDraftNotice")}</Text></Card> : null}{reviewProjection ? <Card tone="sage"><Text accessibilityRole="alert" accessibilityLiveRegion={reviewProjection.accessibilityLiveRegion} className="text-sm leading-5 text-foreground">{formatRecoveredMediaAccessibilityAnnouncement(recoverySummary!, language)}</Text><Text className="mt-1 text-xs leading-4 text-muted">{t("scan.photoCount", { defaultValue: ENGLISH_CORE_COPY["scan.photoCount"], count: reviewProjection.restoredCount, max: MAX_SCAN_PHOTOS })}</Text></Card> : null}{selectionError ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{selectionError}</Text>{draftClearFailed ? <SecondaryButton disabled={clearingDraft || saving || cancelling} accessibilityLabel={clearingDraft ? copy("scan.removingDraft") : copy("scan.retryDraftRemoval")} accessibilityHint={copy("scan.draftRetryHint")} accessibilityState={{ disabled: clearingDraft || saving || cancelling, busy: clearingDraft }} onPress={clearDraftSafely} style={{ marginTop: 12, opacity: clearingDraft || saving || cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{clearingDraft ? copy("scan.removingDraft") : copy("scan.retryDraftRemoval")}</Text></SecondaryButton> : null}{cameraPermissionRecovery ? <SecondaryButton disabled={openingCameraSettings || selectingMedia || saving || cancelling} accessibilityLabel={cameraPermissionRecovery === "settings" ? copy("scan.cameraSettings") : copy("scan.cameraPermissionRetry")} accessibilityHint={cameraPermissionRecovery === "settings" ? copy("scan.cameraSettings") : copy("scan.cameraPermissionRetry")} accessibilityState={{ disabled: openingCameraSettings || selectingMedia || saving || cancelling, busy: openingCameraSettings }} onPress={() => void (cameraPermissionRecovery === "settings" ? openCameraSettings() : pick(true))} style={{ marginTop: 12, opacity: openingCameraSettings || selectingMedia || saving || cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{openingCameraSettings ? copy("scan.opening") : cameraPermissionRecovery === "settings" ? copy("scan.cameraSettings") : copy("scan.cameraPermissionRetry")}</Text></SecondaryButton> : null}</Card> : null}{pendingCompletedScan ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("scan.completedRecoveryWaiting")}</Text><SecondaryButton disabled={saving || cancelling} accessibilityLabel={copy("scan.retryCompletedRecovery")} accessibilityHint={copy("scan.completedRecoveryWaiting")} accessibilityState={{ disabled: saving || cancelling, busy: saving }} onPress={() => void retryCompletedRecovery()} style={{ marginTop: 12, opacity: saving || cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{saving ? copy("scan.savingObservation") : copy("scan.retryCompletedRecovery")}</Text></SecondaryButton></Card> : null}{recoveredDraft ? <Card tone="sage"><Text className="text-sm leading-5 text-foreground">{copy("scan.restoredDraft")}</Text><SecondaryButton disabled={clearingDraft || saving || cancelling} accessibilityLabel={clearingDraft ? copy("scan.removingDraft") : saving || cancelling ? copy("scan.scanBusy") : copy("scan.removeDraft")} accessibilityHint={copy("scan.draftRemoveHint")} accessibilityState={{ disabled: clearingDraft || saving || cancelling, busy: clearingDraft }} onPress={clearDraftSafely} style={{ marginTop: 12, opacity: clearingDraft || saving || cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{clearingDraft ? copy("scan.removingDraft") : saving || cancelling ? copy("scan.scanBusy") : copy("scan.removeDraft")}</Text></SecondaryButton></Card> : null}
    <Card tone="sage"><View style={{ gap: 8 }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text className="text-lg font-bold text-foreground">{t("scan.activePetTitle", { defaultValue: ENGLISH_CORE_COPY["scan.activePetTitle"], petName: activePet.name })}</Text><StatusPill>{activePet.species === "dog" ? copy("pets.dog") : copy("pets.cat")}</StatusPill></View><Text className="text-sm leading-5 text-muted">{copy("scan.activePetHint")}</Text></View></Card>
    <Text className="text-base leading-6 text-muted">{copy("scan.chooseArea")}</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{areas.map((item) => <SecondaryButton key={item} disabled={saving || cancelling} accessibilityLabel={`${copy(bodyAreaCopyKeys[item])}${area === item ? copy("history.selectedSuffix") : ""}`} accessibilityHint={saving || cancelling ? copy("scan.areaBusyHint") : copy("scan.areaChangeHint")} accessibilityState={{ selected: area === item, disabled: saving || cancelling }} onPress={() => setArea(item)} style={{ minWidth: "30%", backgroundColor: area === item ? "#DCE9DF" : "#FFFDF9", opacity: saving || cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{copy(bodyAreaCopyKeys[item])}</Text></SecondaryButton>)}</View>
    {!image ? <Card tone="sage"><View style={{ gap: 12 }}><Text className="text-lg font-bold text-foreground">{copy("scan.photoGuidanceTitle")}</Text><Text className="text-sm leading-5 text-muted">{copy("scan.photoGuidanceBody")} {copy("scan.photoOnly")}</Text><View style={{ flexDirection: "row", gap: 10 }}><PrimaryButton disabled={selectingMedia} accessibilityLabel={selectingMedia ? copy("scan.photoOpeningCamera") : copy("scan.camera")} accessibilityHint={copy("scan.cameraHint")} accessibilityState={{ disabled: selectingMedia, busy: selectingMedia }} onPress={() => void pick(true)} style={{ flex: 1, opacity: selectingMedia ? 0.55 : 1 }}><Text className="font-bold text-white">{selectingMedia ? copy("scan.opening") : copy("scan.camera")}</Text></PrimaryButton><SecondaryButton disabled={selectingMedia} accessibilityLabel={selectingMedia ? copy("scan.photoOpeningLibrary") : copy("scan.library")} accessibilityHint={copy("scan.libraryHint")} accessibilityState={{ disabled: selectingMedia, busy: selectingMedia }} onPress={() => void pick(false)} style={{ flex: 1, opacity: selectingMedia ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{selectingMedia ? copy("scan.opening") : copy("scan.library")}</Text></SecondaryButton></View></View></Card> : <Card><View style={{ gap: 12 }}><Text className="text-sm leading-5 text-muted">{t("scan.photoCount", { defaultValue: ENGLISH_CORE_COPY["scan.photoCount"], count: photoCount, max: MAX_SCAN_PHOTOS })}</Text><Text className="text-xs leading-4 text-muted">{t("scan.multiPhotoGuidance", { defaultValue: ENGLISH_CORE_COPY["scan.multiPhotoGuidance"], max: MAX_SCAN_PHOTOS })}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{[image, ...additionalImages].filter((item): item is ScanImage => Boolean(item)).map((photo, index) => <View key={photo.uri} style={{ width: "47%", gap: 6 }}><Image source={{ uri: photo.uri }} style={{ width: "100%", height: 140, borderRadius: 16, backgroundColor: "#E6DED3" }} resizeMode="cover" accessibilityLabel={t("scan.photoNumber", { defaultValue: ENGLISH_CORE_COPY["scan.photoNumber"], index: index + 1 })} /><StatusPill tone={validateImageForObservation(photo).quality === "good" ? "sage" : "amber"}>{validateImageForObservation(photo).quality === "good" ? copy("scan.photoQualityGood") : copy("scan.photoQualityLimited")}</StatusPill><SecondaryButton disabled={selectingMedia || saving} accessibilityLabel={t("scan.removePhoto", { defaultValue: ENGLISH_CORE_COPY["scan.removePhoto"], index: index + 1 })} accessibilityHint={copy("scan.photoRetakeHint")} accessibilityState={{ disabled: selectingMedia || saving }} onPress={() => removePhoto(index)} style={{ opacity: selectingMedia || saving ? 0.55 : 1 }}><Text className="text-xs font-semibold text-foreground">{t("scan.removePhoto", { defaultValue: ENGLISH_CORE_COPY["scan.removePhoto"], index: index + 1 })}</Text></SecondaryButton></View>)}</View>{photoCount < MAX_SCAN_PHOTOS ? <SecondaryButton disabled={selectingMedia || saving} accessibilityLabel={copy("scan.addMorePhotos")} accessibilityHint={t("scan.multiPhotoGuidance", { defaultValue: ENGLISH_CORE_COPY["scan.multiPhotoGuidance"], max: MAX_SCAN_PHOTOS })} accessibilityState={{ disabled: selectingMedia || saving }} onPress={() => void pick(false)} style={{ opacity: selectingMedia || saving ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{copy("scan.addMorePhotos")}</Text></SecondaryButton> : null}<SecondaryButton disabled={selectingMedia || saving} accessibilityLabel={copy("scan.retakePhoto")} accessibilityHint={copy("scan.photoRetakeHint")} accessibilityState={{ disabled: selectingMedia || saving }} onPress={() => removePhoto(0)} style={{ opacity: selectingMedia || saving ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{copy("scan.retakePhoto")}</Text></SecondaryButton></View></Card>}
    <Card><View style={{ gap: 12 }}><Label>{copy("scan.contextLabel")}</Label>{contextFields.map((field) => <View key={field.key} style={{ gap: 6 }}><Text className="text-sm font-semibold text-foreground">{copy(field.labelKey)}</Text><TextInput editable={!saving && !cancelling} accessibilityLabel={copy(field.labelKey)} accessibilityHint={saving || cancelling ? copy("scan.contextBusyHint") : copy("scan.contextEditHint")} accessibilityState={{ disabled: saving || cancelling }} placeholder={copy(field.placeholderKey)} placeholderTextColor="#8B948D" multiline={field.key === "visibleNotes"} value={notes[field.key] ?? ""} onChangeText={(value) => setNotes((current) => ({ ...current, [field.key]: value }))} style={{ minHeight: field.key === "visibleNotes" ? 76 : 48, borderWidth: 1, borderColor: "#E6DED3", borderRadius: 14, padding: 14, textAlignVertical: field.key === "visibleNotes" ? "top" : "center", color: "#24322C", backgroundColor: saving || cancelling ? "#F2EEE7" : "#FFFDF9" }} /></View>)}<Text className="text-xs leading-4 text-muted">{copy("scan.contextDisclaimer")}</Text></View></Card>
    {analysisState.status !== "idle" && analysisState.status !== "success" ? <Card tone={analysisState.status === "error" ? "amber" : "sage"}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityHint={analysisStatusAccessibilityHint(analysisState)} className="text-sm leading-5 text-foreground">{localizedAnalysisStatus(analysisState)}</Text>{localizedAttemptLabel(analysisState) ? <Text accessibilityRole="text" className="mt-2 text-xs leading-4 text-muted">{localizedAttemptLabel(analysisState)}</Text> : null}{analysisState.status === "uploading" || analysisState.status === "analyzing" ? <SecondaryButton disabled={cancelling} accessibilityLabel={cancelling ? copy("scan.savingDraft") : copy("scan.cancel")} accessibilityHint={copy("scan.cancelHint")} accessibilityState={{ disabled: cancelling, busy: cancelling }} onPress={() => void cancelAnalysis()} style={{ marginTop: 12, opacity: cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{cancelling ? copy("scan.savingDraft") : copy("scan.cancel")}</Text></SecondaryButton> : null}{analysisState.status === "error" ? <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}><SecondaryButton disabled={cancelling} accessibilityLabel={copy("scan.retry")} accessibilityHint={copy("scan.retryHint")} accessibilityState={{ disabled: cancelling }} onPress={finish} style={{ flex: 1, opacity: cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{copy("scan.retry")}</Text></SecondaryButton><SecondaryButton disabled={cancelling} accessibilityLabel={copy("scan.dismiss")} accessibilityHint={copy("scan.dismissHint")} accessibilityState={{ disabled: cancelling, busy: cancelling }} onPress={() => void cancelAnalysis()} style={{ flex: 1, opacity: cancelling ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{cancelling ? copy("scan.savingDraft") : copy("scan.dismiss")}</Text></SecondaryButton></View> : null}</Card> : null}
    <PrimaryButton accessibilityLabel={review ? copy("scan.saveObservation") : copy("scan.reviewScan")} accessibilityHint={review ? copy("scan.saveHint") : copy("scan.reviewHint")} disabled={!image || saving || cancelling} onPress={() => image && (review ? finish() : setReview(true))} style={{ opacity: image && !saving && !cancelling ? 1 : 0.45 }}><Text className="font-bold text-white">{saving ? localizedAnalysisStatus(analysisState) : review ? copy("scan.saveObservation") : copy("scan.reviewScan")}</Text></PrimaryButton>
    {review ? <Card tone="amber"><Text className="text-sm leading-5 text-foreground">{copy("scan.reviewSafetyNotice")}</Text></Card> : null}
    <SafeBackButton label={copy("scan.cancel")} hint={copy("scan.cancelNavigationHint")} busyLabel={copy("scan.opening")} />
  </ScrollView></ScreenContainer>;
}
