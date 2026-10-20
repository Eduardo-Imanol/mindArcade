# tasks.md — quiz-significado (APPROVED 2026-10-19 — execution unblocked)

> Derived from `specs/spec-06-quiz-significado.md`. Signed by Eduardo: `APPROVED spec-06 + tasks`.
> Previous increment archived at `specs/tasks-04-ahorcado.md` (T10 `[~]` — pendiente revisión
> humana del diff de spec-04). Roadmap of games: `specs/roadmap-games.md`.
> TTS mandatory (spec-03 AC-12). Spec-05 (sopa de letras) queda pendiente por decisión del usuario.

## Dependency graph

```
T1 quiz-significado.logic.js (puro) ──► T2 logic tests ──► T3 QuizSignificado.jsx + CSS
T3 ──► T4 registry available ──► T5 a11y + isolation tests
T3 ──► T6 GameHost integration tests
T4 ──► T7 docs (roadmap/checklist/MEMORY/FOCUS)
T1..T7 ──► T8 adversarial verify + DoD + human diff
```

Pure reducer/options first, then UI, then registry, then tests, then docs, then verify.

## Tasks

### T1 — Pure quiz logic [depends: none]
- [x] Deliverable: `src/games/quiz-significado/quiz-significado.logic.js` — reducer puro SIN imports de core:
  - `MIN_ROUNDS=3`, `MAX_ROUNDS=10`, `DEFAULT_ROUNDS=10`, `MAX_ATTEMPTS=2`, `PHASES`.
  - `normalizeBack(text)` (trim + NFD strip diacritics + lower) para dedupe.
  - `buildQuestion(correctCard, deck, random)` → `{ card, options: [{ card, correct }] }` con 1 correcta + hasta 3 distractores del deck completo, excluyendo la carta correcta por `id` y backs duplicados; barajado con `random` inyectable; fallback 2–4 opciones si no hay 3 únicos.
  - `createState()` fases `setup|playing|answered|complete`.
  - `reduce(state, action)`: `start { rounds, cards, deck, random }` (construye preguntas), `choose { optionId }` (1.er fallo mantiene ronda; 2.º fallo o acierto resuelve), `next`, `reset`.
  - `gradeFor(correct, attempts)` → `facil|dificil|otra-vez`.
  - `pendingGrades(state)` con emisión única por `seq` monótono.
- Covers: AC-2, AC-3 (lógica), AC-4, AC-5, AC-6, AC-7 (pendingGrades)
- Context needed: spec §2 HU-2/HU-3, §4 restricciones; patrón `memorama.logic.js` / `ahorcado.logic.js`
- Done when: secuencia completa determinista con `random` fijo; opciones únicas; grades y pendientes verificados; sin imports prohibidos

### T2 — Logic test suite [depends: T1]
- [x] Deliverable: `src/games/quiz-significado/quiz-significado.logic.test.js` — contrato §6 completo:
  - `buildQuestion` genera 4 opciones (1 correcta, 3 únicas del deck) y es determinista.
  - Dedupe de backs normalizados; fallback con menos significados únicos.
  - Secuencia 3 rondas: correcta 1.er intento → `facil`; fallo+acierto → `dificil`; 2 fallos → `otra-vez`; resumen `complete`.
  - `pendingGrades` no re-emite resueltas; `reset` limpia.
- Covers: AC-4, AC-5, AC-6, AC-7 (pruebas), AC-12 (parcial)
- Context needed: spec §6; `docs/testing.md` (seeds fijos, sin flaky)
- Done when: todos los bloques ENTRADA/SALIDA de §6 cubiertos y en verde

### T3 — UI component + styles [depends: T1]
- [x] Deliverable: `src/games/quiz-significado/QuizSignificado.jsx` + `index.jsx` + estilos `.quiz-*` en `src/ui/tokens.css`:
  - Setup: selector nativo de rondas 3–10 (default 10), nota de disponibles, `SoundToggle`, «Empezar», «Salir».
  - Ronda: header (pregunta X de N, fallos de la ronda, `SoundToggle`, «Salir»); tarjeta superior solo con el `front` + «🔊 Pregunta»; grid 2×2 de opciones con `CardImage` (`alt=""`) + `back`; opciones incorrectas rojo/deshabilitadas; correcta verde; «Siguiente».
  - Resumen: aciertos/total, fallos, XP (10/25/0), «Jugar de nuevo», «Volver al tema», `SoundToggle`.
  - TTS: `speak(front)` al iniciar ronda (tras gesto), `speak(back)` al pulsar opción, «🔊 Respuesta» en feedback, `stopSpeech()` al desmontar; controles ocultos sin soporte.
  - Emisión `onGrade` por ronda con patrón seq; `pendingGrades` + `onExit` al salir; guard de emisión única.
- Covers: AC-2 (UI), AC-4, AC-5, AC-6 (emisión), AC-7 (flujo), AC-8, AC-9 (render)
- Context needed: contrato de props; `CardImage`; `tts.js`; `SoundToggle`; `Ahorcado.jsx`/`Memorama.jsx` (fases, seq, salida); tokens.css
- Done when: flujo completo jugable con mouse+teclado; 2×2 a 360px sin scroll horizontal; sin imports prohibidos; lint 0

