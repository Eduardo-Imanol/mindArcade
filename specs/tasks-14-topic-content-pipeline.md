# tasks.md — topic-content-pipeline (spec-14, firmada)

> Derivado de `specs/spec-14-topic-content-pipeline.md` (firmada 2026-10-21).
> **Estado: spec firmada; T1–T8 completadas 2026-10-21.** 
> Gates: `npm test` 69 archivos/680 pruebas ✅ · `npm run lint` 0 warnings ✅ · `npm run build` OK ✅.
> `funciones-programacion` intacto (96 cartas, 96 SVG). Generalización demostrada
> con tema sintético de dos secciones (8/8 pruebas del test de arte, hub/tema/intruso
> y dashboard verifican sin cableado). Notas de precisión corregidas:
> generador por nombre de archivo, divergencia `archivo`↔`topic-id`, `|` en `Q`/`A` y
> carta sin `I:`. AC-29 queda para la primera ejecución real del tema.

## Dependency graph

```
T0 spec + tasks ────────────────────────────────► firma humana ✅ 2026-10-21
T1 test de arte generalizado ───────────────────► T8 gates
T2 SKILL.md (índice + pipeline) ────────────────► T8
T3 reference/extraction.md ─────────────────────► T8
T4 reference/topic-format.md ───────────────────► T8
T5 reference/p5-art.md ─────────────────────────► T8
T6 reference/games-dashboard.md ────────────────► T8
T7 reference/validation.md ─────────────────────► T8
T1..T7 ─────────────────────────────────────────► T8 cierre
```

Cadenas críticas:

- `T0 → firma → T1 → T8`
- `T0 → firma → T2..T7 → T8`
- `T1` es prerequisito para generar el **segundo** tema; con un solo tema el test
  actual pasa, pero deja de ser válido en cuanto entra el siguiente.

## Tasks

### T0 — Spec y plan de tareas [depends: none]
- [x] **Deliverable:** `specs/spec-14-topic-content-pipeline.md` y
  `specs/tasks-14-topic-content-pipeline.md`.
- [x] **Contenido:** decisiones, 5 HU con AC binarios, restricciones, casos límite,
  contrato de pruebas y grafo de dependencias.
- **AC cubiertos:** habilitante de todos.
- **Estado:** ✅ creado y firmado 2026-10-21. Sin implementación; T1–T8 habilitadas.

### T1 — Generalizar el test de arte a N temas [depends: T0 firmada]
- [x] **Deliverable:** `scripts/generate-topic-art.test.mjs`:
  - descubre todos los `src/content/topics/*.md` y parsea cada uno;
  - cobertura: cada carta con `asset:` tiene sketch (por tema);
  - huérfanos: ningún sketch fuera de la unión de ids de todos los temas;
  - paridad: cada `asset:` tiene archivo en `src/content/assets/` y no sobran SVG
    en la carpeta del tema;
  - calidad y determinismo por id: 512×512, `role="img"`, `<title>`, `aria-label`,
    <200 KB, byte-igual entre ejecuciones;
  - `generateArt` por tema en raíz temporal: escribe N, omite existentes, reporta
    faltantes y es determinista.
- [x] **Tests:** el propio archivo, ejecutado con uno y con dos temas sintéticos en
  fixtures; sin números hardcodeados (`96`, `funciones-programacion`).
- [x] **AC cubiertos:** AC-14, AC-15, AC-16, AC-18, AC-25, AC-26.
- [x] **Contexto:** `scripts/generate-topic-art.mjs`,
  `scripts/generate-card-images.mjs`, `src/core/parser/parser.js`.
- [x] **Done when:** el test pasa con el catálogo actual y falla con mensajes claros
  ante un asset faltante o un sketch huérfano.
- **Estimate:** M.
- **Estado:** ✅ implementado 2026-10-21. Descubre `src/content/topics/*.md`, valida
  cobertura de sketches, huérfanos (sketch y SVG), paridad assets↔cartas, calidad
  accesible (512×512, `role="img"`, `<title>`, `aria-label`, <200 KB), determinismo
  y el ciclo de `generateArt` (escribe/omite/reporta). Fixtures sintéticos de 1 y 2
  temas que demuestran el fallo con tema y carta. Sin números ni nombres fijos.

