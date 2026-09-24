# Yamone Trip / 야모네 트립

작은 여행 경험을 골라 일정으로 만들고 직접 경험하는, 한국어·영어 모바일 웹 클라이언트입니다.

**v0.2.0 · Local demo. Backend, deployment and app-store release are not included.**

## Run locally

Requires Node.js 22 or later. No runtime packages, CDN assets or API keys are needed.

```sh
npm run dev
```

Open `http://127.0.0.1:4173`. Do not open index.html directly as a file; ES modules require a static server. The development server only serves files on localhost and is not a backend. The app uses `crypto.randomUUID`, which requires localhost or HTTPS.

```sh
npm test
npm run check
npm run test:ui
```

The first two checks use Node only. Browser smoke checks require Playwright and its Chromium browser already installed. In a normal developer environment, install them locally with `npm install --no-save --package-lock=false playwright` and `npx playwright install chromium`, then run `npm run test:ui`. The Codex runtime installation is also supported. Browser screenshots go to ignored `test-results/`; there is no CI deployment workflow.

Browser setup references: [Playwright library](https://playwright.dev/docs/library) and [browser installation](https://playwright.dev/docs/browsers). The initial development environment could not download a valid Chromium archive, so visual/browser checks are **pending**, not reported as passing.

## Implemented

- Korean/English UI, device-language default, saved explicit preference.
- Four **illustrative** units in manually selected Seoul/Seongsu; bilingual search, time/category/cost filters. The current catalog has one sample region only.
- Unit details, 1–5 experience points, demo original/translation switch, AI-draft labels.
- Private local trips, dates, daily schedule, immutable unit-version snapshots, overlap warnings, removal confirmation.
- Edit schedule day/start/duration, reorder by start time, and manually reserve movement/break estimates after each activity. Conflicts include these estimates; total time cannot cross midnight. Existing snapshots, notes and completion records are preserved.
- Self-reported completion checklist and private notes, persisted in browser storage.
- Disabled future HTTP adapter, DTOs and a proposed API contract. The running UI never calls it; CSP blocks network connections.
- Validation for corrupt storage, quota errors, stale tabs, date ranges and point IDs.

## Deliberate limitations

No accounts, public publishing, real AI generation/translation, map integration, device location, payments, photos, offline installation or native app packaging. Authoring/derivation are upcoming milestones, not functioning buttons disguised as features. Movement/break estimates default to zero and must be entered manually; no route optimization is performed. Review them after reordering. Browser data may be cleared; local mode is not secure multi-user authentication. Until backup/restore is implemented, do not rely on this demo for irreplaceable records. If another tab saved, reload before editing; stale writes are refused.

The four units and authors are demo fixtures, **not verified real travelers or current prices/opening hours**. A sprout/first-hand label in a fixture illustrates the product design only. No completion sends data to anyone or changes public reputation.

## Continue development

Read [AGENTS.md](AGENTS.md), [product decisions](docs/PRODUCT.md), [progress/backlog](docs/PROGRESS.md) and [API contract](docs/API_CONTRACT.md). Keep changes in this repository; preserve user work and only fast-forward commits. Do not implement or connect a server without new user direction.
