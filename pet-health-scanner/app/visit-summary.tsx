import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Image, Linking, ScrollView, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AsyncActionStatus, Card, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/pet-ui";
import { SafeBackButton } from "@/components/safe-back-button";
import { formatVeterinaryVisitSummary, reviewedSummaryCopyFailure, reviewedSummaryCopySuccess, reviewedSummaryReconnectResetCopy, reviewedSummaryShareActionLabel, reviewedSummaryShareAttemptLabel, reviewedSummaryShareFailureCopy, reviewedSummaryFinalConfirmationCopy, reviewedSummaryPhotoMediaBoundaryCopy, reviewedSummaryOptionalSectionsExcludedCopy, reviewedSummarySelectionCopy, reviewedSummaryShareSuccess, reviewedSummaryShareMaxAttempts } from "@/lib/share-summary-format";
import { shareVeterinaryVisitSummary } from "@/lib/share-summary";
import { loadScansSafely, type ScanResult } from "@/lib/pet-health";
import { useNetworkAwareness } from "@/hooks/use-network-awareness";
import { useTranslation } from "react-i18next";
import { connectionIndicatorCopy, connectionLastCheckedCopy } from "@/lib/network-awareness";
import { mediaActionDisabled, mediaCancelledCopy, mediaPermissionRecoveryCopy, mediaPickerActionHint, mediaPickerActionLabel, mediaSettingsOpenFailureCopy, mediaSettingsOpenedCopy, mediaShareActionHint, mediaShareActionLabel, mediaShareFailureCopy, mediaUnavailableCopy, pendingMediaRecoveryFailureCopy } from "@/lib/media-sharing";

