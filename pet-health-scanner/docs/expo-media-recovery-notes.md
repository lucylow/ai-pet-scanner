# Expo media recovery notes

Source: `/home/ubuntu/pet-health-scanner_helper/docs/media/camera/DOCS.md` and `/home/ubuntu/pet-health-scanner_helper/docs/media/imagepicker/DOCS.md`.

The Expo guidance requires camera permission handling before camera launch, checking `result.canceled` before reading picker assets, and guarding the possibility that no usable asset is returned. It also recommends `ImagePicker.getPendingResultAsync()` to recover a picker result after Android activity destruction and limiting camera previews to one active screen. The current Scan change follows the cancellation and missing-asset guidance; it does not add a camera preview or video capture.
