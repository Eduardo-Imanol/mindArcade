# tasks-18 — mazos-dominio-arcade

> Derivado de `specs/spec-18-mazos-dominio-arcade.md` (**firmada 2026-10-23**).
> Lista para implementar.
> Depende de `spec-17` (categorías/módulos) para que el catálogo y los paths estén
> estables. Sin dependencias nuevas. Sin backend.

## Objetivo del incremento

Que todos los juegos permitan elegir mazos de 10 cartas, compartan el dominio
`No aprendida / Repasar / Aprendida` desde el SRS y ofrezcan un modo Arcade de 3
vidas con puntuación y récords.

## Grafo de dependencias

```
T1 decks + mastery
└── T2 arcade puro
    ├── T3 storage récords
    └── T4 DeckPicker/ArcadeHud
T1 + T2 + T3 + T4 ─► T5 GameHost + availability
    └── T6 Flashcards (referencia)
        ├── T7 Quiz
        ├── T8 Ahorcado
        ├── T9 Memorama
        ├── T10 Conecta
        ├── T11 Intruso
        ├── T12 Lluvia
        └── T13 Serpiente
T6..T13 ─► T14 dominio cruzado + TopicView
T4..T14 ─► T15 CSS/a11y/perf
T1..T15 ─► T16 docs + gates + cierre
```

Cadenas críticas:

- `T1 → T2 → T3 → T5 → T6 → T7..T13 → T14 → T15 → T16`
- `T1 → T2 → T4 → T5`
- `T2 → T4 → T5 → T6..T13`

---

## Fase A — Núcleo compartido

### T1 — `decks.js`: mazos y dominio [depends: none]
- [x] **Deliverable:** `src/core/repetition/decks.js`:
  - `DECK_SIZE = 10`;
  - `buildDecks(cards, { size })` con todos los campos de spec-16 + `mastery` y
    `counts`;
  - `buildFlashcardDecks` alias compatible;
  - `deckMastery(deck, srsTopic, now)` con reglas `no-aprendida/repasar/aprendida/
    vacia`;
  - normalización de SRS inválido y `nextReview` NaN;
  - sin storage ni DOM.
- [x] **Tests:** `decks.test.js`:
  - bloques 1–10, 11–20, último parcial;
  - `studied`/`pending`/`complete` sin regresión;
  - new/learning/learned/due;
  - fallo (`reps=0`) → no aprendida;
  - todas learned no vencidas → aprendida;
  - vencida → repasar;
  - mazo vacío;
  - determinismo y alias.
- **AC cubiertos:** AC-1, AC-8.
- **Contexto:** spec HU-1/HU-2; `flashcardDecks.js`; `learning.js`; `sm2.js`.
- **Done when:** Flashcards puede migrar sin perder sus campos legacy.
- **Estimate:** M.

### T2 — `arcade.js`: reglas puras [depends: none]
- [x] **Deliverable:** `src/core/engine/arcade.js`:
  - `ARCADE_LIVES = 3`, `BASE_POINTS = 100`, `STREAK_STEP = 10`,
    `STREAK_CAP = 100`, `LIFE_BONUS = 50`;
  - `createArcade()`, `arcadeHit(state)`, `arcadeMiss(state)`, `arcadeFinish(state)`;
  - estado `{ lives, score, streak, correct, wrong, over, completed }`;
  - helpers de puntuación y snapshot serializable;
  - sin storage ni DOM.
- [x] **Tests:** `arcade.test.js`:
  - inicio 3 vidas/0 score;
  - aciertos y racha con tope;
  - fallo reinicia racha y resta vida;
  - 0 vidas → over;
  - completar con vidas → bonus;
  - no puntuar tras over;
  - snapshot seguro.
- **AC cubiertos:** AC-13, AC-14, AC-15.
- **Contexto:** spec HU-3; decisión 7.
- **Done when:** cualquier juego puede usar la misma semántica de vidas/score.
- **Estimate:** S.

