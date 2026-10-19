# MEMORY

## Architectural decisions
- 2026-10-16 — Stack Vite + React 18 + Tailwind, local-first (no backend) — user confirmed.
- 2026-10-16 — First increment: nucleus (engine/storage/parser/SM-2) + neon Dashboard — user confirmed.
- 2026-10-16 — Specs in English per template; product name Sepect inside repo mindArcade.
- 2026-10-16 — spec-02 draft: topics hub + modular GameModule registry (stable kebab IDs) + Flashcards first; games 2–10 `soon`, each own spec (`specs/roadmap-games.md`) — user confirmed scope.
- 2026-10-16 — Navigation: in-house hash mini-router, zero new deps — user confirmed.
- 2026-10-16 — Custom topics created from UI (paste MD → localStorage `sepect.topics.custom.v1`) — user confirmed.
- 2026-10-16 — spec-02 + tasks APPROVED with images addendum: `Card.image` (emoji|url|asset|upload), MD `| I:` token, shared `CardImage`, native-canvas generative fallback (no p5, no deps), zero-dep SVG generator `scripts/generate-card-images.mjs`, uploads → IndexedDB `sepect.images.v1` — user confirmed.
- 2026-10-19 — spec-03 (memorama) APPROVED + tasks T1–T10 signed. Decisions: grades por intentos (1.º `facil`, 2–3 `dificil`, nunca → `otra-vez`); dificultad Fácil 4 / Medio 6 / Difícil 8 parejas; selección SOLO de cartas no aprendidas (aleatoria) vía nueva función pura `selectDueCards` ("aprendida" ≡ `reps >= 3`); 1 jugador (sin multiplayer); flip 3D con CSS puro (no framer-motion). Reference repo for mechanics only: `github.com/Eduardo-Imanol/VocaPlayLand`.
- 2026-10-19 — Contrato de juego extendido de forma ADITIVA: prop opcional `selectCards(count)` que GameHost construye desde `topic.cards + srs[topicId]`; flashcards lo ignora (deck completo). El SRS nunca entra al módulo del juego.
- 2026-10-19 — TTS institucionalizado: todo juego DEBE incluir lectura con Web Speech API (`src/core/audio/tts.js`, gratis, 0 deps), botón 🔊 + toggle global `sepect.settings.v1 = { muted }`. Documentado en `AGENTS.md`, `specs/roadmap-games.md` y skills `mini-game-templates`/`audio-fx-integration`. En spec-03 el TTS se implementa AL FINAL del plan (T7→T8), por decisión del usuario.

## Resolved errors / gotchas
- 2026-10-16 — npm registry here lacks jsdom@25.0.8 and vitest@2.1.5; pinned jsdom ^25.0.1 + vitest ^2.1.0 + eslint globals pkg. Full install ~1-5min (slow network).
- 2026-10-16 — eslint v9 flat config needs globals browser+node + react/jsx-uses-vars, else JSX components flagged unused and browser APIs flagged undef.
- 2026-10-16 — Pre-existing templates had dead code (paintParticles, unused `t`, stale react-hooks disable) — removed, lint 0.
- 2026-10-16 — spec-01 delivered: 11/11 tests, lint 0, build OK, dev boots. Files: parser/sm2/store+engine/UI/Dashboard.
- 2026-10-16 — mindArcade dir is untracked in the /public git repo (`git status` → `?? ./`); initial commit pending human decision.
- 2026-10-16 — spec-01 tasks archived to `specs/tasks-01-core-dashboard.md`; `tasks.md` now holds spec-02 draft (execution blocked).
- 2026-10-17 — spec-02 T1–T13 executed: hub/catalog/custom topics+images, topic view + 10-game grid, `CardImage`, deterministic SVG generator, flashcards UI + GameHost (SRS+XP+streak), reuse/isolation/a11y tests, topic `funciones-programacion` (20 cards, 20 SVGs). `npm test` 84/84, lint 0, build OK — awaiting verifier + human diff review.
- 2026-10-17 — Test harness without new deps: `src/test/render.jsx` (React `act` from 'react', MouseEvent clicks, `setValue` for controlled inputs, `waitFor` polling). jsdom `Event('click')` does NOT trigger form submit — must use `MouseEvent`.
- 2026-10-17 — GameHost bug found by tests: `getGame()` returns a fresh object per call, so using it raw in `useEffect` deps caused an infinite load/setDeck loop; now `useMemo(() => getGame(id), [gameId])`. Never pass unstable factory objects to effect deps.
- 2026-10-17 — Dynamic `import()` under vitest takes ~0.5s (on-demand transform); poll with real timers (`waitFor`), not `act(async () => setTimeout)`, which can deadlock/hang the worker.
- 2026-10-17 — Vite inlines the generated SVGs (<4KB) as `data:image/svg+xml` in the production bundle — offline-safe; `assetUrl()` returns the data URL after build.
- 2026-10-17 — Independent verifier pass found & fixes landed: (a) topic image overrides now merge into deck cards in `GameHost` so UI overrides win in gameplay (AC-9/AC-11); (b) XP is grade-based (facil=+10, dificil=+25, otra-vez=0) via `GRADE_DIFFICULTY` + `awardXP`, not card difficulty (AC-5); (c) lint scope extended to `scripts/`; (d) upload failure no longer persists broken overrides; (e) `input:focus-visible` ring; (f) unknown-game fallback links home; (g) late object-URL revoke in `CardImage`. Manual a11y checklist added at `docs/manual-a11y-checklist.md` (human gate).
- 2026-10-17 — `@eslint/js` is imported by `eslint.config.js` but only a transitive dep of eslint (not declared) — declaring it would be "adding a dependency" (needs human approval); harmless today.
- 2026-10-19 — T10 adversarial verify: landed fixes: (a) AC-8 stale aria-live — `reduce({type:'close'})` now clears `lastMatch`, so a later mismatch no longer re-announces "¡Par encontrado!" (test added); (b) removed vacuous `div[onclick]/span[onclick]` assert → `[role="button"]:not(button)`; (c) `selectDueCards` dropped the unused `now` option (+ GameHost call) and renamed the determinism test — spec §6 defines selection without due-date filtering; (d) added GameHost integration test for the `otra-vez` exit path (SRS reps=0, XP=0, history×4); (e) `docs/manual-a11y-checklist.md` now covers Memorama + TopicView gating. NOTE (spec self-contradiction, code keeps §6): AC-6 prose says "2–3 intentos → dificil" but §6 test contract says `attempts=1 → facil`; `gradeFor` follows §6 (`<=1 → facil`). Ask human before changing.
- 2026-10-19 — AC-10 isolation test (`memorama.isolation.test.js`) is a direct-source regex scan; it does NOT catch transitive imports (`SoundToggle → storage/settings`, `CardImage → core/content`). Intent (no memory-resident SRS/storage in game logic) is upheld by design (game receives data via props), but the test is textual only.

## Fragile dependencies
- vitest 2.x env startup slow (~45-60s per run under jsdom) — tolerable, don't parallelize blindly.
- Test env is a 3-CPU Android box: never leave killed `vitest` workers behind (they keep spinning and starve later runs); `pkill -f vitest` from a shell whose own command line contains "vitest" kills the shell itself.

## Recurring patterns
- Spec-Anchored: no code beyond signed specs/spec-*.md scope.

## Open questions
- p5.js as hard dep or lazy-optional per game? (default: native Canvas, p5 optional)
- Deployment target for PWA: Netlify vs GitHub Pages? (decide before spec-04)
