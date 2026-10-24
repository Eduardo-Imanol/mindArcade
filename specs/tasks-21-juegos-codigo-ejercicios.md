# tasks-21 — juegos-codigo-ejercicios

> Derivado de `specs/spec-21-juegos-codigo-ejercicios.md` (**firmada 2026-10-23**).
> Lista para implementar.
> Depende de `spec-17` (categorías/módulos), `spec-18` (mazos/dominio/arcade),
> `spec-19` (parser Markdown) y `spec-20` (juegos por categoría).
> Sin dependencias nuevas.

## Objetivo del incremento

Tres juegos de código para Programación + 6 ejercicios universales por mazo en
Markdown estricto, jugables en los tres juegos y en Normal/Arcade, con dificultad
Fácil 2 / Medio 4 / Difícil 6, progreso por ejercicio y nivel de mazo completado.
Sandbox real para JavaScript y TTS en todos.

## Grafo de dependencias

```
Fase A — Contrato
T1 parser/schema/validador/manifiesto
├── T2 progreso puro + storage
├── T3 sandbox
│   └── T4 editor
└── T9..T18 contenido (un mazo por tarea)

T1 + T2 + T3 + T4
└── T5 shell común
    ├── T6 ordena
    ├── T7 completa
    └── T8 escribe

T5..T8 + T9..T18
└── T19 registry/GameHost/TopicView
    └── T20 CSS/a11y/TTS
        └── T21 docs + gates + cierre
```

Cadenas críticas:

- `T1 → T5 → T6/T7/T8 → T19 → T20 → T21`
- `T1 → T2 → T5`
- `T1 → T9..T18 → T19`
- `T3 → T4 → T5/T8`

---

## Fase A — Contrato, formato y progreso

### T1 — Parser Markdown, esquema, validador y manifiesto [depends: none]
- [ ] **Deliverable:** `src/core/exercises/parse.js`:
  - `parseExercisesMarkdown(md, { topicId })` → `{ topicId, decks, errors }`;
  - reutiliza el parser de bloques de spec-19 (`src/core/content/markdown.js`) sin
    dependencias nuevas;
  - lee `Tema`, `Mazo`, `E`, `Cartas`, `Prompt`, `Lenguaje`, `Solución`, `Starter`,
    `Plantilla`, `Blanks`, `Función`, `Casos` y `Piezas` opcional;
  - exige que `Tema` coincida con el `topicId` solicitado; el manifiesto verifica
    además que el nombre del archivo sea `<topicId>.md`;
  - deriva `pieces` de las líneas de `solution` cuando no se declaren, con IDs
    únicos y estables;
  - errores acumulados, sin lanzar excepciones.
- [ ] **Deliverable:** `src/core/exercises/schema.js`:
  - tipos `Exercise`, `ExerciseDeck`, `ExerciseDocument`;
  - `validateExercises(topicId, data, { cards, decks })` → `{ ok, errors }`;
  - 10 mazos, 6 ejercicios universales por mazo, IDs únicos, `cardIds` del mazo;
  - `language: 'javascript'`, `solution`, `starter`, `functionName`, `cases`,
    `template`, `blanks`;
  - piezas con IDs únicos reconstruyen la solución; plantilla + blanks coincide con
    la solución normalizada; blanks con IDs únicos y respuesta no vacía;
  - `functionName` identificador seguro; `cases` no vacíos.
- [ ] **Deliverable:** `src/core/exercises/select.js`:
  - `EXERCISE_COUNTS = { facil: 2, medio: 4, dificil: 6 }`;
  - `selectExercises(data, deckNumber, { count, progress })` con pendientes primero;
  - `countExercises(data, deckNumber)`;
  - `exercisesForDifficulty(data, deckNumber, difficulty, progress)`;
  - `hasExerciseDocument(topicId)`.