### T3 — Persistencia de récords [depends: T2]
- [x] **Deliverable:** `src/core/storage/arcade.js`:
  - clave `sepect.arcade.v1`;
  - `loadArcadeRecords()`, `saveArcadeRecords()`, `recordArcadeRun(run)`,
    `bestFor(records, topicId, gameId, deckId)`;
  - sanitización de score/vidas/fechas/IDs;
  - máximo 20 runs por clave; JSON corrupto → `{}`;
  - cuota llena → `{ ok: false }` sin romper la partida.
- [x] **Tests:** `arcade.test.js` / `arcadeStore.test.js`:
  - round-trip;
  - best y `isRecord`;
  - top 20;
  - corrupción/cuota;
  - run inválido;
  - no toca `sepect.srs.v1` ni `sepect.profile.v1`.
- **AC cubiertos:** AC-15, AC-32.
- **Contexto:** spec decisión 8; `store.js` como referencia de cuota.
- **Done when:** `GameHost` puede persistir sin lógica de storage en juegos.
- **Estimate:** S.

### T4 — `DeckPicker` y `ArcadeHud` [depends: T1, T2]
- [x] **Deliverable:** `src/components/DeckPicker.jsx`:
  - props `decks`, `selectedDeckId`, `onSelect`, `best`, `disabledReason`,
    `gameId`;
  - número, rango, estado, progreso, best y CTA;
  - teclado, `aria-pressed`, targets ≥44 px.
- [x] **Deliverable:** `src/components/ArcadeHud.jsx`:
  - vidas, puntuación, racha, mejor marca;
  - `aria-live` para cambios;
  - modo normal/arcade opcional.
- [x] **Deliverable:** estilos en `src/ui/tokens.css`.
- [x] **Tests:** `DeckPicker.test.jsx`, `ArcadeHud.test.jsx`:
  - estados vacío/no-aprendida/repasar/aprendida;
  - selección y disabled;
  - best;
  - a11y/teclado.
- **AC cubiertos:** AC-2, AC-10, AC-21.
- **Contexto:** spec HU-1/HU-3; `GameSetup`; tokens.
- **Done when:** los juegos pueden insertar el picker sin duplicar UI.
- **Estimate:** M.

### T5 — `GameHost`, disponibilidad y persistencia [depends: T1, T2, T3, T4]
- [x] **Deliverable:** `src/views/GameHost.jsx`:
  - construir `decks` con todas las cartas + SRS del tema;
  - pasar `decks`, `best`, `onArcadeEnd` a todos los juegos;
  - conservar `deck`, `groups`, `selectCards` legacy;
  - construir `allGroups` para Intruso con todas las cartas por tema;
  - persistir arcade y devolver `{ best, isRecord }`;
  - no gradúar ni puntuar desde el host.
- [x] **Deliverable:** `src/games/availability.js`:
  - `getDeckAvailability(game, deck)` por mínimo;
  - modo mazo no bloquea por `allCaughtUp`;
  - conservar helpers legacy.
- [x] **Tests:** `GameHost.test.jsx`, `availability.test.js`:
  - decks completos, no elegibles;
  - best/onArcadeEnd;
  - mazo insuficiente;
  - repaso aunque todo esté aprendido;
  - legacy;
  - rutas/NotFound.
- **AC cubiertos:** AC-5, AC-6, AC-9, AC-12, AC-15, AC-31.
- **Contexto:** spec HU-1/HU-3/HU-5; `GameHost` actual; `TopicView`.
- **Done when:** un juego recibe todo lo necesario sin tocar storage.
- **Estimate:** M.

---

## Fase B — Juego de referencia

### T6 — Flashcards con mazos compartidos [depends: T5]
- [ ] **Deliverable:** `src/games/flashcards/Flashcards.jsx`:
  - usar `DeckPicker` y `deckMastery`;
  - conservar setup, reanudación, repaso, resumen, TTS, legacy;
  - eliminar etiquetas locales divergentes;
  - en arcade, `Otra vez` resta vida; `Difícil/Fácil` aciertan;
  - no doble emisión.
