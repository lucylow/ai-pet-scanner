export type Modality = "photo" | "video" | "audio" | "text" | "sensor";
export type CaptureSource = "camera" | "library" | "microphone" | "form";

export interface MediaAsset {
  id: string;
  modality: Modality;
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  sizeBytes?: number;
  source: CaptureSource;
  createdAt: string;
}

export interface MultimodalCase {
  id: string;
  petId: string;
  assets: MediaAsset[];
  userText?: string;
  locale: string;
  createdAt: string;
  status: "draft" | "ready" | "analyzing" | "complete" | "failed";
}

export const MAX_MULTIMODAL_ASSET_BYTES = 50 * 1024 * 1024;
export const MAX_RECOVERED_MEDIA_ASSETS = 4;

export const MIME_BY_MODALITY: Record<Modality, readonly string[]> = {
  photo: ["image/jpeg", "image/png", "image/heic", "image/webp"],
  video: ["video/mp4", "video/quicktime"],
  audio: ["audio/m4a", "audio/aac", "audio/mp4"],
  text: ["text/plain"],
  sensor: [],
};

export type AssetValidationReason = "missing_uri" | "unsupported_type" | "too_large";

export function createPhotoAsset(input: { id: string; uri: string; mimeType: string; sizeBytes?: number; width?: number; height?: number }, source: "camera" | "library", createdAt = new Date().toISOString()): MediaAsset {
  return { ...input, modality: "photo", source, createdAt };
}

export function validateMultimodalAsset(asset: MediaAsset): { ok: boolean; reasons: AssetValidationReason[] } {
  const reasons: AssetValidationReason[] = [];
  if (!asset.uri.trim()) reasons.push("missing_uri");
  if (!MIME_BY_MODALITY[asset.modality].includes(asset.mimeType)) reasons.push("unsupported_type");
  if ((asset.sizeBytes ?? 0) > MAX_MULTIMODAL_ASSET_BYTES) reasons.push("too_large");
  return { ok: reasons.length === 0, reasons };
}

export interface RecoveredMediaNormalization {
  assets: MediaAsset[];
  rejectedCount: number;
  truncatedCount: number;
}

export type RecoveredMediaStatus = "clean" | "filtered" | "truncated" | "filtered-and-truncated";

export interface RecoveredMediaSummary {
  status: RecoveredMediaStatus;
  restoredCount: number;
  rejectedCount: number;
  truncatedCount: number;
  hasWarnings: boolean;
  accessibilityLiveRegion: "none" | "polite";
}

export function recoveredMediaStatusFromCounts(rejectedCount: number, truncatedCount: number): RecoveredMediaStatus {
  return rejectedCount > 0 && truncatedCount > 0 ? "filtered-and-truncated" : rejectedCount > 0 ? "filtered" : truncatedCount > 0 ? "truncated" : "clean";
}

export function summarizeRecoveredMedia(recovery: RecoveredMediaNormalization): RecoveredMediaSummary {
  const rejectedCount = Number.isFinite(recovery.rejectedCount) ? Math.max(0, Math.floor(recovery.rejectedCount)) : 0;
  const truncatedCount = Number.isFinite(recovery.truncatedCount) ? Math.max(0, Math.floor(recovery.truncatedCount)) : 0;
  return {
    status: recoveredMediaStatusFromCounts(rejectedCount, truncatedCount),
    restoredCount: recovery.assets.length,
    rejectedCount,
    truncatedCount,
    hasWarnings: rejectedCount > 0 || truncatedCount > 0,
    accessibilityLiveRegion: rejectedCount > 0 || truncatedCount > 0 ? "polite" : "none",
  };
}

export interface AttachmentReviewProjection {
  restoredCount: number;
  skippedCount: number;
  truncatedCount: number;
  showRecoveryNotice: boolean;
  accessibilityLiveRegion: "none" | "polite";
}

export function projectAttachmentReview(summary: RecoveredMediaSummary): AttachmentReviewProjection {
  return {
    restoredCount: summary.restoredCount,
    skippedCount: summary.rejectedCount,
    truncatedCount: summary.truncatedCount,
    showRecoveryNotice: summary.hasWarnings,
    accessibilityLiveRegion: summary.accessibilityLiveRegion,
  };
}

export interface RecoveredMultimodalCaseNormalization {
  case: MultimodalCase | null;
  rejectedAssetCount: number;
  truncatedAssetCount: number;
  status: RecoveredMediaStatus;
}

