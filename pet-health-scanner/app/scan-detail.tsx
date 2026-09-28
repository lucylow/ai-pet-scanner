import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { SafeBackButton } from "@/components/safe-back-button";
import { SafeRouteButton } from "@/components/safe-route-button";
import { AsyncActionStatus, Card, SecondaryButton, SectionTitle, StatusPill } from "@/components/pet-ui";
import { shareScanSummary } from "@/lib/share-summary";
import { loadScansSafely, safeRemoteAnalysis, saveScans, type ScanResult } from "@/lib/pet-health";
import { deletionNavigationFailureMessage, navigationFailureMessage } from "@/lib/navigation-recovery";
import { useTranslation } from "react-i18next";
import { ENGLISH_CORE_COPY, bodyAreaCopyKeys, localizedAnalysisQualityReason } from "@/lib/i18n-language";
import { providerCopyKey } from "@/lib/provider-result-copy";
import { useLanguage } from "@/lib/language-provider";
import { formatLocalizedDateTime } from "@/lib/localized-formatting";

const qualityIssueCopyKeys = {
  "too-small": "detail.issueTooSmall",
  "too-dark": "detail.issueTooDark",
  "too-bright": "detail.issueTooBright",
  blurred: "detail.issueBlurred",
  obstructed: "detail.issueObstructed",
} as const satisfies Record<string, keyof typeof ENGLISH_CORE_COPY>;

const overallCopyKeys = {
  normal: "detail.overallNormal",
  watch: "detail.overallWatch",
  "prompt-vet": "detail.overallPromptVet",
  urgent: "detail.overallUrgent",
} as const satisfies Record<string, keyof typeof ENGLISH_CORE_COPY>;

const severityCopyKeys = {
  normal: "detail.severityNormal",
  watch: "detail.severityWatch",
  "prompt-vet": "detail.severityPromptVet",
  urgent: "detail.severityUrgent",
} as const satisfies Record<string, keyof typeof ENGLISH_CORE_COPY>;

