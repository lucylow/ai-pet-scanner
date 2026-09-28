import { describe, expect, it, vi } from "vitest";
import { decideSafety, scoreMedia, type AnalysisResult } from "../lib/scanner-contracts";
import { connectionIndicatorCopy, connectionLastCheckedCopy } from "../lib/network-awareness";
import { shouldShowFallbackPreview } from "../lib/fallback-data";
import { formatScanSummary, formatVeterinaryVisitSummary, englishSummaryLabels, reviewedSummaryCopyFailure, reviewedSummaryCopySuccess, reviewedSummaryOfflineShareFailure, reviewedSummaryReconnectResetCopy, reviewedSummaryShareActionLabel, reviewedSummaryShareFailure, reviewedSummaryShareFailureCopy, reviewedSummaryShareSuccess, reviewedSummaryFinalConfirmationCopy, reviewedSummaryPhotoMediaBoundaryCopy, reviewedSummaryOptionalSectionsExcludedCopy, reviewedSummarySelectionCopy } from "../lib/share-summary-format";
import { mediaActionDisabled, mediaCancelledCopy, mediaPermissionRecoveryAction, mediaPermissionRecoveryCopy, mediaPickerActionHint, mediaPickerActionLabel, mediaSettingsOpenFailureCopy, mediaSettingsOpenedCopy, mediaShareActionHint, mediaShareActionLabel, mediaShareFailureCopy, mediaUnavailableCopy, pendingMediaRecoveryFailureCopy } from "../lib/media-sharing";
import { oauthLaunchErrorMessage } from "../lib/oauth-contracts";
import { logoutLocalCleanupMessage, logoutLocalFailureMessage, logoutLocalPartialFailureMessage, logoutServerFailureMessage } from "../lib/auth-recovery";
import { subscriptionStorageFailureMessage } from "../lib/subscription-recovery";
import { localStorageWriteFailureMessage, localStorageDeleteFailureMessage } from "../lib/storage-recovery";
import { consentNavigationFailureMessage, deletionNavigationFailureMessage, navigationFailureMessage } from "../lib/navigation-recovery";
import { isRetryableAnalysisFailure as isRetryableScanError, requestAnalysisWithRetry as requestTrpcAnalysisWithRetry } from "../lib/analysis-retry";
import { LANGUAGE_OPTIONS, localizedAnalysisQualityReason } from "../lib/i18n-language";

describe("Fallback preview safety", () => {
  it("allows fixtures only after a failed read in development", () => {
    expect(shouldShowFallbackPreview("development", true)).toBe(true);
    expect(shouldShowFallbackPreview("development", false)).toBe(false);
    expect(shouldShowFallbackPreview("production", true)).toBe(false);
    expect(shouldShowFallbackPreview(undefined, true)).toBe(false);
  });
});

describe("AI quality guidance localization", () => {
  it("provides localized copy for every supported language and both quality reasons", () => {
    for (const option of LANGUAGE_OPTIONS) {
      expect(localizedAnalysisQualityReason(option.code, "unusable-image")).toBeTruthy();
      expect(localizedAnalysisQualityReason(option.code, "insufficient-evidence")).toBeTruthy();
    }
  });

  it("keeps Arabic retake guidance localized and non-diagnostic", () => {
    const copy = localizedAnalysisQualityReason("ar", "unusable-image");
    expect(copy).toContain("أعد التقاط");
    expect(copy).toContain("الثقة منخفضة");
    expect(copy).not.toMatch(/diagnos/i);
  });
});

describe("AI transport recovery contracts", () => {
  it("classifies transient tRPC failures as retryable but keeps auth failures non-retryable", () => {
    expect(isRetryableScanError({ data: { code: "INTERNAL_SERVER_ERROR" } })).toBe(true);
    expect(isRetryableScanError({ data: { code: "UNAUTHORIZED" } })).toBe(false);
    expect(isRetryableScanError({ status: 503 })).toBe(true);
  });

  it("retries one transient analysis failure and stops after the recovery attempt", async () => {
    const mutate = vi.fn().mockRejectedValueOnce({ data: { code: "TIMEOUT" } }).mockResolvedValueOnce({ scanId: "scan-1" });
    const client = { analysis: { request: { mutate } } } as never;
    await expect(requestTrpcAnalysisWithRetry(client, { scanId: "scan-1", area: "skin", imageUrls: ["https://example.test/photo.jpg"], species: "cat", language: "en" })).resolves.toEqual({ scanId: "scan-1" });
    expect(mutate).toHaveBeenCalledTimes(2);
  });

  it("does not retry a transient failure after caller cancellation", async () => {
    const mutate = vi.fn().mockRejectedValue({ data: { code: "TIMEOUT" } });
    const client = { analysis: { request: { mutate } } } as never;
    const controller = new AbortController();
    controller.abort();
    await expect(requestTrpcAnalysisWithRetry(client, { scanId: "scan-1", area: "skin", imageUrls: ["https://example.test/photo.jpg"], species: "cat", language: "en" }, controller.signal)).rejects.toMatchObject({ data: { code: "TIMEOUT" } });
    expect(mutate).toHaveBeenCalledTimes(1);
  });
});

describe("Navigation recovery contracts", () => {
  it("keeps route failures actionable without implying data loss", () => {
    expect(navigationFailureMessage).toMatch(/could not be opened/i);
    expect(navigationFailureMessage).toMatch(/saved information is unchanged/i);
    expect(navigationFailureMessage).toMatch(/try again/i);
    expect(consentNavigationFailureMessage).toMatch(/acknowledgement was saved/i);
    expect(consentNavigationFailureMessage).toMatch(/main app could not be opened/i);
    expect(deletionNavigationFailureMessage).toMatch(/observation was deleted/i);
    expect(deletionNavigationFailureMessage).toMatch(/History could not be opened/i);
  });
});