- [ ] **Deliverable:** `src/content/exercises/index.js`:
  - glob lazy de `**/*.md` con `?raw`;
  - `hasExercises(topicId)`, `loadExercises(topicId)`;
  - normalización/validación de path.
- [ ] **Tests:** `exercises.test.js`:
  - documento mínimo válido;
  - falta de mazo/ejercicio/campo;
  - carta futura/otro mazo;
  - IDs duplicados;
  - blanks/piezas/plantilla/casos inválidos;
  - path traversal;
  - `null` para tema sin manifiesto;
  - 6 ejercicios sin reparto 2/2/2.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6.
- **Contexto:** spec §Decisiones 1–3 y formato Markdown; `buildDecks`.
- **Done when:** el contenido se puede validar antes de publicarse y no hay tipos de
  ejercicio que limiten los juegos.
- **Estimate:** L.

### T2 — Progreso de ejercicios: estados, nivel y storage [depends: T1]
- [ ] **Deliverable:** `src/core/exercises/mastery.js`:
  - `exerciseStatus(entry)` → `no-intentado | en-progreso | aprendido`;
  - `deckExerciseMastery(deckNumber, exercises, progress)` →
    `{ status: no-iniciado|en-progreso|completado, done, total, learnedIds }`;
  - `recordExerciseAttempt(progress, { topicId, deckNumber, exerciseId, correct })`
    → progreso nuevo;
  - `pendingFirst(exercises, progress)` para la selección 2/4/6;
  - puro, sin storage ni DOM.
- [ ] **Deliverable:** `src/core/storage/exercises.js`:
  - clave `sepect.exercises.v1`;
  - `loadExerciseProgress()`, `saveExerciseProgress()`,
    `recordExerciseResult(run)`;
  - esquema `{ [topicId]: { [deckNumber]: { [exerciseId]: { attempts, correct,
    done, updatedAt } } } }`;
  - sanitización de IDs/fechas/booleanos; JSON corrupto → `{}`; cuota llena →
    `{ ok: false }` sin romper la partida;
  - no toca `sepect.srs.v1`.
- [ ] **Tests:** `exerciseProgress.test.js` y `exerciseStore.test.js`:
  - estados y transiciones;
  - `aprendido` solo con acierto;
  - nivel completado con 6/6 y no antes;
  - selección 2/4/6 con pendientes primero;
  - round-trip, corrupción, cuota, aislamiento de SRS;
  - completar los 6 en distintos juegos/sesiones.
- **AC cubiertos:** AC-19, AC-20, AC-21, AC-22, AC-23.
- **Contexto:** spec §Decisiones 4–7; `store.js` como referencia de cuota.
- **Done when:** el nivel de ejercicios puede calcularse y persistirse sin duplicar
  el dominio de cartas.
- **Estimate:** M.

---

## Fase B — Ejecución, editor y shell

### T3 — Sandbox de ejecución [depends: none]
- [ ] **Deliverable:** `src/core/code/sandbox.js`:
  - `buildSandboxHtml()` con CSP;
  - `runCode({ code, functionName, cases, timeoutMs = 2000 })` crea/reutiliza un
    iframe con `sandbox="allow-scripts"` y `srcdoc`;
  - protocolo `postMessage` con id de petición;
  - timeout, cleanup y errores de sintaxis;
  - comparación profunda JSON;
  - fallback `{ ok: false, error: 'sandbox-unavailable' }` sin iframe.
- [ ] **Tests:** `sandbox.test.js`:
  - HTML/CSP e inyección de `</script>`/HTML;
  - éxito/fallo de casos;
  - error de sintaxis;
  - timeout;
  - mensaje inesperado;
  - no red/storage;
  - fallback.
- **AC cubiertos:** AC-15, AC-16.
- **Contexto:** spec §Decisión 8.
- **Done when:** ejecutar una función no puede tocar la app ni colgarse.
- **Estimate:** M.

