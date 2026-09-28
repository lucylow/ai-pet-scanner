import { completePresignedMediaUpload, MediaUploadError, uploadPetMedia, type MediaUploadError as MediaUploadErrorType, type UploadableMedia } from "./media-upload";
import { createTRPCClient } from "./trpc";
import { getApiBaseUrl } from "../constants/oauth";
import { requestTypedAnalysis } from "./analysis-client";
import { requestAnalysisWithRetry } from "./analysis-retry";
export { isRetryableAnalysisFailure as isRetryableScanError, requestAnalysisWithRetry as requestTrpcAnalysisWithRetry } from "./analysis-retry";
import { MAX_ANALYSIS_IMAGES, type SharedAnalysisRequest, type SharedSafeAnalysisResult } from "../shared/pet-scanner-contracts";

export type ScanOrchestrationOptions = { uploadEndpoint: string; analysisEndpoint: string; token?: string | null; fetchImpl?: typeof fetch; signal?: AbortSignal; onStage?: (stage: "uploading" | "analyzing") => void };
export type TrpcScanOptions = { client?: ReturnType<typeof createTRPCClient>; fetchImpl?: typeof fetch; signal?: AbortSignal; onStage?: (stage: "uploading" | "analyzing") => void };
export type RemoteScanBatchResult = { analysis: SharedSafeAnalysisResult; mediaUrls: string[]; mediaKeys: string[] };

function requireMediaBatch(media: readonly UploadableMedia[]): UploadableMedia[] {
  if (media.length < 1) throw new MediaUploadError("INVALID_MEDIA", "Choose at least one photo before continuing.", false);
  if (media.length > MAX_ANALYSIS_IMAGES) throw new MediaUploadError("INVALID_MEDIA", `Choose no more than ${MAX_ANALYSIS_IMAGES} photos.`, false);
  return [...media];
}

export async function runRemoteScan(media: UploadableMedia, request: Omit<SharedAnalysisRequest, "imageUrls">, options: ScanOrchestrationOptions): Promise<SharedSafeAnalysisResult> {
  options.onStage?.("uploading");
  const uploaded = await uploadPetMedia(media, { endpoint: options.uploadEndpoint, token: options.token, fetchImpl: options.fetchImpl });
  if (options.signal?.aborted) throw new DOMException("Scan cancelled", "AbortError");
  options.onStage?.("analyzing");
  return requestTypedAnalysis({ ...request, imageUrls: [uploaded.url] }, { endpoint: options.analysisEndpoint, token: options.token, fetchImpl: options.fetchImpl, signal: options.signal });
}

export async function runRemoteScanViaTrpcBatch(media: readonly UploadableMedia[], request: Omit<SharedAnalysisRequest, "imageUrls">, options: TrpcScanOptions): Promise<RemoteScanBatchResult> {
  const batch = requireMediaBatch(media);
  const client = options.client ?? createTRPCClient();
  options.onStage?.("uploading");
  const uploaded: Array<{ url: string; key: string }> = [];
  for (const item of batch) {
    const fileName = item.fileName ?? `pet-scan-${Date.now()}.jpg`;
    const mimeType = item.mimeType === "image/png" || item.mimeType === "image/webp" ? item.mimeType : "image/jpeg";
    const byteLength = item.size ?? 1;
    const prepared = await client.media.prepare.mutate({ fileName, mimeType, byteLength });
    uploaded.push(await completePresignedMediaUpload(item, prepared, { fetchImpl: options.fetchImpl, signal: options.signal }));
    if (options.signal?.aborted) throw new DOMException("Scan cancelled", "AbortError");
  }
  options.onStage?.("analyzing");
  const imageUrls = uploaded.map((item) => new URL(item.url, getApiBaseUrl()).toString());
  const analysis = await requestAnalysisWithRetry(client, { ...request, imageUrls }, options.signal);
  return { analysis, mediaUrls: uploaded.map((item) => item.url), mediaKeys: uploaded.map((item) => item.key) };
}

export async function runRemoteScanViaTrpc(media: UploadableMedia, request: Omit<SharedAnalysisRequest, "imageUrls">, options: TrpcScanOptions): Promise<{ analysis: SharedSafeAnalysisResult; mediaUrl: string; mediaKey: string }> {
  const result = await runRemoteScanViaTrpcBatch([media], request, options);
  return { analysis: result.analysis, mediaUrl: result.mediaUrls[0], mediaKey: result.mediaKeys[0] };
}
