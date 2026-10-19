# mindArcade (Sepect) — Agent Guide

Sepect is a local-first arcade learning engine: spaced repetition + mini-games. No backend.

## Stack
- Language / framework: JavaScript ES2022 + React 18 + Vite 5
- Styling: Tailwind CSS, neon arcade tokens (`src/ui/tokens.css`)
- Storage: localStorage (sync) + IndexedDB (history), no backend
- Canvas: native Canvas by default, p5.js optional per game
- Audio: Web Audio API synthesized, no audio assets
- TTS: Web Speech API (`src/core/audio/tts.js`, free, zero deps) — MANDATORY in every game
- Package manager: npm

## Repository map
- `src/core/engine/` — single game loop, states init-playing-paused-over
- `src/core/storage/` — central store, XP, streaks, persistence
- `src/core/repetition/` — SM-2 simplified + Elo rating
- `src/core/parser/` — Markdown/JSON topic parser to validated questions
- `src/games/` — isolated mini-games, each implements BaseMiniGame
- `src/components/` — neon design system (Button, Card, Modal)
- `src/views/` — Dashboard, Topic selector, Stats
- `src/ui/` — shared canvas/audio helpers
- `docs/` — detailed docs (read on demand)
- `specs/` — active specifications (source of truth)
- `tasks.md` — current atomic task plan (only after spec sign-off)

## Commands
```bash
npm install        # install deps
npm run dev        # run dev (Vite)
npm test           # run tests (Vitest)
npm run lint       # eslint + prettier check
npm run build      # production build
```

## Rules (read on demand — L0 index)
- Architecture & layering: `docs/architecture.md`
- Testing: `docs/testing.md`
- Security & persistence: `docs/security.md`

## Guardrails
- Never commit secrets or `.env*`.
- Local-first: no network calls for progress/XP/history.
- One game loop per session; pause on `visibilitychange` hidden.
- Commands requiring human approval: infra changes, adding dependencies, history-rewriting git.
- Return a task as done only if tests + lint pass at 100%.
- Spec-Anchored: no code beyond signed `specs/spec-*.md` scope.
- Every game MUST include TTS: read card text aloud via `src/core/audio/tts.js` (Web Speech API), speaker button + global mute toggle (spec-03).

## Local overrides
- Per-module rules live in `<module>/AGENTS.override.md`.
