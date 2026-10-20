---
feature: retouch-learning-dashboard
status: draft
owner: Eduardo
created: 2026-10-20
updated: 2026-10-20
related_tasks: specs/tasks-12-retouch-learning-dashboard.md (draft — pending sign-off)
---

# Spec — Retoque de aprendizaje, temas y dashboard (spec-12)

> [!abstract] Resumen
> Incremento penúltimo de mindArcade/Sepect. Cierra cinco deudas del producto:
> (1) la descripción del tema se muestra completa, sin recorte; (2) los juegos se
> formalizan como objetos `GameDefinition` reutilizables con cualquier tema; (3) el
> aprendizaje pasa a un modelo explícito `nuevo → aprendiendo → aprendido` con repaso
> espaciado y métricas por tema y globales; (4) se crea un dashboard avanzado local en
> `#/progreso`; (5) la selección de temas y juegos gana búsqueda, orden, filtros,
> portadas y una interfaz más limpia. Sin backend, sin dependencias nuevas y sin
> reescribir la mecánica de los 8 juegos.
>
> Esta spec **supersede** el backfill de `spec-03 AC-3`: una carta aprendida solo
> vuelve a aparecer cuando su `nextReview` ya venció. Ya no se rellena con aprendidas
> no vencidas.

| Campo | Valor |
|---|---|
| Estado | 🟡 Borrador — pendiente de firma |
| Escala | Alta (parser + catálogo + selección + métricas + dashboard + framework de juegos + UI) |
| Fecha | 2026-10-20 |
| Revisada por | Eduardo — pendiente |

---

## 🎯 Decisiones propuestas (pendientes de firma)

1. **Cartas aprendidas en juegos**: solo no aprendidas + aprendidas vencidas
   (`nextReview <= now`). Las aprendidas no vencidas no aparecen. Si no hay cartas
   elegibles: «Todo al día».
2. **Imagen de la ficha de juego**: la primera imagen del deck (portada del tema),
   no el arte específico del juego. Sin descripción en la ficha.
3. **Fecha de agregado**: temas custom guardan `createdAt`; los integrados reciben
   fecha de primer avistamiento persistida en localStorage. No se editan los `.md`.
4. **Dashboard**: ruta `#/progreso` con botón «Progreso» en hub y vista de tema.
5. **Modularidad**: contrato de objeto `GameDefinition` + props únicas + pruebas
   multi-tema. Los juegos siguen siendo componentes React; no se reescriben a clases.
6. **«Sepect» visible**: se elimina del header del hub. Las claves de storage y el
   nombre del repo no cambian.

---

## 📖 Historias de usuario

### HU-1 — Descripción completa del tema
**Como** aprendiz, **quiero** leer la descripción completa del tema, **para** entender
de qué trata antes de elegir un juego.

**Criterios de aceptación:**
- [ ] AC-1: `parseTopic` captura **toda** la prosa anterior a la primera carta como
  `topic.description`, conserva párrafos y saltos de línea relevantes y **no trunca**
  (se elimina el recorte de 160 caracteres). Un fixture con descripción de >400
  caracteres y dos párrafos devuelve exactamente el mismo texto.
- [ ] AC-2: `TopicView` renderiza la descripción completa con
  `white-space: pre-line`, sin `line-clamp`, sin `text-overflow: ellipsis` y sin
  recorte por CSS. A 360 px el texto envuelve y no genera scroll horizontal.
- [ ] AC-3: Descripción vacía, multilínea, muy larga o con Markdown simple no rompe
  el parser ni la vista. Se excluyen encabezados, bloques de código, líneas de carta
  y reglas horizontales. El parser nunca lanza excepciones a la UI.

### HU-2 — Selección de temas y fichas de juego
**Como** aprendiz, **quiero** encontrar y ordenar mis temas fácilmente y ver una
portada representativa, **para** entrar rápido al tema correcto.

**Criterios de aceptación:**
- [ ] AC-4: El header visible del hub ya no contiene la palabra «Sepect». Muestra un
  título claro («Tus temas»), subtítulo, acción «Crear tema» y acción «Progreso». El
  estado vacío «Aún no hay temas» y la acción «Crear mi primer tema» se conservan.
