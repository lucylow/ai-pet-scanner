# Project TODO

- [x] Review the Pet Health Scanner master build brief
- [x] Initialize the Expo React Native TypeScript project
- [x] Create the mobile interface design plan
- [x] Replace starter branding with a unique Pet Health Scanner icon and app configuration
- [x] Implement calm visual tokens and reusable UI primitives
- [x] Implement onboarding, explanation, and consent acknowledgement
- [x] Implement local pet profile creation, editing, selection, and archive flows
- [x] Implement Home, Scan Now, History, Learn, and Settings navigation
- [x] Implement guided media capture/library selection and media review
- [x] Implement typed scan domain models and deterministic quality/safety validation
- [x] Implement a local non-diagnostic observation result service with fail-closed behavior
- [x] Implement scan history persistence with AsyncStorage
- [x] Add unit tests for consent, pet validation, quality checks, and safety escalation
- [x] Add privacy, limitations, setup, and acceptance documentation
- [x] Run TypeScript checks, lint, tests, and visual verification
- [x] Save the final project checkpoint for delivery
- [x] Incorporate the new typed environment, domain, HTTP, storage, media-quality, camera-guide, safety-policy, and analysis contracts from the second implementation brief
- [x] Add an offline-safe upload queue and privacy-aware analytics facade
- [x] Add server-side AI contract and prompt boundary without exposing provider secrets in the client
- [x] Improve pet profiles with editable metadata and explicit active-pet selection
- [x] Add scan-detail review with full observations, image preview, safety copy, and delete action
- [x] Strengthen scan validation for pet selection, image metadata, and observation context
- [x] Expand automated tests for pet profile validation, scan persistence, safety escalation, and route-ready data
- [x] Add structured scan context questions for onset, change, behavior, appetite, and pain-like signals
- [x] Improve active-pet confirmation and scan empty-state handling
- [x] Add clearer scan progress, retry, and save feedback states
- [x] Expand tests for scan context normalization and user-facing safety escalation
- [x] Add scan-history filters by pet, body area, and status
- [x] Add history timeline grouping and clearer empty/filter states
- [x] Harden local persistence with safe parsing and recoverable storage errors
- [x] Add tests for history filtering, grouping, and persistence fallbacks
- [x] Add concise scan summary sharing and export actions
- [x] Add a compact active-pet switcher to Home and History
- [x] Add resilient local-save error handling with user-facing retry feedback
- [x] Add tests for share-summary formatting, pet switching, and save failures
- [x] Add accessible scan-summary sharing using the native share sheet
- [x] Add reusable accessibility-first button and status primitives where they improve existing flows
- [x] Add active-pet switching shortcuts to Home and History
- [x] Add tests for share-summary formatting and accessibility-safe status copy
- [x] Add an explicit analysis-progress state machine with cancel and retry behavior
- [x] Add actionable error recovery for media selection, analysis, and local save failures
- [x] Improve accessibility announcements and labels for scan status transitions
- [x] Add tests for analysis state transitions, cancellation, retry, and failure copy
- [x] Add a typed client-to-server analysis request boundary with timeout and abort support
- [x] Add an explicit cancel action during analysis progress
- [x] Add device recovery copy for interrupted upload and storage failures
- [x] Add tests for abort, timeout, and server-contract failure mapping
- [x] Review the monetization brief and select safety-compatible requirements
- [x] Add typed entitlement, subscription, and purchase-recovery boundaries without provider secrets in the client
- [x] Add transparent upgrade UI that preserves core observation access and avoids diagnostic paywalls
- [x] Add tests for entitlement states, restore-purchase failure, and feature-gate copy
- [x] Add a typed purchase-adapter interface with idempotent initialization and restore support
- [x] Add entitlement refresh and stale-state handling boundaries
- [x] Improve paywall restore, pending, cancellation, and verification-failure UX
- [x] Add tests for adapter initialization, restore mapping, and entitlement refresh failures
- [x] Add a typed subscription snapshot and user-facing status labels
- [x] Add Settings controls for refresh, restore, and store-management handoff
- [x] Add stale-entitlement and verification-pending recovery copy
- [x] Add tests for subscription status formatting and refresh fallback behavior
- [x] Add secure local persistence for the last verified subscription snapshot
- [x] Add a typed entitlement-refresh client boundary with timeout and fallback behavior
- [x] Improve offline and stale-subscription messaging in Settings and paywall flows
- [x] Add tests for snapshot persistence, refresh fallback, and stale-state transitions
- [x] Add an authenticated entitlement-refresh client with typed success and failure mapping
- [x] Add secure logout cleanup for cached subscription snapshots and purchase identity data
- [x] Add native recovery guidance for SecureStore failure and device reinstall scenarios
- [x] Add tests for refresh authorization errors and logout cleanup boundaries
- [x] Add a session-aware entitlement refresh coordinator that never grants access from local cache alone
- [x] Wire Settings refresh to authenticated refresh results with cached fallback messaging
- [x] Add explicit session/logout cleanup boundaries for subscription and purchase state
- [x] Add tests for missing-session, refresh-success, refresh-failure, and logout cleanup paths
- [x] Add a server-side entitlement route contract with schema validation and fail-closed responses
- [x] Add a server-side analysis request boundary that returns non-diagnostic typed results
- [x] Connect client refresh and analysis services to the shared route contracts
- [x] Add end-to-end tests for unauthorized, timeout, invalid-response, and retry flows
- [x] Replace the fail-closed analysis stub with a server-side multimodal model call
- [x] Validate structured model output and fall back safely on provider or parsing failures
- [x] Connect the mobile scan flow to authenticated server analysis results
- [x] Add tests for server model failure, malformed output, and non-diagnostic safety copy
- [x] Add an authenticated media-upload request boundary with size, MIME, and timeout validation
- [x] Keep source media private and pass only server-approved URLs to analysis
- [x] Persist verified analysis results with explicit source and safety metadata
- [x] Add tests for upload rejection, private-media handling, and result persistence recovery
- [x] Add an authenticated upload-preparation route with validated filename, MIME, and size metadata
- [x] Add an upload-to-analysis orchestration service with abort and retry propagation
- [x] Persist server-approved media URL and structured analysis provenance with each scan result
- [x] Add tests for upload preparation, orchestration failure recovery, and result persistence
- [x] Add a server-side presigned upload contract with private object-key scope and expiry
- [x] Add client upload completion handling before invoking server analysis
- [x] Wire the guided scan UI to upload, analyze, cancel, retry, and persist provenance
- [x] Add end-to-end tests for upload completion failures and retry recovery
- [x] Add a typed tRPC-backed scan orchestration path
- [x] Wire the guided scan screen to secure upload, server analysis, cancellation, retry, and local persistence
- [x] Persist remote analysis results and private media provenance in scan history
- [x] Show remote analysis provenance and image-quality limitations on scan detail
- [x] Add fail-safe rendering for malformed or legacy remote analysis records
- [x] Add tests for result-detail safety copy and provenance fallback
- [x] Add a safe normalized scan-history loader for malformed entries
- [x] Show a recoverable history-storage warning instead of silently hiding local data errors
- [x] Add tests for history normalization and malformed-entry filtering
- [x] Add typed offline scan recovery status for interrupted remote scans
- [x] Preserve user-entered scan context when a remote scan is cancelled or fails
- [x] Add tests for offline recovery copy and retry-safe scan state
- [x] Add typed media-selection validation for unsupported or unreadable assets
- [x] Show actionable photo-selection errors before remote upload begins
- [x] Add tests for media metadata normalization and selection recovery copy
- [x] Add explicit retry-attempt and cancellation semantics to scan orchestration
- [x] Prevent stale analysis callbacks from updating the current scan state
- [x] Add tests for retry attempt limits and stale-result protection
- [x] Add accessible labels and state announcements to scan media actions
- [x] Improve retry-limit and cancellation status copy for assistive technologies
- [x] Add tests for accessibility-safe scan status copy
- [x] Add accessibility labels to history filter and result actions
- [x] Clarify history result status copy for non-diagnostic review outcomes
- [x] Add tests for history action labels and safety-preserving navigation copy
- [x] Include unfinished scan drafts in local-data cleanup boundaries
- [x] Make local-data deletion feedback distinguish success from partial failure
- [x] Add tests for draft cleanup and privacy-safe deletion behavior
- [x] Add accessible labels and live status semantics to Settings subscription actions
- [x] Make subscription refresh and restore messaging explicit about verification boundaries
- [x] Add tests for safe subscription-feedback copy and action state semantics
- [x] Add explicit loading state handling for Settings entitlement hydration
- [x] Prevent duplicate History refresh work during focus and mount events
- [x] Add tests for async loading and retry feedback semantics
- [x] Add selected-state semantics to scan body-area controls
- [x] Add accessible labels to scan context inputs and final navigation actions
- [x] Add tests for scan-form accessibility copy and selected state semantics
- [x] Add accessible labels and hints to scan-detail sharing and delete actions
- [x] Announce scan-detail status and provenance information safely
- [x] Add tests for scan-detail action copy and status accessibility semantics
- [x] Add accessible labels and live-region semantics to onboarding consent content
- [x] Clarify consent continuation feedback and safe navigation semantics
- [x] Add tests for consent accessibility copy and continuation behavior
- [x] Add safe recovery UI for unexpected scan-detail and Settings load failures
- [x] Prevent unhandled async errors from leaving screens in stale loading states
- [x] Add tests for recoverable screen-error copy and retry semantics
- [x] Add an app-level recoverable render-error boundary with a safe reset action
- [x] Ensure global recovery never deletes local profiles, scans, or drafts
- [x] Add tests for error-boundary copy and local-data preservation guarantees
- [x] Add a shared network-awareness hook for scan and subscription retry surfaces
- [x] Explain offline limitations before remote analysis or entitlement refresh retries
- [x] Add tests for offline status copy and retry guidance
- [x] Add pure network-state classification for offline, online, and checking states
- [x] Show reconnect-aware feedback when the device returns online during scan use
- [x] Add unit tests for network-state copy and retry guidance
- [x] Add mocked connectivity tests for offline, online, and checking states
- [x] Add explicit reconnect-safe retry copy coverage
- [x] Keep network classification independent from native Expo runtime in tests
- [x] Show offline status on Home when remote features are unavailable
- [x] Surface an unfinished scan draft shortcut for the active pet
- [x] Add tests for Home recovery guidance and draft visibility copy
- [x] Add explicit Home refresh loading and recoverable error state
- [x] Prevent rejected local reads from clearing already-visible Home data
- [x] Add tests for Home refresh failure copy and state preservation
- [x] Add pure Home refresh outcome copy for deterministic testing
- [x] Verify Home refresh failure preserves existing pets, scans, and drafts
- [x] Add tests for Home retry accessibility copy and state-preservation guidance
- [x] Add explicit Home empty-state semantics for no pets versus unavailable local data
- [x] Ensure Home action labels distinguish starting a new scan from resuming a draft
- [x] Add tests for Home data-state copy and safe navigation semantics
- [x] Add a shared dismissible offline-status banner for network-dependent screens
- [x] Integrate offline guidance with Home, Scan, History, and Settings status surfaces
- [x] Add deterministic tests for banner visibility, dismissal, reconnect, and accessibility copy
- [x] Add shared operation-status copy for scan upload, remote analysis, and entitlement refresh
- [x] Clarify retry and cancellation outcomes for assistive technologies
- [x] Add deterministic tests for async operation status transitions and safe retry guidance
- [x] Show the current scan retry attempt and remaining retry allowance
- [x] Clarify retry-limit copy and preserve the local draft after the limit is reached
- [x] Add deterministic tests for retry-attempt labels and accessibility guidance
- [x] Add a compact scan-stage timeline for photo, secure upload, remote review, and saved observation states
- [x] Make timeline states accessible and consistent with cancellation, retry, and offline recovery
- [x] Add deterministic tests for scan-stage labels and state transitions
- [x] Add a concise post-scan summary with outcome, image-quality limits, and next steps
- [x] Keep non-diagnostic safety context visible in the completed observation surface
- [x] Add deterministic tests for summary labels and safety-preserving copy
- [x] Add a privacy-conscious veterinary-visit summary export for saved observations
- [x] Include observed notes, image-quality limits, next steps, and the non-diagnostic disclaimer
- [x] Add deterministic tests for visit-summary formatting and sensitive-data boundaries
- [x] Add a review-before-share screen for veterinary visit summaries
- [x] Allow users to edit or exclude caregiver notes before sharing
- [x] Add deterministic tests for preview copy and explicit share confirmation
- [x] Add copy-to-clipboard for reviewed veterinary visit summaries
- [x] Provide accessible success and failure feedback for clipboard actions
- [x] Add deterministic tests for clipboard-safe status copy
- [x] Add transient success feedback after copying or sharing a reviewed summary
- [x] Guard copy and share actions against duplicate concurrent presses
- [x] Add deterministic tests for sharing feedback copy and action-state semantics
- [x] Add offline-aware share failure copy for reviewed summaries
- [x] Explain that edited summary text remains available locally after share failure
- [x] Add deterministic tests for offline share guidance and retry semantics
- [x] Show an explicit Retry share action after a reviewed-summary share failure
- [x] Preserve edited summary text and caregiver-note selection across retry attempts
- [x] Add deterministic tests for retry-share copy and action visibility semantics
- [x] Show the current reviewed-summary share attempt count
- [x] Provide a clear stopping point and copy fallback after repeated share failures
- [x] Add deterministic tests for attempt-count labels and stopping guidance
- [x] Reset the reviewed-summary share-attempt limit when connectivity is restored
- [x] Announce that retry allowance was restored without changing edited text
- [x] Add deterministic tests for reconnect reset and preserved summary state
- [x] Add a compact connection-state indicator beside reviewed-summary sharing controls
- [x] Explain offline, checking, and online states without implying remote success
- [x] Add deterministic tests for connection-indicator labels and accessibility semantics
- [x] Track the latest observed connection-check time for reviewed-summary sharing
- [x] Show freshness copy without implying remote service availability
- [x] Add deterministic tests for last-checked connection labels
- [x] Add a manual connection recheck action beside reviewed-summary sharing controls
- [x] Announce checking and refreshed connection states without clearing reviewed edits
- [x] Add deterministic tests for manual recheck labels and safe state transitions
- [x] Show an explicit checking-state timestamp while a manual connection check runs
- [x] Keep connection-check progress accessible without clearing reviewed content
- [x] Add deterministic tests for checking-state freshness copy
- [x] Improve screen-reader labels for connection and sharing controls
- [x] Clarify disabled, retry, and checking states through accessibility hints
- [x] Add deterministic tests for reviewed-summary accessibility copy
- [x] Add controls to exclude the photo or selected observation sections before sharing
- [x] Keep the non-diagnostic disclaimer and next-step safety guidance included
- [x] Add deterministic tests for selective section exclusion and privacy boundaries
- [x] Add a Reset sharing options action to restore default selections
- [x] Announce restored defaults without clearing reviewed text or safety guidance
- [x] Add deterministic tests for reset-sharing-options labels and state semantics
- [x] Show a concise summary of selected and excluded sections before sharing
- [x] Keep mandatory safety content clearly separated from optional sections
- [x] Add deterministic tests for privacy-selection summary copy
- [x] Add an Exclude all optional sections shortcut to reviewed summaries
- [x] Preserve mandatory next steps and the non-diagnostic safety disclaimer
- [x] Add deterministic tests for the shortcut copy and resulting selection state
- [x] Add an explicit final confirmation before reviewed-summary sharing
- [x] Show selected optional sections and mandatory safety content in the confirmation
- [x] Add deterministic tests for final confirmation copy and privacy semantics
- [x] Add explicit consent before sharing a saved pet photo
- [x] Keep photo consent separate from plain-language photo reference selection
- [x] Add deterministic tests for media-consent copy and privacy boundaries

