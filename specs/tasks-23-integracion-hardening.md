# tasks-23 — integracion-hardening

> Derivado de `specs/spec-23-integracion-hardening.md` (**firmada 2026-10-23**).
> Lista para implementar.
> Depende de `spec-17`..`spec-22`. No añade features nuevas.

## Objetivo del incremento

Verificar que todo el programa convive, cerrar `spec-16`, ejecutar la matriz de
integración, blindar storage/cuota y dejar documentación/gates en verde.

## Grafo de dependencias

```
T1 auditoría de specs/dependencias + spec-16
├── T2 matriz de rutas/storage ─┐
├── T3 matriz de juegos/arcade/TTS ─┼── T5 docs + gates + cierre
└── T4 a11y/rendimiento/bundle ─┘
```

T2–T4 pueden ejecutarse en paralelo tras T1; T5 requiere todo.

---

## Tareas

### T1 — Auditoría de specs y cierre de spec-16 [depends: none]
- [ ] **Deliverable:** checklist de firma/implementación de specs 17–22, grafo de
  dependencias real y verificación de las fases 17 → 19 → 18 → 20 ∥ 22 → 21.
- [ ] **Deliverable:** renombrar el archivo `specs/spec-16-flashcards-decks.md\n`
  (sufijo literal `\n`, no salto de línea) a
  `specs/spec-16-flashcards-decks.md`, verificar contenido y cerrar su estado/tasks.
- [ ] **Verificación:** no hay tasks huérfanas ni ACs sin dueño.
- **AC cubiertos:** AC-1.
- **Done when:** el programa tiene orden y `spec-16` está legible.
- **Estimate:** S.

### T2 — Matriz de rutas, storage y compatibilidad [depends: T1]
- [ ] **Deliverable:** checklist/automático de las 8 rutas + deep link/recarga/atrás.
- [ ] **Deliverable:** pruebas de storage:
  - keys existentes compatibles;
  - actualización desde estado previo;
  - `sepect.exercises.v1` convive con SRS/arcade sin duplicar dominio;
  - cuota llena/corrupta;
  - custom topics sin source.
- [ ] **Fixes:** solo bugs de las specs de origen, con test de regresión.
- **AC cubiertos:** AC-2, AC-4, AC-9.
- **Contexto:** `router.js`, `store.js`, `catalog.js`, `sources.js`.
- **Done when:** no hay pérdida de progreso ni rutas rotas.
- **Estimate:** M.

### T3 — Matriz de juegos, arcade y TTS [depends: T1]
- [ ] **Deliverable:** recorrido de los 11 juegos (8 existentes, incluido Ahorcado,
  + 3 de código): mazos, dominio, arcade, récords, TTS/mute, «Próximamente».
- [ ] **Verificación:** los 3 juegos de código abren los mismos 6 ejercicios,
  dificultad 2/4/6, progreso por ejercicio y nivel completado; normal vs arcade;
  mazo perfecto/fallo; recarga de récord; un juego de otra categoría no se abre por
  URL.
- [ ] **Fixes:** en la spec de origen + test.
- **AC cubiertos:** AC-3, AC-6, AC-9.
- **Done when:** cada juego respeta spec-18/20/21/22.
- **Estimate:** M.

### T4 — Accesibilidad, rendimiento y bundle [depends: T1]
- [ ] **Deliverable:** checklist a11y (teclado, VoiceOver, foco, contraste, 360 px,
  `aria-live`) de las vistas nuevas.
- [ ] **Verificación:** bundle inicial sin sources/exercises; lazy de juegos y del
  documento Markdown de ejercicios; 60 fps/pausa en hidden; sin
  listeners/iframes/TTS huérfanos.
- [ ] **Fixes:** en la spec de origen.
- **AC cubiertos:** AC-5, AC-6, AC-9.
- **Done when:** no hay regresiones medibles.
- **Estimate:** M.

### T5 — Documentación, gates y cierre [depends: T2–T4]
- [ ] **Deliverable:** `docs/architecture.md`, `docs/testing.md`,
  `docs/manual-a11y-checklist.md`, `MEMORY.md`, `FOCUS.md`.
- [ ] **Gates:** `npm test`, `npm run lint`, `npm run build` al 100%.
- [ ] **Cierre:** ACs, tasks, firmas y programa declarado terminado.
- **AC cubiertos:** AC-7, AC-8 y DoD.
- **Done when:** todo verde y sin TODOs de las specs.
- **Estimate:** S.

---

## Fuera de alcance

- Features nuevas.
- Backend/sync/cuentas/analítica remota.
- Reescritura de juegos o esquema SRS.
- Deploy/publicación.

## Definition of Done

- [ ] Specs 17–22 firmadas/implementadas en el orden por fases; `spec-16` cerrada.
- [ ] Matrices de rutas/juegos/storage/a11y ejecutadas.
- [ ] Ejercicios universales, dificultad 2/4/6 y nivel completado verificados en los
  3 juegos.
- [ ] `npm test`, `npm run lint`, `npm run build` en verde.
- [ ] Sin dependencias nuevas, sin red para progreso/XP/historial, sin secretos.
- [ ] Docs/MEMORY/FOCUS actualizados.
- [ ] Diff revisado por humano.
