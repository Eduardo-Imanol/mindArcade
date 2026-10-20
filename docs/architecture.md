# Architecture (L0 detail)

> Read on demand. Source of truth for layering is `specs/spec-*.md`.
> `spec-12` (retouch-learning-dashboard) is a **draft**: its modules are marked
> `(spec-12)` and do not exist until the spec is signed and implemented.

## Layers
- `src/core/engine/` — single rAF loop, delta time, states: init → playing → paused → over.
  Auto-pause on `visibilitychange=hidden`. No more than one loop per session.
- `src/core/storage/` — central reactive store, persistence in localStorage
  (profile/XP/streak/history), quota-safe. No network for progress. History is capped
  (currently 1000; spec-12 raises it to 5000 and stores `xp` per attempt).
- `src/core/repetition/` — simplified SM-2 (`reps`, `interval`, `ease`, `nextReview`)
  + per-question Elo. Pure functions, fully tested.
  - `(spec-12)` `learning.js` defines `LEARNED_REPS = 3` and `new|learning|learned`.
  - `(spec-12)` `selectStudyCards.js` supersedes `selectDueCards`: unlearned first,
    then only learned cards with `nextReview <= now`.
- `src/core/parser/` — Markdown/JSON → validated cards. Never throws on bad input;
  returns `{ questions, errors }`. `(spec-12)` keeps the full topic description.
- `src/core/content/` — built-in + custom topic catalog.
  - `(spec-12)` `topicMeta.js` persists `addedAt` in `sepect.topics.meta.v1`.
  - `(spec-12)` `cover.js` exposes `topicCoverCard` (first card with an explicit image).
- `src/core/metrics/` `(spec-12)` — `getTopicMetrics`, `getGlobalMetrics`,
  `getActivity`; derived from catalog + SRS + history, UTC day keys, no side effects.
- `src/games/` — isolated mini-games. `registry.js` is the only list of games;
  `(spec-12)` each entry is a frozen `GameDefinition`
  (`id, title, description?, art?, status, minCards, minTopics?, minCardsPerTopic?, load`).
  Games receive `{ deck, selectCards, groups?, anchorTopicId?, topic?, onGrade, onExit }`
  and never know the topic domain. Games never touch storage.
- `src/components/` — neon Button/Card Modal (Tailwind + tokens.css).
- `src/views/` — `TopicsHub` (`#/`), `TopicView` (`#/tema/:id`), `GameHost`
  (`#/tema/:id/juego/:gameId`), `Dashboard` (`#/progreso`, spec-12), `NotFound`.
  Mobile-first touch targets ≥44px.

## Invariants
- Games never touch storage directly; they return results, core persists.
- Parser output is the only card source games accept.
- One game loop per session; pause on hidden tab.
- Local-first: no network calls for progress/XP/history.
- `(spec-12)` Study selection only offers unlearned cards plus learned cards whose
  `nextReview` is due; never learned cards that are not due.
- `(spec-12)` Metrics are derived data; they are not persisted separately.
- 60fps budget: animate only transform/opacity; canvas DPR-capped at 2.
