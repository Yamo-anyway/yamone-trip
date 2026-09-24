# Changelog

## 0.4.0 — 2026-09-24

- A02: connected the native app flow from private trip creation through exact unit-version scheduling, personal schedule editing, overlap warnings, self-reported point checks and private notes.
- Schedule edits preserve item/unit/version identities, original snapshots and records. Movement/break fields are manual estimates only; no location, route, arrival or visit verification was added.
- Added explicit validation/save errors and confirmation before discarding changed native forms. Failed storage writes keep form input and require repository reload.
- Added native-safe opaque local ID generation without browser crypto globals. These are not future server identities.
- Added pure native mutation/draft actions and 9 regression tests covering private state, immutable snapshots, duplicate/out-of-range rejection, edit preservation, records/skips, missing targets and discard-state detection.
- Validation: `npm test` 60/60 passed; `npm run check` passed; Android Metro/Hermes bundle passed (598 modules); offline Android source prebuild and v0.4.0/code 4 source-config inspection passed. `npm run test:ui` was attempted and blocked before launch by the still-missing Chromium executable; it covers only the retained web reference. No Android SDK/JDK compiler/adb is available, so APK build, merged manifest, installation and native UI/device testing remain unverified.

## 0.3.0 — 2026-09-24

- A01: honor the user's app correction; add Android React Native/Expo screens, not a WebView/PWA. Preserve the web implementation as a regression reference. Native trip/edit/checklist wiring is A02, not claimed complete here.
- Manual area selection, demo discovery/details, ko/en language settings, source/version/original/translation labels and Android back handling.
- App-scoped asynchronous storage with serialized validated writes, corrupt/stale/failure protection and no browser-data auto-migration. No real API, accounts, publishing, location or photo features.
- Android-only development config, pinned dependencies/lockfile, backup/update disabled and permission removal directives. No final package/store/signing decisions.
- Shared JSON DTO snapshot cloning no longer depends on browser/runtime `structuredClone` availability; native reload regression added.
- Verification: 51/51 Node tests passed (11 native storage/portability additions); static/JSX/config checks passed; Android Metro/Hermes bundle and source-project prebuild passed. Offline Expo compatibility check matches bundled versions but has limited validation. Browser test attempted, blocked by missing Chromium. No Android SDK/JDK compiler/adb; APK build and device/UI validation remain unverified. See PROGRESS for exact limits and next native milestone.

## 0.2.0 — 2026-09-24

- M02: Korean/English schedule editing for day, start time, personal duration, and manual movement/break estimates. Time edits reorder presentation without silently shifting other items.
- Conflict detection reserves experience → movement → break, including midnight/real-calendar validation. No routing, GPS or actual movement data.
- Preserve item IDs, original version snapshots, private notes and completion records on schedule changes. Legacy v1 records without estimates remain readable (missing estimates mean zero); malformed values are refused.
- Added 12 domain/storage/locale regression tests and four pending browser scenarios for editing, validation, cancellation, reload, reordering and buffer conflicts. Updated proposed schedule DTO/API semantics; live API remains blocked.
- Validation: `npm test` 40/40 passed; `npm run check` passed (14 JavaScript files). `npm run test:ui` attempted but blocked before launch: required Chromium executable is absent. No repeated installer download attempted after the documented failure. Browser interactions/screenshots remain unverified.

## 0.1.0 — 2026-09-24

- Initial dependency-free, mobile-first Korean/English local client.
- Demo catalog, combined filters and original/translation view.
- Private local trips, unit-version snapshots, overlap warnings, checklist and notes.
- Storage validation and disabled future API adapter with proposed contract/DTOs.
- Node domain/storage/adapter tests and repeatable Chromium smoke script.
- No backend, live API calls, location functionality, publishing or deployment.
- Validation: 28 Node tests and static checks passed. Browser smoke/visual QA pending because the environment's Chromium download failed; no UI pass claimed.
