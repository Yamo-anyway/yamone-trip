# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in `Yamo-anyway/yamone-trip`. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The target is an Android native React Native/Expo client and an installable APK, not a WebView. The old web implementation and tests remain only as regression references. M08 PWA is superseded.

## Current milestone

**M04 — v0.6.0: native private local authoring and immutable unit versions implemented; APK/device validation pending.**

- The native My units screen creates, resumes and explicitly deletes private local drafts. Korean/English UI clearly labels local content as unverified and says local save is neither account creation nor public posting.
- A draft records an explicitly chosen original locale, manual Seoul/Seongsu demo-region metadata, duration/cost/category and 1–5 concrete experience points. Other original-language locale codes are allowed while app UI remains ko/en.
- First save creates an immutable device-local unit/version. “Create next version” copies stable point IDs, prevents original-locale changes, requires the latest base version and appends a sequential version. Added points receive new IDs.
- Trips continue to embed exact version snapshots. Saving a later local version cannot mutate a scheduled title, points, record or private note.
- State schema v2 adds `localUnits` and `unitDrafts`. Schema-v1 data migrates in memory without rewriting raw storage; the next explicit write persists v2. Validated backup/import preserves authored histories and drafts, while still accepting the explicit schema-v1 transfer path.
- Local `user_authored`, `local-device`, seed state and opaque IDs are placeholders, not authoritative identity, ownership, verification, publication or growth. No translation, derivative, server or network call is created by M04.
- A01/A02/M03 features remain: bilingual demo discovery, safe native storage, private trips/schedules/checklists/notes and explicit local backup/import.
- All 40 repository blobs were SHA-verified against latest main `67ba1778381f1ecf5b4d09f539846692bd6017af` before edits. No user content or prior feature was removed.

## Validation in this run — 2026-09-25

- `npm test`: **80/80 passed** in this run. New coverage includes draft privacy/validation, stable IDs, first/later immutable versions, stale bases, source-locale immutability, scheduled snapshot preservation, draft deletion, backup round trip, and schema-v1 migration in both native and retained browser repositories.
- `npm run check`: passed in this run; 19 JavaScript files parse, ko/en key parity and fixtures pass, v0.6.0/code 6 agree, and privacy/network/source-boundary guards pass. This is not a native interaction test.
- `npm run bundle:android`: passed in this run; Metro/Hermes Android bundle generated from **611 modules**. A bundle export is not an APK.
- Offline Expo Android source prebuild passed. Generated Gradle source has version 0.6.0/code 6; source manifest keeps backup disabled and explicit location/media/advertising permission removals. Expo source still includes `INTERNET` for runtime/development infrastructure, so only a compiled merged release manifest and traffic test can establish final behavior.
- APK assembly was attempted with the generated Gradle wrapper but the required Gradle 9.0.0 distribution was not cached and network access was unavailable. Android SDK, adb, system image/emulator and a JDK compiler are also unavailable. No APK, merged manifest, install, cold launch, persistence, native authoring interaction or screenshot pass is claimed.
- `npm run test:ui` was attempted and blocked before launch because Chromium headless-shell is absent. It covers only the retained web reference, not the native app.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| A01 (implemented) | Native discovery/settings and async storage boundary | Node/static/bundle checks passed; APK/UI not yet verified |
| A02 (implemented) | Native private trip creation, schedule edit, checklist/notes | Snapshots/IDs/records preserved; explicit save/errors/discard protection; ko/en tests passed |
| **A03 (blocked locally)** | Local standalone Android APK build and device smoke | Recheck toolchain first; offline cold launch, restart persistence, back/keyboard/font/safe areas; inspect merged manifest/traffic; no cloud build/account/signing secrets |
| M03 (implemented) | Native backup/import and local schema migration | Full validation before preview/confirmation; corrupt/old data preserved; snapshots/notes round trip |
| M04 (implemented) | Native local authoring and immutable versions | 1–5 stable points; original locale; local/private drafts; existing snapshots unchanged |
| **M05 (next)** | Native improvements and attributed derivatives | New derivative ID with original unit/version attribution; improvements remain proposals; no fake public notifications |
| M06 | Native translation variant editor/review states | Original preserved; same unit/point identities; ko/en; no translation service |
| M07 | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| M09 | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limits; pause only this project's automation when complete or all remaining work is blocked |

## Remaining limitations / next action

Start from latest HEAD and recheck A03 toolchain availability. If it remains unavailable, retain the blocker and implement **M05 native improvement proposals and attributed derivatives**. A derivative must get a new local unit identity and visibly preserve its original unit/version attribution; translation must not be treated as a derivative. Improvement actions stay private/local until a future authorized server workflow exists.

AsyncStorage and exported backups are unencrypted and are not authentication or sync. Local identities are non-authoritative. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility or traffic testing. Catalog data is illustrative. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided.

Keep all real API calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