- [ ] Audit mobile screens for dead-end actions, missing persistence, and incomplete async feedback
- [x] Prevent endless startup spinner when local consent cannot be read
- [x] Add recoverable scan hydration error state for pet and draft storage failures
- [x] Add recoverable pet-profile persistence feedback for save, select, archive, and load failures
- [x] Remove unintended render-time theme logging

- [ ] Replace remaining purchase and restore placeholder actions with safe functional boundaries or explicit unavailable-state recovery
- [x] Replace paywall fake checkout and restore placeholders with honest unavailable-state and server-verification behavior
- [x] Wire Settings restore to server-verified entitlement refresh with busy and accessibility semantics
- [x] Validate billing-flow changes with TypeScript, 39 unit tests, and lint

- [ ] Audit History and scan-detail delete/share actions for recoverable failure feedback and duplicate-operation protection
- [x] Add recoverable local-history deletion feedback and protect against duplicate delete operations
- [x] Validate History interaction changes with TypeScript, 39 unit tests, and lint

- [ ] Audit scan-detail share and delete actions for failure recovery, busy states, and safe preservation
- [x] Add inline share success and failure feedback to scan detail
- [x] Protect scan-detail share and delete actions from duplicate concurrent presses
- [x] Preserve scan detail when deletion fails and provide accessible recovery guidance
- [x] Validate scan-detail changes with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining async effects and user actions for unhandled rejections or stale loading state
- [x] Explicitly handle Home refresh promises from mount and focus effects
- [x] Add recoverable camera and photo-library picker failure feedback while preserving drafts
- [x] Validate async reliability changes with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining end-to-end gaps across onboarding, learn, settings, history, and scan flows
- [x] Explicitly handle History refresh promises from mount and focus effects
- [x] Explicitly handle scan-detail refresh promises from its lifecycle effect
- [x] Validate lifecycle async changes with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining user-facing actions for truthful feedback, accessibility, and safe recovery
- [x] Add onboarding consent save failure recovery and truthful inline feedback
- [x] Prevent duplicate onboarding continuation presses while consent is saving
- [x] Validate onboarding changes with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining incomplete user flows and placeholder actions across the app
- [x] Add History refresh recovery when pet-profile storage reads fail
- [x] Preserve already-visible History data when a refresh fails
- [x] Validate the History refresh change with TypeScript, 39 unit tests, and lint

