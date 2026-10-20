# tasks.md — spec-12 retouch-learning-dashboard (borrador)

> Spec `specs/spec-12-retouch-learning-dashboard.md` creada el 2026-10-20 y
> **pendiente de firma**. Plan detallado en
> `specs/tasks-12-retouch-learning-dashboard.md` (T1–T11).
> **Estado actual: solo documentos.** Sin código ejecutado, sin commit.
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

- [ ] T1 — Parser: descripción completa.
- [ ] T2 — `addedAt` + `topicMeta` + `topicCoverCard`.
- [ ] T3 — `learning` + `selectStudyCards` (supersede spec-03 AC-3).
- [ ] T4 — Métricas core por tema/global + actividad.
- [ ] T5 — Persistencia de intentos + GameHost + availability.
- [ ] T6 — `GameDefinition` + registry + matriz multi-tema.
- [ ] T7 — Hub: búsqueda, orden, filtros, portadas, progreso.
- [ ] T8 — TopicView: descripción completa y fichas título+portada.
- [ ] T9 — Dashboard avanzado + ruta `#/progreso`.
- [ ] T10 — CSS responsive + a11y.
- [ ] T11 — Docs, verificación adversaria y gates.

## Decisiones pendientes de firma

- Selección de cartas: no aprendidas primero + aprendidas **solo vencidas**.
- Portada de tema/ficha de juego: primera imagen del deck.
- Fechas: custom `createdAt`; integrados primer avistamiento local.
- Dashboard: `#/progreso`.
- Modularidad: objeto `GameDefinition`, sin reescritura a clases.
- Descripción completa del tema; «Sepect» fuera del header.
- Sin dependencias nuevas, sin backend, sin cambios en SM-2/Elo.

## Gates de cierre (cuando se implemente)

- `npm test`: 100 %.
- `npm run lint`: 0 errores/warnings.
- `npm run build`: OK.
- Verificación adversaria AC-1..AC-34 y aprobación humana del diff.

## Siguiente paso

Revisar y firmar `specs/spec-12-retouch-learning-dashboard.md`. Después, ejecutar
T1–T11 en el orden del grafo de `specs/tasks-12-retouch-learning-dashboard.md`.
