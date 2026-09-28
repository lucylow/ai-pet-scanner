import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ENGLISH_CORE_COPY, LANGUAGE_OPTIONS } from "@/lib/i18n-language";
import { useLanguage } from "@/lib/language-provider";

export function LanguagePicker() {
  const { language, saving, error, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  return <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
    <Text className="text-sm leading-5 text-muted">{copy("language.choose")}</Text>
    <View style={{ gap: 6 }}>
      {LANGUAGE_OPTIONS.map((option) => {
        const selected = option.code === language;
        return <Pressable key={option.code} disabled={saving} accessibilityRole="radio" accessibilityLabel={`${option.nativeName}, ${option.englishName}${selected ? `, ${copy("language.selected")}` : ""}`} accessibilityHint={copy("language.choose")} accessibilityState={{ selected, disabled: saving, busy: saving }} onPress={() => void setLanguage(option.code)} style={({ pressed }) => [{ borderWidth: 1, borderColor: selected ? "#2F765F" : "#D5DED8", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, opacity: saving ? 0.55 : pressed ? 0.7 : 1 }]}>
          <Text className="font-semibold text-foreground">{option.nativeName}{selected ? ` · ${copy("language.selected")}` : ""}</Text>
        </Pressable>;
      })}
    </View>
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy(error as keyof typeof ENGLISH_CORE_COPY)}</Text> : null}
  </View>;
}
