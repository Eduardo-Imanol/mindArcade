---
feature: mazos-dominio-arcade
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-23
related_tasks: specs/tasks-18-mazos-dominio-arcade.md
---

# Spec — Mazos, dominio compartido y modo Arcade (spec-18)

> [!abstract] Resumen
> Extiende los mazos fijos de 10 cartas de Flashcards a **todos los juegos**,
> comparte el estado `No aprendida / Repasar / Aprendida` entre juegos a partir del
> SRS existente y añade un **modo Arcade** común: 3 vidas, puntuación, mejor marca
> histórica y fin de partida al perder las vidas o completar el mazo. Cada juego se
> toca una sola vez para integrar mazo + dominio + arcade, conservando su mecánica
> normal. Sin backend, sin dependencias nuevas y sin una segunda clave de dominio.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Alta (core de repetición + storage + 8 juegos + GameHost + UI) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. **Mazos**: bloques consecutivos de 10 cartas en el orden del tema, ids
   `deck-1..deck-N`, último mazo parcial. `buildDecks` generaliza
   `buildFlashcardDecks`; se conserva el alias legacy y los campos de spec-16.
2. **Mazo contiene todas las cartas** del rango, aunque estén aprendidas o no
   vencidas. El mazo es la unidad de juego; el repaso no se bloquea por SRS.
3. **Selección de mazo en todos los juegos**: el setup muestra `DeckPicker` antes de
   empezar. La partida usa **solo** las cartas del mazo seleccionado. El barajado,
   si existe, ocurre dentro del mazo.
4. **Modo normal**: conserva la mecánica actual de cada juego y sus selectores
   (rondas, dificultad, ritmo) capados al tamaño del mazo. **Modo Arcade**: usa el
   mazo completo, ignora el selector de rondas y aplica 3 vidas globales. Excepción:
   en los juegos de código (spec-21), la unidad de Arcade es el set de **2/4/6
   ejercicios** elegido por dificultad, no el mazo completo de cartas.
5. **Dominio de mazo derivado del SRS existente** (`sepect.srs.v1`), sin clave nueva:
   - `No aprendida`: al menos una carta en estado `new` (sin estado o `reps === 0`,
   incluido un fallo).
   - `Aprendida`: todas las cartas `learned` (`reps >= 3`) y ninguna vencida
   (`nextReview <= now`).
   - `Repasar`: cualquier otro caso (hay intentos, faltan reps o hay vencidas).
   El **aprendizaje de ejercicios de código** es un estado independiente que vive en
   `sepect.exercises.v1` (spec-21) y no altera estas etiquetas.
6. **Grading compartido**: cada juego emite `onGrade` para cada carta que muestra.
   En arcade, acierto = `facil`, fallo = `otra-vez`; en normal se conservan los grados
   actuales. Una carta no mostrada no se gradúa.
7. **Arcade**: 3 vidas; cada fallo resta una; la partida termina con 0 vidas o al
   agotar las cartas del mazo. Puntuación por acierto:
   `100 + min(100, 10 * racha)`; racha se reinicia con cada fallo; al completar el
   mazo se suman `50 * vidas restantes`. La mejor marca se guarda por
   `topicId:gameId:deckId`.
8. **Récords**: nueva clave `sepect.arcade.v1` con las últimas 20 partidas por
   `topicId:gameId:deckId` y la mejor marca. Escritura cuota-segura, datos
   sanitizados, sin red. Es la única clave nueva de esta spec; el progreso de
   ejercicios de código usa `sepect.exercises.v1` (spec-21).
9. **Disponibilidad por mazo**: se evalúa `game.minCards` contra el tamaño del mazo.
   Un mazo insuficiente se muestra deshabilitado con motivo; el resto sigue jugable.
   El estado «Todo al día» deja de bloquear el repaso con mazos.
10. **Sin doble emisión**: cada carta se gradúa como máximo una vez por sesión; los
    juegos que ya emiten al salir deben evitar duplicados.
11. **Aislamiento**: los juegos reciben `decks`, `best`, `onArcadeEnd` y `onGrade` por
    props; no importan storage, router ni parser.
12. **Sin dependencias nuevas**, sin backend, sin cambiar SM-2, XP, historial ni las
    reglas de selección de `selectStudyCards` para el modo legacy.

---

## 📖 Historias de usuario

### HU-1 — Jugar por mazos en cualquier juego
**Como** aprendiz, **quiero** elegir un mazo de 10 cartas en cualquier juego, **para**
practicar un bloque concreto sin mezclar todo el tema.

