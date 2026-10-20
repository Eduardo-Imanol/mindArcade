# tasks.md — lluvia-meteoros (COMPLETED 2026-10-19)

> Archived at `specs/tasks-09-lluvia-meteoros.md` after technical DoD. Derived from
> `specs/spec-09-lluvia-meteoros.md`, signed by Eduardo 2026-10-19. Previous increment
> archived at `specs/tasks-08-intruso.md`. `sopa-de-letras` (spec-05) sigue pendiente;
> `caza-significados` (spec-07) conserva su idea original; el diff de spec-06 sigue
> esperando aprobación humana. TTS obligatorio (spec-03 AC-12). Sin dependencias
> nuevas. Sin cambios en `src/core/**`, `GameHost.jsx` ni otros juegos. Pendiente:
> aprobación humana del diff (Eduardo).

## Dependency graph

```
T1 lógica pura ──► T2 tests de lógica
T1 ──► T3 UI + CSS ──► T4 timer/pausa/reduced-motion ──► T5 TTS + a11y
T1 ──────────────────────────────────────────────────► T7 UI/a11y/isolation tests
T3 + T4 + T5 ────────────────────────────────────────► T7
T6 registry available (paralelo) ────────────────────► T7
T1 + T3 + T4 + T5 ───────────────────────────────────► T8 integración GameHost
T2 + T6 + T7 + T8 ───────────────────────────────────► T9 docs + verificación + DoD
```

Lógica pura primero; UI después; timer/pausa, TTS y a11y encima; registry en
paralelo; tests de UI e integración al final; docs y verificación adversarial cierran.

## Tasks

### T1 — Pure game logic [depends: none]
- [x] Deliverable: `src/games/lluvia-meteoros/lluvia-meteoros.logic.js` — sin imports:
  - Constantes: `MIN_ROUNDS=3`, `MAX_ROUNDS=10`, `DEFAULT_ROUNDS=8`, `OPTIONS=3`, `LIVES=3`, `FEEDBACK_MS=2500`, `GRACE_MS=700`, `RADAR_THRESHOLD=72`, `TOKEN_THRESHOLD=30`, `PHASES`, `DIFFICULTIES`, `RHYTHMS`.
  - `normalizeBack(text)` (trim + NFD sin diacríticos + lower).
  - `textProfile(text)` → `{ graphemes, longestToken, mode:'meteor'|'radar', size:'lg'|'md'|'sm' }` con `Array.from`, saltos de línea y tokens largos.
  - `fallDurationMs({ text, difficulty })` → fórmula de spec AC-5 con clamps y dificultad inválida → `normal`.
  - `buildRound({ card, deck, random })` → 1 correcta + 2 distractores del deck completo, ids únicos, `back` normalizado único, shuffle con `random` inyectable.
  - `buildSession({ cards, deck, rounds, difficulty, random })` → filtra cartas inválidas, exige ≥3 `back` únicos, `total=min(rondas, cartas)`, precalcula `profile`/`durationMs`; sesión vacía segura.
  - `createState()` fases `setup|playing|answered|paused|complete`, `rhythm`, `difficulty`, `score`, `streak`, `bestStreak`, `lives`.
  - `reduce(state, action)`: `start`, `answer { optionId, remainingRatio }`, `timeout`, `next`, `pause`, `resume`, `reset`; ignora acciones inválidas.
  - `currentRound(state)`, `pendingCurrent(state)` (solo meteoro actual sin resolver), `summarize(state)`.
- **AC cubiertos:** AC-4, AC-5, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12 (lógica).
- **Contexto:** spec §3 restricciones y §6 contrato; patrón `quiz-significado.logic.js`.
- **Done when:** lógica determinista con `random` fijo, sin imports, sin DOM, sin `Date`; supervivencia y pendientes verificables.
- **Estimate:** M.

