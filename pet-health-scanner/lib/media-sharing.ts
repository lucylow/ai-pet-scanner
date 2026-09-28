export type MediaPermissionSource = "photo library" | "camera";
export type MediaPermissionRecoveryAction = "retry" | "settings";

export function mediaPermissionRecoveryAction(canAskAgain: boolean): MediaPermissionRecoveryAction {
  return canAskAgain ? "retry" : "settings";
}

export function mediaPermissionRecoveryCopy(source: MediaPermissionSource, canAskAgain: boolean) {
  if (canAskAgain) {
    return `${source[0].toUpperCase()}${source.slice(1)} access was not granted. You can try again, or continue with text-only sharing.`;
  }
  return `${source[0].toUpperCase()}${source.slice(1)} access is disabled for this app. Enable it in device settings for optional sharing; text-only sharing remains available.`;
}

export function mediaCancelledCopy(source: MediaPermissionSource) {
  return `${source[0].toUpperCase()}${source.slice(1)} selection was cancelled. Text-only sharing remains available.`;
}

export function mediaUnavailableCopy(source: MediaPermissionSource) {
  return `${source[0].toUpperCase()}${source.slice(1)} selection is unavailable right now. Text-only sharing remains available.`;
}

export function pendingMediaRecoveryFailureCopy() {
  return "The pending photo selection could not be restored. Text-only sharing remains available.";
}

export function mediaShareFailureCopy() {
  return "Photo sharing is unavailable right now. The selected photo remains only on this device.";
}

export function mediaPickerActionLabel(kind: "camera" | "library", busy: boolean, hasSelection: boolean) {
  if (busy) return "Preparing photo sharing";
  if (kind === "camera") return "Capture a photo with the camera";
  return hasSelection ? "Choose a different photo" : "Choose a photo to share separately";
}

export function mediaPickerActionHint(kind: "camera" | "library") {
  return kind === "camera"
    ? "Requests camera permission and captures a local photo without changing the reviewed text"
    : "Requests photo-library permission and selects a local photo without changing the reviewed text";
}

export function mediaActionDisabled(photoBusy: boolean, actionBusy: boolean) {
  return photoBusy || actionBusy;
}

export function mediaShareActionLabel(busy: boolean, hasSelection: boolean, available: boolean) {
  if (!hasSelection) return "Choose a photo before sharing";
  if (busy) return "Sharing selected photo";
  if (!available) return "Photo sharing unavailable";
  return "Share selected photo separately";
}

export function mediaShareActionHint(available: boolean) {
  return available
    ? "Opens the system share sheet for the selected photo only; the reviewed text is not attached"
    : "Photo sharing is unavailable on this device; the selected photo remains on this device and text-only sharing is still available";
}

export function mediaSettingsOpenedCopy() {
  return "Device settings opened. Return here after enabling photo access.";
}

export function mediaSettingsOpenFailureCopy() {
  return "Device settings could not be opened. Text-only sharing remains available.";
}
