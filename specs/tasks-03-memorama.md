# tasks.md — memorama (APPROVED 2026-10-19 — execution unblocked)

> Derived from `specs/spec-03-memorama.md`. Signed by Eduardo: `APPROVED spec-03 + tasks`.
> Previous increment archived at `specs/tasks-02-topics-flashcards.md` (done).
> Roadmap of games: `specs/roadmap-games.md`. TTS is now mandatory for every game (AC-12).

## Dependency graph

```
T1 selectDueCards (core puro) ──► T5 GameHost selectCards prop
T2 memorama.logic.js (reducer) ─► T3 Memorama.jsx ──► T4 registry available
T3 ──► T6 responsive (grid + anchos)
T7 tts.js core + settings ──► T8 integración TTS (memorama + flashcards + toggle)
T9 docs (AGENTS.md/roadmap/skills: "todo juego debe tener TTS")
T10 gates verificación (tests + lint + a11y manual)
```

Core selection + pure reducers first, then game UI, then host wiring, then responsive,
then TTS (last, per signed decision), then docs, then adversarial verify.

## Tasks

### T1 — Core: `selectDueCards` (SRS-driven selection) [depends: none]
- [x] Deliverable: `src/core/repetition/selectDueCards.js` (+ test) — pure `selectDueCards(cards, srs, { count, random, now })`: pool = unseen + `reps < LEARNED_REPS(3)` shuffled with injectable `random`; backfill learned by `nextReview` asc; never returns > `count`
- Covers: AC-3
- Context needed: spec §4 selection rule; existing `srs.js` shape `sepect.srs.v1`
- Done when: fixed `random`/`now` → deterministic order; pool ≥ count → only unlearned; pool < count → backfill learned due-first; count > cards → returns all cards

### T2 — Memorama pure logic reducer [depends: none]
- [x] Deliverable: `src/games/memorama/memorama.logic.js` (+ test) — board building (2 tiles per card: front/back), injectable shuffle, flip/lock/match/timeout-close actions, attempts per card, grade computation (1st → `facil`, 2–3 → `dificil`, never → `otra-vez`), complete state; no core imports
- Covers: AC-4 (data), AC-5, AC-6 (grade mapping)
- Context needed: spec §4 grades-by-attempts; flashcards reducer pattern (`flashcards.logic.js`)
- Done when: full-session sequence test green (setup → flips → mismatches close → matches lock → end → pending grades list); deterministic with fixed random

### T3 — Memorama UI component (setup + board + CSS flip) [depends: T2]
- [x] Deliverable: `src/games/memorama/Memorama.jsx` + `index.jsx` — setup screen (Fácil 4 / Medio 6 / Difícil 8 → `selectCards(n)`), board grid, CSS 3D flip (`preserve-3d`, `prefers-reduced-motion` respected), `CardImage` on both tile faces, matched highlight, keyboard Tab/Enter/Space, `aria-label`/`aria-live`, exit + session summary; a11y + isolation tests
- Covers: AC-2, AC-4, AC-5 (UI), AC-8, AC-10 (isolation scan)
- Context needed: frozen props contract + `selectCards?` extension (spec §4); `CardImage`; tokens.css; flashcards a11y test patterns
- Done when: difficulty → board with `2×min(pedido,disponible)` tiles; match/mismatch flow works by mouse+keyboard; isolation regex green (no storage/parser/content/router); 360px contract test green

### T4 — Registry: memorama → available [depends: T3]
- [x] Deliverable: `src/games/registry.js` entry flipped: `status:'available'`, `load: () => import('./memorama/index.jsx')`; `registry.test.js` updated; `TopicView.jsx` now gates available games by `minCards` (AC-1: memorama needs ≥4 cards)
- Covers: AC-1
- Context needed: spec AC-1; registry contract spec-02 §4
- Done when: `getGame('memorama').status==='available'` + `load()` resolves `{default: Component}`; other 8 games remain `soon`; catalog length 10

### T5 — GameHost wiring: `selectCards` prop [depends: T1]
- [x] Deliverable: `src/views/GameHost.jsx` (+ `GameHost.test.jsx`) — builds `selectCards(count)` from `topic.cards + srs[topic.id]` (unlearned-priority selection) and passes it as optional prop; flashcards behavior untouched (full `orderDeck` deck); grading path unchanged
- Covers: AC-3 (integration), AC-6 (persistence path)
- Context needed: spec §4 additive contract; `srs.js`/`selectDueCards` APIs
- Done when: memorama receives a `selectCards` fn that returns unlearned-first cards persisted via existing `onGrade`; flashcards tests still green without the prop