### T2 — Logic test suite [depends: T1]
- [x] Deliverable: `src/games/lluvia-meteoros/lluvia-meteoros.logic.test.js`:
  - `textProfile`: corto → meteor; 72/73 grafemas, salto de línea y URL → radar; CJK/emoji; vacío.
  - `fallDurationMs`: monotonía con longitud, orden tranquilo > normal > arcade, clamps e inválidos.
  - `buildRound`: 3 opciones, correcta incluida, ids/backs únicos, determinista, distractores del deck.
  - `buildSession`: `min(rondas, cartas)`, filtrado de cartas inválidas, sesión vacía con <3 backs.
  - `reduce`: acierto → `facil` + puntos; fallo/timeout → `otra-vez`; un intento; doble acción ignorada; `survival` resta vidas y termina en 0; `pause/resume/reset`.
  - `pendingCurrent`: solo la carta actual; vacío al responder/completar/setup.
  - `summarize`: hits, fails, score, bestStreak, xp.
- **AC cubiertos:** AC-4, AC-5, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12 (pruebas).
- **Contexto:** spec §6 completo; `docs/testing.md` (seeds fijos, sin flaky).
- **Done when:** todos los bloques ENTRADA/SALIDA de §6 cubiertos y en verde.
- **Estimate:** M.

### T3 — UI component + styles [depends: T1]
- [x] Deliverable: `src/games/lluvia-meteoros/LluviaMeteoros.jsx`, `index.jsx` y estilos `.lluvia-*` en `src/ui/tokens.css`:
  - Setup: dificultad (3 botones), ritmo (Manual/Auto/Supervivencia), selector de rondas 3–10 default 8, `SoundToggle`, «Empezar», «Salir»; estado seguro si `deck <6` o <3 significados únicos.
  - Header: meteoro X de N, puntos, racha, vidas en supervivencia, pausa, `SoundToggle`, salir.
  - Prompt: modo `meteor` (cápsula bajo la roca con `front`, `CardImage` de pista, 🔊) y modo `radar` (panel fijo con el texto completo, roca compacta y barra de progreso); sin truncado.
  - Opciones: 3 botones con `CardImage` compacta + `back`, wrap completo, columna única en móvil, teclas `1/2/3`.
  - Feedback: correcta verde, fallo rojo, icono + texto, «🔊 Respuesta», «Siguiente» (manual) o cuenta de autoavance (auto/survival).
  - Pausa overlay con «Continuar»/«Salir»; resumen con puntos, aciertos, fallos, mejor racha, XP, «Jugar de nuevo» y «Volver al tema».
  - Emisión `onGrade(cardId, grade)` con guard seq; `pendingCurrent` + `onExit` al salir; reset de guards en start/replay.
  - Layout sin scroll horizontal a 360px; textos largos con `overflow-wrap:anywhere` y `hyphens:auto`.
- **AC cubiertos:** AC-2, AC-3, AC-6, AC-9 (UI), AC-11 (UI), AC-17 (render).
- **Contexto:** contrato de props; `CardImage`; `SoundToggle`; patrón `QuizSignificado.jsx`/`Intruso.jsx`; tokens.css.
- **Done when:** flujo completo jugable con mouse+teclado; modo meteor y radar visibles; sin imports prohibidos; lint 0.
- **Estimate:** L.

### T4 — Timer, pause and reduced motion [depends: T3]
- [x] Deliverable: integración en `LluviaMeteoros.jsx`:
  - `createEngine` como único loop rAF; `onTick(dt)` acumula `elapsed` en ref; `GRACE_MS` antes de caer; transform por ref (sin setState a 60fps).
  - Timeout exacto una sola vez al superar `GRACE_MS + durationMs`; pausa del engine al responder/timeout; reanudación en el siguiente meteoro; `stop()` al completar/desmontar.
  - Pausa manual y por `visibilitychange=hidden`; overlay al volver; conserva tiempo y posición; detiene la cuenta de autoavance.
  - Autoavance `FEEDBACK_MS` con cuenta visible y «Siguiente» anticipado; limpieza de timers.
  - `resize` recalcula el recorrido sin reiniciar el tiempo.
  - `prefers-reduced-motion`: sin cola/partículas/shake/transform; barra de progreso estática; mismas reglas.
