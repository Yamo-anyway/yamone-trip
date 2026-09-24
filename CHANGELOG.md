# Changelog

## 0.2.0 — 2026-09-24

- M02: Korean/English schedule editing for day, start time, personal duration, and manual movement/break estimates. Time edits reorder presentation without silently shifting other items.
- Conflict detection reserves experience → movement → break, including midnight/real-calendar validation. No routing, GPS or actual movement data.
- Preserve item IDs, original version snapshots, private notes and completion records on schedule changes. Legacy v1 records without estimates remain readable (missing estimates mean zero); malformed values are refused.
- Added 12 domain/storage/locale regression tests and four pending browser scenarios for editing, validation, cancellation, reload, reordering and buffer conflicts. Updated proposed schedule DTO/API semantics; live API remains blocked.
- Validation: `npm test` 40/40 passed; `npm run check` passed (14 JavaScript files). `npm run test:ui` attempted but blocked before launch: required Chromium executable is absent. No repeated installer download attempted after the documented failure. Browser interactions/screenshots remain unverified.

## 0.1.0 — 2026-09-24

- Initial dependency-free, mobile-first Korean/English local client.
- Demo catalog, combined filters and original/translation view.
- Private local trips, unit-version snapshots, overlap warnings, checklist and notes.
- Storage validation and disabled future API adapter with proposed contract/DTOs.
- Node domain/storage/adapter tests and repeatable Chromium smoke script.
- No backend, live API calls, location functionality, publishing or deployment.
- Validation: 28 Node tests and static checks passed. Browser smoke/visual QA pending because the environment's Chromium download failed; no UI pass claimed.