describe("Storage recovery contracts", () => {
  it("keeps failed local writes preservation-safe and retryable", () => {
    expect(localStorageWriteFailureMessage).toMatch(/could not be confirmed/i);
    expect(localStorageWriteFailureMessage).toMatch(/previous local information remains available/i);
    expect(localStorageDeleteFailureMessage).toMatch(/could not be removed/i);
    expect(localStorageDeleteFailureMessage).toMatch(/try again/i);
  });

  it("does not present a verified subscription as durably cached when storage fails", () => {
    expect(subscriptionStorageFailureMessage).toMatch(/verified/i);
    expect(subscriptionStorageFailureMessage).toMatch(/could not be saved securely/i);
    expect(subscriptionStorageFailureMessage).toMatch(/server verification/i);
  });
});

describe("Logout cleanup recovery contracts", () => {
  it("distinguishes successful, partial, and complete local cleanup failures", () => {
    expect(logoutLocalCleanupMessage(false, false)).toBeNull();
    expect(logoutLocalCleanupMessage(true, false)).toBe(logoutLocalPartialFailureMessage);
    expect(logoutLocalCleanupMessage(false, true)).toBe(logoutLocalPartialFailureMessage);
    expect(logoutLocalCleanupMessage(true, true)).toBe(logoutLocalFailureMessage);
    expect(logoutServerFailureMessage).toMatch(/server could not confirm/i);
  });
});

describe("Subscription recovery contracts", () => {
  it("distinguishes remote logout uncertainty from local cleanup failure", () => {
    expect(logoutServerFailureMessage).toMatch(/signed out on this device/i);
    expect(logoutServerFailureMessage).toMatch(/server could not confirm/i);
    expect(logoutLocalFailureMessage).toMatch(/session could not be fully cleared/i);
    expect(logoutLocalFailureMessage).toMatch(/try signing out again/i);
  });
});

describe("OAuth launch error contracts", () => {
  it("explains unsupported login links without exposing implementation details", () => {
    expect(oauthLaunchErrorMessage("unsupported")).toMatch(/cannot open.*secure login link/i);
    expect(oauthLaunchErrorMessage("unsupported")).toMatch(/try again/i);
  });

  it("explains browser launch failures with a recovery action", () => {
    expect(oauthLaunchErrorMessage("open-failed")).toMatch(/could not be opened/i);
    expect(oauthLaunchErrorMessage("open-failed")).toMatch(/check your browser/i);
  });
});

describe("scoreMedia", () => {
  it("rejects images that are too small", () => {
    expect(scoreMedia({ width: 500, height: 500, brightness: 0.5, blur: 1, obstruction: 0 }).usable).toBe(false);
  });
  it("flags dark images", () => {
    expect(scoreMedia({ width: 1200, height: 900, brightness: 0.05, blur: 1, obstruction: 0 }).issues).toContain("too-dark");
  });
});

describe("decideSafety", () => {
  const base: AnalysisResult = { version: "1", scanId: "scan-1", overall: "normal", confidence: "low", findings: [], imageQuality: { usable: true, issues: [] }, nextSteps: [], emergencyWarning: false, generatedAt: new Date().toISOString() };
  it("fails closed when image quality is unusable", () => {
    expect(decideSafety({ ...base, imageQuality: { usable: false, issues: ["blurred"] } }).action).toBe("cannot-assess");
  });
  it("escalates urgent output", () => {
    expect(decideSafety({ ...base, overall: "urgent", emergencyWarning: true }).action).toBe("urgent-care");
  });
});

import { appErrorCopy, appErrorTitle, buildSafeObservation, consentAcknowledgementPrompt, homeDataStateCopy, homeRefreshRetryAccessibilityHint, localDataDeletionMessage, normalizeScanEntries, normalizeScanDraft, observationQualityLabel, observationSourceLabel, recoverableHomeLoadErrorCopy, recoverableScanLoadErrorCopy, recoverableSubscriptionErrorCopy, resolveActivePetId, safeRemoteAnalysis, savePetState, scanAreaAccessibilityLabel, scanHistoryNotice, scanStatusLabel, validatePetName } from "../lib/pet-health";
import { classifyNetworkState, networkRetryHint, offlineBannerCopy, offlineBannerDismissHint } from "../lib/network-awareness";


describe("Home active-pet recovery", () => {
  it("falls back to the first visible pet when the saved selection is unavailable", () => {
    const pets = [
      { id: "archived", name: "Old", species: "dog" as const, archived: true, createdAt: "1" },
      { id: "visible", name: "Milo", species: "dog" as const, archived: false, createdAt: "2" },
    ];
    expect(resolveActivePetId("archived", pets.filter((pet) => !pet.archived))).toBe("visible");
    expect(resolveActivePetId("missing", pets.filter((pet) => !pet.archived))).toBe("visible");
    expect(resolveActivePetId("visible", pets.filter((pet) => !pet.archived))).toBe("visible");
  });
});

describe("profile persistence recovery", () => {
  it("restores the previous profile state when active-pet persistence fails", async () => {
    const data = new Map<string, string>([
      ["pet-health-scanner:pets", "old-pets"],
      ["pet-health-scanner:active-pet", "old-active"],
    ]);
    let activeWriteAttempts = 0;
    const store = {
      getItem: async (key: string) => data.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        if (key === "pet-health-scanner:active-pet" && activeWriteAttempts++ === 0) throw new Error("active write failed");
        data.set(key, value);
      },
      removeItem: async (key: string) => { data.delete(key); },
    };

    await expect(savePetState([{ id: "new", name: "Milo", species: "dog", archived: false, createdAt: "now" }], "new", store)).rejects.toThrow("active write failed");
    expect(data.get("pet-health-scanner:pets")).toBe("old-pets");
    expect(data.get("pet-health-scanner:active-pet")).toBe("old-active");
  });
});

