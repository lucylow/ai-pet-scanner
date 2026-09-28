import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ScanStage } from "@/lib/analysis-flow";
import { ENGLISH_CORE_COPY } from "@/lib/i18n-language";

const stages: ScanStage[] = ["photo", "uploading", "analyzing", "saved"];
const stageKeys: Record<ScanStage, keyof typeof ENGLISH_CORE_COPY> = {
  photo: "scan.stagePhoto",
  uploading: "scan.stageUploading",
  analyzing: "scan.stageAnalyzing",
  saved: "scan.stageSaved",
  error: "scan.draftPreserved",
};

export function ScanStageTimeline({ activeStage }: { activeStage: ScanStage }) {
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  const label = (stage: ScanStage) => copy(stageKeys[stage]);
  const activeIndex = activeStage === "error" ? 1 : stages.indexOf(activeStage);
  const progressLabel = activeStage === "error" ? label("error") : label(activeStage);
  return (
    <View accessibilityRole="summary" accessibilityLabel={`${copy("scan.progress")}: ${progressLabel}`} style={{ gap: 8 }}>
      <Text className="text-xs font-semibold uppercase tracking-widest text-primary">{copy("scan.progress")}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
        {stages.map((stage, index) => {
          const current = stage === activeStage || (activeStage === "error" && stage === "uploading");
          const complete = index < activeIndex;
          return (
            <View key={stage} accessible accessibilityLabel={`${label(stage)}, ${current ? "current" : "not current"}`} accessibilityState={{ selected: current }} style={{ flex: 1, gap: 5 }}>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: complete || current ? "#2F6B57" : "#E6DED3" }} />
              <Text numberOfLines={2} className={`text-[11px] leading-4 ${current ? "font-bold text-foreground" : "text-muted"}`}>{label(stage)}</Text>
            </View>
          );
        })}
      </View>
      {activeStage === "error" ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-xs leading-4 text-muted">{copy("scan.draftPreserved")}</Text> : null}
    </View>
  );
}
