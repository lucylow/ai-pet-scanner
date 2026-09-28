export type BuildChannel = "development" | "preview" | "production";
export type Severity = "normal" | "watch" | "prompt-vet" | "urgent";
export type Confidence = "low" | "medium" | "high";
export type ScanArea = "skin" | "eye" | "teeth" | "ear" | "paw" | "general";
export type QualityIssue = "too-small" | "too-dark" | "too-bright" | "blurred" | "obstructed";

export interface AppEnv { apiBaseUrl: string; sentryDsn?: string; buildChannel: BuildChannel; }
export const env: AppEnv = { apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000", sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined, buildChannel: ((process.env.APP_ENV || "development") as BuildChannel) };
export const isProd = env.buildChannel === "production";

export interface Finding { label: string; severity: Severity; confidence: Confidence; evidence: string[]; limitations: string[]; }
export interface AnalysisResult { version: string; scanId: string; overall: Severity; confidence: Confidence; findings: Finding[]; imageQuality: { usable: boolean; issues: string[] }; nextSteps: string[]; emergencyWarning: boolean; generatedAt: string; }

export interface QualityResult { usable: boolean; score: number; issues: QualityIssue[]; }
export function scoreMedia(meta: { width: number; height: number; brightness: number; blur: number; obstruction: number }): QualityResult {
  const issues: QualityIssue[] = [];
  if (Math.min(meta.width, meta.height) < 720) issues.push("too-small");
  if (meta.brightness < 0.12) issues.push("too-dark");
  if (meta.brightness > 0.92) issues.push("too-bright");
  if (meta.blur < 0.35) issues.push("blurred");
  if (meta.obstruction > 0.55) issues.push("obstructed");
  const score = Math.max(0, 1 - issues.length * 0.18);
  return { usable: score >= 0.55 && !issues.includes("too-small"), score, issues };
}

export interface CaptureGuide { title: string; instructions: string[]; minPhotos: number; allowVideo: boolean; }
export function getGuide(area: ScanArea): CaptureGuide {
  const guides: Record<ScanArea, CaptureGuide> = {
    skin: { title: "Skin", instructions: ["Use bright indirect light", "Keep fur parted", "Fill the frame"], minPhotos: 1, allowVideo: true },
    eye: { title: "Eye", instructions: ["Keep the face steady", "Avoid flash reflections", "Stop if your pet resists"], minPhotos: 1, allowVideo: true },
    teeth: { title: "Teeth", instructions: ["Lift the lip gently", "Do not force the mouth open", "Stop if your pet resists"], minPhotos: 1, allowVideo: true },
    ear: { title: "Ear", instructions: ["Capture only what is safe to see", "Do not insert anything into the ear"], minPhotos: 1, allowVideo: false },
    paw: { title: "Paw", instructions: ["Show pads and nails", "Use stable lighting"], minPhotos: 1, allowVideo: true },
    general: { title: "General", instructions: ["Capture the concern clearly", "Add context in notes"], minPhotos: 1, allowVideo: true },
  };
  return guides[area];
}

export type SafetyAction = "show-normal" | "show-watch" | "contact-vet" | "urgent-care" | "cannot-assess";
export interface SafetyDecision { action: SafetyAction; reasons: string[]; copy: string; }
export function decideSafety(result: AnalysisResult): SafetyDecision {
  if (!result.imageQuality.usable) return { action: "cannot-assess", reasons: result.imageQuality.issues, copy: "The images were not clear enough for a reliable observation." };
  if (result.emergencyWarning || result.overall === "urgent") return { action: "urgent-care", reasons: ["urgent safety signal"], copy: "Seek urgent veterinary care now." };
  if (result.overall === "prompt-vet") return { action: "contact-vet", reasons: ["professional evaluation recommended"], copy: "Contact your veterinarian for an in-person assessment." };
  if (result.overall === "watch") return { action: "show-watch", reasons: ["monitoring recommended"], copy: "Monitor the area and arrange veterinary advice if it worsens." };
  return { action: "show-normal", reasons: [], copy: "No obvious concern was detected from these images; this is not a diagnosis." };
}