describe("pet and observation contracts", () => {
  it("requires a meaningful pet name", () => {
    expect(validatePetName("A")).toBe(false);
    expect(validatePetName("Milo")).toBe(true);
  });
  it("escalates notes containing urgent signals", () => {
    const result = buildSafeObservation("skin", "good", { visibleNotes: "There is uncontrolled bleeding." });
    expect(result.status).toBe("urgent-review");
    expect(result.nextSteps[0]).toMatch(/veterinarian/i);
  });
  it("fails closed when photo quality is limited", () => {
    const result = buildSafeObservation("eyes", "limited", {});
    expect(result.status).toBe("needs-review");
    expect(result.summary).toMatch(/limited/i);
  });
  it("keeps Home refresh recovery copy preservation-safe", () => {
    expect(recoverableHomeLoadErrorCopy).toMatch(/existing information was kept/i);
    expect(homeRefreshRetryAccessibilityHint).toMatch(/without deleting/i);
  });
  it("distinguishes Home empty, unavailable, and active-pet states", () => {
    expect(homeDataStateCopy(false, false)).toMatch(/Adding a profile/i);
    expect(homeDataStateCopy(false, true)).toMatch(/temporarily unavailable/i);
    expect(homeDataStateCopy(true, false)).toMatch(/take a clear photo/i);
  });
  it("classifies connectivity without depending on native runtime", () => {
    expect(classifyNetworkState({ isConnected: false, isInternetReachable: false })).toBe("offline");
    expect(classifyNetworkState({ isConnected: true, isInternetReachable: true })).toBe("online");
    expect(classifyNetworkState({ isConnected: true, isInternetReachable: null })).toBe("checking");
    expect(networkRetryHint(true)).toMatch(/reconnect/i);
    expect(networkRetryHint(false)).toMatch(/try again safely/i);
    expect(offlineBannerCopy).toMatch(/unfinished drafts remain available/i);
    expect(offlineBannerDismissHint).toMatch(/connection changes again/i);
  });
  it("keeps app-level recovery copy actionable and local-data safe", () => {
    expect(appErrorTitle).toBe("Something went wrong");
    expect(appErrorCopy).toMatch(/were not deleted/i);
  });
  it("keeps recoverable screen errors actionable and safety-preserving", () => {
    expect(recoverableScanLoadErrorCopy).toMatch(/try again/i);
    expect(recoverableSubscriptionErrorCopy).toMatch(/basic observation access remains available/i);
  });
  it("keeps consent validation copy explicit and non-diagnostic", () => {
    expect(consentAcknowledgementPrompt).toMatch(/observation-only/i);
    expect(consentAcknowledgementPrompt).not.toMatch(/diagnos/i);
  });
  it("formats selected scan-area labels for assistive technology", () => {
    expect(scanAreaAccessibilityLabel("eyes", true)).toBe("Eyes, selected");
    expect(scanAreaAccessibilityLabel("skin", false)).toBe("Skin");
  });
  it("reports complete versus partial local-data deletion safely", () => {
    expect(localDataDeletionMessage(true, true)).toMatch(/has been removed/i);
    expect(localDataDeletionMessage(false, true)).toMatch(/could not be removed/i);
  });
  it("uses safety-conscious labels for history outcomes", () => {
    expect(scanStatusLabel("observation")).toBe("Observation");
    expect(scanStatusLabel("needs-review")).toBe("Review photo");
    expect(scanStatusLabel("urgent-review")).toBe("Vet promptly");
  });
  it("keeps the post-scan glance summary concise and non-diagnostic", () => {
    expect(observationQualityLabel("good")).toMatch(/usable/i);
    expect(observationQualityLabel("limited")).toMatch(/limited/i);
    expect(observationSourceLabel(true)).toMatch(/validated server/i);
    expect(observationSourceLabel(false)).toMatch(/local safety record/i);
  });
  it("filters malformed history entries while preserving valid records", () => {
    const normalized = normalizeScanEntries([{ id: "valid", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "good", status: "observation", summary: "Observation", observations: [], nextSteps: [], context: {} }, { id: 42 }]);
    expect(normalized.scans).toHaveLength(1);
    expect(normalized.hadMalformedEntries).toBe(true);
  });
  it("prioritizes unavailable storage over malformed-entry warnings", () => {
    expect(scanHistoryNotice({ storageError: true, hadMalformedEntries: false })).toBe("error");
    expect(scanHistoryNotice({ storageError: true, hadMalformedEntries: true })).toBe("error");
    expect(scanHistoryNotice({ storageError: false, hadMalformedEntries: true })).toBe("malformed");
    expect(scanHistoryNotice({ storageError: false, hadMalformedEntries: false })).toBeNull();
  });
  it("preserves valid offline drafts and rejects malformed drafts", () => {
    expect(normalizeScanDraft({ petId: "p1", area: "skin", image: { uri: "file://photo" }, notes: { visibleNotes: "watching" }, updatedAt: "2026-08-21T00:00:00.000Z" })?.petId).toBe("p1");
    expect(normalizeScanDraft({ petId: "p1", image: {} })).toBeNull();
  });
  it("returns validated remote metadata and rejects malformed legacy data", () => {
    const scan = { id: "1", petId: "p1", petName: "Milo", bodyArea: "skin" as const, imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "good" as const, status: "observation" as const, summary: "Observation", observations: [], nextSteps: [], context: {}, remoteAnalysis: { version: "1", scanId: "1", overall: "normal" as const, confidence: "low" as const, findings: [], imageQuality: { usable: true, issues: [] }, emergencyWarning: false, nextSteps: ["Monitor"], generatedAt: "2026-08-21T00:00:00.000Z" } };
    expect(safeRemoteAnalysis(scan)?.version).toBe("1");
    expect(safeRemoteAnalysis({ ...scan, remoteAnalysis: { ...scan.remoteAnalysis, generatedAt: "2026-08-21T02:00:00+02:00" } })).not.toBeNull();
    expect(safeRemoteAnalysis({ ...scan, remoteAnalysis: { ...scan.remoteAnalysis, generatedAt: "not-a-timestamp" } })).toBeNull();
    expect(safeRemoteAnalysis({ ...scan, remoteAnalysis: { overall: "certain" } } as unknown as typeof scan)).toBeNull();
    expect(safeRemoteAnalysis({ ...scan, id: "different" })).toBeNull();
  });
  it("passes the selected language through the typed request boundary", async () => {
    let requestBody: Record<string, unknown> | null = null;
    const response = {
      status: 200,
      ok: true,
      json: async () => ({ version: "1", scanId: "scan-language", overall: "normal", confidence: "low", findings: [], imageQuality: { usable: true, issues: [] }, emergencyWarning: false, nextSteps: [], generatedAt: "2026-08-21T00:00:00.000Z" }),
    } as unknown as Response;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => { requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>; return response; }) as unknown as typeof fetch;

    await expect(requestTypedAnalysis({ scanId: "scan-language", area: "skin", imageUrls: ["https://example.test/photo.jpg"], species: "cat", language: "ar" }, { endpoint: "https://example.test/analyze", fetchImpl })).resolves.toMatchObject({ scanId: "scan-language" });
    expect(requestBody).toMatchObject({ language: "ar" });
  });

  it("rejects a valid-shaped server response for a different scan", async () => {
    const response = {
      status: 200,
      ok: true,
      json: async () => ({ version: "1", scanId: "other-scan", overall: "normal", confidence: "low", findings: [], imageQuality: { usable: true, issues: [] }, emergencyWarning: false, nextSteps: [], generatedAt: "2026-08-21T00:00:00.000Z" }),
    } as unknown as Response;
    const fetchImpl = vi.fn().mockResolvedValue(response) as unknown as typeof fetch;

    await expect(requestTypedAnalysis({ scanId: "scan-1", area: "skin", imageUrls: ["https://example.test/photo.jpg"], species: "cat", language: "ar" }, { endpoint: "https://example.test/analyze", fetchImpl })).rejects.toMatchObject({ code: "INVALID_RESPONSE", retryable: false });
  });
});

