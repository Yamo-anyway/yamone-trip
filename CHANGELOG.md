# Changelog

## 0.11.0 — 2026-09-25

- M10: added a reproducible Korean client handoff covering clean install checks, local Android debug build, merged-manifest inspection and 10 native smoke scenarios for ko/en, persistence, version snapshots, backup, back/keyboard, 200% font scaling, TalkBack, permissions and traffic.
- Added a machine-readable release-gate manifest with the explicit state `client_handoff_complete_release_blocked`. It separates nine completed safe client boundaries from seven blocked Android-device/server/signing/product/legal/photo gates and retains prohibitions on live API, photo upload, location, analytics/ad SDK and store submission.
- Added `check-release.mjs` to `npm run check`. It enforces version parity, completed/pending gate IDs, prohibited actions and required handoff instructions, while stating that a passing source gate is not release approval.
- Validation: `npm test` **117/117 passed**; `npm run check` passed (**24 JavaScript files** plus native and release-gate checks); Android Metro/Hermes bundle passed (**614 modules**); offline Android source prebuild passed with v0.11.0/code 11 and source manifest inspection retained backup/OTA and location/media/advertising restrictions. `npm run test:ui` was attempted and blocked before launch by missing Chromium. APK assembly was attempted offline but the Gradle 9.0.0 distribution is unavailable and cannot be downloaded; Android SDK, adb, system Gradle and `javac` are absent. No APK, merged manifest, TalkBack, visual, keyboard, traffic or device pass is claimed.

## 0.10.0 — 2026-09-25

- M09: added semantic checkbox, radio and tab roles with checked/selected/disabled state, explicit Korean/English accessibility hints, scalable native text/input and a wrapping two-row bottom navigation for narrow screens and enlarged text.
- Extracted Android hardware-back resolution into a pure, tested state function. A discard prompt is dismissed first; a changed editor requests confirmation rather than closing; clean editors, unit details, selected trips and non-default tabs then unwind in order.
- Static guards now require 48dp control height, scalable text, flexible navigation and the semantic control markers. Regression tests cover the back-state precedence and Korean/English accessibility-copy parity. Existing repository write-failure tests continue to prove bytes are preserved and reload is required after ambiguous writes.
- Validation: `npm test` **117/117 passed**; `npm run check` passed (**23 JavaScript files**); Android Metro/Hermes bundle passed (**614 modules**); offline Android source prebuild passed with v0.10.0/code 10 and source manifest inspection retained backup/OTA and location/media/advertising restrictions. `npm run test:ui` was attempted and blocked before launch by missing Chromium. APK assembly was attempted offline but the Gradle 9.0.0 distribution is unavailable and cannot be downloaded; Android SDK, adb, system Gradle and `javac` are absent. No APK, TalkBack, font-scale visual, keyboard, merged-manifest or device pass is claimed.

## 0.9.0 — 2026-09-25

- M07: expanded the disconnected future API client into an injected mock-test boundary. It remains disabled by default, has no configured origin and is not imported by either the native app or retained web reference.
- Future writes now require caller-provided idempotency keys, while PATCH/PUT/DELETE also require a revision (`If-Match`). No mutation is retried automatically. Authentication tokens remain memory callbacks and unsafe header/path/origin values fail before transport.
- Added stable, non-leaking error categories for auth/permission/not-found/revision conflict/rate limit/server/network/invalid response plus explicit caller cancellation and request timeout handling. Mock response bodies and transport exception details are not surfaced.
- Added a future remote repository with strict DTO allowlists for manual-region discovery, private trip creation, exact unit-version scheduling, personal schedule patches and self-reported records. Extra snapshots, local records, translation drafts and client authority fields are dropped; local/native repositories remain the active implementation.
- Validation: `npm test` **113/113 passed**; `npm run check` passed; Android Metro/Hermes bundle passed (**613 modules**); offline Android source prebuild passed with v0.9.0/code 9 and source manifest inspection retained backup/OTA and location/media/advertising restrictions. `npm run test:ui` was attempted and blocked before launch by missing Chromium. APK assembly was attempted offline but the Gradle 9.0.0 distribution is unavailable and cannot be downloaded; Android SDK, adb and `javac` are absent. No live API, APK, merged manifest, native UI or device pass is claimed.

## 0.8.0 — 2026-09-25

