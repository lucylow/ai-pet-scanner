import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { loadConsent } from "@/lib/pet-health";
import { ScreenContainer } from "@/components/screen-container";
import { SecondaryButton } from "@/components/pet-ui";
import { navigationFailureMessage } from "@/lib/navigation-recovery";

export default function EntryScreen() {
  const [error, setError] = useState<"storage" | "navigation" | null>(null);
  const [resolving, setResolving] = useState(true);
  const resolvingRef = useRef(false);

  const resolveEntry = async () => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setResolving(true);
    setError(null);
    try {
      let consent: Awaited<ReturnType<typeof loadConsent>>;
      try {
        consent = await loadConsent();
      } catch {
        setError("storage");
        return;
      }
      try {
        await router.replace((consent ? "/(tabs)" : "/onboarding") as never);
      } catch {
        setError("navigation");
      }
    } finally {
      resolvingRef.current = false;
      setResolving(false);
    }
  };

  const continueToOnboarding = async () => {
    setError(null);
    setResolving(true);
    try {
      await router.replace("/onboarding" as never);
    } catch {
      setError("navigation");
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    void resolveEntry();
  }, []);

  if (error) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center px-6">
        <View className="w-full max-w-sm items-center gap-3">
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-center text-xl font-bold text-foreground">
            {error === "navigation" ? "We could not open the next screen" : "We could not open your local settings"}
          </Text>
          <Text className="text-center text-base leading-6 text-muted">
            {error === "navigation" ? navigationFailureMessage : "Your saved information was not changed. Try again, or continue to onboarding if this device cannot read the previous consent state."}
          </Text>
          <SecondaryButton disabled={resolving} accessibilityLabel="Retry opening Pet Health Scanner" accessibilityHint="Tries to read local consent again without deleting saved data" accessibilityState={{ disabled: resolving, busy: resolving }} onPress={resolveEntry} style={{ opacity: resolving ? 0.55 : 1 }}>
            <Text className="font-semibold text-foreground">{resolving ? "Trying again…" : "Try again"}</Text>
          </SecondaryButton>
          <SecondaryButton accessibilityLabel="Continue to onboarding" accessibilityHint="Opens the safety explanation without deleting local data" onPress={() => void continueToOnboarding()}>
            <Text className="font-semibold text-foreground">Continue to onboarding</Text>
          </SecondaryButton>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View accessibilityLabel="Opening Pet Health Scanner" accessibilityRole="progressbar" style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F3EC" }}>
      <ActivityIndicator color="#2F6B57" />
    </View>
  );
}
