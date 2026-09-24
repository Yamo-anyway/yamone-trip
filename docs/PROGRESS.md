# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in `Yamo-anyway/yamone-trip`. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The target is an Android native React Native/Expo client and an installable APK, not a WebView. The old web implementation and tests remain only as regression references. M08 PWA is superseded.

## Current milestone

**M07 — v0.9.0: disabled future API mock harness and repository boundaries implemented; APK/device validation pending.**

- `FutureApiClient` remains disabled by default, has no configured origin and is not imported by the native app or retained web reference. All M07 transport tests inject in-memory mock functions; no real API request is made.
- Every proposed write requires an idempotency key; PATCH/PUT/DELETE additionally require an explicit revision. The client never automatically retries mutations. Tokens are obtained only from an in-memory callback and unsafe origin/path/header values fail before the mock transport.
- HTTP 401/403/404/409/412/429/5xx, network failure, invalid response, caller cancellation and timeout map to stable errors without exposing mock response bodies or transport exception details. Rate limit/server/network/timeout errors are marked retryable for a future caller decision, not retried automatically.
- `FutureRemoteRepository` constructs strict allowlisted DTOs for manual-region discovery, private trip creation, exact unit-version scheduling, personal schedule patches and self-reported records. Extra local snapshots, records, translation drafts, visibility and client authority fields are not forwarded.
- Static checks forbid either future API module from being imported by the active apps. `NativeRepository`/AsyncStorage remains the only runtime data path.
- Latest `main` and required repository instructions were re-read at commit `137dc43450a93257e0d704dde61bf78c0d200804` before edits. No newer overlapping commit was present.

## Validation in this run — 2026-09-25

- `npm test`: **113/113 passed** in this run. Coverage includes zero-call disabled mode, unsafe configuration rejection, auth headers, idempotency/revision requirements, stable HTTP error mapping, non-leaking failures, caller abort, timeout, no automatic retry and DTO field allowlists.
- `npm run check`: passed in this run; 22 JavaScript files parse, ko/en key parity and fixtures pass, v0.9.0/code 9 agree, privacy boundaries pass and future API modules remain disconnected. This is not a live integration or native interaction test.
- `npm run bundle:android`: passed in this run; Metro/Hermes Android bundle generated from **613 modules**. A bundle export is not an APK.
- Offline Expo Android source prebuild passed. Generated source uses v0.9.0/code 9; source manifest inspection shows OS backup disabled and location/media/advertising permission removal directives. `INTERNET` is an Expo/React Native source permission and is not proof of an active API; merged-manifest and traffic inspection remain device gates.
- A Java 17 runtime exists, but Android SDK, adb, system Gradle, `javac` and the Gradle 9.0.0 distribution are absent. `./gradlew --offline assembleDebug` was attempted, but the wrapper tried to fetch that missing distribution and failed because the network is unavailable. No APK, merged manifest, installation, cold launch, persistence, native M07 interaction, traffic capture or screenshot pass is claimed.
- `npm run test:ui` was attempted and blocked before launch because Chromium headless-shell is absent. It covers only the retained web reference, not native screens.

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
| M07 (implemented) | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| **M09 (next)** | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limits; pause only this project's automation when complete or all remaining work is blocked |

## Remaining limitations / next action

Start from latest HEAD and recheck A03 toolchain availability. If it remains unavailable, retain the blocker and implement the safe source-testable portion of **M09 native accessibility and data-loss regressions**. Cover accessibility labels/roles/state, font scaling and small-screen layout statically where possible, plus back/keyboard/unsaved/write-failure state logic. Do not claim TalkBack, visual or device passes without actual evidence.

AsyncStorage and exported backups are unencrypted and are not authentication or sync. Local attribution is not legal clearance. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility or traffic testing. Catalog data is illustrative. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided.

Keep all real API calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
