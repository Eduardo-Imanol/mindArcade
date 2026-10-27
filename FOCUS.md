# FOCUS

## Active objective (single)
spec-19 "lector-fuente-tts" — **T1–T8 implementados** (2026-10-26): registro
lazy de sources, parser Markdown seguro, TTS por secuencia con pausa/reanudación,
`SourceReader` en `#/tema/:id/fuente`, enlace condicional desde `TopicView`, CSS
y checklist a11y, docs y gates. Pendiente revisión humana del diff y firma.

**Pendientes de firma (anteriores):** spec-12, spec-13, spec-14, spec-15 y
spec-17 siguen esperando aprobación humana del diff; spec-13 conserva T23
(sesión manual 360px + teclado) y spec-15 conserva T14 (instalar la PWA en Chrome).

## Current phase
Fases SDD para spec-19:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 ✅ `specs/spec-19-lector-fuente-tts.md` (firmada 2026-10-23).
- F3 ✅ `specs/tasks-19-lector-fuente-tts.md` (T1–T8).
- F4 ✅ T1–T3: sources lazy verificado, `markdown.js` + `MarkdownBlocks` y
  `speakSequence` con pausa/reanudación/cancelación.
- F5 ✅ T4–T5: `SourceReader` con estados y controles; router `#/…/fuente`,
  título de documento y enlace condicional en `TopicView`.
- F6 ✅ T6–T8 implementados: CSS responsive/a11y, `SourceReader.a11y.test.jsx`,
  checklist manual, arquitectura/MEMORY/FOCUS y gates (manual + firma pendientes).
  T8: selección leída en TTS + «Leer selección» para repetir.
  Pasada impeccable: `views/source/` (header/estado/modelo), `markdownInline.js`
  y `audio/chunks.js`; archivos <200 líneas.

## Blockers
- Revisión/aprobación humana del diff de spec-19 y de los incrementos anteriores.
- Verificación manual en navegador real (360 px + teclado + VoiceOver).
- spec-15 T14 (verificación manual de instalación PWA) y spec-13 T23 (manual a11y).

## Done this session (2026-10-26)
- **T6 — CSS y a11y**: `.source-reader*` y `.md-*` con lectura cómoda,
  `overflow-wrap`, code con `max-width:100%`/`overflow-x:auto`, targets ≥44 px,
  foco visible y reduced-motion; nuevo test estático `SourceReader.a11y.test.jsx`
  (semántica, estados aria-live, labels y contratos CSS) y sección del lector en
  `docs/manual-a11y-checklist.md`.
- **T7 — docs y gates**: arquitectura documenta `sources.js`, `markdown.js`,
  `MarkdownBlocks`, `tts.js` y `SourceReader`; MEMORY/FOCUS sincronizados;
  `npm test`, `npm run lint` y `npm run build` ejecutados.

## Decisions (spec-19)
- **Ruta**: `#/tema/:topicId/fuente`, título `Sepect — Fuente: <tema>`; el enlace
  solo aparece con `sourcePath` resoluble.
- **Lazy**: `sources.js` resuelve el Markdown al entrar en la vista; los cuatro
  documentos no forman parte del bundle inicial.
- **Render seguro**: `markdown.js` produce `Block[]` y `MarkdownBlocks` pinta
  React elements; HTML crudo se muestra como texto, sin `dangerouslySetInnerHTML`.
- **TTS**: `speakSequence` divide en ~200 caracteres, omite code blocks, respeta
  el mute global y expone pause/resume/stop/cancel; `stopSpeech` al desmontar.
- **Custom**: sin enlace y estado vacío claro en la ruta directa.
- **Sin dependencias nuevas, red ni cambios en SRS/XP/juegos.**

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
- **Acordeón**: los módulos arrancan cerrados; «Abrir/Cerrar módulos» actúa sobre
  todos y cada cabecera se pliega de forma independiente.
- **Filtros planos**: en categorías con módulos, cualquier búsqueda, estado
  distinto de «Todos» u orden distinto de «Por módulos» oculta los módulos y
  muestra una rejilla plana. Mis temas usa «Recientes» por defecto.
- **Imágenes de categoría**: PNG deterministas 720×405 en `public/categories/`;
  `library.js` guarda la ruta y el hub las pinta decorativas (`alt=""`).

## Previous increments
- spec-17 "biblioteca-categorias-modulos" — T1–T9 + ajuste UX; pendiente firma.
  Gates verdes (`npm test` 740/740, `npm run lint` 0, `npm run build` OK).
  Category-first, módulos plegables, filtros planos e imágenes por categoría.
- spec-15 "pwa-arcade-cover" — implementada; pendiente T14 + firma.
- spec-14 "topic-content-pipeline" — implementación completa; pendiente firma.
- spec-13 "impeccable-ui-retouch" — T1–T22 + T24; pendiente T23 y firma.
- spec-12 "retouch-learning-dashboard" — T1–T11; pendiente firma.
- spec-11 "serpiente-significados" — cerrada técnicamente; 8 juegos available.

## Next atomic step
Revisar el diff de spec-19, hacer la pasada manual 360 px + teclado + VoiceOver
del lector y decidir commit/push. Después continuar con `spec-18` (mazos de
dominio y arcade).