### T4 — Editor de código [depends: T3]
- [ ] **Deliverable:** `src/components/CodeEditor.jsx`:
  - textarea + números de línea;
  - tab → 2 espacios, `Ctrl/Cmd+Enter`;
  - `aria-label`, monoespaciado, sin dependencias;
  - valor/onChange controlados.
- [ ] **Tests:** `CodeEditor.test.jsx`:
  - escritura;
  - tab;
  - atajo;
  - label/teclado;
  - 360 px.
- **AC cubiertos:** AC-14.
- **Contexto:** spec §Decisión 9.
- **Done when:** el starter se puede editar y ejecutar con teclado.
- **Estimate:** S.

### T5 — Shell común de juegos de código [depends: T1–T4]
- [ ] **Deliverable:** `src/games/code-common/CodeGameShell.jsx`:
  - `GameSetup` + `DeckPicker` + dificultad 2/4/6 + modo Normal/Arcade;
  - TTS del prompt, mute global;
  - índice de ejercicios seleccionados, feedback, resumen;
  - progreso `X/6` y etiqueta «Nivel de ejercicios completado»;
  - grading una vez por `cardId` en el primer resultado: `facil`/`otra-vez`; los
    reintentos no re-gradúan;
  - arcade 3 vidas + `onArcadeEnd` con el set 2/4/6;
  - reintento normal sin vidas;
  - estados loading/error/vacío.
- [ ] **Deliverable:** `src/games/code-common/useCodeSession.js`:
  - selección de mazo/dificultad/ejercicio, aciertos, vidas, fin;
  - `onExerciseResult` y `onGrade` una vez por carta/sesión;
  - sin imports de storage/router/parser.
- [ ] **Tests:** `CodeGameShell.test.jsx`:
  - deck picker y dificultad 2/4/6;
  - normal/arcade;
  - TTS/mute;
  - progreso y nivel completado;
  - grading único;
  - arcade/onArcadeEnd;
  - resumen;
  - a11y.
- **AC cubiertos:** AC-7, AC-21, AC-22, AC-23, AC-26, AC-27.
- **Contexto:** spec §Decisiones 10–13; spec-18.
- **Done when:** los 3 juegos solo aportan su mecánica y comparten dificultad,
  progreso y arcade.
- **Estimate:** L.

---

## Fase C — Mecánicas de los tres juegos

### T6 — Juego Ordena el código [depends: T5]
- [ ] **Deliverable:** `src/games/ordena-codigo/OrdenaCodigo.jsx`:
  - banco/zonas, añadir/quitar, subir/bajar;
  - toque/clic/teclado;
  - comprobar por orden de IDs de `pieces`;
  - feedback + orden correcto si falla;
  - TTS.
- [ ] **Tests:** `OrdenaCodigo.test.jsx`:
  - cualquier ejercicio del mazo, no solo un tipo;
  - orden correcto/incorrecto;
  - líneas duplicadas con IDs únicos; IDs de pieza duplicados rechazados;
  - teclado;
  - arcade;
  - a11y.
- **AC cubiertos:** AC-7, AC-8, AC-9, AC-10.
- **Contexto:** spec HU-2; `pieces` universales.
- **Done when:** el ejercicio se resuelve y se registra su aprendizaje.
- **Estimate:** M.

### T7 — Juego Completa el código [depends: T5]
- [ ] **Deliverable:** `src/games/completa-codigo/CompletaCodigo.jsx`:
  - render de `template` con inputs en `{{blank-id}}`;
  - validación trim + alternativas;
  - feedback por blank;
  - teclado/foco;
  - TTS.
- [ ] **Tests:** `CompletaCodigo.test.jsx`:
  - cualquier ejercicio del mazo;
  - parseo de marcadores;
  - acierto/error/alternativas;
  - blanks múltiples;
  - teclado;
  - arcade;
  - a11y.