export default function VisitSummaryScreen() {
  const { scanId } = useLocalSearchParams<{ scanId?: string }>();
  const network = useNetworkAwareness();
  const { t } = useTranslation();
  const summaryLabels = useMemo(() => ({
    visitTitle: t("summary.visitTitle"),
    observationTitle: t("summary.observationTitle"),
    area: t("summary.area"),
    areaValues: { skin: t("summary.areaSkin"), eyes: t("summary.areaEyes"), teeth: t("summary.areaTeeth"), ears: t("summary.areaEars"), paws: t("summary.areaPaws"), other: t("summary.areaOther") },
    date: t("summary.date"),
    outcome: t("summary.outcome"),
    outcomeObservation: t("summary.outcomeObservation"),
    outcomeReview: t("summary.outcomeReview"),
    outcomeUrgent: t("summary.outcomeUrgent"),
    imageQuality: t("summary.imageQuality"),
    usable: t("summary.usable"),
    limited: t("summary.limited"),
    photoReference: t("summary.photoReference"),
    observed: t("summary.observed"),
    caregiverNotes: t("summary.caregiverNotes"),
    contextFields: { onset: t("summary.contextOnset"), changing: t("summary.contextChanging"), behavior: t("summary.contextBehavior"), appetite: t("summary.contextAppetite"), visibleNotes: t("summary.contextVisibleNotes") },
    nextSteps: t("summary.nextSteps"),
    visitDisclaimer: t("summary.visitDisclaimer"),
    observationDisclaimer: t("summary.observationDisclaimer"),
  }), [t]);
  const connectionCopy = connectionIndicatorCopy(network.isChecking ? "checking" : network.isOffline ? "offline" : "online");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [includeCaregiverNotes, setIncludeCaregiverNotes] = useState(true);
  const [includePhotoReference, setIncludePhotoReference] = useState(true);
  const [includeObservations, setIncludeObservations] = useState(true);
  const [summary, setSummary] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionStatusType, setActionStatusType] = useState<"success" | "error">("success");
  const [copyStatusType, setCopyStatusType] = useState<"success" | "error">("success");
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [photoPermissionNeedsSettings, setPhotoPermissionNeedsSettings] = useState(false);
  const [cameraPermissionNeedsSettings, setCameraPermissionNeedsSettings] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoSharingAvailable, setPhotoSharingAvailable] = useState<boolean | null>(null);
  const [photoAvailabilityChecking, setPhotoAvailabilityChecking] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmingShare, setConfirmingShare] = useState(false);
  const [photoBoundaryAcknowledged, setPhotoBoundaryAcknowledged] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const [shareAttempt, setShareAttempt] = useState(0);
  const [shareStopped, setShareStopped] = useState(false);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousOffline = useRef(network.isOffline);
  const loadInFlight = useRef(false);
  const pendingPhotoRecoveryInFlight = useRef(false);
  const photoAvailabilityCheckingRef = useRef(false);

  const announceTemporarily = (message: string, type: "success" | "error" = "success") => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setActionStatusType(type);
    setActionStatus(message);
    statusTimer.current = setTimeout(() => setActionStatus(null), 4000);
  };

  useEffect(() => () => { if (statusTimer.current) clearTimeout(statusTimer.current); }, []);

  const checkPhotoSharingAvailability = useCallback(async () => {
    if (photoAvailabilityCheckingRef.current) return;
    photoAvailabilityCheckingRef.current = true;
    setPhotoAvailabilityChecking(true);
    try {
      const available = await Sharing.isAvailableAsync();
      setPhotoSharingAvailable(available);
      if (available) announceTemporarily("Photo sharing is available on this device.");
      else announceTemporarily("Photo sharing is unavailable on this device. Text-only sharing remains available.", "error");
    } catch {
      setPhotoSharingAvailable(false);
      announceTemporarily("Photo sharing availability could not be checked. Text-only sharing remains available.", "error");
    } finally {
      photoAvailabilityCheckingRef.current = false;
      setPhotoAvailabilityChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkPhotoSharingAvailability();
  }, [checkPhotoSharingAvailability]);

  useEffect(() => {
    let mounted = true;
    const recoverPendingPhoto = async () => {
      if (pendingPhotoRecoveryInFlight.current) return;
      pendingPhotoRecoveryInFlight.current = true;
      try {
        const pending = await ImagePicker.getPendingResultAsync();
        if (!mounted || !pending || !("canceled" in pending) || pending.canceled || !("assets" in pending)) return;
        const uri = pending.assets[0]?.uri;
        if (uri) {
          setSelectedPhotoUri(uri);
          announceTemporarily("A pending photo selection was restored. It will be shared only when you choose Share photo.");
        }
      } catch {
        if (mounted) announceTemporarily(pendingMediaRecoveryFailureCopy(), "error");
      } finally {
        pendingPhotoRecoveryInFlight.current = false;
      }
    };
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void recoverPendingPhoto(); });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    const wasOffline = previousOffline.current;
    if (wasOffline && !network.isOffline && shareStopped) {
      setShareAttempt(0);
      setShareFailed(false);
      setShareStopped(false);
      announceTemporarily(reviewedSummaryReconnectResetCopy);
    }
    previousOffline.current = network.isOffline;
  }, [network.isOffline, shareStopped]);

  const load = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    setLoading(true);
    setLoadError(false);
    setStorageUnavailable(false);
    try {
      const scanResult = await loadScansSafely();
      setStorageUnavailable(scanResult.storageError);
      if (scanResult.storageError) return;
      const found = scanResult.scans.find((item) => item.id === scanId) ?? null;
      setScan(found);
      if (found) setSummary(formatVeterinaryVisitSummary(found, {}, summaryLabels));
    } catch {
      setLoadError(true);
    } finally {
      loadInFlight.current = false;
      setLoading(false);
    }
  }, [scanId, summaryLabels]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (scan) setSummary(formatVeterinaryVisitSummary(scan, { includeCaregiverNotes, includePhotoReference, includeObservations }, summaryLabels));
  }, [includeCaregiverNotes, includePhotoReference, includeObservations, scan, summaryLabels]);

  const share = async () => {
    if (!scan || actionBusy || shareStopped) return;
    if (!confirmingShare) {
      setConfirmingShare(true);
      announceTemporarily("Review the selected sections, then confirm sharing when ready.");
      return;
    }
    if (confirmingShare && !photoBoundaryAcknowledged) {
      announceTemporarily("Acknowledge that this text-only share does not attach the saved photo before continuing.");
      return;
    }
    const nextAttempt = shareAttempt + 1;
    setShareAttempt(nextAttempt);
    setActionBusy(true);
    try {
      await shareVeterinaryVisitSummary({ ...scan, context: includeCaregiverNotes ? scan.context : {} }, summary);
      setShareFailed(false);
      setActionStatusType("success");
      setShareAttempt(0);
      setShareStopped(false);
      announceTemporarily(reviewedSummaryShareSuccess);
      setConfirmingShare(false);
    } catch {
      setShareFailed(true);
      setActionStatusType("error");
      if (nextAttempt >= reviewedSummaryShareMaxAttempts) setShareStopped(true);
      announceTemporarily(reviewedSummaryShareFailureCopy(network.isOffline), "error");
    } finally {
      setActionBusy(false);
    }
  };

  const excludeAllOptionalSections = () => {
    setIncludeCaregiverNotes(false);
    setIncludePhotoReference(false);
    setIncludeObservations(false);
    announceTemporarily(reviewedSummaryOptionalSectionsExcludedCopy);
  };

  const resetSharingOptions = () => {
    setIncludeCaregiverNotes(true);
    setIncludePhotoReference(true);
    setIncludeObservations(true);
    announceTemporarily("Sharing options restored to defaults. Your edited summary text remains available.");
  };

  const refreshConnection = async () => {
    if (network.isRefreshing) return;
    announceTemporarily("Checking connection…");
    try {
      await network.refresh();
      announceTemporarily("Connection check finished. Your edited summary is unchanged.");
    } catch {
      announceTemporarily("Connection check was unavailable. Your edited summary remains on this screen.", "error");
    }
  };

  const choosePhoto = async () => {
    if (photoBusy || actionBusy) return;
    setPhotoBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoPermissionNeedsSettings(permission.canAskAgain === false);
        announceTemporarily(mediaPermissionRecoveryCopy("photo library", permission.canAskAgain !== false), "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.85 });
      if (result.canceled) {
        announceTemporarily(mediaCancelledCopy("photo library"));
        return;
      }
      const uri = result.assets[0]?.uri;
      if (!uri) {
        announceTemporarily("No usable photo was selected. Text-only sharing remains available.", "error");
        return;
      }
      setPhotoPermissionNeedsSettings(false);
      setSelectedPhotoUri(uri);
      announceTemporarily("Photo selected. It will be shared only when you choose Share selected photo.");
    } catch {
      announceTemporarily(mediaUnavailableCopy("photo library"), "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const capturePhoto = async () => {
    if (photoBusy || actionBusy) return;
    setPhotoBusy(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setCameraPermissionNeedsSettings(permission.canAskAgain === false);
        announceTemporarily(mediaPermissionRecoveryCopy("camera", permission.canAskAgain !== false), "error");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 });
      if (result.canceled) {
        announceTemporarily(mediaCancelledCopy("camera"));
        return;
      }
      const uri = result.assets[0]?.uri;
      if (!uri) {
        announceTemporarily("The camera did not return a usable photo. Text-only sharing remains available.", "error");
        return;
      }
      setCameraPermissionNeedsSettings(false);
      setSelectedPhotoUri(uri);
      announceTemporarily("Photo captured. It will be shared only when you choose Share photo.");
    } catch {
      announceTemporarily(mediaUnavailableCopy("camera"), "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const openPhotoSettings = async () => {
    if (photoBusy || actionBusy) return;
    setPhotoBusy(true);
    try {
      await Linking.openSettings();
      announceTemporarily(mediaSettingsOpenedCopy());
    } catch {
      announceTemporarily(mediaSettingsOpenFailureCopy(), "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const shareSelectedPhoto = async () => {
    if (!selectedPhotoUri || photoBusy || actionBusy) return;
    setPhotoBusy(true);
    try {
      const available = photoSharingAvailable === true ? true : await Sharing.isAvailableAsync();
      if (!available) {
        setPhotoSharingAvailable(false);
        announceTemporarily("Photo sharing is unavailable on this device. Text-only sharing remains available.", "error");
        return;
      }
      setPhotoSharingAvailable(true);
      await Sharing.shareAsync(selectedPhotoUri, { dialogTitle: "Share selected pet photo" });
      announceTemporarily("The selected photo is ready in the system share sheet.");
    } catch {
      announceTemporarily(mediaShareFailureCopy(), "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const copySummary = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const copied = await Clipboard.setStringAsync(summary);
      const message = copied === false ? "Clipboard permission was not granted. You can still use Share reviewed summary." : reviewedSummaryCopySuccess;
      setCopyStatusType(copied === false ? "error" : "success");
      setCopyStatus(message);
      announceTemporarily(message);
    } catch {
      const message = reviewedSummaryCopyFailure;
      setCopyStatusType("error");
      setCopyStatus(message);
      announceTemporarily(message);
    } finally {
      setActionBusy(false);
    }
  };

  if (loadError) return <ScreenContainer className="px-5 pt-5"><Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-lg font-bold text-foreground">Visit summary could not be loaded</Text><Text className="mt-2 text-sm leading-5 text-muted">Your saved observation was not changed. Try again to read it from local storage, or return to the observation.</Text><SecondaryButton disabled={loading} accessibilityLabel="Retry loading visit summary" accessibilityHint="Reads the saved observation again without changing local data" accessibilityState={{ disabled: loading, busy: loading }} onPress={load} style={{ marginTop: 14, opacity: loading ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{loading ? "Loading…" : "Try again"}</Text></SecondaryButton><SafeBackButton label="Done" /></Card></ScreenContainer>;
  if (!scan) return <ScreenContainer className="px-5 pt-5"><Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-lg font-bold text-foreground">{storageUnavailable ? t("detail.loadErrorTitle", { defaultValue: "Visit summary could not be loaded" }) : t("detail.notFoundTitle", { defaultValue: "Observation not found" })}</Text><Text className="mt-2 text-sm leading-5 text-muted">{storageUnavailable ? t("detail.loadErrorBody", { defaultValue: "Your saved observation was not changed. Try again to read it from local storage." }) : t("detail.notFoundBody", { defaultValue: "The saved observation could not be found on this device." })}</Text>{storageUnavailable ? <SecondaryButton disabled={loading} accessibilityLabel={loading ? "Loading visit summary" : "Retry loading visit summary"} accessibilityHint="Reads the saved observation again without changing local data" accessibilityState={{ disabled: loading, busy: loading }} onPress={load} style={{ marginTop: 14, opacity: loading ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{loading ? "Loading…" : "Try again"}</Text></SecondaryButton> : null}<SafeBackButton label="Done" /></Card></ScreenContainer>;

  return <ScreenContainer className="px-5 pt-5"><ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 30 }}><SectionTitle eyebrow="Review before sharing">Veterinary visit summary</SectionTitle><Card tone="amber"><Text accessibilityRole="text" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">Review the text before sharing. It contains observation notes, not a diagnosis, and never includes private storage URLs or object keys.</Text></Card><Card tone="sage"><Text accessibilityRole="text" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{reviewedSummarySelectionCopy({ includeCaregiverNotes, includePhotoReference, includeObservations })}</Text></Card><SecondaryButton accessibilityRole="checkbox" accessibilityLabel="Include caregiver notes" accessibilityHint="Adds or removes the notes you entered while creating the observation" accessibilityState={{ checked: includeCaregiverNotes }} onPress={() => setIncludeCaregiverNotes((value) => !value)}><Text className="font-semibold text-foreground">{includeCaregiverNotes ? "✓ Include caregiver notes" : "Include caregiver notes"}</Text></SecondaryButton><SecondaryButton accessibilityRole="checkbox" accessibilityLabel="Include photo reference" accessibilityHint="Adds or removes the plain-language note that a saved image was used; it never shares private storage metadata" accessibilityState={{ checked: includePhotoReference }} onPress={() => setIncludePhotoReference((value) => !value)}><Text className="font-semibold text-foreground">{includePhotoReference ? "✓ Include photo reference" : "Include photo reference"}</Text></SecondaryButton><SecondaryButton accessibilityRole="checkbox" accessibilityLabel="Include observed details" accessibilityHint="Adds or removes the visible observation details while keeping next steps and the safety disclaimer" accessibilityState={{ checked: includeObservations }} onPress={() => setIncludeObservations((value) => !value)}><Text className="font-semibold text-foreground">{includeObservations ? "✓ Include observed details" : "Include observed details"}</Text></SecondaryButton><SecondaryButton accessibilityLabel="Exclude all optional sections" accessibilityHint="Removes caregiver notes, photo reference, and observed details while keeping next steps and the safety disclaimer" onPress={excludeAllOptionalSections}><Text className="font-semibold text-foreground">Exclude all optional sections</Text></SecondaryButton><SecondaryButton accessibilityLabel="Reset sharing options" accessibilityHint="Restores caregiver notes, photo reference, and observed details without deleting or clearing the reviewed summary text" onPress={resetSharingOptions}><Text className="font-semibold text-foreground">Reset sharing options</Text></SecondaryButton><Card tone={network.isOffline || network.refreshError ? "amber" : "sage"}><Text accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={`${connectionCopy.label}. ${connectionCopy.hint}. ${connectionLastCheckedCopy(network.lastCheckedAt, Date.now(), network.isRefreshing)}`} className="text-sm leading-5 text-foreground">{connectionCopy.label} · {connectionLastCheckedCopy(network.lastCheckedAt, Date.now(), network.isRefreshing)}</Text>{network.refreshError ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="mt-2 text-sm leading-5 text-foreground">The connection check could not finish. Your edited summary and sharing choices are unchanged; try again when ready.</Text> : null}<SecondaryButton disabled={network.isRefreshing} accessibilityLabel={network.isRefreshing ? "Checking connection" : "Check connection again"} accessibilityHint="Refreshes the device connection status without changing the reviewed summary text" accessibilityState={{ disabled: network.isRefreshing, busy: network.isRefreshing }} onPress={refreshConnection} style={{ marginTop: 10, opacity: network.isRefreshing ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{network.isRefreshing ? "Checking…" : "Check connection again"}</Text></SecondaryButton></Card><TextInput accessibilityLabel="Editable veterinary visit summary" accessibilityHint="Review or edit the text before sharing" multiline value={summary} onChangeText={setSummary} style={{ minHeight: 360, borderWidth: 1, borderColor: "#E6DED3", borderRadius: 16, padding: 16, textAlignVertical: "top", color: "#24322C", backgroundColor: "#FFFDF9", lineHeight: 21 }} /><Card tone="sage"><View style={{ gap: 10 }}><Text className="text-lg font-bold text-foreground">Optional photo attachment</Text><Text className="text-sm leading-5 text-foreground">The reviewed summary remains text-only. You may separately choose and share a photo after granting explicit photo-library permission. No private storage metadata is included.</Text>{selectedPhotoUri ? <Image source={{ uri: selectedPhotoUri }} accessibilityLabel="Selected photo for optional separate sharing" style={{ width: "100%", height: 180, borderRadius: 16, backgroundColor: "#E6DED3" }} resizeMode="cover" /> : null}<SecondaryButton disabled={mediaActionDisabled(photoBusy, actionBusy)} accessibilityLabel={mediaPickerActionLabel("library", photoBusy, Boolean(selectedPhotoUri))} accessibilityHint={mediaPickerActionHint("library")} accessibilityState={{ disabled: mediaActionDisabled(photoBusy, actionBusy), busy: photoBusy }} onPress={() => void choosePhoto()} style={{ opacity: photoBusy || actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{photoBusy ? "Preparing…" : selectedPhotoUri ? "Choose a different photo" : "Choose photo"}</Text></SecondaryButton>{photoPermissionNeedsSettings || cameraPermissionNeedsSettings ? <SecondaryButton disabled={photoBusy || actionBusy} accessibilityLabel="Open device settings for photo access" accessibilityHint="Opens device settings so you can enable photo access for optional sharing" accessibilityState={{ disabled: mediaActionDisabled(photoBusy, actionBusy), busy: photoBusy }} onPress={() => void openPhotoSettings()} style={{ opacity: photoBusy || actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">Open photo settings</Text></SecondaryButton> : null}<View style={{ flexDirection: "row", gap: 10 }}><SecondaryButton disabled={photoBusy || actionBusy} accessibilityLabel={mediaPickerActionLabel("camera", photoBusy, Boolean(selectedPhotoUri))} accessibilityHint={mediaPickerActionHint("camera")} accessibilityState={{ disabled: mediaActionDisabled(photoBusy, actionBusy), busy: photoBusy }} onPress={() => void capturePhoto()} style={{ flex: 1, opacity: photoBusy || actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">Use camera</Text></SecondaryButton><SecondaryButton disabled={mediaActionDisabled(photoBusy, actionBusy)} accessibilityLabel={mediaPickerActionLabel("library", photoBusy, Boolean(selectedPhotoUri))} accessibilityHint={mediaPickerActionHint("library")} accessibilityState={{ disabled: mediaActionDisabled(photoBusy, actionBusy), busy: photoBusy }} onPress={() => void choosePhoto()} style={{ flex: 1, opacity: photoBusy || actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{photoBusy ? "Preparing…" : selectedPhotoUri ? "Choose different" : "Choose library"}</Text></SecondaryButton></View>{selectedPhotoUri ? <View style={{ flexDirection: "row", gap: 10 }}><SecondaryButton disabled={mediaActionDisabled(photoBusy, actionBusy) || photoSharingAvailable === false} accessibilityLabel={mediaShareActionLabel(photoBusy || photoAvailabilityChecking, Boolean(selectedPhotoUri), photoSharingAvailable !== false)} accessibilityHint={mediaShareActionHint(photoSharingAvailable !== false)} accessibilityState={{ disabled: mediaActionDisabled(photoBusy, actionBusy) || photoSharingAvailable === false, busy: photoBusy || photoAvailabilityChecking }} onPress={() => void shareSelectedPhoto()} style={{ flex: 1, opacity: photoBusy || actionBusy || photoAvailabilityChecking ? 0.55 : 1 }}><Text className="font-semibold text-foreground">Share photo</Text></SecondaryButton>{photoSharingAvailable === false ? <SecondaryButton disabled={photoBusy || actionBusy || photoAvailabilityChecking} accessibilityLabel={photoAvailabilityChecking ? "Checking photo sharing availability" : "Check photo sharing availability again"} accessibilityHint="Checks whether this device can open a photo share sheet without changing the reviewed text" accessibilityState={{ disabled: photoBusy || actionBusy || photoAvailabilityChecking, busy: photoAvailabilityChecking }} onPress={() => void checkPhotoSharingAvailability()} style={{ marginTop: 10, opacity: photoBusy || actionBusy || photoAvailabilityChecking ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{photoAvailabilityChecking ? "Checking photo sharing…" : "Check photo sharing again"}</Text></SecondaryButton> : null}<SecondaryButton disabled={photoBusy || actionBusy} accessibilityLabel="Remove selected photo" accessibilityHint="Removes the selected photo from this screen without deleting the saved observation" accessibilityState={{ disabled: photoBusy || actionBusy }} onPress={() => setSelectedPhotoUri(null)} style={{ flex: 1, opacity: photoBusy || actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">Remove</Text></SecondaryButton></View> : null}</View></Card>{actionStatus ? <AsyncActionStatus status={actionStatusType} message={actionStatus} /> : null}{reviewedSummaryShareAttemptLabel(shareAttempt, shareStopped) ? <Card tone="amber"><Text accessibilityRole="text" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{reviewedSummaryShareAttemptLabel(shareAttempt, shareStopped)}</Text></Card> : null}{confirmingShare ? <Card tone="amber"><Text accessibilityRole="text" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{reviewedSummaryFinalConfirmationCopy}</Text><Text accessibilityRole="text" className="mt-2 text-sm leading-5 text-foreground">{reviewedSummarySelectionCopy({ includeCaregiverNotes, includePhotoReference, includeObservations })}</Text><Text accessibilityRole="text" className="mt-2 text-sm leading-5 text-foreground">{reviewedSummaryPhotoMediaBoundaryCopy}</Text><SecondaryButton accessibilityRole="checkbox" accessibilityLabel="Acknowledge photo media boundary" accessibilityHint="Confirms that this text-only share does not attach the saved photo or expose private media metadata" accessibilityState={{ checked: photoBoundaryAcknowledged }} onPress={() => setPhotoBoundaryAcknowledged((value) => !value)}><Text className="font-semibold text-foreground">{photoBoundaryAcknowledged ? "✓ I understand" : "I understand"}</Text></SecondaryButton><SecondaryButton accessibilityLabel="Confirm and share reviewed summary" accessibilityHint="Opens the native share sheet with the exact text shown above" onPress={share}><Text className="font-semibold text-foreground">Confirm and share</Text></SecondaryButton><SecondaryButton accessibilityLabel="Cancel share confirmation" accessibilityHint="Closes this confirmation without changing the reviewed text or sharing options" onPress={() => setConfirmingShare(false)}><Text className="font-semibold text-foreground">Not yet</Text></SecondaryButton></Card> : null}{copyStatus && copyStatus !== actionStatus ? <AsyncActionStatus status={copyStatusType} message={copyStatus} /> : null}<PrimaryButton disabled={actionBusy} accessibilityLabel={reviewedSummaryShareActionLabel(actionBusy, shareFailed, shareStopped)} accessibilityHint={shareStopped ? "The share limit was reached. Use Copy summary to keep the reviewed text available locally" : shareFailed ? "Retries the share action using the edited text still visible above" : "Opens the device share sheet with the text currently shown above"} accessibilityState={{ disabled: actionBusy || shareStopped, busy: actionBusy }} onPress={share} style={{ opacity: actionBusy ? 0.55 : 1 }}><Text className="font-bold text-white">{reviewedSummaryShareActionLabel(actionBusy, shareFailed, shareStopped)}</Text></PrimaryButton><SecondaryButton disabled={actionBusy} accessibilityLabel="Copy reviewed veterinary visit summary" accessibilityHint="Copies the text currently shown above to the device clipboard" accessibilityState={{ disabled: actionBusy, busy: actionBusy }} onPress={copySummary} style={{ opacity: actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">Copy summary</Text></SecondaryButton><SafeBackButton label="Cancel" /></ScrollView></ScreenContainer>;
}