**Criterios de aceptación:**
- [ ] AC-1: `buildDecks(cards, { size = 10 })` devuelve bloques consecutivos con
  `{ id, number, label, from, to, cards, total, studied, studiedIds, pending,
  complete, mastery, counts }`. `buildFlashcardDecks` sigue exportado como alias
  compatible. El último mazo parcial se calcula correctamente.
- [ ] AC-2: Los 8 juegos actuales muestran `DeckPicker` en su setup cuando reciben
  `decks`. El picker muestra número, rango, cartas, estado de dominio, progreso
  estudiado, mejor marca del juego para ese mazo y CTA. La selección es accesible por
  teclado y `aria-pressed`.
- [ ] AC-3: La partida usa únicamente `selectedDeck.cards`; no se mezclan cartas de
  otros mazos ni se completa con cartas externas. El barajado se limita al mazo.
- [ ] AC-4: Un mazo con menos cartas que `game.minCards` se deshabilita con un motivo
  claro; el juego sigue disponible si otro mazo cumple el mínimo. Flashcards siempre
  admite cualquier mazo no vacío.
- [ ] AC-5: Sin `decks`, cada juego conserva su comportamiento legacy (`deck`,
  `selectCards`) y sus tests actuales. Con `decks`, `deck`/`selectCards` no alteran
  la composición del mazo.
- [ ] AC-6: `GameHost` construye los mazos con **todas** las cartas del tema (con
  overrides de imagen) y el SRS del tema, y pasa `decks` a todos los juegos. No se
  filtran cartas no vencidas para armar mazos.
- [ ] AC-7: El juego de Intruso usa el mazo seleccionado como ancla y un pool de
  distractores de otros temas; sin otro tema disponible sigue no disponible. Conecta
  procesa el mazo completo en tandas de máximo 8 parejas, sin descartar cartas.

### HU-2 — Dominio compartido entre juegos
**Como** aprendiz, **quiero** que el estado de un mazo sea el mismo en todos los
juegos, **para** saber qué mazo está aprendido, cuál debo repasar y cuál no he
empezado.

**Criterios de aceptación:**
- [ ] AC-8: `deckMastery(deck, srsTopic, now)` es puro y devuelve
  `{ status: 'no-aprendida'|'repasar'|'aprendida'|'vacia', counts: { new, learning,
  learned, due, studied, pending, total } }` con la regla de la decisión 5.
- [ ] AC-9: Todos los juegos gradúan cada carta mostrada. Una partida perfecta con
  cartas nuevas deja el mazo en `Repasar`; si todas las cartas alcanzan `learned` y
  ninguna queda vencida, el mazo pasa a `Aprendida`. Un fallo deja al menos una carta
  en `reps === 0`, por lo que el mazo pasa a `No aprendida`.
- [ ] AC-10: Flashcards y el `DeckPicker` de todos los juegos muestran las mismas
  etiquetas `No aprendida / Repasar / Aprendida` y los mismos conteos para el mismo
  mazo. El estado se actualiza tras gradúar sin recargar la página.
- [ ] AC-11: Los resultados de otros juegos se reflejan en Flashcards porque comparten
  SRS; no se crea una clave de dominio paralela. La mejor puntuación del mazo se
  muestra junto al estado, pero no altera el dominio.
- [ ] AC-12: Una carta se gradúa como máximo una vez por sesión. Salir a mitad no
  emite `otra-vez` por cartas no mostradas; en arcade, el fallo que agota la última
  vida sí gradúa la carta implicada.

### HU-3 — Modo Arcade en todos los juegos
**Como** aprendiz, **quiero** un modo arcade con 3 vidas, puntuación y récord, **para**
competir contra mi mejor marca y reaccionar a cada error.

**Criterios de aceptación:**
- [ ] AC-13: El setup de cada juego ofrece `Normal` y `Arcade` cuando recibe `decks`.
  En Arcade se muestran vidas (3), puntuación y mejor marca; el selector de rondas se
  oculta o se ignora y se juega el mazo completo. En los juegos de código, Arcade usa
  el set de 2/4/6 ejercicios elegido por dificultad, no el mazo completo de cartas.
- [ ] AC-14: La partida arcade termina cuando las vidas llegan a 0 o cuando se agota
  el mazo. Con 0 vidas no hay bonus de vidas; al completar el mazo se suman
  `50 * vidas restantes`.
