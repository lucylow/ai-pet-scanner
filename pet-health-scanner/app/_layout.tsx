import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { OfflineBanner } from "@/components/offline-banner";
import { View } from "react-native";
import { LanguageProvider } from "@/lib/language-provider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppErrorBoundary>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pets" options={{ presentation: "modal" }} />
        <Stack.Screen name="scan" />
        <Stack.Screen name="scan-detail" />
        <Stack.Screen name="visit-summary" options={{ presentation: "modal" }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="learn" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
          </Stack>
        </View>
        </AppErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}
