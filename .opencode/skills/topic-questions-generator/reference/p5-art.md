# Arte p5: un diagrama conceptual por carta

El arte no es decoración: cada SVG debe explicar la idea de su carta de un
vistazo. Se genera con el motor p5 interno (`scripts/p5-art/`), es determinista
y no usa assets externos.

## Dónde vive

| Pieza | Ruta |
|---|---|
| Motor (mini p5 → SVG) | `scripts/p5-art/engine.mjs` |
| Paleta | `scripts/p5-art/palette.mjs` |
| Primitivas reutilizables | `scripts/p5-art/primitives.mjs` |
| Sketches por tema/sección | `scripts/p5-art/sketches/<modulo>.mjs` |
| Registro por `card-id` | `scripts/p5-art/sketches/index.mjs` |
| Generador | `scripts/generate-topic-art.mjs` |
| Salida | `src/content/assets/<topic-id>/<card-id>.svg` |

`scripts/p5-art/game-sketches.mjs` es **otra cosa**: dibuja las fichas de los 8
juegos (`src/assets/games/`). No lo toques al generar el arte de un tema.

## Contrato del SVG (lo que verifica el test)

`scripts/generate-topic-art.test.mjs` comprueba, por cada carta:

| Requisito | Detalle |
|---|---|
| Lienzo | `viewBox="0 0 512 512"`, `width`/`height` 512 |
| Accesible | `role="img"`, `<title>` y `aria-label` con la **pregunta** de la carta |
| Peso | < 200 KB (los SVG reales pesan 2–5 KB) |
| Determinista | el mismo `card-id` produce **los mismos bytes** en cada ejecución |
| Paridad | cada `I: asset:` tiene archivo y no sobran SVG en `assets/` |

El `role`, el `<title>` y el `aria-label` los añade `toSVG()`: el sketch no
tiene que escribirlos, pero el texto visible sí debe ser el de la carta.

## Cómo funciona el generador

```bash
node scripts/generate-topic-art.mjs <archivo-sin-ext> --force
```

1. Parsea el tema y recorre las cartas con `I: asset:`.
2. Busca un sketch con la **clave exacta** del `card-id` en `SKETCHES`.
3. Si no existe, lo anota en `missing` y al final **sale con código 1**.
4. Si existe, renderiza con `label = Q` (la pregunta) y `seed = hashSeed(card.id)`.
5. Escribe el archivo en la ruta que dice el `I:` (crea la carpeta si falta).
6. Sin `--force` omite los SVG que ya existen.

El argumento es el **nombre del archivo del tema sin extensión** (se busca en
`src/content/topics/`) o una ruta relativa al directorio actual; ver
`reference/topic-format.md`.

## API del motor (`Sketch`)

El sketch es una función que recibe la instancia `p`:

```js
export function miSketch(p) {
  baseBg(p);
  fnPill(p, 256, 200, 'f(x)', { w: 150, h: 60, size: 28 });
  p.arrow(340, 200, 420, 200, { color: GREEN });
  caption(p, 'una idea', 256, 430, { color: MUTED, size: 22 });
}
```

### Estado y transformaciones

| Método | Uso |
|---|---|
| `background(color)` | Rect de fondo 512×512 (por defecto `BG2`) |
| `push()` / `pop()` | Guarda y restaura fill, stroke, grosor, texto, radio y desplazamiento |
| `translate(x, y)` | Desplazamiento **acumulado** (se revierte con `pop()`) |
| `random()` | Aleatorio **sembrado** (mulberry32) |
| `randomSeed(seed)` | Reinicia el PRNG |

### Color y trazo

| Método | Uso |
|---|---|
| `fill(c)` / `noFill()` | Relleno (sin fill → `fill="none"`) |
| `stroke(c)` / `noStroke()` | Contorno |
| `strokeWeight(w)` | Grosor (por defecto 2) |
| `dash('9 8')` / `dash(null)` | Trazo discontinuo |
| `cornerRadius(r)` | Radio por defecto de `rect` (10) |

