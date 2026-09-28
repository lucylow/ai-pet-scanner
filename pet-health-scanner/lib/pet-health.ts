import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { MAX_ANALYSIS_IMAGES, safeAnalysisResultSchema, type SharedSafeAnalysisResult } from "../shared/pet-scanner-contracts";
import { localStorageWriteFailureMessage } from "./storage-recovery";
import { ACCEPTED_MEDIA_TYPES, MAX_MEDIA_BYTES } from "./media-upload";

export type Species = "dog" | "cat";
export type BodyArea = "skin" | "eyes" | "teeth" | "ears" | "paws" | "other";
export type ScanStatus = "observation" | "needs-review" | "urgent-review";

export interface PetProfile {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  ageRange?: string;
  sex?: string;
  spayNeuter?: string;
  weightRange?: string;
  allergies?: string;
  medications?: string;
  vetContact?: string;
  archived: boolean;
  createdAt: string;
}

export interface ScanImage {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ScanObservationContext {
  onset?: string;
  changing?: string;
  behavior?: string;
  appetite?: string;
  visibleNotes?: string;
}

export interface ScanDraftRecovery {
  rejectedCount: number;
  truncatedCount: number;
}

export interface ScanDraft {
  petId: string;
  area: BodyArea;
  image: ScanImage;
  additionalImages?: ScanImage[];
  notes: ScanObservationContext;
  recovery?: ScanDraftRecovery;
  completedScan?: ScanResult;
  updatedAt: string;
}

export interface ScanResult {
  id: string;
  petId: string;
  petName: string;
  bodyArea: BodyArea;
  imageUri: string;
  imageUris?: string[];
  createdAt: string;
  quality: "good" | "limited";
  status: ScanStatus;
  summary: string;
  observations: string[];
  nextSteps: string[];
  context: ScanObservationContext;
  remoteAnalysis?: SharedSafeAnalysisResult;
  sourceMediaUrl?: string;
  sourceMediaKey?: string;
  sourceMediaUrls?: string[];
  sourceMediaKeys?: string[];
}

export function safeRemoteAnalysis(scan: ScanResult): SharedSafeAnalysisResult | null {
  const parsed = safeAnalysisResultSchema.safeParse(scan.remoteAnalysis);
  return parsed.success && parsed.data.scanId === scan.id ? parsed.data : null;
}

export interface ConsentRecord {
  version: string;
  acknowledgedAt: string;
}

const petProfileSchema = z.object({ id: z.string(), name: z.string().min(1), species: z.enum(["dog", "cat"]), breed: z.string().optional(), ageRange: z.string().optional(), sex: z.string().optional(), spayNeuter: z.string().optional(), weightRange: z.string().optional(), allergies: z.string().optional(), medications: z.string().optional(), vetContact: z.string().optional(), archived: z.boolean(), createdAt: z.string() });
const scanImageSchema = z.object({ uri: z.string().min(1), width: z.number().finite().positive().optional(), height: z.number().finite().positive().optional(), mimeType: z.string().min(1).optional(), fileName: z.string().min(1).optional(), fileSize: z.number().finite().nonnegative().optional() });
const scanResultSchema = z.object({ id: z.string(), petId: z.string(), petName: z.string(), bodyArea: z.enum(["skin", "eyes", "teeth", "ears", "paws", "other"]), imageUri: z.string(), imageUris: z.array(z.string().min(1)).max(MAX_ANALYSIS_IMAGES).optional(), createdAt: z.string(), quality: z.enum(["good", "limited"]), status: z.enum(["observation", "needs-review", "urgent-review"]), summary: z.string(), observations: z.array(z.string()), nextSteps: z.array(z.string()), context: z.object({ onset: z.string().optional(), changing: z.string().optional(), behavior: z.string().optional(), appetite: z.string().optional(), visibleNotes: z.string().optional() }), remoteAnalysis: safeAnalysisResultSchema.optional(), sourceMediaUrl: z.string().optional(), sourceMediaKey: z.string().optional(), sourceMediaUrls: z.array(z.string().url()).max(MAX_ANALYSIS_IMAGES).optional(), sourceMediaKeys: z.array(z.string().min(1)).max(MAX_ANALYSIS_IMAGES).optional() });
const scanDraftSchema = z.object({
  petId: z.string().min(1),
  area: z.enum(["skin", "eyes", "teeth", "ears", "paws", "other"]),
  image: scanImageSchema,
  additionalImages: z.array(scanImageSchema).max(MAX_ANALYSIS_IMAGES - 1).optional(),
  notes: z.object({
    onset: z.string().optional(),
    changing: z.string().optional(),
    behavior: z.string().optional(),
    appetite: z.string().optional(),
    visibleNotes: z.string().optional(),
  }),
  recovery: z.object({ rejectedCount: z.number().finite().nonnegative().max(999), truncatedCount: z.number().finite().nonnegative().max(999) }).optional(),
  completedScan: scanResultSchema.optional(),
  updatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Draft timestamp is invalid"),
});

const PETS_KEY = "pet-health-scanner:pets";
const SCANS_KEY = "pet-health-scanner:scans";
const CONSENT_KEY = "pet-health-scanner:consent";
const SCAN_DRAFT_KEY = "pet-health-scanner:scan-draft";
const LOCAL_HEALTH_DATA_KEYS = [PETS_KEY, SCANS_KEY, CONSENT_KEY, SCAN_DRAFT_KEY] as const;
const ACTIVE_PET_KEY = "pet-health-scanner:active-pet";
export const consentAcknowledgementPrompt = "Please acknowledge the observation-only limits before continuing.";
export const recoverableScanLoadErrorCopy = "Your local data was not changed. Try again, or go back to History.";
export const recoverableHomeLoadErrorCopy = "Home could not refresh local data. Existing information was kept; try again when ready.";
export const homeRefreshRetryAccessibilityHint = "Tries again without deleting or replacing your currently visible local data.";
export function resolveActivePetId(activePetId: string | null, visiblePets: PetProfile[]): string | null {
  return activePetId && visiblePets.some((pet) => pet.id === activePetId) ? activePetId : visiblePets[0]?.id ?? null;
}

export function homeDataStateCopy(hasActivePet: boolean, refreshFailed: boolean): string {
  if (hasActivePet) return "Choose a visible area and take a clear photo in good light.";
  if (refreshFailed) return "Saved pet data is temporarily unavailable. Retry the Home refresh before creating a new profile.";
  return "Adding a profile keeps scans connected to the right pet.";
}
export const recoverableSubscriptionErrorCopy = "Subscription status could not be refreshed. Basic observation access remains available; try again when connected.";
export const appErrorTitle = "Something went wrong";
export const appErrorCopy = "The app could not show this screen. Your saved profiles, observations, and unfinished drafts were not deleted.";

export function scanAreaAccessibilityLabel(area: BodyArea, selected: boolean): string {
  return `${bodyAreaLabels[area]}${selected ? ", selected" : ""}`;
}

export function scanStatusLabel(status: ScanResult["status"]): string {
  return status === "urgent-review" ? "Vet promptly" : status === "needs-review" ? "Review photo" : "Observation";
}

export function observationQualityLabel(quality: ScanResult["quality"]): string {
  return quality === "good" ? "Photo quality was usable" : "Photo quality was limited";
}

export function observationSourceLabel(hasRemoteAnalysis: boolean): string {
  return hasRemoteAnalysis ? "Validated server review metadata" : "Local safety record only";
}

export const bodyAreaLabels: Record<BodyArea, string> = {
  skin: "Skin",
  eyes: "Eyes",
  teeth: "Teeth",
  ears: "Ears",
  paws: "Paws",
  other: "Other visible area",
};

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export type PetStorageResult = { pets: PetProfile[]; hadMalformedEntries: boolean; storageError: boolean };

export function normalizePetEntries(entries: unknown[]): { pets: PetProfile[]; hadMalformedEntries: boolean } {
  const pets = entries.flatMap((entry) => { const parsed = petProfileSchema.safeParse(entry); return parsed.success ? [parsed.data] : []; });
  return { pets, hadMalformedEntries: pets.length !== entries.length };
}

export async function loadPetsSafely(): Promise<PetStorageResult> {
  try {
    const raw = await AsyncStorage.getItem(PETS_KEY);
    if (!raw) return { pets: [], hadMalformedEntries: false, storageError: false };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { pets: [], hadMalformedEntries: true, storageError: false };
    return { ...normalizePetEntries(parsed), storageError: false };
  } catch {
    return { pets: [], hadMalformedEntries: false, storageError: true };
  }
}

export async function loadPets(): Promise<PetProfile[]> {
  return (await loadPetsSafely()).pets;
}

type LocalStorageLike = Pick<typeof AsyncStorage, "getItem" | "setItem" | "removeItem">;

async function writeAndVerify(store: LocalStorageLike, key: string, value: string): Promise<void> {
  await store.setItem(key, value);
  const stored = await store.getItem(key);
  if (stored !== value) throw new Error(localStorageWriteFailureMessage);
}

export async function savePets(pets: PetProfile[]) {
  await writeAndVerify(AsyncStorage, PETS_KEY, JSON.stringify(pets));
}

export async function savePetState(pets: PetProfile[], activePetId: string | null, store: LocalStorageLike = AsyncStorage): Promise<void> {
  const previousPets = await store.getItem(PETS_KEY);
  const previousActivePetId = await store.getItem(ACTIVE_PET_KEY);
  try {
    await writeAndVerify(store, PETS_KEY, JSON.stringify(pets));
    if (activePetId) await writeAndVerify(store, ACTIVE_PET_KEY, activePetId);
    else await store.removeItem(ACTIVE_PET_KEY);
  } catch (error) {
    try {
      if (previousPets === null) await store.removeItem(PETS_KEY);
      else await writeAndVerify(store, PETS_KEY, previousPets);
      if (previousActivePetId === null) await store.removeItem(ACTIVE_PET_KEY);
      else await writeAndVerify(store, ACTIVE_PET_KEY, previousActivePetId);
    } catch {
      // Preserve the original failure; callers still show a safe retry state.
    }
    throw error;
  }
}

export type ScanHistoryNotice = "malformed" | "error" | null;

export function scanHistoryNotice(result: { hadMalformedEntries: boolean; storageError: boolean }): ScanHistoryNotice {
  return result.storageError ? "error" : result.hadMalformedEntries ? "malformed" : null;
}

export function normalizeScanEntries(entries: unknown[]): { scans: ScanResult[]; hadMalformedEntries: boolean } {
  const scans = entries.flatMap((entry) => { const result = scanResultSchema.safeParse(entry); return result.success ? [result.data] : []; });
  return { scans, hadMalformedEntries: scans.length !== entries.length };
}

export async function loadScansSafely(): Promise<{ scans: ScanResult[]; hadMalformedEntries: boolean; storageError: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(SCANS_KEY);
    if (!raw) return { scans: [], hadMalformedEntries: false, storageError: false };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { scans: [], hadMalformedEntries: true, storageError: false };
    const normalized = normalizeScanEntries(parsed);
    return { ...normalized, storageError: false };
  } catch {
    return { scans: [], hadMalformedEntries: false, storageError: true };
  }
}