- [ ] **Deliverable:** `flashcards.logic.js` con `mode`/arcade si hace falta, sin
  duplicar `arcade.js`.
- [ ] **Tests:** `Flashcards.test.jsx`, `Flashcards.a11y.test.jsx`,
  `flashcards.logic.test.js`, isolation:
  - picker/estado compartido;
  - arcade 3 vidas/score/fin;
  - legacy;
  - gradings;
  - TTS/mute.
- **AC cubiertos:** AC-2, AC-3, AC-8, AC-9, AC-10, AC-20, AC-22.
- **Contexto:** spec HU-4; spec-16; `DeckPicker`.
- **Done when:** Flashcards es la referencia verde para los demás juegos.
- **Estimate:** M.

---

## Fase C — Lote 1

### T7 — Quiz-significado [depends: T6]
- [ ] **Deliverable:** `src/games/quiz-significado/QuizSignificado.jsx` + lógica:
  - picker, mazo seleccionado, rondas capadas al mazo;
  - arcade 3 vidas, score, best, fin;
  - opción incorrecta = fallo;
  - grading por carta mostrada;
  - legado y TTS.
- [ ] **Tests:** deck, arcade, gradings, a11y, isolation.
- **AC cubiertos:** AC-3, AC-7, AC-9, AC-17, AC-20, AC-23, AC-30.
- **Done when:** no se inventan opciones fuera del mazo.
- **Estimate:** M.

### T8 — Ahorcado [depends: T6]
- [ ] **Deliverable:** `Ahorcado.jsx` + `ahorcado.logic.js`:
  - picker, mazo, rondas capadas;
  - arcade con 3 vidas globales; cada letra incorrecta resta vida;
  - carta resuelta sin fallos → `facil`; con fallos en arcade → `otra-vez`;
  - fin por vidas y resumen;
  - conservar teclado, pista, arte y TTS.
- [ ] **Tests:** deck, arcade letra a letra, grading, fin, a11y, isolation.
- **AC cubiertos:** AC-3, AC-9, AC-17, AC-18, AC-20, AC-25, AC-30.
- **Done when:** el modo normal no cambia y arcade aplica la regla confirmada.
- **Estimate:** M.

### T9 — Memorama [depends: T6]
- [ ] **Deliverable:** `Memorama` + lógica:
  - picker, 10 parejas, grid responsive;
  - arcade: pareja fallida = vida;
  - score por pareja, best, fin;
  - grading por carta.
- [ ] **Tests:** 10 parejas, arcade, a11y, 360 px, isolation.
- **AC cubiertos:** AC-3, AC-9, AC-17, AC-20, AC-24, AC-30.
- **Done when:** 10 parejas caben sin scroll horizontal.
- **Estimate:** M.

### T10 — Conecta pares [depends: T6]
- [ ] **Deliverable:** `ConectaPares` + lógica:
  - picker, mazo completo en tandas de hasta 8 parejas;
  - arcade: conexión incorrecta = vida;
  - score por conexión, best, fin;
  - no descartar cartas.
- [ ] **Tests:** 10 cartas → 8+2, arcade, grading, a11y, isolation.
- **AC cubiertos:** AC-3, AC-7, AC-9, AC-17, AC-20, AC-28, AC-30.
- **Done when:** todas las cartas del mazo se juegan.
- **Estimate:** M.

---

## Fase D — Lote 2

### T11 — Intruso [depends: T6]
- [ ] **Deliverable:** `Intruso` + lógica:
  - mazo ancla + `allGroups` para distractores;
  - arcade 3 vidas; intruso incorrecto = fallo;
  - grading con `context.topicId` correcto;
  - sin otro tema → no disponible.
