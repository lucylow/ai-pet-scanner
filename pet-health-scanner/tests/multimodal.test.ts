import { describe, expect, it } from "vitest";
import { ANALYSIS_STAGE_LABELS, attachmentReducer, createPhotoAsset, mapMultimodalUrgency, multimodalSafetyGate, normalizeRecoveredMediaAssets, normalizeRecoveredMultimodalCase, projectAttachmentReview, stageIsReached, summarizeRecoveredMedia, validateMultimodalAsset, type AttachmentState, type MediaAsset } from "../lib/multimodal";

const photo: MediaAsset = {
  id: "photo-1",
  modality: "photo",
  uri: "file:///pet.jpg",
  mimeType: "image/jpeg",
  source: "camera",
  createdAt: "2026-08-22T00:00:00.000Z",
};

const initial: AttachmentState = { items: [], activeId: null };

describe("Multimodal asset validation", () => {
  it("adapts selected photo metadata into a typed camera asset", () => {
    const asset = createPhotoAsset({ id: "camera-1", uri: "file:///pet.jpg", mimeType: "image/jpeg", sizeBytes: 1024, width: 1200, height: 900 }, "camera", "2026-08-22T00:00:00.000Z");
    expect(asset).toMatchObject({ id: "camera-1", modality: "photo", source: "camera", sizeBytes: 1024, createdAt: "2026-08-22T00:00:00.000Z" });
    expect(validateMultimodalAsset(asset).ok).toBe(true);
  });

  it("accepts supported bounded media", () => {
    expect(validateMultimodalAsset(photo)).toEqual({ ok: true, reasons: [] });
  });

  it("reports missing URI, unsupported type, and oversize independently", () => {
    expect(validateMultimodalAsset({ ...photo, uri: "", mimeType: "video/mp4", sizeBytes: 51 * 1024 * 1024 })).toEqual({
      ok: false,
      reasons: ["missing_uri", "unsupported_type", "too_large"],
    });
  });

  it("recovers valid audio and video assets while dropping unsafe native results", () => {
    expect(normalizeRecoveredMediaAssets([
      { id: "video-1", modality: "video", uri: " file:///pet.mp4 ", mimeType: " VIDEO/MP4 ", source: "camera", createdAt: "2026-08-25T00:00:00.000Z", sizeBytes: 1024 },
      { id: "audio-1", modality: "audio", uri: "file:///note.m4a", mimeType: "audio/m4a", source: "microphone", createdAt: "2026-08-25T00:00:00.000Z", durationMs: 1500 },
      { id: "bad", modality: "video", uri: "file:///bad.mov", mimeType: "video/quicktime", source: "camera", createdAt: "2026-08-25T00:00:00.000Z", sizeBytes: 51 * 1024 * 1024 },
      { id: "duplicate", modality: "video", uri: "file:///pet.mp4", mimeType: "video/mp4", source: "camera", createdAt: "2026-08-25T00:00:00.000Z" },
      null,
    ])).toEqual({
      assets: [
        { id: "video-1", modality: "video", uri: "file:///pet.mp4", mimeType: "video/mp4", source: "camera", createdAt: "2026-08-25T00:00:00.000Z", sizeBytes: 1024 },
        { id: "audio-1", modality: "audio", uri: "file:///note.m4a", mimeType: "audio/m4a", source: "microphone", createdAt: "2026-08-25T00:00:00.000Z", durationMs: 1500 },
      ],
      rejectedCount: 3,
      truncatedCount: 0,
    });
  });

  it("truncates recovered media at the explicit bound", () => {
    const inputs = Array.from({ length: 3 }, (_, index) => ({ id: `audio-${index}`, modality: "audio", uri: `file:///note-${index}.m4a`, mimeType: "audio/m4a", source: "microphone", createdAt: "2026-08-25T00:00:00.000Z" }));
    expect(normalizeRecoveredMediaAssets(inputs, 2)).toMatchObject({ assets: inputs.slice(0, 2), rejectedCount: 0, truncatedCount: 1 });
  });

  it("rejects invalid timestamps and malformed optional numeric metadata", () => {
    const valid = { id: "audio-valid", modality: "audio", uri: "file:///valid.m4a", mimeType: "audio/m4a", source: "microphone", createdAt: "2026-08-25T00:00:00.000Z" };
    expect(normalizeRecoveredMediaAssets([
      { ...valid, id: "bad-date", createdAt: "2026-08-25" },
      { ...valid, id: "bad-size", uri: "file:///bad-size.m4a", sizeBytes: Number.NaN },
      { ...valid, id: "bad-duration", uri: "file:///bad-duration.m4a", durationMs: -1 },
      valid,
    ])).toEqual({ assets: [valid], rejectedCount: 3, truncatedCount: 0 });
  });

  it("uses the default recovery bound when passed a non-finite limit", () => {
    const inputs = Array.from({ length: 5 }, (_, index) => ({ id: `audio-${index}`, modality: "audio", uri: `file:///note-${index}.m4a`, mimeType: "audio/m4a", source: "microphone", createdAt: "2026-08-25T00:00:00.000Z" }));
    expect(normalizeRecoveredMediaAssets(inputs, Number.NaN)).toMatchObject({ assets: inputs.slice(0, 4), rejectedCount: 0, truncatedCount: 1 });
  });

  it("summarizes recovery counts with accessibility-ready warning semantics", () => {
    expect(summarizeRecoveredMedia({ assets: [photo], rejectedCount: 2, truncatedCount: 1 })).toEqual({ status: "filtered-and-truncated", restoredCount: 1, rejectedCount: 2, truncatedCount: 1, hasWarnings: true, accessibilityLiveRegion: "polite" });
    expect(summarizeRecoveredMedia({ assets: [], rejectedCount: -2, truncatedCount: Number.NaN })).toEqual({ status: "clean", restoredCount: 0, rejectedCount: 0, truncatedCount: 0, hasWarnings: false, accessibilityLiveRegion: "none" });
  });

  it("projects recovery data into attachment-review semantics", () => {
    expect(projectAttachmentReview({ status: "filtered", restoredCount: 2, rejectedCount: 1, truncatedCount: 0, hasWarnings: true, accessibilityLiveRegion: "polite" })).toEqual({ restoredCount: 2, skippedCount: 1, truncatedCount: 0, showRecoveryNotice: true, accessibilityLiveRegion: "polite" });
  });

  it("hydrates a persisted case and reports filtered asset counts", () => {
    const result = normalizeRecoveredMultimodalCase({
      id: "case-1",
      petId: "pet-1",
      locale: "ar",
      createdAt: "2026-08-25T00:00:00.000Z",
      status: "draft",
      userText: "Visible change",
      assets: [
        { id: "photo-1", modality: "photo", uri: " file:///pet.jpg ", mimeType: "image/jpeg", source: "library", createdAt: "2026-08-25T00:00:00.000Z" },
        { id: "bad-1", modality: "video", uri: "file:///bad.mov", mimeType: "video/quicktime", source: "camera", createdAt: "not-a-date" },
      ],
    });
    expect(result).toEqual({
      case: { id: "case-1", petId: "pet-1", locale: "ar", createdAt: "2026-08-25T00:00:00.000Z", status: "draft", userText: "Visible change", assets: [{ id: "photo-1", modality: "photo", uri: "file:///pet.jpg", mimeType: "image/jpeg", source: "library", createdAt: "2026-08-25T00:00:00.000Z" }] },
      rejectedAssetCount: 1,
      truncatedAssetCount: 0,
      status: "filtered",
    });
  });

  it("fails closed for malformed persisted case envelopes", () => {
    expect(normalizeRecoveredMultimodalCase({ id: "case-1", petId: "pet-1", locale: "en", createdAt: "2026-08-25", status: "draft", assets: [] })).toEqual({ case: null, rejectedAssetCount: 0, truncatedAssetCount: 0, status: "clean" });
  });
});