describe("share summary", () => {
  it("includes pet, area, observations, next steps, and the non-diagnostic disclaimer", () => {
    const text = formatScanSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "good", status: "observation", summary: "A cautious observation.", observations: ["Visible change noted."], nextSteps: ["Contact a veterinarian if it worsens."], context: {} });
    expect(text).toContain("Milo");
    expect(text).toContain("Visible change noted.");
    expect(text).toContain("not a diagnosis");
    const visit = formatVeterinaryVisitSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "limited", status: "needs-review", summary: "A cautious observation.", observations: ["Visible change noted."], nextSteps: ["Contact a veterinarian if it worsens."], context: { visibleNotes: "Watching for change" }, sourceMediaUrl: "https://private.example/media", sourceMediaKey: "private/key" });
    expect(visit).toContain("Caregiver notes:");
    expect(visit).toContain("Image quality: limited");
    expect(visit).toContain("not measure health");
    expect(visit).not.toContain("private.example");
    expect(visit).not.toContain("private/key");
    const withoutNotes = formatVeterinaryVisitSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "limited", status: "needs-review", summary: "A cautious observation.", observations: ["Visible change noted."], nextSteps: ["Contact a veterinarian if it worsens."], context: { visibleNotes: "Sensitive caregiver note" } }, { includeCaregiverNotes: false });
    expect(withoutNotes).not.toContain("Sensitive caregiver note");
    expect(withoutNotes).toContain("not measure health");
    const withoutPrivateSections = formatVeterinaryVisitSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "limited", status: "needs-review", summary: "A cautious observation.", observations: ["Visible change noted."], nextSteps: ["Contact a veterinarian if it worsens."], context: {} }, { includePhotoReference: false, includeObservations: false });
    expect(withoutPrivateSections).not.toContain("Photo reference:");
    expect(withoutPrivateSections).not.toContain("Visible change noted.");
    expect(withoutPrivateSections).toContain("Suggested next steps:");
    expect(withoutPrivateSections).toContain("non-diagnostic observation aid");
    expect(formatVeterinaryVisitSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "good", status: "observation", summary: "Original", observations: ["Visible change noted."], nextSteps: ["Ask a veterinarian if concerned."], context: {} }, { includePhotoReference: true, includeObservations: true })).toContain("Photo reference:");
    expect(formatVeterinaryVisitSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "good", status: "observation", summary: "Original", observations: [], nextSteps: [], context: {} })).toContain("This is a non-diagnostic observation aid");
    const arabicLabels = { ...englishSummaryLabels, areaValues: { ...englishSummaryLabels.areaValues, skin: "الجلد" }, contextFields: { ...englishSummaryLabels.contextFields, visibleNotes: "ملاحظات مرئية" } };
    const localizedVisit = formatVeterinaryVisitSummary({ id: "1", petId: "p1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo", createdAt: "2026-08-21T00:00:00.000Z", quality: "good", status: "observation", summary: "Observation", observations: [], nextSteps: [], context: { visibleNotes: "Keep watching" } }, {}, arabicLabels);
    expect(localizedVisit).toContain("الجلد");
    expect(localizedVisit).toContain("ملاحظات مرئية: Keep watching");
    expect(reviewedSummaryCopySuccess).toMatch(/copied/i);
    expect(reviewedSummaryCopyFailure).toMatch(/could not be copied/i);
    expect(reviewedSummaryShareSuccess).toMatch(/share sheet/i);
    expect(reviewedSummarySelectionCopy({ includeCaregiverNotes: true, includePhotoReference: true, includeObservations: true })).toMatch(/photo reference, observed details, caregiver notes/i);
    expect(reviewedSummarySelectionCopy({ includeCaregiverNotes: false, includePhotoReference: false, includeObservations: false })).toMatch(/optional sections included: none/i);
    expect(reviewedSummarySelectionCopy({ includeCaregiverNotes: false, includePhotoReference: false, includeObservations: false })).toMatch(/next steps and the non-diagnostic safety disclaimer are always included/i);
    expect(reviewedSummaryOptionalSectionsExcludedCopy).toMatch(/optional sections excluded/i);
    expect(reviewedSummaryOptionalSectionsExcludedCopy).toMatch(/safety disclaimer remain included/i);
    expect(reviewedSummaryFinalConfirmationCopy).toMatch(/exact reviewed text/i);
    expect(reviewedSummaryFinalConfirmationCopy).toMatch(/does not diagnose/i);
    expect(reviewedSummaryPhotoMediaBoundaryCopy).toMatch(/does not attach the saved photo/i);
    expect(reviewedSummaryPhotoMediaBoundaryCopy).toMatch(/private media metadata/i);
    expect(reviewedSummaryShareFailure).toMatch(/remains on this screen/i);
    expect(reviewedSummaryShareFailureCopy(false)).toBe(reviewedSummaryShareFailure);
    expect(reviewedSummaryShareFailureCopy(true)).toBe(reviewedSummaryOfflineShareFailure);
    expect(reviewedSummaryOfflineShareFailure).toMatch(/retry sharing when connected/i);
    expect(reviewedSummaryShareActionLabel(false, false, false)).toBe("Share reviewed summary");
    expect(reviewedSummaryShareActionLabel(false, true, false)).toBe("Retry sharing");
    expect(reviewedSummaryShareActionLabel(true, true, false)).toBe("Working…");
    expect(reviewedSummaryShareActionLabel(false, true, true)).toBe("Share limit reached");
    expect(reviewedSummaryShareActionLabel(false, true, false)).toBe("Retry sharing");
    expect(reviewedSummaryReconnectResetCopy).toMatch(/edited summary is unchanged/i);
    expect(connectionIndicatorCopy("offline").label).toMatch(/offline/i);
    expect(connectionIndicatorCopy("offline").hint).toMatch(/copied locally/i);
    expect(connectionIndicatorCopy("checking").label).toMatch(/checking/i);
    expect(connectionIndicatorCopy("online").hint).toMatch(/not guaranteed/i);
    expect(connectionLastCheckedCopy(1_000, 1_000)).toBe("Last checked just now");
    expect(connectionLastCheckedCopy(1_000, 61_000)).toBe("Last checked 1 minute ago");
    expect(connectionLastCheckedCopy(1_000, 121_000)).toBe("Last checked 2 minutes ago");
    expect(connectionLastCheckedCopy(1_000, 1_000, true)).toBe("Checking connection now");
    expect(connectionIndicatorCopy("checking").hint).toMatch(/connection check/i);
    expect(connectionIndicatorCopy("offline").hint).toMatch(/copied locally/i);
  });
});

