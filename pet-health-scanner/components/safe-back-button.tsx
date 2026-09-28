import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { SecondaryButton } from "@/components/pet-ui";
import { useTranslation } from "react-i18next";
import { ENGLISH_CORE_COPY } from "@/lib/i18n-language";
import { useLanguage } from "@/lib/language-provider";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function SafeBackButton({ label = "Done", hint, busyLabel }: { label?: string; hint?: string; busyLabel?: string }) {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const goBack = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await router.back();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return <View style={{ gap: 8 }}>
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("recovery.navigation")}</Text> : null}
    <SecondaryButton disabled={busy} accessibilityLabel={busy ? busyLabel ?? `Opening ${label.toLowerCase()}` : label} accessibilityHint={hint ?? "Returns to the previous screen without changing saved information"} accessibilityState={{ disabled: busy, busy }} onPress={() => void goBack()} style={{ opacity: busy ? 0.55 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <IconSymbol name="chevron.right" size={18} color="#24322C" style={{ transform: [{ rotate: direction === "rtl" ? "0deg" : "180deg" }] }} />
        <Text className="font-semibold text-foreground">{busy ? copy("scan.opening") : label}</Text>
      </View>
    </SecondaryButton>
  </View>;
}
