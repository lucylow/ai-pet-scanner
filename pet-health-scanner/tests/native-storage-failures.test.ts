import { beforeEach, describe, expect, it, vi } from "vitest";

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  multiRemove: vi.fn(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({ default: asyncStorage }));

import { appendScanSafely, clearLocalHealthData, clearScanDraft, loadPets, loadPetsSafely, loadScanDraft, loadScansSafely, normalizePetEntries, normalizeScanDraft, saveScanDraft, savePets, type ScanResult } from "../lib/pet-health";
import { FALLBACK_HOME_SAMPLE, getSafeFallbackHomeSample, isFallbackHomeSample, shouldShowFallbackPreview, shouldShowFallbackPreviewForReadOutcomes } from "../lib/fallback-data";

describe("AsyncStorage native failure recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asyncStorage.getItem.mockResolvedValue(null);
    asyncStorage.setItem.mockResolvedValue(undefined);
    asyncStorage.removeItem.mockResolvedValue(undefined);
    asyncStorage.multiRemove.mockResolvedValue(undefined);
  });

  it("surfaces a disk-full style write failure instead of reporting success", async () => {
    asyncStorage.setItem.mockRejectedValueOnce(new Error("ENOSPC"));

    await expect(savePets([])).rejects.toThrow();
    expect(asyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it("rejects a write when the native bridge reads back different data", async () => {
    asyncStorage.getItem.mockResolvedValueOnce("different-value");

    await expect(savePets([])).rejects.toThrow(/could not be confirmed/i);
    expect(asyncStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it("filters malformed pet profiles instead of exposing unsafe partial records", async () => {
    asyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([{ id: "valid", name: "Milo", species: "cat", archived: false, createdAt: "2026-08-25T00:00:00.000Z" }, { id: "broken", species: "dog" }]));

    await expect(loadPets()).resolves.toEqual([{ id: "valid", name: "Milo", species: "cat", archived: false, createdAt: "2026-08-25T00:00:00.000Z" }]);
  });

  it("reports malformed pet profiles while retaining valid records", async () => {
    const result = normalizePetEntries([{ id: "valid", name: "Milo", species: "cat", archived: false, createdAt: "2026-08-25T00:00:00.000Z" }, { id: "broken", species: "dog" }]);
    expect(result).toEqual({ pets: [{ id: "valid", name: "Milo", species: "cat", archived: false, createdAt: "2026-08-25T00:00:00.000Z" }], hadMalformedEntries: true });
    asyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([{ id: "valid", name: "Milo", species: "cat", archived: false, createdAt: "2026-08-25T00:00:00.000Z" }, { id: "broken", species: "dog" }]));
    await expect(loadPetsSafely()).resolves.toMatchObject({ pets: [{ id: "valid", name: "Milo" }], hadMalformedEntries: true, storageError: false });
  });

  it("rejects malformed scan drafts instead of returning unsafe partial data", () => {
    expect(normalizeScanDraft({ petId: "pet-1", area: "unknown", image: { uri: "file://photo.jpg" }, notes: {}, updatedAt: "2026-08-25T00:00:00.000Z" })).toBeNull();
    expect(normalizeScanDraft({ petId: "pet-1", area: "skin", image: { uri: "file://photo.jpg", width: -1 }, notes: {}, updatedAt: "not-a-date" })).toBeNull();
    expect(normalizeScanDraft({ petId: "pet-1", area: "skin", image: { uri: "file://photo.jpg" }, notes: "not-an-object", updatedAt: "2026-08-25T00:00:00.000Z" })).toBeNull();
  });

  it("loads a valid scan draft with normalized supported fields", async () => {
    asyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ petId: "pet-1", area: "eyes", image: { uri: "file://photo.jpg", width: 1200, height: 900, fileSize: 4200, ignored: true }, notes: { visibleNotes: "Small change" }, updatedAt: "2026-08-25T00:00:00.000Z", ignored: true }));

    await expect(loadScanDraft()).resolves.toEqual({ petId: "pet-1", area: "eyes", image: { uri: "file://photo.jpg", width: 1200, height: 900, fileSize: 4200 }, notes: { visibleNotes: "Small change" }, recovery: { rejectedCount: 0, truncatedCount: 0 }, updatedAt: "2026-08-25T00:00:00.000Z" });
  });

  it("preserves bounded additional photos in a valid scan draft", () => {
    expect(normalizeScanDraft({ petId: "pet-1", area: "skin", image: { uri: "file://one.jpg" }, additionalImages: [{ uri: "file://two.jpg", fileSize: 20 }, { uri: "file://three.jpg" }], notes: {}, updatedAt: "2026-08-25T00:00:00.000Z" })).toEqual({ petId: "pet-1", area: "skin", image: { uri: "file://one.jpg" }, additionalImages: [{ uri: "file://two.jpg", fileSize: 20 }, { uri: "file://three.jpg" }], notes: {}, recovery: { rejectedCount: 0, truncatedCount: 0 }, updatedAt: "2026-08-25T00:00:00.000Z" });
  });

  it("rejects scan drafts with too many additional photos", () => {
    expect(normalizeScanDraft({ petId: "pet-1", area: "skin", image: { uri: "file://one.jpg" }, additionalImages: [{ uri: "file://two.jpg" }, { uri: "file://three.jpg" }, { uri: "file://four.jpg" }, { uri: "file://five.jpg" }], notes: {}, updatedAt: "2026-08-25T00:00:00.000Z" })).toBeNull();
  });

  it("filters unsafe recovered additional photos without discarding valid media", () => {
    expect(normalizeScanDraft({
      petId: "pet-1",
      area: "skin",
      image: { uri: " file://one.jpg " },
      additionalImages: [
        { uri: "file://one.jpg" },
        { uri: "file://large.jpg", fileName: "large.jpg", fileSize: 11 * 1024 * 1024 },
        { uri: "file://valid.png", fileName: "valid.png", fileSize: 200 },
      ],
      notes: {},
      updatedAt: "2026-08-25T00:00:00.000Z",
    })).toEqual({ petId: "pet-1", area: "skin", image: { uri: "file://one.jpg" }, additionalImages: [{ uri: "file://valid.png", fileName: "valid.png", fileSize: 200 }], notes: {}, recovery: { rejectedCount: 0, truncatedCount: 0 }, updatedAt: "2026-08-25T00:00:00.000Z" });
    expect(normalizeScanDraft({ petId: "pet-1", area: "skin", image: { uri: "file://one.jpg" }, additionalImages: [{ uri: "file://bad.gif", fileName: "bad.gif" }, { uri: "file://valid.webp", fileName: "valid.webp" }], notes: {}, updatedAt: "2026-08-25T00:00:00.000Z" })?.additionalImages).toEqual([{ uri: "file://valid.webp", fileName: "valid.webp" }]);
  });

  it("persists safe recovery counts with an interrupted draft", async () => {
    let persisted: string | null = null;
    asyncStorage.setItem.mockImplementation(async (_key: string, value: string) => { persisted = value; });
    asyncStorage.getItem.mockImplementation(async () => persisted);

    await saveScanDraft({ petId: "pet-1", area: "skin", image: { uri: "file://photo.jpg" }, notes: {}, recovery: { rejectedCount: 2.9, truncatedCount: 1.2 } });
    expect(JSON.parse(persisted ?? "null").recovery).toEqual({ rejectedCount: 2, truncatedCount: 1 });
  });

  it("hydrates persisted recovery counts after relaunch", async () => {
    asyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ petId: "pet-1", area: "skin", image: { uri: "file://photo.jpg" }, additionalImages: [{ uri: "file://photo-2.jpg" }], notes: {}, recovery: { rejectedCount: 2, truncatedCount: 1 }, updatedAt: "2026-08-25T00:00:00.000Z" }));
    await expect(loadScanDraft()).resolves.toMatchObject({ recovery: { rejectedCount: 2, truncatedCount: 1 }, additionalImages: [{ uri: "file://photo-2.jpg" }] });
  });

  it("keeps fallback fixtures clearly separate from real local data", () => {
    expect(FALLBACK_HOME_SAMPLE.pet.id).toBe("fallback-pet");
    expect(FALLBACK_HOME_SAMPLE.scan.id).toBe("fallback-scan");
    expect(isFallbackHomeSample(FALLBACK_HOME_SAMPLE.pet.id)).toBe(true);
    expect(isFallbackHomeSample("real-pet")).toBe(false);
  });

  it("requires both primary collections to fail before showing a fallback preview", () => {
    expect(shouldShowFallbackPreviewForReadOutcomes("development", true, true)).toBe(true);
    expect(shouldShowFallbackPreviewForReadOutcomes("development", true, false)).toBe(false);
    expect(shouldShowFallbackPreviewForReadOutcomes("development", false, true)).toBe(false);
    expect(shouldShowFallbackPreviewForReadOutcomes("production", true, true)).toBe(false);
  });

  it("returns only the labeled fixture for a complete development read failure", () => {
    expect(getSafeFallbackHomeSample("development", true, true)?.scan.summary).toMatch(/Example content only/i);
    expect(getSafeFallbackHomeSample("development", true, true)?.scan.id).toBe("fallback-scan");
    const sample = getSafeFallbackHomeSample("development", true, true);
    expect(sample).toMatchObject(FALLBACK_HOME_SAMPLE);
    expect(sample).not.toBe(FALLBACK_HOME_SAMPLE);
    expect(sample?.scan.observations).not.toBe(FALLBACK_HOME_SAMPLE.scan.observations);
    expect(getSafeFallbackHomeSample("development", true, false)).toBeNull();
    expect(getSafeFallbackHomeSample("production", true, true)).toBeNull();
  });

  it("allows fallback preview only for development read failures", () => {
    expect(shouldShowFallbackPreview("development", true)).toBe(true);
    expect(shouldShowFallbackPreview("production", true)).toBe(false);
    expect(shouldShowFallbackPreview("development", false)).toBe(false);
  });

  it("keeps storage-read failures distinguishable from an empty history", async () => {
    asyncStorage.getItem.mockRejectedValueOnce(new Error("keychain or disk unavailable"));

    await expect(loadScansSafely()).resolves.toMatchObject({
      scans: [],
      hadMalformedEntries: false,
      storageError: true,
    });
  });

  it("refuses to append when scan history cannot be read, preventing overwrite", async () => {
    asyncStorage.getItem.mockRejectedValueOnce(new Error("history unavailable"));
    const scan = { id: "scan-1", petId: "pet-1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo.jpg", createdAt: "2026-08-25T00:00:00.000Z", quality: "limited", status: "needs-review", summary: "Observation only", observations: [], nextSteps: [], context: {} } as ScanResult;

    await expect(appendScanSafely(scan)).resolves.toEqual({ saved: false, storageError: true });
    expect(asyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("does not duplicate a completed scan already present in history", async () => {
    const scan = { id: "scan-existing", petId: "pet-1", petName: "Milo", bodyArea: "skin", imageUri: "file://photo.jpg", createdAt: "2026-08-25T00:00:00.000Z", quality: "limited", status: "needs-review", summary: "Observation only", observations: [], nextSteps: [], context: {} } as ScanResult;
    asyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([scan]));

    await expect(appendScanSafely(scan)).resolves.toEqual({ saved: true, storageError: false });
    expect(asyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("accepts a completed scan in a recoverable draft payload", () => {
    const scan = { id: "scan-2", petId: "pet-1", petName: "Milo", bodyArea: "eyes", imageUri: "file://photo.jpg", createdAt: "2026-08-25T00:00:00.000Z", quality: "good", status: "observation", summary: "Observation only", observations: ["Visible change"], nextSteps: ["Continue observing"], context: {} } as ScanResult;

    expect(normalizeScanDraft({ petId: "pet-1", area: "eyes", image: { uri: "file://photo.jpg" }, notes: {}, completedScan: scan, updatedAt: "2026-08-25T00:00:00.000Z" })?.completedScan).toEqual(scan);
  });

  it("lets draft deletion failures reach the caller for visible retry feedback", async () => {
    asyncStorage.removeItem.mockRejectedValueOnce(new Error("native remove failed"));

    await expect(clearScanDraft()).rejects.toThrow(/native remove failed/);
  });

  it("does not report local-data deletion success when a removed key remains", async () => {
    asyncStorage.getItem.mockResolvedValueOnce("still-present");

    await expect(clearLocalHealthData()).resolves.toBe(false);
    expect(asyncStorage.multiRemove).toHaveBeenCalledTimes(1);
  });

  it("reports local-data deletion failure when native read-back is unavailable", async () => {
    asyncStorage.getItem.mockRejectedValueOnce(new Error("native read failed"));

    await expect(clearLocalHealthData()).resolves.toBe(false);
  });
});

const secureStore = vi.hoisted(() => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("expo-secure-store", () => secureStore);
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { clearSubscriptionSnapshot, loadSubscriptionSnapshot, saveSubscriptionSnapshot } from "../lib/subscription-storage";
import type { SubscriptionSnapshot } from "../lib/subscription-status";

const snapshot: SubscriptionSnapshot = { state: { plan: "free", entitlements: [] }, refreshedAt: "2026-08-22T00:00:00.000Z", source: "server", stale: false };

describe("SecureStore native failure recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    secureStore.setItemAsync.mockResolvedValue(undefined);
    secureStore.getItemAsync.mockResolvedValue(null);
    secureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it("returns false when the keychain rejects a subscription write", async () => {
    secureStore.setItemAsync.mockRejectedValueOnce(new Error("keychain locked"));

    await expect(saveSubscriptionSnapshot(snapshot)).resolves.toBe(false);
  });

  it("fails closed when the keychain cannot be read", async () => {
    secureStore.getItemAsync.mockRejectedValueOnce(new Error("biometric store unavailable"));

    await expect(loadSubscriptionSnapshot()).resolves.toBeNull();
  });

  it("returns false when secure cleanup cannot delete the cached snapshot", async () => {
    secureStore.deleteItemAsync.mockRejectedValueOnce(new Error("keystore unavailable"));

    await expect(clearSubscriptionSnapshot()).resolves.toBe(false);
  });
});
