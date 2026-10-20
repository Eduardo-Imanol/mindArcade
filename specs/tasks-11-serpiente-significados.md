# tasks.md — serpiente-significados

> Derived from `specs/spec-11-serpiente-significados.md`, signed by Eduardo
> 2026-10-20. Active increment. Previous increment archived at
> `specs/tasks-10-conecta-pares.md`. TTS obligatorio (spec-03 AC-12). Sin
> dependencias nuevas. Sin cambios en `src/core/**`, `GameHost.jsx` ni otros
> juegos. Pendiente: aprobación humana del diff al cerrar.

## Dependency graph

```
T1 lógica pura ──► T2 tests de lógica
T1 ──► T3 UI + CSS ──► T4 engine/pausa/colisión/feedback ──► T5 TTS + a11y
T1 ────────────────────────────────────────────────────────► T7 UI/a11y/isolation tests
T3 + T4 + T5 ──────────────────────────────────────────────► T7
T6 registry available (paralelo) ──────────────────────────► T7
T1 + T3 + T4 + T5 ─────────────────────────────────────────► T8 integración GameHost
T2 + T6 + T7 + T8 ─────────────────────────────────────────► T9 docs + verificación + DoD
```

Lógica pura primero; UI después; engine/pausa/colisión, TTS y a11y encima;
registry en paralelo; tests de UI e integración al final; docs y verificación
adversaria cierran.

## Tasks

### T1 — Pure game logic [depends: none]
- [x] Deliverable: `src/games/serpiente-significados/serpiente-significados.logic.js`
  — sin imports:
  - Constantes: `MIN_ROUNDS=4`, `MAX_ROUNDS=10`, `DEFAULT_ROUNDS=8`,
    `MAX_SURVIVAL_CARDS=20`, `APPLES=3`, `INITIAL_LIVES=5`, `FEEDBACK_MS=1400`,
    `WRONG_GROWTH=3`, `MODES`, `DIFFICULTIES`, `DIRECTIONS`, `PHASES`,
    `STEP_MS`, `BOARD_SIZES`.
  - `normalizeBack(text)` (trim + NFD sin diacríticos + lower), `hasText`,
    `validCard`, `uniqueBackCount`.
  - `clampRounds(rounds)`, `safeDifficulty(difficulty)`,
    `boardSizeFor({ difficulty, viewport })`.
  - `buildSession({ cards, deck, mode, rounds, difficulty, viewport, random })`
    → sesión con `total`, `mode`, `difficulty`, `boardSize`, `stepMs`, `cards`
    únicas y `empty` seguro; filtra, deduplica por `id`/`back`, exige ≥3 backs.
  - `createSnake(boardSize)`, `spawnRound({ card, deck, snake, boardSize, random })`
    → 3 manzanas numeradas 1–3, 1 correcta + 2 distractores, celdas libres,
    `null` seguro si no hay espacio.
  - `createState()` fases `setup|playing|paused|resolved|gameover|complete`,
    modo, dificultad, tablero, serpiente, dirección/`nextDirection`, manzanas,
    vidas, puntos, racha, `wrongEats`, resultados y `lastGrade`.
  - `reduce(state, action)`: `start`, `direction`, `step`, `next`, `pause`,
    `resume`, `reset`; ignora acciones inválidas.
  - `currentCard(state)`, `pendingCurrent(state)`, `summarize(state)`.
- **AC cubiertos:** AC-3, AC-4, AC-7, AC-8, AC-10, AC-11, AC-12, AC-13, AC-14 (lógica).
- **Contexto:** spec §3 restricciones y §6 contrato; patrón
  `lluvia-meteoros.logic.js`/`conecta-pares.logic.js`.
- **Done when:** lógica determinista con `random` fijo, sin imports, sin DOM, sin
  `Date`; wrap, colisión, respawn, vidas, modos y pendientes verificables.
- **Estimate:** L.

