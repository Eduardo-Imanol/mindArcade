# tasks-20 — juegos-por-categoria

> Derivado de `specs/spec-20-juegos-por-categoria.md` (**firmada 2026-10-23**).
> Lista para implementar.
> Depende de `spec-17` (topic.categoryId). Sin dependencias nuevas.

## Objetivo del incremento

Que el registry sepa a qué categorías aplica cada juego y que TopicView/GameHost
muestren solo los juegos válidos, manteniendo los 8 actuales como globales.

## Grafo de dependencias

```
T1 defineGame.categories
└── T2 registry filtro
    └── T3 TopicView + GameHost
        └── T4 docs + gates + cierre
```

---

## Tareas

### T1 — `defineGame.categories` [depends: none]
- [x] **Deliverable:** `src/games/definition.js`:
  - `categories?: string[]`, default `['*']`;
  - valida array no vacío, strings no vacíos, deduplica;
  - `TypeError` claro;
  - mantiene `Object.freeze`.
- [x] **Tests:** `definition.test.js`:
  - default global;
  - válidos;
  - vacío/string/objeto/null;
  - duplicados;
  - freeze.
- **AC cubiertos:** AC-1.
- **Contexto:** spec §Decisión 1; `defineGame` actual.
- **Done when:** los juegos pueden declarar alcance sin romper el contrato.
- **Estimate:** S.

### T2 — Filtro del registry [depends: T1]
- [x] **Deliverable:** `src/games/registry.js`:
  - `listGames({ categoryId } = {})` compatible con `listGames()`;
  - `gamesForCategory(categoryId)`;
  - `isGameForCategory(game, categoryId)`;
  - orden estable.
- [x] **Tests:** `registry.test.js`:
  - 8 globales;
  - programación;
  - idiomas/universidad;
  - categoría desconocida;
  - no mutación.
- **AC cubiertos:** AC-2, AC-3.
- **Contexto:** spec §Decisión 2.
- **Done when:** los 8 actuales no cambian y el filtro es puro.
- **Estimate:** S.

### T3 — TopicView y GameHost [depends: T2]
- [x] **Deliverable:** `src/views/TopicView.jsx`:
  - filtrar por `topic.categoryId`;
  - contador/estado vacío;
  - no romper disponibilidad ni enlaces.
- [x] **Deliverable:** `src/views/GameHost.jsx`:
  - validar `isGameForCategory`;
  - mensaje/NotFound sin importar el módulo;
  - conservar ruta.
- [x] **Tests:** `TopicView.test.jsx`, `GameHost.test.jsx`:
  - programación con globales + nuevos;
  - idiomas sin nuevos;
  - custom con globales;
  - mismatch;
  - a11y/360 px.
  - Implementados en `TopicView.category.test.jsx` y `GameHost.category.test.jsx`
    (los fixtures de los tests existentes cubren globales/360 px).
- **AC cubiertos:** AC-4, AC-5, AC-6, AC-7.
- **Contexto:** spec §Decisión 5–6.
- **Done when:** no se puede abrir un juego de otra categoría por URL.
- **Estimate:** M.

### T4 — Docs, gates y cierre [depends: T1–T3]
- [x] **Deliverable:** `docs/architecture.md`/`MEMORY.md`/`FOCUS.md` con el alcance
  por categoría.
- [x] **Gates:** `npm test` 930/930, `npm run lint` 0, `npm run build` OK.
- [ ] **Cierre:** ACs, tasks y firma humana (pendiente de revisión manual).
- **AC cubiertos:** AC-8 y DoD.
- **Done when:** registry y vistas verdes, sin deps nuevas.
- **Estimate:** S.

---

## Fuera de alcance

- Juegos de código (spec-21).
- Juegos de Idiomas/Universidad.
- Cambiar mecánicas/layout de los 8 juegos.
- Persistir categoría.

## Definition of Done

- [x] Cada AC tiene test o verificación manual registrada (AC-7: tests estáticos
  de a11y/360 px; pasada humana pendiente).
- [x] `npm test` 930/930, `npm run lint` 0, `npm run build` en verde.
- [x] Sin dependencias nuevas ni red.
- [ ] Diff revisado por humano.
- [x] `MEMORY.md` actualizado y `FOCUS.md` limpio.
