# tasks-17 — biblioteca-categorias-modulos

> Derivado de `specs/spec-17-biblioteca-categorias-modulos.md` (**firmada 2026-10-23**).
> Implementado 2026-10-24 (T1–T9); pendiente revisión humana del diff.
> Sin dependencias nuevas. Sin backend. Sin cambios en parser, SRS, XP ni juegos.

## Objetivo del incremento

Que la primera pantalla sea una biblioteca por categorías y que cada categoría
muestre sus módulos/libretas y temas, con Programación dividida en Módulo 1
(Funciones) y Módulo 2 (Estructuras, Algoritmos, Persistencia).

## Grafo de dependencias

```
T1 manifiesto
└── T2 mover contenido + globs
    ├── T3 sources lazy
    ├── T4 router + CategoryView
    ├── T5 Hub de categorías
    ├── T6 TopicView breadcrumb
    └── T7 scripts recursivos
T4 + T5 + T6 ─► T8 CSS/a11y
T1..T8 ───────► T9 docs + gates + cierre
```

Cadenas críticas:

- `T1 → T2 → T4 → T8 → T9`
- `T1 → T2 → T5 → T8 → T9`
- `T2 → T6 → T8 → T9`

---

## Tareas

### T1 — Manifiesto de biblioteca [depends: none]
- [x] **Deliverable:** `src/core/content/library.js`:
  - `CATEGORIES` con `programacion`, `idiomas`, `universidad`, `personalizados`;
  - módulos `programacion-m1` y `programacion-m2` con los `topicIds` exactos;
  - `order` estable de categorías, módulos y temas;
  - mapa `SOURCE_BY_TOPIC` con las cuatro rutas de `programacion/`;
  - helpers puros `findCategory`, `findModule`, `sourceForTopic`, `topicsForCategory`;
  - estructura congelada y sin imports de storage/globs.
- [x] **Tests:** `src/core/content/library.test.js`:
  - IDs únicos y no vacíos;
  - cobertura exacta de los cuatro built-ins;
  - ningún tema en dos módulos;
  - orden de Programación M1/M2;
  - sourcePaths esperados y ausentes;
  - fallback de categoría desconocida.
- **AC cubiertos:** AC-1, AC-3, AC-5, AC-7, AC-10.
- **Contexto:** spec §Decisiones 1–5; catálogo actual y títulos H1 de los topics.
- **Done when:** manifiesto validado por tests y sin dependencias de runtime.
- **Estimate:** M.

### T2 — Mover topics/sources y glob recursivo [depends: T1]
- [x] **Deliverable:** mover con `git mv`:
  - `src/content/topics/*.md` → `src/content/topics/programacion/*.md`;
  - `src/content/sources/*.md` → `src/content/sources/programacion/*.md`.
- [x] **Deliverable:** `src/core/content/catalog.js`:
  - `import.meta.glob('../../content/topics/**/*.md', { query: '?raw', ... })`;
  - `loadBuiltinTopicMds()` conserva la compatibilidad (strings) o añade
    `loadBuiltinTopicEntries()` con `{ md, path }`;
  - `buildCatalog()` adjunta `categoryId`, `moduleId`, `moduleTitle`, `sourcePath`
    usando `library.js`, sin mutar el parser;
  - topics no listados caen en fallback seguro.
- [x] **Tests:** `catalog.test.js`:
  - los cuatro temas siguen cargando con los mismos IDs;
  - metadatos nuevos correctos;
  - custom va a `personalizados` y `sourcePath: null`;
  - fallback de topic ausente del manifiesto;
  - ningún test depende de `topics/*.md` plano.
- **AC cubiertos:** AC-6, AC-7, AC-10, AC-11.
- **Contexto:** spec §Decisiones 3–4 y 8; `catalog.js`; `src/content/topics` actual.
- **Done when:** `loadCatalog()` devuelve los mismos temas con metadatos nuevos.
- **Estimate:** M.

### T3 — Registro lazy de sources [depends: T2]
- [x] **Deliverable:** `src/core/content/sources.js`:
  - `import.meta.glob('../../content/sources/**/*.md', { query: '?raw', import: 'default' })`
    sin `eager`;
  - `hasSource(path)`, `loadSource(path)` → `Promise<string|null>`;
  - normalización de separadores `/` y rechazo de paths fuera de sources;
  - sin cargar documentos en el bundle inicial.
- [x] **Tests:** `sources.test.js`:
  - las cuatro rutas del manifiesto resuelven;
  - ruta inexistente → `null`;
  - path con `..` o absoluto no escapa del glob;
  - el registro no es eager (test estático/contrato).
- **AC cubiertos:** AC-8, AC-13.
- **Contexto:** spec §Decisión 5; `library.js`; `spec-19`.
- **Done when:** el lector puede resolver un source sin acoplar la vista al filesystem.
- **Estimate:** S.

### T4 — Router, ruta de categoría y `CategoryView` [depends: T2, T1]
- [x] **Deliverable:** `src/app/router.js`:
  - `#/categoria/:id` → `{ view: 'category', categoryId }`;
  - no romper `hub`, `progress`, `topic`, `game`, `notFound`.
- [x] **Deliverable:** `src/app/App.jsx`:
  - render de `CategoryView`;
  - `titleForRoute` para categoría;
  - imports sin ciclos.
- [x] **Deliverable:** `src/views/CategoryView.jsx`:
  - cabecera con nombre/descripción, enlace al hub;
  - módulos en orden y temas con métricas existentes;
  - estado «Próximamente» y `NotFound` para categoría desconocida;
  - targets ≥44 px y teclado.