### T2 — Logic test suite [depends: T1]
- [x] Deliverable: `src/games/serpiente-significados/serpiente-significados.logic.test.js`:
  - `normalizeBack`/`uniqueBackCount`/filtrado/dedupe.
  - `clampRounds`, `boardSizeFor` móvil/desktop e inválidos.
  - `buildSession`: rondas, supervivencia (tope 20), sesión vacía, determinismo.
  - `spawnRound`: 3 números, 1 correcta, distractores únicos, celdas libres,
    tablero lleno → `null`, determinismo.
  - `reduce`: dirección/180°, wrap, movimiento sin comer, comer correcta/incorrecta,
    crecimiento, vidas, racha, `facil`/`dificil`, choque/respawn, gameover,
    `next`/`complete`, pausa/reanudación, acciones inválidas.
  - `pendingCurrent` y `summarize` en ambos modos.
- **AC cubiertos:** AC-3, AC-4, AC-7, AC-8, AC-10, AC-11, AC-12, AC-13, AC-14 (pruebas).
- **Contexto:** spec §6 completo; `docs/testing.md` (seeds fijos, sin flaky).
- **Done when:** todos los bloques ENTRADA/SALIDA de §6 cubiertos y en verde.
- **Estimate:** L.

### T3 — UI component + styles [depends: T1]
- [x] Deliverable: `src/games/serpiente-significados/SerpienteSignificados.jsx`,
  `index.jsx` y estilos `.serpiente-*` en `src/ui/tokens.css`:
  - Setup: modo (Rondas/Supervivencia), dificultad (Tranquilo/Normal/Arcade),
    selector de rondas 4–10 default 8 solo en Rondas, nota de tablero/velocidad,
    `SoundToggle`, «Empezar» y «Salir»; estado seguro si el deck no alcanza.
  - HUD: modo, ronda/carta X de N, vidas (corazones + texto), puntos/longitud,
    racha, pausa, `SoundToggle`, salir.
  - Prompt: `CardImage` + `front` completo + 🔊 «Pregunta».
  - Tablero DOM cuadrado: rejilla CSS, serpiente, 3 manzanas numeradas; leyenda
    inferior número→back con color, estado y 🔊 por fila.
  - D-pad 4 botones (visible ≤767 px), feedback con `aria-live`, overlay de pausa,
    resumen adaptado al modo, replay y salida.
  - Emisión `onGrade(cardId, grade)` con guard `seq`; `pendingCurrent` + `onExit`
    al salir; reset de guards en start/replay.
  - Layout sin scroll horizontal a 360 px; textos con `overflow-wrap:anywhere` y
    `hyphens:auto`; targets ≥44 px.
- **AC cubiertos:** AC-3, AC-4, AC-5, AC-6, AC-14, AC-15 (UI), AC-18 (render).
- **Contexto:** contrato de props; `CardImage`; `SoundToggle`; patrón
  `LluviaMeteoros.jsx`/`ConectaPares.jsx`; tokens.css.
- **Done when:** flujo completo jugable con mouse+teclado; tablero/leyenda visibles;
  sin imports prohibidos; lint 0.
- **Estimate:** L.

### T4 — Engine, pause, collision and feedback [depends: T3]
- [x] Deliverable: integración en `SerpienteSignificados.jsx`:
  - `createEngine` como único loop rAF; acumulador en ref; máximo un paso por tick
    al alcanzar `stepMs`; sin setState a 60 fps.
  - Dirección por teclado (flechas/WASD) y D-pad; bloqueo de 180°; preventDefault.
  - `pause` manual y `visibilitychange=hidden`; overlay «Continuar»; se conservan
    posición, vidas, manzanas y feedback pendiente.
  - Feedback de acierto `FEEDBACK_MS` con avance automático; fallo/choque sin timer
    (continúa la ronda).
  - `engine.stop()` al completar/gameover/desmontar; `stopSpeech()` en pausa/salida.
  - `prefers-reduced-motion`: sin animaciones decorativas; mismas reglas.
- **AC cubiertos:** AC-9, AC-10 (timer), AC-11 (vidas), AC-12 (respawn), AC-17
  (reduced motion).
