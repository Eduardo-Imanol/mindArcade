# tasks.md — retouch-learning-dashboard (spec-12, borrador)

> Derivado de `specs/spec-12-retouch-learning-dashboard.md` (borrador 2026-10-20).
> **Estado: documentos creados; sin código ejecutado.** La implementación empieza
> solo después de la firma humana y de que Eduardo confirme el orden.
> Incremento anterior: spec-11 cerrada técnicamente (`specs/tasks-11-serpiente-significados.md`).
> Sin dependencias nuevas. Sin backend. Sin cambios en la mecánica de los 8 juegos.

## Dependency graph

```
T1 parser (descripción completa) ───────────────► T8 TopicView
T2 metadatos de tema + portada ──► T7 Hub ──────► T8
T2 ──────────────────────────────► T9 Dashboard
T3 learning + selectStudyCards ──► T5 GameHost ─► T7/T8
T3 ──────────────────────────────► T6 GameDefinition
T4 métricas core ────────────────► T5/T7/T8/T9
T5 + T6 ─────────────────────────► T7/T8/T9
T7 + T8 + T9 ────────────────────► T10 CSS/a11y
T1..T10 ─────────────────────────► T11 docs + verificación + gates
```

Cadenas críticas:

- `T1 → T8 → T10 → T11`
- `T2 → T7 → T10 → T11`
- `T3 → T5 → T7/T8 → T10 → T11`
- `T4 → T5/T7/T8/T9 → T10 → T11`
- `T6 → T8/T9 → T10 → T11`

## Tasks

### T1 — Parser: descripción completa [depends: none]
- [ ] **Deliverable:** `src/core/parser/parser.js`:
  - `parseTopic` acumula toda la prosa anterior a la primera carta, conservando
    párrafos y saltos relevantes.
  - Elimina el `slice(0, 160)` de `description`.
  - Excluye encabezados, bloques de código, líneas de carta y reglas horizontales.
  - No lanza excepciones con entradas inválidas.
- [ ] **Tests:** `src/core/parser/parser.test.js`:
  - fixture de >400 caracteres y dos párrafos → descripción exacta;
  - descripción vacía → `''`;
  - fixture A existente sigue igual;
  - multilínea/código/heading no contaminan la descripción.
- **AC cubiertos:** AC-1, AC-2 (parser), AC-3.
- **Contexto:** spec §Decisiones, HU-1; parser actual y tests existentes.
- **Done when:** tests del parser en verde y ningún test antiguo de descripción roto.
- **Estimate:** S.

### T2 — Metadatos de tema, `addedAt` y portada [depends: none]
- [ ] **Deliverable:** `src/core/content/topicMeta.js`:
  - clave `sepect.topics.meta.v1`;
  - `loadTopicMeta()`, `saveTopicMeta()`, `ensureTopicMeta(topics, now)`;
  - cuota/JSON corrupto → fallback seguro;
  - no muta la entrada.
- [ ] **Deliverable:** `src/core/content/cover.js`:
  - `topicCoverCard(topic)` → primera carta con imagen explícita; si no, primera
    carta.
- [ ] **Deliverable:** `src/core/content/catalog.js`:
  - `saveCustomTopic` persiste `createdAt`;
  - `buildCatalog` expone `addedAt` si existe, sin escribir;
  - los temas custom antiguos sin `createdAt` quedan soportados.
- [ ] **Tests:** `topicMeta.test.js`, `cover.test.js`, `catalog.test.js`:
  - fecha persistida y estable en segunda llamada;
  - corrupción segura;
  - portada con/sin imagen;
  - custom con `createdAt`.
- **AC cubiertos:** AC-7 (portada), AC-8, AC-9 (helper), AC-23 (portada dashboard).
- **Contexto:** spec HU-2; `catalog.js`; `CardImage`; `sepect.topics.custom.v1`.
- **Done when:** fechas y portada deterministas, sin side effects en `loadCatalog`.
- **Estimate:** M.

### T3 — Estados de aprendizaje y selección de estudio [depends: none]
- [ ] **Deliverable:** `src/core/repetition/learning.js`:
  - `LEARNED_REPS = 3`;
  - `getCardLearningState(state)` → `new|learning|learned`;
  - normalización de `reps` inválidos.
