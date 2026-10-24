# FOCUS

## Active objective (single)
spec-17 "biblioteca-categorias-modulos" — **T1–T9 implementados y documentados
2026-10-24**; gates verdes (`npm test` 731/731, `npm run lint` 0, `npm run build`
OK). Pendiente revisión humana del diff y archivo del plan de tareas.

**Pendientes de firma (anteriores):** spec-12, spec-13, spec-14 y spec-15 siguen
esperando aprobación humana del diff; spec-13 conserva T23 (sesión manual 360px +
teclado) y spec-15 conserva T14 (instalar la PWA en Chrome).

## Current phase
Fases SDD para spec-17:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 ✅ `specs/spec-17-biblioteca-categorias-modulos.md` (firmada 2026-10-23).
- F3 ✅ `specs/tasks-17-biblioteca-categorias-modulos.md` (T1–T9).
- F4 ✅ T1–T6: manifiesto, contenido movido a carpetas por categoría, catálogo
  recursivo, sources lazy, router `#/categoria/:id`, CategoryView, hub
  category-first y breadcrumb en TopicView.
- F5 ✅ T7–T8: resolución recursiva de topics en scripts con detección de IDs
  ambiguos; CSS `.library-*` / `.category` / `.module-*` / `.topic-card` con
  responsive 360 px, foco, 44 px y reduced-motion; tests de CategoryView y a11y
  del hub actualizados.
- F6 ✅ T9: docs sincronizados, `spec-16` renombrado, deuda preexistente de PNG y
  sketches de `estructuras-de-datos` saldada, gates al 100%.

## Blockers
- Revisión/aprobación humana del diff de spec-17 y de los incrementos anteriores.
- spec-15 T14 (verificación manual de instalación PWA) y spec-13 T23 (manual a11y).

## Done this session (2026-10-24)
- **T7 — scripts recursivos**: `findTopicFiles`/`resolveTopicPath` en
  `scripts/generate-card-images.mjs` buscan `src/content/topics/**/<id>.md`;
  error `AMBIGUOUS_TOPIC` con la lista de rutas si el ID aparece más de una vez;
  `generate-topic-art.mjs` usa la misma resolución.
- **T8 — CSS y a11y**: estilos nuevos para la biblioteca, categorías, módulos,
  tarjetas de tema y breadcrumb; `Card` ya reenvía `className`/props y
  `CategoryView` usa enlaces nativos con teclado; tests estáticos de rejilla,
  foco, targets y reduced-motion.
- **T9 — docs y gates**: arquitectura/roadmap/MEMORY/FOCUS actualizados;
  `specs/spec-16-flashcards-decks.md` renombrado (tenía un `\n` literal);
  PNG PWA regenerados y sketches genéricos para `estructuras-de-datos`.

## Decisions (spec-17)
- **Category-first**: `#/` → categorías; `#/categoria/:id` → módulos y temas;
  `#/tema/:id` y `#/tema/:id/juego/:gameId` se conservan.
- **Programación en dos módulos**: M1 Funciones; M2 Estructuras, Algoritmos y
  Persistencia (orden explícito y sin duplicados).
- **Carpetas físicas**: `topics/<categoria>/` y `sources/<categoria>/`; los
  assets no se mueven (`assets/<topic-id>/`).
- **Manifiesto puro**: `library.js` congela categorías, módulos, orden y
  `SOURCE_BY_TOPIC`; no toca storage ni globs.
- **Sin migraciones**: IDs de tema, rutas de juego, parser, SRS y XP intactos.

## Previous increments
- spec-15 "pwa-arcade-cover" — implementada; pendiente T14 + firma.
- spec-14 "topic-content-pipeline" — implementación completa; pendiente firma.
- spec-13 "impeccable-ui-retouch" — T1–T22 + T24; pendiente T23 y firma.
- spec-12 "retouch-learning-dashboard" — T1–T11; pendiente firma.
- spec-11 "serpiente-significados" — cerrada técnicamente; 8 juegos available.

## Next atomic step
Revisar el diff de spec-17, archivar/ajustar
`specs/tasks-17-biblioteca-categorias-modulos.md` si el humano lo aprueba y
continuar con `spec-18` (mazos de dominio y arcade).
