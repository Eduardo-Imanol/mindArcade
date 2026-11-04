# Testing

- Runner: Vitest. Logic tests use fixed seeds/dates (`now` passed explicitly), no randomness.
- Scope spec-01: parser, SM-2/Elo, XP/streak, engine state machine.
- spec-21: `exercises.test.js`, `functions-exercises.test.js`, `exerciseProgress.test.js`,
  `exerciseStore.test.js`, `sandbox.test.js`, `CodeEditor.test.jsx`,
  `CodeGameShell.test.jsx`, `OrdenaCodigo.test.jsx`, `CompletaCodigo.test.jsx`,
  `EscribeCodigo.test.jsx` y pruebas de integración/aislamiento para los 3 juegos.
- Done = 100% tests + eslint/prettier clean (see `docs/security.md` for persistence tests).

## spec-12 (implemented; human sign-off pending)

Cover these contracts:

- **Parser**: topic description is returned complete (no 160-char slice), multi-paragraph,
  headings/code/card lines excluded; empty description stays `''`.
- **Content**: `ensureTopicMeta` persists `addedAt` once in `sepect.topics.meta.v1`;
  corrupt/quota-safe fallback; `topicCoverCard` prefers first card with explicit image.
- **Learning**: `new` (no state or `reps=0`), `learning` (`reps 1–2`), `learned`
  (`reps >= 3`), including invalid `reps`.
- **Selection**: `selectStudyCards` returns unlearned cards first, then learned cards
  with `nextReview <= now` ordered by `nextReview`; never not-due learned cards; honors
  `count` and a deterministic `random`.
- **Metrics**: exact fixtures for per-topic and global totals, `progress`, `daysStudied`,
  `accuracy`, XP (old attempts derive `facil=10`, `dificil=25`, `otra-vez=0`), UTC day
  keys, 14-day activity with zero days, empty/corrupt history.
- **GameHost/availability**: legacy mode keeps study-eligible cards; with `decks`,
  every deck contains all cards in its range, per-deck `minCards` gates the picker
  and «Todo al día» never blocks play. `intruso` uses the selected deck as anchor
  and other-topic groups as distractors.
- **Registry**: `defineGame` freezes definitions; 8 available games; reuse matrix with
  two different decks; no hardcoded «Funciones» text in `src/games/**`.
- **Views**: hub header without «Sepect», search/sort/filter helpers, topic covers,
  full description without `line-clamp`, game tiles without descriptions, dashboard
  KPIs/activity/empty states, `#/progreso` route.
- **a11y**: `role="progressbar"` with `aria-valuenow`, native controls, labels, focus;
  `TopicsHub.a11y.test.jsx`, `TopicView.a11y.test.jsx`, `Dashboard.a11y.test.jsx`
  cover accessible names, 44 px target CSS, no description truncation, responsive
  360 px reflow regexes and `prefers-reduced-motion`; the no-horizontal-scroll check
  is completed by a human via `docs/manual-a11y-checklist.md`.
- **Hub meta**: `TopicsHub` calls `ensureTopicMeta` so built-in topics persist their
  first-seen `addedAt` (test: stable across remounts).

## spec-18 (implementada; manual + firma pendientes)

- **Core puro**: `decks.test.js` cubre bloques 1–10/11–20/parcial, `studied`,
  `pending`, `complete`, alias legacy, SRS inválido, `reps=0`, vencidas, mazo vacío
  y determinismo. `arcade.test.js` cubre 3 vidas, puntuación `100 + min(100, 10*racha)`,
  reinicio de racha, fin a 0 vidas, bonus `50*vidas`, no puntuar tras `over` y snapshot.
- **Récords**: `arcadeStore.test.js` cubre round-trip en `sepect.arcade.v1`, best/
  `isRecord`, tope de 20, JSON corrupto, cuota llena, runs inválidos y que SRS/profile
  no se tocan.
- **UI compartida**: `DeckPicker.test.jsx` y `ArcadeHud.test.jsx` cubren etiquetas de
  dominio, best, selección/disabled, teclado, `aria-pressed` y `aria-live`.
- **Host**: `GameHost.test.jsx` cubre mazos con todas las cartas + overrides, `best`,
  `onArcadeEnd`, mazo insuficiente, repaso con todo aprendido y compatibilidad legacy.