- [ ] **Deliverable:** `src/core/repetition/selectStudyCards.js`:
  - `selectStudyCards(cards, srs, { count, now, random })`;
  - no aprendidas primero (barajadas);
  - completar solo con aprendidas vencidas (`nextReview <= now`), por `nextReview`
    ascendente;
  - nunca devolver no vencidas; nunca más de `count`;
  - determinista con `random` fijo.
- [ ] **Deliverable:** retirar/actualizar `selectDueCards.js` y su test para que no
  quede una segunda semántica viva. La nueva regla supersede spec-03 AC-3.
- [ ] **Tests:** `learning.test.js`, `selectStudyCards.test.js`:
  - estados y bordes;
  - fixture 2 nuevas + 1 aprendiendo + 4 vencidas + 3 no vencidas;
  - `count` 0/negativo/mayor que el pool;
  - SRS inválido, `nextReview` NaN;
  - determinismo.
- **AC cubiertos:** AC-12, AC-13.
- **Contexto:** spec HU-3; `selectDueCards` actual; `sm2.js`; tests de spec-03.
- **Done when:** nueva selección pura probada; ningún uso de la regla antigua.
- **Estimate:** M.

### T4 — Métricas core [depends: T3 para estados]
- [ ] **Deliverable:** `src/core/metrics/metrics.js`:
  - `GRADE_XP = { facil: 10, dificil: 25, 'otra-vez': 0 }`;
  - `dayKey(at)` UTC (`toISOString().slice(0,10)`);
  - `getTopicMetrics(topic, srs, history, now)`;
  - `getGlobalMetrics(topics, srs, history, profile, now)`;
  - `getActivity(history, days = 14, now)`;
  - `bestStreak(days)`;
  - filtrado de intentos inválidos y derivación de XP legacy.
- [ ] **Tests:** `metrics.test.js` con `now` fijo:
  - tema 10 cartas, 4 learned/3 learning/3 new, 2 vencidas, 5 intentos en 2 días;
  - precisión, progreso, días, XP;
  - global con 2 temas, días únicos, racha actual/mejor, actividad de 14 días con
    ceros;
  - sin intentos, historial corrupto, entradas sin `topicId`, sin `xp`.
- **AC cubiertos:** AC-16, AC-17, AC-18 (cálculo), AC-24 (datos de actividad).
- **Contexto:** spec HU-3/HU-4; `store.js`; `srs.js`; `xp.js`.
- **Done when:** métricas deterministas y cubiertas con fixtures exactos.
- **Estimate:** M.

### T5 — Persistencia de intentos, GameHost y disponibilidad [depends: T2, T3, T4]
- [ ] **Deliverable:** `src/core/storage/store.js`:
  - tope de historial 5.000;
  - compatibilidad con perfiles antiguos;
  - `addAttempt` conserva `xp` si viene.
- [ ] **Deliverable:** `src/views/GameHost.jsx`:
  - `now` fijo por sesión;
  - deck = `selectStudyCards(topic.cards, srs[topic.id], { count: total, now })`;
  - `selectCards(count)` usa la misma regla;
  - `groups` de `intruso` con cartas elegibles por tema;
  - estado «Todo al día» si no hay elegibles (no monta el juego);
  - intento guardado con `xp`.
- [ ] **Deliverable:** `src/games/availability.js`:
  - acepta conteos elegibles (`studyCardCounts`) además del total;
  - mensajes nuevos para pocas cartas elegibles;
  - `intruso` usa elegibles por tema.
- [ ] **Deliverable:** `src/views/TopicView.jsx` (solo la parte de datos):
  - carga SRS y calcula elegibles para disponibilidad y conteos.
- [ ] **Tests:** `GameHost.test.jsx`, `availability.test.js`,
  `TopicView.availability.test.jsx`:
  - no aprendidas primero;
  - una aprendida no vencida no aparece;
  - una vencida sí aparece;
  - aprendida en un juego no aparece en otro hasta vencer;
  - «Todo al día» sin elegibles;
  - `intruso` con otros temas sin elegibles;
  - SRS/XP/history persisten y sobreviven al remount.
- **AC cubiertos:** AC-14, AC-15, AC-18 (persistencia), AC-19 (datos), AC-20.
- **Contexto:** spec HU-3; `GameHost.jsx`; `availability.js`; tests de integración
  existentes (habrá que ajustar fixtures con `nextReview`).
- **Done when:** todos los juegos reciben solo elegibles y los gates usan elegibles.
- **Estimate:** L.