describe("Attachment reducer", () => {
  it("selects the first valid attachment and keeps active selection stable", () => {
    const withPhoto = attachmentReducer(initial, { type: "add", asset: photo });
    expect(withPhoto.activeId).toBe("photo-1");
    expect(attachmentReducer(withPhoto, { type: "add", asset: { ...photo, id: "duplicate" } }).items).toHaveLength(2);
  });

  it("rejects invalid or duplicate attachments and repairs active selection on removal", () => {
    const withPhoto = attachmentReducer(initial, { type: "add", asset: photo });
    const duplicate = attachmentReducer(withPhoto, { type: "add", asset: photo });
    expect(duplicate.items).toHaveLength(1);
    const invalid = attachmentReducer(withPhoto, { type: "add", asset: { ...photo, id: "bad", mimeType: "application/octet-stream" } });
    expect(invalid.items).toHaveLength(1);
    expect(attachmentReducer(withPhoto, { type: "remove", id: "photo-1" })).toEqual({ items: [], activeId: null });
  });
});

describe("Multimodal safety and progress contracts", () => {
  it("maps severe or distress signals to urgent care guidance", () => {
    expect(mapMultimodalUrgency({ severe: true, rapidChange: false, distress: false })).toBe("urgent");
    expect(mapMultimodalUrgency({ severe: false, rapidChange: true, distress: false })).toBe("prompt");
    expect(mapMultimodalUrgency({ severe: false, rapidChange: false, distress: false })).toBe("routine");
  });

  it("blocks diagnostic, prescribing, and guarantee language", () => {
    expect(multimodalSafetyGate("This can diagnose the condition")).toEqual({ ok: false, reason: "unsafe_language" });
    expect(multimodalSafetyGate("This organizes visible observations only")).toEqual({ ok: true });
  });

  it("keeps stage progression deterministic", () => {
    expect(Object.keys(ANALYSIS_STAGE_LABELS)).toHaveLength(7);
    expect(stageIsReached("fusion", "vision")).toBe(true);
    expect(stageIsReached("vision", "fusion")).toBe(false);
  });
});
