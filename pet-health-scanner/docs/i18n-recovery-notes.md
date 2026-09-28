# Recovery-status localization notes

The translation registry defines `CoreKey` from `ENGLISH_CORE_COPY`, then merges `translatedCore`, `translatedRecovery`, and `translatedScanRecovery` into every i18next resource. New recovery-status keys must therefore be added to `ENGLISH_CORE_COPY` and supplied through a translated resource map or a dedicated pure formatter. The supported language set is English, French, Spanish, German, Portuguese, Italian, Dutch, Japanese, Korean, Simplified Chinese, and Arabic; Arabic uses the existing RTL provider configuration.
