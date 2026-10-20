# FOCUS

## Active objective (single)
spec-12 "retouch-learning-dashboard" — **borrador creado 2026-10-20**; pendiente de
firma de Eduardo. Solo se crearon documentos; **no se ha implementado código**.

## Current phase
Fases SDD para spec-12:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 🟡 `specs/spec-12-retouch-learning-dashboard.md` creada como borrador. Decisiones
  propuestas: descripción completa; portada = primera imagen del deck; fechas
  persistidas localmente; selección no aprendidas + vencidas; dashboard `#/progreso`;
  `GameDefinition` por objeto; «Sepect» fuera del header; sin deps nuevas.
- F3 🟡 `specs/tasks-12-retouch-learning-dashboard.md` creada con T1–T11 y grafo.
- F4 ⏸️ Bloqueada hasta firma humana de la spec.
- F5 ⏸️ Pendiente.
- F6 ⏸️ Pendiente.

## Blockers
- Firma humana de `specs/spec-12-retouch-learning-dashboard.md`.
- Confirmación del orden de tareas (T1–T11).

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
Revisar y firmar `specs/spec-12-retouch-learning-dashboard.md`. Después, ejecutar
T1–T11 según `specs/tasks-12-retouch-learning-dashboard.md`.