- [ ] AC-15: La puntuación es `100 + min(100, 10 * racha)` por acierto; un fallo
  reinicia la racha. La mejor marca y las últimas 20 partidas se guardan por
  `topicId:gameId:deckId` en `sepect.arcade.v1`, con datos inválidos descartados.
- [ ] AC-16: El resumen arcade muestra puntuación, ¿nuevo récord?, vidas restantes,
  aciertos/fallos, mazo y acciones «Repetir», «Elegir mazo» y «Volver al tema».
  `GameHost` persiste el resultado mediante `onArcadeEnd` y devuelve
  `{ best, isRecord }`.
- [ ] AC-17: Reglas de vida por juego:
  - Flashcards: `Otra vez`.
  - Quiz-significado: opción incorrecta.
  - Memorama: pareja no coincidente.
  - Ahorcado: cada letra incorrecta.
  - Intruso: intruso incorrecto.
  - Lluvia de meteoros: respuesta incorrecta o tiempo agotado.
  - Conecta pares: conexión incorrecta.
  - Serpiente: manzana incorrecta o choque.
- [ ] AC-18: En Ahorcado arcade, cada letra incorrecta resta una vida. Si la palabra
  se resuelve tras haber perdido alguna vida, la carta se gradúa `otra-vez`; si se
  resuelve sin fallos, `facil`. La partida conserva el teclado y el TTS.
- [ ] AC-19: En Serpiente, la supervivencia y el arcade usan 3 vidas. Los tests de
  `INITIAL_LIVES` y de fin por vidas se actualizan; el modo Rondas conserva su lógica
  sin vidas.
- [ ] AC-20: Arcade respeta el mute global y el TTS existente. Los cambios de vida,
  puntuación y fin se anuncian en una región `aria-live` sin duplicar el texto.
- [ ] AC-21: El HUD y el resumen son operables con teclado, foco visible, targets
  ≥44 px, sin scroll horizontal a 360 px y con `prefers-reduced-motion` respetado.

### HU-4 — Integración por juego sin regresiones
**Como** mantenedor, **quiero** que cada juego integre mazo, dominio y arcade una sola
vez, **para** no duplicar lógica ni romper sus mecánicas.

**Criterios de aceptación:**
- [ ] AC-22: Flashcards usa `buildDecks`/`deckMastery` compartidos y conserva setup,
  reanudación, repaso, resumen, TTS y legacy. Su estado de mazo ya no usa etiquetas
  locales incompatibles.
- [ ] AC-23: Quiz-significado usa el mazo para preguntas y opciones; no inventa
  opciones fuera del mazo. En arcade, una opción incorrecta resta vida.
- [ ] AC-24: Memorama usa las cartas del mazo; el tablero se adapta a 10 parejas sin
  desbordar a 360 px; una pareja fallida resta vida en arcade.
- [ ] AC-25: Ahorcado usa el mazo para las rondas y el mínimo de 3 cartas por mazo;
  arcade usa las reglas de AC-18.
- [ ] AC-26: Intruso usa el mazo ancla y distractores de otros temas; no mezcla cartas
  del futuro mazo del tema ancla. La partida se bloquea si no hay otro tema.
- [ ] AC-27: Lluvia usa el mazo para las rondas; el modo supervivencia existente se
  alinea con arcade (3 vidas, mazo completo) sin duplicar dos sistemas de vidas.
- [ ] AC-28: Conecta usa el mazo completo en tandas de hasta 8 parejas; una conexión
  incorrecta resta vida en arcade y no se pierden cartas del mazo.
- [ ] AC-29: Serpiente usa el mazo, conserva sus manzanas/leyenda y aplica las reglas
  de AC-19.
- [ ] AC-30: Todos los juegos siguen sin importar storage, router ni parser; reciben
  datos y callbacks por props. Los tests de aislamiento se actualizan solo por el
  contrato aditivo.

### HU-5 — Compatibilidad y calidad
**Como** usuario, **quiero** que la app siga funcionando igual o mejor, **para** no
perder progreso ni jugabilidad.

**Criterios de aceptación:**
- [ ] AC-31: El gate «Todo al día» ya no impide jugar un mazo; la vista de tema y el
  setup ofrecen repaso. El gate de mínimo por mazo sigue activo. Los tests de
  `availability`, `TopicView` y `GameHost` se actualizan.