const MODALITIES: readonly Modality[] = ["photo", "video", "audio", "text", "sensor"];
const CAPTURE_SOURCES: readonly CaptureSource[] = ["camera", "library", "microphone", "form"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalNumber(record: Record<string, unknown>, key: string, minimum: number): { valid: boolean; value?: number } {
  if (!(key in record)) return { valid: true };
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) && value >= minimum ? { valid: true, value } : { valid: false };
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

/**
 * Rehydrates only complete, supported assets after a native activity interruption.
 * Invalid entries are dropped instead of being allowed to reach upload or analysis.
 */
export function normalizeRecoveredMediaAssets(input: unknown, maxAssets = MAX_RECOVERED_MEDIA_ASSETS): RecoveredMediaNormalization {
  const candidates = Array.isArray(input) ? input : [];
  const assets: MediaAsset[] = [];
  const safeMaxAssets = Number.isFinite(maxAssets) && maxAssets >= 0 ? Math.floor(maxAssets) : MAX_RECOVERED_MEDIA_ASSETS;
  let rejectedCount = 0;
  let truncatedCount = 0;

  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      rejectedCount += 1;
      continue;
    }

    const modality = typeof candidate.modality === "string" && MODALITIES.includes(candidate.modality as Modality) ? candidate.modality as Modality : null;
    const source = typeof candidate.source === "string" && CAPTURE_SOURCES.includes(candidate.source as CaptureSource) ? candidate.source as CaptureSource : null;
    const width = readOptionalNumber(candidate, "width", 1);
    const height = readOptionalNumber(candidate, "height", 1);
    const durationMs = readOptionalNumber(candidate, "durationMs", 0);
    const sizeBytes = readOptionalNumber(candidate, "sizeBytes", 0);
    const asset: MediaAsset = {
      id: typeof candidate.id === "string" ? candidate.id.trim() : "",
      modality: modality ?? "photo",
      uri: typeof candidate.uri === "string" ? candidate.uri.trim() : "",
      mimeType: typeof candidate.mimeType === "string" ? candidate.mimeType.trim().toLowerCase() : "",
      source: source ?? "form",
      createdAt: candidate.createdAt as string,
      ...(width.value !== undefined ? { width: width.value } : {}),
      ...(height.value !== undefined ? { height: height.value } : {}),
      ...(durationMs.value !== undefined ? { durationMs: durationMs.value } : {}),
      ...(sizeBytes.value !== undefined ? { sizeBytes: sizeBytes.value } : {}),
    };

    const complete = Boolean(asset.id && modality && source && isValidIsoTimestamp(candidate.createdAt));
    if (!complete || !width.valid || !height.valid || !durationMs.valid || !sizeBytes.valid || !validateMultimodalAsset(asset).ok || assets.some((existing) => existing.uri === asset.uri)) {
      rejectedCount += 1;
      continue;
    }
    if (assets.length >= safeMaxAssets) {
      truncatedCount += 1;
      continue;
    }
    assets.push(asset);
  }

  return { assets, rejectedCount, truncatedCount };
}

export function normalizeRecoveredMultimodalCase(input: unknown, maxAssets = MAX_RECOVERED_MEDIA_ASSETS): RecoveredMultimodalCaseNormalization {
  if (!isRecord(input) || !Array.isArray(input.assets)) return { case: null, rejectedAssetCount: 0, truncatedAssetCount: 0, status: "clean" };

  const id = typeof input.id === "string" ? input.id.trim() : "";
  const petId = typeof input.petId === "string" ? input.petId.trim() : "";
  const locale = typeof input.locale === "string" ? input.locale.trim() : "";
  const createdAt = input.createdAt;
  const caseStatus = input.status;
  const validStatus = caseStatus === "draft" || caseStatus === "ready" || caseStatus === "analyzing" || caseStatus === "complete" || caseStatus === "failed";
  const userText = input.userText;
  if (!id || !petId || !locale || !isValidIsoTimestamp(createdAt) || !validStatus || (userText !== undefined && (typeof userText !== "string" || userText.length > 2000))) {
    return { case: null, rejectedAssetCount: 0, truncatedAssetCount: 0, status: "clean" };
  }

  const recovery = normalizeRecoveredMediaAssets(input.assets, maxAssets);
  const recoverySummary = summarizeRecoveredMedia(recovery);
  return {
    case: {
      id,
      petId,
      assets: recovery.assets,
      ...(userText !== undefined ? { userText } : {}),
      locale,
      createdAt,
      status: caseStatus,
    },
    rejectedAssetCount: recovery.rejectedCount,
    truncatedAssetCount: recovery.truncatedCount,
    status: recoverySummary.status,
  };
}

export interface AttachmentState {
  items: MediaAsset[];
  activeId: string | null;
}

export type AttachmentAction =
  | { type: "add"; asset: MediaAsset }
  | { type: "remove"; id: string }
  | { type: "set-active"; id: string | null };

export function attachmentReducer(state: AttachmentState, action: AttachmentAction): AttachmentState {
  if (action.type === "add") {
    if (!validateMultimodalAsset(action.asset).ok || state.items.some((item) => item.id === action.asset.id)) return state;
    return { items: [...state.items, action.asset], activeId: state.activeId ?? action.asset.id };
  }
  if (action.type === "remove") {
    const items = state.items.filter((item) => item.id !== action.id);
    return { items, activeId: state.activeId === action.id ? items[0]?.id ?? null : state.activeId };
  }
  if (action.type === "set-active") {
    return { ...state, activeId: action.id && state.items.some((item) => item.id === action.id) ? action.id : state.activeId };
  }
  return state;
}

export type AnalysisStage = "upload" | "preprocess" | "vision" | "speech" | "fusion" | "safety" | "complete";

export const ANALYSIS_STAGE_LABELS: Record<AnalysisStage, string> = {
  upload: "Secure upload",
  preprocess: "Preparing media",
  vision: "Reviewing images",
  speech: "Processing voice notes",
  fusion: "Combining your observations",
  safety: "Checking safety limits",
  complete: "Observation ready",
};

export function stageIsReached(current: AnalysisStage, candidate: AnalysisStage): boolean {
  return Object.keys(ANALYSIS_STAGE_LABELS).indexOf(candidate) <= Object.keys(ANALYSIS_STAGE_LABELS).indexOf(current);
}

export function mapMultimodalUrgency(signals: { severe: boolean; rapidChange: boolean; distress: boolean }): "routine" | "prompt" | "urgent" {
  if (signals.severe || signals.distress) return "urgent";
  if (signals.rapidChange) return "prompt";
  return "routine";
}

export function multimodalSafetyGate(text: string): { ok: boolean; reason?: "unsafe_language" } {
  return /diagnos(?:e|is|ed)|prescribe|guarantee/i.test(text) ? { ok: false, reason: "unsafe_language" } : { ok: true };
}