- [ ] Audit the next remaining functional reliability gap and add a recoverable user-facing outcome
- [x] Persist Home active-pet switch changes instead of updating only in-memory state
- [x] Show recoverable feedback when Home active-pet persistence fails
- [x] Validate Home active-pet behavior with TypeScript, 39 unit tests, and lint

- [ ] Audit the next concrete functional reliability gap and add a safe recovery path
- [x] Route offline, interrupted-analysis, and cancellation draft saves through one safe persistence helper
- [x] Show truthful recovery feedback when an unfinished scan cannot be saved locally
- [x] Validate scan draft persistence changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next core action for silent failure and add user-visible recovery feedback
- [x] Recover from archived or stale active-pet IDs during profile hydration
- [x] Persist a valid replacement active-pet selection when needed
- [x] Validate active-pet recovery with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a user-visible recovery path
- [x] Guard Settings local-data deletion against duplicate operations
- [x] Show truthful deleting, success, partial-failure, and retry feedback for local-data cleanup
- [x] Validate Settings deletion changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Guard pet archiving against duplicate confirmations and concurrent profile saves
- [x] Show accessible Archiving state and preserve the profile on archive failure
- [x] Validate pet archive changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Make the shared active-pet switcher delegate persistence to its parent exactly once
- [x] Prevent concurrent active-pet selections and show an accessible Saving state
- [x] Validate active-pet switcher changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Keep a successfully persisted scan successful when only draft cleanup fails
- [x] Retry unfinished-draft cleanup before surfacing a truthful cleanup warning
- [x] Validate scan persistence changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Add an explicit scan-screen action to remove an unfinished local draft
- [x] Guard draft removal with an accessible busy state and preserve the draft on failure
- [x] Validate stale-draft removal with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Add a distinct recoverable error state when visit-summary local loading fails
- [x] Add an accessible retry action that preserves local observation data
- [x] Validate visit-summary recovery changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Guard pet-profile selection against rapid concurrent presses
- [x] Show accessible Saving state and preserve the prior selection on failure
- [x] Validate pet selection changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Guard startup consent resolution against duplicate retry attempts
- [x] Show truthful startup retry busy state with accessibility semantics
- [x] Validate startup recovery changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Make Home refresh retry controls show an accessible busy state
- [x] Prevent duplicate Home retry presses during local-data reload
- [x] Validate Home refresh changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Make History refresh retry controls show an accessible busy state
- [x] Prevent duplicate History retry presses during local-data reload
- [x] Validate History refresh changes with TypeScript, 39 unit tests, and lint

- [ ] Audit the next mobile reliability gap and add a safe, user-visible recovery path
- [x] Preserve the failed Home active-pet target for direct retry
- [x] Add accessible retry feedback for active-pet persistence failures
- [x] Validate Home active-pet retry changes with TypeScript, 39 unit tests, and lint

- [ ] Audit current compile errors, unhandled async failures, and incomplete recovery states
- [x] Catch native in-app browser failures instead of allowing unhandled async rejections
- [x] Show user-visible guidance when an external help link cannot open
- [x] Validate error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Catch native cached-user read failures during auth initialization
- [x] Fall back to session validation instead of leaving auth startup unresolved
- [x] Validate auth error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Catch local session cleanup failures during logout
- [x] Always clear in-memory auth state even when server or secure-storage cleanup fails
- [x] Validate logout error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Prevent scan-detail retry state from causing a refresh dependency loop
- [x] Add stable busy-state guarding for scan-detail local reloads
- [x] Validate scan-detail error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Prevent scan-detail retry state from creating a refresh dependency loop
- [x] Add stable busy-state guarding for scan-detail local reloads
- [x] Validate the additional error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Guard Settings entitlement refresh against duplicate invocations
- [x] Expose disabled and busy accessibility semantics for subscription refresh controls
- [x] Validate Settings error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Add a direct retry action for cached subscription hydration failures
- [x] Guard hydration retry state with accessible busy feedback
- [x] Validate Settings hydration error handling with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Guard visit-summary local loading against concurrent retry presses
- [x] Show accessible Loading state while retrying a visit-summary read
- [x] Validate visit-summary error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit remaining native and asynchronous operations for uncaught failures and weak recovery states
- [x] Centralize startup consent resolution behind one in-flight guard
- [x] Remove the duplicated startup async path and keep recovery behavior consistent
- [x] Validate startup error-handling repairs with TypeScript, 39 unit tests, and lint

- [ ] Audit the next React Native reliability gap and add a safe, user-visible recovery path
- [x] Preserve network recheck failures as explicit hook state
- [x] Show persistent accessible connection-check failure feedback without changing reviewed content
- [x] Validate network error handling with TypeScript, 39 unit tests, and lint

- [x] Audit the next React Native reliability gap and add a safe, user-visible recovery path
- [x] Prevent rejected active-pet persistence callbacks from leaking through button presses
- [x] Show active-pet filter persistence failures in History without changing saved observations
- [x] Validate active-pet error handling with TypeScript, 39 unit tests, and lint

- [x] Guard pet-profile refresh retries against duplicate reads and expose truthful busy feedback
- [x] Preserve existing pet-profile data when refresh fails
- [x] Validate pet-profile refresh recovery with TypeScript, 39 unit tests, and lint

- [x] Prevent pet-profile form edits and cancellation from racing with active profile saves
- [x] Disable conflicting profile actions while selecting, archiving, saving, or refreshing
- [x] Validate pet-profile interaction recovery with TypeScript, 39 unit tests, and lint

- [x] Guard scan photo selection against duplicate camera or library launches and expose truthful busy feedback
- [x] Preserve the current scan draft when photo selection fails or is cancelled
- [x] Validate scan photo-picker recovery with TypeScript, 39 unit tests, and lint