- **AC cubiertos:** AC-11, AC-12, AC-13.
- **Contexto:** spec HU-3; `template`/`blanks` universales.
- **Done when:** el código se completa sin romper el layout y sin depender del tipo.
- **Estimate:** M.

### T8 — Juego Escribe el código [depends: T5, T3, T4]
- [ ] **Deliverable:** `src/games/escribe-codigo/EscribeCodigo.jsx`:
  - prompt/starter/editor/ejecutar;
  - sandbox inyectable;
  - resultados por caso;
  - reintento normal;
  - TTS.
- [ ] **Tests:** `EscribeCodigo.test.jsx`:
  - cualquier ejercicio del mazo;
  - todos pasan;
  - fallo parcial;
  - sintaxis;
  - timeout;
  - fallback;
  - teclado/360 px;
  - arcade.
- **AC cubiertos:** AC-14, AC-15, AC-16, AC-17, AC-18.
- **Contexto:** spec HU-4; T3/T4.
- **Done when:** una función real se valida contra casos y el progreso se registra.
- **Estimate:** M.

---

## Fase D — Contenido universal (10 mazos × 6 ejercicios)

> Cada tarea entrega 6 ejercicios universales con `solution`, `starter`,
> `template`/`blanks`, `functionName` y `cases`. Validar con T1 antes de pasar al
> siguiente mazo. Las tareas comparten un único documento: pueden prepararse en
> borradores paralelos, pero se integran en orden T9→T18 y cada mazo se revisa antes
> de continuar. La comprobación cruzada de que cada ejercicio abre en los tres juegos
> se cierra en T19.
> El archivo de ejercicios usa el ID canónico
> `funciones-en-programacion.md`; el topic legacy conserva
> `funciones-programacion.md`.

### T9 — Contenido Funciones: mazo 1 [depends: T1]
- [ ] **Deliverable:** 6 ejercicios del mazo 1 en
  `src/content/exercises/programacion/funciones-en-programacion.md`.
- [ ] **Validación:** `validateExercises` OK; `cardIds` del mazo; conceptos sin
  futuros; sin dependencia de tipo. La apertura en los 3 juegos se valida en T19.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T10 — Contenido Funciones: mazo 2 [depends: T1, T9]
- [ ] **Deliverable:** 6 ejercicios del mazo 2.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T11 — Contenido Funciones: mazo 3 [depends: T10]
- [ ] **Deliverable:** 6 ejercicios del mazo 3.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T12 — Contenido Funciones: mazo 4 [depends: T11]
- [ ] **Deliverable:** 6 ejercicios del mazo 4.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T13 — Contenido Funciones: mazo 5 [depends: T12]
- [ ] **Deliverable:** 6 ejercicios del mazo 5.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T14 — Contenido Funciones: mazo 6 [depends: T13]
- [ ] **Deliverable:** 6 ejercicios del mazo 6.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T15 — Contenido Funciones: mazo 7 [depends: T14]
- [ ] **Deliverable:** 6 ejercicios del mazo 7.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T16 — Contenido Funciones: mazo 8 [depends: T15]
- [ ] **Deliverable:** 6 ejercicios del mazo 8.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T17 — Contenido Funciones: mazo 9 [depends: T16]
- [ ] **Deliverable:** 6 ejercicios del mazo 9.
- [ ] **Validación:** ídem.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Estimate:** L.

### T18 — Contenido Funciones: mazo 10 y cierre de contenido [depends: T17]
- [ ] **Deliverable:** 6 ejercicios del mazo 10; documento completo (60).
- [ ] **Validación:** `validateExercises` sobre los 10 mazos; revisión final;
  `functions-exercises.test.js` completo.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-6.
- **Done when:** los 60 ejercicios validan y quedan listos para la comprobación
  cruzada de T19.
- **Estimate:** L.

---

## Fase E — Integración, UI y accesibilidad

