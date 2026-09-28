import type { ScanResult } from "@/lib/pet-health";

export interface SummaryLabels {
  visitTitle: string;
  observationTitle: string;
  area: string;
  areaValues: Record<string, string>;
  date: string;
  outcome: string;
  outcomeObservation: string;
  outcomeReview: string;
  outcomeUrgent: string;
  imageQuality: string;
  usable: string;
  limited: string;
  photoReference: string;
  observed: string;
  caregiverNotes: string;
  contextFields: Record<string, string>;
  nextSteps: string;
  visitDisclaimer: string;
  observationDisclaimer: string;
}

export const englishSummaryLabels: SummaryLabels = {
  visitTitle: "Pet Health Scanner visit summary for {{petName}}",
  observationTitle: "Pet Health Scanner observation for {{petName}}",
  area: "Area",
  areaValues: { skin: "Skin", eyes: "Eyes", teeth: "Teeth", ears: "Ears", paws: "Paws", other: "Other visible area" },
  date: "Date",
  outcome: "Outcome",
  outcomeObservation: "Observation only",
  outcomeReview: "Review photo or context",
  outcomeUrgent: "Contact a veterinarian promptly",
  imageQuality: "Image quality",
  usable: "usable",
  limited: "limited",
  photoReference: "Photo reference: saved image used for this observation",
  observed: "Observed:",
  caregiverNotes: "Caregiver notes:",
  contextFields: { onset: "Onset", changing: "Change over time", behavior: "Behavior", appetite: "Appetite", visibleNotes: "Visible notes" },
  nextSteps: "Suggested next steps:",
  visitDisclaimer: "This is a non-diagnostic observation aid based on the saved photo and notes. It does not measure health, confirm a condition, or replace veterinary care.",
  observationDisclaimer: "This is an observation aid, not a diagnosis, and does not replace veterinary care.",
};

function labelText(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
}

export const reviewedSummaryCopySuccess = "Reviewed summary copied. It is ready to paste into a message or note.";
export const reviewedSummaryCopyFailure = "The summary could not be copied. You can still use Share reviewed summary.";
export const reviewedSummaryShareSuccess = "Reviewed summary is ready in the share sheet.";
export const reviewedSummaryShareFailure = "Sharing was unavailable. Your reviewed text remains on this screen.";
export const reviewedSummaryOfflineShareFailure = "You are offline. Your reviewed text remains on this screen; copy it now or retry sharing when connected.";

export function reviewedSummaryShareFailureCopy(isOffline: boolean): string {
  return isOffline ? reviewedSummaryOfflineShareFailure : reviewedSummaryShareFailure;
}

export const reviewedSummaryShareMaxAttempts = 3;

export const reviewedSummaryOptionalSectionsExcludedCopy = "Optional sections excluded. Next steps and the non-diagnostic safety disclaimer remain included.";
export const reviewedSummaryFinalConfirmationCopy = "Confirm the exact reviewed text and section choices before opening the share sheet. Sharing is your choice; the app does not diagnose or confirm a condition.";
export const reviewedSummaryPhotoMediaBoundaryCopy = "This text-only share does not attach the saved photo or expose private media metadata.";

export function reviewedSummarySelectionCopy(options: { includeCaregiverNotes: boolean; includePhotoReference: boolean; includeObservations: boolean }): string {
  const included = [
    options.includePhotoReference ? "photo reference" : null,
    options.includeObservations ? "observed details" : null,
    options.includeCaregiverNotes ? "caregiver notes" : null,
  ].filter(Boolean);
  return `Optional sections included: ${included.length > 0 ? included.join(", ") : "none"}. Next steps and the non-diagnostic safety disclaimer are always included.`;
}
export const reviewedSummaryShareLimitCopy = "Three share attempts were used. Copy the reviewed text instead; your edits remain available on this screen.";
export const reviewedSummaryReconnectResetCopy = "Connection restored. Share retry allowance was restored; your edited summary is unchanged.";

export function reviewedSummaryShareActionLabel(actionBusy: boolean, shareFailed: boolean, shareStopped: boolean): string {
  return actionBusy ? "Working…" : shareStopped ? "Share limit reached" : shareFailed ? "Retry sharing" : "Share reviewed summary";
}

export function reviewedSummaryShareAttemptLabel(attempt: number, shareStopped: boolean): string | null {
  if (attempt <= 0) return null;
  return shareStopped ? reviewedSummaryShareLimitCopy : `Share attempt ${attempt} of ${reviewedSummaryShareMaxAttempts}. Copy the text instead if sharing continues to fail.`;
}

export function formatVeterinaryVisitSummary(scan: ScanResult, options: { includeCaregiverNotes?: boolean; includePhotoReference?: boolean; includeObservations?: boolean } = {}, labels: SummaryLabels = englishSummaryLabels) {
  const context = options.includeCaregiverNotes === false ? [] : Object.entries(scan.context)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${labels.contextFields[key] ?? key}: ${value}`);
  return [
    labelText(labels.visitTitle, { petName: scan.petName }),
    `${labels.area}: ${labels.areaValues[scan.bodyArea] ?? scan.bodyArea}`,
    `${labels.date}: ${new Date(scan.createdAt).toLocaleDateString()}`,
    `${labels.outcome}: ${scan.status === "urgent-review" ? labels.outcomeUrgent : scan.status === "needs-review" ? labels.outcomeReview : labels.outcomeObservation}`,
    `${labels.imageQuality}: ${scan.quality === "good" ? labels.usable : labels.limited}`,
    ...(options.includePhotoReference === false ? [] : [labels.photoReference]),
    "",
    scan.summary,
    ...(options.includeObservations === false ? [] : ["", labels.observed, ...scan.observations.map((item) => `- ${item}`)]),
    ...(context.length > 0 ? ["", labels.caregiverNotes, ...context.map((item) => `- ${item}`)] : []),
    "",
    labels.nextSteps,
    ...scan.nextSteps.map((item) => `- ${item}`),
    "",
    labels.visitDisclaimer,
  ].join("\n");
}

export function formatScanSummary(scan: ScanResult, labels: SummaryLabels = englishSummaryLabels) {
  return [
    labelText(labels.observationTitle, { petName: scan.petName }),
    `${labels.area}: ${labels.areaValues[scan.bodyArea] ?? scan.bodyArea}`,
    `${labels.date}: ${new Date(scan.createdAt).toLocaleDateString()}`,
    "",
    scan.summary,
    "",
    labels.observed,
    ...scan.observations.map((item) => `- ${item}`),
    "",
    labels.nextSteps,
    ...scan.nextSteps.map((item) => `- ${item}`),
    "",
    labels.observationDisclaimer,
  ].join("\n");
}
