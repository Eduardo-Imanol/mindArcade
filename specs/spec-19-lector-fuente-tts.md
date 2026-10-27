---
feature: lector-fuente-tts
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-26
related_tasks: specs/tasks-19-lector-fuente-tts.md
---

# Spec — Lector del documento original y TTS (spec-19)

> [!abstract] Resumen
> Añade una sección para **leer el documento fuente original** de un tema y
> **escucharlo** con la Web Speech API. El lector renderiza el Markdown de forma
> segura, sin dependencias nuevas, carga el documento de forma lazy y ofrece
> leer/pausar/reanudar/detener respetando el mute global. Solo los temas con
> `sourcePath` muestran el acceso; los custom no lo tienen.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Media (reader + parser Markdown + TTS + ruta + a11y) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. **Ruta**: `#/tema/:topicId/fuente`. Se conserva `#/tema/:topicId` y
   `#/tema/:topicId/juego/:gameId`. El enlace «Leer documento original» aparece en
   `TopicView` solo si el tema tiene `sourcePath` y el source existe.
2. **Carga lazy**: `src/core/content/sources.js` (spec-17) resuelve el Markdown con
   `import.meta.glob` sin `eager`. El documento se carga al entrar en la vista, no en
   el bundle inicial.
3. **Render seguro**: parser/renderer propio en `src/core/content/markdown.js` que
   produce bloques React. No se usa `dangerouslySetInnerHTML`. Se renderizan:
   encabezados, párrafos, listas, citas, reglas horizontales, bloques de código,
   negrita, cursiva y código inline. Enlaces se muestran como texto seguro o enlace
   si son `http(s)`; nunca se inyecta HTML. La estructura `Block[]` se exporta como
   base reutilizable por el parser de ejercicios de spec-21.
4. **TTS por fragmentos**: se leen encabezados, párrafos y elementos de lista; se
   omiten bloques de código. El texto se divide en fragmentos de ~200 caracteres
   respetando frases. La secuencia se cancela al pausar, detener, navegar o
   desmontar.
5. **Controles**: Leer, Pausar, Reanudar, Detener; estado visible; respeta
   `sepect.settings.v1.muted`. Si `speechSynthesis` no está disponible, los controles
   se ocultan y se muestra un aviso discreto.
6. **Custom topics**: no tienen source original; el enlace no aparece y la ruta
   directa muestra un estado vacío claro.
7. **Sin dependencias nuevas**, sin red y sin cambios en SRS, XP, mazos o juegos.
8. **Accesibilidad**: artículo con headings reales, orden de lectura correcto,
   controles ≥44 px, foco visible y sin scroll horizontal a 360 px.
9. **Leer selección (addendum 2026-10-26)**: al seleccionar texto dentro del
   documento, se lee automáticamente ese fragmento (~350 ms de debounce). Solo
   cuenta la selección contenida en el artículo; se cancela con Detener, mute,
   navegación o desmontaje. El botón «Leer selección» permite repetirla sin
   volver a seleccionar. Sin `speechSynthesis` no hay lectura automática.

---

## 📖 Historias de usuario

### HU-1 — Leer el documento original
**Como** aprendiz, **quiero** abrir el documento completo del que salieron las
tarjetas, **para** entender el contexto y profundizar sin salir de la app.

**Criterios de aceptación:**
- [ ] AC-1: `TopicView` muestra «Leer documento original» solo cuando el tema tiene
  `sourcePath` resoluble. El enlace lleva a `#/tema/:topicId/fuente`. En custom o
  source ausente no hay enlace roto.
- [ ] AC-2: `SourceReader` carga el Markdown completo y lo renderiza con el parser
  seguro: H1/H2/H3, párrafos, listas ordenadas/no ordenadas, citas, `---`, bloques
  bloques de código y énfasis. El contenido visible coincide con el source (sin truncar).
- [ ] AC-3: La vista muestra título del tema, breadcrumb/«Volver al tema», estado de
  carga, error y vacío. Un `sourcePath` inexistente o un fetch fallido no lanza
  excepción; muestra un mensaje y el enlace de vuelta.
- [ ] AC-4: El título del documento se actualiza (`Sepect — Fuente: <tema>`) y la
  ruta funciona con deep link, recarga y botón atrás.

### HU-2 — Escuchar el documento
**Como** aprendiz, **quiero** escuchar el documento mientras leo, **para** estudiar
sin mirar la pantalla o reforzar la comprensión.

**Criterios de aceptación:**
- [ ] AC-5: La vista ofrece Leer, Pausar, Reanudar y Detener. El estado del botón
  refleja `speaking`, `paused` o `idle`; el foco y `aria-pressed`/`aria-label` son
  correctos.
- [ ] AC-6: El TTS lee encabezados, párrafos y listas en orden, omite bloques de
  código y divide textos largos en fragmentos para no truncar. Al terminar, vuelve a
  `idle`.
