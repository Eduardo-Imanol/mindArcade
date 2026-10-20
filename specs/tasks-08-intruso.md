# tasks.md — intruso (COMPLETED 2026-10-19)

> Archived at `specs/tasks-08-intruso.md` after DoD. Derived from
> `specs/spec-08-intruso.md`. Signed by Eduardo: `APPROVED spec-08 + tasks`.
> Previous increment archived at `specs/tasks-06-quiz-significado.md` (T8 `[~]` — pendiente
> revisión humana del diff de spec-06). Roadmap of games: `specs/roadmap-games.md`.
> TTS mandatory (spec-03 AC-12). `caza-significados` (spec-07) conserva su idea original.

## Dependency graph

```
T1 intruso.logic.js (puro) ──► T2 logic tests ──► T4 Intruso.jsx + CSS
T3 availability.js + tests ──► T5 GameHost (groups/topicId/gate) ──► T7 TopicView
T1 ──► T4 ──► T6 registry available
T4 + T6 ──► T8 UI + a11y + isolation tests
T4 + T5 ──► T9 GameHost integration tests
T1..T9 ──► T10 docs + adversarial verify + DoD + human diff
```

Pure logic and the availability gate first, then UI, host, registry, views, tests, docs, verify.

## Tasks

### T1 — Pure intruder logic [depends: none]
- [x] Deliverable: `src/games/intruso/intruso.logic.js` — reducer puro SIN imports de core:
  - `MIN_ROUNDS=3`, `MAX_ROUNDS=10`, `DEFAULT_ROUNDS=10`, `BASE_OPTIONS=3`, `PHASES`.
  - `normalizeBack(text)` (trim + NFD strip diacritics + lower) para dedupe.
  - `buildRound({ anchor, others, random, used })` → 3 bases del ancla con backs únicos + 1 intrusa de otro tema, 4 opciones barajadas con clave `topicId:cardId`; anti-repetición de intrusa; fallback 3 opciones si el ancla solo tiene 2 backs únicos.
  - `buildSession({ groups, anchorTopicId, rounds, random })` → rondas construibles, `min(pedidas, construibles)`, determinista con `random` fijo.
  - `createState()` fases `setup|playing|answered|complete`.
  - `reduce(state, action)`: `start { groups, anchorTopicId, rounds, random }`, `choose { optionKey }` (un intento), `next`, `reset`.
  - `gradeFor(correct)` → `facil|otra-vez`.
  - `currentRound(state)`, `pendingCurrent(state)` (solo ronda actual sin responder), `summarize(state)`, `optionKey`.
- Covers: AC-4, AC-5 (lógica), AC-6, AC-7 (lógica), AC-8
- Context needed: spec §2 HU-2/HU-3, §4 restricciones; patrón `quiz-significado.logic.js`
- Done when: secuencia completa determinista con `random` fijo; 3+1 por ronda; grades y pendiente actual verificados; sin imports prohibidos

### T2 — Logic test suite [depends: T1]
- [x] Deliverable: `src/games/intruso/intruso.logic.test.js` — contrato §6 completo:
  - Sesión 3+1 determinista con `random` fijo; 3 bases del ancla + intrusa de otro tema; opciones únicas y barajadas.
  - Anti-repetición de intrusa y fallback cuando se agotan candidatas.
  - Ancla con 2 backs únicos → 3 opciones; ancla insuficiente/sin candidata → sin ronda, sin error.
  - Acierto → `facil`; fallo → `otra-vez`; un solo intento; `lastGrade` con `topicId` del intruso.
  - `pendingCurrent` solo ronda actual; `summarize`; `reset` limpia.
- Covers: AC-4, AC-6, AC-7 (pruebas), AC-8 (pruebas)
- Context needed: spec §6; `docs/testing.md` (seeds fijos, sin flaky)
- Done when: todos los bloques ENTRADA/SALIDA de §6 cubiertos y en verde

### T3 — Availability helper + tests [depends: none]
- [x] Deliverable: `src/games/availability.js` + `src/games/availability.test.js`:
  - `getGameAvailability(game, { topic, topics })` → `{ playable, reason: 'ok'|'soon'|'min-cards'|'min-topics', minCards, minTopics, minCardsPerTopic, eligible }`.
  - `availabilityMessage(availability)` → «Próximamente» / «Necesitas al menos N cartas» / «En mantenimiento · agrega otro tema con al menos N cartas».
  - Tests: soon; ancla < minCards; 1 tema con 3; 2 temas con 2; 2 temas con 3; juego sin `minTopics`; catálogo vacío.
