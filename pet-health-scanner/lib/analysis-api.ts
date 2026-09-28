import type { AnalysisResult } from "@/lib/scanner-contracts";

export type AnalysisRequest = {
  petId: string;
  bodyArea: string;
  imageUri: string;
  context?: Record<string, string | undefined>;
};

export type AnalysisApiErrorCode = "TIMEOUT" | "ABORTED" | "NETWORK" | "SERVER" | "INVALID_RESPONSE";

export class AnalysisApiError extends Error {
  constructor(public readonly code: AnalysisApiErrorCode, message: string, public readonly retryable = true) {
    super(message);
    this.name = "AnalysisApiError";
  }
}

export async function requestServerAnalysis(request: AnalysisRequest, options: { endpoint: string; signal?: AbortSignal; timeoutMs?: number; fetchImpl?: typeof fetch }): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await (options.fetchImpl ?? fetch)(options.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: controller.signal });
    if (!response.ok) throw new AnalysisApiError("SERVER", `Analysis service returned ${response.status}.`, response.status >= 500);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("status" in payload)) throw new AnalysisApiError("INVALID_RESPONSE", "Analysis service returned an invalid response.", false);
    return payload as unknown as AnalysisResult;
  } catch (error) {
    if (error instanceof AnalysisApiError) throw error;
    if (options.signal?.aborted) throw new AnalysisApiError("ABORTED", "Analysis was cancelled.", false);
    if (error instanceof DOMException && error.name === "AbortError") throw new AnalysisApiError("TIMEOUT", "Analysis took too long. Try again with a clearer photo.", true);
    throw new AnalysisApiError("NETWORK", "The analysis service is unavailable. Check your connection and try again.", true);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
