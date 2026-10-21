# tasks.md — spec-12 retouch-learning-dashboard

> Spec `specs/spec-12-retouch-learning-dashboard.md` (borrador 2026-10-20).
> **Eduardo autorizó iniciar la implementación con T1 y T2** (2026-10-20).
> Plan detallado en `specs/tasks-12-retouch-learning-dashboard.md` (T1–T11).
> Estado: **T1 y T2 completados** (gates en verde). T3–T11 pendientes.
>
> Incremento anterior: spec-11 «serpiente-significados» cerrada técnicamente
> (`specs/tasks-11-serpiente-significados.md`), pendiente aprobación humana del diff.
> Siguen pendientes las aprobaciones de spec-06, spec-09 y spec-10.

## Objetivo del incremento

Retoque penúltimo en 5 bloques:

1. Descripción completa del tema (sin recorte de 160 caracteres).
2. Juegos como `GameDefinition` reutilizable + pruebas multi-tema.
3. Métricas `nuevo/aprendiendo/aprendido`, repaso espaciado y selección
   «no aprendidas + vencidas».
4. Dashboard avanzado local en `#/progreso`.
5. Hub con búsqueda, orden, filtros, portadas y fichas de juego sin descripción;
   «Sepect» fuera del header visible.

## Tareas

- [x] T1 — Parser: descripción completa (2026-10-20).
- [x] T2 — `addedAt` + `topicMeta` + `topicCoverCard` (2026-10-20).
- [ ] T3 — `learning` + `selectStudyCards` (supersede spec-03 AC-3).
- [ ] T4 — Métricas core por tema/global + actividad.
- [ ] T5 — Persistencia de intentos + GameHost + availability.
- [ ] T6 — `GameDefinition` + registry + matriz multi-tema.
- [ ] T7 — Hub: búsqueda, orden, filtros, portadas, progreso.
- [ ] T8 — TopicView: descripción completa y fichas título+portada.
- [ ] T9 — Dashboard avanzado + ruta `#/progreso`.
- [ ] T10 — CSS responsive + a11y.
- [ ] T11 — Docs, verificación adversaria y gates.

### T1 (hecho)
- `src/core/parser/parser.js`: `description` acumula toda la prosa anterior a la
  primera carta (párrafos y saltos intactos, sin `slice(0,160)`); excluye
  encabezados, código, líneas de carta y reglas horizontales (una `---` ya no se
  interpreta como carta); no lanza excepciones.
- Tests: `src/core/parser/parser.test.js` (fixture >400 chars con 2 párrafos,
  contrato exacto, vacío, código/heading/HR, prosa posterior a cartas).

### T2 (hecho)
- `src/core/content/topicMeta.js`: clave `sepect.topics.meta.v1`,
  `loadTopicMeta`/`saveTopicMeta`/`ensureTopicMeta`/`normalizeDate` — cuota o JSON
  corrupto → fallback seguro, sin mutar la entrada.
- `src/core/content/cover.js`: `topicCoverCard(topic)` → primera carta con imagen
  explícita (`card.image` o override del tema); si no, primera carta.
- `src/core/content/catalog.js`: `saveCustomTopic` persiste `createdAt` y devuelve
  `addedAt`; `buildCatalog(list, custom, meta)` expone `addedAt` sin escribir;
  `loadCatalog()` lee meta (puro, no escribe).
- Tests: `topicMeta.test.js`, `cover.test.js` (nuevos) + `catalog.test.js` (+8).

## Decisiones pendientes de firma

- Selección de cartas: no aprendidas primero + aprendidas **solo vencidas**.
- Portada de tema/ficha de juego: primera imagen del deck.
- Fechas: custom `createdAt`; integrados primer avistamiento local.
- Dashboard: `#/progreso`.
- Modularidad: objeto `GameDefinition`, sin reescritura a clases.
- Descripción completa del tema; «Sepect» fuera del header.
- Sin dependencias nuevas, sin backend, sin cambios en SM-2/Elo.

## Gates (tras T1+T2, 2026-10-20)

- `npm test`: 560/560 ✅ (59 files).
- `npm run lint`: 0 errores/warnings ✅.
- `npm run build`: OK ✅ (solo warning preexistente de chunk >500 kB).
- Verificación adversaria AC-1..AC-34 y aprobación humana del diff → al cierre (T11).

## Siguiente paso

T3 — `learning` + `selectStudyCards` (bloquea T4/T5/T6), según el grafo de
`specs/tasks-12-retouch-learning-dashboard.md`. El resto de decisiones de spec-12
siguen pendientes de firma para T3 en adelante.
