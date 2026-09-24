# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in `Yamo-anyway/yamone-trip`. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The target is an Android native React Native/Expo client and an installable APK, not a WebView. The old web implementation and tests remain only as regression references. M08 PWA is superseded.

## Current milestone

**M09 — v0.10.0: native accessibility semantics and data-loss regression guards implemented; APK/device validation pending.**

- Experience checklist controls now expose checkbox roles and checked state. Original-locale/category/trip/language choices expose radio roles and checked state. Bottom navigation exposes tab roles and selected state with Korean/English hints.
- Native text and inputs explicitly allow system font scaling. Controls retain 48dp minimum height and the bottom navigation wraps to a two-column/two-row layout to reduce narrow-screen and enlarged-text clipping risk.
- Android hardware-back routing is a pure tested decision: discard prompt first, then changed/clean editor, unit detail, selected trip, non-default tab and finally system exit. A changed editor is never returned as a direct close action.
- Existing write-failure coverage proves stored bytes remain unchanged and a repository reload is required before another write. The app's failure path does not clear the editor or display a saved notice.
- Static guards require accessibility semantics, font scaling, touch target, flexible navigation and back resolver markers. They supplement but do not replace TalkBack, focus, font-size, keyboard, visual and device tests.
- Latest `main` and required repository instructions were re-read at commit `421925569fa27c108f2e8dab96c9bc8b0235dfff` before edits. No newer overlapping commit was present.

## Validation in this run — 2026-09-25

- `npm test`: **117/117 passed** in this run. New coverage checks back-action precedence, direct-discard prevention, ko/en accessibility hint parity and required font/control/layout source markers; existing failed/stale-write preservation tests also passed.
- `npm run check`: passed in this run; 23 JavaScript files parse, ko/en key parity and fixtures pass, v0.10.0/code 10 agree, accessibility/privacy boundaries pass and future API modules remain disconnected. This is not a TalkBack, visual or native interaction test.
- `npm run bundle:android`: passed in this run; Metro/Hermes Android bundle generated from **614 modules**. A bundle export is not an APK.
- Offline Expo Android source prebuild passed. Generated source uses v0.10.0/code 10; source manifest inspection shows OS backup disabled and location/media/advertising permission removal directives. `INTERNET` is an Expo/React Native source permission and is not proof of an active API; merged-manifest and traffic inspection remain device gates.
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
| M09 (implemented) | Native accessibility and data-loss regression pass | Semantic roles/state, scalable text, flexible navigation, deterministic back and failed/unsaved-write source regressions passed; device evidence pending |
| **M10 (next)** | Client handoff/release gates | Final tests; clear server/product/SDK/signing limits; pause only this project's automation when complete or all remaining work is blocked |

## Remaining limitations / next action

Start from latest HEAD and recheck A03 toolchain availability. If it remains unavailable, retain the blocker and complete **M10 client handoff/release gates**: run the final client checks, enumerate the exact device/server/product/SDK/signing decisions still required and provide a reproducible local Android verification checklist. Do not claim TalkBack, visual, keyboard, APK or device passes without actual evidence. When the safe client backlog is complete and every remaining item needs unavailable tooling, backend work, user decisions or new authority, pause only this project's automation after the one-time completion/blocker report.

AsyncStorage and exported backups are unencrypted and are not authentication or sync. Local attribution is not legal clearance. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility or traffic testing. Catalog data is illustrative. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided.

Keep all real API calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
