# Future API contract — proposal v0.5

This is a handoff proposal, not a deployed API or a backend implementation. All UI data currently comes from local fixtures/storage. `src/api.js` is disabled by default and is not imported by the UI. `src/contracts.d.ts` defines matching data shapes without requiring a TypeScript build.

## Native boundary — v0.8.0

The primary client is now the Android native app in `native/`; the web UI is a retained reference only. Native screens do not import `src/api.js` or any remote transport. `NativeRepository` uses an injected asynchronous key/value interface (`getItem`, `setItem`) with one application-scoped writer, validated reads and serialized transactions. Preferences must preserve all trips, snapshots and records. Failed/ambiguous writes require reload; parse/schema errors must never become empty-state writes. This is local sequencing, NOT an atomic multi-process or server revision protocol.

The app uses `yamone-trip:native:state:v1`, distinct from browser storage. No automatic browser-data migration is performed. Backup import validates all content and presents an explicit preview/confirmation. AsyncStorage is unencrypted and must not contain credentials. The Android app configuration disables OS backup, but the merged release manifest and actual device behavior still require verification before any privacy/release claim. Browser CSP guards only the legacy browser reference; it is not the native network boundary. Do not add an endpoint, login, live translator, background synchronization or OTA update service during this migration.

### M04 local authoring boundary

Local authoring creates private device-only drafts and immutable `UnitVersion` records. A new unit starts with one original locale and 1–5 experience points. Point IDs are generated once and remain stable when text changes or a later version is created; newly added points receive new IDs. The original locale cannot change across versions. Saving a version removes its draft, appends the next sequential version and never rewrites a version already embedded in a trip item.

`sourceType: user_authored`, `author: local-device`, local IDs, seed growth and the UI's “unverified/local” labels are client placeholders only. They are not server authorship, ownership, publication, factual review, attendance or growth evidence. The local editor does not create translations or derivatives. A future server must issue authoritative identities, authorize authorship, define draft/revision conflicts and decide how local histories reconcile without trusting client-supplied author or growth fields.

The proposed future create/version payload may reuse `UnitVersion` content fields but must exclude client authority fields (`author`, `growth`, server version numbers). It must carry an idempotency key and an explicit base version/revision for later versions. Publication is a separate future decision; a local save must never be reported as public.

### M05 improvement and derivative boundary

An improvement proposal is a separate private local object with its own opaque ID, `local_only` status, suggestion text and an exact source reference (`unitId`, `versionId`, source version number, original locale and display title). Saving or deleting it never edits the referenced unit/version. The current client does not submit it, notify an author or claim that anyone reviewed it. A future submission endpoint must authorize the target, issue authoritative identity/revision data and return a real delivery state before the UI may claim it was sent.

An attributed derivative creates a new local unit ID, new version ID and new experience-point IDs. Its immutable version stores the exact immediate source reference above. Later versions of that derivative must keep the same reference. The source can be a demo or local version; it need not remain mutable or available for the attribution to display. This local reference is not proof of ownership or permission, and future rights/takedown rules may require redaction.

A translation must never populate `derivedFrom`: it keeps the original unit/version identity and maps the same point IDs. No improvement or derivative endpoint is active. Proposed future writes require authentication, ownership/permission checks, idempotency and revision conflict handling; client-supplied author, growth and delivery status are never authoritative.

### M06 local translation boundary

`TranslationVariant` is keyed by exact `unitId`, `versionId` and target `locale`. It also records the original locale and repeats every source experience-point ID in the same order. Title, description, public place guidance, tip and all 1–5 experience points are required to remain attached to that immutable version; a translation does not change the unit/version identity, create `derivedFrom`, alter an itinerary snapshot or carry private notes.

The active editor creates only `method: manual` translations with `draft` or `user_reviewed` status and stores them on this device. “User reviewed” means only that the local user marked the text; it is not administrator verification, factual validation or publication. The model reserves `method: machine` with `machine_unreviewed`, and `needs_review` for a future backend/import workflow. Machine content must remain visibly labeled and may never be silently upgraded to reviewed.

