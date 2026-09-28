# Pet Health Scanner — Initial Implementation

## Scope

This first implementation is a portrait-oriented Expo React Native application for dogs and cats. It supports consent, local pet profiles, guided image capture from camera or library, image-quality feedback, structured observation notes, local scan history, educational guidance, privacy controls, and deterministic escalation copy.

The app is deliberately **non-diagnostic**. It does not identify diseases, prescribe treatment, produce clinical measurements, claim veterinarian review, or guarantee safety. A low-quality image fails closed into a limited-observation message. Notes that include signals such as uncontrolled bleeding, severe breathing difficulty, collapse, or severe pain are routed to urgent veterinary-care language rather than a reassuring result.

## Architecture

The mobile client is organized around Expo Router screens, reusable UI primitives, typed domain contracts in `lib/pet-health.ts` and `lib/scanner-contracts.ts`, local persistence with AsyncStorage, and a small service layer for quality scoring, safety decisions, analytics scrubbing, and an offline-safe upload queue. The server boundary in `server/pet-scanner-contract.ts` defines a validated vision input, a strict safe-result shape, a non-diagnostic prompt, and a fail-closed fallback. Provider credentials remain server-side.

| Area | Implementation |
|---|---|
| Entry and consent | `app/index.tsx`, `app/onboarding.tsx`, `saveConsent` |
| Main navigation | `app/(tabs)/_layout.tsx` |
| Home | `app/(tabs)/index.tsx` |
| Pet profiles | `app/pets.tsx` with editable metadata and explicit active-pet selection |
| Guided scan | `app/scan.tsx` |
| History and detail | `app/history.tsx`, `app/scan-detail.tsx`, and tab wrapper |
| Education | `app/learn.tsx` and tab wrapper |
| Settings and deletion | `app/settings.tsx` and tab wrapper |
| Contracts and safety | `lib/pet-health.ts`, `lib/scanner-contracts.ts` |
| Queue and privacy-aware analytics | `lib/scanner-services.ts` |
| Share summary and active-pet shortcuts | `lib/share-summary-format.ts`, `lib/share-summary.ts`, `components/active-pet-switcher.tsx` |
| Analysis progress and recovery | `lib/analysis-flow.ts` and `app/scan.tsx` |
| Monetization boundaries | `lib/monetization.ts`, `app/paywall.tsx`, and `lib/analysis-api.ts` |
| Billing adapter and refresh | `lib/billing.ts` with server verification still pending |
| Secure subscription snapshot | `lib/subscription-storage.ts` and `lib/subscription-status.ts` |
| Authenticated entitlement refresh | `lib/subscription-api.ts`, `lib/subscription-coordinator.ts`, and protected tRPC route `subscription.refresh` |
| Server AI boundary | `server/pet-scanner-contract.ts` and `server/pet-scanner-analysis.ts` |
| Media upload boundary | `lib/media-upload.ts`, `server/storage.ts`, and protected tRPC route `media.prepare` |
| Tests | `tests/scanner-contracts.test.ts` |

## Local Development

Run `pnpm dev` for the managed Expo development server. Run `pnpm check` for the TypeScript compiler and `pnpm test` for Vitest. The app is designed to run without external credentials in its local-first mode. The image picker uses Expo permissions and safely handles cancellation or denied camera access.

## Privacy and Safety Notes

The current implementation stores pet profiles, consent, and saved scan observations locally on the device. It does not silently switch the active pet based on image content. Users can delete local data from Settings. Before introducing cloud uploads, implement explicit retention controls, authenticated ownership, server-side media validation, provider audit logging, and a reviewed emergency escalation policy.

## Acceptance Checklist