import { analysisAttemptLabel, analysisStatusAccessibilityHint, analysisStatusCopy, reduceAnalysisFlow, scanStageAccessibilityLabel, scanStageLabel } from "../lib/analysis-flow";

describe("analysis flow", () => {
  it("keeps scan-stage labels concise and accessible", () => {
    expect(scanStageLabel("uploading")).toBe("Secure upload");
    expect(scanStageLabel("error")).toBe("Draft preserved");
    expect(scanStageAccessibilityLabel("analyzing", true)).toBe("Cautious review, current");
  });
  it("moves from upload to analysis to success", () => {
    const uploading = reduceAnalysisFlow({ status: "idle" }, { type: "START" });
    const analyzing = reduceAnalysisFlow(uploading, { type: "UPLOADED" });
    const success = reduceAnalysisFlow(analyzing, { type: "SUCCESS", scanId: "scan-1" });
    expect(uploading.status).toBe("uploading");
    expect(analyzing.status).toBe("analyzing");
    expect(success).toEqual({ status: "success", scanId: "scan-1" });
    expect(analysisStatusAccessibilityHint(success)).toMatch(/not a diagnosis/i);
  });
  it("supports retry and cancellation after a recoverable failure", () => {
    const failed = reduceAnalysisFlow({ status: "analyzing", attempt: 1 }, { type: "FAIL", message: "Try again", retryable: true });
    expect(analysisStatusCopy(failed)).toBe("Try again");
    expect(failed).toMatchObject({ stage: "analysis" });
    expect(analysisStatusAccessibilityHint(failed)).toMatch(/try again safely/i);
    expect(analysisAttemptLabel(failed)).toBe("Attempt 1 of 3. 2 retries remaining if needed.");
    expect(reduceAnalysisFlow(failed, { type: "RETRY" })).toEqual({ status: "uploading", attempt: 2 });
    expect(reduceAnalysisFlow(failed, { type: "CANCEL" })).toEqual({ status: "idle" });
  });
  it("retains explicit failure stages for safe recovery presentation", () => {
    expect(reduceAnalysisFlow({ status: "uploading", attempt: 1 }, { type: "FAIL", message: "Upload failed", stage: "upload" })).toMatchObject({ status: "error", stage: "upload" });
    expect(reduceAnalysisFlow({ status: "analyzing", attempt: 1 }, { type: "FAIL", message: "Review failed", stage: "analysis" })).toMatchObject({ status: "error", stage: "analysis" });
    expect(reduceAnalysisFlow({ status: "analyzing", attempt: 1 }, { type: "FAIL", message: "Save failed", stage: "local-save" })).toMatchObject({ status: "error", stage: "local-save" });
    expect(reduceAnalysisFlow({ status: "analyzing", attempt: 1 }, { type: "FAIL", message: "Cancelled", retryable: false, stage: "cancelled" })).toMatchObject({ status: "error", retryable: false, stage: "cancelled" });
  });
  it("stops retrying after the third attempt and announces the limit", () => {
    const failed = reduceAnalysisFlow({ status: "analyzing", attempt: 3 }, { type: "FAIL", message: "Try again", retryable: true, attempt: 3 });
    expect(reduceAnalysisFlow(failed, { type: "RETRY" })).toEqual(failed);
    expect(analysisStatusCopy(failed)).toMatch(/Retry limit reached/i);
    expect(analysisStatusAccessibilityHint(failed)).toMatch(/saved locally/i);
    expect(analysisAttemptLabel(failed)).toMatch(/Final attempt used/i);
  });
});

