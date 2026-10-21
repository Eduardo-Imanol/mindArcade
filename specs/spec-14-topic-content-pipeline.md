---
feature: topic-content-pipeline
status: signed
owner: Eduardo
created: 2026-10-21
updated: 2026-10-21
related_tasks: specs/tasks-14-topic-content-pipeline.md
---

# Spec — Pipeline de contenido: de source a tema jugable (spec-14)

> [!abstract] Resumen
> Convierte un source largo (`src/content/sources/<slug>.md`) en un tema built-in
> jugable y medible: extracción exhaustiva, `src/content/topics/<topic-id>.md`, un
> SVG p5 por carta y verificación de juegos, hub, dashboard y estadísticas. Todo
> local, sin backend y sin cableado manual. Esta spec adapta la skill
> `topic-questions-generator` y generaliza el test de arte para soportar N temas.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-21) · T1–T8 implementadas y verificadas; diff pendiente de revisión humana |
| Escala | Media (contenido + tooling de validación; sin tocar lógica de juegos) |
| Fecha | 2026-10-21 |
| Revisada por | Eduardo — aprobada por chat 2026-10-21; diff pendiente de revisión final |

---

## 🎯 Decisiones propuestas (pendientes de firma)

1. **Extracción exhaustiva por tramos**: la cantidad de cartas depende del tamaño
   del source, no de un tope fijo. El objetivo es una carta por concepto atómico.
2. **Arte obligatorio**: toda carta del tema lleva `I: asset:` y un SVG conceptual
   propio generado con el motor p5. No se aceptan cartas sin arte.
3. **Cero cableado**: un tema built-in se registra solo al existir en
   `src/content/topics/*.md`. No se editan catálogo, hub, dashboard, registry ni
   componentes de juegos.
4. **Skill como índice + referencias**: `SKILL.md` corto con el pipeline y cinco
   archivos en `reference/` (extracción, formato, arte, juegos/dashboard,
   validación) para no inflar el contexto del agente.
5. **Test de arte generalizado**: `scripts/generate-topic-art.test.mjs` deja de
   estar hardcodeado a `funciones-programacion` y a 96 cartas; pasa a iterar todos
   los topics y a verificar paridad assets↔cartas.
6. **Fuera de alcance de este incremento**: generar el tema de estructuras de
   datos, añadir juegos nuevos, cambiar el parser o el motor p5, añadir
   dependencias y tocar la mecánica de los 8 juegos.

---

## 📖 Historias de usuario

### HU-1 — Generar el paquete completo de un tema
**Como** autor de contenido, **quiero** entregar un source y recibir el tema listo
para jugar, **para** no repetir pasos manuales entre tarjetas, arte y verificación.

**Criterios de aceptación:**
- [x] AC-1: La skill reconoce el disparador «genera el tema de X con @source» y
  produce: tema en `src/content/topics/`, sketches en `scripts/p5-art/sketches/`,
  registro en `sketches/index.mjs` y SVG en `src/content/assets/<topic-id>/`.
- [x] AC-2: El `topic-id` es `slugify(H1)` (≤60 chars) y coincide con la carpeta de
  assets referenciada en cada `I:`. Si el H1 supera 80 chars, la skill avisa y
  propone un título más corto antes de escribir.
- [x] AC-3: La skill no modifica código de la aplicación (parser, juegos, registry,
  vistas, store) ni añade dependencias.
- [x] AC-4: La skill termina con un reporte: número de cartas, SVG escritos,
  juegos habilitados para el tema y rutas para probar.

### HU-2 — Extracción exhaustiva y trazable
**Como** autor de contenido, **quiero** que el source se cubra completo, **para**
que el tema no pierda conceptos importantes ni repita ideas.

**Criterios de aceptación:**
- [x] AC-5: La skill construye primero un mapa de cobertura a partir de los H2/H3
  del source y asigna una cuota de cartas por sección antes de redactar.
- [x] AC-6: La densidad sigue los tramos: <300 líneas → 20–40 cartas; 300–800 →
  40–80; 800–1.500 → 80–120; >1.500 → 120–200. La skill reporta el tramo aplicado.
- [x] AC-7: Cada carta cubre una sola idea atómica (definición, operación,
  complejidad, memoria, caso de uso, variante o trade-off) y no duplica otra del
  mismo tema.
- [x] AC-8: `E: easy` se usa para definición o dato directo; `E: hard` para matiz,
  excepción, complejidad o trade-off. No se inventan otros valores.
