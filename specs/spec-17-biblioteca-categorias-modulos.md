---
feature: biblioteca-categorias-modulos
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-24
related_tasks: specs/tasks-17-biblioteca-categorias-modulos.md
---

# Spec — Biblioteca por categorías y módulos (spec-17)

> [!abstract] Resumen
> Convierte la primera pantalla en una biblioteca **category-first**: el hub muestra
> categorías (Programación, Idiomas, Universidad y Mis temas) y cada categoría
> contiene módulos/libretas con sus temas. En Programación, Funciones es el Módulo 1
> y Estructuras, Algoritmos y Persistencia forman el Módulo 2. Reorganiza topics y
> sources en carpetas por categoría, sin cambiar el parser, los IDs de tema, las
> rutas de juego ni la mecánica de los juegos. Sin backend y sin dependencias nuevas.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Media (catálogo + manifiesto + rutas + vistas + tooling) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. **Categorías visibles**: `programacion`, `idiomas`, `universidad` y
   `personalizados` («Mis temas»). Solo Programación tiene contenido built-in hoy;
   las demás se muestran con estado «Próximamente» en lugar de ocultarse.
2. **Módulos de Programación**:
   - `programacion-m1` — Módulo 1: `funciones-en-programacion` (H1 real; el archivo
     legacy se llama `funciones-programacion.md`).
   - `programacion-m2` — Módulo 2: `estructuras-de-datos`,
     `algoritmos-y-complejidad-guia-tecnica-exhaustiva` y
     `persistencia-local-pwas-y-offline-first`.
   El orden de los módulos y de los temas dentro del módulo es explícito y estable.
3. **Carpetas físicas**:
   - `src/content/topics/programacion/*.md`
   - `src/content/sources/programacion/*.md`
   Los assets permanecen en `src/content/assets/<topic-id>/` porque los tokens
   `I: asset:<topic-id>/<slug>.svg`, `CardImage` y los scripts resuelven esa ruta.
4. **Manifiesto**: nuevo `src/core/content/library.js` (datos puros y congelados)
   con categorías, módulos, orden y mapa `topicId -> sourcePath`. El catálogo adjunta
   `categoryId`, `moduleId`, `moduleTitle` y `sourcePath`; no se escriben metadatos
   nuevos en localStorage.
5. **Source mapping** (nombres de archivo no coinciden con el topic):
   - `funciones-en-programacion` → `programacion/dart-funciones.md`
   - `estructuras-de-datos` → `programacion/dart-estructuras-datos.md`
   - `algoritmos-y-complejidad-guia-tecnica-exhaustiva` →
     `programacion/algoritmos-y-complejidad-guia-tecnica-exhaustiva.md`
   - `persistencia-local-pwas-y-offline-first` →
     `programacion/persistencia-local-pwas-offline-first.md`
6. **Temas custom**: se agrupan en `personalizados` («Mis temas»), sin módulo
   built-in y sin `sourcePath`. Siguen creándose desde el hub.
7. **Rutas**:
   - `#/` → categorías.
   - `#/categoria/:categoryId` → módulos y temas.
   - `#/tema/:topicId` → se conserva.
   - `#/tema/:topicId/juego/:gameId` → se conserva.
   - `#/progreso` → se conserva.
   No se añade una ruta nueva para módulos; el módulo es una sección de la vista de
   categoría.
8. **Backcompat**: `parseTopic`, `slugify`, los IDs de tema, `loadCatalog()` (campos
   existentes) y las rutas de juego no cambian. Los topics built-in siguen
   registrándose solo por existir en el glob.
9. **Sin dependencias nuevas**, sin llamadas de red y sin tocar SRS, XP, historial
   ni mecánicas de juego.

---

## 📖 Historias de usuario

### HU-1 — Navegar por categorías y módulos
**Como** aprendiz, **quiero** entrar primero por categoría y luego por libreta/módulo,
**para** encontrar mis temas sin una lista plana y entender el orden del curso.

**Criterios de aceptación:**
- [x] AC-1: `#/` muestra una rejilla de **categorías**, no la lista plana de temas.
  Cada tarjeta muestra nombre, descripción corta (si existe), número de módulos,
  número de temas y cartas, progreso agregado y estado «Próximamente» si no tiene
  temas. Conserva las acciones «Crear tema» y «Progreso», el estado vacío global y
  la carátula actual.