import { billingMessage, canUse, FREE_SUBSCRIPTION, gateFeature, type SubscriptionState } from "../lib/monetization";

describe("monetization boundaries", () => {
  it("keeps core free access while gating advanced features", () => {
    expect(canUse("advancedAI", FREE_SUBSCRIPTION)).toBe(false);
    expect(gateFeature("advancedAI", FREE_SUBSCRIPTION).reason).toBe("premium_required");
    const plus: SubscriptionState = { plan: "plus", entitlements: [] };
    expect(canUse("advancedAI", plus)).toBe(true);
  });
  it("maps purchase failures without implying access was granted", () => {
    expect(billingMessage("verification_failed")).toMatch(/No premium access was granted/i);
    expect(billingMessage("user_cancelled")).toMatch(/unchanged/i);
  });
});

import { AnalysisApiError, requestServerAnalysis } from "../lib/analysis-api";

describe("analysis API boundary", () => {
  it("maps server failures to typed retryable errors", async () => {
    const fetchImpl = async () => ({ ok: false, status: 503 } as Response);
    await expect(requestServerAnalysis({ petId: "p1", bodyArea: "skin", imageUri: "file://photo" }, { endpoint: "https://example.test/analyze", fetchImpl })).rejects.toMatchObject({ code: "SERVER", retryable: true });
  });
  it("maps caller cancellation to a non-retryable error", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = async () => { throw new Error("should not be reached"); };
    await expect(requestServerAnalysis({ petId: "p1", bodyArea: "skin", imageUri: "file://photo" }, { endpoint: "https://example.test/analyze", signal: controller.signal, fetchImpl })).rejects.toBeInstanceOf(AnalysisApiError);
    await expect(requestServerAnalysis({ petId: "p1", bodyArea: "skin", imageUri: "file://photo" }, { endpoint: "https://example.test/analyze", signal: controller.signal, fetchImpl })).rejects.toMatchObject({ code: "ABORTED", retryable: false });
  });
});

import { initializeBilling, mergeEntitlementRefresh, restorePurchases, type PurchaseAdapter } from "../lib/billing";

describe("billing adapter boundary", () => {
  it("initializes an adapter only once and supports restore", async () => {
    let initialized = 0;
    const adapter: PurchaseAdapter = { initialize: async () => { initialized += 1; }, getProducts: async () => [], purchase: async () => ({ transactionId: "t1", productId: "pet_plus_monthly", purchasedAt: "2026-08-21" }), restore: async () => [], finish: async () => undefined };
    await initializeBilling(adapter);
    await initializeBilling(adapter);
    expect(initialized).toBe(1);
    await expect(restorePurchases(adapter)).resolves.toEqual([]);
  });
  it("deduplicates refreshed entitlements and preserves stale state when refresh fails", () => {
    const current = { plan: "plus" as const, entitlements: ["advancedAI" as const] };
    expect(mergeEntitlementRefresh(current, { plan: "pro", entitlements: ["videoScan", "videoScan"] })).toEqual({ plan: "pro", entitlements: ["videoScan"] });
    expect(mergeEntitlementRefresh(current, null)).toBe(current);
  });
});

import { markSnapshotStale, subscriptionStatusCopy } from "../lib/subscription-status";

describe("subscription resilience", () => {
  it("marks old snapshots stale without changing their plan", () => {
    const snapshot = { state: { plan: "plus" as const, entitlements: ["advancedAI" as const] }, refreshedAt: "2020-01-01T00:00:00.000Z", source: "cached" as const, stale: false };
    const stale = markSnapshotStale(snapshot, Date.parse("2026-08-21T00:00:00.000Z"));
    expect(stale.stale).toBe(true);
    expect(stale.state.plan).toBe("plus");
    expect(subscriptionStatusCopy(stale)).toMatch(/out of date/i);
  });
});

import { refreshEntitlements, SubscriptionRefreshError } from "../lib/subscription-api";

describe("subscription refresh API", () => {
  it("maps authorization failure without retrying", async () => {
    const fetchImpl = async () => ({ ok: false, status: 401 } as Response);
    await expect(refreshEntitlements("token", { endpoint: "https://example.test/me/subscription", fetchImpl })).rejects.toMatchObject({ code: "UNAUTHORIZED", retryable: false });
  });
  it("maps network failures to a retryable typed error", async () => {
    const fetchImpl = async () => { throw new Error("offline"); };
    await expect(refreshEntitlements("token", { endpoint: "https://example.test/me/subscription", fetchImpl })).rejects.toBeInstanceOf(SubscriptionRefreshError);
    await expect(refreshEntitlements("token", { endpoint: "https://example.test/me/subscription", fetchImpl })).rejects.toMatchObject({ code: "NETWORK", retryable: true });
  });
});

import { requestTypedAnalysis } from "../lib/analysis-client";

describe("typed analysis client", () => {
  it("rejects malformed server results instead of exposing unsafe data", async () => {
    const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ overall: "certain" }) } as Response);
    await expect(requestTypedAnalysis({ scanId: "s1", area: "skin", imageUrls: ["https://example.test/photo.jpg"], species: "dog", language: "en" }, { endpoint: "https://example.test/analyze", fetchImpl })).rejects.toMatchObject({ code: "INVALID_RESPONSE", retryable: false });
  });
});

import { failClosedVisionResult, PET_SCANNER_SYSTEM_PROMPT } from "../server/pet-scanner-contract";
import { analysisRequestSchema, normalizeSafeAnalysisResult } from "../shared/pet-scanner-contracts";
import { providerCopyKey } from "../lib/provider-result-copy";

