import type { LanguageCode } from "./i18n-language";

const localeByLanguage: Record<LanguageCode, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  pt: "pt-PT",
  it: "it-IT",
  nl: "nl-NL",
  ja: "ja-JP",
  ko: "ko-KR",
  "zh-Hans": "zh-CN",
  ar: "ar",
};

export function formatLocalizedDateTime(value: string, language: LanguageCode, fallback = "Date unavailable"): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat(localeByLanguage[language], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return fallback;
  }
}
