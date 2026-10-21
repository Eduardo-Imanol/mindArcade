# Juegos, hub, dashboard y estadísticas

El tema nuevo no necesita cableado manual. Si el archivo existe y parsea, aparece
en la app. Esta referencia explica por qué, qué juegos quedan disponibles y cómo
verificarlo.

## Por qué no hay que tocar código

- `src/core/content/catalog.js` descubre **todos** los `src/content/topics/*.md`
  con un glob de Vite (`?raw`, eager) y los ingesta como `source: 'builtin'`.
  No hay lista que mantener.
- `buildCatalog()` normaliza cada tema: `id = uniqueId(slugify(title), tomados)`,
  `title` recortado a 80 chars, `description` y `cards` del parser, `errors` a
  la vista. Un tema con 0 cartas se descarta (`ingest` devuelve `null`).
- `TopicsHub`, `TopicView`, `Dashboard` y `GameHost` llaman a `loadCatalog()`.
  Ninguno mantiene su propia lista de temas.
- `GameHost` recibe un `deck` genérico (`selectStudyCards` sobre el tema) y un
  `groups` (temas compatibles). No sabe qué tema es.
- Los juegos se declaran una sola vez en `src/games/registry.js` y aplican a
  cualquier tema.
- Los temas custom (localStorage) se añaden **después** de los built-in; si
  chocan de id, `uniqueId` añade sufijo.

Si el tema no aparece, el problema está en el archivo o en el parseo, no en la UI.

## Disponibilidad de juegos

La compuerta vive en `src/games/availability.js`
(`getGameAvailability(game, { topic, topics, studyCardCounts })`):

| Orden | Condición | `reason` | Mensaje en la ficha |
|---|---|---|---|
| 1 | `game.status !== 'available'` | `soon` | «Próximamente» |
| 2 | hay `studyCardCounts` y 0 elegibles | `all-caught-up` | «Todo al día» |
| 3 | `eligible < minCards` | `min-cards` | «Te quedan N cartas por aprender o repasar» (o «Necesitas al menos N cartas» si no hay `studyCardCounts`) |
| 4 | `minTopics > 0` y hay menos temas compatibles | `min-topics` | «En mantenimiento · agrega otro tema con al menos N cartas» |
| 5 | todo lo demás | `ok` | «Jugar ahora →» |

### Tabla de juegos (`src/games/registry.js`)

| Juego | `minCards` | Extra | Nota |
|---|---|---|---|
| `flashcards` | 1 | | Siempre disponible con ≥1 carta elegible |
| `ahorcado` | 3 | | |
| `conecta-pares` | 3 | | |
| `memorama` | 4 | | |
| `quiz-significado` | 4 | | |
| `serpiente-significados` | 4 | | |
| `lluvia-meteoros` | 6 | | Se queda bloqueada en temas pequeños |
| `intruso` | 3 | `minTopics: 2`, `minCardsPerTopic: 3` | Necesita **2 temas** con ≥3 elegibles cada uno |

### Elegibles vs. totales

- **Total** = número de cartas del tema (`topic.cards.length`).
- **Elegible** = cartas que `selectStudyCards` ofrece ahora: primero las no
  aprendidas (barajadas) y después las aprendidas **vencidas**
  (`nextReview <= now`). Una carta aprendida y no vencida no cuenta.
- El SRS se indexa por `topicId`: `srs[topicId][cardId]`.
- `useStudyCardCounts(topics, srs)` (compartido por `TopicView` y `GameHost`)
  calcula el mapa `{ [topicId]: elegibles }`; con ese mapa presente, la
  compuerta trabaja con elegibles en lugar de totales.
- Un tema de 20 cartas con todas aprendidas y no vencidas muestra «Todo al día»
  y no deja jugar hasta que venzan.
- Al **planificar** un tema cuenta cartas totales; al **verificarlo en la app**
  cuenta elegibles (con el SRS real de ese dispositivo).

### Cómo predecir el resultado

Catálogo con **un solo tema** y sin SRS (todo elegible):

| Cartas del tema | Juegos disponibles |
|---|---|
| 1–2 | `flashcards` |
| 3 | + `ahorcado`, `conecta-pares` |
| 4–5 | + `memorama`, `quiz-significado`, `serpiente-significados` |
| ≥6 | + `lluvia-meteoros` |

`intruso` queda **bloqueada** en todos los casos con un único tema: el motivo es
«En mantenimiento · agrega otro tema con al menos 3 cartas».