- M06: added device-only Korean/English translation variants bound to the exact original unit ID, version ID, original locale and experience-point IDs. Editing or deleting a translation never changes the original and never creates derivative lineage.
- Added manual translation drafts and explicit user-reviewed status. The model also distinguishes unreviewed machine translation and needs-review states for future server import, but this client does not call a translator or generate AI text.
- Unit details can create/edit target-language text, switch back to the preserved original and show manual/machine, draft/review or unverified demo labels. Saved translations are used consistently in discovery, trip schedules and checklists when their exact version matches.
- State schema v4 and validated backup/restore now preserve translation variants while dropping unknown fields. Schema-v1/v2/v3 records migrate in memory and are rewritten only after an explicit save.
- Validation: `npm test` **100/100 passed**; `npm run check` passed; Android Metro/Hermes bundle passed (**613 modules**); offline Android source prebuild passed with v0.8.0/code 8 and source manifest checks retained backup/OTA and location/media/advertising restrictions. `npm run test:ui` was attempted and blocked before launch by missing Chromium. APK assembly was attempted without external downloads but the Gradle 9.0.0 distribution is not installed and the restricted environment could not fetch it; Android SDK, adb and `javac` are also absent. No APK, merged manifest, native UI or device pass is claimed.

## 0.7.0 — 2026-09-25

- M05: added private local improvement proposals bound to an exact source unit/version. Saving or deleting a proposal never changes the source and the UI explicitly says it was not sent to an author or server.
- Added attributed derivative authoring from demo or local unit details. A derivative receives a new unit/version and new experience-point IDs while retaining the exact immediate source unit ID, version ID, original locale and title.
- Derivative attribution is shown in the editor, My units and unit details, remains immutable across later versions, survives trip snapshots and round-trips through validated backup/restore. Translation remains a separate same-identity concept and does not create lineage.
- State schema v3 adds improvement proposals and lineage. Existing schema-v1/v2 data migrates in memory, remains untouched until an explicit write and can still be imported through preview/confirmation.
- Validation: `npm test` **90/90 passed**; `npm run check` passed; Android Metro/Hermes bundle passed (612 modules); offline Android source prebuild passed with v0.7.0/code 7. `npm run test:ui` was attempted and blocked before launch by missing Chromium and covers only the retained web reference. Android SDK, adb, Gradle installation and a JDK compiler remain unavailable, so no APK, merged manifest, native UI or device pass is claimed.

## 0.6.0 — 2026-09-25

- M04: added native private local-unit drafts and immutable authored versions. The editor accepts an explicit original locale, title/details and 1–5 experience points without creating an account or public post.
- Experience-point IDs remain stable across later versions, the original locale is immutable, and each saved version is appended sequentially. Existing trip items keep their exact scheduled snapshot when a newer unit version is saved.
- Added local/unverified/source labels, draft resume/delete confirmation and “create next version” flows in Korean and English. Translation and derivative creation are deliberately separate future milestones.
- State schema v2 stores local units and drafts. Schema-v1 data migrates in memory and is rewritten only after an explicit user write; v1 backups still import through the existing validated preview/confirmation path. Backups now preserve drafts and immutable authored histories.
- Validation: `npm test` **80/80 passed**; `npm run check` passed; Android Metro/Hermes bundle passed (611 modules); offline Android source prebuild passed with v0.6.0/code 6 and source-level permission removals. `npm run test:ui` was attempted and blocked before launch by missing Chromium; it covers only the retained web reference. APK assembly could not proceed because the Gradle distribution is unavailable in the restricted environment, and no Android SDK/adb or compiler toolchain is available. No APK, merged manifest or native UI/device pass is claimed.

## 0.5.0 — 2026-09-25

- M03: added explicit Android local backup export and import through system file/directory pickers. The app does not upload or automatically share backup files.
- Backup v1 is a versioned JSON envelope. Import checks the file-size limit and validates the complete state, trip ranges, item identities, immutable unit-version snapshots, records and self-reported statuses before showing a count-only preview.
- Restore requires a second destructive confirmation and uses the repository's stale/write-failure protection. Cancelled, malformed, unsupported and future-version files leave both current app data and the selected file unchanged.
- Exact snapshots, Korean/English/original text, manual movement/break estimates, private notes and completion records round trip. An explicit raw schema-v1 path supports earlier local/browser data; no automatic browser migration was added. Unknown fields are discarded before persistence.
- Added strict transport validation and eight backup/migration regression tests. Pinned the Expo SDK 55 filesystem module already bundled by Expo; no broad storage, photo or location permission was added.
- Validation: `npm test` **68/68 passed**; `npm run check` passed; Android Metro/Hermes bundle passed (610 modules); offline Android source prebuild passed and generated v0.5.0/code 5 config retained backup disabled and location/media permission removals. `npm run test:ui` was attempted and blocked before launch by missing Chromium; it only covers the retained web reference. No JDK compiler/Android SDK/adb is available, so APK, merged manifest, native file-picker interaction and device UI remain unverified.

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