- [x] AC-9: `Q` es autocontenida y única; `A` responde en 1–2 frases; ninguna de las
  dos contiene `|` (el parser lo absorbe y corrompe el id o los campos sin avisar).
- [x] AC-10: La descripción del tema sale del source, ocupa una sola línea, mide
  ≤160 chars y no lleva prefijos `>` ni `|`.
- [x] AC-11: La auditoría final recorre los H2/H3 y confirma al menos una carta por
  sección, o deja justificada por escrito la sección omitida.

### HU-3 — Formato congelado y arte p5
**Como** autor de contenido, **quiero** que el tema y su arte cumplan el contrato
vigente, **para** que el parser y la UI los consuman sin retoques.

**Criterios de aceptación:**
- [x] AC-12: Cada carta sigue exactamente `- Q: … | A: … | E: easy|hard | I:
  asset:<topic-id>/<card-id>.svg`, una por línea, fuera de bloques de código.
- [x] AC-13: El `card-id` es `slugify(Q)` (≤60 chars) y el nombre del SVG coincide
  byte a byte con el id calculado; la skill lo obtiene con el parser, nunca a ojo.
- [x] AC-14: Existe un sketch por `card-id`, registrado con la clave exacta en
  `scripts/p5-art/sketches/index.mjs`; sin sketches huérfanos ni cartas sin sketch.
- [x] AC-15: `node scripts/generate-topic-art.mjs <topic-id> --force` escribe un SVG
  por carta y termina con código 1 si falta algún sketch.
- [x] AC-16: Cada SVG es 512×512, incluye `role="img"`, `<title>` y `aria-label`,
  pesa <200 KB y es byte-determinista entre ejecuciones.
- [x] AC-17: El arte es un diagrama conceptual (≤4 etiquetas cortas), sin assets
  externos, sin fuentes externas y sin aleatoriedad no sembrada.
- [x] AC-18: El tema de `funciones-programacion` sigue intacto y sigue pasando sus
  pruebas después de generalizar el test.

### HU-4 — Juegos, hub y estadísticas sin cableado manual
**Como** aprendiz, **quiero** que el tema nuevo aparezca y se pueda jugar de
inmediato, **para** empezar a estudiar sin pasos extra.

**Criterios de aceptación:**
- [x] AC-19: El tema aparece en `#/` y en `#/tema/<topic-id>` junto a las 8 fichas
  de juego, sin cambios en `TopicsHub`, `TopicView`, `registry` ni `GameHost`.
- [x] AC-20: La disponibilidad de cada juego se calcula con las cartas elegibles
  para estudio y la tabla de `minCards` vigente; la skill reporta cuántos juegos
  quedan habilitados y por qué se bloquea el resto.
- [x] AC-21: `intruso` permanece bloqueado mientras exista un solo tema con ≥3
  cartas elegibles; se habilita al añadir un segundo tema compatible.
- [x] AC-22: El tema aparece en `#/progreso` con progreso, aprendidas, por aprender
  y para repasar; las métricas se derivan de SRS + historial sin persistencia nueva.
- [x] AC-23: `addedAt` se asigna en el primer avistamiento del tema built-in
  (`ensureTopicMeta`), sin editar el `.md` ni el almacenamiento a mano.
- [x] AC-24: La portada del tema es la primera carta con imagen explícita; si no
  hay, la primera carta con fallback determinista de `CardImage`.

### HU-5 — Validación, documentación y cierre
**Como** equipo, **queremos** que el pipeline quede verificable y documentado,
**para** que el siguiente tema no reconstruya decisiones.

**Criterios de aceptación:**
- [x] AC-25: `scripts/generate-topic-art.test.mjs` itera todos los
  `src/content/topics/*.md`; verifica cobertura de sketches por tema, ausencia de
  sketches huérfanos contra la unión de ids, paridad assets↔cartas, determinismo,
  accesibilidad y tamaño. Sin referencias fijas a 96 ni a un único tema.
- [x] AC-26: Un tema con `asset:` sin archivo o un SVG huérfano hace fallar el test
  con un mensaje que identifica tema y carta.
- [x] AC-27: `npm test`, `npm run lint` y `npm run build` pasan al 100 %.
- [x] AC-28: La skill queda como `SKILL.md` + `reference/extraction.md`,
  `reference/topic-format.md`, `reference/p5-art.md`,
  `reference/games-dashboard.md` y `reference/validation.md`, con DoD y comandos.
