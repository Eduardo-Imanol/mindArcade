# tasks-19 — lector-fuente-tts

> Derivado de `specs/spec-19-lector-fuente-tts.md` (**firmada 2026-10-23**).
> Lista para implementar.
> Depende de `spec-17` (source mapping y registro lazy). Sin dependencias nuevas.

## Objetivo del incremento

Leer el documento fuente original de un tema y escucharlo con TTS, con ruta propia,
render Markdown seguro y controles de lectura.

## Grafo de dependencias

```
T1 sources lazy
└── T2 markdown parser/renderer
    └── T4 SourceReader
T3 TTS secuencia/pausa
    └── T4
T4 → T5 ruta/enlace TopicView
T5 → T6 CSS/a11y
T1..T6 → T7 docs + gates + cierre
```

Cadenas críticas:

- `T1 → T2 → T4 → T5 → T6 → T7`
- `T3 → T4`

---

## Tareas

### T1 — Verificar/extender el registro lazy de sources [depends: spec-17 T3]
- [x] **Deliverable:** verificar `src/core/content/sources.js` (creado en spec-17
  T3) y extenderlo solo si falta algo, sin duplicarlo:
  - `hasSource(path)`, `loadSource(path)` → `Promise<string|null>`;
  - glob `**/*.md` sin `eager`;
  - normalización de `/`, rechazo de `..`/absolutos;
  - sin cargar documentos al importar;
  - una sola fuente de verdad para el registro.
- [x] **Tests:** `sources.test.js`:
  - cuatro paths del manifiesto;
  - inexistente → `null`;
  - path traversal;
  - contrato lazy.
- **AC cubiertos:** AC-1, AC-11.
- **Contexto:** spec-17; `library.js`; `src/content/sources/programacion`.
- **Done when:** el reader resuelve el source sin glob directo.
- **Estimate:** S.

### T2 — Parser/renderer Markdown seguro [depends: T1]
- [x] **Deliverable:** `src/core/content/markdown.js`:
  - `parseSourceMarkdown(md)` → `Block[]`;
  - bloques: heading, paragraph, list, code, blockquote, hr;
  - inline: bold, italic, inline code; enlaces seguros;
  - HTML crudo escapado;
  - `blocksToSpeech(blocks)` sin code blocks;
  - exporta helpers de bloques reutilizables por spec-21;
  - tolerancia a entradas inválidas.
- [x] **Deliverable:** `src/components/MarkdownBlocks.jsx` (o render en la vista):
  - React elements, sin `dangerouslySetInnerHTML`.
- [x] **Tests:** `markdown.test.js`:
  - headings/parrafos/listas/citas/hr/code;
  - inline;
  - `<script>` como texto;
  - source vacío/CRLF;
  - bloques de código omitidos del TTS.
- **AC cubiertos:** AC-2, AC-10.
- **Contexto:** spec §Decisión 3; sources reales.
- **Done when:** el documento se renderiza completo y seguro.
- **Estimate:** M.

### T3 — TTS con secuencia, pausa y reanudación [depends: none]
- [x] **Deliverable:** `src/core/audio/tts.js`:
  - conservar `speak`/`stopSpeech`/`isSupported`;
  - `pauseSpeech()`, `resumeSpeech()`, `isSpeechPaused()`;
  - `speakSequence(parts, { onEnd, onError })` con control
    `{ pause, resume, stop, cancel }`;
  - chunking ~200 caracteres por frase;
  - mute global y cancelación.
- [x] **Tests:** `tts.test.js`:
  - secuencia ordenada;
  - pause/resume;
  - stop/cancel;
  - mute;
  - unsupported;
  - no utterances huérfanas.
- **AC cubiertos:** AC-5, AC-6, AC-7, AC-8, AC-9.
- **Contexto:** `tts.js` actual; `settings.js`; tests de TTS existentes.
- **Done when:** el reader puede controlar una lectura larga.
- **Estimate:** M.

### T4 — `SourceReader` [depends: T1, T2, T3]
- [x] **Deliverable:** `src/views/SourceReader.jsx`:
  - carga lazy, estados loading/error/empty;
  - render con `MarkdownBlocks`;
  - controles Leer/Pausar/Reanudar/Detener;
  - `aria-live` de estado;
  - `stopSpeech` al desmontar/navegar;
  - breadcrumb/vuelta al tema.
- [x] **Tests:** `SourceReader.test.jsx`:
  - source existente;
  - source ausente/custom;
  - loading/error;
  - controles y estados;
  - TTS/mute;
  - unmount.
- **AC cubiertos:** AC-2, AC-3, AC-5, AC-6, AC-7, AC-8, AC-9.
- **Contexto:** spec HU-1/HU-2.
- **Done when:** la vista funciona con los cuatro sources reales.
- **Estimate:** M.

### T5 — Ruta y enlace desde TopicView [depends: T4]
- [x] **Deliverable:** `src/app/router.js`:
  - `#/tema/:id/fuente` → `{ view: 'source', topicId }`.
- [x] **Deliverable:** `src/app/App.jsx`:
  - render de `SourceReader`;
  - `titleForRoute` con el tema.
- [x] **Deliverable:** `src/views/TopicView.jsx`:
  - enlace «Leer documento original» solo si `sourcePath`;
  - no romper juegos/métricas.
- [x] **Tests:** router/App/TopicView:
  - parseHash;
  - deep link;
  - title;
  - enlace condicional;
  - custom sin enlace.
- **AC cubiertos:** AC-1, AC-4.
- **Contexto:** spec §Decisión 1.
- **Done when:** se llega al lector desde el tema y con URL directa.
- **Estimate:** S.

### T6 — CSS y accesibilidad [depends: T4, T5]
- [x] **Deliverable:** `src/ui/tokens.css`:
  - `.source-reader`, `.source-reader__doc`, headings, code, blockquote, listas;
  - lectura cómoda, `overflow-wrap`, sin scroll horizontal a 360 px;
  - foco visible, targets ≥44 px, reduced-motion.
- [x] **Verificación estática:** `SourceReader.a11y.test.jsx` + sección del lector
  en `docs/manual-a11y-checklist.md`.
- [ ] **Verificación manual:** navegador real a 360 px, teclado y VoiceOver.
- **AC cubiertos:** AC-11.
- **Done when:** el documento largo es legible y navegable en móvil.
- **Estimate:** S.

### T7 — Docs, gates y cierre [depends: T1–T6]
- [x] **Deliverable:** `docs/architecture.md`, `MEMORY.md`, `FOCUS.md` y
  `docs/manual-a11y-checklist.md` con el lector/TTS.
- [x] **Gates:** `npm test` 780/780, `npm run lint` 0, `npm run build` OK
  (warning preexistente de chunk >500 kB).
- [ ] **Cierre:** ACs, tasks y firma humana.
- **AC cubiertos:** AC-12, AC-13 y DoD.
- **Done when:** el lector no rompe rutas existentes ni el bundle lazy.
- **Estimate:** S.

---

## Fuera de alcance

- Edición, búsqueda o resaltado sincronizado del documento.
- Voces configurables o traducción.
- Cambiar sources/formato.
- Dependencias de Markdown.

## Definition of Done

- [x] Cada AC tiene test o verificación manual registrada.
- [x] `npm test` 780/780, `npm run lint` 0 y `npm run build` en verde.
- [x] Sin dependencias nuevas ni red.
- [ ] Diff revisado por humano.
- [x] `MEMORY.md` actualizado y `FOCUS.md` limpio.
