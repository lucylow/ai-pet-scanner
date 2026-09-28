import { invokeLLM } from "./_core/llm";
import { failClosedVisionResult, PET_SCANNER_SYSTEM_PROMPT, safeVisionResultSchema } from "./pet-scanner-contract";
import type { z } from "zod";
import { normalizeSafeAnalysisResult, type SharedAnalysisLanguage, type SharedAnalysisRequest } from "../shared/pet-scanner-contracts";

export type VisionInput = SharedAnalysisRequest;

const analysisLanguageNames: Record<SharedAnalysisLanguage, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
  nl: "Dutch",
  ja: "Japanese",
  ko: "Korean",
  "zh-Hans": "Simplified Chinese",
  ar: "Arabic",
};
export type SafeVisionResult = z.infer<typeof safeVisionResultSchema>;

const outputSchema = {
  type: "object",
  properties: {
    version: { type: "string" },
    scanId: { type: "string" },
    overall: { type: "string", enum: ["normal", "watch", "prompt-vet", "urgent"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    findings: { type: "array", items: { type: "object", properties: { label: { type: "string" }, severity: { type: "string" }, confidence: { type: "string" }, evidence: { type: "array", items: { type: "string" } }, limitations: { type: "array", items: { type: "string" } } }, required: ["label", "severity", "confidence", "evidence", "limitations"], additionalProperties: false } },
    imageQuality: { type: "object", properties: { usable: { type: "boolean" }, issues: { type: "array", items: { type: "string" } } }, required: ["usable", "issues"], additionalProperties: false },
    emergencyWarning: { type: "boolean" },
    nextSteps: { type: "array", items: { type: "string" } },
    generatedAt: { type: "string" },
  },
  required: ["version", "scanId", "overall", "confidence", "findings", "imageQuality", "emergencyWarning", "nextSteps", "generatedAt"],
  additionalProperties: false,
} as const;

export async function analyzePetImages(input: VisionInput): Promise<SafeVisionResult> {
  try {
    const response = await invokeLLM({ model: "gemini-3-flash-preview", messages: [{ role: "system", content: PET_SCANNER_SYSTEM_PROMPT }, { role: "user", content: [{ type: "text", text: `Pet species: ${input.species}. Body area: ${input.area}. Context: ${input.context ?? "None provided"}. Return a cautious, non-diagnostic observation summary for scan ${input.scanId}. Write generated prose fields, including labels, evidence, limitations, image-quality issues, and next steps, in ${analysisLanguageNames[input.language]}. Keep the scan ID exact and do not add translations, diagnoses, measurements, or claims of certainty.` }, ...input.imageUrls.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "auto" as const } }))] }], response_format: { type: "json_schema", json_schema: { name: "safe_pet_observation", strict: true, schema: outputSchema } } });
    const content = response.choices?.[0]?.message?.content;
    const raw = typeof content === "string" ? JSON.parse(content) : null;
    const parsed = safeVisionResultSchema.safeParse(raw);
    if (!parsed.success) return failClosedVisionResult(input.scanId, "The model returned an invalid safety response.", input.language);
    return normalizeSafeAnalysisResult(parsed.data);
  } catch {
    return failClosedVisionResult(input.scanId, "The analysis service is temporarily unavailable.", input.language);
  }
}