- [x] Prevent scan area and context edits from racing with an active remote review
- [x] Keep cancel and draft-preservation actions available during remote review
- [x] Validate scan-form interaction locking with TypeScript, 39 unit tests, and lint

- [x] Make scan cancellation await draft preservation and expose truthful cancellation busy feedback
- [x] Keep retry and dismissal actions guarded while cancellation saves the draft
- [x] Validate scan cancellation recovery with TypeScript, 39 unit tests, and lint

- [x] Prevent unfinished-draft removal from racing with active scan saving or cancellation
- [x] Keep draft cleanup available again after the scan operation settles
- [x] Validate draft-cleanup interaction locking with TypeScript, 39 unit tests, and lint

- [x] Guard scan setup hydration retries against duplicate local reads and expose truthful retry busy feedback
- [x] Preserve local pet and draft data when scan setup hydration fails
- [x] Validate scan setup recovery with TypeScript, 39 unit tests, and lint

- [x] Guard Home active-pet retry against duplicate persistence attempts and expose truthful busy feedback
- [x] Preserve the previous active pet when Home persistence fails
- [x] Validate Home active-pet retry recovery with TypeScript, 39 unit tests, and lint

- [x] Add and use a shared accessible AsyncActionStatus component for Home active-pet recovery feedback
- [x] Preserve Home active-pet retry behavior and accessibility semantics through the shared component
- [x] Validate shared async status changes with TypeScript, 39 unit tests, and lint

- [x] Use shared AsyncActionStatus for History deletion and active-pet persistence failures
- [x] Preserve History retry and deletion behavior through the shared status component
- [x] Validate History async feedback changes with TypeScript, 39 unit tests, and lint

- [x] Use shared AsyncActionStatus in Settings and guard cached subscription retry presses
- [x] Distinguish verified subscription success from recoverable subscription errors
- [x] Validate Settings async feedback changes with TypeScript, 39 unit tests, and lint

- [x] Use shared AsyncActionStatus in Paywall and distinguish verified restoration from recoverable errors
- [x] Preserve fail-closed checkout and restoration behavior through the shared status component
- [x] Validate Paywall async feedback changes with TypeScript, 39 unit tests, and lint

- [x] Use shared AsyncActionStatus in scan-detail share and delete feedback with truthful success and error states
- [x] Preserve scan-detail share, delete, and retry behavior through the shared status component
- [x] Validate scan-detail async feedback changes with TypeScript, 39 unit tests, and lint

- [x] Use shared AsyncActionStatus in visit-summary sharing, copy, and connection feedback with truthful status tones
- [x] Preserve privacy boundaries, retry limits, and edited summary text through the shared status component
- [x] Validate visit-summary async feedback changes with TypeScript, 39 unit tests, and lint

- [x] Add optional photo attachment selection with explicit permission handling and text-only fallback
- [x] Keep optional photo sharing separate from the reviewed text and private storage metadata
- [x] Validate media-sharing behavior with TypeScript, 39 unit tests, and lint

- [x] Recover pending photo-picker results after Android activity recreation without leaking async errors
- [x] Narrow successful and error pending-picker result shapes safely
- [x] Validate pending photo recovery with TypeScript, 39 unit tests, and lint

- [x] Distinguish retryable photo-library denial from settings-required denial while preserving text-only fallback
- [x] Provide an explicit device-settings recovery action when photo permission cannot be requested again
- [x] Validate photo-permission recovery with TypeScript, 39 unit tests, and lint

- [x] Add optional camera capture with explicit camera permission handling and text-only fallback
- [x] Provide camera settings recovery when camera permission cannot be requested again
- [x] Validate camera capture and media-sharing behavior with TypeScript, 39 unit tests, and lint

- [x] Remove unused expo-camera dependency while preserving expo-image-picker camera permissions
- [x] Confirm ImagePicker camera capture remains available after dependency cleanup
- [x] Validate dependency cleanup with TypeScript, 39 unit tests, and lint

- [x] Guard pending-photo lifecycle recovery against duplicate AppState resume reads
- [x] Preserve safe fallback messaging when pending photo recovery fails
- [x] Validate lifecycle recovery concurrency with TypeScript, 39 unit tests, and lint

- [x] Extract and test deterministic media permission and cancellation recovery copy
- [x] Cover retryable denial, settings-required denial, cancellation, unavailable, and share failure states
- [x] Validate the expanded media recovery suite with TypeScript, 42 unit tests, and lint

- [x] Add deterministic media-control labels and disabled-state contracts for component-level coverage
- [x] Wire shared media-control labels, hints, and disabled-state semantics into visit-summary
- [x] Validate media-control behavior with TypeScript, 44 unit tests, and lint

- [x] Add deterministic photo-share action labels and hints for selected, busy, and unavailable states
- [x] Expose system share availability in visit-summary without weakening the text-only boundary
- [x] Validate photo-share control behavior with TypeScript, 46 unit tests, and lint

- [x] Add an explicit share availability recheck action with busy and accessible feedback
- [x] Guard repeated availability checks and preserve text-only sharing during unsupported states
- [x] Validate share availability recovery with TypeScript, 46 unit tests, and lint

- [x] Prevent share availability hydration from looping when its busy state changes
- [x] Preserve explicit manual availability recheck behavior with a stable in-flight ref
- [x] Validate share availability lifecycle recovery with TypeScript, 46 unit tests, and lint

- [x] Classify share availability failure separately from user-cancelled share-sheet errors
- [x] Preserve available-state recovery after transient share-sheet rejection
- [x] Validate classified share failure handling with TypeScript, 46 unit tests, and lint

- [x] Catch OAuth delayed navigation failures and clean up redirect timers on effect teardown
- [x] Surface delayed redirect failures in the OAuth callback error state
- [x] Validate OAuth error handling with TypeScript, 46 unit tests, and lint

- [x] Make unsupported OAuth URLs and native browser-launch failures reject with actionable errors
- [x] Add a deterministic OAuth launch error-message contract for callers

- [x] Audit remaining SecureStore, AsyncStorage, notification, and linking async boundaries for swallowed failures
- [x] Add caller-visible recovery behavior and deterministic tests for the next highest-impact boundary

- [x] Audit notification scheduling and local-storage async failures for swallowed errors
- [x] Add caller-visible recovery behavior and deterministic tests for the highest-impact notification or storage boundary

- [x] Audit AsyncStorage profile, scan, and draft writes for partial-save or stale-state failures
- [x] Add explicit persistence recovery contracts, caller feedback, and deterministic tests

- [x] Audit AsyncStorage profile, scan, and draft writes for partial-save or stale-state failures
- [x] Add explicit persistence recovery contracts, caller feedback, and deterministic tests

- [x] Audit multi-step profile persistence and native notification failures
- [x] Add rollback-safe profile updates and confirm no app notification scheduling call sites remain

- [x] Add deterministic failure-injection coverage for atomic profile persistence rollback
- [x] Audit and harden the next remaining async UI recovery boundary

- [x] Audit remaining async failure and stale-state paths for user-entered data loss
- [x] Add preservation-safe recovery behavior and targeted deterministic tests

- [x] Audit component-level async actions and navigation failures for stuck or misleading UI
- [x] Add caller-visible recovery behavior and deterministic tests for the highest-impact boundary

- [x] Audit route transitions for rejected navigation promises and silent failures
- [x] Add a safe navigation helper with deterministic error-copy coverage

- [x] Audit secondary-screen actions and lifecycle-triggered async work for silent failures or stale updates
- [x] Add caller-visible recovery behavior and deterministic tests for the highest-impact boundary

- [x] Audit secondary-screen close and back actions for rejected navigation promises
- [x] Add guarded close recovery feedback and deterministic copy coverage

- [x] Audit remaining direct close/back actions and asynchronous callbacks for silent rejection
- [x] Add guarded close recovery behavior and deterministic tests

- [x] Audit Learn, Settings, and Paywall close actions for rejected navigation promises
- [x] Add guarded close recovery feedback and deterministic copy coverage

