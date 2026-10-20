# tasks.md — conecta-pares (spec-10)

> Plan derivado de `specs/spec-10-conecta-pares.md`, firmada por Eduardo el
> 2026-10-19. Incremento activo. TTS obligatorio (spec-03 AC-12). Sin dependencias
> nuevas. Sin cambios en `src/core/**`, `GameHost.jsx` ni otros juegos. Este es el
> **único juego sin imágenes**.

## Dependency graph

```
T1 lógica pura ──► T2 tests de lógica
T1 ──► T3 UI + CSS ──► T4 líneas SVG/colores ──► T5 TTS + a11y
T3 ───────────────────────────────────────────► T7 tests UI/a11y/isolation
T4 + T5 ──────────────────────────────────────► T7
T6 registry + gates (paralelo) ───────────────► T7
T5 ───────────────────────────────────────────► T8 integración GameHost
T2 + T7 + T8 ─────────────────────────────────► T9 docs + verificación + DoD
```

Lógica pura primero; UI después; líneas, TTS y a11y encima; registry en paralelo;
tests de UI e integración al final; docs, verificación adversaria y gates cierran.

---

## Tasks

### T1 — Pure game logic [depends: none]
- [x] Deliverable: `src/games/conecta-pares/conecta-pares.logic.js` — sin imports:
  - Constantes: `MIN_PAIRS=3`, `MAX_PAIRS=10`, `DEFAULT_PAIRS=8`, `PHASES`.
  - `normalizeText(text)` (trim + NFD sin diacríticos + lower) para deduplicar.
  - `clampPairs(count)` → entero 3–10; inválidos → `DEFAULT_PAIRS`.
  - `buildSession({ cards, count, random })`:
    - Filtra cartas sin `id`, `front` o `back` no vacíos.
    - Deduplica por `front` y `back` normalizados (gana la primera aparición).
    - `total = min(count, cartas únicas)`; `left` y `right` barajados de forma
      independiente con `random` inyectable; mismo conjunto de ids en ambas columnas.
    - Con <3 cartas únicas → `{ cards: [], left: [], right: [], total: 0 }`.
  - `createState()` → `phase:'setup'`, `requested: DEFAULT_PAIRS`, `total:0`,
    `cards/left/right: []`, `selection:null`, `matched:[], attemptsByCard:{}`,
    `errors:0`, `feedback:null`, `results:[], lastGrade:null`.
  - `reduce(state, action)` con acciones `start`, `select { side, cardId }`, `clear`,
    `reset`; ignora acciones inválidas y tarjetas ya emparejadas.
    - Selección desde cualquier columna; toggle en la misma tarjeta; reemplazo en la
      misma columna; resolución al elegir la columna contraria.
    - Acierto: `matched` con orden 1..N, `feedback:'correct'`, resultado con
      `grade` según `attemptsByCard[cardId]`, `lastGrade.seq`; si se completan todos,
      `phase:'complete'`.
    - Error: `errors+1`, `attemptsByCard[questionCardId]+1`, `feedback:'wrong'` con
      `questionCardId`/`meaningCardId`, selección limpia, sin matched.
  - `gradeFor(attempts)` → `facil` si 0; `dificil` si ≥1.
  - `pendingGrades(state)` → `otra-vez` solo para cartas no emparejadas en `playing`;
    `[]` en `setup`/`complete`.
  - `summarize(state)` → `{ total, matched, errors, firstTry, xp }` con
    `xp = firstTry*10 + (matched-firstTry)*25`.
- **AC cubiertos:** AC-5, AC-7, AC-8, AC-9, AC-11, AC-12, AC-13 (lógica).
- **Contexto:** spec §3 y §6; patrón `quiz-significado.logic.js` e `intruso.logic.js`.
- **Done when:** lógica determinista con `random` fijo; sin imports, DOM, `Date` ni
  persistencia; una sola calificación por carta.
- **Estimate:** M.

