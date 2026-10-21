# FOCUS

## Active objective (single)
spec-12 "retouch-learning-dashboard" — **T1 y T2 completados 2026-10-20** con
arranque autorizado por Eduardo («la spec 12 comienza con T1 y T2»). Gates en verde
(tests 560/560, lint 0, build OK). T3–T11 pendientes; firma completa de la spec
sigue abierta.

## Current phase
Fases SDD para spec-12:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 ✅ `specs/spec-12-retouch-learning-dashboard.md` creada (borrador) y **arranque
  parcial autorizado** por Eduardo 2026-10-20 para T1+T2.
- F3 ✅ `specs/tasks-12-retouch-learning-dashboard.md` con T1–T11 y grafo.
- F4 🟡 Implementación en marcha: **T1 ✅ T2 ✅**; T3–T11 en espera (T3/T4 pueden
  arrancar en paralelo con firma).
- F5 ⏸️ Pendiente (docs + verificación adversaria = T11).
- F6 ⏸️ Pendiente.

## Blockers
- Firma completa de `specs/spec-12-retouch-learning-dashboard.md` para T3–T11
  (especialmente la regla de selección que supersede spec-03 AC-3).
- (Superado) autorización de arranque T1+T2 — concedida 2026-10-20.

## Done this session (2026-10-20)
- **T1 — parser**: `description` completa sin `slice(0,160)`, prosa anterior a la
  primera carta con párrafos intactos; excluye heading/código/HR; fix: la HR `---`
  ya no se interpreta como carta. Tests nuevos en `parser.test.js`.
- **T2 — fechas y portada**: `src/core/content/topicMeta.js`
  (`sepect.topics.meta.v1`, `loadTopicMeta`/`saveTopicMeta`/`ensureTopicMeta`,
  fallback seguro, sin mutar entrada), `src/core/content/cover.js`
  (`topicCoverCard`), `catalog.js` con `createdAt` en `saveCustomTopic` y
  `addedAt` en `buildCatalog(..., meta)` sin escribir; `loadCatalog()` lee meta.
  Tests: `topicMeta.test.js` (12), `cover.test.js` (6), `catalog.test.js` (+8).

## Decisiones propuestas (spec-12, pendientes de firma)
- **Selección de estudio**: no aprendidas (`new`/`learning`) primero; completar solo
  con aprendidas vencidas (`nextReview <= now`). Nunca aprendidas no vencidas. Esto
  supersede el backfill de spec-03 AC-3.
- **Estados**: `new` (sin SRS o `reps=0`), `learning` (`reps 1–2`), `learned`
  (`reps >= 3`); `LEARNED_REPS = 3`.
- **Métricas**: `getTopicMetrics`/`getGlobalMetrics` derivadas de catálogo + SRS +
  historial; días y actividad en UTC; historial con tope 5.000; intentos con `xp`.
- **Dashboard**: ruta `#/progreso`, KPIs globales, sección por tema, actividad 14
  días, estados vacíos, sin librerías nuevas.
- **Fechas**: custom `createdAt`; integrados primer avistamiento en
  `sepect.topics.meta.v1`.
- **Portada**: `topicCoverCard` = primera carta con imagen explícita; si no, primera
  carta. Se usa en ficha de tema y ficha de juego.
- **Fichas de juego**: título + portada + estado/CTA; sin descripción.
- **Hub**: sin «Sepect» visible; buscador con lupa; orden por fecha/nombre/cartas/
  progreso; filtro de estado.
- **Modularidad**: `GameDefinition` congelado + props únicas; matriz de reutilización
  con 2 temas; sin reescritura a clases.
- **Alcance**: sin deps nuevas, sin backend, sin cambios en SM-2/Elo ni en la
  mecánica de los 8 juegos.

## Previous increment
spec-11 "serpiente-significados" — cerrada técnicamente 2026-10-20; pendiente
aprobación humana del diff. Catálogo **8 available / 0 soon**.

## Next atomic step
T3 — `src/core/repetition/learning.js` + `selectStudyCards` (supersede spec-03
AC-3; requiere la firma de la spec-12). En paralelo T4 (métricas) depende de T3.
Después T5/T6 → T7/T8/T9 → T10 → T11 (docs + gates + firma del diff).