- [x] AC-2: `#/categoria/:categoryId` muestra los módulos de esa categoría en orden
  explícito. Cada módulo muestra título, descripción opcional y sus temas; cada tema
  enlaza a `#/tema/:topicId` y muestra cartas, progreso y días de estudio con los
  helpers existentes. Categoría desconocida → `NotFound`.
- [x] AC-3: Programación muestra exactamente dos módulos: Módulo 1 con Funciones y
  Módulo 2 con Estructuras, Algoritmos y Persistencia, en ese orden. No se duplica un
  tema en dos módulos.
- [x] AC-4: `TopicView` muestra un breadcrumb «Categoría / Módulo / Tema» y el enlace
  de vuelta lleva a `#/categoria/:categoryId`; el enlace «Progreso» y la ruta de juego
  no cambian. El título del documento para categoría/tema/juego se actualiza sin
  romper `titleForRoute`.
- [x] AC-5: Idiomas y Universidad se muestran como categorías sin contenido, con un
  estado «Próximamente» y sin enlaces rotos. «Mis temas» muestra los temas custom;
  si no hay, muestra un estado vacío con CTA para crear uno.

### HU-2 — Organización física y metadatos de contenido
**Como** mantenedor, **quiero** que topics y sources vivan en carpetas de su
categoría y que el catálogo conozca módulo y fuente, **para** escalar a Idiomas y
Universidad sin cableados manuales por tema.

**Criterios de aceptación:**
- [x] AC-6: Los cuatro topics built-in se mueven a
  `src/content/topics/programacion/` y los cuatro sources a
  `src/content/sources/programacion/`, conservando nombres. Sus IDs siguen siendo
  `slugify(H1)` y no cambian: Funciones conserva
  `funciones-en-programacion` aunque su archivo se llame
  `funciones-programacion.md`. `src/core/content/catalog.js` usa un glob recursivo
  (`**/*.md`) y sigue cargando todos los built-in.
- [x] AC-7: `library.js` es la única fuente de verdad de categorías, módulos, orden y
  source mapping. `loadCatalog()` adjunta `categoryId`, `moduleId`, `moduleTitle` y
  `sourcePath` (puede ser `null`) a cada topic sin mutar el parser ni el Markdown. Los
  campos actuales (`id`, `title`, `description`, `cards`, `source`, `images`,
  `addedAt`) se conservan.
- [x] AC-8: `src/core/content/sources.js` expone un registro **lazy** de sources por
  `sourcePath` para que `spec-19` lo consuma; no carga los cuatro documentos en el
  bundle inicial. Un `sourcePath` inexistente devuelve `null` sin lanzar.
- [x] AC-9: `scripts/generate-card-images.mjs` y `scripts/generate-topic-art.mjs`
  localizan topics por ID en la estructura recursiva (no asumen
  `src/content/topics/<id>.md` plano). Los scripts siguen escribiendo assets en
  `src/content/assets/<topic-id>/` y sus tests/gates pasan.
- [x] AC-10: El manifiesto está validado: IDs de categoría/módulo únicos, cada
  built-in aparece una sola vez, cada `topicId` del manifiesto existe y cada
  `sourcePath` apunta a un archivo existente. Un topic built-in no listado cae en una
  categoría segura (`personalizados` o `sin-categoria`) sin romper el hub.

### HU-3 — Compatibilidad, accesibilidad y seguridad
**Como** usuario, **quiero** que la reorganización no rompa enlaces, juegos ni
progreso, **para** seguir usando la app sin migraciones manuales.

**Criterios de aceptación:**
- [x] AC-11: Un `categoryId`/`moduleId` desconocido, un manifiesto vacío, un topic
  custom duplicado o un source ausente producen fallback seguro; ninguna vista lanza
  excepción ni deja una tarjeta sin enlace.
- [x] AC-12: Hub, categoría y breadcrumb son operables con teclado, tienen foco
  visible, objetivos táctiles ≥44 px, `aria-current`/etiquetas coherentes y no generan
  scroll horizontal a 360 px. Las tarjetas decorativas usan `alt=""`.