### T2 — Reescribir `SKILL.md` como índice del pipeline [depends: T0 firmada]
- [x] **Deliverable:** `.opencode/skills/topic-questions-generator/SKILL.md`:
  - frontmatter con disparadores nuevos («genera el tema de X con @source»,
    «genera los juegos de este tema», «crea todo para jugar»);
  - qué produce y qué no toca;
  - pipeline de 7 pasos con enlaces a `reference/`;
  - reglas no negociables resumidas;
  - gates y DoD;
  - reporte final esperado.
- [x] **Tests:** revisión de que todos los enlaces a `reference/` existen y que el
  archivo queda como índice (sin duplicar el detalle de las referencias).
- [x] **AC cubiertos:** AC-1, AC-3, AC-4, AC-28.
- [x] **Contexto:** skill actual; spec-14; `AGENTS.md`.
- [x] **Done when:** un agente puede seguir el pipeline desde `SKILL.md` sin abrir el
  código fuente para entender el orden.
- **Estimate:** S.
- **Estado:** ✅ revisado 2026-10-21. Frontmatter con los tres disparadores nuevos,
  tabla de qué produce / qué no toca, pipeline de 7 pasos con enlace a `reference/`,
  8 reglas no negociables, gates, reporte final y DoD. Los 5 enlaces a `reference/`
  existen. Actualizado para reflejar que el test de arte ya está generalizado a N
  temas (T1) en vez de dejar obsoleta la instrucción de ejecutarla primero.

### T3 — `reference/extraction.md` [depends: T0 firmada]
- [x] **Deliverable:** protocolo de extracción máxima:
  - inventario del source (líneas, H2/H3, densidad);
  - tabla de tramos y cuotas;
  - plantilla de mapa de cobertura por sección;
  - reglas de redacción Q/A/E y prohibición de `|`;
  - guía por tipo de documento (técnico, idiomas, historia, etc.);
  - ejemplo con la guía de estructuras de datos: distribución por capítulo hasta
    ~150 cartas;
  - dedupe, auditoría final y criterios de omisión justificada.
- [x] **Tests:** revisión manual contra `funciones-programacion.md` (96/96 secciones
  cubiertas) y contra el outline de `dart-estructuras-datos.md` (17 H2).
- [x] **AC cubiertos:** AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11.
- [x] **Contexto:** `src/content/sources/dart-estructuras-datos.md`,
  `src/content/topics/funciones-programacion.md`.
- [x] **Done when:** la guía permite producir un mapa de cobertura verificable antes de
  escribir una sola carta.
- **Estimate:** M.
- **Estado:** ✅ revisado 2026-10-21. Inventario, tabla de tramos con calibración real
  del repo, plantilla de mapa de cobertura, criterios de omisión justificada, reglas
  de redacción `Q/A/E/I` + descripción, guía por tipo de documento, ejemplo aplicado a
  estructuras de datos (cuota 156 cartas, 18 H2 + 76 H3) y auditoría final. Correcciones
  de la revisión: recuento real de H2/H3 del source (18/76, no 17), reglas de la
  descripción (≤160 chars, sin prefijos `>` ni `|`), criterios de omisión explícitos y
  desambiguación de la sección 0 del ejemplo.

### T4 — `reference/topic-format.md` [depends: T0 firmada]
- [x] **Deliverable:** formato congelado y semántica exacta:
  - H1, descripción y gramática de carta;
  - comportamiento del parser (orden de tokens, corte de `I`, `E`, fences,
    encabezados, reglas horizontales, descripción);
  - reglas de `topic-id`/`card-id` (slug a 60, dedupe);
  - ruta canónica `asset:<topic-id>/<card-id>.svg`;
  - comandos de volcado de ids y de generación;
  - tabla de errores silenciosos.
- [x] **Tests:** revisión contra `src/core/parser/parser.js` y
  `src/core/content/slug.js`.
- **AC cubiertos:** AC-2, AC-12, AC-13.
- **Contexto:** parser, slug, topic de referencia.
- **Done when:** no queda ninguna regla del parser sin documentar.
- **Estimate:** S.
- [x] **Estado:** ✅ revisado 2026-10-21. Semántica del parser documentada línea a
  línea (fences, primer encabezado ≤80, corte del primer `| I:`, regex
  `Q | A | E`, dedupe con `uniqueId`), tabla de 12 fallos silenciosos verificados
  ejecutando el parser, `slugify` (NFD, corte a 60, guion final) y `card-id` con
  sufijo `-2`/`-3`, ruta canónica del asset y diferencia entre nombre de
  archivo, `topic-id` y carpeta de assets; tres comandos ejecutados y
  verificados. Documentada la excepción heredada de `funciones-programacion` (su
  carpeta de assets no coincide con su `topic-id`) y la convención nueva:
  archivo = `topic-id` = carpeta de assets.