- [ ] AC-32: `sepect.srs.v1`, `sepect.profile.v1`, XP, rachas e historial se conservan.
  `sepect.arcade.v1` es la única clave nueva de esta spec y tolera JSON corrupto o
  cuota llena. El progreso de ejercicios de código usa `sepect.exercises.v1`
  (spec-21) sin tocar SRS ni arcade.
- [ ] AC-33: `npm test`, `npm run lint` y `npm run build` pasan al 100%; no hay
  warnings nuevos.
- [ ] AC-34: Sin dependencias nuevas y sin llamadas de red para progreso, XP,
  historial, mazos o récords.

---

## 🚧 Restricciones arquitectónicas

- `decks.js` y `arcade.js` son puros; no leen storage ni DOM.
- `src/core/storage/arcade.js` es la única capa que persiste récords.
- `GameHost` es el único que construye mazos y persiste arcade; los juegos solo
  consumen props.
- No se cambia el esquema de SRS ni la semántica de `applyGrade`/`scheduleNext`.
- Los juegos no pueden importar `core/storage`, `app/router` ni `core/parser`.
- No se añade una clave de dominio de mazo; el dominio es derivado.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Tema con 0 cartas | No hay mazos; estado vacío, sin crash |
| Último mazo parcial | Se crea con las cartas restantes; juegos por debajo del mínimo lo deshabilitan |
| SRS corrupto o `reps` inválido | Se trata como `new`; mazo `No aprendida` |
| Carta con `nextReview` NaN | No cuenta como vencida |
| Fallo en arcade con 1 vida | Carta implicada `otra-vez`; partida termina; no se gradúan cartas no mostradas |
| Salir a mitad en normal | No se emiten fallos por cartas no mostradas |
| Mazo completado con vidas | Bonus `50 * vidas`; récord actualizado |
| localStorage lleno | La partida sigue; el récord no se persiste; aviso no bloqueante |
| Juego sin `decks` | Comportamiento legacy intacto |
| Juego de código en Arcade | Usa el set 2/4/6 de ejercicios, no el mazo completo de cartas |
| Progreso de ejercicios | Vive en `sepect.exercises.v1` (spec-21); no altera el dominio de cartas |
| Intruso sin otro tema | Juego no disponible con motivo |
| Conecta con 10 cartas | Tandas de 8 + 2; no se descartan cartas |
| Ahorcado con 2 cartas | Mazo deshabilitado por `minCards: 3` |
| Serpiente con 3 vidas | Fin a 0; tests actualizados |

---

## 🧪 Contrato de pruebas

```
ENTRADA: buildDecks(cards, { size: 10 })
SALIDA: [{
  id: 'deck-1', number: 1, label: '1–10', from: 1, to: 10,
  cards: Card[10], total: 10, studied: number, studiedIds: string[],
  pending: number, complete: boolean,
  mastery: 'no-aprendida'|'repasar'|'aprendida'|'vacia',
  counts: { new, learning, learned, due, studied, pending, total }
}]

ENTRADA: deckMastery(deck, srsTopic, now)
SALIDA: { status, counts }

ENTRADA: createArcade(); hit(); miss(); finish()
SALIDA: { lives: 0..3, score, streak, correct, wrong, over, completed }

ENTRADA: GameHost.onArcadeEnd({
  topicId, gameId, deckId, score, correct, wrong, lives, completed
})
SALIDA: { best, isRecord }
```

**Tests mínimos:**
- `decks.test.js`: chunking, parcial, mastery, estados SRS, determinismo.
- `arcade.test.js`: vidas, puntuación, racha, bonus, fin.
- `arcadeStore.test.js`: persistencia, corrupción, cuota, top 20, best.
- `DeckPicker.test.jsx` / `ArcadeHud.test.jsx`: accesibilidad, estados, best.
- `GameHost.test.jsx`: decks a todos, persistencia arcade, gate por mazo.
- Un test por juego para: deck picker, solo mazo seleccionado, gradings, arcade,
  fin por vidas, TTS/mute y legacy.
- Tests de aislamiento de los 8 juegos.
- Regresión completa de `availability`/`TopicView`.

---

## 🚫 Fuera de alcance

- Categorías/módulos (spec-17).
- Lector de fuente (spec-19).
- Juegos por categoría (spec-20).
- Juegos de código, contenido de ejercicios y progreso por ejercicio (spec-21).
- Inversión visual del Ahorcado (spec-22).
- Cambiar el algoritmo SM-2, el XP o el historial global.
- Añadir dependencias o backend.

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [ ] `specs/tasks-18-mazos-dominio-arcade.md` revisado
