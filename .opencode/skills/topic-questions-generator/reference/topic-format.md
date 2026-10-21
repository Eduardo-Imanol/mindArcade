# Formato del topic y semántica exacta del parser

El formato está congelado. Si el source no encaja, cambia la redacción de la carta:
nunca el parser, nunca la app.

Todo lo de esta página está verificado contra `src/core/parser/parser.js`,
`src/core/content/slug.js` y `src/core/content/catalog.js`.

## Anatomía del archivo

```md
# <Título del tema>            ← primer encabezado; da el topic-id

<Descripción en una línea>     ≤160 chars, prosa, sin `>` ni `|` ni viñetas

- Q: <pregunta> | A: <respuesta> | E: easy | I: asset:<topic-id>/<card-id>.svg
- Q: <pregunta> | A: <respuesta> | E: hard | I: asset:<topic-id>/<card-id>.svg
```

- **Una carta por línea**, fuera de bloques de código, en el orden del source.
- El `topic-id` es `slugify(H1)`. **Nombra el archivo con ese mismo id**:
  `src/content/topics/<topic-id>.md`. Así el CLI del generador, la ruta
  `#/tema/<topic-id>` y la carpeta de assets usan el mismo nombre y no hay que
  traducir nada.
- La descripción es la prosa anterior a la primera carta. Sin viñetas, sin
  encabezados, sin tablas: cualquier línea que empiece por `-` se interpreta
  como carta y produce un error `Skipped:`.
- Referencia viva: `src/content/topics/funciones-programacion.md` (96 cartas, 100 %
  con arte).

## Contrato congelado de una carta

```
Q: <pregunta> | A: <respuesta> | E: easy|hard | I: asset:<carpeta>/<card-id>.svg
```

- `Q` primero, `A` después, `E` tercero desde el final, `I` **siempre al final**.
- `E` es opcional en el parser, pero en este pipeline es **obligatorio**
  (`easy` = definición o dato directo; `hard` = matiz, excepción, complejidad o
  trade-off).
- `I` es obligatorio en este pipeline: el test de arte exige que el 100 % de las
  cartas sea `kind: 'asset'`.

## Comportamiento exacto del parser

`parseTopic` (`src/core/parser/parser.js`) recorre el archivo línea a línea:

1. **Bloques de código**: una línea que abre un bloque (tres acentos graves)
   alterna el estado `inCode`; dentro del bloque, todo se ignora. Un bloque de
   código con cartas dentro no produce cartas ni errores.
2. **Encabezados**: el **primer** encabezado de cualquier nivel (`#`..`######`)
   es el título, recortado a **80 chars**. Los demás encabezados se descartan
   (no van a la descripción ni a las cartas).
3. **Líneas vacías**: se ignoran al inicio; dentro de la descripción se
   conservan como salto de línea.
4. **Reglas horizontales**: `---`, `___`, `===` (3+ caracteres de esos) se
   ignoran.
5. **Carta**: **cualquier** línea que empiece por `-` se trata como carta (no
   solo las que siguen a la primera). Se parsea con
   `^-\s*Q:\s*(.+?)\s*\|\s*A:\s*(.+?)(?:\s*\|\s*E:\s*(easy|hard))?\s*$` (con
   flag `i`). Si no encaja, la línea se descarta y se registra
   `Skipped: <80 chars>`.
6. **Corte del arte**: antes de parsear, se busca el **primer** `| I:` de la
   línea y se corta todo lo que viene después (incluido el `| I:`). El valor
   restante se clasifica:
   - `http(s)://…` → `{ kind: 'url' }`
   - `asset:…` → `{ kind: 'asset', value: 'lo que va tras asset:' }`
   - cualquier otra cosa (incluido un emoji) → `{ kind: 'emoji' }`
   - `I:` vacío → la carta **queda sin imagen** (no es un error del parser, pero
     el test de arte sí lo rechaza).
7. **Campos**: `A` es perezoso (`(.+?)`), así que el `E:` solo se reconoce si
   está al final y con valor `easy`/`hard`. `E` ausente → `easy`. `E: EASY` se
   acepta y se normaliza a `easy` (el `i` del flag también acepta `q:`/`a:` en
   minúscula).
8. **Id**: `id = uniqueId(slugify(Q), idsYaUsados)`. Si el `Q` se repite, la
   segunda carta recibe el sufijo `-2`, la tercera `-3`…
9. **Descripción**: `descriptionLines.join('\n').trim()`. Se excluyen
   encabezados, reglas horizontales, bloques de código, líneas que empiezan por
   `>` o `|` y —esto es lo importante— **toda línea que empiece por `-`**, que
   se va a las cartas.

### Errores silenciosos (verificados)

