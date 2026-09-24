# Client development checkpoint

Read repository HEAD first; this document is the durable handoff across scheduled runs. Do not rely on scratch files from an earlier run. Work only on this project; no backend, real API connection, deployment or paid services.

## Current milestone

**M01 — v0.1.0: initial local client.** Korean/English shell; four clearly labeled demo units; manual sample region; search/filter; original toggle; private trip dates/daily items with snapshots; overlap warning; manual checklist and private note; safe browser storage; disabled API adapter and proposed DTO/endpoint contract.

Verification on 2026-09-24: `npm test` **28/28 passed** (domain, storage, API adapter, localhost static server). `npm run check` passed (13 JavaScript files, locale-key parity, fixture validation, source privacy/offline guards, handoff files). `npm run test:ui` was **blocked before browser launch**: Chromium is absent, and the official Playwright installer returned truncated/invalid archives. The smoke script is present but its 10 browser scenarios and visual screenshots are NOT verified. No browser pass or visual QA is claimed. Retry in a working supported browser environment before treating the UI as release-ready; do not bypass network restrictions or repeatedly retry an unchanged failed download.

## Next bounded milestones (one per run)

| Order | Work | Acceptance |
| --- | --- | --- |
| M02 | Schedule editing: start/day/reorder via time, explicit manual movement/break estimates | No automatic routing; conflicts include buffers; safe calendar validation; bilingual tests |
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
- No schedule-edit UI yet. For now remove/re-add to change time; warn about overlaps, never claim optimized routes.
- localStorage is small and device-specific. Quota/corrupt/stale-tab writes are refused. There is no cross-device sync or backup yet.
- Notes are explicit-save; unsaved input protection is a later regression item. No real accounts or secure authentication.
- My units intentionally shows a forthcoming state until M04; no inert publish button.
- No service worker yet; no installability/offline claims.

Start the next run by checking whether browser validation is now available, then **M02**. An unavailable browser does not authorize claiming UI tests passed; continue safe domain/client work with the limitation recorded. A reproducible application test failure takes precedence over features. Re-read current HEAD and preserve any intervening user changes. Each run must update version, changelog, this file and actual check results; commit through the authorized GitHub connection with a fast-forward update. Stop for protection/permission barriers. On backlog completion or when everything remaining requires user/backend authority, report once and pause only this project's task.