### T2 — Logic test suite [depends: T1]
- [x] Deliverable: `src/games/conecta-pares/conecta-pares.logic.test.js`:
  - `normalizeText`: mayúsculas, acentos y espacios.
  - `clampPairs`: 2→3, 11→10, inválidos→8.
  - `buildSession`: 8 pares, dedupe de `front`/`back`, clamp a disponibles, <3 →
    sesión vacía, filtrado de cartas inválidas, misma composición en left/right,
    barajado determinista y sin mutar la entrada.
  - `reduce`: seleccionar desde pregunta/significado, toggle, reemplazo, acierto,
    error, reintento, tarjeta emparejada ignorada, `Escape`/`clear`, `reset`,
    acciones inválidas devuelven el mismo estado.
  - Acierto sin fallos → `facil`; con ≥1 fallo → `dificil`; error atribuido a la
    pregunta en ambos sentidos de selección.
  - `pendingGrades`: solo no emparejadas en `playing`; vacío tras completar/setup.
  - `summarize`: total, matched, errors, firstTry, xp.
- **AC cubiertos:** AC-5, AC-7, AC-8, AC-9, AC-11, AC-12, AC-13 (pruebas).
- **Contexto:** spec §6; `docs/testing.md` (seeds fijos, sin flaky).
- **Done when:** todos los bloques ENTRADA/SALIDA de §6 cubiertos y en verde.
- **Estimate:** M.

### T3 — UI component + styles [depends: T1]
- [x] Deliverable: `src/games/conecta-pares/ConectaPares.jsx`,
  `src/games/conecta-pares/index.jsx` y estilos `.conecta-*` en `src/ui/tokens.css`:
  - Setup: título «Conecta pregunta–significado», descripción, selector de pares
    `3..min(10, disponibles)` con default `min(8, disponibles)`, nota de pares
    disponibles, `SoundToggle`, «Empezar» y «Salir».
  - Al empezar: `selectCards(cantidad)` o `deck.slice(0, cantidad)`; `buildSession`;
    estado seguro si `total < 3`; reset de guards.
  - Header: progreso `Pares X de N`, errores, `SoundToggle`, «Salir».
  - Tablero: dos columnas etiquetadas «Preguntas» y «Significados»; botones con
    `front`/`back`, wrap completo, sin imágenes, targets ≥44px.
  - Selección: resaltado, `aria-pressed`, toggle, reemplazo, `Escape`; tarjetas
    emparejadas deshabilitadas.
  - Feedback de acierto/error; resumen con pares, errores, primeros intentos, XP,
    «Jugar de nuevo» y «Volver al tema».
  - Emisión `onGrade(cardId, grade)` con guard `seq`; `pendingGrades` + `onExit` al
    salir; sin emisiones duplicadas.
  - Layout a 360px sin scroll horizontal; textos largos con `overflow-wrap:anywhere`
    y `hyphens:auto`.
- **AC cubiertos:** AC-2 (UI), AC-3, AC-4, AC-6, AC-7 (UI), AC-8 (UI), AC-9 (UI),
  AC-11 (UI), AC-12, AC-13.
- **Contexto:** contrato de props; patrón `QuizSignificado.jsx`/`Intruso.jsx`;
  `src/ui/tokens.css`; sin `CardImage`.
- **Done when:** flujo completo jugable con ratón y teclado; sin imports prohibidos;
  lint 0.
- **Estimate:** L.

### T4 — SVG connections, colors and reflow [depends: T3]
- [x] Deliverable: integración en `ConectaPares.jsx` + estilos:
  - SVG absoluto sobre el tablero, `aria-hidden="true"`, `pointer-events:none`.
  - Una línea por par emparejado entre borde derecho de pregunta y borde izquierdo
    de significado, con paleta de 10 colores y badge de número de par.
  - `refs` por tarjeta + `useLayoutEffect`; recálculo en match, `resize`,
    `orientationchange`, `document.fonts.ready` y cambios de tamaño con
    `ResizeObserver`; sin loops rAF ni setState a 60fps.
  - Estado de acierto con color + número + texto; estado de error rojo temporal
    basado en el feedback del reducer, sin timers.
  - `prefers-reduced-motion`: líneas estáticas, sin animación ni shake.
- **AC cubiertos:** AC-8 (visual), AC-9 (visual), AC-10, AC-16.
- **Contexto:** referencia `connect-the-words` de VocaPlayLand (líneas SVG), adaptada;
  tokens neón; presupuesto de rendimiento.
