import { z } from "zod";

export const subscriptionStateSchema = z.object({ plan: z.enum(["free", "plus", "pro"]), entitlements: z.array(z.enum(["advancedAI", "videoScan", "pdfExport", "trends", "familyPets"])), renewsAt: z.string().optional(), willCancel: z.boolean().optional() });
export type SharedSubscriptionState = z.infer<typeof subscriptionStateSchema>;

export const analysisLanguageSchema = z.enum(["en", "fr", "es", "de", "pt", "it", "nl", "ja", "ko", "zh-Hans", "ar"]);
export const MAX_ANALYSIS_IMAGES = 4;
export type SharedAnalysisLanguage = z.infer<typeof analysisLanguageSchema>;

export const analysisRequestSchema = z.object({ scanId: z.string().min(1), area: z.string().min(1), imageUrls: z.array(z.string().url()).min(1).max(MAX_ANALYSIS_IMAGES), species: z.enum(["dog", "cat"]), language: analysisLanguageSchema.default("en"), context: z.string().max(2000).optional() });
export type SharedAnalysisRequest = z.infer<typeof analysisRequestSchema>;

export const safeAnalysisResultSchema = z.object({ version: z.string(), scanId: z.string(), overall: z.enum(["normal", "watch", "prompt-vet", "urgent"]), confidence: z.enum(["low", "medium", "high"]), findings: z.array(z.object({ label: z.string(), severity: z.string(), confidence: z.string(), evidence: z.array(z.string()), limitations: z.array(z.string()) })), imageQuality: z.object({ usable: z.boolean(), issues: z.array(z.string()) }), emergencyWarning: z.boolean(), nextSteps: z.array(z.string()), generatedAt: z.string().datetime({ offset: true }), qualityReason: z.enum(["unusable-image", "insufficient-evidence"]).optional() });
export type SharedSafeAnalysisResult = z.infer<typeof safeAnalysisResultSchema>;

function normalizeConfidenceToken(value: string): string {
  const token = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (token === "high") return "high";
  if (token === "medium" || token === "moderate") return "medium";
  return "low";
}

function normalizeSeverityToken(value: string): string {
  const token = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (token === "urgent" || token === "emergency") return "urgent";
  if (token === "promptvet" || token === "veterinaryreview") return "prompt-vet";
  if (token === "normal") return "normal";
  return "watch";
}

export function normalizeSafeAnalysisResult(result: SharedSafeAnalysisResult): SharedSafeAnalysisResult {
  const imageQuality = { ...result.imageQuality, issues: result.imageQuality.issues.map((issue) => issue.trim()).filter(Boolean) };
  const unusableImage = !imageQuality.usable;
  const normalizedFindings = result.findings
    .map((finding) => ({
      ...finding,
      label: finding.label.trim(),
      severity: normalizeSeverityToken(finding.severity),
      confidence: normalizeConfidenceToken(finding.confidence),
      evidence: finding.evidence.map((item) => item.trim()).filter(Boolean),
      limitations: finding.limitations.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((finding) => finding.label.length > 0 && finding.evidence.length > 0 && finding.limitations.length > 0);
  const findings = unusableImage ? [] : normalizedFindings;
  const nextSteps = result.nextSteps.map((step) => step.trim()).filter(Boolean);
  const lowEvidence = unusableImage || findings.length === 0 || nextSteps.length === 0;
  const qualityReason = unusableImage ? "unusable-image" as const : lowEvidence ? "insufficient-evidence" as const : undefined;
  return {
    ...result,
    findings,
    nextSteps,
    imageQuality,
    confidence: lowEvidence ? "low" : result.confidence,
    overall: lowEvidence && result.overall === "normal" ? "watch" : result.overall,
    emergencyWarning: lowEvidence ? false : result.emergencyWarning,
    ...(qualityReason ? { qualityReason } : {}),
  };
}

export const mediaUploadInputSchema = z.object({ fileName: z.string().min(1).max(120).regex(/^[a-zA-Z0-9._-]+$/), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), byteLength: z.number().int().positive().max(10 * 1024 * 1024) });
export type SharedMediaUploadInput = z.infer<typeof mediaUploadInputSchema>;
