# Architecture (L0 detail)

> Read on demand. Source of truth for layering is `specs/spec-*.md`.

## Layers
- `src/core/engine/` — single rAF loop, delta time, states: init → playing → paused → over.
  Auto-pause on `visibilitychange=hidden`. No more than one loop per session.
- `src/core/storage/` — central reactive store, persistence localStorage (profile/XP/streak)
  + IndexedDB (history). No network for progress.
- `src/core/repetition/` — simplified SM-2 + per-question Elo. Pure functions, fully tested.
- `src/core/parser/` — Markdown/JSON → validated `Question[]`. Never throws on bad input; returns `{ questions, errors }`.
- `src/games/<game>/` — isolated mini-games implementing `BaseMiniGame` (`init(questions)`, `update(dt)`, `render(ctx)`, `dispose()`, returns `{ score, correct, wrong, durationMs }`).
- `src/components/` — neon Button/Card Modal (Tailwind + tokens.css).
- `src/views/` — Dashboard, TopicSelector, Stats. Mobile-first touch targets ≥44px.

## Invariants
- Games never touch storage directly; they return results, core persists.
- Parser output is the only question source games accept.
- 60fps budget: animate only transform/opacity; canvas DPR-capped at 2.
