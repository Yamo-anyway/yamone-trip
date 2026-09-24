# Product scope — 2026-09-24

## Confirmed by the user

Yamone Trip organizes actionable travel units into a trip, then lets users perform 1–5 points, leave notes, suggest improvements or create attributed derivatives. AI may seed initial content, but it must be distinguishable from real experience. UI languages are Korean and English only for now. Device-location functionality is deferred until the user can fund legal review. The user requests hourly client development in this repository, excluding the backend; prepare API interfaces for connection later.

## App correction — 2026-09-24 (supersedes the initial web choice)

The user corrected the initial implementation: this must be an app, not a website. Development now targets an Android native client and an installable APK, following the app-conversion handoff. React Native/Expo is an implementation choice for reusing the existing JavaScript domain and DTOs, not a WebView wrapper or hosted website. iOS, final store identity, release countries and distribution/signing remain unconfirmed. No PWA milestone or web deployment should be pursued. Existing web code is retained as a reference/regression fixture, not the product deliverable.

Native storage uses an app-scoped AsyncStorage namespace, separate from the existing browser data. It is unencrypted local storage, not registration, authentication, publication or proof of attendance. App removal/data clearing can lose records. Android automatic backup is disabled; intentional backup/restore and browser-to-app transfer require a validated preview and explicit replacement confirmation. Never silently copy or erase browser data. Do not store secrets or irreplaceable personal records in the development app.

A01 implements native demo discovery/details and language settings with safe asynchronous storage. A02 adds private native trip creation, unit-version scheduling, schedule editing and self-reported checklists/private notes. M03 adds user-initiated local JSON backup/restore through Android system pickers. M04 adds private local unit drafts and immutable authored versions: each version keeps its original locale and 1–5 stable experience-point IDs, while trips retain the exact snapshot they scheduled. M05 adds private improvement proposals that do not edit their source and attributed derivative units with new identities and exact original unit/version references. M06 adds local Korean/English translation variants and review states: the original stays immutable, the unit/version/point identities stay the same, and translation never creates derivative lineage. Current translation editing is manual and device-only; machine translation is a labeled future/import state, not an active service. None of these local actions claims an account, delivery to an author, publication, administrator review or verification. Unsaved form changes require an explicit discard action before leaving. `com.yamone.trip.dev` is only a development package identifier, not a final release decision. Source/bundle checks do not prove APK installation, actual permissions or visual behavior; these remain explicit release gates.

## Core rules

- Public units and private trips are separate objects.
- Original language and translated variants share a unit/version identity. Display a translated label and let users inspect the original.
- Each scheduled item contains an immutable unit-version snapshot plus personal start time/duration overrides. Calendar dates are plain local dates, not device-location-derived time zones.
- Planned movement is manually entered estimated time, never an actual path or current distance.
- Completion is a self-reported experience record, not location-verified. Seed/sprout/flower must not be represented as verified safety or factual certification.
- Version history and attribution must support future privacy/rights removal: immutable business history is NOT permission to retain prohibited personal data forever.
- External maps, when added, receive only the public destination and open upon explicit user action; no current origin is supplied by this app. Third-party apps have separate policies.
- Translation requests must not include account IDs, private itineraries or personal notes by default. Backend services are not called in this phase.
- Backup files deliberately contain private itineraries and notes so they can round trip. They stay outside translation/API flows, are never uploaded by the app, and must be labeled unencrypted and sensitive.

## Not yet confirmed

Login/provider/guest migration policy, minimum age, release countries, map provider, backend base URL/auth scheme, final growth thresholds and legal documents. Earlier assistant recommendations are proposals, not user decisions or legal clearance. Do not ship legal assurances; a final SDK/data-flow review is needed even without GPS.

## Visual direction

Keep the four core screens from the concept: Discover -> Unit detail -> My trip -> Experience checklist. Warm ivory and deep mint, compact readable cards, navigation: My trips / Find units / My units / Settings. All sample locations, costs and estimates must be labeled demo data, not live travel recommendations.
