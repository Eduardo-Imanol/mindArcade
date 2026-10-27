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
  - `library.js` is the frozen, code-versioned manifest: categories
    (`programacion`, `idiomas`, `universidad`, `personalizados`), modules, stable
    order, `topicsForCategory`, per-category `image` (`public/categories/<id>.png`)
    and `SOURCE_BY_TOPIC` (topic id → source path). It has no storage/glob imports.
  - `catalog.js` loads built-in Markdown with a recursive
    `content/topics/**/*.md` glob and attaches `categoryId`, `moduleId`,
    `moduleTitle` and `sourcePath` (nullable) without changing the parser. Custom
    topics always fall in `personalizados` with `sourcePath: null`.
  - `sources.js` is a lazy `content/sources/**/*.md` registry consumed by the
    source reader (spec-19); paths are normalized and traversal/absolute paths
    are rejected. Documents are not part of the initial bundle.
  - `markdown.js` is a pure, zero-dependency Markdown parser that returns
    `Block[]` (`heading | paragraph | list | code | blockquote | hr`) with safe
    inline nodes; raw HTML is never interpreted and `blocksToSpeech` omits code.
    `MarkdownBlocks` renders those blocks as React elements (no
    `dangerouslySetInnerHTML`).
  - Physical content lives under `src/content/topics/<category>/` and
    `src/content/sources/<category>/`; assets stay in
    `src/content/assets/<topic-id>/` because card tokens resolve that path.
  - `topicMeta.js` persists `addedAt` in `sepect.topics.meta.v1`; `ensureTopicMeta`
    is called when the hub loads so built-in topics get their first-seen date.
  - `cover.js` exposes `topicCoverCard` (first card with an explicit image).
- `src/core/audio/` — Web Speech API wrapper (`tts.js`), no audio assets and no
  network. `speakSequence` chunks text (~200 chars), respects the global mute and
  exposes `pause/resume/stop/cancel`; `stopSpeech()` runs on navigation/unmount.
- `src/core/metrics/` — `getTopicMetrics`, `getGlobalMetrics`, `getActivity`,
  `bestStreak`, `GRADE_XP`; derived from catalog + SRS + history, UTC day keys, no
  side effects, no persistence.
- `src/games/` — isolated mini-games. `registry.js` is the only list of games;
  each entry is a frozen `GameDefinition`
  (`id, title, description?, art?, status, minCards, minTopics?, minCardsPerTopic?, load`).
  Games receive `{ deck, selectCards, groups?, anchorTopicId?, topic?, onGrade, onExit }`
  and never know the topic domain. Games never touch storage.
- `src/components/` — neon Button/Card Modal y `CategoryArt` (arte
  representativo de categoría reutilizado por el hub).
- `src/views/` — `TopicsHub` (`#/`, category-first library with aggregated
  progress, representative category art + cover), `CategoryView`
  (`#/categoria/:id`, orquestada con piezas en `views/category/`: módulos en
  orden de manifiesto, cerrados por defecto con `aria-expanded`; búsqueda,
  orden y estado cambian a una lista plana sin módulos), `TopicView` (`#/tema/:id`, breadcrumb category/module/topic,
  full description + metrics + game tiles), `GameHost`
  (`#/tema/:id/juego/:gameId`, eligible deck + «Todo al día»), `SourceReader`
  (`#/tema/:id/fuente`, lazy Markdown reader with Leer/Pausar/Reanudar/Detener,
  automatic reading of the selected fragment and the global mute), `Dashboard` (`#/progreso`, global/per-topic metrics +
  14-day activity), `NotFound`.
  Mobile-first touch targets ≥44px; hash routes are frozen.

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
