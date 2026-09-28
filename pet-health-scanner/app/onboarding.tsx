import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Card, PrimaryButton, SecondaryButton } from "@/components/pet-ui";
import { saveConsent } from "@/lib/pet-health";
import { ENGLISH_CORE_COPY } from "@/lib/i18n-language";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  const [consented, setConsented] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);

  const continueToApp = async () => {
    if (!consented || saving) {
      if (!consented) setConsentError(copy("onboarding.ack"));
      return;
    }
    setConsentError(null);
    setSaving(true);
    try {
      if (!consentSaved) {
        await saveConsent({ version: "2026-08-21", acknowledgedAt: new Date().toISOString() });
        setConsentSaved(true);
      }
      try {
        await router.replace("/(tabs)");
      } catch {
        setConsentError(copy("recovery.consentNavigation"));
      }
    } catch {
      setConsentError(copy("onboarding.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-6 pt-8">
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", paddingBottom: 20 }}>
      <View style={{ gap: 22 }}>
        <Text accessibilityRole="header" className="text-sm font-semibold uppercase tracking-widest text-primary">{copy("onboarding.eyebrow")}</Text>
        <Text accessibilityRole="header" className="text-5xl font-bold leading-tight text-foreground">{copy("onboarding.title")}</Text>
        <Text accessibilityLabel={copy("onboarding.intro")} className="text-lg leading-7 text-muted">{copy("onboarding.intro")}</Text>
        <Card tone="sage">
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="header" className="text-lg font-bold text-foreground">{copy("onboarding.canTitle")}</Text>
            <Text className="text-sm leading-5 text-foreground">{copy("onboarding.canBody")}</Text>
          </View>
        </Card>
        <Card tone="amber">
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="header" className="text-lg font-bold text-foreground">{copy("onboarding.cannotTitle")}</Text>
            <Text className="text-sm leading-5 text-foreground">{copy("onboarding.cannotBody")}</Text>
          </View>
        </Card>
        <SecondaryButton accessibilityLabel={consented ? copy("onboarding.acknowledged") : copy("onboarding.ack")} accessibilityHint={consented ? copy("onboarding.ackSelectedHint") : copy("onboarding.ackUnselectedHint")} onPress={() => { setConsentError(null); setConsented((value) => !value); }} accessibilityRole="checkbox" accessibilityState={{ checked: consented }}>
          <Text className="font-semibold text-foreground">{consented ? copy("onboarding.acknowledged") : copy("onboarding.ack")}</Text>
        </SecondaryButton>
      </View>
      {consentError ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityHint={copy("onboarding.errorHint")} className="text-sm leading-5 text-foreground">{consentError}</Text> : null}
      <PrimaryButton disabled={saving} accessibilityLabel={saving ? consentSaved ? copy("onboarding.opening") : copy("onboarding.saving") : consentSaved ? copy("onboarding.retry") : copy("onboarding.continue")} accessibilityHint={copy("onboarding.continueHint")} accessibilityState={{ disabled: saving, busy: saving }} onPress={continueToApp} style={{ marginTop: 24, opacity: saving ? 0.55 : 1 }}><Text className="font-bold text-white">{saving ? consentSaved ? copy("onboarding.opening") : copy("onboarding.saving") : consentSaved ? copy("onboarding.retry") : copy("onboarding.continue")}</Text></PrimaryButton>
    </ScrollView>
  </ScreenContainer>;
}
