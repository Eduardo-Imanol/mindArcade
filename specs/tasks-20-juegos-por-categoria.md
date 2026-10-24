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
- [ ] **Deliverable:** `src/games/definition.js`:
  - `categories?: string[]`, default `['*']`;
  - valida array no vacío, strings no vacíos, deduplica;
  - `TypeError` claro;
  - mantiene `Object.freeze`.
- [ ] **Tests:** `definition.test.js`:
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
- [ ] **Deliverable:** `src/games/registry.js`:
  - `listGames({ categoryId } = {})` compatible con `listGames()`;
  - `gamesForCategory(categoryId)`;
  - `isGameForCategory(game, categoryId)`;
  - orden estable.
- [ ] **Tests:** `registry.test.js`:
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
- [ ] **Deliverable:** `src/views/TopicView.jsx`:
  - filtrar por `topic.categoryId`;
  - contador/estado vacío;
  - no romper disponibilidad ni enlaces.
- [ ] **Deliverable:** `src/views/GameHost.jsx`:
  - validar `isGameForCategory`;
  - mensaje/NotFound sin importar el módulo;
  - conservar ruta.
- [ ] **Tests:** `TopicView.test.jsx`, `GameHost.test.jsx`:
  - programación con globales + nuevos;
  - idiomas sin nuevos;
  - custom con globales;
  - mismatch;
  - a11y/360 px.
- **AC cubiertos:** AC-4, AC-5, AC-6, AC-7.
- **Contexto:** spec §Decisión 5–6.
- **Done when:** no se puede abrir un juego de otra categoría por URL.
- **Estimate:** M.

### T4 — Docs, gates y cierre [depends: T1–T3]
- [ ] **Deliverable:** `docs/architecture.md`/`MEMORY.md`/`FOCUS.md` con el alcance
  por categoría.
- [ ] **Gates:** `npm test`, `npm run lint`, `npm run build` al 100%.
- [ ] **Cierre:** ACs, tasks y firma humana.
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

- [ ] Cada AC tiene test o verificación manual registrada.
- [ ] `npm test`, `npm run lint`, `npm run build` en verde.
- [ ] Sin dependencias nuevas ni red.
- [ ] Diff revisado por humano.
- [ ] `MEMORY.md` actualizado y `FOCUS.md` limpio.
