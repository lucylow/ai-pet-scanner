# Pet Health Scanner — Mobile Interface Design

## Product Positioning

Pet Health Scanner is a calm, non-diagnostic companion for observing visible pet-health concerns. It helps a pet parent capture a photo, receive transparent observation guidance, and decide on a sensible next step. The app must never imply a diagnosis, prescribe treatment, replace a veterinarian, or guarantee safety.

The interface assumes portrait orientation and one-handed use. Primary actions sit within the lower half of the screen or are reachable with a thumb. Screens use generous spacing, large tap targets, concise copy, and clear status labels rather than clinical-looking dashboards.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Welcome | Brand mark, short explanation of observation support, primary “See how it works” action, and a secondary privacy link. |
| How It Works | Three simple steps: choose a pet, capture a visible area, review cautious guidance. Explains what the app does not do. |
| Consent | Plain-language data and safety disclosure, consent version/timestamp capture, required acknowledgement before a first scan, and link to read the same content later. |
| Home | Active pet summary, large “Scan now” action, recent scan preview, and educational shortcut. |
| Pet List | All pets with species, name, and active state; add, edit, archive, and select active pet. |
| Add/Edit Pet | Form for name, species, breed or mix, age range, sex, spay/neuter status, weight range, allergies, medications, and optional veterinary contact. User-entered facts are clearly labeled. |
| Scan Setup | Active pet confirmation, body-area selection for skin, eyes, teeth, ears, paws, or other visible area, capture tips, and privacy reminder. |
| Capture | Camera or library entry point, framing guidance, flash/help controls, cancel, and retry. The initial build uses an Expo-compatible image capture flow with a safe fallback when camera access is unavailable. |
| Media Review | Captured image preview, quality feedback, retake, discard, and “Continue to observations” action. |
| Observation Questions | Optional structured inputs for onset, change, behavior, appetite, pain-like signals, discharge/bleeding, and other visible context. Avoids asking the model to infer medical history. |
| Analysis Progress | Calm progress state with cancel support and transparent language that the result is an observation aid, not a diagnosis. |
| Scan Result | Quality summary, visible observations, uncertainty note, risk-oriented next-step category, red-flag escalation copy, veterinarian reminder, save/share controls, and retry. |
| History | Filterable list of saved scans by pet and body area, with dates and status labels; empty state explains how to begin. |
| Scan Detail | Full saved result, media thumbnail, user observations, safety notice, and delete action. |
| Learn | Educational cards on safe observation, photo quality, when to contact a veterinarian, and preparing for a visit. |
| Settings | Consent text, privacy controls, data deletion, app limitations, and about information. |

## Key User Flows

### First launch

1. User sees Welcome and taps “See how it works.”
2. User reviews the three-step explanation and taps “Continue.”
3. User reads Consent, checks the acknowledgement, and taps “I understand.”
4. User reaches Home with a clear prompt to add a pet.

### Create a pet

1. User taps “Add a pet.”
2. User enters a name and chooses Dog or Cat.
3. User optionally adds profile context; no field is treated as inferred medical truth.
4. User saves the pet and it becomes the active pet.

### Scan now

1. User taps “Scan now” from Home.
2. User confirms the active pet and chooses a visible body area.
3. User opens Camera or Photo Library, captures/selects one image, and sees framing guidance.
4. User reviews the image and either retakes, discards, or continues.
5. User answers optional observation questions.
6. The app performs deterministic quality and safety checks before presenting a structured, non-diagnostic result.
7. User can save the result, retry with another image, or return to Home.

### Review history

1. User opens History.
2. User filters by pet or body area.
3. User taps a saved scan to open Scan Detail.
4. User can revisit the guidance, share a concise summary, or delete the scan.

### Learn and settings

1. User opens Learn to read observation and veterinarian-visit preparation guidance.
2. User opens Settings to review the exact consent copy, privacy behavior, limitations, and deletion controls.

## Visual System

The brand uses **warm oat** as the primary canvas, **deep forest** for text and actions, and **sage** for reassuring supportive accents. The palette is intentionally softer than a clinical interface.

| Token | Color | Usage |
|---|---|---|
| Canvas | `#F7F3EC` | Main background and onboarding surfaces |
| Surface | `#FFFDF9` | Cards, sheets, and forms |
| Ink | `#24322C` | Headings and primary text |
| Muted ink | `#6F7A72` | Supporting copy and metadata |
| Forest action | `#2F6B57` | Primary buttons, active states, links |
| Sage tint | `#DCE9DF` | Gentle informational panels |
| Amber notice | `#F4E2B9` | Caution and review-needed states |
| Coral alert | `#B95D4F` | Red-flag copy only, never decorative |
| Divider | `#E6DED3` | Borders and separators |

Typography follows iOS conventions: large but restrained page titles, readable body copy, semibold labels, and line heights that prevent clipping. Cards use a 20–24px radius; primary controls use a 16px radius and at least 48px height. Icons always appear with text labels for key actions.

## Interaction and Accessibility

All primary controls are thumb-reachable, use visible pressed feedback, and have accessible labels. Destructive actions require confirmation. The app avoids color-only status communication by pairing color with text such as “Needs a clearer photo,” “Observation only,” or “Contact a veterinarian promptly.”

## Safety Copy Principles

Every result includes: “This is an observation aid, not a diagnosis.” Uncertainty is shown when image quality or context is limited. Red-flag content is framed as an escalation suggestion, not a medical conclusion. The app never claims that a veterinarian reviewed the scan or that a condition is safe.
