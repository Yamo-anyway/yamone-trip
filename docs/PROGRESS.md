# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in `Yamo-anyway/yamone-trip`. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The target is an Android native React Native/Expo client and an installable APK, not a WebView. The old web implementation and tests remain only as regression references. M08 PWA is superseded.

## Current milestone

**M06 — v0.8.0: native local translation variants and review states implemented; APK/device validation pending.**

- Unit details now create/edit device-only Korean or English translations while preserving the original. Saved variants retain the exact source unit ID, version ID, original locale, point IDs and point order; they never receive derivative lineage.
- Manual translation drafts and explicit user-reviewed status are active. The schema also distinguishes labeled `machine_unreviewed` and `needs_review` states for future import, but no translation service or external text transfer is active.
- Unit detail provides an original toggle and labels saved translations as manual/machine plus review status. Built-in bilingual fixtures remain visibly labeled example/unverified content rather than user-reviewed translations.
- Exact-version translations are reused in discovery, trip schedules and experience checklists. A newer source version does not silently inherit an older translation.
- State schema v4 adds `translationVariants`. Schema-v1/v2/v3 data migrates in memory without rewriting raw storage; validated backup/import preserves known translation fields and rejects duplicate identities while dropping unknown fields.
- Existing M04/M05 immutability remains: translations cannot edit source versions, trip snapshots, improvement proposals or derivative attribution.
- Latest `main` and required repository instructions were re-read at commit `fa0b71f916a0e65d623f797a8483e954e2c34270` before edits. No newer overlapping commit was present.

## Validation in this run — 2026-09-25

- `npm test`: **100/100 passed** in this run. Coverage includes translation identity/point mapping, original immutability, exact-version lookup, manual/machine review-state constraints, isolated upsert/delete, duplicate rejection, schema-v1/v2/v3 migration and backup canonicalization/round trip.
- `npm run check`: passed in this run; 21 JavaScript files parse, ko/en key parity and fixtures pass, v0.8.0/code 8 agree, and privacy/network/source-boundary guards pass. This is not a native interaction test.
- `npm run bundle:android`: passed in this run; Metro/Hermes Android bundle generated from **613 modules**. A bundle export is not an APK.
- Offline Expo Android source prebuild passed. Generated source uses v0.8.0/code 8; source manifest inspection shows OS backup disabled and location/media/advertising permission removal directives. This is not merged-manifest or device evidence.
- A Java 17 runtime exists, but Android SDK, adb, system Gradle, `javac` and the Gradle 9.0.0 distribution are absent. `./gradlew --offline assembleDebug` was attempted, but the wrapper tried to fetch that missing distribution and failed because the network is unavailable. No APK, merged manifest, installation, cold launch, persistence, native M06 interaction or screenshot pass is claimed.
- `npm run test:ui` was attempted and blocked before launch because Chromium headless-shell is absent. It covers only the retained web reference, not native M06 screens.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| A01 (implemented) | Native discovery/settings and async storage boundary | Node/static/bundle checks passed; APK/UI not yet verified |
| A02 (implemented) | Native private trip creation, schedule edit, checklist/notes | Snapshots/IDs/records preserved; explicit save/errors/discard protection; ko/en tests passed |
| **A03 (blocked locally)** | Local standalone Android APK build and device smoke | Recheck toolchain first; cold launch/restart/back/keyboard/font/safe areas; inspect merged manifest/traffic; no cloud build/account/signing secrets |
| M03 (implemented) | Native backup/import and local schema migration | Full validation before preview/confirmation; corrupt/old data preserved; snapshots/notes round trip |
| M04 (implemented) | Native local authoring and immutable versions | 1–5 stable points; original locale; local/private drafts; existing snapshots unchanged |
| M05 (implemented) | Native improvements and attributed derivatives | New IDs and exact original unit/version attribution; proposals remain private/local; no fake delivery |
| M06 (implemented) | Native translation variant editor/review states | Original preserved; same unit/version/point identities; ko/en display; no translation service |
| **M07 (next)** | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| M09 | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limits; pause only this project's automation when complete or all remaining work is blocked |

## Remaining limitations / next action

Start from latest HEAD and recheck A03 toolchain availability. If it remains unavailable, retain the blocker and implement **M07 API mock harness and repository boundaries**. Cover auth/error/revision/idempotency/abort behavior with mocks while keeping every real call disabled; private trips, notes and translation drafts must not be sent.

AsyncStorage and exported backups are unencrypted and are not authentication or sync. Local attribution is not legal clearance. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility or traffic testing. Catalog data is illustrative. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided.

Keep all real API calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