- [ ] AC-5: El hub incluye un buscador con icono de lupa, `type="search"`, etiqueta
  accesible y botón de limpiar. Filtra por título y descripción sin distinguir
  mayúsculas, acentos ni signos. Sin resultados muestra un estado vacío claro.
- [ ] AC-6: El hub incluye un selector de orden con estas opciones exactas:
  **Recientes**, **Antiguos**, **Nombre A-Z**, **Nombre Z-A**, **Más cartas** y
  **Progreso**. Default `Recientes`. Desempate determinista por título. Incluye
  además un filtro de estado: **Todos**, **Por aprender**, **Al día**.
- [ ] AC-7: Cada ficha de tema muestra:
  - portada resuelta por `CardImage` (ver AC-9);
  - título y número de cartas;
  - barra de progreso con `role="progressbar"` y valores accesibles;
  - `X aprendidas · Y por aprender`;
  - días de estudio del tema;
  - enlace a `#/tema/:topicId`.
- [ ] AC-8: `Topic.addedAt` está disponible para todos los temas:
  - custom: `createdAt` persistido al crearlo;
  - integrado: primer avistamiento persistido en `sepect.topics.meta.v1`;
  - temas custom antiguos sin `createdAt`: reciben fecha de primer avistamiento;
  - datos ausentes o corruptos: fallback seguro y orden determinista.
  Las fechas sobreviven al reload. `loadCatalog()` sigue siendo puro;
  `ensureTopicMeta(topics)` es quien persiste las fechas faltantes.
- [ ] AC-9: La portada del tema (`topicCoverCard`) es la primera carta con imagen
  explícita (`card.image` o override del tema); si ninguna la tiene, se usa la
  primera carta y `CardImage` dibuja su fallback. En la ficha de juego se usa la
  misma portada, no el arte propio del juego. El arte propio queda como metadata
  opcional, sin renderizarse en `TopicView`.
- [ ] AC-10: La ficha de juego muestra **solo** título, portada y estado/CTA
  («Jugar ahora» o el motivo de bloqueo). No muestra descripción del juego ni del
  tema. Los 8 juegos siguen apareciendo en el orden del registry. Las imágenes
  decorativas usan `alt=""`; la portada de tema usa un `alt` con el título.
- [ ] AC-11: Hub y TopicView son operables con teclado, tienen foco visible,
  objetivos táctiles ≥44 px y no generan scroll horizontal a 360 px.

### HU-3 — Métricas, estados de aprendizaje y repaso espaciado
**Como** aprendiz, **quiero** que los juegos me muestren solo lo que aún no domino y
ver mi progreso real, **para** no repetir lo aprendido y concentrarme en lo pendiente.

**Criterios de aceptación:**
- [ ] AC-12: `LEARNED_REPS = 3` y `getCardLearningState(state)` son puros y devuelven:
  - `new`: sin estado SRS o `reps === 0` (incluye cartas falladas que reinician);
  - `learning`: `reps` 1–2;
  - `learned`: `reps >= 3`.
  Estados inválidos, negativos o no numéricos se normalizan sin lanzar.
- [ ] AC-13: `selectStudyCards(cards, srs, { count, now, random })` es puro y:
  - devuelve primero las no aprendidas (`new` + `learning`), barajadas con `random`
    inyectable;
  - si faltan para llegar a `count`, completa **solo** con aprendidas vencidas
    (`nextReview <= now`), ordenadas por `nextReview` ascendente;
  - nunca devuelve aprendidas no vencidas;
  - nunca devuelve más de `count`;
  - con `count` inválido, deck vacío o SRS corrupto devuelve un array seguro;
  - con `random` fijo es determinista.
- [ ] AC-14: `GameHost` calcula un `now` fijo por sesión y pasa a todos los juegos
  únicamente el deck elegible y un `selectCards(count)` con la misma regla. Una carta
  aprendida en un juego deja de ofrecerse en los demás hasta que venza. Si vuelve a
  fallar (`reps = 0`), vuelve a considerarse no aprendida.