Original content is always preserved and available through an original/translation toggle. Translation lookup is exact-version: changing the source version does not copy an earlier translation forward. A future server may return or accept the matching `TranslationVariant` shape, but it must issue authoritative revisions, check write permission, require idempotency/concurrency controls and mark a translation `needs_review` when the source revision changes. It must not infer a translation request from private trips, schedules, completion records or personal notes. There is no endpoint, translator SDK or live call in this client.

### M03 backup/import boundary

Backup is a local user-controlled transfer, not an API endpoint or synchronization protocol. Export writes a versioned `yamone-trip-local-backup` JSON file only after the user chooses a directory in the Android system picker. It includes the complete local schema-v1 state, including private trip dates, unit-version snapshots, experience records and personal notes, and is explicitly labeled unencrypted. The app does not upload it, silently scan storage, automatically migrate browser data or receive files in the background.

Import opens the system file picker after an explicit tap, rejects files over 10 MB, parses and canonicalizes known schema-v1 fields, then validates every trip/item/snapshot/record relationship before producing an in-memory, count-only preview. Unknown fields are not persisted. Current app data is replaced only after a second explicit confirmation through `NativeRepository.transact`, so stale or ambiguous writes fail closed. Cancelled, malformed, unsupported or future-version files never trigger a write and the selected source file is not modified or deleted. A raw schema-v1 file is accepted only through this same explicit preview/confirmation path for earlier local/browser transfer.

This backup format is device-local and not the future server DTO. Local opaque IDs remain non-authoritative and may require an explicit reconciliation design when accounts/sync exist. The server must never accept a backup file as proof of authorship, publication, ownership, attendance or growth.

### A02 local mutation boundary

The native UI now uses pure local actions matching the future endpoint intent: create a private trip, add an exact unit-version snapshot, edit only personal schedule fields, and store a self-reported experience record. Local opaque IDs are generated without browser crypto globals and are not server identities. The server must later issue/validate authoritative IDs and ownership. Local actions validate the entire resulting state before AsyncStorage writes. Schedule edits preserve item/unit/version identity and snapshots; record writes preserve private notes and never assert arrival or attendance. UI forms retain entered values on validation/storage failure and require confirmation before discarding changed input.

This does not activate any endpoint below. There is still no authentication, synchronization, publication, idempotency guarantee across processes, remote revision or server-side authorization. The local repository serializes one running app instance only.

## Common conventions

- Version prefix `/v1`; HTTPS origin configured only after the user provides an approved backend/auth scheme. Do not put credentials in git or localStorage.
- The prepared adapter accepts an in-memory token callback as a placeholder. This does **not** choose final OAuth/cookie/login policy. Server authentication, ownership authorization, CORS and CSRF design remain backend decisions.
- JSON responses; list envelope `{items: [], nextCursor: null}`. Errors `{error: {code, message, requestId?}}`. Do not display raw server exception contents.
- API must authorize every trip/record operation against the authenticated owner. Client-side validation is not a security boundary. Never trust a submitted author ID, growth value or visit verification.
- Writes use caller-generated `Idempotency-Key`; backend deduplicates within a documented retention period (to be decided). No implicit mutation retries. Concurrency uses ETag/If-Match or a server revision (to be agreed), with 409/412 reconciliation.
- `YYYY-MM-DD` calendar dates and `HH:mm` destination schedule times; do not derive device location or timezone. Trip destination timezone selection is a future explicit field/decision.
- Prices are numeric amounts + ISO currency; do not mix currencies in totals without explicit conversion/source policy.
- No latitude/longitude, current origin, GPS, IP-derived area or movement-history fields. Manual region identifiers and public destination descriptions only.

## Initial endpoint proposal