- [x] Audit missing-data and load-error fallback actions for rejected navigation promises
- [x] Add guarded fallback navigation and deterministic recovery-copy coverage

- [x] Audit remaining fallback navigation and asynchronous callbacks for silent failures
- [x] Add safe fallback recovery behavior and deterministic tests

- [x] Audit forward-navigation fallback actions and asynchronous callbacks for silent failures
- [x] Add guarded forward navigation and deterministic recovery-copy coverage

- [x] Audit remaining direct route actions and shared async helpers for silent failures
- [x] Add caller-visible recovery behavior and deterministic tests for the highest-impact boundary

- [x] Audit shared navigation and asynchronous helpers for silent failures or duplicate work
- [x] Add caller-visible recovery behavior and deterministic concurrency tests

- [x] Audit profile-management and onboarding fallback actions for silent navigation or persistence failures
- [x] Add guarded fallback navigation and deterministic recovery-copy coverage

- [x] Audit remaining asynchronous UI and persistence boundaries for stale state or silent failures
- [x] Add stale-state protection, caller-visible recovery, and deterministic tests

- [x] Add deterministic failure-injection coverage for independent logout cleanup failures
- [x] Audit remaining authenticated async actions for silent or partial failures

- [x] Audit the next highest-impact mobile reliability and usability gaps
- [x] Implement focused React Native improvements with deterministic tests

- [x] Review native storage failure contracts and current mocked coverage
- [x] Add deterministic AsyncStorage and SecureStore failure-injection tests
- [x] Address any remaining silent storage recovery gaps found by the audit

- [x] Audit logout and draft-clearing recovery surfaces
- [x] Add explicit retry actions for partial logout and failed draft clearing
- [x] Verify retry actions preserve local data and prevent duplicate operations

- [x] Audit authenticated-state and native-device boundaries
- [x] Implement the highest-impact resilience improvement with deterministic tests

- [x] Audit asynchronous state transitions and native bridge boundaries
- [x] Implement the highest-value resilience fix with deterministic coverage

- [ ] Review the multilingual React Native specification against the current app
- [ ] Implement the highest-priority applicable multilingual and mobile UX requirements

- [x] Review the multimodal-features React Native specification against the current implementation
- [x] Implement the highest-priority compatible multimodal feature requirement

- [x] Audit the current Scan media path and multimodal contract fit
- [x] Integrate bounded multimodal asset validation into Scan

- [x] Review the additional monetization specification against current billing boundaries
- [x] Implement the safest high-value monetization improvement without restricting core observation access

- [x] Audit Scan media normalization and existing upload validation
- [x] Wire multimodal asset validation into photo selection and review

- [x] Audit current Settings, root providers, and localization dependency state
- [x] Implement persisted language preference and accessible selector

- [x] Audit core safety, consent, scan, and recovery copy usage
- [x] Implement localized resource strings and connect the highest-impact screens

- [x] Fix localization initialization race so onboarding never renders raw translation keys

- [x] Audit recent localization, multimodal, and billing changes for runtime integration gaps
- [x] Implement the highest-impact corrective improvement with deterministic coverage

- [x] Audit localization completeness and async recovery contracts
- [x] Implement the highest-impact copy and recovery improvement

- [x] Audit Scan recovery strings and localization seams
- [x] Implement localized Scan recovery and upload feedback

- [x] Audit remaining localized user-facing status and recovery paths
- [x] Implement localized status or recovery feedback with deterministic coverage

- [x] Audit Scan timeline labels and accessibility contracts
- [x] Implement localized timeline and accessibility copy

- [x] Audit Scan attempt and action-state strings
- [x] Implement localized attempt guidance and action labels

- [x] Audit Scan action labels and accessibility hints
- [x] Implement localized Scan actions and accessibility copy

- [x] Audit Scan hint and photo-quality strings
- [x] Implement localized Scan hints and quality guidance

- [ ] Audit localization completeness and native recovery surfaces
- [ ] Implement the highest-value reliability improvement with deterministic coverage

- [x] Audit current language provider, app root, and direction-sensitive layouts
- [x] Implement safe RTL direction state and direction-aware layout primitives

- [x] Audit navigation controls and direction-sensitive affordances
- [x] Implement direction-aware navigation affordances with deterministic coverage

- [x] Audit the next user-facing reliability and accessibility gap
- [x] Implement the targeted improvement with deterministic coverage

- [x] Audit remaining shared navigation and localized accessibility gaps
- [x] Implement the next focused accessibility improvement with deterministic coverage

- [x] Audit remaining localization and recovery surfaces
- [x] Implement one focused user-facing improvement with deterministic coverage

- [x] Audit remaining localization and recovery behavior
- [x] Implement one concrete improvement with deterministic coverage

- [x] Audit Settings preference feedback and localization seams
- [x] Implement localized Settings feedback with deterministic coverage

- [x] Audit Settings subscription, privacy, and recovery copy
- [x] Implement localized Settings feedback with deterministic coverage

- [x] Audit remaining user-facing recovery strings
- [x] Implement localized History and Scan Detail recovery copy
- [x] Add regression coverage for the new recovery copy


- [x] Audit remaining Home accessibility and recovery copy
- [x] Implement localized Home action and navigation feedback
- [x] Add regression coverage for Home accessibility copy


- [x] Audit Scan quality-validation feedback
- [x] Implement localized Scan validation feedback
- [x] Add regression coverage for Scan validation fallback


- [x] Audit Scan busy states and existing progress components
- [x] Implement validation and draft-save progress feedback
- [x] Add regression coverage for Scan progress feedback


- [x] Audit remaining Scan busy-state copy and controls
- [x] Implement consistent localized Scan progress feedback
- [x] Add regression coverage for Scan progress accessibility


- [x] Audit remaining Scan failure and offline copy
- [x] Implement localized Scan resilience feedback
- [x] Add regression coverage for Scan resilience fallback


- [x] Audit remaining Scan setup and draft-recovery copy
- [x] Implement localized Scan setup and draft recovery feedback
- [x] Add regression coverage for Scan setup fallback


- [x] Audit remaining Scan action and accessibility copy
- [x] Implement localized Scan action and recovery feedback
- [x] Add regression coverage for Scan action fallback


- [x] Audit remaining Scan review and guidance copy
- [x] Implement localized Scan review-state feedback
- [x] Add regression coverage for Scan review fallback


- [x] Audit supported languages and critical fallback coverage
- [x] Add critical safety and recovery translations for remaining locales
- [x] Add localization regression coverage for remaining locales


- [x] Audit History and Scan Detail recovery surfaces
- [x] Implement localized History and Scan Detail recovery feedback
- [x] Add regression coverage for History and Scan Detail fallback


- [x] Audit Scan Detail recovery and safety copy
- [x] Implement localized Scan Detail feedback and actions
- [x] Add regression coverage for Scan Detail fallback


- [x] Audit remaining History accessibility and filter copy
- [x] Implement localized History filter and accessibility feedback
- [x] Add regression coverage for History accessibility fallback


- [x] Audit remaining Settings user-facing and recovery copy
- [x] Implement localized Settings labels and deletion feedback
- [x] Add regression coverage for Settings deletion fallback


- [x] Audit remaining Settings and Scan Detail accessibility copy
- [x] Implement localized accessibility and recovery feedback
- [x] Add regression coverage for accessibility fallback


- [x] Audit remaining confirmation dialogs and action states
- [x] Implement localized confirmation and action feedback
- [x] Add regression coverage for confirmation fallback


- [x] Audit remaining History filters and shared navigation labels
- [x] Implement localized filter labels and navigation accessibility text
- [x] Add regression coverage for filter and navigation fallback


- [x] Audit Arabic locale resources and History filter rendering
- [x] Implement Arabic filter copy and RTL-safe accessibility feedback
- [x] Add regression coverage for Arabic filter fallback


- [x] Audit Arabic History and shared navigation copy
- [x] Implement Arabic recovery and navigation accessibility copy
- [x] Add regression coverage for Arabic navigation fallback