### T5 — `reference/p5-art.md` [depends: T0 firmada]
- [x] **Deliverable:** guía de arte:
  - motor `renderSketch`, lienzo 512×512 y determinismo;
  - paleta y primitivas disponibles con su uso;
  - reglas de composición (≤4 etiquetas, texto legible, una idea por imagen);
  - playbook visual para estructuras de datos (arreglo, lista, pila, cola, heap,
    hash, árbol, trie, grafo, union-find, segment tree, LRU, persistente,
    concurrente);
  - flujo: módulo de sketches por tema, registro por `card-id`, generación y
    verificación;
  - anti-patrones.
- [x] **Tests:** revisión contra `scripts/p5-art/engine.mjs`,
  `palette.mjs`, `primitives.mjs` y los sketches existentes.
- **AC cubiertos:** AC-14, AC-15, AC-16, AC-17.
- **Contexto:** `scripts/p5-art/`, `scripts/generate-topic-art.mjs`.
- **Done when:** un agente puede dibujar una carta nueva sin leer el motor.
- **Estimate:** M.
- [x] **Estado:** ✅ revisado 2026-10-21. Contrato del SVG tomado del test real
  (512×512, `role="img"`, `<title>`, `aria-label` = pregunta, <200 KB,
  determinismo byte a byte), API completa del `Sketch` (estado, color, formas,
  texto, `push/pop`, `translate` acumulado, `random` sembrado), paleta y `hsl`,
  las 11 primitivas con sus opciones, reglas de composición, organización de
  módulos y registro en `index.mjs` con la clave exacta, playbook de estructuras
  de datos, comando de generación corregido (el argumento es el stem del
  archivo o una ruta relativa al cwd) y anti-patrones.

### T6 — `reference/games-dashboard.md` [depends: T0 firmada]
- [x] **Deliverable:** contrato de juegos y métricas:
  - por qué no hay cableado manual (glob de topics);
  - tabla de `minCards` por juego;
  - diferencia entre total y cartas elegibles (`selectStudyCards`);
  - regla de `intruso` (2 temas × 3 cartas);
  - derivación de métricas desde SRS + historial;
  - `addedAt`, portada y `topicCoverCard`;
  - checklist de verificación en `#/`, `#/tema/<id>`, `#/juego/<id>`, `#/progreso`;
  - qué no tocar.
- [x] **Tests:** revisión contra `src/games/availability.js`, `registry.js`,
  `src/core/metrics/metrics.js` y `src/views/Dashboard.jsx`.
- **AC cubiertos:** AC-19, AC-20, AC-21, AC-22, AC-23, AC-24.
- **Contexto:** juegos, métricas, hub/dashboard.
- **Done when:** la skill puede predecir qué juegos quedarán habilitados antes de
  abrir la app.
- **Estimate:** S.
- [x] **Estado:** ✅ revisado 2026-10-21. Orden real de `getGameAvailability`
  documentado (`soon` → `all-caught-up` → `min-cards` → `min-topics` → `ok`) con
  el texto exacto de cada mensaje; tabla de `minCards` de los 8 juegos leída de
  `registry.js` (`intruso` con `minTopics: 2` y `minCardsPerTopic: 3`);
  elegibles vs. totales con `selectStudyCards` y el SRS indexado por `topicId`;
  predicción por número de cartas y el caso de `intruso`; derivación de
  métricas (`getTopicMetrics`/`getGlobalMetrics`, estados `new`/`learning`/
  `learned`, `GRADE_XP`, actividad de 14 días); `addedAt` con `ensureTopicMeta`
  en el hub; portada con `topicCoverCard`; checklist por ruta y tabla de
  síntomas.

### T7 — `reference/validation.md` [depends: T0 firmada]
- [x] **Deliverable:** gates y cierre:
  - comandos exactos (parseo, generación, test, lint, build);
  - qué valida el test generalizado y qué no;
  - smoke manual por ruta;
  - plantilla de reporte al usuario;
  - troubleshooting (sketch faltante, huérfano, asset roto, carta descartada,
    id desalineado);
  - checklist de Definition of Done.