- **Juegos**: `*.decks.test.jsx` (8 juegos) cubren picker, mazo seleccionado, rondas
  capadas, arcade, vidas, grading, resumen, bonus y que no se mezclan cartas; los
  `*.isolation.test.js` siguen verificando que no importan storage/router/parser.
- **Integración de dominio**: `TopicView.decks.test.jsx` juega un mazo real en
  Flashcards y verifica perfecto → `Repasar`, fallo → `No aprendida`; `topicDecks.test.js`
  cubre el resumen, el mejor récord por juego y entradas vacías. `TopicView.test.jsx`
  y `TopicView.availability.test.jsx` cubren disponibilidad por mazo y AC-31.
- **a11y/perf**: `spec18-a11y.test.js` verifica targets ≥44 px, foco, wrap a 360 px,
  HUD envuelto, región live oculta, acciones del resumen y reduced-motion;
  `ArcadeSummary.test.jsx` cubre el anuncio atómico y los contadores;
  `Ahorcado.decks.test.jsx` comprueba que las vidas se anuncian una sola vez.
  La pasada humana 360 px/VoiceOver queda registrada en
  `docs/manual-a11y-checklist.md`.

## spec-14 (implementada; revisión de diff pendiente)

- **Arte por tema**: `scripts/generate-topic-art.test.mjs` descubre todos los
  `src/content/topics/*.md` y valida cobertura de sketches, huérfanos de sketch y de
  SVG, paridad assets↔cartas, calidad accesible (512×512, `role="img"`, `<title>`,
  `aria-label`, <200 KB), determinismo byte a byte y el ciclo de `generateArt`
  (escribe, omite sin `--force`, reporta faltantes). Sin números ni temas fijos.
- **Fixtures**: el mismo archivo se ejecuta con un tema y con dos temas sintéticos en
  un directorio temporal, y comprueba que un asset ausente, un SVG sobrante, un
  sketch huérfano o una carta sin sketch se reportan con tema y carta.

## spec-23 (integración y hardening; manual + firma pendientes)

- **Rutas**: `src/app/routes.integration.test.jsx` cubre las 8 rutas (`#/`,
  `#/categoria/:id`, `#/tema/:id`, `#/tema/:id/fuente`, `#/tema/:id/juego/:gameId`,
  `#/progreso`, `#/configuracion`, `#/personalizados`) con deep link,
  hashchange/atrás, recarga y storage corrupto; `router.test.js`/`title.test.js`
  fijan la tabla de rutas y el `document.title`.
- **Storage**: `src/core/storage/integration.test.js` verifica compatibilidad de
  `sepect.srs.v1`, `sepect.profile.v1`, `sepect.settings.v1`, `sepect.arcade.v1`,
  `sepect.topics.custom.v1` y la convivencia aislada de `sepect.exercises.v1` sin
  duplicar dominio; JSON corrupto, cuota llena y custom topics sin source no rompen.
- **Pantalla mínima**: `SettingsView.test.jsx` prueba el resumen de solo lectura
  (compara el storage antes/después) y el fallback sin voz; `SettingsView.a11y.test.jsx`
  fija el contrato (un `h1`, `nav` etiquetada, dos secciones con `aria-labelledby`,
  un único `role="status"`, targets ≥44 px, `overflow-wrap`, rejilla a 479 px, foco
  visible y sin animaciones).
- **Matriz de juegos**: 11 juegos (8 cartas + 3 código) cubiertos por
  `*.decks.test.jsx`, `*.a11y.test.jsx`, `*.isolation.test.js`, `universal-exercises`,
  `CodeGameShell` y `GameHost.category/exercises`; ver `docs/evidence/spec-23-integracion-hardening.md`.
- **Bundle/perf**: build de producción deja sources/ejercicios en chunks lazy; los
  tests de `sources`/`exercises` comprueban `import.meta.glob` sin `eager`; `engine`,
  pausa en `hidden`, isolation de juegos, TTS y sandbox cubren limpieza sin huérfanos.
- **Gate manual**: la pasada real a 360 px con teclado/VoiceOver queda en
  `docs/manual-a11y-checklist.md` y la firma del humano.
