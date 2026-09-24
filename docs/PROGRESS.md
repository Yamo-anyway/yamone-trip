# Client development checkpoint

Read repository HEAD first; this document is the durable handoff across scheduled runs. Do not rely on scratch files from an earlier run. Work only on this project; no backend, real API connection, deployment or paid services.

## Current milestone

**M02 — v0.2.0: schedule editing implemented; browser verification pending.** Day/start/duration editing; manual movement and break estimates after each item; stable time-based presentation order; buffer-inclusive conflict warnings and same-day/calendar validation. Editing preserves original unit/version snapshots, record IDs, completion and notes. Legacy schema-v1 items without estimates are read as zero without a load-time rewrite. Server calls remain disabled.

This run verified all 24 starting files against latest GitHub main `4a447c2116101c253a12af0bc2a630f366fc0e29` before editing. M01 features remain: bilingual demo discovery/details, private local trips, manual checklists/notes, safe browser storage, and disabled API contract/adapter.

Verification on 2026-09-24: `npm test` **40/40 passed** in this run (domain, storage, API adapter, localhost static server; 12 new schedule tests). `npm run check` passed (14 JavaScript files, locale-key parity, fixture validation, source privacy/offline guards, handoff files). `npm run test:ui` was attempted and **blocked before browser launch**: Playwright is available but its Chromium headless-shell executable is absent. The earlier installer returned truncated/invalid archives, so this run did not repeat the failed download. The smoke script now contains 14 browser scenarios, including four new edit/validation/cancel/reload/reorder scenarios, but none of the browser interactions or screenshots are verified. No UI/visual pass is claimed. Retry in a supported working browser environment before release; never bypass network restrictions or repeatedly retry an unchanged failed download.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| M02 (implemented) | Schedule editing: start/day/reorder via time, explicit manual movement/break estimates | Domain/storage/locale checks passed; browser verification pending |
| M03 | Export/import backup and local schema migration | Validate entire import before change; preview + confirmation; preserve corrupt/old data; no secrets; round-trip tests |
| M04 | Local unit authoring and immutable version editing | 1–5 points; source language; drafts clearly local/private; old trip snapshots unchanged; no fake public publishing |
| M05 | Local improvement proposals and attributed derivatives | New derivative identity with source/version; proposals don't silently edit originals; no fake notifications |
| M06 | Translation variant editor/review states | Original preserved; same unit ID and point IDs; ko/en rendering; no live translation provider |
| M07 | API mock harness and repository boundary hardening | Auth/errors/revisions/idempotency/abort/offline tested; live API still disabled; contracts updated |
| M08 | PWA/offline client packaging | No backend; manifest and service worker update/cache tests; personal data not put in public/static caches; explain limitations |
| M09 | Accessibility, keyboard, responsive and data-loss regression pass | 320px/desktop ko/en; focus/contrast/form errors; unsaved-input safeguards; test report |
| M10 | Client handoff and release gates | Document what is complete, what needs server/product decisions, unresolved bugs; final tests; pause this automation |

Photo uploads are deferred; add only if metadata stripping/validation can be safely built and tested within the authorized client scope. Native wrapping, third-party maps, login selection and legal policy drafting require separate decisions rather than assumed defaults. Do not introduce dependencies merely to fill a scheduled run.

## Known limitations / next action

- Sample content only in Seoul/Seongsu; region selector is manually operated but currently has one seeded option.
- Schedule editor is implemented, but browser interactions/layout remain unverified. Estimates are manual, after the associated item, default zero; users must review them after reordering. Overlap warnings do not prevent saving; no optimized routes are claimed.
- localStorage is small and device-specific. Quota/corrupt/stale-tab writes are refused. There is no cross-device sync or backup yet.
- Notes are explicit-save; unsaved input protection is a later regression item. No real accounts or secure authentication.
- My units intentionally shows a forthcoming state until M04; no inert publish button.
- No service worker yet; no installability/offline claims.

Start the next run by checking whether browser validation is now available, then **M03: export/import backup and local schema migration**. Validate and preview the entire import before explicit confirmation; preserve existing data on rejection/failure. An unavailable browser does not authorize claiming UI tests passed; continue safe domain/client work with the limitation recorded. A reproducible application test failure takes precedence over features. Re-read current HEAD and preserve any intervening user changes. Each run must update version, changelog, this file and actual check results; commit through the authorized GitHub connection with a fast-forward update. Stop for protection/permission barriers. On backlog completion or when everything remaining requires user/backend authority, report once and pause only this project's task.
