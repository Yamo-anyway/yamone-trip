# Client development checkpoint

Read latest repository HEAD first; it is the durable source of truth. Work only in Yamo-anyway/yamone-trip. No backend, live API, deployment, paid service, store submission or subagents.

## Priority correction: app, not web

After M02 the user explicitly corrected the website direction: **build an app**. The handoff targets Android and an installable APK. v0.3.0 starts a native React Native/Expo client, not a WebView. The old web implementation and M01/M02 tests remain intact for reference. Do not continue web feature work or the old M08 PWA plan. Native development takes precedence over M03.

## Current milestone

**A01 — v0.3.0: native app foundation implemented; APK/device validation pending.**

- Native application entry, safe-area layout, navigation/back handling, manual area selection, bilingual demo search/details, explicit source/version/translation labels and original toggle.
- Native language settings use device language only for UI, never for region. Local preference changes use AsyncStorage through one serialized repository. Corrupt/future schema, stale writes and failed/ambiguous persistence block writes until reload; no reset/erase fallback. Preserve full existing state, snapshots and private records.
- Separate native storage namespace. No automatic browser migration, no account/publication claims. My trips/My units clearly state the migration/features still pending; no fake add/save/publish action.
- Expo SDK 55 dependencies pinned with package-lock; Android development identifier only (`com.yamone.trip.dev`). Location, camera/media/audio, advertising ID and unnecessary overlay/vibration permissions have removal directives. OS backup and OTA updates disabled in app config. No remote API or photo module connected.
- All 25 starting repository files were SHA-verified against main `13a8fa8f59726834539799b39ad55c8a4a2c7237` before edits. No old browser source or user data removed. Shared JSON DTO cloning no longer depends on `structuredClone`; explicit regression coverage runs with that global absent.

## Validation in this run — 2026-09-24

- `npm test`: **51/51 passed**, including 11 new native repository/portability tests. Tests use a mocked disk, not an Android device.
- `npm run check`: passed; existing source checks plus native JSX parse, ko/en key parity, version/config/privacy guards. This is not a UI test.
- `npm run bundle:android`: passed, Metro/Hermes Android bundle generated (595 modules). Bundle export is NOT an APK.
- `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo install --check`: matched the installed SDK's bundled dependency table; the CLI warns that offline validation is limited. Initial online metadata lookup timed out. Direct npm installation succeeded; no network bypass was used.
- `CI=1 EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo prebuild --platform android --no-install`: passed. Generated Android **source** manifest inspected for backup/update settings and permission removal directives. This is not a Gradle merged/release manifest. Generated project, signing material and output are ignored, not committed.
- `npm run test:ui`: attempted; blocked before launch by absent Chromium headless-shell. Earlier failed browser download was not repeated. This script tests the retained web reference, not native screens.
- No JDK compiler (`javac`), Android SDK, adb, Gradle installation or emulator available. No APK build, install, runtime screenshots or native interaction pass is claimed. Do not use a web preview as substitute evidence.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| A01 (implemented) | Native discovery/settings and async storage boundary | Node/static/bundle checks passed; APK/UI not yet verified |
| **A02 (next)** | Native private trip creation, schedule edit, checklist/notes | Reuse M01/M02 validation; snapshots/IDs preserved; native-compatible cloning and ID generation (do not assume browser globals); explicit saves/errors; unsaved input protection; ko/en |
| A03 | Local standalone Android APK build and device smoke | Toolchain availability check first; offline cold launch, restart persistence, back/keyboard/font/safe areas; inspect merged manifest/traffic; no cloud build/account/signing secrets without authority. Record environment blockers and continue independent client tasks if possible |
| M03 | Native backup/import and local schema migration | Entire import validated before preview/confirmation; corrupt/old data preserved; snapshots/notes round trip; browser transfer only explicit |
| M04 | Native local authoring and immutable versions | 1–5 stable points; original locale; local/private drafts; existing snapshots unchanged |
| M05 | Native improvements and attributed derivatives | New derivative ID with original unit/version attribution; no fake public notifications |
| M06 | Native translation variant editor/review states | Original preserved; same unit/point identities; ko/en; no translation service |
| M07 | API mock harness and repository boundaries | Auth/error/revision/idempotency/abort mocks; real calls disabled |
| M09 | Native accessibility and data-loss regression pass | Small screens, ko/en, font scaling, TalkBack/back/keyboard, failed/unsaved writes; device evidence when available |
| M10 | Client handoff/release gates | Final tests; clear server/product/SDK/signing limitations; pause only this project's automation when complete or all remaining work blocked |

M08 PWA is **superseded**, not completed. Do not create a website or web deployment. iOS, final package/signing/distribution, login provider, release countries, minimum age, map provider, growth thresholds and legal policy remain undecided. Development dependency/framework selection is not a launch-policy decision.

## Remaining limitations / next action

Start with latest HEAD and toolchain availability, then implement **A02**. Shared domain cloning now uses JSON DTO copies and is tested without `structuredClone`. Do not assume `crypto.randomUUID`, `window`, DOM or localStorage exists on native; choose/test native-compatible ID generation when connecting trip creation. AsyncStorage is unencrypted, device-scoped and not authentication; no backups yet. UI/settings source and bundle checks do not replace real-device persistence or accessibility validation. Catalog contains only illustrative Seoul/Seongsu examples. Source manifests are not merged manifests; SDK default network permission and development tooling must be reviewed before release.

Keep all real server calls disabled. Photo upload remains prohibited until metadata stripping and tests are complete. Fix reproducible defects before features. Each run must update version/changelog/this file with actual results, re-read HEAD and commit using base tree/parent plus fast-forward only. Pause on permission/reconnection/protection barriers. Do not modify other project automations.
