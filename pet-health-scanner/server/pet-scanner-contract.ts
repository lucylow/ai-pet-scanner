import { analysisRequestSchema, safeAnalysisResultSchema, type SharedAnalysisLanguage } from "../shared/pet-scanner-contracts";

export const visionInputSchema = analysisRequestSchema;

export const safeVisionResultSchema = safeAnalysisResultSchema;

export const PET_SCANNER_SYSTEM_PROMPT = `You are a veterinary-support vision assistant. You are not a veterinarian. Analyze only visible evidence in supplied pet images. Never diagnose, prescribe, invent measurements, claim certainty, or claim that a veterinarian reviewed the result. If image quality is limited, set imageQuality.usable=false. Return only the requested structured JSON. Include limitations in every finding and prioritize safe next steps over labels.`;

const failClosedIssue: Record<SharedAnalysisLanguage, string> = {
  en: "The image could not be safely assessed.",
  fr: "L’image n’a pas pu être évaluée en toute sécurité.",
  es: "La imagen no pudo evaluarse de forma segura.",
  de: "Das Bild konnte nicht sicher beurteilt werden.",
  pt: "Não foi possível avaliar a imagem com segurança.",
  it: "Non è stato possibile valutare l’immagine in modo sicuro.",
  nl: "De afbeelding kon niet veilig worden beoordeeld.",
  ja: "画像を安全に評価できませんでした。",
  ko: "이미지를 안전하게 평가할 수 없습니다.",
  "zh-Hans": "无法安全评估这张图片。",
  ar: "تعذّر تقييم الصورة بأمان.",
};

const failClosedUnavailableIssue: Record<SharedAnalysisLanguage, string> = {
  en: "The analysis service is temporarily unavailable.",
  fr: "Le service d’analyse est temporairement indisponible.",
  es: "El servicio de análisis no está disponible temporalmente.",
  de: "Der Analysedienst ist vorübergehend nicht verfügbar.",
  pt: "O serviço de análise está temporariamente indisponível.",
  it: "Il servizio di analisi è temporaneamente non disponibile.",
  nl: "De analysedienst is tijdelijk niet beschikbaar.",
  ja: "分析サービスは一時的に利用できません。",
  ko: "분석 서비스를 일시적으로 사용할 수 없습니다.",
  "zh-Hans": "分析服务暂时不可用。",
  ar: "خدمة التحليل غير متاحة مؤقتًا.",
};

const failClosedInvalidIssue: Record<SharedAnalysisLanguage, string> = {
  en: "The model returned an invalid safety response.",
  fr: "Le modèle a renvoyé une réponse de sécurité invalide.",
  es: "El modelo devolvió una respuesta de seguridad no válida.",
  de: "Das Modell hat eine ungültige Sicherheitsantwort zurückgegeben.",
  pt: "O modelo devolveu uma resposta de segurança inválida.",
  it: "Il modello ha restituito una risposta di sicurezza non valida.",
  nl: "Het model gaf een ongeldige veiligheidsreactie terug.",
  ja: "モデルが無効な安全応答を返しました。",
  ko: "모델이 유효하지 않은 안전 응답을 반환했습니다.",
  "zh-Hans": "模型返回了无效的安全响应。",
  ar: "أعاد النموذج استجابة أمان غير صالحة.",
};

const failClosedNextStep: Record<SharedAnalysisLanguage, string> = {
  en: "Retake the image in bright indirect light or contact a veterinarian if you are concerned.",
  fr: "Reprenez la photo avec une lumière indirecte vive ou contactez un vétérinaire si vous êtes inquiet.",
  es: "Vuelve a tomar la foto con luz indirecta intensa o contacta a un veterinario si te preocupa algo.",
  de: "Nehmen Sie das Bild bei hellem, indirektem Licht erneut auf oder wenden Sie sich bei Bedenken an eine Tierarztpraxis.",
  pt: "Tire outra foto com luz indireta forte ou contacte um veterinário se estiver preocupado.",
  it: "Scatta di nuovo la foto con una luce indiretta intensa oppure contatta un veterinario se sei preoccupato.",
  nl: "Maak de foto opnieuw bij helder, indirect licht of neem bij zorgen contact op met een dierenarts.",
  ja: "明るい間接光でもう一度撮影するか、心配な場合は獣医師に相談してください。",
  ko: "밝은 간접 조명에서 사진을 다시 찍거나 걱정되는 경우 수의사에게 문의하세요.",
  "zh-Hans": "请在明亮的间接光下重新拍照；如果你感到担忧，请联系兽医。",
  ar: "أعد التقاط الصورة في ضوء ساطع وغير مباشر، أو تواصل مع طبيب بيطري إذا كنت قلقًا.",
};

export function failClosedVisionResult(scanId: string, issue = "The image could not be safely assessed.", language: SharedAnalysisLanguage = "en") {
  const safeLanguage = failClosedNextStep[language] ? language : "en";
  const issueText = issue.includes("temporarily unavailable") ? failClosedUnavailableIssue[safeLanguage] : issue.includes("invalid safety response") ? failClosedInvalidIssue[safeLanguage] : failClosedIssue[safeLanguage];
  return { version: "1", scanId, overall: "watch" as const, confidence: "low" as const, findings: [], imageQuality: { usable: false, issues: [issueText] }, emergencyWarning: false, nextSteps: [failClosedNextStep[safeLanguage]], generatedAt: new Date().toISOString() };
}
