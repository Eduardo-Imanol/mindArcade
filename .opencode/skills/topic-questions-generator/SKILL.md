---
name: topic-questions-generator
description: Genera los topics (archivos de preguntas Q/A/E/I) de mindArcade a partir de un source markdown que el usuario adjunta con @, y produce el arte SVG de cada pregunta con el motor p5 de scripts/p5-art. Usar cuando el usuario diga "genera las preguntas del tema", "crea el topic", "genera los topics", "haz las preguntas de @archivo", o adjunte un source markdown pidiendo las tarjetas.
license: MIT
compatibility: opencode
metadata:
  audience: content
  workflow: content-pipeline
  scope: mindArcade
---

# Topic Questions Generator — mindArcade

Convierte un **source** largo en un **topic** con preguntas del formato oficial y en el
**arte conceptual SVG** de cada pregunta usando el motor p5 interno. Todo local, determinista
y verificable.

## Cuándo usar
- El usuario escribe algo como: `genera las preguntas de @src/content/sources/<archivo>.md`,
  "crea el topic de <tema>", "hazme las preguntas de este archivo", "genera los topics".
- El usuario adjunta un source markdown con `@` y espera: archivo de tema + imágenes.

Combinar con: `topic-parser-engine` (formato frozen), `p5js-interactive-canvas` (estilo de dibujo),
`game-logic-testing` (verificación), `impeccable` (definition of done).

## Entradas y salidas

| Entrada | Salida |
|---|---|
| `src/content/sources/<slug>.md` (apuntes largos, headings + bloques de código) | `src/content/topics/<topic-id>.md` con las tarjetas |
| — | sketches en `scripts/p5-art/sketches/<grupo>.mjs` + registro en `sketches/index.mjs` |
| — | SVG en `src/content/assets/<topic-id>/<card-id>.svg` (generado, no a mano) |

El `topic-id` = `slugify(título del H1)` y el `card-id` = `slugify(Q)` (ver abajo).
Referencia viva del formato: `src/content/topics/funciones-programacion.md` (96 tarjetas).

## Formato del topic (exacto, frozen — no inventar otro)

```md
# <Título del tema>            ← H1, ≤80 chars → da el topic-id

<Descripción en una línea>     ← ≤160 chars, sin prefijos `>` ni `|`

- Q: <pregunta> | A: <respuesta> | E: easy | I: asset:<topic-id>/<card-id>.svg
- Q: <pregunta> | A: <respuesta> | E: hard | I: asset:<topic-id>/<card-id>.svg
```

Reglas del parser (`src/core/parser/parser.js`):
1. **Orden de tokens obligatorio:** `Q | A | E | I`. El parser corta primero `| I:` y
   luego exige que `| E:` (`easy`|`hard`) cierre la línea. Otro orden = línea descartada.
2. `E` es solo `easy` o `hard` (default `easy`). `easy` = definición/dato directo;
   `hard` = matiz, excepción o comportamiento avanzado.
3. Cada tarjeta va en **una sola línea** que empieza con `- `. Nada de listas anidadas.
4. Los bloques ` ``` ` se ignoran: las tarjetas van fuera de fences.
5. `I:` siempre `asset:<topic-id>/<card-id>.svg` (kind `asset`). Nunca URL ni emoji aquí.
6. `Q` debe ser **único** (si se repite, el id lleva sufijo `-2`, `-3`…).
7. Cobertura: una idea por tarjeta, sin repetir, en el orden del source. Típico 20–100.

### card-id y el truncado a 60 chars
`slugify` (en `src/core/content/slug.js`): NFD sin acentos, minúsculas, todo lo no
`[a-z0-9]` → `-`, se recortan guiones extremos, **`.slice(0,60)`** y de nuevo strip final.
Por eso ids largos se cortan (p. ej. `...devuelven-valores-independiente`). El nombre del
SVG **debe** ser idéntico al id calculado — no lo escribas a mano "a ojo".

Para imprimir los ids exactos de un topic recién escrito:

```bash
node --input-type=module -e "import fs from 'node:fs'; import {parseTopic} from './src/core/parser/parser.js'; const md=fs.readFileSync(process.argv[1],'utf8'); for(const c of parseTopic(md).cards) console.log(c.id+'\t'+c.front)" src/content/topics/<topic-id>.md
```

## Arte SVG con el motor p5 (`scripts/p5-art/`)

Cada pregunta lleva un **diagrama conceptual** (no un screenshot): una idea por imagen.
API del motor: `engine.mjs` (Sketch en modo instancia, `baseBg`, `renderSketch`),
paleta `palette.mjs` (CYAN, MAGENTA, GREEN, AMBER, MUTED, TEXT, hsl) y componentes
`primitives.mjs` (`box`, `fnPill`, `varChip`, `badge`, `bracket`, `dashRect`, `caption`,
`dots`, `glowLine`, `stackFrame`, `treeNode`).

### Patrón de un sketch
```js
// scripts/p5-art/sketches/<grupo>.mjs
import { baseBg } from '../engine.mjs';
import { CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, fnPill, varChip } from '../primitives.mjs';