### T6 — GameDefinition y matriz de reutilización [depends: T3]
- [ ] **Deliverable:** `src/games/definition.js`:
  - `defineGame` con validación y `Object.freeze`;
  - campos `id`, `title`, `description?`, `art?`, `status`, `minCards`, `minTopics?`,
    `minCardsPerTopic?`, `load`.
- [ ] **Deliverable:** `src/games/registry.js` usa `defineGame`; conserva los 8 IDs,
  orden y metadata.
- [ ] **Deliverable:** tests:
  - `registry.test.js` actualizado (objeto congelado, 8 available, `load()`);
  - matriz de reutilización con 2 decks (programación e idiomas) para los 8 juegos;
  - ausencia de texto hardcodeado de «Funciones» en `src/games/**`.
- **AC cubiertos:** AC-27, AC-28, AC-29, AC-30, AC-31 (parte registry).
- **Contexto:** spec HU-5; registry actual; isolation tests; fixtures de tests.
- **Done when:** registry es data-driven y la matriz multi-tema pasa.
- **Estimate:** M.

### T7 — Hub: búsqueda, orden, filtros, portadas y progreso [depends: T2, T4, T5]
- [ ] **Deliverable:** `src/views/TopicsHub.jsx`:
  - header sin «Sepect»: «Tus temas» + acciones «Crear tema»/«Progreso»;
  - buscador con lupa, `type="search"`, etiqueta accesible, limpiar;
  - selector de orden (Recientes/Antiguos/Nombre A-Z/Nombre Z-A/Más cartas/Progreso);
  - filtro de estado (Todos/Por aprender/Al día);
  - ficha con portada `topicCoverCard`, progreso, aprendidas/pendientes, días;
  - estado sin resultados;
  - conservar creación de temas y modal.
- [ ] **Deliverable:** helpers puros de búsqueda/orden/filtro (en `src/core/content/`
  o `src/views/topics.js`) con tests.
- [ ] **Tests:** `TopicsHub.test.jsx` y tests de helpers:
  - header sin «Sepect»;
  - búsqueda por título/descripción sin acentos;
  - orden por fecha/nombre/cartas/progreso;
  - filtro de estado;
  - portada y progreso;
  - «Aún no hay temas» y sin resultados.
- **AC cubiertos:** AC-4, AC-5, AC-6, AC-7, AC-8 (UI), AC-11 (hub).
- **Contexto:** spec HU-2; `TopicsHub.jsx` actual; `CardImage`; `topicMeta`.
- **Done when:** hub usable con 0/1/10+ temas y filtros deterministas.
- **Estimate:** L.

### T8 — TopicView: descripción completa y fichas de juego [depends: T1, T2, T5, T6]
- [ ] **Deliverable:** `src/views/TopicView.jsx`:
  - descripción completa con `white-space: pre-line`, sin truncado;
  - header con métricas (aprendidas/pendientes/progreso/días);
  - fichas de juego con título + portada del tema + estado/CTA;
  - eliminar descripción del juego/tema en la ficha;
  - motivo de bloqueo basado en elegibles;
  - contador `X de 8 disponibles`.
- [ ] **Tests:** `TopicView.test.jsx` y `TopicView.availability.test.jsx`:
  - descripción >160 chars visible completa y sin `line-clamp`;
  - 8 fichas, imágenes de portada (misma portada) y `alt=""`;
  - ausencia de descripciones en fichas;
  - gate por elegibles;
  - tema desconocido sigue dando 404.
- **AC cubiertos:** AC-2, AC-9 (UI), AC-10, AC-11 (TopicView), AC-15, AC-19, AC-20,
  AC-31.
- **Contexto:** spec HU-1/HU-2/HU-3; `TopicView.jsx`; `CardImage`; `GameDefinition`.
- **Done when:** la descripción se lee completa y la selección de juegos es limpia.
- **Estimate:** M.

### T9 — Dashboard avanzado y ruta `#/progreso` [depends: T2, T4, T6]
- [ ] **Deliverable:** `src/app/router.js` + `src/app/App.jsx`:
  - `parseHash('#/progreso')` → `{ view: 'progress' }`;
  - `<Dashboard />` en esa ruta;
  - enlaces desde hub y TopicView.
- [ ] **Deliverable:** `src/views/Dashboard.jsx`:
  - reemplaza el demo spec-01;
  - KPIs globales;
  - sección por tema (portada, métricas, progreso, última sesión, enlace);
  - actividad de 14 días (CSS + alternativa textual);
  - estados vacíos y datos corruptos;
  - lectura fresca al montar.