export default function ScanDetailScreen() {
  const { scanId } = useLocalSearchParams<{ scanId?: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
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
  const copy = useCallback((key: keyof typeof ENGLISH_CORE_COPY, options?: Record<string, string>) => t(key, { defaultValue: ENGLISH_CORE_COPY[key], ...options }), [t]);
  const localizedQualityIssue = useCallback((issue: string) => {
    const key = providerCopyKey(issue, qualityIssueCopyKeys);
    return key ? copy(key) : issue;
  }, [copy]);
  const localizedOverall = useCallback((overall: string) => {
    const key = providerCopyKey(overall, overallCopyKeys);
    return key ? copy(key) : overall;
  }, [copy]);
  const localizedFindingSeverity = useCallback((severity: string) => {
    const key = providerCopyKey(severity, severityCopyKeys);
    return key ? copy(key) : severity;
  }, [copy]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionStatusType, setActionStatusType] = useState<"success" | "error">("success");
  const [actionBusy, setActionBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const refreshingRef = useRef(true);
  const refresh = useCallback(async () => { if (refreshingRef.current) return; refreshingRef.current = true; setRefreshing(true); try { setLoadError(false); setStorageUnavailable(false); const result = await loadScansSafely(); setStorageUnavailable(result.storageError); if (result.storageError) return; setScan(result.scans.find((item) => item.id === scanId) ?? null); } catch { setLoadError(true); } finally { refreshingRef.current = false; setRefreshing(false); } }, [scanId]);
  useEffect(() => { refreshingRef.current = false; void refresh(); }, [refresh]);
  const share = async () => { if (!scan || actionBusy) return; setActionBusy(true); setActionStatus(null); try { await shareScanSummary(scan, summaryLabels); setActionStatusType("success"); setActionStatus(copy("detail.shareReady")); } catch { setActionStatusType("error"); setActionStatus(copy("detail.shareUnavailable")); } finally { setActionBusy(false); } };
  const reviewVisitSummary = async () => { if (!scan) return; setActionStatus(null); try { await router.push({ pathname: "/visit-summary", params: { scanId: scan.id } } as never); } catch { setActionStatusType("error"); setActionStatus(navigationFailureMessage); } };
  const remove = () => { if (actionBusy) return; Alert.alert(copy("detail.deleteConfirmTitle"), copy("detail.deleteConfirmBody"), [{ text: copy("detail.cancel"), style: "cancel" }, { text: copy("detail.deleteObservation"), style: "destructive", onPress: async () => { if (!scan) return; setActionBusy(true); setActionStatus(null); try { const current = await loadScansSafely(); if (current.storageError) throw new Error("scan storage unavailable"); await saveScans(current.scans.filter((item) => item.id !== scan.id)); setActionStatusType("success"); try { await router.replace("/history" as never); } catch { setActionStatusType("error"); setActionStatus(deletionNavigationFailureMessage); } } catch { setActionStatusType("error"); setActionStatus(copy("detail.deleteError")); } finally { setActionBusy(false); } } }]); };
  if (loadError) return <ScreenContainer className="px-5 pt-5"><Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-lg font-bold text-foreground">{copy("detail.loadErrorTitle")}</Text><Text className="mt-2 text-sm leading-5 text-muted">{copy("detail.loadErrorBody")}</Text><SecondaryButton disabled={refreshing} accessibilityLabel={copy("detail.retryLoading")} accessibilityHint={copy("detail.retryLoadingHint")} accessibilityState={{ disabled: refreshing, busy: refreshing }} onPress={refresh} style={{ marginTop: 14, opacity: refreshing ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{refreshing ? copy("detail.working") : copy("history.retry")}</Text></SecondaryButton><SafeRouteButton path="/history" label={copy("detail.goHistory")} style={{ marginTop: 10 }} /></Card></ScreenContainer>;
  if (!scan) return <ScreenContainer className="px-5 pt-5"><Card tone={storageUnavailable ? "amber" : "surface"}><Text accessibilityRole={storageUnavailable ? "alert" : undefined} accessibilityLiveRegion={storageUnavailable ? "polite" : undefined} className="text-lg font-bold text-foreground">{storageUnavailable ? copy("detail.loadErrorTitle") : copy("detail.notFoundTitle")}</Text><Text className="mt-2 text-sm leading-5 text-muted">{storageUnavailable ? copy("detail.loadErrorBody") : copy("detail.notFoundBody")}</Text>{storageUnavailable ? <SecondaryButton disabled={refreshing} accessibilityLabel={copy("detail.retryLoading")} accessibilityHint={copy("detail.retryLoadingHint")} accessibilityState={{ disabled: refreshing, busy: refreshing }} onPress={refresh} style={{ marginTop: 14, opacity: refreshing ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{refreshing ? copy("detail.working") : copy("history.retry")}</Text></SecondaryButton> : null}<SafeBackButton label={copy("detail.goBack")} /></Card></ScreenContainer>;
  const statusTone = scan.status === "urgent-review" ? "coral" : scan.status === "needs-review" ? "amber" : "sage";
  const outcomeLabel = scan.status === "observation" ? copy("detail.observationOnly") : scan.status === "needs-review" ? copy("detail.reviewPhotoContext") : copy("detail.contactVetPromptly");
  const remoteAnalysis = safeRemoteAnalysis(scan);
  const formattedCreatedAt = formatLocalizedDateTime(scan.createdAt, language, copy("detail.dateUnavailable"));
  const formattedGeneratedAt = remoteAnalysis ? formatLocalizedDateTime(remoteAnalysis.generatedAt, language, copy("detail.dateUnavailable")) : copy("detail.dateUnavailable");
  const qualityReasonCopy = remoteAnalysis ? localizedAnalysisQualityReason(language, remoteAnalysis.qualityReason ?? (!remoteAnalysis.imageQuality.usable ? "unusable-image" : undefined)) : null;
  return <ScreenContainer className="px-5 pt-5"><ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 30 }}><SectionTitle eyebrow={copy("detail.savedEyebrow")}>{scan.petName} · {copy(bodyAreaCopyKeys[scan.bodyArea])}</SectionTitle><Text className="text-sm text-muted">{formattedCreatedAt}</Text><Image source={{ uri: scan.imageUri }} style={{ width: "100%", height: 260, borderRadius: 20, backgroundColor: "#E6DED3" }} resizeMode="cover" /><View accessible accessibilityLabel={copy("detail.outcomeAccessibility", { petName: scan.petName, outcome: outcomeLabel })} accessibilityRole="text"><StatusPill tone={statusTone}>{outcomeLabel}</StatusPill></View><Card><View accessibilityRole="summary" accessibilityLabel={copy("detail.observationSummaryLabel", { status: outcomeLabel, quality: scan.quality === "good" ? copy("detail.qualityUsable") : copy("detail.qualityLimited"), source: remoteAnalysis ? copy("detail.sourceValidated") : copy("detail.sourceLocal") })} style={{ gap: 8 }}><Text className="text-lg font-bold text-foreground">{copy("detail.atGlance")}</Text><Text className="text-sm leading-5 text-muted">{outcomeLabel} · {scan.quality === "good" ? copy("detail.qualityUsable") : copy("detail.qualityLimited")}</Text><Text className="text-sm leading-5 text-muted">{remoteAnalysis ? copy("detail.sourceValidated") : copy("detail.sourceLocal")}</Text><Text className="text-xs leading-4 text-muted">{copy("detail.observationAid")}</Text></View></Card><Card tone={scan.status === "urgent-review" ? "amber" : "surface"}><View style={{ gap: 10 }}><Text className="text-lg font-bold text-foreground">{copy("detail.summaryHeading")}</Text><Text className="text-sm leading-5 text-muted">{scan.summary}</Text></View></Card><Card><View style={{ gap: 8 }}><Text className="text-lg font-bold text-foreground">{copy("detail.observedHeading")}</Text>{scan.observations.map((item) => <Text key={item} className="text-sm leading-5 text-muted">• {item}</Text>)}</View></Card><Card><View style={{ gap: 8 }}><Text className="text-lg font-bold text-foreground">{copy("detail.nextStepsHeading")}</Text>{scan.nextSteps.map((item) => <Text key={item} className="text-sm leading-5 text-muted">• {item}</Text>)}</View></Card>{remoteAnalysis ? <Card tone={remoteAnalysis.emergencyWarning || remoteAnalysis.overall === "urgent" ? "amber" : "sage"}><View style={{ gap: 8 }}><Text className="text-lg font-bold text-foreground">{copy("detail.serverReviewHeading")}</Text><Text accessibilityLiveRegion="polite" className="text-sm leading-5 text-muted">{copy("detail.reviewMetadata", { version: String(remoteAnalysis.version), confidence: remoteAnalysis.confidence === "low" ? copy("detail.confidenceLow") : remoteAnalysis.confidence === "medium" ? copy("detail.confidenceMedium") : copy("detail.confidenceHigh"), generated: formattedGeneratedAt })}</Text>{qualityReasonCopy ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" className="text-sm leading-5 text-foreground">{qualityReasonCopy}</Text> : null}<Text className="text-sm leading-5 text-foreground">{copy("detail.reviewOverall", { overall: localizedOverall(remoteAnalysis.overall) })}</Text>{remoteAnalysis.findings.length > 0 ? <View style={{ gap: 6 }}>{remoteAnalysis.findings.map((finding, index) => <Text key={`${finding.label}-${index}`} accessible accessibilityRole="text" accessibilityLabel={copy("detail.findingAccessibility", { label: finding.label, severity: localizedFindingSeverity(finding.severity), evidence: finding.evidence.join(" "), limitations: finding.limitations.join(" ") })} className="text-sm leading-5 text-muted">{finding.label} · {copy("detail.findingSeverity", { severity: localizedFindingSeverity(finding.severity) })}</Text>)}</View> : null}{remoteAnalysis.imageQuality.issues.length > 0 ? <Text className="text-sm leading-5 text-foreground">{copy("detail.imageLimits", { issues: remoteAnalysis.imageQuality.issues.map(localizedQualityIssue).join(" ") })}</Text> : null}<Text className="text-xs leading-4 text-muted">{copy("detail.serverReviewLimit")}</Text></View></Card> : <Card tone="sage"><Text className="text-sm leading-5 text-foreground">{copy("detail.savedObservation")}</Text></Card>}
      <Card tone="amber"><Text className="text-sm leading-5 text-foreground">{copy("detail.safetyNotice")}</Text></Card>{actionStatus ? <AsyncActionStatus status={actionStatusType} message={actionStatus} /> : null}<SecondaryButton disabled={actionBusy} accessibilityLabel={copy("detail.shareAccessibility", { petName: scan.petName })} accessibilityHint={copy("detail.shareHint")} accessibilityState={{ disabled: actionBusy, busy: actionBusy }} onPress={share} style={{ opacity: actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{actionBusy ? copy("detail.working") : copy("detail.shareSummary")}</Text></SecondaryButton><SecondaryButton accessibilityLabel={copy("detail.visitAccessibility", { petName: scan.petName })} accessibilityHint={copy("detail.visitHint")} onPress={() => void reviewVisitSummary()}><Text className="font-semibold text-foreground">{copy("detail.prepareVisit")}</Text></SecondaryButton><SecondaryButton disabled={actionBusy} accessibilityLabel={copy("detail.deleteAccessibility", { petName: scan.petName })} accessibilityHint={copy("detail.deleteHint")} accessibilityState={{ disabled: actionBusy, busy: actionBusy }} onPress={remove} style={{ opacity: actionBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{copy("detail.deleteObservation")}</Text></SecondaryButton><SafeBackButton label={copy("detail.done")} /></ScrollView></ScreenContainer>;
}