- **AC cubiertos:** AC-13, AC-14, AC-15.
- **Contexto:** `src/core/engine/engine.js`; patrón de pausa por visibilidad; presupuesto 60fps (solo transform/opacity).
- **Done when:** no hay doble timeout, la pausa conserva progreso y no hay setState tras unmount.
- **Estimate:** M.

### T5 — TTS + accessibility behavior [depends: T3, T4]
- [x] Deliverable: integración en `LluviaMeteoros.jsx`:
  - `speak(front)` al aparecer cada meteoro; `speak(back)` al elegir opción; `speak(correctBack)` en feedback; `stopSpeech()` al pausar/desmontar.
  - 🔊 «Pregunta» y «Respuesta»; `<SoundToggle />` en setup, partida y resumen; controles ocultos sin `speechSynthesis`; muted respeta `sepect.settings.v1`.
  - `aria-live="polite"` con «Meteoro N de M: <front>» y resultado, sin mensajes obsoletos.
  - Foco predecible al empezar, tras «Siguiente» y en feedback; botones nativos `type="button"`; `aria-label="Opción N: <back>"`; targets ≥44px; estado por color + icono + texto.
  - Checklist manual de teclado y lector de pantalla documentado en T9.
- **AC cubiertos:** AC-16, AC-17.
- **Contexto:** `src/core/audio/tts.js`; `SoundToggle`; patrón de TTS de `QuizSignificado.jsx`/`Intruso.jsx`; `docs/manual-a11y-checklist.md`.
- **Done when:** TTS y foco funcionan sin ratón; sin soporte de voz el juego sigue 100% jugable.
- **Estimate:** M.

### T6 — Registry: lluvia-meteoros → available [depends: none]
- [x] Deliverable: `src/games/registry.js` + `src/games/registry.test.js` (+ ajuste en `src/views/TopicView.test.jsx` si aplica):
  - `lluvia-meteoros` con `status:'available'`, `minCards:6` y `load: () => import('./lluvia-meteoros/index.jsx')`.
  - Tests: 6 `available`, 4 `soon`, catálogo 10, `load()` resuelve, metadata de `minCards`.
  - TopicView habilita el juego con temas de ≥6 cartas.
- **AC cubiertos:** AC-1, AC-2 (metadata/gate).
- **Contexto:** registry actual; `getGameAvailability`; tests de registry/TopicView.
- **Done when:** `getGame('lluvia-meteoros')` correcto, counts actualizados y sin cambios en otros IDs.
- **Estimate:** S.

### T7 — UI, a11y and isolation tests [depends: T3, T4, T5, T6]
- [x] Deliverable:
  - `src/games/lluvia-meteoros/LluviaMeteoros.test.jsx`: setup default 8/normal/manual; `selectCards(8)`; render meteor/radar; 3 opciones; acierto/fallo/timeout; manual espera Siguiente; auto avanza con fake timers; survival 3 vidas → complete; pausa; replay; salida solo carta actual; estados seguros.
  - `src/games/lluvia-meteoros/LluviaMeteoros.a11y.test.jsx`: `aria-live` sin stale, labels, teclas 1/2/3, foco visible, targets, wrap de textos largos, reduced motion, TTS oculto sin soporte.
  - `src/games/lluvia-meteoros/lluvia-meteoros.isolation.test.js`: regex sin `storage|parser|content|router`; sin `localStorage|indexedDB|fetch(`; props `deck/selectCards/onGrade/onExit`; lógica sin imports.
