# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in `Yamo-anyway/yamone-trip`. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The target is an Android native React Native/Expo client and an installable APK, not a WebView. The old web implementation and tests remain only as regression references. M08 PWA is superseded.

## Current milestone

**M05 — v0.7.0: native private improvement proposals and attributed derivatives implemented; APK/device validation pending.**

- Unit details now offer two separate local actions: save a private improvement proposal or create a derivative draft. Neither action calls a server, publishes content or notifies an author.
- An improvement proposal has its own local ID, `private` visibility, `local_only` status, concrete text and an exact source unit/version reference. It never edits its source and can be explicitly deleted.
- A derivative creates a new local unit ID, version ID and experience-point IDs. The first and every later version preserve the exact immediate source unit ID, version ID, version number, original locale and display title.
- Source attribution is visible in the derivative editor, My units and unit detail. Translation remains a same-unit/version variant and never receives derivative lineage.
- State schema v3 adds improvement proposals and lineage. Schema-v1/v2 records migrate in memory without rewriting raw storage; a later explicit write persists v3. Validated backup/import preserves proposals and derivative attribution.
- Existing M04 immutability remains: derivative version updates cannot alter earlier derivative versions or snapshots already stored in private trips.
- Local identities, attribution, authorship and `local_only` states are non-authoritative placeholders, not proof of permission, ownership, review, publication, delivery or growth.
- Latest `main` and required repository instructions were re-read at commit `a73edea4ff914d4691645c21d266abd4408b6c8d` before edits. No newer overlapping commit was present.

## Validation in this run — 2026-09-25

- `npm test`: **90/90 passed** in this run. Coverage includes private/local-only proposals, exact source references, invalid and duplicate proposals, isolated deletion, new derivative identities and point IDs, immutable lineage across versions, state rejection of changed lineage, translation separation, backup round trip and schema-v1/v2 migration.
- `npm run check`: passed in this run; 20 JavaScript files parse, ko/en key parity and fixtures pass, v0.7.0/code 7 agree, and privacy/network/source-boundary guards pass. This is not a native interaction test.
- `npm run bundle:android`: passed in this run; Metro/Hermes Android bundle generated from **612 modules**. A bundle export is not an APK.
- Offline Expo Android source prebuild passed. Generated source uses v0.7.0/code 7; source configuration continues to disable OS backup/OTA updates and remove location/media/advertising permissions.
- Android SDK, adb, Gradle installation, Chromium and a JDK compiler are absent. APK/device validation could not start. No APK, merged manifest, installation, cold launch, persistence, native M05 interaction or screenshot pass is claimed.
- `npm run test:ui` was attempted and blocked before launch because Chromium headless-shell is absent. It covers only the retained web reference, not native M05 screens.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| A01 (implemented) | Native discovery/settings and async storage boundary | Node/static/bundle checks passed; APK/UI not yet verified |
| A02 (implemented) | Native private trip creation, schedule edit, checklist/notes | Snapshots/IDs/records preserved; explicit save/errors/discard protection; ko/en tests passed |
| **A03 (blocked locally)** | Local standalone Android APK build and device smoke | Recheck toolchain first; cold launch/restart/back/keyboard/font/safe areas; inspect merged manifest/traffic; no cloud build/account/signing secrets |
| M03 (implemented) | Native backup/import and local schema migration | Full validation before preview/confirmation; corrupt/old data preserved; snapshots/notes round trip |
| M04 (implemented) | Native local authoring and immutable versions | 1–5 stable points; original locale; local/private drafts; existing snapshots unchanged |
| M05 (implemented) | Native improvements and attributed derivatives | New IDs and exact original unit/version attribution; proposals remain private/local; no fake delivery |
| **M06 (next)** | Native translation variant editor/review states | Original preserved; same unit/version/point identities; ko/en display; no translation service |
| M07 | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| M09 | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limits; pause only this project's automation when complete or all remaining work is blocked |

## Remaining limitations / next action

Start from latest HEAD and recheck A03 toolchain availability. If it remains unavailable, retain the blocker and implement **M06 native translation variants and review states**. The original text must remain immutable; Korean/English translations must share the exact original unit/version and experience-point IDs, carry source/review labels and never create a derivative. No translation API or automatic private-data transfer may be added.

AsyncStorage and exported backups are unencrypted and are not authentication or sync. Local attribution is not legal clearance. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility or traffic testing. Catalog data is illustrative. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided.

Keep all real API calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
