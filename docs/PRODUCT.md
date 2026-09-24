# Product scope — 2026-09-24

## Confirmed by the user

Yamone Trip organizes actionable travel units into a trip, then lets users perform 1–5 points, leave notes, suggest improvements or create attributed derivatives. AI may seed initial content, but it must be distinguishable from real experience. UI languages are Korean and English only for now. Device-location functionality is deferred until the user can fund legal review. The user requests hourly client development in this repository, excluding the backend; prepare API interfaces for connection later.

## Initial implementation choice

Start with the previously planned mobile-first web client, with no runtime dependencies. A static developer preview is sufficient; PWA installation/offline packaging is a later milestone. Android/iOS native packaging has NOT been selected or completed. This is not an app-store release.

The first guest mode uses browser local storage for small structured data. It does not register a user, authenticate ownership, publish to others, or prove physical attendance. Local storage can be cleared or fail; warn on failure and provide backup/restore in a subsequent milestone. Do not store secrets in browser storage.

## Core rules

- Public units and private trips are separate objects.
- Original language and translated variants share a unit/version identity. Display a translated label and let users inspect the original.
- Each scheduled item contains an immutable unit-version snapshot plus personal start time/duration overrides. Calendar dates are plain local dates, not device-location-derived time zones.
- Planned movement is manually entered estimated time, never an actual path or current distance.
- Completion is a self-reported experience record, not location-verified. Seed/sprout/flower must not be represented as verified safety or factual certification.
- Version history and attribution must support future privacy/rights removal: immutable business history is NOT permission to retain prohibited personal data forever.
- External maps, when added, receive only the public destination and open upon explicit user action; no current origin is supplied by this app. Third-party apps have separate policies.
- Translation requests must not include account IDs, private itineraries or personal notes by default. Backend services are not called in this phase.

## Not yet confirmed

Login/provider/guest migration policy, minimum age, release countries, map provider, backend base URL/auth scheme, final growth thresholds and legal documents. Earlier assistant recommendations are proposals, not user decisions or legal clearance. Do not ship legal assurances; a final SDK/data-flow review is needed even without GPS.

## Visual direction

Keep the four core screens from the concept: Discover -> Unit detail -> My trip -> Experience checklist. Warm ivory and deep mint, compact readable cards, navigation: My trips / Find units / My units / Settings. All sample locations, costs and estimates must be labeled demo data, not live travel recommendations.
