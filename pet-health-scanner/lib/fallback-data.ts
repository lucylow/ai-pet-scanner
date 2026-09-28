import type { PetProfile, ScanResult } from "./pet-health";

/**
 * Development-only examples used to keep failure states inspectable.
 * These fixtures must never be persisted, sent to the server, or presented as a real scan.
 */
export type FallbackHomeSample = {
  pet: PetProfile;
  scan: ScanResult;
};

export const FALLBACK_HOME_SAMPLE = {
  pet: {
    id: "fallback-pet",
    name: "Example pet",
    species: "dog",
    archived: false,
    createdAt: "1970-01-01T00:00:00.000Z",
  } satisfies PetProfile,
  scan: {
    id: "fallback-scan",
    petId: "fallback-pet",
    petName: "Example pet",
    bodyArea: "skin",
    imageUri: "fallback://no-image",
    createdAt: "1970-01-01T00:00:00.000Z",
    quality: "limited",
    status: "observation",
    summary: "Example content only. No real observation was loaded.",
    observations: ["Example content only."],
    nextSteps: ["Retry loading your saved information."],
    context: {},
  } satisfies ScanResult,
} as const satisfies FallbackHomeSample;

export const isFallbackHomeSample = (petId: string | null | undefined) => petId === FALLBACK_HOME_SAMPLE.pet.id;

/**
 * Demo content is allowed only for development diagnostics after a real local-data read fails.
 * Production must render its unavailable/empty state and never show fixture content.
 */
export function shouldShowFallbackPreview(environment: string | undefined, dataReadFailed: boolean): boolean {
  return dataReadFailed && environment === "development";
}

/**
 * Use the fixture only when both primary collections failed to load. A partial failure
 * must preserve the real collection that was read successfully and show its retry state.
 */
export function shouldShowFallbackPreviewForReadOutcomes(environment: string | undefined, petsReadFailed: boolean, scansReadFailed: boolean): boolean {
  return shouldShowFallbackPreview(environment, petsReadFailed && scansReadFailed);
}

export function getSafeFallbackHomeSample(environment: string | undefined, petsReadFailed: boolean, scansReadFailed: boolean): FallbackHomeSample | null {
  if (!shouldShowFallbackPreviewForReadOutcomes(environment, petsReadFailed, scansReadFailed)) return null;
  return {
    pet: { ...FALLBACK_HOME_SAMPLE.pet },
    scan: {
      ...FALLBACK_HOME_SAMPLE.scan,
      observations: [...FALLBACK_HOME_SAMPLE.scan.observations],
      nextSteps: [...FALLBACK_HOME_SAMPLE.scan.nextSteps],
      context: { ...FALLBACK_HOME_SAMPLE.scan.context },
    },
  };
}