describe("provider result localization boundary", () => {
  const known = { "too-small": "detail.issueTooSmall", urgent: "detail.overallUrgent" } as const;

  it("resolves known enum formatting variants without rewriting unknown values", () => {
    expect(providerCopyKey(" Too Small ", known)).toBe("detail.issueTooSmall");
    expect(providerCopyKey("URGENT", known)).toBe("detail.overallUrgent");
    expect(providerCopyKey("provider-specific wording", known)).toBeUndefined();
  });
});

describe("AI result quality boundary", () => {
  it("drops findings without evidence or limitations and downgrades a normal result with low evidence", () => {
    const result = normalizeSafeAnalysisResult({ version: "1", scanId: "scan-1", overall: "normal", confidence: "high", findings: [{ label: "", severity: "low", confidence: "high", evidence: ["   "], limitations: ["   "] }], imageQuality: { usable: true, issues: ["  "] }, emergencyWarning: true, nextSteps: ["  "], generatedAt: "2026-08-27T00:00:00.000Z" });
    expect(result.findings).toEqual([]);
    expect(result.nextSteps).toEqual([]);
    expect(result.overall).toBe("watch");
    expect(result.confidence).toBe("low");
    expect(result.emergencyWarning).toBe(false);
  });

  it("downgrades unusable media and removes findings even when the model claims urgency", () => {
    const result = normalizeSafeAnalysisResult({ version: "1", scanId: "scan-blurry", overall: "urgent", confidence: "high", findings: [{ label: "Possible concern", severity: "urgent", confidence: "high", evidence: ["Visible detail"], limitations: ["Not a diagnosis"] }], imageQuality: { usable: false, issues: ["  Too blurry  "] }, emergencyWarning: true, nextSteps: ["Retake a clearer photo"], generatedAt: "2026-08-27T00:00:00.000Z" });
    expect(result.findings).toEqual([]);
    expect(result.confidence).toBe("low");
    expect(result.overall).toBe("urgent");
    expect(result.emergencyWarning).toBe(false);
    expect(result.imageQuality.issues).toEqual(["Too blurry"]);
  });

  it("normalizes misleading finding tokens to conservative supported values", () => {
    const result = normalizeSafeAnalysisResult({ version: "1", scanId: "scan-tokens", overall: "watch", confidence: "high", findings: [{ label: "Visible change", severity: "diagnosis", confidence: "certain", evidence: ["Observed detail"], limitations: ["Not a diagnosis"] }], imageQuality: { usable: true, issues: [] }, emergencyWarning: false, nextSteps: ["Monitor and contact a veterinarian if concerned"], generatedAt: "2026-08-27T00:00:00.000Z" });
    expect(result.findings[0].severity).toBe("watch");
    expect(result.findings[0].confidence).toBe("low");
  });

  it("preserves localized evidence content while trimming safe presentation whitespace", () => {
    const result = normalizeSafeAnalysisResult({ version: "1", scanId: "scan-ar", overall: "watch", confidence: "medium", findings: [{ label: "  احمرار  ", severity: "  watch ", confidence: " medium ", evidence: ["  ملاحظة مرئية  "], limitations: ["  ليست تشخيصاً  "] }], imageQuality: { usable: true, issues: ["  ضوء منخفض  "] }, emergencyWarning: false, nextSteps: ["  راقب التغيير  "], generatedAt: "2026-08-27T00:00:00.000Z" });
    expect(result.findings[0]).toEqual({ label: "احمرار", severity: "watch", confidence: "medium", evidence: ["ملاحظة مرئية"], limitations: ["ليست تشخيصاً"] });
    expect(result.nextSteps).toEqual(["راقب التغيير"]);
    expect(result.imageQuality.issues).toEqual(["ضوء منخفض"]);
  });
});

describe("server scanner safety boundary", () => {
  it("returns a safe low-confidence result when analysis cannot be assessed", () => {
    const result = failClosedVisionResult("scan-1", "provider unavailable");
    expect(result.overall).toBe("watch");
    expect(result.confidence).toBe("low");
    expect(result.findings).toHaveLength(0);
    expect(result.imageQuality.usable).toBe(false);
    expect(result.nextSteps[0]).toContain("Retake the image");
  });

  it("localizes fail-closed issue and next-step text while keeping unknown languages on English fallback", () => {
    const arabic = failClosedVisionResult("scan-ar", "The analysis service is temporarily unavailable.", "ar");
    expect(arabic.imageQuality.issues[0]).toContain("غير متاحة");
    expect(arabic.nextSteps[0]).toContain("أعد التقاط الصورة");
    const unknown = failClosedVisionResult("scan-unknown", "The model returned an invalid safety response.", "xx" as never);
    expect(unknown.imageQuality.issues[0]).toContain("invalid safety response");
    expect(unknown.nextSteps[0]).toContain("Retake the image");
  });

  it("defaults missing request language to English and rejects unsupported languages", () => {
    const base = { scanId: "scan-1", area: "skin", imageUrls: ["https://example.test/photo.jpg"], species: "cat" as const };
    expect(analysisRequestSchema.parse(base).language).toBe("en");
    expect(analysisRequestSchema.safeParse({ ...base, language: "xx" }).success).toBe(false);
  });
  it("keeps the model prompt non-diagnostic", () => {
    expect(PET_SCANNER_SYSTEM_PROMPT).toMatch(/not a veterinarian/i);
    expect(PET_SCANNER_SYSTEM_PROMPT).toMatch(/never diagnose/i);
  });
});

import { classifyImagePickerOutcome, MAX_SCAN_PHOTOS, MediaUploadError, normalizeSelectedMedia, normalizeSelectedMediaAssets, validateMediaForUpload } from "../lib/media-upload";