export async function loadScans(): Promise<ScanResult[]> {
  return (await loadScansSafely()).scans;
}

export async function saveScans(scans: ScanResult[]) {
  await writeAndVerify(AsyncStorage, SCANS_KEY, JSON.stringify(scans));
}

export type AppendScanResult = {
  saved: boolean;
  storageError: boolean;
};

/**
 * Appends a completed scan only when the existing history was read successfully.
 * A failed read must never be treated as an empty history, otherwise a later write
 * could replace valid local observations with a single new record.
 */
export async function appendScanSafely(scan: ScanResult): Promise<AppendScanResult> {
  const current = await loadScansSafely();
  if (current.storageError) return { saved: false, storageError: true };
  if (current.scans.some((existing) => existing.id === scan.id)) return { saved: true, storageError: false };
  await saveScans([scan, ...current.scans]);
  return { saved: true, storageError: false };
}

function safeDraftRecoveryCount(value: number): number {
  return Number.isFinite(value) ? Math.min(999, Math.max(0, Math.floor(value))) : 0;
}

export async function saveScanDraft(draft: Omit<ScanDraft, "updatedAt">) {
  const recovery = draft.recovery ? { rejectedCount: safeDraftRecoveryCount(draft.recovery.rejectedCount), truncatedCount: safeDraftRecoveryCount(draft.recovery.truncatedCount) } : undefined;
  await writeAndVerify(AsyncStorage, SCAN_DRAFT_KEY, JSON.stringify({ ...draft, ...(recovery ? { recovery } : {}), updatedAt: new Date().toISOString() }));
}