| Capability | Status |
|---|---|
| Consent required before first launch | Implemented |
| Non-diagnostic positioning visible in onboarding and results | Implemented |
| Dogs and cats supported | Implemented |
| Editable pet metadata and explicit active pet | Implemented |
| Scan detail review and deletion | Implemented |
| Concise native share summary | Implemented |
| Active-pet switching shortcuts | Implemented |
| Safe local parsing fallback | Implemented |
| Analysis progress, retry, and cancellation | Implemented |
| Actionable local-save failure feedback | Implemented |
| Optional plans with transparent safety copy | Implemented |
| Server-authoritative entitlement boundary | Defined; store verification integration pending |
| Idempotent purchase initialization and restore UX | Implemented |
| Entitlement refresh deduplication | Implemented |
| Secure offline snapshot with stale-state copy | Implemented |
| Authorization-aware refresh failures and secure cleanup | Implemented |
| Session-aware refresh with cache-only display fallback | Implemented |
| Shared schemas and fail-closed analysis route | Implemented |
| Server multimodal analysis | Implemented with structured output validation and fail-closed provider fallback |
| Upload-to-analysis orchestration | Implemented with presigned completion, abort propagation, and retry classification |
| Authenticated media upload | Protected presigned PUT preparation, client completion, and private storage-proxy URL handoff |
| Pet profile creation and local persistence | Implemented |
| Scan area selection | Implemented |
| Camera and library capture entry points | Implemented |
| Image-quality feedback | Implemented |
| Optional observation notes | Implemented |
| Safe local observation result | Implemented |
| Urgent and veterinarian escalation copy | Implemented |
| Local history and deletion | Implemented |
| Learn and Settings screens | Implemented |
| Typed quality and safety tests | Implemented |
| External AI provider integration | Deferred behind server contract |
| Cross-device sync and user accounts | Deferred by design |

### Live scan flow

The guided scan now uses the protected tRPC boundary directly: it prepares a user-scoped presigned upload, completes the PUT from the selected device photo, submits only the server-approved storage-proxy URL for multimodal analysis, and persists the typed remote result alongside local scan history. The UI exposes upload and analysis stages, supports cancellation through an `AbortController`, retries after recoverable failures, and keeps the safety posture fail-closed when a server result cannot be obtained.

### Result-detail resilience

Saved scan details now validate optional remote-analysis metadata before rendering it. Valid records show the analysis version, confidence, generation time, and image-quality limitations; legacy or malformed records fall back to a clear local-safety explanation instead of exposing unvalidated server data.

### History resilience

Local scan history now validates each stored entry against the typed scan contract and filters malformed records without discarding valid observations. The History screen distinguishes malformed entries from a temporary storage read failure and gives the user a retry action with safety-conscious guidance instead of silently presenting an incomplete history.

### Offline scan recovery

Interrupted or failed remote scans now preserve the selected photo, active pet, body area, and user-entered context in a local draft. Returning to the scan screen restores a matching draft for the active pet and clearly labels it as unfinished. Successful server-backed saves clear the draft; cancellation and recoverable failures retain it for retry without creating a partial observation result.

### Media-selection resilience

The scan screen now normalizes picker metadata before any secure upload begins. It infers supported MIME types from filenames when needed, rejects unsupported formats and oversized assets with actionable copy, and leaves the current scan draft intact so users can choose another photo without losing context.

### Scan retry safety

The analysis state machine now carries an explicit attempt number and caps recoverable retries at three attempts. The guided scan also associates asynchronous upload and analysis callbacks with the active run, so a cancelled or superseded request cannot overwrite the current UI state or create a stale saved result.

### Accessibility and scan-status feedback

Guided scan media actions now expose descriptive labels and hints for camera, library, retake, cancellation, retry, dismissal, and final review actions. Selection errors and live upload or analysis status messages use polite alert semantics, while the retry-limit message explains when the saved draft should be reviewed instead of repeatedly resubmitted.

### Accessible history actions

History filters now expose selected state to assistive technologies, and retry, detail, delete, and close actions include descriptive labels and hints. Saved outcomes share one safety-conscious status-label helper so the UI consistently distinguishes an observation, a request to review the photo, and a prompt to contact a veterinarian.