- Covers: AC-1 (metadata), AC-2, AC-3 (mensaje)
- Context needed: spec AC-1/AC-2/AC-3; reglas `minCards` de spec-02
- Done when: helper puro 100% cubierto y mensajes estables

### T4 — UI component + styles [depends: T1]
- [x] Deliverable: `src/games/intruso/Intruso.jsx` + `index.jsx` + estilos `.intruso-*` en `src/ui/tokens.css`:
  - Setup: selector nativo de rondas 3–10 (default 10), explicación 3+1, `SoundToggle`, «Empezar», «Salir»; estado seguro si `groups`/ancla insuficientes.
  - Ronda: header (ronda X de N, `SoundToggle`, «Salir»); prompt «¿Cuál no pertenece al tema «<título>»?» + «🔊 Pregunta»; grid 2×2 de opciones con `CardImage` (`alt=""`) + `back`; un intento; incorrecta roja/deshabilitada; intrusa verde; feedback con tema de la intrusa + «🔊 Intruso» + «Siguiente».
  - Resumen: aciertos/total, fallos, XP (10/0), «Jugar de nuevo», «Volver al tema», `SoundToggle`.
  - TTS: `speak(prompt)` al iniciar ronda (tras gesto), `speak(back)` al pulsar opción, «🔊 Intruso», `stopSpeech()` al desmontar; controles ocultos sin soporte.
  - Emisión `onGrade(cardId, grade, { topicId })` por ronda con patrón seq; `pendingCurrent` + `onExit` al salir; guard de emisión única.
- Covers: AC-3 (UI), AC-4 (UI), AC-5, AC-7 (emisión), AC-8, AC-9, AC-10, AC-11 (render)
- Context needed: contrato de props; `CardImage`; `tts.js`; `SoundToggle`; `QuizSignificado.jsx` (fases, seq, salida); tokens.css
- Done when: flujo completo jugable con mouse+teclado; 2×2 a 360px sin scroll horizontal; sin imports prohibidos; lint 0

### T5 — GameHost: groups + topic-aware grade + gate [depends: T3, T4]
- [x] Deliverable: `src/views/GameHost.jsx`:
  - `groups` desde `loadCatalog()` (solo temas con ≥`minCardsPerTopic`/`minCards`), con overrides de imagen aplicados; incluye el ancla.
  - Guard de `getGameAvailability` antes de cargar; pantalla segura de mantenimiento/`min-cards` en acceso directo.
  - Props aditivas `groups` y `anchorTopicId` al componente; `deck`/`selectCards` intactos.
  - `onGrade(cardId, grade, context?)`: usa `context.topicId` validado contra el catálogo o el ancla como fallback; SRS y history bajo ese tema; XP/racha sin cambios.
  - Sin cambios en `src/core/`.
- Covers: AC-2 (integración), AC-3, AC-7 (persistencia), AC-12
- Context needed: `GameHost.jsx` actual; `applyGrade`; `createStore().addAttempt`; spec §4
- Done when: flashcards/memorama/ahorcado/quiz sin regresiones; gate y grade multi-tema funcionan

### T6 — Registry: intruso → available [depends: T4]
- [x] Deliverable: `src/games/registry.js` + `src/games/registry.test.js`:
  - `intruso` con `status:'available'`, `minCards:3`, `minTopics:2`, `minCardsPerTopic:3`, `load: () => import('./intruso/index.jsx')`.
  - Tests: 5 `available`, 5 `soon`, catálogo 10, `load()` resuelve, metadata del gate.
- Covers: AC-1
- Context needed: registry actual; spec AC-1
- Done when: `getGame('intruso')` correcto y el resto del catálogo intacto

### T7 — TopicView maintenance/unlock [depends: T3, T6]
- [x] Deliverable: `src/views/TopicView.jsx` + `src/views/TopicView.test.jsx`:
  - Usar `getGameAvailability` + `availabilityMessage`; `intruso` deshabilitado con mensaje de mantenimiento cuando falta el segundo tema; habilitado cuando hay ≥2 temas con ≥3 cartas.
  - Tests actualizados (con builtin + custom) y nuevo caso de desbloqueo con dos temas elegibles.