function isRecoverableScanImage(image: ScanImage): boolean {
  if (!image.uri.trim()) return false;
  if (image.fileSize != null && image.fileSize > MAX_MEDIA_BYTES) return false;
  if (image.mimeType && !(ACCEPTED_MEDIA_TYPES as readonly string[]).includes(image.mimeType)) return false;
  if (!image.mimeType && image.fileName) {
    const extension = image.fileName.toLowerCase().split(".").pop();
    if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) return false;
  }
  return true;
}

export function normalizeRecoveredScanImages(image: ScanImage, additionalImages: ScanImage[] = []): { image: ScanImage; additionalImages?: ScanImage[] } | null {
  if (!isRecoverableScanImage(image)) return null;
  const seen = new Set([image.uri.trim()]);
  const safeAdditional = additionalImages.filter((candidate) => {
    const uri = candidate.uri.trim();
    if (!isRecoverableScanImage(candidate) || seen.has(uri)) return false;
    seen.add(uri);
    return true;
  }).slice(0, MAX_ANALYSIS_IMAGES - 1);
  return { image: { ...image, uri: image.uri.trim() }, ...(safeAdditional.length > 0 ? { additionalImages: safeAdditional.map((candidate) => ({ ...candidate, uri: candidate.uri.trim() })) } : {}) };
}

