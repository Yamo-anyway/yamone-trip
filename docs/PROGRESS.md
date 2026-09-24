# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in `Yamo-anyway/yamone-trip`. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The target is an Android native React Native/Expo client and an installable APK, not a WebView. The old web implementation and tests remain only as regression references. M08 PWA is superseded.

## Current milestone

**M10 — v0.11.0: server-free client handoff and release gates complete; release remains blocked.**

- `docs/CLIENT_HANDOFF.md` documents clean source checks, a local no-cloud Android debug build, merged-manifest inspection and 10 device-smoke scenarios covering ko/en, persistence, immutable snapshots, backup, back/keyboard, 200% text, TalkBack, permissions and traffic.
- `docs/release-gates.json` records nine completed safe client boundaries and seven blocked tool/device/server/signing/product/legal/photo gates. Its status is explicitly `client_handoff_complete_release_blocked`, not release-ready.
- `scripts/check-release.mjs` is part of `npm run check` and enforces version parity, gate identities, prohibited actions and handoff instructions. A passing result explicitly says it is not release approval.
- Live API, production authentication, photo upload, device location, analytics/ad SDK and store submission remain prohibited. No server, credential, paid build or external message was added.
- Latest `main` and required repository instructions were re-read at commit `ec53c589616d90f3fad47a5c77e384ba105ea11d` before edits. No newer overlapping commit was present.

## Validation in this run — 2026-09-25

- `npm test`: **117/117 passed** in this run, including API disconnection, immutable snapshots, backup, lineage/translation, failed/stale writes, accessibility semantics and back/discard regressions.
- `npm run check`: passed in this run; 24 JavaScript files parse, ko/en key parity and fixtures pass, v0.11.0/code 11 agree, accessibility/privacy/API boundaries pass and the release manifest reports seven explicit blockers. This is not release approval or a native interaction test.
- `npm run bundle:android`: passed in this run; Metro/Hermes Android bundle generated from **614 modules**. A bundle export is not an APK.
- Offline Expo Android source prebuild passed. Generated source uses v0.11.0/code 11; source manifest inspection shows OS backup disabled and location/media/advertising permission removal directives. `INTERNET` is an Expo/React Native source permission and is not proof of an active API; merged-manifest and traffic inspection remain device gates.
- A Java 17 runtime exists, but Android SDK, adb, system Gradle, `javac` and the Gradle 9.0.0 distribution are absent. `./gradlew --offline assembleDebug` was attempted, but the wrapper tried to fetch that missing distribution and failed because the network is unavailable. No APK, merged manifest, installation, cold launch, persistence, native interaction, traffic capture or screenshot pass is claimed.
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
| M10 (implemented) | Client handoff/release gates | Final tests passed; server/product/SDK/signing/device limits are checked and documented; release remains blocked |

## Remaining limitations / next action

The safe server-free client backlog is complete. Further work is blocked until at least one external gate changes: Android SDK/Gradle/adb plus a device for A03; an approved backend/auth/schema; final package/signing/distribution authority; release country/age/map/growth/legal decisions; SDK/data-flow review; or an approved and tested photo-metadata pipeline. Resume explicitly from latest HEAD and follow `docs/CLIENT_HANDOFF.md`; do not claim TalkBack, visual, keyboard, APK, traffic or device passes without evidence.

AsyncStorage and exported backups are unencrypted and are not authentication or sync. Local attribution is not legal clearance. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility or traffic testing. Catalog data is illustrative. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided.

Keep all real API calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. This project's recurring automation is paused after the one-time M10 completion/blocker report because every remaining item requires unavailable tooling, backend work, user decisions or new authority. Do not modify other project automations.
