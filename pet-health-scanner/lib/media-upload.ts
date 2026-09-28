import { MAX_ANALYSIS_IMAGES } from "../shared/pet-scanner-contracts";

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_SCAN_PHOTOS = MAX_ANALYSIS_IMAGES;

export type ImagePickerOutcome = "cancelled" | "missing-asset" | "selected";

export function classifyImagePickerOutcome(result: { canceled: boolean; assets?: readonly { uri?: string | null }[] | null }): ImagePickerOutcome {
  if (result.canceled) return "cancelled";
  return result.assets?.[0]?.uri?.trim() ? "selected" : "missing-asset";
}

export type UploadableMedia = { uri: string; mimeType?: string | null; size?: number | null; fileName?: string | null };
export type ImagePickerAssetLike = { uri?: string | null; mimeType?: string | null; fileSize?: number | null; fileName?: string | null; width?: number; height?: number };

export function normalizeSelectedMediaAssets(assets: readonly ImagePickerAssetLike[], maxPhotos = MAX_SCAN_PHOTOS): { media: Array<{ uri: string; mimeType: (typeof ACCEPTED_MEDIA_TYPES)[number]; fileSize?: number; fileName: string; width?: number; height?: number }>; rejectedCount: number; truncatedCount: number; firstError?: string } {
  const media: Array<{ uri: string; mimeType: (typeof ACCEPTED_MEDIA_TYPES)[number]; fileSize?: number; fileName: string; width?: number; height?: number }> = [];
  let rejectedCount = 0;
  let truncatedCount = 0;
  let firstError: string | undefined;
  for (const asset of assets) {
    const normalized = normalizeSelectedMedia(asset);
    if (!normalized.media) {
      rejectedCount += 1;
      firstError ??= normalized.message;
      continue;
    }
    if (media.some((item) => item.uri === normalized.media?.uri)) continue;
    if (media.length >= maxPhotos) {
      truncatedCount += 1;
      continue;
    }
    media.push({ uri: normalized.media.uri, mimeType: normalized.media.mimeType, fileSize: normalized.media.size, fileName: normalized.media.fileName, width: asset.width, height: asset.height });
  }
  return { media, rejectedCount, truncatedCount, firstError };
}

export function normalizeSelectedMedia(asset: ImagePickerAssetLike): { media: { uri: string; mimeType: (typeof ACCEPTED_MEDIA_TYPES)[number]; size?: number; fileName: string } | null; message?: string } {
  const uri = asset.uri?.trim();
  if (!uri) return { media: null, message: "The selected item could not be read. Choose a photo again." };
  const fileName = asset.fileName ?? uri.split("/").pop() ?? "pet-photo.jpg";
  const extension = fileName.toLowerCase().split(".").pop();
  const inferred = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : null;
  const mimeType = (asset.mimeType ?? inferred) as (typeof ACCEPTED_MEDIA_TYPES)[number] | null;
  if (!mimeType || !(ACCEPTED_MEDIA_TYPES as readonly string[]).includes(mimeType)) return { media: null, message: "Use a JPEG, PNG, or WebP photo so the scan can review it safely." };
  if (asset.fileSize != null && asset.fileSize > MAX_MEDIA_BYTES) return { media: null, message: "Choose a photo smaller than 10 MB." };
  return { media: { uri, mimeType, size: asset.fileSize ?? undefined, fileName } };
}

export class MediaUploadError extends Error {
  constructor(public readonly code: "INVALID_MEDIA" | "UNAUTHORIZED" | "NETWORK" | "SERVER", message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "MediaUploadError";
  }
}

export function validateMediaForUpload(media: UploadableMedia): void {
  if (!media.uri) throw new MediaUploadError("INVALID_MEDIA", "Choose a photo before continuing.", false);
  if (!media.mimeType || !(ACCEPTED_MEDIA_TYPES as readonly string[]).includes(media.mimeType)) throw new MediaUploadError("INVALID_MEDIA", "Use a JPEG, PNG, or WebP photo.", false);
  if (media.size != null && media.size > MAX_MEDIA_BYTES) throw new MediaUploadError("INVALID_MEDIA", "Choose a photo smaller than 10 MB.", false);
}

export async function completePresignedMediaUpload(media: UploadableMedia, prepared: { uploadUrl: string; url: string; key: string; contentType: string }, options: { fetchImpl?: typeof fetch; signal?: AbortSignal }): Promise<{ url: string; key: string }> {
  validateMediaForUpload(media);
  const fetchImpl = options.fetchImpl ?? fetch;
  const source = await fetchImpl(media.uri, { signal: options.signal });
  if (!source.ok) throw new MediaUploadError("NETWORK", "The selected photo could not be read. Choose it again and retry.", true);
  const response = await fetchImpl(prepared.uploadUrl, { method: "PUT", headers: { "Content-Type": prepared.contentType }, body: await source.blob(), signal: options.signal });
  if (!response.ok) throw new MediaUploadError("SERVER", "Secure photo storage failed. You can retry without losing your scan notes.", response.status >= 500);
  return { key: prepared.key, url: prepared.url };
}

export async function uploadPetMedia(media: UploadableMedia, options: { endpoint: string; token?: string | null; fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<{ url: string; key: string }> {
  validateMediaForUpload(media);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  try {
    const body = new FormData();
    body.append("file", { uri: media.uri, type: media.mimeType, name: media.fileName ?? "pet-photo.jpg" } as unknown as Blob);
    const response = await (options.fetchImpl ?? fetch)(options.endpoint, { method: "POST", headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined, credentials: options.token ? undefined : "include", body, signal: controller.signal });
    if (response.status === 401 || response.status === 403) throw new MediaUploadError("UNAUTHORIZED", "Sign in to securely upload this photo.", false);
    if (!response.ok) throw new MediaUploadError("SERVER", "Photo upload failed. You can retry without losing your scan notes.", response.status >= 500);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("url" in payload) || !("key" in payload) || typeof payload.url !== "string" || typeof payload.key !== "string") throw new MediaUploadError("SERVER", "The upload response was invalid.", false);
    return payload as { url: string; key: string };
  } catch (error) {
    if (error instanceof MediaUploadError) throw error;
    throw new MediaUploadError("NETWORK", "Check your connection and retry the photo upload.", true);
  } finally {
    clearTimeout(timeout);
  }
}