- [x] **Tests:** router/App/`CategoryView.test.jsx`:
  - parseHash de categoría;
  - M1/M2 y orden de temas;
  - unknown;
  - vacío;
  - enlaces a tema.
- **AC cubiertos:** AC-1, AC-2, AC-3, AC-5, AC-12.
- **Contexto:** spec §Decisión 7; router actual y `TopicCard` del hub.
- **Done when:** la ruta de categoría funciona con deep link y recarga.
- **Estimate:** M.

### T5 — Hub category-first [depends: T1, T2]
- [x] **Deliverable:** `src/views/TopicsHub.jsx`:
  - rejilla de categorías con conteos, progreso agregado y «Próximamente»;
  - «Mis temas» para custom;
  - conservar «Crear tema», «Progreso», carátula y estado vacío;
  - el modal de creación sigue funcionando y refresca la categoría custom;
  - mover la búsqueda/orden/estado de temas a la vista de categoría o adaptarla sin
    perder funcionalidad; documentar la decisión en el PR.
- [x] **Tests:** `TopicsHub.test.jsx`:
  - cuatro categorías;
  - conteos y progreso;
  - Programación enlaza a `#/categoria/programacion`;
  - Idiomas/Universidad «Próximamente»;
  - custom aparece en «Mis temas» y tras crear;
  - acciones existentes.
- **AC cubiertos:** AC-1, AC-5, AC-12.
- **Contexto:** spec §Decisión 1; `TopicsHub` actual y `getGlobalMetrics`.
- **Done when:** el hub no muestra una lista plana de temas.
- **Estimate:** M.

### T6 — Breadcrumb y vuelta en `TopicView` [depends: T2, T1]
- [x] **Deliverable:** `src/views/TopicView.jsx`:
  - breadcrumb Categoría → Módulo → Tema;
  - «Volver» a `#/categoria/:categoryId`;
  - `sourcePath` disponible para el futuro lector, sin renderizarlo todavía;
  - conservar header, métricas, juegos y ruta de juego.
- [x] **Tests:** `TopicView.test.jsx`:
  - breadcrumb y href;
  - módulo correcto;
  - custom;
  - juego sigue enlazando igual.
- **AC cubiertos:** AC-4, AC-12.
- **Contexto:** spec §Decisión 7; `TopicView` actual.
- **Done when:** la navegación de tres niveles es clara y no rompe juegos.
- **Estimate:** S.

### T7 — Scripts recursivos [depends: T2]
- [x] **Deliverable:** `scripts/generate-card-images.mjs`:
  - resolver `src/content/topics/**/<topic-id>.md` en vez de la ruta plana;
  - error claro si el ID no aparece o aparece más de una vez.
- [x] **Deliverable:** `scripts/generate-topic-art.mjs`:
  - recorrer topics recursivamente;
  - conservar assets en `src/content/assets/<topic-id>/`.
- [x] **Tests:** scripts/tests existentes:
  - los cuatro IDs resuelven;
  - un fixture en subcarpeta funciona;
  - no se elige un archivo ambiguo.
- **AC cubiertos:** AC-9.
- **Contexto:** spec §Decisión 3; `generate-card-images.mjs:117`; skill de contenido.
- **Done when:** los scripts siguen generando arte con la nueva estructura.
- **Estimate:** S.

### T8 — CSS y accesibilidad [depends: T4, T5, T6]
- [x] **Deliverable:** `src/ui/tokens.css`:
  - clases `library-*`, `category-*`, `module-*`;
  - rejilla responsive, sin scroll horizontal a 360 px;
  - foco visible, targets ≥44 px, `prefers-reduced-motion`.
- [x] **Tests:** a11y estática de hub/categoría/tema; teclado; 360 px.
- **AC cubiertos:** AC-12.
- **Contexto:** tokens actuales y tests de a11y.
- **Done when:** hub/categoría/tema cumplen a11y sin romper el diseño neon.
- **Estimate:** M.

### T9 — Docs, gates y cierre [depends: T1–T8]
- [x] **Deliverable:** docs:
  - `docs/architecture.md` con la nueva estructura de contenido;
  - `MEMORY.md`/`FOCUS.md` con la decisión de categorías/módulos;
  - `specs/roadmap-games.md` si la estructura lo requiere.
- [x] **Deliverable:** renombrar `specs/spec-16-flashcards-decks.md` (el nombre
  actual contiene un salto de línea final) y cerrar su estado si el usuario lo
  confirma.
- [x] **Gates:** `npm test`, `npm run lint`, `npm run build` al 100%.
- [x] **Cierre:** marcar ACs, estado de tasks y firmar la spec.
- **AC cubiertos:** AC-13, AC-14 y DoD.
- **Done when:** no quedan rutas planas ni tests rojos por la reorganización.
- **Estimate:** M.

---

## Fuera de alcance

- Lector de fuente/TTS (spec-19).
- Juegos por categoría (spec-20).
- Mazos/arcade (spec-18).
- Contenido de Idiomas/Universidad.
- Mover assets o cambiar tokens `I: asset:`.
- Cambiar parser, SRS, XP, historial o mecánicas de juego.

## Definition of Done

- [x] Cada AC tiene test o verificación manual registrada.
- [x] `npm test`, `npm run lint`, `npm run build` en verde.
- [x] Sin dependencias nuevas ni red.
- [ ] Diff revisado por humano.
- [x] `MEMORY.md` actualizado y `FOCUS.md` limpio.
