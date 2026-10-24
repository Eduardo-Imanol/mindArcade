# Roadmap de juegos — Sepect

> Plan de iteración juego por juego. Cada juego se implementa con su propia spec
> (`specs/spec-NN-<juego>.md`) + `tasks.md`, sobre el contrato de módulos congelado
> en `specs/spec-02-topics-flashcards.md` §4. Los IDs son estables y se reutilizan
> para cualquier tema (programación, idiomas, etc.): el juego recibe un `deck` de
> cartas `{ id, front, back, difficulty, image? }` y no sabe de qué tema se trata.

## Contrato de reutilización

- `front` = término / palabra (idioma origen o concepto).
- `back` = significado / definición / traducción.
- Un mismo juego funciona con cualquier tema sin cambiar código: solo cambia el `.md` del tema.
- `minCards` declara el mínimo de cartas para habilitar el juego en un tema.
- Toda carta lleva imagen (ver spec-02 §4): resuelta por `CardImage` con precedencia override UI > token `| I:` > emoji automático > arte generativo de fallback.
- Todo juego que muestre cartas debe renderizar `CardImage`: como pista (ahorcado, quiz, lluvia, serpiente) o en ambos lados (flashcards). **Excepción:** `conecta-pares` (spec-10) es el único juego sin imágenes: no usa `CardImage`, `<img>`, `<canvas>` ni p5; sus líneas SVG son decorativas (`aria-hidden`, `pointer-events:none`), no arte de carta.
- **Todo juego DEBE incluir TTS** (obligatorio desde spec-03): lectura de textos con Web Speech API vía helper compartido `src/core/audio/tts.js` (gratis, 0 deps), lectura al interactuar + botón 🔊 por elemento + toggle global de sonido persistido. En `conecta-pares` «botón por elemento» se interpreta como botón 🔊 del elemento activo en la barra de selección (spec-10), sin añadir 20 botones. Sin `speechSynthesis` → controles ocultos sin romper el juego.
- **Selección de cartas por SRS** (spec-12, supersede spec-03 AC-3): los juegos deben pedir sus cartas con `selectCards(count)` (prop opcional que arma GameHost con `selectStudyCards`). El pool son las cartas no aprendidas (`new`/`learning`) mezcladas y, si faltan, las aprendidas **solo si están vencidas** (`nextReview <= now`), ordenadas por `nextReview`. Nunca se ofrecen aprendidas no vencidas. El patrón aplica a los 8 juegos.
- **Contrato de juego** (spec-12): cada juego se declara con `defineGame({ id, title, description?, art?, status, minCards, minTopics?, minCardsPerTopic?, load })` (`src/games/definition.js`), congelado. `registry` es data-driven y la matriz de reutilización se prueba con al menos dos temas. Sin reescritura a clases.
- **Portada y fichas de juego** (spec-12): la ficha de juego muestra solo título + imagen representativa del juego (`game.art`, `src/assets/games/<id>.svg`) + estado/CTA, sin descripción. Si un juego no declara `art`, se usa la portada del tema (`topicCoverCard`): primera carta del deck con imagen explícita; si no hay, la primera carta.
- **Grados en juegos de aciertos**: 1.er intento → `facil`, intentos medios → `dificil`, nunca resuelto → `otra-vez` (spec-03, reutilizable). Nota: en memorama "1.er intento" se interpreta como `attempts <= 1` (fallos previos ≤1 → `facil`), según el contrato de test de spec-03 §6.

## Catálogo e iteración (orden acordado)

| # | ID (estable) | Juego | Mecánica con deck genérico | minCards | Origen en VocaPlayLand | Spec |
|---|---|---|---|---|---|---|
| 1 | `flashcards` | Flashcards | Frente: término; dorso: significado; voltear + autoevaluación (Otra vez / Difícil / Fácil) → SM-2 + XP | 1 | Flashcards | **spec-02 (este incremento)** |
| 2 | `memorama` | Memorama | Emparejar carta-término con carta-significado | 4 | Memory | **spec-03 (available)** |
| 3 | `ahorcado` | Ahorcado | Adivinar el término letra a letra usando el significado como pista | 3 | Hangman | **spec-04 (available)** |
| 4 | `quiz-significado` | Elige el significado | Pregunta (término) + 4 opciones de significado; solo una correcta | 4 | Quiz / Choose the Word | **spec-06 (available)** |
| 5 | `intruso` | El intruso | Set de 3 significados del tema + 1 de otro tema: encontrar el intruso (gate: ≥2 temas con ≥3 cartas) | 3 | Intruder | **spec-08 (available)** |
| 6 | `lluvia-meteoros` | Lluvia de meteoros | Escribir/elegir la traducción antes de que el meteoro caiga | 6 | Meteor Rush | **spec-09 (available)** |
| 7 | `conecta-pares` | Conecta pregunta–significado | Unir pares término↔significado tocando ambas columnas | 3 | Connect the Words | **spec-10 (available)** |
| 8 | `serpiente-significados` | Serpiente de significados | Snake que come la fruta con el significado correcto del término pedido | 4 | Snake | **spec-11 (available)** |

Regla de iteración: se pulen uno a uno. Cada spec se firma antes de codificar;
al terminar se actualiza este roadmap (status `available`) y se abre la siguiente.

> Catálogo completo (2026-10-20): **8 available / 0 soon**. spec-11 cierra el roadmap
> de juegos. spec-12 «retouch-learning-dashboard» (implementada T1–T11, pendiente de
> firma humana del diff) es el incremento de métricas, selección espaciada, hub y
> dashboard; no añade juegos.

## Contenido de temas (formato MD canónico)

```md
# Funciones en Programación
Una función encapsula lógica reutilizable y evita repetir código.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable que realiza una tarea | E: easy
- Q: ¿Qué es un parámetro? | A: Variable que recibe valores de entrada | E: easy
- Q: ¿Qué es el valor de retorno? | A: Resultado que la función devuelve al llamador | E: hard
```

- Primera línea `#` → título del tema (el id se genera con slug).
- Primer párrafo → descripción.
- Cada línea `- Q: ... | A: ... | E: easy|hard` → una carta (E opcional, default `easy`).
- Token de imagen opcional al final: `| I: 🐶` (emoji) o `| I: https://…` (URL) → imagen de esa carta.
- Líneas inválidas → se cuentan como errores y el resto se conserva.
- Temas incluidos: `src/content/topics/<categoria>/<archivo>.md` (spec-17). Los
  documentos fuente originales viven en `src/content/sources/<categoria>/`. Temas
  personalizados: creados desde la UI (localStorage).
- El manifiesto `src/core/content/library.js` define categorías, módulos, orden y el
  mapping `topicId → sourcePath`; el catálogo adjunta `categoryId`, `moduleId`,
  `moduleTitle` y `sourcePath`. Los IDs de tema no cambian.

## Contenido

- `src/content/topics/programacion/` — cuatro temas integrados: Funciones (Módulo 1)
  y Estructuras, Algoritmos y Persistencia (Módulo 2); alimentan los 8 juegos sin
  retocar código.
- spec-12: el parser conserva la descripción completa del tema (sin recorte de 160
  caracteres) y el hub/tema muestran esa descripción íntegra.
- Temas personalizados: `createdAt` persistido; los integrados reciben `addedAt` en el
  primer avistamiento local (`sepect.topics.meta.v1`) al cargar el hub.