- [x] Audit remaining Arabic Scan Detail content and action copy
- [x] Implement Arabic Scan Detail content and accessibility copy
- [x] Add regression coverage for Arabic Detail fallback


- [x] Audit remaining Arabic Scan Detail headings and status copy
- [x] Implement Arabic Scan Detail headings and status localization
- [x] Add regression coverage for Arabic Detail polish


- [x] Audit Scan Detail metadata label helpers and locale keys
- [x] Implement localized quality and review-source metadata
- [x] Add regression coverage for metadata localization


- [x] Audit remaining server-review metadata copy
- [x] Implement localized server-review metadata and safety explanation
- [x] Add regression coverage for server-review localization


- [x] Audit remaining Arabic server-review value labels
- [x] Implement localized confidence and image-quality values
- [x] Add regression coverage for Arabic metadata values


- [x] Audit structured server-review issue and summary text
- [x] Implement localized structured issue labels and summaries
- [x] Add regression coverage for structured metadata localization


- [x] Audit structured image-quality issue values
- [x] Implement localized image-quality issue labels
- [x] Add regression coverage for image-quality issue labels
- [x] Audit structured overall-review and finding-severity values
- [x] Implement localized overall-review and finding-severity labels
- [x] Add regression coverage for localized review-status labels
- [x] Audit share and veterinary-summary copy paths
- [x] Implement locale-aware summary formatting
- [x] Add regression coverage for localized summary output
- [x] Audit body-area and context-field labels for summary exports
- [x] Implement localized area and context labels
- [x] Add regression coverage for localized export labels
- [x] Audit scan context copy and translation coverage
- [x] Implement localized scan context fields and hints
- [x] Add regression coverage and validate scan form localization
- [x] Audit hard-coded scan action announcements
- [x] Implement translation-backed scan action copy
- [x] Add regression coverage and validate scan actions
- [x] Audit remaining scan recovery copy
- [x] Implement localized progress and recovery announcements
- [x] Add regression coverage and validate resilience copy
- [x] Audit remaining scan headings and active-pet guidance
- [x] Implement localized scan headings and guidance
- [x] Add regression coverage and validate scan UI localization
- [x] Audit remaining scan recovery controls and state copy
- [x] Implement localized recovery controls and safe state labels
- [x] Add regression coverage and validate scan resilience
- [x] Audit shared route-navigation controls
- [x] Implement localized route-navigation states
- [x] Add regression coverage and validate navigation
- [x] Audit pet-profile and onboarding action copy
- [x] Implement localized profile and onboarding actions
- [x] Add regression coverage and validate local-first flows
- [x] Audit pet-profile form copy and validation paths
- [x] Implement localized profile form and validation copy
- [x] Add regression coverage and validate profile flows
- [x] Audit pet-list labels and error paths
- [x] Implement localized pet-list and archive copy
- [x] Add regression coverage and validate pet management
- [x] Audit dynamic pet-profile accessibility labels
- [x] Implement interpolated localized profile labels
- [x] Add regression coverage and validate profile accessibility
- [x] Audit onboarding acknowledgment and recovery copy
- [x] Implement localized onboarding actions and hints
- [x] Add regression coverage and validate consent flow
- [x] Audit onboarding navigation and recovery messages
- [x] Implement localized onboarding recovery copy
- [x] Add regression coverage and validate onboarding resilience
- [x] Audit onboarding state labels and interaction feedback
- [x] Implement localized onboarding state feedback
- [x] Add regression coverage and validate onboarding UX
- [x] Audit consent control accessibility state copy
- [x] Implement localized selected-state consent hints
- [x] Add regression coverage and validate consent accessibility
- [x] Audit language-switch and RTL navigation labels
- [x] Implement localized language and navigation copy
- [x] Add regression coverage and validate RTL behavior
- [x] Audit Home action labels and recovery copy
- [x] Implement localized Home actions and announcements
- [x] Add regression coverage and validate Home resilience
- [x] Audit remaining Home visible copy
- [x] Implement localized Home headings and status copy
- [x] Add regression coverage and validate Home presentation
- [x] Audit remaining Home content copy
- [x] Implement localized Home content and learning guidance
- [x] Add regression coverage and validate Home content
- [x] Audit new Home keys and Arabic resource coverage
- [x] Add Arabic Home content translations and interpolation
- [x] Add regression coverage and validate Arabic Home copy
- [x] Audit Home dynamic announcements and refresh states
- [x] Implement localized Home dynamic announcements
- [x] Add regression coverage and validate Home states
- [x] Audit remaining Home announcement semantics
- [x] Implement localized Home announcement labels and hints
- [x] Add regression coverage and validate Home accessibility
- [x] Audit load, save, native, sharing, and scan failure paths
- [x] Define clearly labeled fallback mock-data behavior
- [x] Implement expanded error handling and safe fallback states
- [x] Add regression tests for failures and fallback recovery
- [x] Audit current fallback behavior and unhandled failure paths
- [x] Define safe fallback and malformed-data boundaries
- [x] Implement stronger guards and recovery states
- [x] Add failure and fallback regression tests
- [x] Generate a durable QR code pointing to the published Manus-hosted app URL
- [x] Document that the development Expo QR is temporary and separate from the permanent hosted link

### Delivery note
The permanent QR asset is stored at `assets/expo-qr-code.png` and opens `https://pethealth-kpand6qo.manus.space`. It is a web-host QR, not a permanent Expo Go development-session QR.

### Next reliability pass
- [x] Audit scan draft persistence and recovery for malformed or stale records
- [x] Add regression coverage for scan draft normalization and recovery behavior
- [x] Validate the reliability pass with TypeScript, tests, and lint

### Next production-safety pass
- [x] Audit development fallback gating and production empty-state copy

### Next history-recovery pass
- [x] Audit scan-history reads for swallowed storage errors

### Next native media-recovery pass
- [x] Audit camera and media-library cancellation and permission outcomes

### Next interrupted-picker recovery pass
- [x] Audit pending image-picker result handling after app/activity interruption

### Next camera-permission recovery pass
- [x] Audit camera denial states and existing settings-opening capabilities

### Next Scan localization pass
- [x] Audit hard-coded Scan labels and accessibility text

### Next remote-analysis localization pass
- [x] Audit selected-language propagation into analysis requests

### Next fail-closed localization pass
- [x] Audit server fail-closed copy and language propagation on invalid analysis

### Next structured-result localization pass
- [x] Audit provider status and image-quality values rendered directly to users

### Next dynamic accessibility localization pass
- [x] Audit hard-coded Scan Detail accessibility labels

### Next provider-finding accessibility pass
- [x] Audit dynamic finding and evidence presentation for screen readers

### Next remote-timestamp safety pass
- [x] Audit generatedAt validation and date rendering for remote results

### Next localized-date pass
- [x] Audit selected-language date rendering on Scan Detail

### Next multi-photo review pass
- [x] Audit single-photo media contracts and picker limits

### Next multi-photo feedback pass
- [x] Audit per-photo quality messages and skipped-selection copy

### Next recovered-media hardening pass
- [x] Audit additional-photo draft normalization against the upload boundary
- [x] Reject duplicate, unsupported, oversized, or malformed recovered photos safely
- [x] Preserve valid legacy single-photo drafts and valid multi-photo drafts
- [x] Add regression coverage for recovered-media filtering
- [x] Validate the pass with TypeScript, tests, and lint

### Next multi-photo feedback pass (completed)
- [x] Audit per-photo quality messages and skipped-selection copy
- [x] Localize multi-photo feedback while preserving safe validation outcomes
- [x] Add regression coverage for per-photo quality and localized limits
- [x] Validate the pass with TypeScript, tests, and lint

### Next multi-photo review pass (completed)
- [x] Audit single-photo media contracts and picker limits
- [x] Add bounded multi-photo normalization with per-photo validation
- [x] Preserve backward compatibility for existing single-photo drafts and scans
- [x] Add regression coverage for multi-photo acceptance and rejection
- [x] Validate the pass with TypeScript, tests, and lint