Con **dos temas** en el catálogo y ≥3 cartas elegibles en cada uno, `intruso` se
habilita. En `GameHost`, el juego entonces agrupa las cartas de ambos temas
(`groups`) y cada intento se imputa al tema de la carta (`context.topicId`).

## Dashboard y estadísticas

No hay registro por tema: todo se deriva del SRS y del historial.

- **Métricas por tema** — `getTopicMetrics(topic, srs, history, now)`
  (`src/core/metrics/metrics.js`):
  - `total`, `learned` (estado `learned`), `learning` (estado `learning`),
    `new` (estado `new`: 0 repeticiones), `notLearned = learning + new`,
    `progress = learned / total`. El estado sale de `getCardLearningState`:
    `new` con 0 repeticiones, `learning` con 1–2 y `learned` a partir de 3
    (`LEARNED_REPS`).
  - `dueNow`: cartas aprendidas cuyo `nextReview` ya venció.
  - `daysStudied`, `attempts`, `correct`, `accuracy`, `firstStudiedAt`,
    `lastStudiedAt`, `xp` salen del historial filtrado por `topicId`.
- **Métricas globales** — `getGlobalMetrics(topics, srs, history, profile, now)`:
  suma las métricas de todos los temas y añade `xp` y `currentStreak` del perfil,
  `bestStreak` (racha máxima por días consecutivos) y la actividad de 14 días.
- **Intentos** — cada respuesta se guarda como
  `{ topicId, cardId, grade, xp, at }` con `grade ∈ {facil, dificil, otra-vez}`
  y `GRADE_XP = { facil: 10, dificil: 25, 'otra-vez': 0 }`. El `topicId` es el
  id del tema; por eso el progreso aparece sin configuración extra.
- **`addedAt`** — `ensureTopicMeta(topics)` (en `TopicsHub`) asigna la fecha del
  primer avistamiento y la guarda en `localStorage` (`sepect.topics.meta.v1`).
  No se escribe en el `.md` ni se edita el almacenamiento a mano. El hub ordena
  por «Recientes / Antiguos» con esa fecha; el dashboard solo la lee.
- **Portada** — `topicCoverCard(topic)` (`src/core/content/cover.js`) devuelve la
  primera carta con imagen explícita (el `I: asset:` o un override) y, si no
  hay ninguna, la primera carta del tema. Con el arte obligatorio del pipeline
  es la primera carta.

## Checklist de verificación

1. `#/` — el tema aparece con portada, contador de cartas, progreso y enlace a
   su vista. El filtro de búsqueda lo encuentra por título o descripción.
2. `#/tema/<topic-id>` — 8 fichas; el contador «X de 8 disponibles» coincide con
   la predicción; los bloqueos muestran el motivo correcto («Necesitas al menos
   N cartas», «Todo al día», «En mantenimiento…»).
3. `#/tema/<topic-id>/juego/<game-id>` — el juego abre, usa cartas del tema y
   registra el intento sin errores.
4. `#/progreso` — el tema aparece en la lista con progreso, aprendidas,
   aprendiendo, nuevas y vencidas; los KPIs globales no se rompen.
5. Recarga — el progreso, la racha y el `addedAt` persisten.
6. `intruso` — con un solo tema sigue bloqueada; con dos temas compatibles se
   habilita.

## Qué no tocar

- `src/games/registry.js`, `src/games/availability.js` y los juegos.
- `src/views/Dashboard.jsx`, `TopicsHub.jsx`, `TopicView.jsx`, `GameHost.jsx`.
- `src/core/metrics/`, `src/core/storage/` y el formato del historial.
- El `.md` del tema para «arreglar» una métrica: las métricas salen del SRS y
  del historial, no del contenido.

## Si algo no cuadra

| Síntoma | Causa probable | Acción |
|---|---|---|
| El tema no aparece | El archivo no está en `src/content/topics/` o no parsea | Valida con `parseTopic` (ver `reference/topic-format.md`) |
| Faltan cartas | Líneas descartadas por formato | Revisa `errors` y el orden `Q \| A \| E \| I` |
| Una imagen no carga | El `I:` apunta a un SVG inexistente | Genera el arte y verifica la ruta |
| Todos los juegos bloqueados | 0 cartas elegibles (todo aprendido y no vencido) | Revisa el SRS local o espera al vencimiento |
| `intruso` bloqueada | Solo hay un tema compatible | Es el comportamiento esperado |
| El progreso no sube | No se registró el intento | Juega desde la ficha del tema: el intento se graba al calificar la carta |
| El hub no ordena por «Recientes» | El tema no se había visto antes en ese dispositivo | `addedAt` se fija en el primer avistamiento |
