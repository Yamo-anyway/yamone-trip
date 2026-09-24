# Yamone Trip development rules

Work only in Yamo-anyway/yamone-trip. Read docs/PRODUCT.md, docs/PROGRESS.md and docs/API_CONTRACT.md first. Repository HEAD is the source of truth; scratch may disappear between runs.

## User-approved constraints

- The user corrected the web implementation on 2026-09-24: build an app, not a website. Native Android/APK development now takes precedence; read the A-series migration milestones in PROGRESS. Preserve the old web reference, but do not expand it or implement the superseded PWA milestone. React Native screens must not be replaced by a WebView.
- Client development only. Do not implement/deploy a backend, provision services, connect a real API, add credentials, send email, buy services or submit to an app store.
- Korean and English UI. Other source-content languages may be represented but adding another UI language is out of scope.
- No device location permissions, geolocation APIs, current-location lookup, tracking, arrival detection, GPS completion or IP-to-location inference. Region is selected manually. Public place information is not permission to collect a person's whereabouts.
- No photo upload until a metadata-stripping pipeline and tests exist. No analytics, ad SDK or tracking integrations.
- Trips, notes and completion records default private. Local guest data is NOT a secure server account or authentication.
- 1–5 stable-ID experience points per unit version. A translation is NOT a derived unit. A scheduled item snapshots a published version; edits to the source must not silently change the trip.
- Seed -> sprout when the creator OR another user completes. Further growth requires other users' reuse/completions, never the creator's own repeats. Do not invent thresholds, server verification or trust badges.
- Preserve existing work, versions and data. Do not force-push, bypass protected branches, silently auto-merge PRs, or erase user data. Ask when permission or an irreversible/missing product decision blocks work.
- Only this project's automation may be changed. Do not resume or edit other project automations.

## Delivery process

Finish one bounded milestone per run; do not invent work after the client backlog is complete. Update version, docs/PROGRESS.md, CHANGELOG.md and current validation results. Run npm test and npm run check; UI smoke tests when browser tools are available. Report what was really run, not previous test counts. Use official docs when introducing external libraries.

Publish code through the authorized GitHub connection. Re-read HEAD before updating the ref, use a parent/base tree and fast-forward only. On conflicts, reconcile or ask; never drop another commit. If read/write access needs reconnection or approval, stop and ask. No deployment; the local static preview server is only a developer tool.

On completion or when all remaining work is blocked by user/backend decisions, send one short Korean report and pause this project's automation. Avoid repeated no-change reports. Do not spawn subagents unless the user separately authorizes delegation.