### Local-data cleanup

Settings now clears profiles, saved observations, consent, unfinished scan drafts, and cached subscription status through explicit cleanup boundaries. The confirmation copy names unfinished drafts, and the result distinguishes complete deletion from partial failure so users know when to retry before deleting app data or reinstalling.

### Settings accessibility and entitlement feedback

Settings subscription controls now expose descriptive labels, hints, and polite status announcements. Refresh feedback explicitly states that verification comes from the server and that local cache alone does not grant premium access. Privacy cleanup and consent actions also identify their effect clearly for assistive technology users.

### Async loading feedback

Settings now renders an explicit subscription-status hydration state and avoids presenting the default snapshot as if it were loaded data. History refreshes are guarded against concurrent mount and focus requests, reducing duplicate local-storage work while retaining refresh-on-focus behavior.

### Accessible scan-form controls

Guided scan body-area choices now expose selected state and consistent labels through a shared helper. Optional context fields identify their purpose and explain that entered notes support organization rather than diagnosis. The review and leave-scan actions also describe their effects, including preservation of an unfinished local draft.

### Accessible scan-detail review

Scan-detail status is now announced as a concise outcome label, while validated server-review metadata is announced politely without changing its non-diagnostic meaning. Share, delete, close, and missing-record recovery actions expose descriptive labels and hints so users can understand each local-data effect before acting.

### Accessible onboarding consent

Onboarding now identifies major content sections for assistive technologies, exposes the consent control as a checked acknowledgement, and provides an accessible continuation hint. Attempting to continue without acknowledgement produces inline polite alert feedback using explicit observation-only language rather than an interruptive dialog.

### Recoverable screen errors

Scan detail now distinguishes a local-storage read failure from a missing observation and offers retry or History navigation without implying that data was deleted. Settings catches subscription hydration and refresh failures, resets loading state reliably, and keeps basic observation access explicitly available during subscription-service problems.

### App-level render recovery

The root navigation tree is wrapped in a recoverable error boundary. If a screen throws during rendering, the boundary presents a concise, accessible recovery card with a retry action that resets only the boundary state. It does not clear profiles, saved observations, unfinished drafts, consent, or subscription snapshots. Failure-copy constants live in the plain TypeScript domain module so their safety guarantees are directly testable.

### Offline-aware retry guidance

The app now reads Expo network state through a shared hook and distinguishes an offline device from a connection that may still have a remote-service failure. Scan surfaces preserve the local draft and explain that remote review should wait until reconnection. Settings uses the same guidance for subscription refresh while keeping basic observation access available.

### Network-state classification and reconnect feedback

Network state is classified as checking, offline, or online using internet reachability when available rather than assuming that a local network connection guarantees internet access. Guided scan announces when connectivity returns and preserves the unfinished draft, allowing the user to retry remote review intentionally. Subscription refresh uses the same connection-aware retry guidance.

### Testable connectivity behavior

Connectivity classification now lives in a plain TypeScript module separate from the Expo runtime hook. This keeps offline, online, and checking behavior deterministic in unit tests while the native hook subscribes to device network changes. Retry guidance remains explicit that local drafts are preserved and remote review may need reconnection.

### Home recovery visibility

Home now loads the unfinished scan draft alongside pets and saved scans. When the draft belongs to the active pet, it exposes a clear Resume scan action without deleting or mutating local data. A network-aware banner explains that saved observations and drafts remain available offline, and history navigation is labeled as locally saved, non-diagnostic content.

### Home refresh recovery

Home refreshes pets, saved scans, active-pet selection, and unfinished drafts as one guarded operation. Concurrent refreshes are ignored, loading feedback is shown when no data is available yet, and a failed refresh leaves already-visible local data intact while offering an accessible retry action.

### Home refresh state preservation