- [ ] AC-15: Si no hay cartas elegibles, `GameHost` muestra una pantalla central
  «Todo al día» con enlace para volver al tema y **no monta el juego**. Si hay menos
  cartas que el `minCards` del juego, `TopicView` muestra un motivo basado en cartas
  elegibles («Te quedan N cartas por aprender o repasar»), no en el total del tema.
- [ ] AC-16: `getTopicMetrics(topic, srs, history, now)` devuelve exactamente:
  `total`, `learned`, `learning`, `new`, `notLearned`, `dueNow`, `progress` (0–1),
  `daysStudied`, `attempts`, `correct`, `accuracy` (0–1 o `0` sin intentos),
  `firstStudiedAt`, `lastStudiedAt` y `xp`.
- [ ] AC-17: `getGlobalMetrics(topics, srs, history, profile, now)` agrega los mismos
  campos y añade `currentStreak`, `bestStreak`, `topics` y `activity`. `activity` es
  un array de los últimos 14 días con `{ date: 'YYYY-MM-DD', attempts, correct }`,
  incluyendo días con cero. El día se calcula en UTC (`toISOString().slice(0,10)`)
  para ser consistente con `recordStreak`.
- [ ] AC-18: Cada intento persistido en `sepect.profile.v1.history` incluye
  `{ topicId, cardId, grade, xp, at }`. El tope de historial sube de 1.000 a 5.000.
  Intentos antiguos sin `topicId` se ignoran para métricas; sin `xp` se deriva del
  `grade` (`facil=10`, `dificil=25`, `otra-vez=0`). Las métricas se actualizan al
  volver de un juego y sobreviven al reload.
- [ ] AC-19: Las fichas de tema del hub y el header de `TopicView` muestran las mismas
  métricas (aprendidas, pendientes, progreso y días). Al volver de un juego, los
  conteos reflejan los grados recién guardados.
- [ ] AC-20: `intruso` recibe `groups` construidos con cartas elegibles por tema. Un
  tema solo es elegible como distractor si alcanza `minCardsPerTopic` cartas
  elegibles. La disponibilidad de `intruso` se calcula con esos conteos. No hay texto
  de tema hardcodeado en ningún juego.

### HU-4 — Dashboard avanzado local
**Como** aprendiz, **quiero** un dashboard con mi progreso global y por tema,
**para** saber qué he aprendido y qué me falta sin salir de la app.

**Criterios de aceptación:**
- [ ] AC-21: `#/progreso` renderiza el dashboard avanzado. `#/` sigue siendo el hub,
  `#/tema/:id` la vista de tema y las rutas desconocidas siguen dando 404. El hub y
  `TopicView` incluyen un enlace «Progreso».
- [ ] AC-22: El dashboard muestra KPIs globales: XP total, racha actual, días de
  estudio, precisión, cartas aprendidas / total, progreso global y cartas vencidas
  para repasar.
- [ ] AC-23: El dashboard muestra una sección por tema con portada, título, total de
  cartas, aprendidas, aprendiendo, nuevas, vencidas, días de estudio, precisión,
  barra de progreso, última sesión y enlace al tema. Orden por pendientes
  descendente y, en empate, por título.
- [ ] AC-24: El dashboard muestra la actividad de los últimos 14 días con barras CSS
  y una alternativa textual/tabla accesible. No se añaden librerías de gráficos.
- [ ] AC-25: Estados vacíos: sin temas, sin intentos y datos corruptos. El dashboard
  se lee de forma fresca al montar, no lanza excepciones y no hace llamadas de red.
- [ ] AC-26: Dashboard operable por teclado, foco visible, barras con
  `role="progressbar"` y `aria-valuenow`, sin scroll horizontal a 360 px.

### HU-5 — Juegos modulares por objeto
**Como** desarrollador, **quiero** que cada juego sea un objeto de definición con
parámetros claros, **para** añadir temas y juegos sin duplicar código ni tocar vistas.

**Criterios de aceptación:**
- [ ] AC-27: `defineGame({ id, title, description?, art?, status, minCards,
  minTopics?, minCardsPerTopic?, load })` devuelve un objeto congelado
  (`Object.freeze`). El registry usa `defineGame` y `getGame(id)` devuelve `null` para
  IDs desconocidos. El catálogo mantiene los 8 juegos `available` y su orden.