- [ ] AC-7: El mute global detiene cualquier lectura y oculta/deshabilita los
  controles según corresponda. Al desmutear no se reanuda automáticamente.
- [ ] AC-8: Navegar fuera, desmontar o pulsar Detener cancela la secuencia y no deja
  utterances huérfanas. Pausar y reanudar conservan el fragmento actual.
- [ ] AC-9: Si `speechSynthesis` no existe, la lectura se oculta con un aviso
  accesible; el documento sigue siendo legible.
- [ ] AC-14: Seleccionar texto dentro del documento lo reproduce automáticamente
  por TTS; «Leer selección» repite ese fragmento, Detener/mute/navegación lo
  cancelan y una selección vacía no dispara audio. Sin `speechSynthesis` no hay
  lectura automática. (Addendum solicitado por Eduardo, 2026-10-26).

### HU-3 — Seguridad, rendimiento y calidad
**Como** mantenedor, **quiero** que el lector sea seguro y liviano, **para** no
introducir XSS ni inflar el bundle.

**Criterios de aceptación:**
- [ ] AC-10: El renderer no usa `dangerouslySetInnerHTML` ni interpreta HTML crudo;
  el texto se escapa. Enlaces solo `http(s)`/relativos seguros. Un source con
  `<script>` se muestra como texto.
- [ ] AC-11: El source no se carga hasta entrar en la vista; el bundle inicial no
  incluye los cuatro documentos. La vista es usable a 360 px, con teclado y lector de
  pantalla.
- [ ] AC-12: Sin dependencias nuevas ni llamadas de red (el Markdown es local).
- [ ] AC-13: `npm test`, `npm run lint` y `npm run build` pasan al 100%; tests de
  parser/renderer/TTS/ruta/a11y incluidos.

---

## 🚧 Restricciones arquitectónicas

- `src/core/content/markdown.js` y `src/core/audio/tts.js` son puros o wrappers de
  Web API; no importan storage de progreso.
- `SourceReader` no importa el glob directamente; usa `sources.js`.
- El renderer devuelve React elements, nunca strings HTML.
- La lectura no modifica SRS, XP ni historial.
- El lector no requiere backend ni service worker.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Tema custom | Sin enlace; ruta directa muestra estado vacío |
| `sourcePath` ausente | Sin enlace; estado vacío |
| Source vacío | Estado vacío accesible |
| Source muy grande | Render por bloques sin bloquear; TTS por fragmentos |
| Markdown con HTML/script | Se escapa y muestra como texto |
| Bloque de código | Se renderiza, pero no se lee en TTS |
| TTS no soportado | Controles ocultos + aviso; lectura visual intacta |
| Mute activo | No se emite audio; controles coherentes |
| Texto seleccionado | Se lee solo el fragmento seleccionado tras ~350 ms |
| Selección fuera del artículo | No se lee |
| Navegación durante lectura | `stopSpeech()` y limpieza |
| `speechSynthesis.pause()` no disponible | Fallback: Detener/Leer desde el inicio |

---

## 🧪 Contrato de pruebas

```
ENTRADA: loadSource('programacion/dart-funciones.md')
SALIDA: Promise<string | null>

ENTRADA: parseSourceMarkdown(md)
SALIDA: Block[] con tipos:
  heading | paragraph | list | code | blockquote | hr

ENTRADA: blocksToSpeech(blocks)
SALIDA: string[] de fragmentos (sin code blocks)

ENTRADA: speakSequence(parts, { onEnd, onError })
SALIDA: control con pause/resume/stop/cancel

ENTRADA: selección no vacía dentro del artículo
SALIDA: lectura TTS del texto seleccionado + botón «Leer selección»
```

**Tests mínimos:**
- `sources.test.js`: path existente/ausente, lazy, escape de paths.
- `markdown.test.js`: bloques, inline, HTML escapado, code fences, listas, HR,
  documentos vacíos/inválidos.
- `tts.test.js`: speak, sequence, pause/resume/stop, mute, cancelación, no
  disponibles, chunking.
- `SourceReader.test.jsx`: loading/error/empty, render, controles, TTS, unmount,
  source custom, lectura automática de selección y repetición manual.
- Router/App: `#/tema/:id/fuente`, title, notFound.
- TopicView: enlace condicional.
- A11y: headings, teclado, 360 px, `aria-live` sin ruido.

---

## 🚫 Fuera de alcance

- Editar el documento o las tarjetas desde la vista.
- Búsqueda dentro del documento.
- Resaltado sincronizado palabra a palabra.
- Traducción o voces por idioma configurables.
- Cambiar el formato de los sources.
- Añadir un editor Markdown o dependencias de renderizado.

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [x] Addendum AC-14 «leer selección» solicitado por Eduardo — 2026-10-26
- [ ] `specs/tasks-19-lector-fuente-tts.md` revisado