export function normalizeScanDraft(parsed: unknown): ScanDraft | null {
  const result = scanDraftSchema.safeParse(parsed);
  if (!result.success) return null;
  const normalizedImages = normalizeRecoveredScanImages(result.data.image, result.data.additionalImages);
  return normalizedImages ? { ...result.data, ...normalizedImages, recovery: result.data.recovery ?? { rejectedCount: 0, truncatedCount: 0 } } : null;
}

export async function loadScanDraft(): Promise<ScanDraft | null> {
  try {
    const parsed: unknown = JSON.parse((await AsyncStorage.getItem(SCAN_DRAFT_KEY)) ?? "null");
    return normalizeScanDraft(parsed);
  } catch {
    return null;
  }
}

export async function clearScanDraft() {
  await AsyncStorage.removeItem(SCAN_DRAFT_KEY);
}

export function localDataDeletionMessage(healthDataCleared: boolean, subscriptionCleared: boolean): string {
  return healthDataCleared && subscriptionCleared ? "Local Pet Health Scanner data has been removed." : "Some local data could not be removed. Try again before deleting app data or reinstalling.";
}

export async function clearLocalHealthData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove([...LOCAL_HEALTH_DATA_KEYS]);
    const remaining = await Promise.all(LOCAL_HEALTH_DATA_KEYS.map((key) => AsyncStorage.getItem(key)));
    return remaining.every((value) => value === null);
  } catch {
    return false;
  }
}

export async function loadConsent(): Promise<ConsentRecord | null> {
  const raw = await AsyncStorage.getItem(CONSENT_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<ConsentRecord>;
    return typeof candidate.version === "string" && typeof candidate.acknowledgedAt === "string" ? { version: candidate.version, acknowledgedAt: candidate.acknowledgedAt } : null;
  } catch {
    return null;
  }
}

export async function saveConsent(consent: ConsentRecord) {
  await writeAndVerify(AsyncStorage, CONSENT_KEY, JSON.stringify(consent));
}

export function validatePetName(name: string) {
  return name.trim().length >= 2;
}

export function validateImageForObservation(asset?: { width?: number; height?: number }) {
  if (!asset?.width || !asset?.height) return { quality: "limited" as const, message: "Image dimensions are unavailable. Use a clear, well-lit photo." };
  if (asset.width < 640 || asset.height < 480) return { quality: "limited" as const, message: "This photo may be too small for useful observation. A closer, well-lit image is recommended." };
  return { quality: "good" as const, message: "Photo framing looks suitable for an observation review." };
}

export function buildSafeObservation(bodyArea: BodyArea, quality: "good" | "limited", context: ScanObservationContext): Pick<ScanResult, "status" | "summary" | "observations" | "nextSteps"> {
  const limited = quality === "limited";
  const hasEscalationSignal = [context.behavior, context.appetite, context.visibleNotes].some((value) => /bleed|blood|severe|collapse|breath|not eating|pain/i.test(value ?? ""));
  return {
    status: hasEscalationSignal ? "urgent-review" : limited ? "needs-review" : "observation",
    summary: hasEscalationSignal
      ? "Your notes include a signal that should be discussed with a veterinarian promptly."
      : limited
        ? "The photo or context is limited, so this result should not be relied on for interpretation."
        : `This is a structured observation aid for the ${bodyAreaLabels[bodyArea].toLowerCase()} area, not a diagnosis.`,
    observations: [
      limited ? "Photo quality or context limits what can be observed." : "The selected image was accepted for a cautious visual review.",
      "The app does not identify conditions, measure health, or prescribe treatment.",
    ],
    nextSteps: hasEscalationSignal
      ? ["Contact your veterinarian or an appropriate urgent veterinary service promptly.", "If your pet appears in immediate danger, seek emergency veterinary care now."]
      : ["Compare with your pet’s usual appearance and note any change over time.", "Contact your veterinarian if the concern persists, worsens, or is accompanied by behavior changes.", "Bring the saved photo and notes to a veterinary visit if needed."],
  };
}

export async function loadActivePetId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_PET_KEY);
}

export async function saveActivePetId(petId: string | null) {
  if (petId) await writeAndVerify(AsyncStorage, ACTIVE_PET_KEY, petId);
  else await AsyncStorage.removeItem(ACTIVE_PET_KEY);
}

export function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