- [x] AC-13: Sin dependencias nuevas, sin red, sin cambios en `sepect.srs.v1`,
  `sepect.profile.v1`, XP, historial ni en la mecánica de los 8 juegos.
- [x] AC-14: `npm test`, `npm run lint` y `npm run build` pasan al 100%; los tests
  actuales de hub, TopicView, catálogo y parser se actualizan solo por el nuevo
  orden/estructura, no por cambios de contrato.

---

## 🚧 Restricciones arquitectónicas

- Datos puros en `src/core/content/`; las vistas no importan filesystem ni globs.
- El manifiesto no se persiste en localStorage: es código versionado.
- Los assets no se mueven en esta spec; cualquier cambio de tokens `I: asset:` queda
  fuera de alcance.
- No se modifica `parseTopic` ni el formato de las cartas.
- Los scripts deben seguir funcionando en Node sin dependencias nuevas.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Categoría sin módulos o sin temas | Tarjeta «Próximamente»; no se muestra una rejilla vacía rota |
| Módulo sin temas | Se omite en la vista de categoría y se reporta en tests del manifiesto |
| Topic built-in ausente del manifiesto | Fallback seguro, sin crash; test de cobertura lo detecta |
| Source ausente | `sourcePath` se conserva para diagnóstico, pero el lector (spec-19) muestra estado vacío |
| Topic custom con el mismo título que uno built-in | `uniqueId` existente resuelve; el custom va a «Mis temas» |
| Enlace antiguo `#/tema/:id` | Sigue funcionando |
| Enlace antiguo a un juego | Sigue funcionando |
| Assets en ruta plana | Se conservan; los tokens no cambian |

---

## 🧪 Contrato de pruebas

```
ENTRADA: library.CATEGORIES
SALIDA: [
  { id, title, description?, order, modules: [
    { id, title, description?, order, topicIds: string[] }
  ]}
]
ERROR ESPERADO: IDs duplicados, topicIds duplicados o sourcePath inexistente
→ el test de manifiesto falla con el ID exacto.

ENTRADA: loadCatalog()
SALIDA: Topic[] con categoryId, moduleId, moduleTitle, sourcePath y campos actuales.

ENTRADA: parseHash('#/categoria/programacion')
SALIDA: { view: 'category', categoryId: 'programacion' }
```

**Tests mínimos:**
- `library.test.js`: estructura, orden, unicidad, cobertura de built-ins y mapping.
- `catalog.test.js`: glob recursivo, metadatos adjuntos, customs, fallback.
- `sources.test.js`: registro lazy, path existente/ausente.
- `router.test.js` / `App` tests: categoría, tema y juego.
- `CategoryView.test.jsx`: módulos, temas, vacío, unknown.
- `TopicsHub.test.jsx`: categorías, «Próximamente», custom, acciones.
- `TopicView.test.jsx`: breadcrumb y enlace de vuelta.
- Tests de scripts: resolución por ID en estructura recursiva.

---

## 🚫 Fuera de alcance

- Lector del documento original y TTS (spec-19).
- Filtrado de juegos por categoría (spec-20).
- Mazos, dominio y arcade (spec-18).
- Crear contenido de Idiomas/Universidad.
- Mover assets o cambiar tokens `I: asset:`.
- Cambiar el parser, SRS, XP o la mecánica de los juegos.

---

## ✅ Implementación (2026-10-24)

- T1–T6: manifiesto `library.js`, contenido en carpetas por categoría, catálogo
  recursivo con metadatos, registro lazy de sources, ruta `#/categoria/:id`,
  `CategoryView`, hub category-first y breadcrumb en `TopicView`.
- T7: resolución recursiva de topics en `generate-card-images` y
  `generate-topic-art`, con error `AMBIGUOUS_TOPIC` si el ID se repite.
- T8: estilos `library-*`, `category`, `module-*`, `topic-card` y breadcrumb;
  teclado, foco visible, targets ≥44 px, 360 px y `prefers-reduced-motion`.
- T9: docs/roadmap/MEMORY/FOCUS sincronizados; `spec-16` renombrado; deuda
  preexistente de PNG y sketches de `estructuras-de-datos` saldada.
- Gates: `npm test` 731/731, `npm run lint` 0, `npm run build` OK.

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [ ] `specs/tasks-17-biblioteca-categorias-modulos.md` revisado