Home refresh failures now use shared, testable copy that explicitly says currently visible local data remains intact. The retry action explains that it does not delete or replace visible pets, saved observations, or drafts, making the recovery contract clear to both users and assistive technologies.

### Home data-state semantics

Home distinguishes an empty local state from a temporary refresh failure. When no pet exists, the primary action creates a pet profile; when a pet exists, it starts a new scan; and when an unfinished draft belongs to the active pet, a separate Resume scan action restores that work. If local reads fail, copy directs the user to retry and confirms that existing data was not deleted.

### Shared offline banner

The root layout now provides a shared, dismissible offline banner for the full navigation tree. It explains that local profiles, observations, and unfinished drafts remain available while remote review and subscription verification wait for reconnection. Dismissal is temporary: the notice is restored after connectivity changes, preventing a stale dismissal from hiding a future offline state. Copy and accessibility guidance are centralized in `lib/network-awareness.ts` and covered by deterministic tests.

### Async operation status accessibility

Scan progress announcements now include state-specific accessibility guidance. Uploading and analysis states explain that cancellation preserves the unfinished draft, recoverable failures explain that retry is safe because the photo and notes remain local, and non-retryable failures clarify that no observation result was created. Successful completion is explicitly described as an observation ready for review rather than a diagnosis.

### Visible retry-attempt guidance

The scan recovery card now shows the current attempt and remaining retry allowance while upload, analysis, or recoverable error states are active. After the final attempt, the UI states that the saved draft remains available instead of implying that another immediate retry is possible. The same attempt information is exposed through accessibility hints and is covered by deterministic unit tests.

### Scan-stage timeline

The guided scan now shows a compact progress timeline for Photo ready, Secure upload, Cautious review, and Observation saved. When a recoverable error occurs, the timeline identifies the draft-preserved state and explains that retry or cancellation options appear below. Each stage exposes current-state semantics to assistive technologies without changing the non-diagnostic safety boundary.

### Post-scan glance summary

Saved observation details now begin with an accessible “At a glance” card that combines the safety-conscious outcome label, image-quality limitation, and whether validated server review metadata is available. The card explicitly frames the information as organized visible evidence rather than a diagnosis or measurement, while the detailed observations, next steps, and emergency guidance remain available below.

### Veterinary-visit summary export

Saved observations now offer a dedicated visit-summary share action. The generated text includes the pet, visible area, date, outcome, image-quality limit, observations, caregiver notes, suggested next steps, and a non-diagnostic disclaimer. It intentionally excludes private storage URLs and object keys, so sharing remains limited to user-facing observation content rather than internal media provenance.

### Review before sharing

Veterinary visit summaries now open in a review screen before the native share sheet. Users can edit the generated text and toggle caregiver notes off before sharing. The screen explains that the content is non-diagnostic and excludes private storage URLs and object keys; the final share uses the reviewed note-selection state while preserving the user’s edits.

### Clipboard fallback for reviewed summaries

The review-before-share screen now offers Copy summary in addition to the native share sheet. Clipboard operations are asynchronous and report accessible success or failure feedback; browser permission failures do not block the native share option. The exact text currently shown in the editable preview is used for both sharing and copying, preserving user edits and caregiver-note exclusions.

### Reviewed-summary action feedback

Copy and share actions on the review screen now ignore duplicate concurrent presses, show a temporary working state, and announce success or failure through a polite live region. Feedback clears after a short interval, while the edited summary remains visible so users can retry without losing their changes.

### Offline-aware reviewed-summary sharing

When a reviewed summary cannot be shared while the device is offline, the screen now explains that the edited text remains available locally and can be copied immediately or shared again after reconnection. Connected share failures retain the shorter retry guidance. The distinction is centralized and covered by deterministic tests so offline status never implies that local content was lost.

### Explicit retry-share recovery

After a share failure, the primary action changes to Retry sharing and uses the edited summary text plus the current caregiver-note selection. A successful retry returns the label to Share reviewed summary; while any attempt is active, duplicate presses are blocked and the label becomes Working. This keeps recovery explicit without clearing local edits.