export function queEsAlgo(p) {
  baseBg(p);                       // fondo + burbujas (determinista por seed = hashSeed(id))
  fnPill(p, 256, 256, 'f(x)', { w: 150, h: 70, size: 34 });
  varChip(p, 72, 256, 'dato', { color: MAGENTA });
  p.arrow(130, 256, 175, 256, { color: CYAN });
  caption(p, 'devuelve', 360, 210, { color: MUTED });
}
```

Reglas del arte:
1. Lienzo 512×512 fijo; `baseBg(p)` primero. El label y el `<title>`/`aria-label` los pone
   el generador con el texto de `Q` (`renderSketch(sketch, { label: front, seed: hashSeed(id) })`).
2. Solo primitivas + paleta. Nada de assets externos, fuentes, ni `Math.random()` (usa el
   `p.random()` del motor, ya sembrado).
3. Texto corto y legible: 2–4 palabras por etiqueta, ≤4 cajas/pills por imagen. Evita amontonar.
4. Byte-determinista: el mismo id ⇒ el mismo SVG. No metas timestamps ni orden no estable.
5. Registra cada sketch en `scripts/p5-art/sketches/index.mjs` **keyeado por el card-id exacto**:
   ```js
   import * as miGrupo from './mi-grupo.mjs';
   export const SKETCHES = {
     'que-es-algo': miGrupo.queEsAlgo,
   };
   ```
   Agrupa por tema en un módulo nuevo (`sketches/<topic-id>.mjs`) cuando sea un tema nuevo;
   añade al módulo existente si es el mismo tema del source.

## Flujo paso a paso

1. **Leer el source** `@...md` completo y extraer los conceptos (una pregunta por concepto).
2. **Escribir el topic** en `src/content/topics/<topic-id>.md` con el formato exacto.
3. **Sacar los ids** con el comando de arriba → son los nombres de fichero y las claves.
4. **Crear los sketches** (`sketches/<grupo>.mjs`) y registrarlos en `index.mjs`.
5. **Generar los SVG**:
   ```bash
   node scripts/generate-topic-art.mjs <topic-id> --force
   ```
   Si imprime `Sin sketch (N): ? <id>`, esas son claves faltantes/desalineadas: corrígelas
   hasta que no quede ningún `?`. Ese comando es la compuerta: falla (exit 1) si falta arte.
6. **Verificar**: `npm test` y `npm run lint` al 100%.

## ⚠️ Tests existentes — hay que generalizarlos

`scripts/generate-topic-art.test.mjs` está hardcodeado al tema `funciones-programacion.md`:
- `expect(cards.length).toBe(96)`;
- "covers every asset: card" y sobre todo **"has no unused sketches"** comparan contra los
  ids de ESE tema. Al añadir sketches de un topic nuevo al mapa global `SKETCHES`, el test
  de "unused" **falla** (no están en funciones-programacion).

Al crear el segundo tema, generaliza ese test para iterar sobre todos los topics:
```js
const TOPICS = fs.readdirSync('src/content/topics').filter((f) => f.endsWith('.md'));
// unir ids de todos los topics; por cada topic: cubrir sus asset: cards y
// exigir que no haya sketches huérfanos respecto al conjunto total.
```
Mantén la determinismo (<200 KB, `role="img"`, `viewBox="0 0 512 512"`, byte-igual). No borres
las aserciones de calidad: muévelas a un loop por id.

## Comandos rápidos
```bash
node scripts/generate-topic-art.mjs <topic-id> --force   # genera SVG (falla si falta sketch)
node scripts/generate-topic-art.mjs <topic-id>           # omite existentes
npm test                                                  # vitest
npm run lint                                              # eslint + prettier, 0 warnings
```

## Errores comunes / anti-patrones
- **Id a ojo**: escribir el `.svg` sin el slug real (truncado a 60). Usa el dump de ids.
- **Orden de tokens** distinto a `Q | A | E | I` → tarjeta descartada silenciosamente.
- **`E` inválido** (`medium`, `1`, etc.) → no matchea el regex.
- **Sketch huérfano**: registrado en `SKETCHES` pero ningún topic lo usa → rompe el test.
- **Texto excesivo** en el SVG: el diagrama se vuelve ilegible a tamaño tarjeta.
- **`Math.random()`/fecha** en el sketch → rompe la determinismo byte a byte.

## Definition of done
- [ ] `topics/<topic-id>.md` parsea con **0 errores** y `E` correcto por tarjeta.
- [ ] Un sketch por tarjeta; `generate-topic-art.mjs` no imprime `?`.
- [ ] SVG byte-deterministas y accesibles (`role="img"`, `aria-label`, `<title>`).
- [ ] `generate-topic-art.test.mjs` generalizado si hay un topic nuevo.
- [ ] `npm test` y `npm run lint` al 100%.