- [ ] AC-28: Contrato único de props:
  `{ deck, selectCards, groups?, anchorTopicId?, topic?, onGrade, onExit }`.
  Ningún juego importa `storage`, `parser`, `content` ni `router`. Los tests de
  aislamiento de los 8 juegos siguen pasando (escaneo de imports directos).
- [ ] AC-29: Matriz de reutilización: cada uno de los 8 juegos carga y alcanza su
  pantalla de setup o de juego con al menos 2 decks de temas distintos (fixture de
  programación y fixture de idiomas), sin cambios de código por tema. No aparece
  texto hardcodeado de «Funciones en Programación» en ningún juego.
- [ ] AC-30: Añadir un juego nuevo requiere una carpeta en `src/games/<id>/` y una
  entrada `defineGame` en el registry; no se tocan `TopicView`, `TopicsHub`,
  `GameHost` ni el contenido. La única rama específica permitida en `GameHost` es la
  construcción de `groups`/`anchorTopicId` para `intruso`, documentada.
- [ ] AC-31: `TopicView` consume la metadata de `GameDefinition` (título, mínimo,
  estado y orden) y no mantiene una lista duplicada de juegos.

### HU-6 — Calidad, documentación y cierre
**Como** equipo, **queremos** cerrar el incremento con gates verdes y documentos
sincronizados, **para** que la siguiente sesión no reconstruya decisiones.

**Criterios de aceptación:**
- [ ] AC-32: `npm test` pasa al 100 %, `npm run lint` queda en 0 errores/warnings y
  `npm run build` termina OK.
- [ ] AC-33: Documentos sincronizados: `specs/spec-12-*.md`, `tasks.md`,
  `specs/tasks-12-*.md`, `specs/roadmap-games.md`, `MEMORY.md`, `FOCUS.md`,
  `docs/architecture.md`, `docs/testing.md` y `docs/manual-a11y-checklist.md`.
- [ ] AC-34: Sin dependencias nuevas, sin backend, sin llamadas de red para progreso
  y sin cambios en la matemática SM-2/Elo. La única regla de selección que cambia es
  la definida en AC-13/AC-14.

---

## 🚧 Restricciones arquitectónicas

- **Stack**: Vite 5 + React 18 + Tailwind. Sin dependencias nuevas. Gráficos con CSS
  y SVG nativo.
- **Capas**:
  - `src/core/parser/parser.js` sigue siendo el único parser de Markdown.
  - `src/core/content/` resuelve catálogo, metadatos de tema y portada.
  - `src/core/repetition/` contiene estados de aprendizaje y selección pura.
  - `src/core/metrics/` es nuevo, puro y deriva métricas de catálogo + SRS + historial;
    no persiste por sí mismo.
  - `src/core/storage/` sigue siendo el único punto de persistencia.
  - `src/games/` no importa storage/parser/content/router.
- **Persistencia**:
  - Se conservan las claves `sepect.profile.v1`, `sepect.srs.v1`,
    `sepect.topics.custom.v1`, `sepect.settings.v1`, `sepect.images.v1`.
  - Nueva clave `sepect.topics.meta.v1`:
    `{ [topicId]: { addedAt: 'ISO-8601' } }`.
  - `sepect.profile.v1.history` pasa a tope 5.000; los intentos nuevos llevan `xp`.
  - Sin red. Sin backend.
- **Selección**: `selectStudyCards` sustituye a `selectDueCards`. La regla de
  backfill con aprendidas no vencidas de `spec-03 AC-3` queda **superseded** por
  AC-13. Los tests de spec-03/04/06/09/10/11 que asumían el backfill se actualizan.
- **Fechas**: `addedAt`, `createdAt`, `at` en ISO-8601. Para días de estudio y
  actividad se usa la fecha UTC (`toISOString().slice(0,10)`), consistente con
  `recordStreak`.
- **GameDefinition**: objeto congelado con metadata + `load()` dinámico. Los
  componentes siguen siendo React; no se introduce una jerarquía de clases.