- [x] **Tests:** revisión de que cada comando del documento se ejecutó al menos una
  vez en el repo y produce lo descrito.
- **AC cubiertos:** AC-27, AC-28, AC-29.
- **Contexto:** `package.json`, scripts de arte, docs de testing.
- **Done when:** el cierre del pipeline no requiere improvisar comandos.
- **Estimate:** S.
- **Estado:** ✅ revisado 2026-10-21. Los seis comandos del documento se
  ejecutaron en el repo y se documentó su salida real: parseo (96 cartas, 0
  errores, 96 con `asset`), volcado de ids, paridad rápida, divergencia
  archivo↔`topic-id`, generación con `--force` (código 0) y los tres gates
  (`npm test` 69 archivos/680 pruebas con el test de arte dentro, `npm run lint`
  0 warnings, `npm run build` OK). Se verificó el modo de fallo del generador
  (código 1 con `Sin sketch (N)`) y el formato de los mensajes del test
  (`[código] <archivo>/<carta>: <mensaje>`) con un tema sintético temporal,
  retirado después. Añadida la sección «qué NO valida el test» (calidad
  pedagógica, cobertura del source, legibilidad del arte, `topic-id`, `|` en
  `Q`/`A`) y un smoke manual por ruta (`#/`, `#/tema/<id>`,
  `#/tema/<id>/juego/<game-id>`, `#/progreso`). Corrección de precisión
  detectada: el generador resuelve por **nombre de archivo**, no por
  `topic-id` (`funciones-programacion.md` → `funciones-en-programacion`),
  así que el placeholder `<topic-id>` se cambió por `<archivo-sin-ext>` en
  `SKILL.md` y `reference/p5-art.md` para no inducir el error
  `No existe el tema`.

### T8 — Verificación y cierre del incremento [depends: T1–T7]
- [x] **Deliverable:** gates verdes y documentación sincronizada:
  - `npm test`, `npm run lint`, `npm run build`;
  - verificación de que `funciones-programacion` sigue intacto (96 cartas, 96 SVG);
  - prueba con un tema sintético de dos secciones para demostrar la generalización;
  - `MEMORY.md`, `FOCUS.md` y estado de la spec actualizados.
- [x] **Tests:** suite completa; el test de arte con uno y dos temas (fixtures
  sintéticos) y verificación en app con tema sintético temporal (hub, tema,
  intruso habilitado, dashboard, bloqueos por `minCards`).
- **AC cubiertos:** AC-18, AC-25, AC-26, AC-27, AC-29.
- **Contexto:** todo el incremento.
- **Done when:** los tres gates pasan y la spec queda lista para firma del diff.
- **Estimate:** S.
- **Estado:** ✅ cerrado 2026-10-21. Gates verdes (`npm test` 69 archivos/680
  pruebas; `npm run lint` 0 warnings; `npm run build` OK). Tema
  `funciones-programacion` sin diff (96/96). Generalización demostrada: tema
  sintético de dos secciones creado con `archivo=topic-id=carpeta` y ids
  obtenidos con el parser, sketches registrados con claves exactas, `generate-topic-art.mjs`
  escribió 4/4 SVG con código 0; test de arte pasó con 2 temas en catálogo.
  Fallos deliberados verificaron mensajes con tema/carta (`missing-asset`,
  `orphan-asset`, `orphan-sketch`). Sin cableado: hub mostró ambos temas, tema
  nuevo mostró 8 fichas con `intruso` habilitado (2 temas compatibles) y
  `lluvia-meteoros` bloqueado por `minCards` (4 < 6), dashboard listó ambos.
  Las 6 aserciones de tests que asumían 1 tema built-in se hicieron agnósticas
  al catálogo (GameHost/TopicsHub/catalog). Todo limpiado tras la verificación;
  `MEMORY.md` y `FOCUS.md` actualizados. AC-29 pendiente de la primera ejecución
  real del tema `dart-estructuras-datos`.

## Después de T1–T8 (fuera de esta spec)

La primera ejecución real de la skill será el tema
`src/content/sources/dart-estructuras-datos.md` → `estructuras-de-datos` (120–200
cartas y sus SVG). Esa ejecución es contenido, no tooling, y se planifica como
tarea aparte una vez firmada esta spec.