describe("media upload boundary", () => {
  it("normalizes supported image metadata and rejects unsupported assets", () => {
    expect(normalizeSelectedMedia({ uri: "file://photo.PNG", fileName: "photo.PNG" }).media?.mimeType).toBe("image/png");
    expect(normalizeSelectedMedia({ uri: "file://photo.gif", fileName: "photo.gif" }).message).toMatch(/JPEG, PNG, or WebP/i);
    expect(normalizeSelectedMedia({ uri: "file://large.jpg", fileName: "large.jpg", fileSize: 11 * 1024 * 1024 }).message).toMatch(/10 MB/i);
  });
  it("rejects unsupported media before any network request", () => {
    expect(() => validateMediaForUpload({ uri: "file://photo.gif", mimeType: "image/gif", size: 100 })).toThrowError(MediaUploadError);
    expect(() => validateMediaForUpload({ uri: "file://photo.jpg", mimeType: "image/jpeg", size: 11 * 1024 * 1024 })).toThrow(/10 MB/i);
  });
  it("classifies cancellation and missing native assets without throwing", () => {
    expect(classifyImagePickerOutcome({ canceled: true, assets: null })).toBe("cancelled");
    expect(classifyImagePickerOutcome({ canceled: false, assets: [] })).toBe("missing-asset");
    expect(classifyImagePickerOutcome({ canceled: false, assets: [{ uri: "  " }] })).toBe("missing-asset");
    expect(classifyImagePickerOutcome({ canceled: false, assets: [{ uri: "file://photo.jpg" }] })).toBe("selected");
  });
  it("normalizes multiple photos, removes duplicate URIs, and caps the selection", () => {
    const result = normalizeSelectedMediaAssets([
      { uri: "file://one.jpg", fileName: "one.jpg", fileSize: 100 },
      { uri: "file://one.jpg", fileName: "one-copy.jpg", fileSize: 100 },
      { uri: "file://two.png", fileName: "two.png", fileSize: 100 },
      { uri: "file://bad.gif", fileName: "bad.gif", fileSize: 100 },
      { uri: "file://three.webp", fileName: "three.webp", fileSize: 100 },
      { uri: "file://four.jpg", fileName: "four.jpg", fileSize: 100 },
      { uri: "file://five.jpg", fileName: "five.jpg", fileSize: 100 },
    ], 4);
    expect(result.media.map((item) => item.uri)).toEqual(["file://one.jpg", "file://two.png", "file://three.webp", "file://four.jpg"]);
    expect(result.rejectedCount).toBe(1);
    expect(result.truncatedCount).toBe(1);
    expect(result.media).toHaveLength(MAX_SCAN_PHOTOS);
  });
  it("rejects analysis requests that exceed the bounded photo count", () => {
    const base = { scanId: "scan-many", area: "skin", species: "cat" as const, language: "en" as const };
    expect(analysisRequestSchema.safeParse({ ...base, imageUrls: Array.from({ length: MAX_SCAN_PHOTOS }, (_, index) => `https://example.test/${index}.jpg`) }).success).toBe(true);
    expect(analysisRequestSchema.safeParse({ ...base, imageUrls: Array.from({ length: MAX_SCAN_PHOTOS + 1 }, (_, index) => `https://example.test/${index}.jpg`) }).success).toBe(false);
  });
});


describe("media sharing recovery", () => {
  it("distinguishes retryable and settings-required permission denial", () => {
    expect(mediaPermissionRecoveryAction(true)).toBe("retry");
    expect(mediaPermissionRecoveryAction(false)).toBe("settings");
    expect(mediaPermissionRecoveryCopy("photo library", true)).toMatch(/try again/i);
    expect(mediaPermissionRecoveryCopy("camera", false)).toMatch(/device settings/i);
  });

  it("keeps cancellation and unavailable states text-only safe", () => {
    expect(mediaCancelledCopy("camera")).toMatch(/cancelled/i);
    expect(mediaUnavailableCopy("photo library")).toMatch(/text-only sharing remains available/i);
    expect(mediaShareFailureCopy()).toMatch(/only on this device/i);
  });

  it("provides explicit settings and pending-recovery feedback", () => {
    expect(mediaSettingsOpenedCopy()).toMatch(/settings opened/i);
    expect(mediaSettingsOpenFailureCopy()).toMatch(/text-only sharing remains available/i);
    expect(pendingMediaRecoveryFailureCopy()).toMatch(/could not be restored/i);
  });
});


describe("media control contracts", () => {
  it("labels camera and library actions truthfully across busy and selection states", () => {
    expect(mediaPickerActionLabel("camera", false, false)).toBe("Capture a photo with the camera");
    expect(mediaPickerActionLabel("library", false, false)).toBe("Choose a photo to share separately");
    expect(mediaPickerActionLabel("library", false, true)).toBe("Choose a different photo");
    expect(mediaPickerActionLabel("library", true, true)).toBe("Preparing photo sharing");
  });

  it("keeps media action hints explicit and disabled state composable", () => {
    expect(mediaPickerActionHint("camera")).toMatch(/camera permission/i);
    expect(mediaPickerActionHint("library")).toMatch(/photo-library permission/i);
    expect(mediaActionDisabled(false, false)).toBe(false);
    expect(mediaActionDisabled(true, false)).toBe(true);
    expect(mediaActionDisabled(false, true)).toBe(true);
  });
});


describe("photo share controls", () => {
  it("labels selected-photo sharing across busy and unavailable states", () => {
    expect(mediaShareActionLabel(false, false, true)).toBe("Choose a photo before sharing");
    expect(mediaShareActionLabel(true, true, true)).toBe("Sharing selected photo");
    expect(mediaShareActionLabel(false, true, false)).toBe("Photo sharing unavailable");
    expect(mediaShareActionLabel(false, true, true)).toBe("Share selected photo separately");
  });

  it("explains the privacy boundary for available and unavailable sharing", () => {
    expect(mediaShareActionHint(true)).toMatch(/reviewed text is not attached/i);
    expect(mediaShareActionHint(false)).toMatch(/text-only sharing is still available/i);
  });
});
