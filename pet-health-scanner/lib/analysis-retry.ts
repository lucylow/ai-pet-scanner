import type { SharedAnalysisRequest, SharedSafeAnalysisResult } from "../shared/pet-scanner-contracts";

export type AnalysisMutationClient = {
  analysis: {
    request: {
      mutate: (request: SharedAnalysisRequest) => Promise<SharedSafeAnalysisResult>;
    };
  };
};

export function isRetryableAnalysisFailure(error: unknown): boolean {
  const candidate = error as { retryable?: boolean; data?: { code?: string }; status?: number } | null;
  const code = candidate?.data?.code;
  const status = candidate?.status;
  return Boolean(candidate?.retryable) || code === "TIMEOUT" || code === "INTERNAL_SERVER_ERROR" || code === "TOO_MANY_REQUESTS" || status === 408 || status === 429 || (typeof status === "number" && status >= 500);
}

export async function requestAnalysisWithRetry(
  client: AnalysisMutationClient,
  request: SharedAnalysisRequest,
  signal?: AbortSignal,
): Promise<SharedSafeAnalysisResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await client.analysis.request.mutate(request);
    } catch (error) {
      if (attempt === 0 && isRetryableAnalysisFailure(error) && !signal?.aborted) continue;
      throw error;
    }
  }
  throw new Error("Analysis retry did not produce a result.");
}

export const isRetryableScanError = isRetryableAnalysisFailure;
