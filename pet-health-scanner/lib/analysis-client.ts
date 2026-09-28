import { analysisRequestSchema, safeAnalysisResultSchema, type SharedAnalysisRequest, type SharedSafeAnalysisResult } from "../shared/pet-scanner-contracts";
import { AnalysisApiError } from "./analysis-api";
import { normalizeSafeAnalysisResult } from "../shared/pet-scanner-contracts";

export async function requestTypedAnalysis(input: SharedAnalysisRequest, options: { endpoint: string; token?: string | null; fetchImpl?: typeof fetch; signal?: AbortSignal }): Promise<SharedSafeAnalysisResult> {
  const request = analysisRequestSchema.parse(input);
  const response = await (options.fetchImpl ?? fetch)(options.endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, credentials: options.token ? undefined : "include", body: JSON.stringify(request), signal: options.signal });
  if (response.status === 401 || response.status === 403) throw new AnalysisApiError("SERVER", "Sign in to request server analysis.", false);
  if (!response.ok) throw new AnalysisApiError("SERVER", "Server analysis is temporarily unavailable.", response.status >= 500);
  const parsed = safeAnalysisResultSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.scanId !== request.scanId) {
    throw new AnalysisApiError("INVALID_RESPONSE", "Server analysis returned an invalid safety response.", false);
  }
  return normalizeSafeAnalysisResult(parsed.data);
}