- **AC cubiertos:** AC-3, AC-6, AC-9, AC-10, AC-16, AC-17, AC-18.
- **Contexto:** patrones de tests de quiz/intruso; `src/test/render.jsx`; `docs/manual-a11y-checklist.md`.
- **Done when:** suites propias en verde; sin violaciones de a11y en el componente.
- **Estimate:** M.

### T8 — GameHost integration tests [depends: T1, T3, T4, T5]
- [x] Deliverable: ampliar `src/views/GameHost.test.jsx`:
  - `lluvia-meteoros` carga con `deck`, `selectCards`, `onGrade`, `onExit`.
  - `selectCards` prioriza no aprendidas (patrón existente, con `Math.random` fijado).
  - Sesión: `facil` y `otra-vez` persisten SRS + XP + history; idéntico tras remount.
  - Salida a mitad de meteoro → solo la carta actual `otra-vez`; resueltas no se re-emiten.
  - Game over por vidas → no se califican rondas no mostradas.
- **AC cubiertos:** AC-19.
- **Contexto:** tests de integración de quiz/intruso; `loadSrs`; `createStore`; `loadCatalog`.
- **Done when:** asserts de persistencia y salida en verde; juegos existentes sin regresiones.
- **Estimate:** M.

### T9 — Docs + adversarial verify + DoD [depends: all]
- [x] Deliverable:
  - `specs/roadmap-games.md` → `lluvia-meteoros` spec-09 aprobada/available.
  - `docs/manual-a11y-checklist.md` → sección «Lluvia de meteoros» (teclado, lector, 360px, textos largos, reduced motion).
  - `MEMORY.md` → decisiones spec-09 (modo radar, duración por longitud, ritmos, 3 opciones, minCards 6).
  - `FOCUS.md` → objetivo activo spec-09 y siguiente paso.
  - `tasks.md` → estado final; archivar como `specs/tasks-09-lluvia-meteoros.md` al cerrar.
  - Verificación adversarial AC-1..AC-20; `npm test` 100%, `npm run lint` 0, `npm run build` OK; diff revisado por humano.
- **AC cubiertos:** AC-20.
- **Contexto:** spec §5 ACs; `docs/testing.md`; `docs/security.md`; skill `impeccable`.
- **Done when:** gates al 100%, verificador sin bloqueantes y Eduardo aprueba el diff.
- **Estimate:** S.
- **Estado:** 2026-10-19 — verificador independiente AC-1..AC-20: 16 PASS / 3 PARTIAL / 1 FAIL inicial; corregidos 2 defectos bloqueantes (wrap de `.lluvia-status`/`.lluvia-feedback p` y secuencia TTS elegido→correcto) y cerrados los 3 parciales. Gates finales: `npm test` 379/379 (47 files), `npm run lint` 0, `npm run build` OK (solo warning preexistente de chunk >500 kB). Residuales no bloqueantes documentados en `MEMORY.md`. Checklist manual 360px/lector pendiente de humano. Pendiente: aprobación humana del diff (Eduardo).

## Sizing / execution flow
- Scope: subsistema único FE (9 tareas: lógica + UI + timer + TTS/a11y + registry + tests + docs).
- Mode: single-agent secuencial; T6 puede ir en paralelo con T1–T5.
- Sequential chains: T1 → T2; T1 → T3 → T4 → T5 → T7; T6 → T7; T7 → T8; T2 + T6 + T7 + T8 → T9.
- Estimate: T1 M, T2 M, T3 L, T4 M, T5 M, T6 S, T7 M, T8 M, T9 S.
- Out of scope respected: sin nuevas deps, sin SFX, sin multiplayer, sin cambios en `src/core/**` ni `GameHost.jsx`.

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-19 (decisiones: híbrido meteor/radar con umbral 72 grafemas; 3 opciones fijas; ritmos Manual/Auto/Supervivencia con 3 vidas; dificultad solo de velocidad; 8 rondas default 3–10; `minCards:6`; puntos arcade + XP vía `onGrade`; TTS obligatorio; sin dependencias nuevas).
