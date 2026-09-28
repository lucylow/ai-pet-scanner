import { Pressable, Text, View, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";

function resolvePressableStyle(style: PressableProps["style"], state: PressableStateCallbackType): StyleProp<ViewStyle> {
  return typeof style === "function" ? style(state) : style;
}

export function Card({ children, tone = "surface" }: { children: React.ReactNode; tone?: "surface" | "sage" | "amber" }) {
  const colors = useColors();
  const backgroundColor = tone === "sage" ? "#DCE9DF" : tone === "amber" ? "#F4E2B9" : colors.surface;
  return <View style={{ backgroundColor, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 18 }}>{children}</View>;
}

export function PrimaryButton({ children, style, ...props }: PressableProps & { children: React.ReactNode }) {
  const colors = useColors();
  return <Pressable {...props} style={(state) => [{ backgroundColor: colors.primary, minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, state.pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] }, resolvePressableStyle(style, state)]}>{children}</Pressable>;
}

export function SecondaryButton({ children, style, ...props }: PressableProps & { children: React.ReactNode }) {
  const colors = useColors();
  return <Pressable {...props} style={(state) => [{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, state.pressed && { opacity: 0.8 }, resolvePressableStyle(style, state)]}>{children}</Pressable>;
}

export function SectionTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return <View style={{ gap: 4 }}>
    {eyebrow ? <Text className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</Text> : null}
    <Text className="text-2xl font-bold text-foreground">{children}</Text>
  </View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm font-semibold text-foreground">{children}</Text>;
}

export function StatusPill({ children, tone = "sage" }: { children: React.ReactNode; tone?: "sage" | "amber" | "coral" }) {
  const backgroundColor = tone === "amber" ? "#F4E2B9" : tone === "coral" ? "#F3D4CF" : "#DCE9DF";
  const color = tone === "coral" ? "#8E4339" : tone === "amber" ? "#8A5E13" : "#2F6B57";
  return <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor }}><Text style={{ color, fontSize: 12, fontWeight: "700" }}>{children}</Text></View>;
}

export function AsyncActionStatus({ status, message, children }: { status: "busy" | "success" | "error"; message: string; children?: React.ReactNode }) {
  const tone = status === "error" ? "amber" : "sage";
  return <Card tone={tone}><Text accessibilityRole={status === "error" ? "alert" : "text"} accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{message}</Text>{children ? <View style={{ marginTop: 12 }}>{children}</View> : null}</Card>;
}