### Next localized-date pass (completed)
- [x] Audit selected-language date rendering on Scan Detail
- [x] Add a safe shared formatter for stored and generated timestamps
- [x] Add regression coverage for English, Arabic, and invalid-date fallback behavior
- [x] Validate the pass with TypeScript, tests, and lint

### Next remote-timestamp safety pass (completed)
- [x] Audit generatedAt validation and date rendering for remote results
- [x] Reject invalid or non-canonical timestamps before persistence or display
- [x] Add regression coverage for invalid, canonical, and offset timestamps
- [x] Validate the pass with TypeScript, tests, and lint

### Next provider-finding accessibility pass (completed)
- [x] Audit dynamic finding and evidence presentation for screen readers
- [x] Add localized finding accessibility summaries without mutating provider text
- [x] Add regression coverage for dynamic finding interpolation
- [x] Validate the pass with TypeScript, tests, and lint

### Next dynamic accessibility localization pass (completed)
- [x] Audit hard-coded Scan Detail accessibility labels
- [x] Localize dynamic outcome, share, review, and delete announcements
- [x] Add regression coverage for interpolation and Arabic labels
- [x] Validate the pass with TypeScript, tests, and lint

### Next structured-result localization pass (completed)
- [x] Audit provider status and image-quality values rendered directly to users
- [x] Localize only known structured values while preserving unknown provider evidence
- [x] Add regression coverage for localized known values and unchanged unknown values
- [x] Validate the pass with TypeScript, tests, and lint

### Next fail-closed localization pass (completed)
- [x] Audit server fail-closed copy and language propagation on invalid analysis
- [x] Add locale-aware safe next steps without weakening non-diagnostic safeguards
- [x] Add regression coverage for localized fallback recovery and unknown-language fallback
- [x] Validate the pass with TypeScript, tests, and lint

### Next remote-analysis localization pass (completed)
- [x] Audit selected-language propagation into analysis requests
- [x] Request localized provider prose without translating or mutating evidence fields
- [x] Add regression coverage for language-aware request construction and fallback behavior
- [x] Validate the pass with TypeScript, tests, and lint

### Next Scan localization pass (completed)
- [x] Audit hard-coded Scan labels and accessibility text
- [x] Localize remaining Scan actions, species labels, and recovery routes
- [x] Add localization regression coverage for the new Scan keys
- [x] Validate the pass with TypeScript, tests, and lint

### Next camera-permission recovery pass (completed)
- [x] Audit camera denial states and existing settings-opening capabilities
- [x] Add explicit retry/settings recovery without changing the current draft
- [x] Add regression coverage for retryable and settings-required permission states
- [x] Validate the pass with TypeScript, tests, and lint

### Next interrupted-picker recovery pass (completed)
- [x] Audit pending image-picker result handling after app/activity interruption
- [x] Restore valid pending media through the same validation boundary
- [x] Add regression coverage for pending selection success, cancellation, and failure
- [x] Validate the pass with TypeScript, tests, and lint

### Next native media-recovery pass (completed)
- [x] Audit camera and media-library cancellation and permission outcomes
- [x] Add explicit media recovery classification without creating fake media
- [x] Add regression coverage for cancellation, permission, and unavailable-media states
- [x] Validate the pass with TypeScript, tests, and lint

### Next history-recovery pass (completed)
- [x] Audit scan-history reads for swallowed storage errors
- [x] Propagate explicit storage-error state to Home and History surfaces
- [x] Add regression coverage for unavailable scan history
- [x] Validate the pass with TypeScript, tests, and lint

### Next production-safety pass (completed)
- [x] Audit development fallback gating and production empty-state copy
- [x] Implement a production-safe offline empty state with no demo fixtures
- [x] Add regression coverage for fallback isolation and production behavior
- [x] Validate the pass with TypeScript, tests, and lint