### Formas

| Método | Firma |
|---|---|
| `rect` | `(x, y, w, h, r = radio)` |
| `circle` | `(x, y, d)` — `d` es el **diámetro** |
| `ellipse` | `(x, y, w, h)` |
| `line` | `(x1, y1, x2, y2, { color, weight })` |
| `poly` | `([ [x,y], … ], { close = true, color })` — polígono o polilínea |
| `arrow` | `(x1, y1, x2, y2, { color, head = 12, dashed = false })` |

### Texto

| Método | Firma |
|---|---|
| `text` | `(valor, x, y, { size, align, weight, color })` — `align`: `middle` \| `start` \| `end` |
| `textSize` / `textAlign` / `textWeight` | Valores por defecto (28, `middle`, 700) |

El texto usa `dominant-baseline="central"`: la `y` es el **centro vertical** de
la línea. La fuente es `ui-monospace, SFMono-Regular, Menlo, monospace` del
sistema: no hay fuentes externas. Los valores se escapan con `escapeXml`.

## Paleta

| Token | Color | Uso típico |
|---|---|---|
| `CYAN` | `#00ffcc` | Elemento principal, operación |
| `MAGENTA` | `#ff007f` | Dato, entrada, valor a mirar |
| `GREEN` | `#39ff14` | Resultado, éxito, orden |
| `AMBER` | `#ffcc00` | Advertencia, coste, complejidad |
| `TEXT` | `#f1f1f1` | Texto legible |
| `MUTED` | `#8a7fb5` | Contenedor, nota secundaria |
| `BG2` | `#1a0b2e` | Fondo del lienzo |
| `BG` | `#0f051d` | Fondo profundo (no usado por `baseBg`) |
| `HUES` | `[168, 320, 120, 45, 265]` | Matices para el fondo |
| `hsl(h, s, l, a)` | — | `hsl(168 90% 60% / 0.25)` (sintaxis moderna) |

Máximo 2–3 colores con intención por imagen. `baseBg(p, { bubbles, hue })`
añade el fondo con burbujas semitransparentes; sin `hue` elige uno al azar de
`HUES` con el PRNG sembrado (determinista).

## Primitivas

| Primitiva | Para qué | Opciones |
|---|---|---|
| `fnPill` | Función, operación, algoritmo | `w, h, color, size` |
| `varChip` | Variable, dato, clave | `w, h, color, size` |
| `box` | Estructura, bloque, nodo contenedor | `color, label, dashed, fill, size` |
| `stackFrame` | Pila, frame, nivel, llamada | `color, size` |
| `treeNode` | Nodo de árbol, vértice de grafo | `r, color, size, empty` |
| `badge` | Complejidad o etiqueta corta (`O(1)`, `O(n)`) | `color, w, h, size` |
| `bracket` | Rango, bloque, agrupación (`[` o `]`) | `color, thick` |
| `dashRect` | Zona opcional, límite, futuro | `color, r` |
| `caption` | Texto corto de apoyo | `color, size, align` |
| `dots` | Continuación, elementos omitidos | `color, r, n` |
| `glowLine` | Conexión destacada | `hue` |

`badge` calcula su ancho a partir del texto (`label.length * size * 0.62 + 26`);
si lo fijas con `w`, el texto puede desbordar.

## Reglas de composición

1. Una idea por imagen. Si necesitas dos ideas, probablemente son dos cartas.
2. Máximo 4 elementos **con etiqueta**. El resto puede ir sin texto.
3. Etiquetas de 1–3 palabras; nunca la pregunta completa.
4. Misma gramática visual en todo el tema: nodo = círculo, estructura = caja,
   dato = chip, coste = badge, operación = píldora.
5. Deja aire: márgenes ≥ 40 px respecto al borde del lienzo.
6. Nada de `Math.random()`, `Date` ni nada no sembrado: el byte tiene que ser
   idéntico en cada ejecución.