- **Contexto:** `src/core/engine/engine.js`; patrón de pausa/visibilidad de
  `LluviaMeteoros.jsx`; presupuesto de rendimiento.
- **Done when:** no hay doble paso por tick, la pausa conserva el estado y no hay
  setState tras unmount.
- **Estimate:** M.

### T5 — TTS + accessibility behavior [depends: T3, T4]
- [x] Deliverable: integración en `SerpienteSignificados.jsx`:
  - `speak(front)` al iniciar ronda; `speak(back)` al comer; anuncio de choque/fin;
    🔊 «Pregunta» y 🔊 por fila de leyenda; `<SoundToggle />` en setup, partida y
    resumen; controles ocultos sin `speechSynthesis`; mute respetado.
  - `aria-live="polite"` con ronda, resultado, vidas y fin, sin mensajes obsoletos.
  - Foco predecible en pausa/resumen; botones nativos; D-pad con labels; targets
    ≥44 px; estado por color + número + texto.
  - La leyenda expone número, significado completo y estado.
- **AC cubiertos:** AC-16, AC-17.
- **Contexto:** `src/core/audio/tts.js`; `SoundToggle`; patrón TTS de
  `LluviaMeteoros.jsx`; `docs/manual-a11y-checklist.md`.
- **Done when:** TTS y foco funcionan sin ratón; sin soporte de voz el juego sigue
  100% jugable.
- **Estimate:** M.

### T6 — Registry: serpiente-significados → available [depends: none]
- [x] Deliverable: `src/games/registry.js` + `src/games/registry.test.js`
  (+ ajuste en `src/views/TopicView.test.jsx` si aplica):
  - `serpiente-significados` con `status:'available'`, `minCards:4` y
    `load: () => import('./serpiente-significados/index.jsx')`.
  - Tests: 8 `available`, 2 `soon`, catálogo 10, `load()` resuelve, metadata.
  - TopicView habilita el juego con temas de ≥4 cartas.
- **AC cubiertos:** AC-1, AC-2 (metadata/gate).
- **Contexto:** registry actual; `getGameAvailability`; tests de registry/TopicView.
- **Done when:** `getGame('serpiente-significados')` correcto y counts actualizados.
- **Estimate:** S.

### T7 — UI, a11y and isolation tests [depends: T3, T4, T5, T6]
- [x] Deliverable:
  - `src/games/serpiente-significados/SerpienteSignificados.test.jsx`: setup
    defaults; cambio de modo; `selectCards`; render prompt + `CardImage`; 3 manzanas
    numeradas + leyenda; acierto/fallo/choque con ticks; pausa; gameover; complete;
    replay; salida solo carta actual; estados seguros; D-pad.
  - `src/games/serpiente-significados/SerpienteSignificados.a11y.test.jsx`:
    `aria-live` sin stale, labels de D-pad/leyenda, teclado, foco, targets,
    wrap, reduced motion, TTS oculto sin soporte.
  - `src/games/serpiente-significados/serpiente-significados.isolation.test.js`:
    regex sin `storage|parser|content|router`; sin `localStorage|indexedDB|fetch(`;
    props `deck/selectCards/onGrade/onExit`; lógica sin imports.
- **AC cubiertos:** AC-3, AC-4, AC-5, AC-6, AC-9, AC-16, AC-17, AC-18.
- **Contexto:** patrones de tests de lluvia/conecta; `src/test/render.jsx`;
  `docs/manual-a11y-checklist.md`.
- **Done when:** suites propias en verde; sin violaciones de a11y en el componente.
- **Estimate:** L.

### T8 — GameHost integration tests [depends: T1, T3, T4, T5]
- [x] Deliverable: ampliar `src/views/GameHost.test.jsx`:
  - `serpiente-significados` carga con `deck`, `selectCards`, `onGrade`, `onExit`.
  - `selectCards` prioriza no aprendidas (patrón existente, con `Math.random` fijado).
  - Sesión: `facil`, `dificil` y `otra-vez` persisten SRS + XP + history; idéntico
    tras remount.
  - Salida a mitad de ronda → solo la carta actual `otra-vez`; resueltas no se
    re-emiten.
  - Game over por vidas → no se califican rondas no mostradas.