### Next focused reliability pass
- [x] Audit remote-analysis result normalization and provenance boundaries
- [x] Add regression coverage for malformed remote analysis and unsafe provenance data
- [x] Validate the reliability pass with TypeScript, tests, and lint
### Next multimodal capture recovery pass (completed)
- [x] Add strict normalization for recovered video and audio assets
- [x] Trim recovered URIs and MIME types before validation
- [x] Drop malformed, unsupported, oversized, and duplicate recovered assets
- [x] Enforce an explicit recovered-media asset bound
- [x] Add deterministic regression coverage for interrupted multimodal recovery
- [x] Validate the pass with TypeScript, tests, and lint
### Next strict metadata recovery pass
- [x] Reject recovered assets with invalid timestamps
- [x] Reject recovered assets with malformed optional numeric metadata
- [x] Make the explicit recovery bound finite and fail-safe
- [x] Add regression coverage for strict metadata recovery
- [x] Validate the pass with TypeScript, tests, and lint
### Next persisted multimodal recovery pass
- [x] Add strict hydration for persisted multimodal cases
- [x] Preserve valid cases while dropping unsafe recovered assets
- [x] Expose deterministic skipped and truncated asset counts
- [x] Add localized recovery-status copy for supported languages
- [x] Add localized recovery-status formatter for all 11 languages
- [x] Add regression coverage for localized recovery-status copy
### Next count-aware recovery feedback pass
- [x] Add count-aware localized recovery-status formatting
- [x] Clamp invalid recovery counts before presenting feedback
- [x] Preserve Arabic RTL wording with count interpolation
- [x] Add regression coverage for count and fallback behavior
- [x] Validate the pass with TypeScript, tests, and lint
### Next multimodal recovery accessibility pass
- [x] Add a reusable recovery summary model for UI surfaces
- [x] Add accessibility-ready recovery status and count semantics
- [x] Preserve localized status formatting through the summary helper
- [x] Add regression coverage for summary and accessibility output
- [x] Validate the pass with TypeScript, tests, and lint
### Next attachment review accessibility pass
- [x] Add a reusable attachment-review projection from recovery summaries
- [x] Add explicit accessibility announcement text for skipped and truncated media
- [x] Preserve localized count-aware wording in review projections
- [x] Add regression coverage for review and announcement semantics
- [x] Validate the pass with TypeScript, tests, and lint
### Next Scan attachment review integration pass
- [x] Add recovery projection state to Scan review
- [x] Show retained, skipped, and truncated media feedback
- [x] Add localized accessibility announcement semantics to the review surface
- [x] Add regression coverage for review state behavior
- [x] Validate the pass with TypeScript, tests, and lint
### Next persisted-draft recovery counts pass
- [x] Persist safe skipped and truncated recovery counts with scan drafts
- [x] Hydrate legacy drafts with zero-count backward-compatible defaults
- [x] Restore localized recovery feedback after relaunch
- [x] Add storage and Scan hydration regression coverage
- [x] Validate the pass with TypeScript, tests, and lint
### Next resilience and fallback-data pass
- [ ] Audit runtime error boundaries and silent failure paths
- [ ] Add safe mock-data fallback only for unavailable non-critical data
- [ ] Keep fallback records clearly marked and isolated from real local data
- [ ] Improve retry, recovery, and user-visible error handling
- [ ] Add regression coverage for failures and fallback isolation
- [ ] Validate the pass with TypeScript, tests, and lint
### Next dynamic-data and error-handling pass
- [x] Replace mockup-facing screen content with live local data where available
- [x] Add explicit loading, empty, error, and retry states to audited screens
- [x] Keep development fallback fixtures out of production and real-data lists
- [x] Add regression coverage for dynamic-data failures and retries
- [x] Validate the pass with TypeScript, tests, and lint
### Next resilience and fallback-data pass
- [x] Audit remaining silent catches and incomplete failure states
- [x] Add isolated development-only fallback data where safe
- [x] Preserve real local data when one source fails
- [x] Improve retry and safe empty-state behavior
- [x] Add regression coverage for fallback isolation and failures
- [x] Validate the pass with TypeScript, tests, and lint
### Next high-risk runtime recovery pass
- [x] Audit high-risk sharing, navigation, and permission failure paths
- [x] Add actionable retry or settings recovery where missing
- [x] Keep fallback mock records isolated from production flows
- [x] Add regression coverage for high-risk failures
- [x] Validate the pass with TypeScript, tests, and lint
### Next resilience fallback pass
- [x] Audit remaining screens and storage failure semantics
- [x] Add safe fallback only for clearly non-critical development previews
- [x] Preserve existing valid local data during partial failures
- [x] Improve actionable retry and recovery messaging
- [x] Add regression coverage for failure isolation
- [x] Validate the pass with TypeScript, tests, and lint
### Next high-risk action recovery pass
- [x] Audit sharing, deletion, navigation, and permission action handlers
- [x] Preserve user data when action reads or writes fail
- [x] Add actionable retry or alternate-path recovery where missing
- [x] Keep fallback mock data clearly isolated from action results
- [x] Add regression coverage for action failures
- [x] Validate the pass with TypeScript, tests, and lint
### Next failure-boundary hardening pass
- [x] Audit remaining screen-level failure boundaries
- [x] Add safe retry behavior without clearing valid state
- [x] Keep mock fallback data development-only and visibly labeled
- [x] Add regression coverage for fallback and error isolation
- [x] Validate the pass with TypeScript, tests, and lint
### Next error recovery pass
- [x] Audit remaining screen action failures and unsafe fallbacks
- [x] Preserve valid data during all partial failures
- [x] Add clear retry or alternate recovery actions
- [x] Keep mock data development-only and visibly marked
- [x] Add regression coverage for the new failure paths
- [x] Validate the pass with TypeScript, tests, and lint
### Next runtime resilience pass
- [x] Audit remaining async action handlers and silent catches
- [x] Preserve valid state when a secondary operation fails
- [x] Add explicit retry or alternate recovery actions
- [x] Keep fallback mock data development-only and clearly labeled
- [x] Add regression coverage for new failure boundaries
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI scanner improvement pass
- [x] Audit multimodal analysis request and result safety boundaries
- [x] Improve conservative AI fallback behavior without diagnostic claims
- [x] Preserve selected locale and evidence provenance through analysis
- [x] Improve user-visible retry and unavailable-analysis feedback
- [x] Add regression coverage for analysis reliability and safety
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI result-quality pass
- [x] Audit incomplete and low-evidence AI result handling
- [x] Add conservative quality normalization without inventing findings
- [x] Preserve localized prose and original evidence provenance
- [x] Add explicit unavailable or low-confidence semantics where needed
- [x] Add regression coverage for incomplete results
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI confidence and image-quality pass
- [x] Audit confidence calibration and unusable-image result handling
- [x] Add conservative low-quality-image normalization
- [x] Preserve localized guidance and evidence provenance
- [x] Add clear retry guidance for unusable media
- [x] Add regression coverage for uncertain results
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI guidance reliability pass
- [x] Audit localized fail-closed guidance and incomplete analysis states
- [x] Add conservative unavailable-analysis result semantics
- [x] Preserve scan identity and locale during fallback recovery
- [x] Add regression coverage for localized fallback results
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI structured-output quality pass
- [x] Audit structured result fields for unsafe or misleading values
- [x] Normalize finding severity and confidence conservatively
- [x] Preserve localized evidence and non-diagnostic wording
- [x] Add regression coverage for unsafe structured output
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI confidence transparency pass
- [x] Add a deterministic confidence-downgrade reason to normalized results
- [x] Add image-quality-specific retake guidance
- [x] Preserve localized result and evidence semantics
- [x] Add regression coverage for confidence and retake guidance
- [x] Validate the pass with TypeScript, tests, and lint
### Next AI presentation recovery pass
- [x] Audit result detail and fallback presentation for unsafe emphasis
- [x] Add reusable safe presentation metadata for low-confidence results
- [x] Preserve localized non-diagnostic guidance and evidence
- [x] Add regression coverage for safe presentation metadata
- [x] Validate the pass with TypeScript, tests, and lint
- [x] Add regression coverage and validate with TypeScript, tests, and lint
### Next scanner resilience pass
- [x] Prevent post-analysis storage failures from overwriting or discarding existing scan history
- [x] Preserve the completed remote result in the local draft when final history persistence fails
- [x] Add regression coverage for append safety and retry recovery
- [x] Validate the scanner pass with TypeScript, tests, and lint
### Next completed-result recovery pass
- [x] Show when a completed result is waiting for local history recovery
- [x] Add an explicit retry action that preserves the result and draft on failure
- [x] Add localized accessibility coverage for the recovery action
- [x] Validate the scanner pass with TypeScript, tests, and lint
### Next recovery visibility pass
- [x] Surface pending completed-result recovery in History and Home where local data is available
- [x] Preserve idempotent recovery and non-diagnostic status semantics
- [x] Add localized accessibility coverage for pending recovery visibility
- [x] Validate the scanner pass with TypeScript, tests, and lint
### Next scan operation feedback pass
- [x] Distinguish upload, AI review, local-save, and cancellation outcomes
- [x] Show stage-specific retry guidance without exposing provider details
- [x] Preserve local draft and completed-result recovery semantics
- [x] Add localized accessibility regression coverage
- [x] Validate the scanner pass with TypeScript, tests, and lint
### Next error handling and fallback pass
- [x] Audit current app-level, scan, Home, History, and Pets failure boundaries
- [x] Add or refine development-only mock fallback data without replacing valid local data
- [x] Preserve explicit loading, empty, unavailable, and retry states in production
- [x] Add regression coverage for fallback isolation and new failure paths
- [x] Validate the pass with TypeScript, tests, and lint
### Next error recovery hardening pass
- [x] Audit additional scan, Home, History, and Pets failure boundaries
- [x] Improve development-only mock fallback diagnostics without masking real data
- [x] Preserve valid local records during partial native failures
- [x] Add regression coverage for new error paths and fallback isolation
- [x] Validate the pass with TypeScript, tests, and lint
### Next recovery hardening pass
- [x] Audit remaining storage, navigation, and fallback failure paths
- [x] Add safe recovery behavior without masking valid local data
- [x] Keep mock diagnostics development-only and clearly labeled
- [x] Add regression coverage for new failure boundaries
- [x] Validate the pass with TypeScript, tests, and lint


### Next scanner fallback hardening pass
- [x] Audit the latest scanner failure boundaries and fallback display conditions
- [x] Add safe recovery behavior without replacing valid local records
- [x] Keep mock data development-only and clearly labeled
- [x] Add regression coverage for error handling and fallback isolation
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner resilience pass
- [x] Audit current scanner error boundaries and fallback contracts
- [x] Refine safe recovery behavior without replacing valid local data
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for new failure paths
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner error-hardening pass
- [x] Audit the latest scanner and fallback implementation
- [x] Add targeted recovery behavior without masking valid local data
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for the new failure boundary
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner hardening pass
- [x] Audit current error boundaries and fallback contracts
- [x] Add targeted recovery behavior without masking valid local data
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for the new failure boundary
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner recovery pass
- [x] Audit current scanner recovery and fallback paths
- [x] Add targeted error handling without replacing valid local observations
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for safe fallback behavior
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner hardening pass
- [x] Audit current scanner error and fallback paths
- [x] Add targeted resilience improvements without replacing valid local observations
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for error and fallback safety
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner resilience pass
- [x] Audit current scanner error and fallback paths
- [x] Add targeted resilience improvements without replacing valid local observations
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for error and fallback safety
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner resilience pass
- [x] Audit current scanner error and fallback paths
- [x] Add targeted recovery improvements without replacing valid local data
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for failure and fallback isolation
- [x] Validate the pass with TypeScript, tests, and lint

### Next scanner error-handling pass
- [x] Audit current scanner recovery and fallback contracts
- [x] Add targeted resilience improvements without replacing valid local observations
- [x] Keep mock fallback development-only and clearly labeled
- [x] Add regression coverage for the new failure boundary
- [x] Validate the pass with TypeScript, tests, and lint
