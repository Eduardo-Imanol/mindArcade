# Architecture (L0 detail)

> Read on demand. Source of truth for layering is `specs/spec-*.md`.
> `spec-12` (retouch-learning-dashboard) is implemented (T1–T11) and pending the
> human diff/spec sign-off; its modules, views and route are live.

## Layers
- `src/core/engine/` — single rAF loop, delta time, states: init → playing → paused → over.
  Auto-pause on `visibilitychange=hidden`. No more than one loop per session.
- `src/core/storage/` — central reactive store, persistence in localStorage
  (profile/XP/streak/history), quota-safe. No network for progress. History is capped
  at 5000; each attempt stores `{ topicId, cardId, grade, xp, at }`.
- `src/core/repetition/` — simplified SM-2 (`reps`, `interval`, `ease`, `nextReview`)
  + per-question Elo. Pure functions, fully tested.
  - `learning.js` defines `LEARNED_REPS = 3` and `new|learning|learned`.
  - `selectStudyCards.js` supersedes `selectDueCards`: unlearned first, then only
    learned cards with `nextReview <= now` (never not-due learned cards).
- `src/core/parser/` — Markdown/JSON → validated cards. Never throws on bad input;
  returns `{ questions, errors }`. It keeps the full topic description.
- `src/core/content/` — built-in + custom topic catalog.
  - `topicMeta.js` persists `addedAt` in `sepect.topics.meta.v1`; `ensureTopicMeta`
    is called when the hub loads so built-in topics get their first-seen date.
  - `cover.js` exposes `topicCoverCard` (first card with an explicit image).
- `src/core/metrics/` — `getTopicMetrics`, `getGlobalMetrics`, `getActivity`,
  `bestStreak`, `GRADE_XP`; derived from catalog + SRS + history, UTC day keys, no
  side effects, no persistence.
- `src/games/` — isolated mini-games. `registry.js` is the only list of games;
  each entry is a frozen `GameDefinition`
  (`id, title, description?, art?, status, minCards, minTopics?, minCardsPerTopic?, load`).
  Games receive `{ deck, selectCards, groups?, anchorTopicId?, topic?, onGrade, onExit }`
  and never know the topic domain. Games never touch storage.
- `src/components/` — neon Button/Card Modal (Tailwind + tokens.css).
- `src/views/` — `TopicsHub` (`#/`, search/sort/status + covers), `TopicView`
  (`#/tema/:id`, full description + metrics + game tiles), `GameHost`
  (`#/tema/:id/juego/:gameId`, eligible deck + «Todo al día»), `Dashboard`
  (`#/progreso`, global/per-topic metrics + 14-day activity), `NotFound`.
  Mobile-first touch targets ≥44px.

## Invariants
- Games never touch storage directly; they return results, core persists.
- Parser output is the only card source games accept.
- One game loop per session; pause on hidden tab.
- Local-first: no network calls for progress/XP/history.
- Study selection only offers unlearned cards plus learned cards whose
  `nextReview` is due; never learned cards that are not due.
- Metrics are derived data; they are not persisted separately.
- Topic day keys (study days, activity, streaks) use UTC (`toISOString().slice(0,10)`).
- 60fps budget: animate only transform/opacity; canvas DPR-capped at 2.
