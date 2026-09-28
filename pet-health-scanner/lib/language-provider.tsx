import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { initializeLanguage, i18n, languageDirection, saveLanguage, type LanguageCode } from "@/lib/i18n-language";

interface LanguageContextValue {
  language: LanguageCode;
  direction: "ltr" | "rtl";
  saving: boolean;
  error: string | null;
  setLanguage: (next: LanguageCode) => Promise<boolean>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setCurrentLanguage] = useState<LanguageCode>("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changeInFlight = useRef(false);

  useEffect(() => {
    let mounted = true;
    void initializeLanguage().then((next) => {
      if (mounted) setCurrentLanguage(next);
    }).catch(() => {
      if (mounted) setError("language.loadingError");
    });
    return () => { mounted = false; };
  }, []);

  const setLanguage = useCallback(async (next: LanguageCode) => {
    if (next === language || changeInFlight.current) return true;
    const previous = language;
    changeInFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      await i18n.changeLanguage(next);
      await saveLanguage(next);
      setCurrentLanguage(next);
      return true;
    } catch {
      await i18n.changeLanguage(previous).catch(() => undefined);
      setError("language.saveError");
      return false;
    } finally {
      changeInFlight.current = false;
      setSaving(false);
    }
  }, [language]);

  const direction = languageDirection(language);
  const value = useMemo(() => ({ language, direction, saving, error, setLanguage }), [language, direction, saving, error, setLanguage]);
  return <LanguageContext.Provider value={value}><View style={{ flex: 1, direction }}>{children}</View></LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
