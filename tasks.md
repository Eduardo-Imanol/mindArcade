# tasks.md — topics-flashcards (APPROVED 2026-10-16 incl. images addendum — execution unblocked)

> Derived from `specs/spec-02-topics-flashcards.md`. Signed by Eduardo: `APPROVED spec-02 + tasks`.
> Previous increment archived at `specs/tasks-01-core-dashboard.md` (done).
> Roadmap of games: `specs/roadmap-games.md`.

## Dependency graph

```
T1-parser -------\
T2-registry ------\
T3-router --------> T4-catalog --> T5-hub(+imágenes) --> T6-topic-view --> T9-flashcards-ui --> T10-host-wiring --> T12-reuse --> T13-verify
T4b-idb-images ---> T5 & T7b
T7-srs-core ------> T9
T8-flash-logic --> T9
T7b-cardimage ---> T9
T7c-generator --> T11-content (user input) --> T5 (demo data) & T12
```

Core + contracts first (T1,T2,T3,T4b,T7), then views, then game UI, then wiring, then verify.

## Tasks

### T1 — Extend parser: `parseTopic` + Card normalization + `I:` token [depends: none]
- [x] Deliverable: `src/core/parser/parser.js` (+ tests) — `parseTopic(md)` → `{ topic:{id,title,description}, cards: Card[], errors[] }`; optional `| I:` token → `Card.image` (`emoji|url|asset`); `parseMarkdown` untouched/frozen
- Covers: AC-2, AC-6 (contract), AC-9 (token), AC-10 (input)
- Context needed: spec §4 content/image model + §6 fixtures A & C; existing parser
- Done when: fixture A → 3 cards + 1 error + topic meta; fixture C → emoji/url/undefined exact; legacy parser tests still green

### T2 — Game registry with reserved IDs [depends: none]
- [x] Deliverable: `src/games/registry.js` (+ test) — `listGames()`, `getGame(id)`; `flashcards` available with `load()`; 9 games registered as `soon`; kebab IDs per spec §4
- Covers: AC-4
- Context needed: spec §4 registry contract + roadmap table
- Done when: `getGame('flashcards').status==='available'`, `'memorama'` → `soon`, `'nope'` → null; catalog length 10

### T3 — Hash mini-router [depends: none]
- [x] Deliverable: `src/app/router.js` (+ test) — `parseHash`; routes `#/`, `#/tema/:id`, `#/tema/:id/juego/:gameId`; `useRoute()` hook for React; unknown → `notFound`
- Covers: AC-3 (edge), no-new-deps constraint
- Context needed: spec §4 routing (frozen routes)
- Done when: parse tests green incl. malformed hash; no dependency added to package.json

### T4 — Content catalog service (builtin + custom) [depends: T1]
- [x] Deliverable: `src/core/content/catalog.js` (+ test) — `slugify`, `buildCatalog`, custom-topic persistence (`sepect.topics.custom.v1`), dedupe with `-2`, corrupt-JSON fallback
- Covers: AC-1, AC-2
- Context needed: spec §4 persistence + §5 edge cases; existing store quota pattern
- Done when: builtin fixture + custom merge dedupes `funciones-en-programacion` → `-2`; reload deep-equal with mocked storage

### T4b — IndexedDB image store [depends: none]
- [x] Deliverable: `src/core/storage/images.js` (+ test) — blob put/get/delete in `sepect.images.v1`; `getObjectURL` lifecycle helper; quota/unavailable → `{ ok:false }` fallback (no crash)
- Covers: AC-11 (persistence path)
- Context needed: spec §4 custom image pipeline + §5 IndexedDB edges
- Done when: mocked IndexedDB save → reload → same key resolves; quota/unavailable path returns fallback; no deps added

### T5 — Topics hub view + create-topic modal (incl. per-card image slot) [depends: T3, T4, T4b]
- [x] Deliverable: `src/views/TopicsHub.jsx` + create-topic modal (`Modal.jsx` reuse): paste MD → parsed card list with per-card image controls (auto-suggested emoji, URL field, upload with preview → `images.js`); empty state; card count per topic; error count feedback
- Covers: AC-1, AC-2, AC-7, AC-11
- Context needed: spec §2 hub/create/image stories; components Button/Card/Modal; catalog + images APIs
- Done when: hub renders builtin+custom; paste fixture A → topic persists with 3 cards; emoji/URL/upload override survives reload; keyboard-only create works

### T6 — Topic view + game grid [depends: T2, T3, T4]
- [x] Deliverable: `src/views/TopicView.jsx` — topic header + registry grid; `soon` disabled + "Próximamente"; not-found fallback with link home
- Covers: AC-3
- Context needed: spec §3 AC-3 + registry contract
- Done when: `#/tema/<id>` shows 10 game tiles, only flashcards openable; `#/tema/nope` → fallback; no crash

### T7 — SRS core: orderDeck + applyGrade + srs persistence [depends: none]
- [x] Deliverable: `src/core/repetition/srs.js` (+ test) — `orderDeck(cards, srs, now)`, `applyGrade(srs, topicId, cardId, grade, now)` using existing `scheduleNext`; storage persistence `sepect.srs.v1` quota-safe
- Covers: AC-5
- Context needed: spec §4 persistence/session-order + §6 rows; existing `sm2.js` + `store.js` pattern
- Done when: unseen first / earliest due ordering with fixed `now`; persisted state deep-equal after reload; fail resets interval

