import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "@/components/pet-ui";
import { useTranslation } from "react-i18next";
import { ENGLISH_CORE_COPY } from "@/lib/i18n-language";
import { useLanguage } from "@/lib/language-provider";
import { IconSymbol } from "@/components/ui/icon-symbol";

type SafeRouteButtonProps = {
  path: string;
  label: string;
  variant?: "primary" | "secondary";
  style?: object;
  hint?: string;
  busyLabel?: string;
};

export function SafeRouteButton({ path, label, variant = "secondary", style, hint, busyLabel }: SafeRouteButtonProps) {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const Button = variant === "primary" ? PrimaryButton : SecondaryButton;

  const openRoute = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await router.push(path as never);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return <View style={{ gap: 8 }}>
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("recovery.navigation")}</Text> : null}
    <Button disabled={busy} accessibilityLabel={busy ? busyLabel ?? copy("scan.opening") : label} accessibilityHint={hint ?? copy("navigation.openRouteHint")} accessibilityState={{ disabled: busy, busy }} onPress={() => void openRoute()} style={[style, { opacity: busy ? 0.55 : 1 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text className={variant === "primary" ? "font-bold text-white" : "font-semibold text-foreground"}>{busy ? copy("scan.opening") : label}</Text>
        <IconSymbol name="chevron.right" size={18} color={variant === "primary" ? "#FFFFFF" : "#24322C"} style={{ transform: [{ rotate: direction === "rtl" ? "180deg" : "0deg" }] }} />
      </View>
    </Button>
  </View>;
}
