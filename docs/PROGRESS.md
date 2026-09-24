# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in Yamo-anyway/yamone-trip. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The handoff targets Android and an installable APK. v0.3.0 starts a native React Native/Expo client, not a WebView. The old web implementation and M01/M02 tests remain intact for reference. Do not continue web feature work or the old M08 PWA plan. Native development takes precedence over M03.

## Current milestone

**A02 — v0.4.0: native private trip/schedule/experience flow implemented; APK/device validation pending.**

- A01 remains: native safe-area navigation, manual area selection, bilingual demo discovery/details, source/version/translation labels, original toggle and language settings.
- Create a private local trip for a manually selected region; add an exact unit-version snapshot; view time-sorted schedules and overlap warnings; edit date/start/duration/manual movement/manual break without mutating identity, snapshot or existing record.
- Directly check 1–5 experience points and save partial/complete/skipped self-reported status with a private note. No GPS/arrival/visit certification, publication or growth claim.
- Native forms retain validation/storage-failed input. Android back, cancel and tab navigation require an explicit discard action when the draft changed. All successful writes are explicit.
- Pure native mutation actions validate the whole resulting state. Local opaque IDs avoid `crypto.randomUUID`/browser globals, reject collisions in current state, and are not represented as future server identities.
- Native language settings use device language only for UI, never for region. AsyncStorage stays in a separate native namespace; corrupt/future schema, stale writes and failed/ambiguous persistence block further writes until reload. No reset, browser migration, account or publication claim.
- Expo SDK 55 dependencies pinned with package-lock; Android development identifier only (`com.yamone.trip.dev`). Location, camera/media/audio, advertising ID and unnecessary overlay/vibration permissions have removal directives. OS backup and OTA updates disabled in app config. No remote API or photo module connected.
- All 33 starting files were SHA-verified against latest main `7d9442537ccaff991b8f4f1edb94a57ee553690d` before edits. No old browser source or user data removed.

## Validation in this run — 2026-09-24

- `npm test`: **60/60 passed** in this run. Nine new native action/ID/draft tests cover private trip creation, immutable snapshots, duplicate/out-of-range scheduling, edit preservation, partial/skipped records, invalid targets and unsaved-draft detection/copying. Storage tests use a mocked disk, not Android hardware.
- `npm run check`: passed in this run; source/JSX parse, ko/en key parity, v0.4.0 config, privacy/network/browser-global guards and all fixtures passed. This is not a native interaction test.
- `npm run bundle:android`: passed in this run, Metro/Hermes Android bundle generated (598 modules). Bundle export is NOT an APK.
- Offline Expo Android source prebuild passed in this run. Generated Gradle config shows version 0.4.0/code 4; source manifest shows backup/update disabled and location permission removal directives. Generated native sources remain ignored. This is not a compiled/merged release manifest or device test.
- `npm run test:ui`: attempted; blocked before launch by absent Chromium headless-shell. Earlier failed browser download was not repeated. This script tests the retained web reference, not native screens.
- No JDK compiler (`javac`), Android SDK, adb, Gradle installation or emulator available. No APK build, install, runtime screenshots or native interaction pass is claimed. Do not use a web preview as substitute evidence.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| A01 (implemented) | Native discovery/settings and async storage boundary | Node/static/bundle checks passed; APK/UI not yet verified |
| A02 (implemented) | Native private trip creation, schedule edit, checklist/notes | Snapshots/IDs/records preserved; explicit save/errors/discard protection; ko/en source and tests passed |
| **A03 (next)** | Local standalone Android APK build and device smoke | Toolchain availability check first; offline cold launch, restart persistence, back/keyboard/font/safe areas; inspect merged manifest/traffic; no cloud build/account/signing secrets without authority. Record environment blockers and continue M03 if toolchain remains unavailable |
| M03 | Native backup/import and local schema migration | Entire import validated before preview/confirmation; corrupt/old data preserved; snapshots/notes round trip; browser transfer only explicit |
| M04 | Native local authoring and immutable versions | 1–5 stable points; original locale; local/private drafts; existing snapshots unchanged |
| M05 | Native improvements and attributed derivatives | New derivative ID with original unit/version attribution; no fake public notifications |
| M06 | Native translation variant editor/review states | Original preserved; same unit/point identities; ko/en; no translation service |
| M07 | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| M09 | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limitations; pause only this project's automation when complete or all remaining work blocked |

M08 PWA is **superseded**, not completed. Do not create a website or web deployment. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided. Development dependency/framework selection is not a launch-policy decision.

## Remaining limitations / next action

Start with latest HEAD and toolchain availability, then attempt **A03** without installing/buying cloud services or collecting credentials. If the local Android toolchain remains absent, record the unchanged APK/device blocker and proceed to M03 native backup/import rather than claiming an APK. Local IDs are opaque device-only identifiers; the server must later issue/validate authoritative identities. AsyncStorage is unencrypted, device-scoped and not authentication; no backups yet. Source/bundle tests do not replace real-device persistence, back/keyboard/font/accessibility testing. Catalog contains only illustrative Seoul/Seongsu examples. Source manifests are not merged manifests; SDK default network permission and development tooling must be reviewed before release.

Keep all real server calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