- Covers: AC-3
- Context needed: `TopicView.jsx`; helper T3; catálogo builtin+custom
- Done when: label «En mantenimiento» y enlace se alternan según el gate; otros juegos sin cambios

### T8 — UI, a11y + isolation tests [depends: T4, T6]
- [x] Deliverable:
  - `src/games/intruso/Intruso.test.jsx`: setup 3–10 default 10; ronda 3+1; acierto/fallo; feedback con tema; resumen; salida solo ronda actual; replay.
  - `src/games/intruso/Intruso.a11y.test.jsx`: select nativo etiquetado, botones nativos, `aria-label` por opción, `aria-live` sin stale, foco visible, 2×2/360px, reduced motion, TTS oculto sin soporte.
  - `src/games/intruso/intruso.isolation.test.js`: regex sin `storage|parser|content|router`; sin `localStorage|indexedDB|fetch(`; props `groups/anchorTopicId/onGrade/onExit`; lógica sin imports.
- Covers: AC-4, AC-5, AC-9, AC-10, AC-11, AC-12
- Context needed: patrón `QuizSignificado.test.jsx`/`a11y.test.jsx`; `quiz-significado.isolation.test.js`; `docs/manual-a11y-checklist.md`
- Done when: suites propias en verde; sin violaciones de a11y en el componente

### T9 — GameHost integration tests [depends: T4, T5]
- [x] Deliverable: ampliar `src/views/GameHost.test.jsx`:
  - `intruso` recibe `groups` con ≥2 temas elegibles y overrides de imagen; ancla correcta.
  - Sesión: grade `facil`/`otra-vez` persiste SRS + history **en el tema de la intrusa**, XP/racha, idéntico tras remount.
  - Salida a mitad de ronda → solo la intrusa actual `otra-vez`; resueltas no se re-emiten.
  - Gate bloqueado (fixture con ancla de 2 cartas) → pantalla de mantenimiento, sin cargar el juego.
- Covers: AC-2, AC-3, AC-7, AC-8, AC-12
- Context needed: tests de integración de quiz; `loadSrs`; `createStore`; `loadCatalog`
- Done when: asserts multi-tema en verde; juegos existentes sin regresiones

### T10 — Docs + adversarial verify + DoD [depends: all]
- [x] Deliverable:
  - `specs/roadmap-games.md` → `intruso` spec-08 aprobada + gate 2×3; `caza-significados` intacta.
  - `docs/manual-a11y-checklist.md` → sección «El intruso».
  - `MEMORY.md` → decisiones arquitectónicas spec-08 (groups, topic-aware grade, gate, TTS).
  - `FOCUS.md` → objetivo activo spec-08 y siguiente paso.
  - `tasks.md` → estado final y nota de archivo de spec-06.
- Verificación 2026-10-19: verificador adversarial AC-1..AC-14 **PASS**, 0 bloqueantes; `npm test` 296/296 (43 files); `npm run lint` 0; `npm run build` OK (solo warning preexistente de chunk >500 kB); revisión técnica del diff completa. Checklist manual a11y en navegador (360px + lector de pantalla) queda pendiente de ejecución humana y no bloquea el cierre técnico.
- Covers: AC-13, AC-14
- Context needed: spec §5 ACs, `docs/testing.md`, `docs/security.md`
- Done when: gates al 100%, verificador sin bloqueantes, Eduardo aprueba el diff ✅ 2026-10-19

## Sizing / execution flow
- Scope: subsistema único FE (10 tareas: lógica + gate + UI + host + registry + views + tests + docs)
- Mode: single-agent secuencial; T3 puede ir en paralelo con T1/T2
- Sequential chains: T1 → T2 → T4 → T6 → T8; T3 → T5 → T9; T3 → T7; T10 al final
- Estimate: T1 M, T2 S, T3 S, T4 L, T5 M, T6 S, T7 S, T8 M, T9 M, T10 S
- Out of scope respected: sin nuevas deps, sin SFX, sin cronómetro, sin juegos 6/8–10, sin cambios en `src/core/`

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-19 (decisiones: ID `intruso`/«El intruso»; 3+1 significados; gate 2 temas × ≥3 cartas; un intento con grade en el tema de la intrusa; rondas 3–10 default 10; TTS; `caza-significados` spec-07 intacta).