7. Sin imágenes ni fuentes externas.
8. El texto no puede salirse del lienzo: mide el ancho de las píldoras antes de
   colocarlas (`fnPill` con `w` amplio, `badge` con ancho calculado).

## Organización de los sketches

1. Crea un módulo nuevo por tema: `scripts/p5-art/sketches/<topic-id>.mjs`.
   (El tema existente usa 14 módulos por sección: `basics.mjs`, `params.mjs`,
   `collections.mjs`… Lo que importa es el registro, no el nombre del módulo.)
2. Exporta **una función por `card-id`**, con nombre camelCase descriptivo:
   `export function queEsUnaPila(p) { … }`.
3. Agrupa visualmente por sección del source dentro del mismo módulo, con un
   comentario de cabecera.
4. Registra cada función en `sketches/index.mjs` con la clave **exacta** del id:

   ```js
   import * as estructuras from './estructuras-de-datos.mjs';
   // …
   export const SKETCHES = {
     // …
     'que-es-una-pila': estructuras.queEsUnaPila,
   };
   ```

5. No reutilices un sketch para dos cartas: el diagrama debe ser específico.
6. No borres sketches de otros temas: un sketch sin carta se reporta como
   **huérfano** y el test falla.

## Playbook para estructuras de datos

| Concepto | Composición sugerida |
|---|---|
| Arreglo / lista dinámica | Cajas contiguas + índices + badge `O(1)` |
| Lista enlazada | Nodos + flechas + `null` al final; doble con flechas bidireccionales |
| Pila | `stackFrame` apilados + flechas `push`/`pop` |
| Cola / deque | Cajas en fila + entrada/salida en extremos + buffer circular |
| Heap | Árbol binario con etiquetas de orden + badge `O(log n)` |
| Tabla hash | Cubetas + chips clave/valor + colisión encadenada |
| Conjunto | Chips únicos + operación de pertenencia |
| LRU / caché | Lista doble + caja hash + badge de desalojo |
| BST | `treeNode` + comparaciones `<`/`>` en las aristas |
| AVL / rojinegro | Árbol + badge de rotación + color de nodo |
| B / B+ | Nodos anchos con varias claves + rango de hijos |
| Trie | Capas de letras + camino resaltado |
| Grafo | Círculos + aristas + matriz o lista de adyacencia |
| Union-find | Dos conjuntos + flechas de padre + rango |
| Segment tree / Fenwick | Árbol con rangos o arreglo con índices binarios |
| Estructura persistente | Nodos versionados + aristas nuevas resaltadas |
| Estructura concurrente | Candados / colas + hilos representados por carriles |

Para un módulo de 120–200 cartas, sepáralo en secciones comentadas
(fundamentos, lineales, hash, árboles, especializadas, grafos, avanzadas) para
que el registro siga siendo legible.

## Generar y verificar

```bash
node scripts/generate-topic-art.mjs <archivo-sin-ext> --force
```

El argumento es el nombre del archivo **sin extensión** (se busca en
`src/content/topics/`) o una ruta relativa al directorio actual.

- Si imprime `Sin sketch (N)` con la lista de ids, corrige el registro o crea
  los sketches que faltan.
- Vuelve a ejecutar hasta que no quede ningún `?`.
- `npm test` incluye la auditoría de arte: cobertura, huérfanos, paridad,
  calidad, determinismo y el ciclo de `generateArt`.
- Revisa una muestra en `#/tema/<topic-id>`.

## Anti-patrones

- Un sketch genérico copiado para todas las cartas.
- Texto largo o varias frases dentro del SVG.
- Más de 4 cajas: la imagen se vuelve ilegible.
- Colores aleatorios sin jerarquía.
- Etiquetas que desbordan la caja o el lienzo.
- Editar un SVG a mano: se sobrescribe en la siguiente generación.
- `Math.random()` o `Date.now()`: rompen el determinismo y el test falla.
- Sketch registrado sin carta: el test lo reporta como huérfano.
- Carta sin sketch: el generador termina con código 1.