- [ ] **Tests:** `router.test.js`, `Dashboard.test.jsx`/`Dashboard.a11y.test.jsx`:
  - ruta y navegación;
  - KPIs con fixture fijo;
  - temas ordenados por pendientes;
  - actividad de 14 días;
  - estados vacíos;
  - `role="progressbar"` y `aria-valuenow`.
- **AC cubiertos:** AC-16 (vista), AC-17 (vista), AC-21, AC-22, AC-23, AC-24, AC-25,
  AC-26.
- **Contexto:** spec HU-4; `Dashboard.jsx` actual (no ruteado); `metrics.js`.
- **Done when:** dashboard avanzado local, fresco y accesible.
- **Estimate:** L.

### T10 — CSS responsive y accesibilidad [depends: T7, T8, T9]
- [ ] **Deliverable:** `src/ui/tokens.css`:
  - hub: header, buscador, filtros, grid, portadas, barras de progreso;
  - TopicView: descripción completa, fichas título+imagen, estados;
  - dashboard: KPIs, grid de temas, actividad, estados vacíos;
  - responsive 360 px, targets ≥44 px, foco visible, reduced motion.
- [ ] **Tests:** a11y de hub/TopicView/Dashboard:
  - controles nativos, labels, foco, teclado;
  - `role="progressbar"` con valores;
  - sin `line-clamp`/ellipsis en descripción;
  - contrato 360 px (regex + checklist manual).
- **AC cubiertos:** AC-10, AC-11, AC-24, AC-26, AC-33 (checklist).
- **Contexto:** spec restricciones de UI; tokens actuales; `docs/manual-a11y-checklist.md`.
- **Done when:** las tres vistas nuevas cumplen el contrato visual y a11y.
- **Estimate:** M.

### T11 — Documentación, verificación adversaria y gates [depends: T1–T10]
- [ ] **Deliverable:** docs sincronizados:
  - `specs/roadmap-games.md` (regla de selección y GameDefinition);
  - `MEMORY.md` (decisiones y aprendizajes);
  - `FOCUS.md` (estado final);
  - `docs/architecture.md` (métricas, topicMeta, GameDefinition, ruta);
  - `docs/testing.md` (nuevos contratos);
  - `docs/manual-a11y-checklist.md` (hub/tema/dashboard);
  - `tasks.md` (estado final).
- [ ] **Verificación adversaria:** revisar AC-1..AC-34 contra tests y diff; buscar
  regresiones en los 8 juegos y en los tests de selección antiguos.
- [ ] **Gates:** `npm test`, `npm run lint`, `npm run build`.
- [ ] **Cierre:** aprobación humana del diff y de la spec.
- **AC cubiertos:** AC-32, AC-33, AC-34.
- **Contexto:** spec completa; `docs/testing.md`; skill `impeccable`.
- **Done when:** gates 100 %, documentos sincronizados y firma humana.
- **Estimate:** S.

## Sizing / execution flow

- **Scope:** FE local-first, 5 subsistemas (contenido, selección/métricas, framework
  de juegos, hub/TopicView, dashboard).
- **Mode:** single-agent secuencial; T1/T2/T3 pueden ir en paralelo; T4 espera T3;
  T5 espera T2–T4; T6 espera T3; T7/T8/T9 esperan T5+T6; T10 al final; T11 cierra.
- **Estimates:** T1 S, T2 M, T3 M, T4 M, T5 L, T6 M, T7 L, T8 M, T9 L, T10 M, T11 S.
- **Riesgo principal:** el cambio de selección (spec-03 AC-3 superseded) rompe
  fixtures antiguos que esperaban backfill con aprendidas no vencidas. Se actualizan
  junto con cada tarea, no al final.
- **Regla:** no se implementa nada hasta que Eduardo firme la spec-12 y confirme el
  orden de las tareas.

## Sign-off

- [ ] Approved by: Eduardo — date: pendiente.
- Decisiones a firmar: selección no aprendidas + vencidas; portada = primera imagen
  del deck; fechas persistidas localmente; dashboard `#/progreso`; `GameDefinition`
  por objeto; descripción completa; «Sepect» fuera del header; sin dependencias
  nuevas.

## Estado actual

- [x] Documentos creados: `spec-12` + `tasks-12`.
- [ ] Código: no iniciado.
- [ ] Firma humana: pendiente.