- [ ] AC-29: Al ejecutar el primer tema real se actualizan `MEMORY.md`, `FOCUS.md`
  y el estado de esta spec/tasks; la spec no se marca firmada sin diff revisado.

---

## 🚧 Restricciones arquitectónicas

- **Local-first**: sin backend, sin red y sin telemetría. El progreso vive en
  `localStorage` y el historial en el perfil local.
- **Sin dependencias nuevas**: el pipeline usa Node, el parser y el motor p5
  existentes.
- **Parser congelado**: el formato `Q | A | E | I` no se modifica; si un source no
  encaja, se adapta la redacción de las cartas.
- **Una sola fuente de verdad de juegos**: la lista de juegos vive en
  `src/games/registry.js`; la skill no la duplica ni la edita.
- **Arte generado, nunca a mano**: los SVG de `src/content/assets/` se escriben con
  `scripts/generate-topic-art.mjs`; no se editan a mano.
- **Skill en español** y con presupuesto de contexto: `SKILL.md` es índice; el
  detalle va en `reference/`.
- **Spec-Anchored**: la implementación de T1–T8 de
  `specs/tasks-14-topic-content-pipeline.md` no empieza hasta que esta spec tenga
  firma humana.

---

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Source vacío o sin H1 | La skill se detiene y pide el source o el título; no escribe archivos |
| H1 >80 chars | Avisa, propone título corto y confirma antes de escribir |
| Dos cartas con la misma `Q` | Se reescribe una; `uniqueId` solo es red de seguridad, no el plan |
| `|` dentro de `Q` o `A` | El parser lo absorbe y ensucia el id o los cortes: la skill lo prohíbe y valida el parseo |
| `E` inválido o con texto extra | No hay error: el texto cae dentro de `A` y la dificultad queda `easy`; la skill valida el parseo |
| Source con bloques de código | Se ignoran para cartas y descripción; el código solo inspira arte o ejemplos |
| Carta sin sketch | El generador imprime los ids faltantes y sale con código 1 |
| Sketch registrado sin carta | El test generalizado lo reporta como huérfano y falla |
| `asset:` apunta a un SVG inexistente | El test de paridad falla identificando tema y carta |
| Tema con <4 cartas | Memorama, quiz y serpiente quedan bloqueados por `minCards`; se reporta |
| Tema con <6 cartas | Lluvia de meteoros queda bloqueada; se reporta |
| Único tema del catálogo | `intruso` queda en mantenimiento hasta el segundo tema |
| Tema custom con el mismo id | `uniqueId` añade sufijo; la skill usa el id real del catálogo |
| SVG >200 KB | El test de calidad falla; se simplifica el sketch |
| `Math.random()` o fecha en un sketch | Rompe el determinismo y el test falla |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests. La
> implementación corresponde a `specs/tasks-14-topic-content-pipeline.md`.

```
ENTRADA:  source de 2.218 líneas con 17 secciones H2
SALIDA:   tema con 120–200 cartas, 0 errores de parseo, 100 % con I: asset:,
          un sketch y un SVG por carta, sin huérfanos

ENTRADA:  parseTopic('# Tema\nDescripción\n- Q: a | A: b | E: easy | I: asset:tema/a.svg')
SALIDA:   { topic: { id:'tema', title:'Tema', description:'Descripción' },
            cards: [{ id:'a', front:'a', back:'b', difficulty:'easy',
                      image:{ kind:'asset', value:'tema/a.svg' } }], errors: [] }

ENTRADA:  parseTopic('- Q: a | A: b | E: medium | I: asset:tema/a.svg')
SALIDA:   cards: [], errors: ['Skipped: …']

ENTRADA:  src/content/topics con dos temas
SALIDA:   test de arte: cobertura por tema OK, huérfanos = [],
          cada asset: tiene archivo, cada carpeta sin SVG sobrantes

ENTRADA:  getGameAvailability(registry.lluvia, { topic: temaCon5Cartas, studyCardCounts })
SALIDA:   { playable:false, reason:'min-cards', minCards:6, eligible:5 }

ENTRADA:  loadCatalog() con el tema nuevo y localStorage limpio
SALIDA:   el tema aparece como source:'builtin'; hub y #/progreso lo listan;
          addedAt se asigna en el primer avistamiento sin escribir el .md

GATES:    npm test (100 %) · npm run lint (0 warnings) · npm run build (OK)
```

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano (aprobada por chat, 2026-10-21)
- [ ] Diff final revisado por humano (T1–T8 cerrados en este incremento)