- **Done when:** 2–10 líneas correctas, sin desbordes a 360px, recalculadas tras
  resize/orientación y sin capturar clics.
- **Estimate:** M.

### T5 — TTS + accessibility behavior [depends: T3, T4]
- [x] Deliverable: integración en `ConectaPares.jsx`:
  - `speak(front)` al seleccionar pregunta; `speak(back)` al seleccionar significado;
    `speak(«front». «back»)` al acertar.
  - Barra de selección con el texto activo y botón 🔊 de repetición; `<SoundToggle />`
    en setup, partida y resumen.
  - Sin `speechSynthesis` los controles 🔊 se ocultan; `stopSpeech()` al salir y
    desmontar; mute respetado por el helper.
  - `aria-live="polite"` con selección, acierto, error y fin, sin mensajes obsoletos.
  - `aria-label` por columna/posición; `aria-pressed`; columnas etiquetadas; estado
    «conectada con el par K».
  - Foco predecible: al emparejar, siguiente pregunta no emparejada; al completar,
    encabezado del resumen; foco visible.
  - Teclado completo: Tab/Shift+Tab, Enter/Space, `Escape`; targets ≥44px.
- **AC cubiertos:** AC-14, AC-15, AC-16 (comportamiento).
- **Contexto:** `src/core/audio/tts.js`; `SoundToggle`; patrón de TTS de
  `Memorama.jsx`/`QuizSignificado.jsx`; `docs/manual-a11y-checklist.md`.
- **Done when:** TTS y foco funcionan sin ratón; sin soporte de voz el juego sigue
  100% jugable; sin anuncios duplicados.
- **Estimate:** M.

### T6 — Registry and availability gates [depends: none]
- [x] Deliverable: `src/games/registry.js`, `src/games/registry.test.js` y ajustes en
  `src/views/TopicView.test.jsx`:
  - `conecta-pares` con `status:'available'`, `minCards:3`,
    `load: () => import('./conecta-pares/index.jsx')`, título
    «Conecta pregunta–significado» y descripción actualizada.
  - Tests: 7 `available`, 3 `soon` (`sopa-de-letras`, `caza-significados`,
    `serpiente-significados`), catálogo de 10, `load()` resuelve, metadata de
    `minCards`.
  - `TopicView`: con 2 cartas sigue mostrando «Necesitas al menos 3 cartas» y
    3 «Próximamente»; con 4 cartas conecta queda habilitado; conteos de links y
    deshabilitados actualizados.
- **AC cubiertos:** AC-1, AC-2 (metadata/gate).
- **Contexto:** registry actual; `getGameAvailability`; tests de registry/TopicView.
- **Done when:** `getGame('conecta-pares')` correcto, conteos actualizados y sin
  cambios en otros IDs ni en el orden.
- **Estimate:** S.

### T7 — UI, a11y and isolation tests [depends: T3, T4, T5, T6]
- [x] Deliverable:
  - `src/games/conecta-pares/ConectaPares.test.jsx`: setup con default 8 y selector
    dinámico; `selectCards(8)`; fallback sin `selectCards`; estados seguros;
    dos columnas; selección bidireccional/toggle/reemplazo; acierto/error/reintento;
    completar; resumen; replay; salida con pendientes; sin emisiones duplicadas;
    sin imágenes.
  - `src/games/conecta-pares/ConectaPares.a11y.test.jsx`: labels por posición,
    `aria-pressed`, `aria-live` sin stale, teclado, `Escape`, foco tras emparejar y
    al completar, targets, reduced motion, TTS oculto sin soporte.
  - `src/games/conecta-pares/conecta-pares.isolation.test.js`: regex sin
    `storage|parser|content|router`; sin `localStorage|indexedDB|fetch(`; sin
    `CardImage`, `<img>`, `<canvas>` ni p5; lógica sin imports; contrato de props.
- **AC cubiertos:** AC-3, AC-6, AC-7, AC-8, AC-9, AC-10, AC-14, AC-15, AC-16, AC-17.
- **Contexto:** patrones de tests de quiz/intruso/lluvia; `src/test/render.jsx`;
  `docs/manual-a11y-checklist.md`; jsdom para SVG.