### T6 — Responsive board (mobile + desktop) [depends: T3]
- [x] Deliverable: grid/contenedor responsive en `src/ui/tokens.css` (o CSS del juego) — 360px: ≥4 cols, targets ≥44px, sin scroll horizontal; ≥1024px: contenedor a ancho completo (`width:100%; max-width:100%`) con stage ~960px centrado (`.game-stage`), hasta 8 cols, aspect-ratio fijo, texto legible; media queries sin deps
- Covers: AC-7
- Context needed: spec §4 responsive constraint; existing tokens + inline-style patterns
- Done when: manual/test checks at 360px y 1024px+; no `width:\d{4,}` en estilos inline; layout no se rompe en desktop

### T7 — TTS core + settings persistence [depends: none]
- [x] Deliverable: `src/core/audio/tts.js` (+ test) — `speak(text,{lang})` wrapper de `speechSynthesis` (cancel previo, rate 0.9, pitch 1.1, voz por prefijo de idioma, `onvoiceschanged` fallback), `isSupported()`; `src/core/storage/settings.js` (+ test) — `sepect.settings.v1 = { muted }` quota-safe con fallback corrupto
- Covers: AC-9 (core), edge cases spec §5 (sin speechSynthesis, JSON corrupto)
- Context needed: spec §4 TTS module; store quota-safe pattern (`store.js`)
- Done when: stub de `speechSynthesis` → utterance encolado con rate 0.9; `muted:true` → sin utterance; localStorage corrupto → `{muted:false}`; sin `speechSynthesis` → `isSupported()===false`, sin crash

### T8 — TTS UI integration (memorama + flashcards + toggle) [depends: T7, T3]
- [x] Deliverable: lectura al voltear tile (tras gesto), botón 🔊 por carta/tile y en resumen, toggle global de sonido persistido (hub o header de juego), integración también en Flashcards; tests con `speechSynthesis` stubbeado
- Covers: AC-9 (UI), AC-8 (controles accesibles)
- Context needed: T7 API; spec §2 HU-2
- Done when: voltear lee el texto; 🔊 repite; mute persiste tras reload; navegador sin soporte → controles ocultos y juego jugable

### T9 — Docs: regla "todo juego debe tener TTS" [depends: T7]
- [x] Deliverable: regla TTS en `AGENTS.md` (Guardrails + Stack audio), `specs/roadmap-games.md` (contrato de reutilización), `.opencode/skills/mini-game-templates/SKILL.md` y `.opencode/skills/audio-fx-integration/SKILL.md` (referencia al helper `src/core/audio/tts.js`)
- Covers: AC-12
- Context needed: spec §4 TTS constraint + AC-12
- Done when: los 4 archivos declaran explícitamente el TTS obligatorio con el helper a usar
- Estado: [x] ejecutada 2026-10-19 (docs only, junto a la firma de spec-03)

### T10 — Adversarial verify + DoD [depends: all]
- [x] Deliverable: full suite green, lint 0, verifier independiente contra AC-1..AC-12, revisión de diff humana, checklist a11y manual extendido a desktop (`docs/manual-a11y-checklist.md`), MEMORY/FOCUS/roadmap actualizados (memorama → `available`)
- Covers: AC-11
- Context needed: `docs/testing.md`, `docs/security.md`, spec §6
- Done when: `npm test` 100%; `npm run lint` 0; verificador adversario sin hallazgos; Eduardo aprueba diff
- Estado: [~] 2026-10-19 — verifier corrió; 5 hallazgos corregidos (aria-live stale, asserts vacíos, `now` muerto, test integración otra-vez, checklist Memorama); queda aprobación humana del diff

## Sizing / execution flow
- Scope: multi-subsistema (10 tareas: 1 core SRS + 1 juego + host + responsive + TTS + docs)
- Mode: single-agent secuencial; T1 ∥ T2 ∥ T7 paralelizables al inicio (sin dependencias)
- Sequential chains: T2 → T3 → T4/T6; T1 → T5; T7 → T8 → T9; T10 al final
- Estimate: T1 S, T2 M, T3 L, T4 S, T5 M, T6 M, T7 S, T8 M, T9 S, T10 S
- Out of scope respected: sin multiplayer, sin nuevas deps, sin SFX, sin juegos 4–10

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-19 (decisiones: grades por intentos; dificultad 4/6/8 solo con no aprendidas aleatorias; 1 jugador; TTS al voltear + 🔊 + toggle; TTS al final del plan)
