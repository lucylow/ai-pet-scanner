import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AsyncActionStatus, Card, PrimaryButton, SecondaryButton, SectionTitle, StatusPill } from "@/components/pet-ui";
import { ActivePetSwitcher } from "@/components/active-pet-switcher";
import { loadActivePetId, loadPets, loadScanDraft, loadScansSafely, resolveActivePetId, saveActivePetId, type PetProfile, type ScanResult, type ScanDraft } from "@/lib/pet-health";
import { useNetworkAwareness } from "@/hooks/use-network-awareness";
import { useTranslation } from "react-i18next";
import { ENGLISH_CORE_COPY, bodyAreaCopyKeys } from "@/lib/i18n-language";
import { getSafeFallbackHomeSample, type FallbackHomeSample } from "@/lib/fallback-data";

export default function HomeScreen() {
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  const [pets, setPets] = useState<PetProfile[]>([]);
  const petsRef = useRef<PetProfile[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [draft, setDraft] = useState<ScanDraft | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState(false);
  const [fallbackSample, setFallbackSample] = useState<FallbackHomeSample | null>(null);
  const [activePetError, setActivePetError] = useState(false);
  const [failedActivePetId, setFailedActivePetId] = useState<string | null>(null);
  const [activePetRetrying, setActivePetRetrying] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [navigationBusy, setNavigationBusy] = useState(false);
  const activePetWriteInFlight = useRef(false);
  const refreshInFlight = useRef(false);
  const navigationInFlight = useRef(false);
  const network = useNetworkAwareness();
  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    setRefreshError(false);
    try {
      const [petsOutcome, scansOutcome, activeOutcome, draftOutcome] = await Promise.allSettled([loadPets(), loadScansSafely(), loadActivePetId(), loadScanDraft()]);
      let partialFailure = false;
      const visiblePets = petsOutcome.status === "fulfilled" ? petsOutcome.value.filter((pet) => !pet.archived) : petsRef.current;
      if (petsOutcome.status === "rejected") partialFailure = true;
      setPets(visiblePets);
      if (activeOutcome.status === "fulfilled") {
        const usableActivePetId = resolveActivePetId(activeOutcome.value, visiblePets);
        setActivePetId(usableActivePetId);
        if (usableActivePetId !== activeOutcome.value) {
          try { await saveActivePetId(usableActivePetId); } catch { partialFailure = true; }
        }
      } else partialFailure = true;
      if (scansOutcome.status === "fulfilled") {
        const scanResult = scansOutcome.value;
        if (!scanResult.storageError) setScans(scanResult.scans);
        partialFailure ||= scanResult.storageError || scanResult.hadMalformedEntries;
      } else partialFailure = true;
      if (draftOutcome.status === "fulfilled") setDraft(draftOutcome.value);
      else partialFailure = true;
      setRefreshError(partialFailure);
      setFallbackSample(getSafeFallbackHomeSample(process.env.NODE_ENV, petsOutcome.status === "rejected", scansOutcome.status === "rejected"));
    } catch {
      setRefreshError(true);
      setFallbackSample(null);
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { petsRef.current = pets; }, [pets]);
  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const changeActivePet = async (id: string) => {
    if (activePetWriteInFlight.current) return;
    activePetWriteInFlight.current = true;
    setActivePetRetrying(true);
    setActivePetError(false);
    setFailedActivePetId(null);
    try {
      await saveActivePetId(id);
      setActivePetId(id);
    } catch {
      setFailedActivePetId(id);
      setActivePetError(true);
    } finally {
      activePetWriteInFlight.current = false;
      setActivePetRetrying(false);
    }
  };
  const navigate = async (path: string) => {
    if (navigationInFlight.current) return;
    navigationInFlight.current = true;
    setNavigationBusy(true);
    setNavigationError(null);
    try {
      await router.push(path as never);
    } catch {
      setNavigationError(path);
    } finally {
      navigationInFlight.current = false;
      setNavigationBusy(false);
    }
  };
  const activePet = pets.find((pet) => pet.id === activePetId) ?? pets[0];
  const recent = scans[0];

  return <ScreenContainer className="px-5 pt-5">
    <ScrollView contentContainerStyle={{ paddingBottom: 36, gap: 22 }} showsVerticalScrollIndicator={false}>
      {navigationError ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("recovery.navigation")}</Text><SecondaryButton disabled={navigationBusy} accessibilityLabel={navigationBusy ? copy("home.opening") : copy("home.retry")} accessibilityHint={copy("navigation.openRouteHint")} accessibilityState={{ disabled: navigationBusy, busy: navigationBusy }} onPress={() => void navigate(navigationError)} style={{ opacity: navigationBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{navigationBusy ? copy("home.opening") : copy("home.retry")}</Text></SecondaryButton></Card> : null}
      <ActivePetSwitcher pets={pets} activePetId={activePetId} onChange={changeActivePet} />
      {activePetError ? <AsyncActionStatus status="error" message={copy("home.activePetSaveError")}>{failedActivePetId ? <SecondaryButton disabled={activePetRetrying} accessibilityLabel={activePetRetrying ? copy("home.savingSelection") : copy("home.retrySelection")} accessibilityHint={copy("pets.selectHint")} accessibilityState={{ disabled: activePetRetrying, busy: activePetRetrying }} onPress={() => void changeActivePet(failedActivePetId)} style={{ opacity: activePetRetrying ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{activePetRetrying ? copy("home.savingSelection") : copy("home.retrySelection")}</Text></SecondaryButton> : null}</AsyncActionStatus> : null}
      {refreshing && pets.length === 0 ? <Card><Text accessibilityLiveRegion="polite" className="text-sm leading-5 text-muted">{copy("home.loading")}</Text></Card> : null}
      {refreshError ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("home.historyUnavailableBody")}</Text><SecondaryButton disabled={refreshing} accessibilityLabel={copy("home.retryRefresh")} accessibilityHint={copy("home.refreshRetryHint")} accessibilityState={{ disabled: refreshing, busy: refreshing }} onPress={refresh} style={{ marginTop: 12, opacity: refreshing ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{refreshing ? copy("home.refreshing") : copy("home.retry")}</Text></SecondaryButton></Card> : null}
      {fallbackSample ? <Card tone="amber"><View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ gap: 8 }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text className="text-base font-bold text-foreground">{copy("home.fallbackTitle")}</Text><StatusPill tone="amber">{copy("home.fallbackStatus")}</StatusPill></View><Text className="text-sm leading-5 text-muted">{copy("home.fallbackBody")}</Text><Text className="text-xs leading-5 text-muted">{fallbackSample.scan.petName} · {copy("summary.areaSkin")}</Text></View></Card> : null}
      {network.isOffline ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-foreground">{copy("home.offline")}</Text></Card> : null}
      {draft?.completedScan && activePet && draft.petId === activePet.id ? <Card tone="amber"><Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-base font-bold text-foreground">{copy("home.completedRecoveryTitle")}</Text><Text className="mt-2 text-sm leading-5 text-muted">{copy("home.completedRecoveryBody")}</Text><SecondaryButton disabled={navigationBusy} accessibilityLabel={copy("home.openRecovery")} accessibilityHint={copy("home.completedRecoveryBody")} accessibilityState={{ disabled: navigationBusy, busy: navigationBusy }} onPress={() => void navigate("/scan")} style={{ marginTop: 12, opacity: navigationBusy ? 0.55 : 1 }}><Text className="font-semibold text-foreground">{navigationBusy ? copy("home.opening") : copy("home.openRecovery")}</Text></SecondaryButton></Card> : null}
      {draft && !draft.completedScan && activePet && draft.petId === activePet.id ? <Card tone="sage"><Text className="text-base font-bold text-foreground">{t("home.unfinishedScanTitle", { defaultValue: "Unfinished scan for {{petName}}", petName: activePet.name })}</Text><Text className="mt-2 text-sm leading-5 text-muted">{copy("home.draftBody")}</Text><SecondaryButton disabled={navigationBusy} accessibilityLabel={t("home.resumeScanLabel", { defaultValue: "Resume unfinished scan for {{petName}}", petName: activePet.name })} accessibilityState={{ disabled: navigationBusy, busy: navigationBusy }} accessibilityHint={copy("scan.draftRetryHint")} onPress={() => void navigate("/scan")} style={{ marginTop: 12 }}><Text className="font-semibold text-foreground">{t("home.resumeScan", { defaultValue: "Resume scan" })}</Text></SecondaryButton></Card> : null}
      <View style={{ gap: 8 }}>
        <Text className="text-sm font-semibold uppercase tracking-widest text-primary">{t("home.brandEyebrow", { defaultValue: "Pet Health Scanner" })}</Text>
        <Text className="text-4xl font-bold leading-tight text-foreground">{t("home.title", { defaultValue: "A calmer way to notice changes." })}</Text>
        <Text className="text-base leading-6 text-muted">{t("home.intro", { defaultValue: "Capture a visible concern and organize what you notice. This app supports observation; it does not diagnose." })}</Text>
      </View>

      <Card tone="sage">
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text className="text-lg font-bold text-foreground">{activePet ? t("home.nextCheckIn", { defaultValue: "{{petName}}'s next check-in", petName: activePet.name }) : t("home.startProfile", { defaultValue: "Start with a pet profile" })}</Text>
            <StatusPill>{activePet ? activePet.species === "dog" ? copy("pets.dog") : copy("pets.cat") : t("home.firstStep", { defaultValue: "First step" })}</StatusPill>
          </View>
          <Text className="text-sm leading-5 text-muted">{refreshError ? copy("home.refreshUnavailableGuidance") : activePet ? copy("home.activeGuidance") : copy("home.createProfileGuidance")}</Text>
          <PrimaryButton disabled={navigationBusy} onPress={() => void navigate(activePet ? "/scan" : "/pets")} accessibilityLabel={navigationBusy ? copy("home.opening") : activePet ? t("home.startScan", { defaultValue: "Start a scan" }) : t("home.addPetProfile", { defaultValue: "Add a pet profile" })} accessibilityState={{ disabled: navigationBusy, busy: navigationBusy }} accessibilityHint={activePet && network.isOffline ? t("home.offlineScanHint", { defaultValue: "Opens the scan draft area; remote review requires a connection" }) : undefined}>
            <Text className="font-bold text-white">{activePet ? t("home.startScan", { defaultValue: "Start a scan" }) : t("home.addPet", { defaultValue: "Add a pet" })}</Text>
          </PrimaryButton>
        </View>
      </Card>

      <View style={{ gap: 12 }}>
        <SectionTitle eyebrow={t("home.recentEyebrow", { defaultValue: "Recent activity" })}>{t("home.historyHeading", { defaultValue: "Your scan history" })}</SectionTitle>
        {recent ? <Card>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text className="text-base font-bold text-foreground">{recent.petName} · {copy(bodyAreaCopyKeys[recent.bodyArea])}</Text>
              <StatusPill tone={recent.status === "urgent-review" ? "coral" : recent.status === "needs-review" ? "amber" : "sage"}>{recent.status === "observation" ? copy("history.observationStatus") : recent.status === "needs-review" ? copy("history.reviewStatus") : copy("history.urgentStatus")}</StatusPill>
            </View>
            <Text className="text-sm leading-5 text-muted">{recent.summary}</Text>
            <SecondaryButton disabled={navigationBusy} accessibilityLabel={t("home.openHistoryLabel", { defaultValue: "Open saved scan history" })} accessibilityState={{ disabled: navigationBusy, busy: navigationBusy }} accessibilityHint={copy("history.viewHint")} onPress={() => void navigate("/history")}><Text className="font-semibold text-foreground">{t("home.openHistory", { defaultValue: "Open history" })}</Text></SecondaryButton>
          </View>
        </Card> : <Card>
          <Text className="text-base font-bold text-foreground">{refreshError ? copy("home.historyUnavailable") : copy("home.noScans")}</Text>
          <Text className="mt-2 text-sm leading-5 text-muted">{refreshError ? copy("home.historyUnavailableBody") : copy("home.noScansBody")}</Text>
        </Card>}
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitle eyebrow={t("home.learnEyebrow", { defaultValue: "Learn" })}>{t("home.learnHeading", { defaultValue: "Small steps, useful context" })}</SectionTitle>
        <Card>
          <Text className="text-lg font-bold text-foreground">{t("home.photoTitle", { defaultValue: "Better photos make better observations" })}</Text>
          <Text className="mt-2 text-sm leading-5 text-muted">{t("home.photoBody", { defaultValue: "Use bright indirect light, keep your pet comfortable, and stop if handling causes distress." })}</Text>
          <SecondaryButton disabled={navigationBusy} accessibilityState={{ disabled: navigationBusy, busy: navigationBusy }} onPress={() => void navigate("/learn") } style={{ marginTop: 14 }}><Text className="font-semibold text-foreground">{t("home.exploreGuidance", { defaultValue: "Explore guidance" })}</Text></SecondaryButton>
        </Card>
      </View>
    </ScrollView>
  </ScreenContainer>;
}