### T4 — Registry: quiz-significado → available [depends: T3]
- [x] Deliverable: `src/games/registry.js` — `quiz-significado` con `status:'available'`, `minCards:4`, `load: () => import('./quiz-significado/index.jsx')`; `src/games/registry.test.js` actualizado (4 `available`, 6 `soon`, catálogo 10, `load()` resuelve)
- Covers: AC-1
- Context needed: spec AC-1; contrato registry spec-02 §4
- Done when: `getGame('quiz-significado').status==='available'` + `load()` dinámico; `TopicView` lo habilita con ≥4 cartas sin cambios; resto del catálogo intacto

### T5 — A11y + isolation tests [depends: T3]
- [x] Deliverable: `src/games/quiz-significado/quiz-significado.isolation.test.js` (regex sin `storage|parser|content|router`; sin `localStorage|indexedDB|fetch(`) + `src/games/quiz-significado/QuizSignificado.a11y.test.jsx`:
  - Setup: select nativo etiquetado, opciones 3–10, botones nativos.
  - Ronda: 4 opciones `<button>` con `aria-label` «Opción N: <back>»; sin `[role="button"]:not(button)`; `aria-live` anuncia acierto/fallo/intentos; foco visible; targets ≥44px.
  - CSS: grid 2×2 declarado, sin scroll horizontal a 360px (regex + checklist manual), `prefers-reduced-motion`.
  - TTS oculto sin `speechSynthesis` y juego jugable; salida con pendientes `otra-vez`.
- Covers: AC-9 (pruebas), AC-10, AC-12 (parcial)
- Context needed: patrones `Memorama.a11y.test.jsx` / `Ahorcado.a11y.test.jsx`; `memorama.isolation.test.js`; `docs/manual-a11y-checklist.md`
- Done when: ambas suites en verde; sin violaciones de a11y en el componente

### T6 — GameHost integration tests [depends: T3]
- [x] Deliverable: ampliar `src/views/GameHost.test.jsx`:
  - `quiz-significado` recibe `selectCards` con no-aprendidas primero (random fijo).
  - Sesión con `facil`/`dificil`/`otra-vez` persiste SRS + XP + history idénticos tras remount.
  - Salida a mitad de sesión → pendientes `otra-vez` persistidos; resueltas no se re-emiten.
- Covers: AC-3 (integración), AC-6 (persistencia), AC-7 (salida)
- Context needed: `selectDueCards`/`applyGrade`/`awardXP`; tests de integración de memorama/ahorcado
- Done when: asserts de persistencia en verde; flashcards/memorama/ahorcado sin regresiones

### T7 — Docs [depends: T4]
- [x] Deliverable:
  - `specs/roadmap-games.md` → `quiz-significado` spec-06 aprobada (spec-05 pendiente).
  - `docs/manual-a11y-checklist.md` → sección «Elige el significado».
  - `MEMORY.md` → decisión arquitectónica spec-06 (layout, grades, distractor pool, TTS).
  - `FOCUS.md` → objetivo activo spec-06 y siguiente paso.
- Covers: AC-11
- Context needed: spec AC-11; formato de secciones existentes
- Done when: los 4 archivos actualizados sin romper índices

### T8 — Adversarial verify + DoD [depends: all]
- [~] Deliverable: verificador independiente (agente distinto al autor) contra AC-1..AC-12; `npm test` 100%; `npm run lint` 0; `npm run build` OK; revisión de diff humana; cierre de `MEMORY.md`/`FOCUS.md`
- Estado: [~] 2026-10-19 — verificador independiente: AC-1..AC-12 **PASS**, 0 hallazgos bloqueantes. Gates: `npm test` 249/249 (37 files), `npm run lint` 0, `npm run build` OK (solo warning preexistente de chunk >500 kB). Residuales no bloqueantes documentados en `MEMORY.md`; pendiente aprobación humana del diff (Eduardo) antes de archivar este incremento.
- Covers: AC-12 (y smoke de todos)
- Context needed: spec §5 ACs, `docs/testing.md`, `docs/security.md`
- Done when: gates al 100%, verificador sin hallazgos bloqueantes, Eduardo aprueba diff

## Sizing / execution flow
- Scope: subsistema único FE (8 tareas: lógica + UI + registry + tests + docs)
- Mode: single-agent secuencial; T1 ∥ T3 no (T3 depende de T1)
- Sequential chains: T1 → T2; T1 → T3 → T4 → T5; T3 → T6; T4 → T7; T8 al final
- Estimate: T1 M, T2 S, T3 L, T4 S, T5 S, T6 S, T7 S, T8 S
- Out of scope respected: sin nuevas deps, sin SFX, sin juegos 5/7–10, sin cambios en GameHost/routing (salvo tests)

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-19 (decisiones: pregunta arriba solo texto + TTS; 4 opciones 2×2 con `CardImage` + `back`; distractores del deck completo con dedupe; 2 intentos → facil/dificil/otra-vez; rondas 3–10 default 10 vía `selectCards`; TTS automático + 🔊 + toggle global)