| Method / path | Request | Response / rule |
| --- | --- | --- |
| GET `/v1/units` | query: country, city, district, q, locale (ko/en), maxMinutes, category, maxCost, currency, cursor | `Page<UnitVersion>`; public content only; translation fallback clearly labeled |
| GET `/v1/units/{unitId}/versions/{versionId}` | explicit identifiers | Exact immutable `UnitVersion`; redaction/takedown rules may override historic availability |
| POST `/v1/trips` | name, startDate, endDate, region | 201 `Trip`, private by default |
| GET `/v1/trips` | cursor | Owner-only `Page<Trip>` |
| POST `/v1/trips/{tripId}/items` | date, startTime, unitId, unitVersionId | 201 `ScheduleItem`; backend resolves authoritative version snapshot; never trust client snapshot as published content |
| PATCH `/v1/trips/{tripId}/items/{itemId}` | `ScheduleItemPatch` + revision | Updated item; reject stale update and out-of-range/cross-midnight schedule including movement/break buffers |
| DELETE `/v1/trips/{tripId}/items/{itemId}` | revision | 204; handle associated private records consistently |
| PUT `/v1/trips/{tripId}/items/{itemId}/record` | checkedIds, note, skipped flag, revision | `ExperienceRecord`; server derives status; 1–5 matching point IDs; self-reported only |

Example add-item request (client does not make this call today):

```json
{
  "date": "2026-10-01",
  "startTime": "09:00",
  "unitId": "forest-walk",
  "unitVersionId": "forest-walk-v1"
}
```

Expected error families: 400/422 validation, 401 reauthenticate, 403 owner/permission mismatch, 404 unavailable, 409/412 concurrency, 429 rate limit, 5xx retryable read failure. Preserve unsaved client input on failures; do not claim that a local draft has been publicly saved.

## Schedule editing semantics (M02)

`ScheduleItemPatch` permits only `date`, `startTime`, `durationMinutes`, `movementMinutes` and `breakMinutes`. These are personal schedule overrides, not unit-version edits. Reject unknown fields; the original snapshot, item identity, version identity and associated experience record remain unchanged. Changing the day/time must not create a new completion or growth event.

- Date must be a real calendar day inside the trip, including leap-year validation.
- Start is `00:00`–`23:59`; duration is a positive integer, movement/break are nonnegative integers, each at most 1440 minutes. The total must end at or before `24:00` on that day. This is a same-day client constraint, not a service age/country/growth policy.
- Reserve time in the order **experience → manually estimated movement → manually estimated break**. These estimates belong to the preceding item (including the last item of a day); they are not a calculated route, actual movement history, or a link to another place. Users must review estimates when reordering.
- Sort presentation by date then start time, keeping insertion order on a tie. Do not shift other items automatically. An overlap warning covers the half-open interval `[start, start + duration + movement + break)`; adjacent endpoints do not conflict. Conflicts warn but do not block saving.
- For existing schema-v1 local data, missing movement/break fields mean zero without rewriting on load. Explicit `null`, strings, negatives, fractions and overrun values are invalid. No schema migration or actual endpoint call is introduced in M02.
- Existing server revision/idempotency/owner checks still apply when the backend is eventually connected. The current UI only writes validated browser storage; stale-tab/quota errors leave the edit dialog open with its input intact.

## Later content endpoints — design slots, not ready implementations

Translation storage and review-state semantics are defined in M06 above, but no endpoint is active. A future translation request/read API may handle public unit text only after authentication, authorization, revision and privacy decisions are agreed. It must exclude private trip records, schedules, personal notes and account data by default.

Growth promotion must be computed by the server from authorized, abuse-resistant events. Do not trust client completion as proof of attendance; no thresholds beyond confirmed product rules may be invented. Rights/privacy removals must propagate to snapshots and caches as appropriate, despite ordinary version immutability.

## Connection checklist (requires user/backend decisions)

1. Agree base URL, authentication, owner checks, revision/idempotency rules and schema compatibility.
2. Add separate remote repository implementation behind the same client domain functions; keep explicit local/demo mode.
3. Use mock responses to test timeout/abort/401/403/409/429/5xx, interrupted writes, no silent duplicate submissions.
4. Review consent, SDK traffic, privacy/retention and redaction flows; no claim that disabling GPS solves every legal obligation.
5. Only then opt in to the real adapter and narrowly allow the approved origin in CSP `connect-src`; never loosen CSP globally.