| Entrada | Resultado real | Consecuencia |
|---|---|---|
| `E: medium` | `A` = `b \| E: medium`, dificultad `easy` | La carta miente sobre su dificultad |
| `E: easy extra` | `A` = `b \| E: easy extra` | Texto basura pegado a la respuesta |
| `I:` antes de `E` | asset = `t/a.svg \| E: hard` | Ruta de SVG rota |
| Dos `\| I:` | asset = `t/a.svg \| I: asset:t/b.svg` | Ruta de SVG rota |
| `\|` dentro de `Q` | `Q` = `a \| b`, id = `a-b` | Id distinto del esperado |
| `\|` dentro de `A` | `A` = `b \| c` | Se tolera, pero no lo uses |
| Viñeta `-` en la descripción | Error `Skipped: - item de lista` | La descripción pierde la línea |
| `* Q: …` (asterisco) | No es carta: va a la descripción | La carta desaparece sin error |
| `-Q:` sin espacio | Carta válida | Aceptado, pero no lo escribas así |
| `- - Q: …` | Error `Skipped:` | Descartada |
| `I:` vacío | Carta sin imagen | El test de arte falla (`missing-image`) |
| `I: 🐶` o `I: https://…` | `kind: 'emoji'` / `'url'` | El test de arte falla (`missing-image`) |
| Sin H1 | `id` vacío → el catálogo lo llama `tema` | La skill debe parar antes |
| H1 de más de 80 chars | Título recortado a 80 | Avisa y propone un título corto |

**Conclusión**: el parser no avisa de casi nada. Valida siempre el parseo
(`errors` a 0) y contrasta el recuento de cartas con el que esperabas.

## Ids y slugs

`slugify` (`src/core/content/slug.js`): NFD sin acentos → minúsculas → todo lo
que no sea `[a-z0-9]` se vuelve `-` → se recortan guiones extremos → **corte a
60 chars** → se recorta el guion final otra vez.

| Id | Origen | Límite |
|---|---|---|
| `topic-id` | `slugify(H1)` | 60 chars (el H1 se recorta antes a 80) |
| `card-id` | `uniqueId(slugify(Q), tomados)` | 60 chars + sufijo `-2`, `-3`… |

- El `card-id` **no** es necesariamente `slugify(Q)`: si el corte de 60 chars
  hace que dos preguntas distintas compartan prefijo, la segunda recibe `-2`.
  Por eso los ids se obtienen **del parser**, nunca a ojo.
- El nombre del SVG es exactamente `<card-id>.svg` (con el sufijo si lo hay).
- La carpeta del SVG es la que va en `I:`. Por convención de spec-14
  (AC-2) es `<topic-id>/`.
- Excepción heredada: `funciones-programacion.md` tiene H1 «Funciones en
  Programación» → `topic-id` = `funciones-en-programacion`, pero su carpeta de
  assets es `funciones-programacion/` (el nombre del archivo). No copies ese
  desfase en temas nuevos.

### Rutas canónicas

```
src/content/topics/<topic-id>.md            ← el tema
src/content/assets/<topic-id>/<card-id>.svg ← el arte, generado
```

`assetUrl()` (`src/components/CardImage.jsx`) resuelve
`../content/assets/<valor de I:>` con un glob de Vite: el valor de `I:` es la
ruta **relativa a `src/content/assets/`**, sin `/` inicial.

## Comandos

```bash
# 1. Volcado de ids (la lista de claves de sketches y de nombres de SVG)
node --input-type=module -e "import fs from 'node:fs'; import {parseTopic} from './src/core/parser/parser.js'; const md=fs.readFileSync(process.argv[1],'utf8'); for(const c of parseTopic(md).cards) console.log(c.id+'\t'+c.front)" src/content/topics/<topic-id>.md

# 2. Validación (debe imprimir 0 errores y las cartas esperadas)
node --input-type=module -e "import fs from 'node:fs'; import {parseTopic} from './src/core/parser/parser.js'; const md=fs.readFileSync(process.argv[1],'utf8'); const r=parseTopic(md); console.log(r.topic.id, r.cards.length, 'errores:', r.errors.length); console.log(r.errors.join('\n'))" src/content/topics/<topic-id>.md

# 3. Generar el arte
node scripts/generate-topic-art.mjs <topic-id> --force          # stem: busca en src/content/topics/
node scripts/generate-topic-art.mjs src/content/topics/<topic-id>.md --force   # ruta relativa al cwd
```

Sobre el punto 3: `resolveTopicPath()` resuelve el argumento como
`src/content/topics/<arg>.md` si no termina en `.md`, y como ruta relativa al
directorio actual si termina en `.md`. Es decir, el argumento es el **nombre del
archivo sin extensión** o una **ruta relativa al cwd**, no el `topic-id` en
abstracto. Con la convención de este documento (archivo = `<topic-id>.md`) las
dos formas funcionan.

## Reglas de calidad de las cartas

- Español neutro; conserva el término técnico cuando es el concepto.
- Sin markdown, sin enlaces, sin bloques de código dentro de `Q` o `A`.
- Una sola idea por carta.
- `A` responde en 1–2 frases e incluye el dato exacto cuando el source lo da.
- `Q` es autocontenida: no depende de otra carta para entenderse.
- Sin `|` en `Q` ni en `A`; sin `|` en la descripción.
- La descripción no repite el título ni empieza por «Este tema…».

## Checklist antes de pasar al arte

- [ ] `errors: 0` y el número de cartas coincide con el plan.
- [ ] `topic.id` es el esperado y coincide con el nombre del archivo.
- [ ] El 100 % de las cartas tiene `I: asset:<topic-id>/<card-id>.svg`.
- [ ] Los `card-id` del volcado son únicos y todos sus SVG están dentro de la
      carpeta `<topic-id>/`.
- [ ] Ningún `Q` ni `A` contiene `|`.