- **AC cubiertos:** AC-20.
- **Contexto:** tests de integración de lluvia/conecta; `loadSrs`; `createStore`;
  `loadCatalog`.
- **Done when:** asserts de persistencia y salida en verde; juegos existentes sin
  regresiones.
- **Estimate:** M.

### T9 — Docs + adversarial verify + DoD [depends: all]
- [x] Deliverable:
  - `specs/roadmap-games.md` → `serpiente-significados` spec-11
    aprobada/available; catálogo completo.
  - `docs/manual-a11y-checklist.md` → sección «Serpiente de significados».
  - `MEMORY.md` → decisiones spec-11 (modos, vidas, tableros, leyenda, choque,
    grados, TTS).
  - `FOCUS.md` → objetivo activo spec-11 y siguiente paso.
  - `tasks.md` → estado final; archivar como
    `specs/tasks-11-serpiente-significados.md` al cerrar.
  - Verificación adversaria AC-1..AC-21; `npm test` 100%, `npm run lint` 0,
    `npm run build` OK; diff revisado por humano.
- **AC cubiertos:** AC-21.
- **Contexto:** spec §5 ACs; `docs/testing.md`; `docs/security.md`; skill `impeccable`.
- **Done when:** gates al 100%, verificador sin bloqueantes y Eduardo aprueba el diff.
- **Estimate:** S.

## Sizing / execution flow
- Scope: subsistema único FE (9 tareas: lógica + UI + engine + TTS/a11y + registry +
  tests + docs).
- Mode: single-agent secuencial; T6 puede ir en paralelo con T1–T5.
- Sequential chains: T1 → T2; T1 → T3 → T4 → T5 → T7; T6 → T7; T7 → T8;
  T2 + T6 + T7 + T8 → T9.
- Estimate: T1 L, T2 L, T3 L, T4 M, T5 M, T6 S, T7 L, T8 M, T9 S.
- Out of scope respected: sin nuevas deps, sin SFX, sin multiplayer, sin cambios en
  `src/core/**` ni `GameHost.jsx`.

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-20 (decisiones: 5 vidas; choque −1 vida y
  respawn; modos Rondas/Supervivencia con puntuación puntos/longitud; tableros
  13/15/17 móvil y 15/20/20 desktop; D-pad móvil + teclado desktop; manzanas
  numeradas 1–3 + leyenda; TTS del significado al comer; `minCards:4`; sin
  dependencias nuevas).

## Cierre (T9)

- Verificación adversaria AC-1..AC-21: **PASS** (revisión interna; aprobación humana
  pendiente).
  - Correcciones: mensaje exacto de AC-4; HUD con texto visible «Vidas: X/5»; estado
    de leyenda con icono + texto; nota de setup con modo/cartas reales y
    `selectCards(20)` en Supervivencia; tests de gate en TopicView/GameHost;
    `serpiente-significados.isolation.test.js`; diálogo de pausa con `role="dialog"`,
    `Escape` y focus trap.
- Gates finales: `npm test` 523/523 (56 files), `npm run lint` 0,
  `npm run build` OK (solo warning preexistente de chunk >500 kB).
- Docs sincronizadas: `specs/roadmap-games.md`, `docs/manual-a11y-checklist.md`,
  `MEMORY.md`, `FOCUS.md` y `tasks.md`.
- Residuales aceptados, no bloqueantes: checklist manual 360px/VoiceOver pendiente de
  humano; warnings `act(...)` y de chunk preexistentes; el aislamiento escanea imports
  directos; el TTS de gameover no tiene aserción unitaria específica (sí el de choque).
- Pendiente: aprobación humana del diff (Eduardo); sin commit hasta que lo pida.