- **UI**: mobile-first, tokens actuales, targets ≥44 px, foco visible,
  `prefers-reduced-motion`, sin scroll horizontal a 360 px.
- **Rendimiento**: métricas O(temas × cartas + historial) memoizadas; no se añaden
  re-renders a 60 fps ni cálculos por frame.
- **Accesibilidad**: WCAG AA, labels nativos, `aria-live` sin mensajes obsoletos,
  barras de progreso con valores accesibles y alternativa textual a la actividad.

---

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Descripción de 2.000 caracteres o varios párrafos | Se muestra completa; envuelve; no hay ellipsis ni scroll horizontal |
| Descripción vacía | Header sin párrafo; no se inventa texto |
| Tema sin cartas | No entra al catálogo (comportamiento actual); si se fuerza, portada fallback y métricas en cero |
| Tema sin imagen | `CardImage` dibuja el fallback determinista; nunca un `<img>` roto |
| Tema custom antiguo sin `createdAt` | `ensureTopicMeta` le asigna la fecha de primer avistamiento |
| `sepect.topics.meta.v1` corrupto | Se ignora, se regenera y el orden usa fallback determinista |
| Todas las cartas aprendidas y ninguna vencida | «Todo al día»; juegos no montados |
| Mezcla de nuevas, aprendiendo, vencidas y no vencidas | Solo entran nuevas/aprendiendo + vencidas |
| Carta aprendida con `nextReview` inválido | Se trata como no vencida; no se ofrece |
| Carta fallada (`reps=0`) | Vuelve a estado `new` y puede aparecer de nuevo |
| `intruso` sin otro tema con cartas elegibles | Se bloquea con motivo claro basado en elegibles |
| Tema con menos cartas elegibles que `minCards` | Motivo «Te quedan N cartas por aprender o repasar» |
| Historial corrupto o entradas antiguas sin `topicId` | Se ignoran para métricas; no rompen el dashboard |
| Intento antiguo sin `xp` | Se deriva del `grade` |
| Más de 5.000 intentos | Se conservan los últimos 5.000; las métricas reflejan ese histórico |
| 0 temas / 0 intentos / 10+ temas | Estados vacíos y métricas en cero; sin crash |
| 360 px con títulos o descripciones largas | Sin scroll horizontal; texto envuelve |
| Cambio de pestaña durante un juego | Se mantiene la pausa existente; no se toca |
| localStorage lleno | Fallback en memoria y aviso no bloqueante (patrón actual) |

---

## 🧪 Contrato de pruebas

### Parser y contenido

```
ENTRADA:  parseTopic(`# Tema\n${'Una descripción muy larga. '.repeat(40)}\n\nSegundo párrafo.\n\n- Q: a | A: b`)
SALIDA:   topic.description === todo el texto (incluye \n\n), sin recorte;
          cards[0] = { front:'a', back:'b' }

ENTRADA:  parseTopic('# Tema\n- Q: a | A: b')
SALIDA:   topic.description === ''
```

### Fechas y portada

```
ENTRADA:  ensureTopicMeta([{ id:'funciones', source:'builtin' }], now)
SALIDA:   cada tema tiene addedAt ISO; se persiste en sepect.topics.meta.v1;
          una segunda llamada no cambia la fecha

ENTRADA:  topicCoverCard({ cards:[{id:'a',front:'A'}, {id:'b',front:'B',image:{kind:'asset',value:'x.svg'}}] })
SALIDA:   carta 'b' (primera con imagen explícita)

ENTRADA:  topicCoverCard({ cards:[{id:'a',front:'A'}] })
SALIDA:   carta 'a' (fallback de CardImage)
```

### Aprendizaje y selección

```
ENTRADA:  getCardLearningState(undefined) → 'new'
          getCardLearningState({reps:0})    → 'new'
          getCardLearningState({reps:1})    → 'learning'
          getCardLearningState({reps:2})    → 'learning'
          getCardLearningState({reps:3})    → 'learned'

ENTRADA:  selectStudyCards(
            10 cartas: 2 nuevas, 1 aprendiendo, 4 aprendidas vencidas,
                       3 aprendidas no vencidas,
            { count: 8, now, random: fijo }
          )
