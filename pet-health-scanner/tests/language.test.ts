import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ value: null as string | null, readbackOverride: undefined as string | null | undefined }));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => storage.readbackOverride !== undefined ? storage.readbackOverride : storage.value),
    setItem: vi.fn(async (_key: string, value: string) => { storage.value = value; }),
  },
}));

import { ENGLISH_CORE_COPY, initializeLanguage, isLanguageCode, languageDirection, loadLanguage, saveLanguage, formatRecoveredMediaStatus, formatRecoveredMediaSummary, formatRecoveredMediaAccessibilityAnnouncement, LANGUAGE_OPTIONS, i18n } from "../lib/i18n-language";

describe("language preference persistence", () => {
  it("provides recovery-status copy for every supported language", () => {
    for (const option of LANGUAGE_OPTIONS) {
      const copy = formatRecoveredMediaStatus("filtered-and-truncated", option.code);
      expect(copy.length).toBeGreaterThan(0);
      expect(copy).not.toContain("filtered-and-truncated");
    }
  });

  it("keeps Arabic recovery feedback localized and marked RTL", () => {
    expect(LANGUAGE_OPTIONS.find((option) => option.code === "ar")?.rtl).toBe(true);
    expect(formatRecoveredMediaStatus("filtered", "ar")).toContain("تم");
  });

  it("includes localized recovery counts without changing clean copy", () => {
    expect(formatRecoveredMediaStatus("filtered-and-truncated", "en", { rejected: 2, truncated: 1 })).toContain("Skipped attachments: 2.");
    expect(formatRecoveredMediaStatus("filtered-and-truncated", "ar", { rejected: 2, truncated: 1 })).toContain("المرفقات التي تم تخطيها: 2.");
    expect(formatRecoveredMediaStatus("clean", "en", { rejected: 2, truncated: 1 })).toBe("All saved attachments were restored. Skipped attachments: 2. Additional attachments not restored: 1.");
  });

  it("formats a reusable recovery summary with localized counts", () => {
    expect(formatRecoveredMediaSummary({ status: "filtered", restoredCount: 1, rejectedCount: 2, truncatedCount: 0, hasWarnings: true, accessibilityLiveRegion: "polite" }, "ar")).toContain("المرفقات التي تم تخطيها: 2.");
  });

  it("announces partial recovery but stays silent for clean recovery", () => {
    expect(formatRecoveredMediaAccessibilityAnnouncement({ status: "filtered", restoredCount: 1, rejectedCount: 1, truncatedCount: 0, hasWarnings: true, accessibilityLiveRegion: "polite" }, "en")).toContain("Skipped attachments: 1.");
    expect(formatRecoveredMediaAccessibilityAnnouncement({ status: "clean", restoredCount: 1, rejectedCount: 0, truncatedCount: 0, hasWarnings: false, accessibilityLiveRegion: "none" }, "en")).toBe("");
  });

  it("clamps invalid recovery counts to safe display values", () => {
    expect(formatRecoveredMediaStatus("filtered", "en", { rejected: Number.POSITIVE_INFINITY })).toBe("Some saved attachments were skipped because they could not be safely restored.");
    expect(formatRecoveredMediaStatus("filtered", "en", { rejected: -4.8 })).toBe("Some saved attachments were skipped because they could not be safely restored.");
    expect(formatRecoveredMediaStatus("filtered", "en", { rejected: 10000 })).toContain("Skipped attachments: 999.");
  });

  beforeEach(() => {
    storage.value = null;
    storage.readbackOverride = undefined;
  });

  it("maps Arabic to RTL and all other supported languages to LTR", () => {
    expect(languageDirection("ar")).toBe("rtl");
    expect(languageDirection("en")).toBe("ltr");
    expect(languageDirection("ja")).toBe("ltr");
  });

  it("keeps critical Settings feedback available in English", () => {
    expect(ENGLISH_CORE_COPY["settings.offlineSubscription"]).toContain("Offline mode");
    expect(ENGLISH_CORE_COPY["settings.subscriptionLoadError"]).toContain("Subscription status");
    expect(ENGLISH_CORE_COPY["settings.privacy"]).toContain("locally");
    expect(ENGLISH_CORE_COPY["home.activePetSaveError"]).toContain("previous active pet");
    expect(ENGLISH_CORE_COPY["home.historyUnavailableBody"]).toContain("not been deleted");
    expect(ENGLISH_CORE_COPY["home.completedRecoveryTitle"]).toContain("waiting");
    expect(ENGLISH_CORE_COPY["home.openRecovery"]).toContain("recovery");
    expect(ENGLISH_CORE_COPY["history.completedRecoveryBody"]).toContain("stored safely");
    expect(ENGLISH_CORE_COPY["history.openRecovery"]).toContain("Recover");
    expect(ENGLISH_CORE_COPY["scan.photoTooLarge"]).toContain("50 MB");
    expect(ENGLISH_CORE_COPY["scan.unsupportedPhoto"]).toContain("supported photo");
    expect(ENGLISH_CORE_COPY["scan.savedDraftClearError"]).toContain("saved result is safe");
    expect(ENGLISH_CORE_COPY["scan.validatingPhoto"]).toContain("photo");
    expect(ENGLISH_CORE_COPY["scan.savingObservation"]).toContain("Saving");
    expect(ENGLISH_CORE_COPY["scan.offlineDraftNotice"]).toContain("Offline mode");
    expect(ENGLISH_CORE_COPY["scan.connectionInterrupted"]).toContain("connection");
    expect(ENGLISH_CORE_COPY["scan.uploadFailed"]).toContain("upload");
    expect(ENGLISH_CORE_COPY["scan.analysisFailed"]).toContain("AI review");
    expect(ENGLISH_CORE_COPY["scan.localSaveFailed"]).toContain("History");
    expect(ENGLISH_CORE_COPY["scan.cancelled"]).toContain("cancelled");
    expect(ENGLISH_CORE_COPY["scan.draftSaveFailed"]).toContain("draft could not be saved");
    expect(ENGLISH_CORE_COPY["scan.setupLoadErrorBody"]).toContain("was not changed");
    expect(ENGLISH_CORE_COPY["scan.addPetBody"]).toContain("selected pet");
    expect(ENGLISH_CORE_COPY["scan.imageAcceptedObservation"]).toContain("accepted");
    expect(ENGLISH_CORE_COPY["detail.outcomeAccessibility"]).toContain("{{outcome}}");
    expect(ENGLISH_CORE_COPY["detail.shareAccessibility"]).toContain("{{petName}}");
    expect(ENGLISH_CORE_COPY["detail.findingAccessibility"]).toContain("{{evidence}}");
    expect(ENGLISH_CORE_COPY["scan.emergencySummary"]).toContain("emergency warning");
    expect(ENGLISH_CORE_COPY["pets.managePets"]).toBe("Manage pets");
    expect(ENGLISH_CORE_COPY["scan.restoredDraft"]).toContain("unfinished scan");
    expect(ENGLISH_CORE_COPY["scan.retryDraftRemoval"]).toContain("Retry");
    expect(ENGLISH_CORE_COPY["scan.removeDraft"]).toContain("Remove");
    expect(ENGLISH_CORE_COPY["scan.scanBusy"]).toContain("progress");
    expect(ENGLISH_CORE_COPY["scan.retakePhoto"]).toContain("another");
    expect(ENGLISH_CORE_COPY["scan.multiPhotoGuidance"]).toContain("{{max}}");
    expect(ENGLISH_CORE_COPY["scan.photoCount"]).toContain("{{count}}");
    expect(ENGLISH_CORE_COPY["scan.removePhoto"]).toContain("{{index}}");
    expect(ENGLISH_CORE_COPY["scan.photoQualityLimited"]).toContain("limited");
    expect(ENGLISH_CORE_COPY["scan.connectionRestored"]).toContain("Connection restored");
    expect(ENGLISH_CORE_COPY["scan.reviewSafetyNotice"]).toContain("not a diagnosis");
    expect(ENGLISH_CORE_COPY["home.savingSelection"]).toContain("Saving");
    expect(ENGLISH_CORE_COPY["home.retrySelection"]).toContain("selection");
    expect(ENGLISH_CORE_COPY["history.savedAlertBody"]).toContain("local history");
    expect(ENGLISH_CORE_COPY["history.filterError"]).toContain("unchanged");
    expect(ENGLISH_CORE_COPY["history.petFilter"]).toBe("Pet");
    expect(ENGLISH_CORE_COPY["history.allPets"]).toBe("All pets");
    expect(ENGLISH_CORE_COPY["history.statusFilter"]).toBe("Status");
    expect(ENGLISH_CORE_COPY["history.reviewStatus"]).toContain("Review");
    expect(ENGLISH_CORE_COPY["history.emptyTitle"]).toContain("matching");
    expect(ENGLISH_CORE_COPY["settings.deleteConfirmBody"]).toContain("unfinished scan drafts");
    expect(ENGLISH_CORE_COPY["settings.deletePartial"]).toContain("remaining data was not changed");
    expect(ENGLISH_CORE_COPY["settings.subscriptionRetryHint"]).toContain("cached subscription status");
    expect(ENGLISH_CORE_COPY["settings.deleteData"]).toContain("Delete local data");
  });

  it("provides localized critical Scan safety copy for remaining locales", async () => {
    await initializeLanguage();
    for (const code of ["pt", "ja", "zh-Hans", "ar"] as const) {
      await i18n.changeLanguage(code);
      expect(i18n.t("scan.reviewSafetyNotice")).not.toBe(ENGLISH_CORE_COPY["scan.reviewSafetyNotice"]);
      expect(i18n.t("scan.offlineDraftNotice")).not.toBe(ENGLISH_CORE_COPY["scan.offlineDraftNotice"]);
    }
    expect(i18n.language).toBe("ar");
    expect(i18n.t("history.petFilter")).toBe("الحيوان الأليف");
    expect(i18n.t("history.reviewStatus")).toBe("راجع الصورة");
    expect(i18n.t("history.selectedSuffix")).toBe("، محدد");
    expect(i18n.t("home.completedRecoveryTitle")).not.toBe(ENGLISH_CORE_COPY["home.completedRecoveryTitle"]);
    expect(i18n.t("history.completedRecoveryTitle")).not.toBe(ENGLISH_CORE_COPY["history.completedRecoveryTitle"]);
    expect(i18n.t("scan.imageAcceptedObservation")).toBe("تم قبول الصورة لمراجعة بصرية حذرة.");
    expect(i18n.t("scan.multiPhotoGuidance", { max: 4 })).toBe("يمكنك إضافة ما يصل إلى 4 صور لمراجعة بصرية أوسع.");
    expect(i18n.t("scan.photoCount", { count: 2, max: 4 })).toBe("تم اختيار 2 من أصل 4 صور");
    expect(i18n.t("scan.removePhoto", { index: 2 })).toBe("حذف الصورة 2");
    expect(i18n.t("scan.photoQualityLimited")).toContain("محدودة");
    expect(i18n.t("scan.emergencySummary")).toContain("تحذيرًا طارئًا");
    expect(i18n.t("scan.analysisFailed")).not.toBe(ENGLISH_CORE_COPY["scan.analysisFailed"]);
    expect(i18n.t("pets.managePets")).toBe("إدارة الحيوانات الأليفة");
    expect(i18n.t("detail.retryLoading")).toBe("إعادة تحميل الملاحظة");
    expect(i18n.t("detail.outcomeAccessibility", { petName: "لولو", outcome: "ملاحظة فقط" })).toBe("نتيجة لولو: ملاحظة فقط");
    expect(i18n.t("detail.shareAccessibility", { petName: "لولو" })).toBe("مشاركة ملخص ملاحظة لولو");
    expect(i18n.t("detail.deleteAccessibility", { petName: "لولو" })).toBe("حذف ملاحظة لولو");
    expect(i18n.t("detail.findingAccessibility", { label: "احمرار", severity: "تستدعي المراقبة", evidence: "تغير مرئي", limitations: "الصورة محدودة" })).toBe("احمرار. تستدعي المراقبة. الأدلة: تغير مرئي. القيود: الصورة محدودة");
    expect(i18n.t("detail.goHistory")).toBe("الانتقال إلى السجل");
    expect(i18n.t("detail.goBack")).toBe("العودة");
    expect(i18n.t("detail.done")).toBe("تم");
    expect(i18n.t("detail.shareHint")).toContain("المشاركة");
    expect(i18n.t("detail.safetyNotice")).toContain("ليست تشخيصًا");
    expect(i18n.t("detail.savedEyebrow")).toBe("ملاحظة محفوظة");
    expect(i18n.t("detail.atGlance")).toBe("نظرة سريعة");
    expect(i18n.t("detail.reviewPhotoContext")).toBe("راجع الصورة أو السياق");
    expect(i18n.t("detail.qualityUsable")).toBe("جودة الصورة كانت مناسبة");
    expect(i18n.t("detail.sourceValidated")).toBe("بيانات مراجعة خادم موثّقة");
    expect(i18n.t("detail.reviewMetadata", { version: "1", confidence: "عالية", generated: "اليوم" })).toContain("إصدار المراجعة 1");
    expect(i18n.t("detail.imageLimits", { issues: "إضاءة منخفضة" })).toContain("إضاءة منخفضة");
    expect(i18n.t("detail.serverReviewLimit")).toContain("غير تشخيصية");
    expect(i18n.t("detail.observationSummaryLabel", { status: "ملاحظة فقط", quality: "جودة مناسبة", source: "سجل محلي" })).toContain("ملخص الملاحظة");
    expect(i18n.t("detail.confidenceLow")).toBe("منخفضة");
    expect(i18n.t("detail.confidenceMedium")).toBe("متوسطة");
    expect(i18n.t("detail.confidenceHigh")).toBe("عالية");
    expect(i18n.t("detail.issueTooSmall")).toBe("الصورة صغيرة جدًا");
    expect(i18n.t("detail.issueTooDark")).toBe("الصورة مظلمة جدًا");
    expect(i18n.t("detail.issueBlurred")).toBe("الصورة ضبابية");
    expect(i18n.t("detail.overallNormal")).toBe("لا توجد إشارة مراجعة مرتفعة");
    expect(i18n.t("detail.overallWatch")).toBe("راقب المنطقة");
    expect(i18n.t("detail.overallPromptVet")).toBe("يُنصح باستشارة الطبيب البيطري");
    expect(i18n.t("detail.overallUrgent")).toContain("رعاية بيطرية عاجلة");
    expect(i18n.t("detail.severityWatch")).toBe("تستدعي المراقبة");
    expect(i18n.t("detail.severityPromptVet")).toBe("يُنصح بمراجعة بيطرية");
    expect(i18n.t("detail.severityUrgent")).toContain("مراجعة بيطرية عاجلة");
  });

  it("keeps English fallback wording for unknown structured values", async () => {
    await i18n.changeLanguage("ar");
    expect(i18n.t("detail.reviewOverall", { overall: "provider-value" })).toContain("provider-value");
    expect(i18n.t("detail.findingSeverity", { severity: "provider-severity" })).toContain("provider-severity");
  });

  it("accepts only supported language codes", () => {
    expect(isLanguageCode("fr")).toBe(true);
    expect(isLanguageCode("en-US")).toBe(false);
    expect(isLanguageCode(null)).toBe(false);
  });

  it("ignores an unknown stored language and falls back to null", async () => {
    storage.value = "xx";
    await expect(loadLanguage()).resolves.toBeNull();
  });

  it("verifies the native write through read-back", async () => {
    await expect(saveLanguage("de")).resolves.toBeUndefined();
    expect(storage.value).toBe("de");
  });

  it("reports a native read-back mismatch instead of claiming success", async () => {
    storage.readbackOverride = "en";
    await expect(saveLanguage("ja")).rejects.toThrow("language_readback_mismatch");
  });
});