### T7b — Image resolution + shared `CardImage` component [depends: T1, T4b]
- [x] Deliverable: `src/core/content/image.js` (pure `resolveCardImage` + emoji dictionary) + `src/components/CardImage.jsx` + tests (`src/core/content/image.test.js`, `src/components/CardImage.test.jsx`)
- Covers: AC-9, AC-11 (render path)
- Context needed: spec §4 image model + §6 rows; `tokens.css`; p5js skill rules (native Canvas, DPR ≤2, draw once, `prefers-reduced-motion`)
- Done when: precedence exact (override > `I:` > emoji > fallback); missing/broken → fallback tile with accessible `alt`; no deps added

### T7c — Deterministic card-image generator (zero deps) [depends: T1]
- [x] Deliverable: `scripts/generate-card-images.mjs` + `scripts/generate-card-images.test.mjs` — reads topic MD, writes one seeded SVG per card lacking an image to `src/content/assets/<topicId>/<cardId>.svg`; skips existing; `--force`; byte-deterministic
- Covers: AC-10
- Context needed: spec §4 builtin assets + §6 script row; fixture C
- Done when: fixture → N SVGs; re-run byte-identical; existing skipped; `--force` overwrites; no new deps

### T8 — Flashcards pure logic reducer [depends: T1]
- [x] Deliverable: `src/games/flashcards/flashcards.logic.js` (+ test) — flip / next / prev / grade actions → `{ index, flipped, correct, wrong, gained }` deterministic; 1-card deck safe
- Covers: AC-5, AC-6
- Context needed: spec §6 reducer row + §5 single-card edge
- Done when: full session sequence test green (flip → grade → advance → summary)

### T9 — Flashcards UI component (CardImage both sides) [depends: T2, T7b, T8]
- [x] Deliverable: `src/games/flashcards/Flashcards.jsx` + `index.jsx`; registry entry flipped to `available` with `load()`
- Covers: AC-5, AC-7, AC-9
- Context needed: frozen props contract `{ deck, onGrade, onExit }`; `CardImage`; tokens + Button/Card; reducer API
- Done when: front = `CardImage` + `front`, back = `back` + same image; flip via click/Space/Enter; nav; grades call `onGrade`; a11y test green at 360px; isolation test (no storage/parser/content/router imports)

### T10 — GameHost wiring: route → deck → SRS + XP + streak [depends: T7, T9]
- [x] Deliverable: `src/views/GameHost.jsx` — resolves route, builds deck (`orderDeck` + srs), passes frozen props; `onGrade` → `applyGrade` + `awardXP` + `recordStreak` + profile persist; return `{ gained, total }`; session summary + exit
- Covers: AC-5
- Context needed: spec §4 contract; `xp.js`, `store.js`, `srs.js` APIs
- Done when: grading in UI changes XP/SRS/profile and survives simulated reload; exit returns to topic

### T11 — First topic content + generated assets: `funciones-programacion` [depends: T4, T7c; blocked on user content]
- [x] Deliverable: `src/content/topics/funciones-programacion.md` authored from Eduardo's delivered material (format per roadmap, parsed errors = 0) + `node scripts/generate-card-images.mjs funciones-programacion` → 100% of cards with image source (`asset:`)
- Covers: AC-1, AC-6 (demo deck), AC-10
- Context needed: user-provided topic material (next message) + canonical format; generator script
- Done when: topic with ≥10 cards, 0 errors, visible in hub; every card resolves an image (asset/emoji/fallback) — 0 missing

### T12 — Reuse validation (2 decks + images + isolation) [depends: T9, T10]
- [x] Deliverable: tests proving same module plays programming deck (es) and language deck (es→en) fixture B; images render (asset/emoji/fallback) per deck; isolation scan test
- Covers: AC-6, AC-9
- Context needed: spec §6 fixtures + isolation rule
- Done when: both decks complete sessions with images rendered; isolation test fails if game imports core storage/parser/content/router

### T13 — Adversarial verify + DoD [depends: all]
- [x] Deliverable: full suite green, lint 0, independent verifier review, human diff review, MEMORY/FOCUS updated
- Covers: AC-8
- Context needed: `docs/testing.md`, `docs/security.md`
- Done when: `npm test` 100%; `npm run lint` 0; separate agent verifies; Eduardo approves diff

## Sizing / execution flow
- Scope: medium-large (16 atomic tasks, 1 vertical slice + framework + images)
- Mode: single-agent sequential (T1 || T2 || T3 || T4b || T7 || T8 parallelizable after none; T7c after T1)
- Parallelizable groups: T1, T2, T3, T4b, T7, T8 (independent); T11 preemptible by user content anytime after T4+T7c
- Estimate: T1 S, T2 S, T3 S, T4 M, T4b S, T5 M, T6 S, T7 M, T7b M, T7c M, T8 S, T9 M, T10 M, T11 S, T12 S, T13 S
- Out of scope respected: games 2–10 (`soon` only), no audio/TTS, no AI-raster images, no stats view, no deploy, no p5, no backend, no new deps

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-16 (incl. images addendum, same date)
- Delivery: 2026-10-17 — T1–T13 executed. `npm test` 85/85 (20 files), `npm run lint` 0 (src+scripts), `npm run build` OK (20/20 SVGs embedded). Independent verifier pass (2 rounds): AC-5/AC-9/AC-11 violations found and fixed (overrides now reach gameplay, XP by grade, fallback home link, alert-prone paths, lint scope); no material defects left. Pending: Eduardo diff review + manual a11y checklist (`docs/manual-a11y-checklist.md`).