- **Done when:** suites propias en verde; sin violaciones de a11y en el componente;
  test de aislamiento detecta cualquier import o imagen prohibida.
- **Estimate:** M.

### T8 — GameHost integration tests [depends: T5]
- [x] Deliverable: ampliar `src/views/GameHost.test.jsx`:
  - `conecta-pares` carga con `deck`, `selectCards`, `onGrade` y `onExit`.
  - Acierto al primer intento → SRS `facil`, XP e history persistidos.
  - Error + acierto → SRS `dificil`; salida a mitad → `otra-vez` solo de no
    emparejadas.
  - Estabilidad tras remount: SRS/XP/history idénticos.
  - Gate con tema de <3 cartas → pantalla segura.
  - `selectCards` recibe la cantidad elegida y el juego la usa.
- **AC cubiertos:** AC-11 (integración), AC-18.
- **Contexto:** patrones de integración de quiz/intruso/lluvia; `GameHost.jsx`
  (sin modificarlo); `src/core/repetition/*` y `src/core/storage/*`.
- **Done when:** persistencia y remount verificados; sin cambios en el host.
- **Estimate:** M.

### T9 — Docs, adversarial verification and DoD [depends: T2, T7, T8]
- [x] Deliverable:
  - `specs/roadmap-games.md`: conecta `available`, spec-10; excepción de «único juego
    sin imágenes»; TTS del elemento activo en la barra de selección.
  - `docs/manual-a11y-checklist.md`: sección «Conecta pregunta–significado».
  - `MEMORY.md`, `FOCUS.md` y `tasks.md`: estado del incremento y decisiones.
  - `specs/tasks-10-conecta-pares.md`: marcar T1–T9 y archivar al cerrar.
  - Verificación adversaria AC-1..AC-19 con un agente verificador independiente.
  - Gates finales: `npm test` 100%, `npm run lint` 0, `npm run build` OK.
- **AC cubiertos:** AC-17 (auditoría), AC-19.
- **Contexto:** SDD F5/F6; `docs/testing.md`; checklist manual.
- **Done when:** gates en verde, defectos corregidos, docs sincronizadas y diff
  pendiente de aprobación humana de Eduardo.
- **Estimate:** M.

---

## Execution flow

1. T1 → T2 (lógica y pruebas).
2. T3 y T6 en paralelo (UI base y registry/gates).
3. T4 → T5 (líneas SVG, luego TTS/a11y).
4. T7 (UI/a11y/isolation) cuando T3–T6 estén verdes.
5. T8 (integración GameHost).
6. T9 (docs, verificación adversaria y gates).
7. Aprobación humana del diff; sin commit hasta que Eduardo lo pida.

## Cierre (T9)

- Verificación adversaria independiente AC-1..AC-19: **PASS**.
  - Defecto corregido: `uniqueCards` no deduplicaba por `id` (columnas incoherentes,
    claves React duplicadas y partida bloqueada); ahora deduplica por `id` con test.
  - Defecto corregido: la integración de `GameHost` asumía un orden estable de
    `otra-vez`, pero `selectCards` baraja con `Math.random`; la aserción compara el
    conjunto.
- Gates finales: `npm test` 445/445 (52 files), `npm run lint` 0,
  `npm run build` OK (solo warning preexistente de chunk >500 kB).
- Docs sincronizadas: `specs/roadmap-games.md`, `docs/manual-a11y-checklist.md`,
  `MEMORY.md`, `FOCUS.md` y `tasks.md`.
- Residuales aceptados, no bloqueantes: layout real 360px y lector de pantalla
  pendientes de checklist manual humano; el foco no se reubica al pulsar
  «Empezar»/«Jugar de nuevo»; el badge central puede quedar parcialmente bajo las
  tarjetas en escenarios extremos; el test de `stopSpeech` al desmontar es débil;
  el regex de reduced-motion puede cruzar bloques CSS; el aislamiento escanea
  imports directos; warnings `act(...)` y de tamaño de chunk preexistentes.
- Pendiente: aprobación humana del diff (Eduardo).