### Share-attempt guidance

The reviewed-summary screen now shows the current share attempt and a clear stopping point after three failed attempts. Before the limit, the message suggests copying the edited text instead if sharing continues to fail. At the limit, the share action is no longer offered as an immediate retry and the user is directed to Copy summary; the edited text and caregiver-note selection remain unchanged.

### Reconnect-aware share-attempt reset

If the reviewed-summary screen reaches its share-attempt limit while offline and connectivity later returns, the attempt count and stopping state reset. The screen announces that retry allowance was restored while keeping the edited summary and caregiver-note selection unchanged. This reset is triggered only on an observed offline-to-online transition.

### Connection indicator beside sharing controls

The reviewed-summary screen now shows a compact connection indicator beside the sharing controls. Offline copy emphasizes that the reviewed text can be copied locally, checking copy avoids implying that remote sharing is ready, and online copy states that connection availability does not guarantee remote service availability. The indicator is informational and does not alter local edits or sharing limits.

### Last-checked connection freshness

The reviewed-summary connection indicator now includes a relative last-checked label such as “Last checked just now” or “Last checked 2 minutes ago.” The timestamp reflects the most recent observed network classification change within the mounted screen and is presented as freshness context only; it does not claim that the remote sharing service is available.

### Manual connection recheck

The reviewed-summary screen now offers Check connection again beside the connection indicator. The action calls the device network-state check, announces checking and completion states, and never clears edited summary text, caregiver-note selection, or share-attempt state. A failed recheck remains informational and does not imply that remote sharing is available.

### In-progress connection-check feedback

While a manual connection check is running, the freshness label changes to “Checking connection now” and the control changes to “Checking…”. Both are exposed through accessible text, and the check leaves the reviewed summary, caregiver-note selection, and sharing state untouched.

### Reviewed-summary accessibility semantics

Connection recheck, share, retry, and copy controls now expose disabled and busy states to assistive technologies. The share hint changes when the attempt limit is reached, directing users to Copy summary, while checking feedback identifies the in-progress connection refresh. These semantics preserve the distinction between local text availability and remote service availability.

### Selective visit-summary privacy controls

The review screen now lets users include or exclude a plain-language photo reference and the visible observation-details section before copying or sharing. Suggested next steps and the non-diagnostic safety disclaimer remain included. Excluding the photo reference removes only the descriptive line; no private storage URL, object key, or media metadata is exposed.

### Reset sharing options

The reviewed-summary screen now includes Reset sharing options. It restores caregiver notes, the plain-language photo reference, and observed details to their default included state, while preserving the edited summary text and mandatory safety guidance. The reset is announced accessibly and does not delete local data.

### Pre-share privacy selection summary

The reviewed-summary screen now shows which optional sections are currently included before copying or sharing: the photo reference, observed details, and caregiver notes. The summary explicitly separates these optional selections from mandatory suggested next steps and the non-diagnostic safety disclaimer, which cannot be removed through the privacy toggles.

### Exclude-all privacy shortcut

The reviewed-summary screen now offers Exclude all optional sections for users who want the smallest shareable summary. It removes caregiver notes, the photo reference, and observed details in one action, while retaining suggested next steps and the non-diagnostic safety disclaimer. The action preserves the editable summary surface and does not delete local data.

### Final pre-share confirmation

Before opening the native share sheet, users now receive an explicit confirmation card containing the current optional-section selection and a reminder that sharing is voluntary and non-diagnostic. Confirm and share opens the share sheet with the exact text currently shown; Not yet closes the confirmation without changing the reviewed text or privacy options.

### Photo media consent boundary

The final share confirmation now requires an explicit acknowledgement that the current share is text-only: it does not attach the saved photo or expose private media metadata. This acknowledgement is separate from the optional plain-language photo-reference toggle, so users can include descriptive context without implying that the underlying image will be sent.