### T19 — Registro, disponibilidad, GameHost y TopicView [depends: T5–T18]
- [ ] **Deliverable:** `src/games/definition.js`:
  - `needsExercises?: boolean` (default `false`) y `minExercises?: number`
    (default `2`), validados.
- [ ] **Deliverable:** `src/games/ordena-codigo/index.js`,
  `escribe-codigo/index.js`, `completa-codigo/index.js`:
  - `defineGame` con `categories: ['programacion']`, `needsExercises: true`,
    `minExercises: 2`, `minCards: 1`, `load`.
- [ ] **Deliverable:** `src/games/registry.js` y `availability.js`:
  - 3 juegos de programación;
  - disponibilidad por `hasExercises` + `minExercises`; dificultad alta deshabilitada
    si el mazo no alcanza.
- [ ] **Deliverable:** `src/views/TopicView.jsx`/`GameHost.jsx`:
  - «Próximamente» sin ejercicios;
  - carga lazy y props `exercises`, `exerciseProgress`, `onExerciseResult`,
    `topic`, `deck`, `onGrade`, `onArcadeEnd`;
  - mazo sin ejercicios/dificultad deshabilitado.
- [ ] **Tests:** registry/availability/TopicView/GameHost:
  - 3 juegos en programación;
  - otros temas;
  - tema sin manifiesto;
  - mazo incompleto por dificultad;
  - ruta directa;
  - props y persistencia de progreso.
- **AC cubiertos:** AC-24, AC-25.
- **Contexto:** spec §Decisión 12; spec-18/20.
- **Done when:** los 3 juegos son accesibles solo donde corresponde y comparten el
  progreso de ejercicios.
- **Estimate:** L.

### T20 — CSS, accesibilidad, TTS y progreso visible [depends: T19]
- [ ] **Deliverable:** `src/ui/tokens.css`:
  - `.code-game`, editor, piezas, blanks, feedback, resumen, dificultad, progreso
    `X/6` y estado «Nivel completado»;
  - targets ≥44 px, foco visible, reduced-motion, 360 px sin overflow.
- [ ] **Verificación:** teclado, VoiceOver, contraste; TTS/mute en los 3; progreso
  visible en setup (junto al picker) y resumen.
- **AC cubiertos:** AC-10, AC-13, AC-18, AC-21, AC-27.
- **Done when:** la experiencia es usable en móvil y lector de pantalla.
- **Estimate:** M.

---

## Fase F — Docs, gates y cierre

### T21 — Docs, gates y cierre [depends: T1–T20]
- [ ] **Deliverable:** `docs/architecture.md`, `MEMORY.md`, `FOCUS.md`,
  `docs/testing.md` con formato Markdown de ejercicios, progreso
  `sepect.exercises.v1` y sandbox.
- [ ] **Gates:** `npm test`, `npm run lint`, `npm run build` al 100%.
- [ ] **Cierre:** ACs, tasks, firma y revisión de contenido.
- **AC cubiertos:** AC-28 y DoD.
- **Done when:** todo en verde y sin deps nuevas.
- **Estimate:** S.

---

## Fuera de alcance

- Ejercicios de otros temas.
- Dart/otros lenguajes en el sandbox.
- Monaco/CodeMirror/IA.
- Más de 6 ejercicios por mazo.
- Backend/red/cuentas.
- Cambiar el SRS o las etiquetas de dominio de cartas.

## Definition of Done

- [ ] Cada AC tiene test o verificación manual registrada.
- [ ] `npm test`, `npm run lint`, `npm run build` en verde.
- [ ] Sin dependencias nuevas ni red.
- [ ] Contenido revisado (sin cartas/conceptos futuros).
- [ ] Los 60 ejercicios validan y se abren en los 3 juegos.
- [ ] Progreso por ejercicio y nivel completado persisten en `sepect.exercises.v1`.
- [ ] Diff revisado por humano.
- [ ] `MEMORY.md` actualizado y `FOCUS.md` limpio.
