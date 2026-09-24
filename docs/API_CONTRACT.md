# Future API contract — proposal v0.2

This is a handoff proposal, not a deployed API or a backend implementation. All UI data currently comes from local fixtures/storage. `src/api.js` is disabled by default and is not imported by the UI. `src/contracts.d.ts` defines matching data shapes without requiring a TypeScript build.

## Native boundary — v0.4.0

The primary client is now the Android native app in `native/`; the web UI is a retained reference only. Native screens do not import `src/api.js` or any remote transport. `NativeRepository` uses an injected asynchronous key/value interface (`getItem`, `setItem`) with one application-scoped writer, validated reads and serialized transactions. Preferences must preserve all trips, snapshots and records. Failed/ambiguous writes require reload; parse/schema errors must never become empty-state writes. This is local sequencing, NOT an atomic multi-process or server revision protocol.

The app uses `yamone-trip:native:state:v1`, distinct from browser storage. No automatic browser-data migration is performed. Future backup import must validate all content and present an explicit preview/confirmation. AsyncStorage is unencrypted and must not contain credentials. The Android app configuration disables OS backup, but the merged release manifest and actual device behavior still require verification before any privacy/release claim. Browser CSP guards only the legacy browser reference; it is not the native network boundary. Do not add an endpoint, login, live translator, background synchronization or OTA update service during this migration.

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

Author draft/create/edit version, improvement proposal, attributed derivative, and translation request/read will be specified with those client milestones. A derivative gets a new unit ID and explicit source unit/version attribution. A translation shares the original unit/version and maps stable point IDs; it never becomes a new derivative. Preserve original-language text. Machine translation must be labeled and have an original toggle. Only public unit text should enter translation by default; exclude private trip records and account data.

Growth promotion must be computed by the server from authorized, abuse-resistant events. Do not trust client completion as proof of attendance; no thresholds beyond confirmed product rules may be invented. Rights/privacy removals must propagate to snapshots and caches as appropriate, despite ordinary version immutability.

## Connection checklist (requires user/backend decisions)

1. Agree base URL, authentication, owner checks, revision/idempotency rules and schema compatibility.
2. Add separate remote repository implementation behind the same client domain functions; keep explicit local/demo mode.
3. Use mock responses to test timeout/abort/401/403/409/429/5xx, interrupted writes, no silent duplicate submissions.
4. Review consent, SDK traffic, privacy/retention and redaction flows; no claim that disabling GPS solves every legal obligation.
5. Only then opt in to the real adapter and narrowly allow the approved origin in CSP `connect-src`; never loosen CSP globally.
