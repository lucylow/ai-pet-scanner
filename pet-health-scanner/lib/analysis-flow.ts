export type ScanFailureStage = "upload" | "analysis" | "local-save" | "cancelled";

export type AnalysisFlowState =
  | { status: "idle" }
  | { status: "uploading"; attempt: number }
  | { status: "analyzing"; attempt: number }
  | { status: "success"; scanId: string }
  | { status: "error"; message: string; retryable: boolean; attempt: number; stage: ScanFailureStage };

export type ScanStage = "photo" | "uploading" | "analyzing" | "saved" | "error";

export function scanStageLabel(stage: ScanStage): string {
  return stage === "photo" ? "Photo ready" : stage === "uploading" ? "Secure upload" : stage === "analyzing" ? "Cautious review" : stage === "saved" ? "Observation saved" : "Draft preserved";
}

export function scanStageAccessibilityLabel(stage: ScanStage, active: boolean): string {
  return `${scanStageLabel(stage)}, ${active ? "current" : "not current"}`;
}

export type AnalysisFlowEvent =
  | { type: "START"; attempt?: number }
  | { type: "UPLOADED"; attempt?: number }
  | { type: "SUCCESS"; scanId: string }
  | { type: "FAIL"; message: string; retryable?: boolean; attempt?: number; stage?: ScanFailureStage }
  | { type: "CANCEL" }
  | { type: "RETRY" };

export function reduceAnalysisFlow(state: AnalysisFlowState, event: AnalysisFlowEvent): AnalysisFlowState {
  switch (event.type) {
    case "START": return { status: "uploading", attempt: event.attempt ?? 1 };
    case "UPLOADED": return { status: "analyzing", attempt: event.attempt ?? (state.status === "uploading" ? state.attempt : 1) };
    case "SUCCESS": return { status: "success", scanId: event.scanId };
    case "FAIL": return { status: "error", message: event.message, retryable: event.retryable ?? true, attempt: event.attempt ?? ("attempt" in state ? state.attempt : 1), stage: event.stage ?? "analysis" };
    case "CANCEL": return { status: "idle" };
    case "RETRY": return state.status === "error" && state.retryable && state.attempt < 3 ? { status: "uploading", attempt: state.attempt + 1 } : state;
    default: return state;
  }
}

export function analysisStatusCopy(state: AnalysisFlowState) {
  if (state.status === "uploading") return "Preparing your photo securely…";
  if (state.status === "analyzing") return "Reviewing visible evidence cautiously…";
  if (state.status === "error") return state.attempt >= 3 && state.retryable ? `${state.message} Retry limit reached; review the saved draft or try again later.` : state.message;
  if (state.status === "success") return "Observation ready.";
  return "Ready when you are.";
}

export function analysisAttemptLabel(state: AnalysisFlowState): string | null {
  if (state.status !== "uploading" && state.status !== "analyzing" && state.status !== "error") return null;
  const remaining = Math.max(0, 3 - state.attempt);
  return state.attempt >= 3 ? "Final attempt used; the saved draft remains available." : `Attempt ${state.attempt} of 3. ${remaining} retr${remaining === 1 ? "y" : "ies"} remaining if needed.`;
}

export function analysisStatusAccessibilityHint(state: AnalysisFlowState): string {
  if (state.status === "uploading") return "The photo is being uploaded securely. You can cancel and keep the unfinished draft on this device.";
  if (state.status === "analyzing") return "The server is reviewing visible evidence cautiously. You can cancel and keep the unfinished draft on this device.";
  if (state.status === "error") return state.retryable ? `${analysisAttemptLabel(state) ?? ""} You can try again safely; the photo and notes remain saved locally.` : "No observation result was created; your photo and notes remain saved locally.";
  if (state.status === "success") return "The observation is ready to review and is not a diagnosis.";
  return "The scan is ready to begin.";
}