SALIDA:   máximo 7 cartas: 3 no aprendidas + 4 vencidas;
          ninguna de las 3 no vencidas; nunca > count

ENTRADA:  selectStudyCards(cards, srs, { count: 5, now })
SALIDA:   si no hay elegibles → []
```

### Métricas

```
ENTRADA:  getTopicMetrics(
            tema con 10 cartas,
            srs: 4 learned (2 vencidas), 3 learning, 3 new,
            historial: 5 intentos en 2 días, 4 correctos,
            now
          )
SALIDA:   { total:10, learned:4, learning:3, new:3, notLearned:6,
            dueNow:2, progress:0.4, daysStudied:2, attempts:5,
            correct:4, accuracy:0.8, firstStudiedAt:<min>, lastStudiedAt:<max>,
            xp:<derivado> }

ENTRADA:  getGlobalMetrics(2 temas, srs, historial, profile, now)
SALIDA:   sumas globales + currentStreak + bestStreak + topics + activity[14]
          (incluye días con 0 intentos)
```

### Búsqueda, orden y rutas

```
ENTRADA:  filterAndSortTopics(topics, { query:'FUNCION', sort:'recent' })
SALIDA:   coincidencias por título/descripción sin acentos ni mayúsculas;
          orden addedAt desc y desempate por título

ENTRADA:  filterAndSortTopics(topics, { status:'pending' })
SALIDA:   solo temas con notLearned > 0

ENTRADA:  parseHash('#/progreso')
SALIDA:   { view:'progress' }
```

### Juegos y UI

- `defineGame` devuelve un objeto congelado; `getGame('nope') === null`; los 8
  juegos `load()` resuelven un componente.
- Matriz de reutilización: los 8 juegos arrancan con deck A (programación) y deck B
  (idiomas), sin texto de tema hardcodeado.
- `GameHost`: cartas no aprendidas primero; una aprendida no vencida no se ofrece;
  una vencida sí; una aprendida en un juego no aparece en otro hasta vencer; sin
  elegibles → «Todo al día»; salida y persistencia de SRS/XP/history intactas.
- `TopicsHub`: header sin «Sepect»; buscador con lupa; orden y filtro; portada;
  progreso; estado vacío.
- `TopicView`: descripción completa sin truncado; 8 fichas con título + portada,
  sin descripción; estado de bloqueo basado en elegibles.
- `Dashboard`: KPIs, temas, actividad, estados vacíos, `role="progressbar"`, enlace
  desde hub/tema y ruta `#/progreso`.
- A11y: teclado, foco visible, 44 px, 360 px sin scroll horizontal, reduced motion.

**ERROR ESPERADO**: ninguno lanzado a la UI por datos corruptos, temas sin cartas,
SRS inválido, historial inválido o storage lleno.

---

## 📂 Fuera de alcance

- Reescribir los 8 juegos a clases o cambiar su mecánica, scoring, TTS o reglas.
- Backend, cuentas, sync en la nube, PWA, deploy.
- Nuevas dependencias (gráficos, iconos, fechas, estado).
- Editar/eliminar temas después de crearlos; importar/exportar; migraciones de datos
  más allá de las descritas.
- Un modo manual de «repasar todas» cuando no hay cartas elegibles. En esta spec el
  repaso es automático por vencimiento.
- Fechas históricas exactas para temas integrados: se usa primer avistamiento local.
- Agregados de métricas más allá del tope de 5.000 intentos.
- Cambios en `scheduleNext`/SM-2/Elo, en el motor de juego o en las reglas de XP.
- Reemplazar el arte propio de los juegos en otros contextos: solo se deja de usar
  en la ficha de `TopicView`.

---

## ✍️ Firma

- [ ] Spec revisada y firmada por humano (punto de no retorno).
- Decisiones a firmar: selección no aprendidas + vencidas; portada = primera imagen
  del deck; fechas persistidas localmente; dashboard `#/progreso`; `GameDefinition`
  por objeto; descripción completa; «Sepect» fuera del header; sin dependencias
  nuevas.

**Nota de estado:** este documento es un borrador. No se implementa código hasta que
Eduardo lo firme y confirme el orden de las tareas.
