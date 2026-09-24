# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in Yamo-anyway/yamone-trip. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The handoff targets Android and an installable APK. v0.3.0 starts a native React Native/Expo client, not a WebView. The old web implementation and M01/M02 tests remain intact for reference. Do not continue web feature work or the old M08 PWA plan. All remaining milestones, including M03 backup/import, apply to the native app.

## Current milestone

**M03 — v0.5.0: native local backup/import and schema-v1 transfer implemented; APK/device validation pending.**

- A01 remains: native safe-area navigation, manual area selection, bilingual demo discovery/details, source/version/translation labels, original toggle and language settings.
- A02 remains: private trip creation, exact unit-version scheduling, personal schedule editing and self-reported 1–5 point checks/private notes with explicit save/discard protection.
- Export uses the Android system directory picker and writes backup format v1 only after a user tap. It contains the entire local state, including sensitive exact schedules and notes, and is labeled unencrypted. No upload, background share, broad storage permission or server call exists.
- Import uses the Android system file picker, enforces a 10 MB limit, canonicalizes known fields and validates the whole state graph before a count-only preview. A second destructive confirmation is required before repository replacement. Cancelled/corrupt/unsupported/future files leave current storage and the selected file unchanged.
- Unit snapshots, source/translation text, movement/break estimates, private notes and records round trip. Raw schema-v1 transfer is explicit; browser data is never silently discovered, imported or erased. Unknown fields are dropped before persistence.
- Tightened unit snapshot validation so unsupported transport values cannot enter storage through a backup or normal load.
- Expo SDK 55 filesystem is pinned from the SDK-bundled package. Location, media/camera/audio, advertising ID and unnecessary overlay/vibration permissions remain removed in source config. OS backup and OTA updates stay disabled. No remote API or photo module is connected.
- All 37 repository blobs were SHA-verified against latest main `867e3a268ecb14b3215090f61f239f606a0fec37` before edits. No web reference or user data was removed.

## Validation in this run — 2026-09-25

- `npm test`: **68/68 passed** in this run. Eight new tests cover exact backup round trip, versioned envelope, legacy raw transfer, unknown-field removal, corrupt/inconsistent data, old/future versions, UTF-8/size limits and metadata validation. Storage remains mocked; no device file picker is simulated.
- `npm run check`: passed in this run; 18 JavaScript files parse, ko/en keys match, v0.5.0/code 5 config and privacy/network/browser-global guards passed. This is not a native interaction test.
- `npm run bundle:android`: passed in this run, Metro/Hermes Android bundle generated (610 modules). Bundle export is NOT an APK.
- Offline Expo Android source prebuild passed. Generated Gradle config shows version 0.5.0/code 5; source manifest keeps backup disabled and location/media removal directives. Expo's source manifest still requests `INTERNET` for development/runtime infrastructure; only a compiled merged release manifest and traffic test can prove final behavior.
- `npm run test:ui`: attempted and blocked before launch by absent Chromium headless-shell. It tests only the retained web reference, not native backup screens.
- Official Expo SDK 55 file-system guidance was checked. Adding separate document-picker/sharing packages failed with an HTTP proxy timeout; the implementation instead pins Expo's already bundled `expo-file-system` 55.0.26 and uses its Android system file/directory pickers without an external share flow.
- No JDK compiler (`javac`), Android SDK, adb, Gradle installation or emulator is available. No APK build, merged manifest, install, screenshot, native file-picker behavior or device interaction pass is claimed.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| A01 (implemented) | Native discovery/settings and async storage boundary | Node/static/bundle checks passed; APK/UI not yet verified |
| A02 (implemented) | Native private trip creation, schedule edit, checklist/notes | Snapshots/IDs/records preserved; explicit save/errors/discard protection; ko/en source and tests passed |
| **A03 (blocked locally)** | Local standalone Android APK build and device smoke | Toolchain availability check first; offline cold launch, restart persistence, back/keyboard/font/safe areas; inspect merged manifest/traffic; no cloud build/account/signing secrets without authority. Continue independent client work if the toolchain remains unavailable |
| M03 (implemented) | Native backup/import and local schema migration | Entire import validated before preview/confirmation; corrupt/old data preserved; snapshots/notes round trip; browser transfer only explicit |
| M04 | Native local authoring and immutable versions | 1–5 stable points; original locale; local/private drafts; existing snapshots unchanged |
| M05 | Native improvements and attributed derivatives | New derivative ID with original unit/version attribution; no fake public notifications |
| M06 | Native translation variant editor/review states | Original preserved; same unit/point identities; ko/en; no translation service |
| M07 | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| M09 | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limitations; pause only this project's automation when complete or all remaining work blocked |

M08 PWA is **superseded**, not completed. Do not create a website or web deployment. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided. Development dependency/framework selection is not a launch-policy decision.

## Remaining limitations / next action

Start with latest HEAD and toolchain availability, then attempt **A03** without installing/buying cloud services or collecting credentials. If the local Android toolchain remains absent, retain that blocker and proceed to **M04 native local authoring and immutable versions**. Local IDs are opaque device-only identifiers; the server must later issue/validate authoritative identities. AsyncStorage and exported backups are unencrypted, device-scoped and not authentication/sync. Source/bundle tests do not replace real-device persistence, file-picker, back/keyboard/font/accessibility testing. Catalog contains only illustrative Seoul/Seongsu examples. Source manifests are not merged manifests; SDK default network permission and development tooling must be reviewed before release.

Keep all real server calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
