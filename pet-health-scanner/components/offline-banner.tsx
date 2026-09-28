import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNetworkAwareness } from "@/hooks/use-network-awareness";
import { useColors } from "@/hooks/use-colors";
import { offlineBannerCopy, offlineBannerDismissHint } from "@/lib/network-awareness";

export function OfflineBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const network = useNetworkAwareness();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!network.isOffline) setDismissed(false);
  }, [network.isOffline]);

  if (!network.isOffline || dismissed) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: "#F4E2B9",
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: 10,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text accessibilityRole="header" className="text-sm font-bold text-foreground">
            You’re offline
          </Text>
          <Text className="text-xs leading-4 text-foreground">
            {offlineBannerCopy}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss offline notice"
          accessibilityHint={offlineBannerDismissHint}
          hitSlop={8}
          onPress={() => setDismissed(true)}
          style={({ pressed }) => [{ paddingVertical: 4, paddingHorizontal: 2 }, pressed && { opacity: 0.6 }]}
        >
          <Text className="text-xs font-bold text-foreground">Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}
