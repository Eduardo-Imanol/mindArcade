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
- Todo juego que muestre cartas debe renderizar `CardImage`: como pista (ahorcado, sopa-de-letras, quiz, caza, lluvia, serpiente), en las caras (memorama, conecta-pares) o en ambos lados (flashcards).

## Catálogo e iteración (orden acordado)

| # | ID (estable) | Juego | Mecánica con deck genérico | minCards | Origen en VocaPlayLand | Spec |
|---|---|---|---|---|---|---|
| 1 | `flashcards` | Flashcards | Frente: término; dorso: significado; voltear + autoevaluación (Otra vez / Difícil / Fácil) → SM-2 + XP | 1 | Flashcards | **spec-02 (este incremento)** |
| 2 | `memorama` | Memorama | Emparejar carta-término con carta-significado | 4 | Memory | spec-03 |
| 3 | `ahorcado` | Ahorcado | Adivinar el término letra a letra usando el significado como pista | 3 | Hangman | spec-04 |
| 4 | `sopa-de-letras` | Sopa de letras | Encontrar los términos ocultos en la cuadrícula; se marca al hallarlos | 4 | Word Search | spec-05 |
| 5 | `quiz-significado` | Elige el significado | Pregunta (término) + 4 opciones de significado; solo una correcta | 4 | Quiz / Choose the Word | spec-06 |
| 6 | `caza-significados` | Caza de significados | Arcade cronometrado: cazar la opción correcta antes de que escape (adaptación de caza de sonidos sin audio) | 4 | Sound Hunt | spec-07 |
| 7 | `intruso` | El intruso | Set de 4 significados: encontrar el que no pertenece (requiere grupos/etiquetas en el deck) | 4 | Intruder | spec-08 |
| 8 | `lluvia-meteoros` | Lluvia de meteoros | Escribir/elegir la traducción antes de que el meteoro caiga | 6 | Meteor Rush | spec-09 |
| 9 | `conecta-pares` | Conecta palabra–significado | Unir pares término↔significado tocando ambas columnas | 3 | Connect the Words | spec-10 |
| 10 | `serpiente-significados` | Serpiente de significados | Snake que come la fruta con el significado correcto del término pedido | 4 | Snake | spec-11 |

Regla de iteración: se pulen uno a uno. Cada spec se firma antes de codificar;
al terminar se actualiza este roadmap (status `available`) y se abre la siguiente.

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
- Temas incluidos: `src/content/topics/*.md`. Temas personalizados: creados desde la UI (localStorage).

## Contenido pendiente inmediato

- `src/content/topics/funciones-programacion.md` — se redacta con la información del tema
  que entregue Eduardo (tarea T11 de spec-02). Ese mismo MD alimentará los juegos 2–10
  sin retocar código.