- [ ] **Tests:** deck ancla, distractores, arcade, grading, a11y, isolation.
- **AC cubiertos:** AC-3, AC-7, AC-9, AC-17, AC-20, AC-26, AC-30.
- **Done when:** no se usan cartas del mismo mazo como distractores inválidos.
- **Estimate:** M.

### T12 — Lluvia de meteoros [depends: T6]
- [ ] **Deliverable:** `LluviaMeteoros` + lógica:
  - picker, mazo;
  - unificar supervivencia/arcade en 3 vidas y mazo completo;
  - fallo/timeout = vida;
  - score/best/fin;
  - conservar ritmos/dificultad en normal.
- [ ] **Tests:** deck, arcade, timeout, grading, a11y, isolation.
- **AC cubiertos:** AC-3, AC-9, AC-13, AC-14, AC-17, AC-20, AC-27, AC-30.
- **Done when:** no conviven dos sistemas de vidas.
- **Estimate:** M.

### T13 — Serpiente de significados [depends: T6]
- [ ] **Deliverable:** `SerpienteSignificados` + lógica:
  - picker, mazo;
  - `INITIAL_LIVES = 3` en supervivencia/arcade;
  - manzana incorrecta/choque = vida;
  - score/best/fin;
  - conservar tableros, dificultad, pausa y TTS.
- [ ] **Tests:** 3 vidas, deck, arcade, score, a11y, isolation.
- **AC cubiertos:** AC-3, AC-9, AC-13, AC-14, AC-17, AC-19, AC-20, AC-29, AC-30.
- **Done when:** los tests de 5 vidas se actualizan a 3 sin pérdida de mecánica.
- **Estimate:** M.

---

## Fase E — Integración y calidad

### T14 — Dominio cruzado y vista de tema [depends: T6–T13]
- [ ] **Deliverable:** `TopicView`:
  - resumen de mazos (no aprendidas/repasar/aprendidas) y mejor marca por juego,
    sin duplicar el picker;
  - enlaces a juegos con el mazo recordado o al menos al juego.
- [ ] **Tests de integración:** jugar un mazo en un juego y ver el estado actualizado
  en Flashcards/TopicView; fallo → no aprendida; perfecto → repasar.
- **AC cubiertos:** AC-9, AC-10, AC-11, AC-31.
- **Done when:** el dominio es visible y consistente entre juegos.
- **Estimate:** M.

### T15 — CSS, a11y y rendimiento [depends: T4–T14]
- [ ] **Deliverable:** tokens de deck/arcade; 360 px; foco; teclado; reduced-motion;
  regiones live sin duplicados.
- [ ] **Verificación:** checklist manual 360 px/VoiceOver; sin scroll horizontal.
- [ ] **AC cubiertos:** AC-20, AC-21, AC-34.
- **Done when:** no hay regresiones visuales ni de foco.
- **Estimate:** M.

### T16 — Docs, gates y cierre [depends: T1–T15]
- [ ] **Deliverable:** docs/MEMORY/FOCUS/roadmap; decisiones de arcade y dominio.
- [ ] **Gates:** `npm test`, `npm run lint`, `npm run build` al 100%.
- [ ] **Cierre:** ACs, tasks y firma humana.
- **AC cubiertos:** AC-31, AC-32, AC-33, AC-34 y DoD.
- **Done when:** los 8 juegos tienen mazo + arcade + tests verdes.
- **Estimate:** M.

---

## Fuera de alcance

- Categorías/módulos (spec-17).
- Lector de fuente (spec-19).
- Juegos por categoría (spec-20).
- Juegos de código (spec-21).
- Inversión visual del Ahorcado (spec-22).
- Cambiar SM-2, XP o historial.

## Definition of Done

- [ ] Cada AC tiene test o verificación manual registrada.
- [ ] `npm test`, `npm run lint`, `npm run build` en verde.
- [ ] Sin dependencias nuevas ni red.
- [ ] Diff revisado por humano.
- [ ] `MEMORY.md` actualizado y `FOCUS.md` limpio.
