import { useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ENGLISH_CORE_COPY } from "@/lib/i18n-language";
import { SecondaryButton } from "@/components/pet-ui";
import { type PetProfile } from "@/lib/pet-health";

export function ActivePetSwitcher({ pets, activePetId, onChange, onError }: { pets: PetProfile[]; activePetId: string | null; onChange: (id: string) => void | Promise<void>; onError?: (error: unknown) => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const { t } = useTranslation();
  const copy = (key: keyof typeof ENGLISH_CORE_COPY) => t(key, { defaultValue: ENGLISH_CORE_COPY[key] });
  if (pets.length < 2) return null;
  return <View style={{ gap: 8 }}><Text className="text-xs font-semibold uppercase tracking-widest text-primary">{copy("pets.active")}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{pets.map((pet) => <SecondaryButton key={pet.id} disabled={Boolean(busyId)} onPress={async () => { if (busyId) return; setBusyId(pet.id); try { await onChange(pet.id); } catch (error) { try { onError?.(error); } catch { /* Error reporting must not create another unhandled rejection. */ } } finally { setBusyId(null); } }} style={{ minHeight: 40, paddingHorizontal: 12, backgroundColor: pet.id === activePetId ? "#DCE9DF" : "#FFFDF9", opacity: busyId && busyId !== pet.id ? 0.55 : 1 }} accessibilityRole="button" accessibilityLabel={t("pets.selectLabel", { defaultValue: "Select {{petName}} as the active pet", petName: pet.name })} accessibilityHint={copy("pets.selectHint")} accessibilityState={{ selected: pet.id === activePetId, disabled: Boolean(busyId), busy: busyId === pet.id }}><Text className="text-xs font-semibold text-foreground">{busyId === pet.id ? copy("pets.saving") : pet.name}</Text></SecondaryButton>)}</View></View>;
}
