# Validación, gates y cierre

La skill no termina cuando el tema está escrito: termina cuando los gates pasan, el
reporte es verificable y el usuario sabe qué rutas abrir.

## Orden de validación

1. Parseo del tema (0 errores, ids correctos).
2. Cobertura de sketches (ningún `card-id` sin sketch).
3. Generación de SVG (sin ids faltantes).
4. Paridad assets↔cartas (sin archivos faltantes ni huérfanos).
5. Juegos y dashboard (comprobación en la app).
6. Gates del repo (`test`, `lint`, `build`).
7. Reporte final.

## Comandos

Todos se ejecutan desde la raíz del repo. Define primero la ruta del tema y
sustituye `<archivo>` por el nombre real (sin extensión) del `.md` de
`src/content/topics/`:

```bash
TEMA=src/content/topics/<archivo>.md
```

### 1. Parseo y conteo

```bash
node --input-type=module -e "import fs from 'node:fs'; import {parseTopic} from './src/core/parser/parser.js'; const md=fs.readFileSync(process.argv[1],'utf8'); const r=parseTopic(md); console.log('id:', r.topic.id); console.log('cartas:', r.cards.length); console.log('errores:', r.errors.length); console.log('con asset:', r.cards.filter(c=>c.image?.kind==='asset').length);" "$TEMA"
```

Salida real del catálogo actual:

```
id: funciones-en-programacion
cartas: 96
errores: 0
con asset: 96
```

Se espera `errores: 0` y `con asset` igual a `cartas`.

### 2. Archivo vs. topic-id (no los confundas)

```bash
node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; import {parseTopic} from './src/core/parser/parser.js'; const f=process.argv[1]; const r=parseTopic(fs.readFileSync(f,'utf8')); const stem=path.basename(f,'.md'); console.log('archivo:', stem, '· topic-id:', r.topic.id, '·', r.topic.id===stem?'coinciden':'DIVERGEN');" "$TEMA"
```

El **generador** busca `src/content/topics/<argumento>.md`; la **app** usa
`topic-id = slugify(H1)`. Si divergen, el generador llamado con el `topic-id`
falla con `No existe el tema: …`.

- Heredado: `funciones-programacion.md` → `funciones-en-programacion`.
- Convención nueva: archivo = `topic-id` = carpeta de assets.

### 3. Volcado de ids (para registrar sketches y comparar con los SVG)

```bash
node --input-type=module -e "import fs from 'node:fs'; import {parseTopic} from './src/core/parser/parser.js'; const md=fs.readFileSync(process.argv[1],'utf8'); for(const c of parseTopic(md).cards) console.log(c.id+'\t'+c.front)" "$TEMA"
```

Una línea por carta: `<card-id>\t<pregunta>`. Estos ids son la verdad: no los
calcules a ojo.

### 4. Paridad rápida (sin correr la suite)

```bash
node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; import {parseTopic} from './src/core/parser/parser.js'; const md=fs.readFileSync(process.argv[1],'utf8'); const {cards}=parseTopic(md); const bad=cards.filter(c=>c.image?.kind!=='asset'||!fs.existsSync(path.join('src/content/assets',c.image.value))); console.log(bad.length?'FALTAN '+bad.length+': '+bad.map(c=>c.id).join(', '):'OK: '+cards.length+' cartas con su SVG');" "$TEMA"
```

`OK: 96 cartas con su SVG` o `FALTAN N: <ids>`.

### 5. Generación de arte

```bash
node scripts/generate-topic-art.mjs <archivo-sin-ext> --force
```

El argumento es el **nombre del archivo del tema sin extensión** (se busca en
`src/content/topics/`) o una ruta a un `.md`, relativa al directorio actual.

- Código 0: `SVG escritos: N · existentes omitidos: M`.
- Código 1 con `Sin sketch (N):` y la lista de ids con `?`.
- Sin `--force` omite los SVG que ya existen.
- Con `--force` reescribe los SVG del tema. Si el motor cambió desde la última
  generación, el diff aparece en `git status`: los bytes del repo pueden quedar
  atrás. El determinismo se comprueba **entre dos ejecuciones**, no contra el
  commit.

### 6. Gates del repo

```bash
npm test        # vitest run — incluye scripts/generate-topic-art.test.mjs
npm run lint    # eslint src scripts --ext .js,.jsx,.mjs --max-warnings 0
npm run build   # vite build
```

- `npm test`: la suite completa en verde; el test de arte aporta 15 pruebas.
  Anota en el reporte el número real de archivos y pruebas que imprima.
- `npm run lint`: 0 errores y 0 warnings (cubre también `scripts/`).
- `npm run build`: termina con `✓ built`. Vite puede avisar de un chunk de más
  de 500 kB: es un aviso del bundler, no un fallo del gate.

## Qué valida el test generalizado

`scripts/generate-topic-art.test.mjs` descubre `src/content/topics/*.md` (sin
números ni nombres fijos) y comprueba:

- cada tema del catálogo parsea sin errores y tiene al menos una carta;
- cada carta declara `I: asset:` (`missing-image`);
- cada carta con `asset:` tiene sketch con la clave exacta (`missing-sketch`);
- ningún sketch queda huérfano contra la unión de ids de todos los temas
  (`orphan-sketch`);
- cada `asset:` tiene archivo (`missing-asset`) y ningún SVG sobra en
  `src/content/assets/` (`orphan-asset`);
- cada SVG es 512×512, tiene `role="img"`, `<title>`, `aria-label` y pesa
  <200 KB (`invalid-svg`), tanto el render como el archivo en disco;
- el mismo `card-id` produce los mismos bytes en dos renders y en dos
  `generateArt` con `--force` (`non-deterministic`);
- `generateArt` escribe todas las cartas, omite las existentes sin `--force` e
  informa los ids sin sketch.

El mismo archivo se ejecuta con fixtures de uno y dos temas sintéticos para
comprobar que un asset ausente, un SVG sobrante o un sketch huérfano se reportan
con tema y carta.

Al añadir un tema no hay que tocar el test: si falla, el problema es el tema, sus
sketches o sus SVG, no el test. Los mensajes llevan el formato
`[código] <archivo>/<carta>: <mensaje>`.

### Y qué NO valida

El test es una auditoría de integridad del arte, no de contenido ni de producto:

- La calidad pedagógica: que la `Q` sea autocontenida, que la `A` responda, que
  `E` refleje la dificultad real o que no haya duplicados.
- La cobertura del source: que cada sección H2/H3 tenga cartas. Eso lo garantiza
  el mapa de cobertura (`reference/extraction.md`), no el test.
- Que el arte sea conceptual, legible o tenga ≤4 etiquetas; el SVG puede ser feo
  y el test lo aprueba.
- Que el `topic-id` coincida con el nombre del archivo o con la carpeta de
  assets (comando 2).
- Que la descripción mida ≤160 chars ni que el H1 pase de 80: el parser recorta
  en silencio.
- Que `Q` o `A` no lleven `|`: el parser lo absorbe en el id o en la respuesta
  sin error. Se detecta comparando el id volcado (comando 3) con el esperado.
- La disponibilidad de juegos, el hub, el dashboard o la persistencia: eso lo
  comprueba `reference/games-dashboard.md` y el smoke manual.

## Smoke manual por ruta

1. `npm run dev` → http://localhost:5173
2. `#/` — el tema aparece con portada, contador de cartas y enlace a su vista.
3. `#/tema/<topic-id>` — 8 fichas de juego; el contador «X de 8 disponibles»
   coincide con la predicción; los bloqueos muestran su motivo («Necesitas al
   menos N cartas», «Todo al día», «En mantenimiento…»).
4. `#/tema/<topic-id>/juego/<game-id>` — el juego abre con cartas del tema;
   responde una y comprueba que el intento se registra.
5. `#/progreso` — el tema aparece con progreso, aprendidas, por aprender y para
   repasar; los KPIs globales no se rompen.
6. Recarga — progreso, racha y `addedAt` persisten.
7. `intruso` — con un solo tema sigue bloqueada; con dos temas compatibles se
   habilita.

Ojo: la ruta usa el **topic-id** (`#/tema/funciones-en-programacion`), no el
nombre del archivo. No hace falta tocar código para que el tema aparezca; si no
aparece, el problema es el parseo o la ruta del archivo.

## Plantilla de reporte al usuario

```
Tema: <título>
Archivo: src/content/topics/<archivo>.md   (topic-id: <topic-id>)
Cartas: N (errores de parseo: 0 · con asset: N)
Arte: N sketches registrados · N SVG en src/content/assets/<carpeta>/
Juegos habilitados: <lista>
Juegos bloqueados: <lista + motivo>
Rutas: #/  ·  #/tema/<topic-id>  ·  #/tema/<topic-id>/juego/<game-id>  ·  #/progreso
Gates: npm test ✅ (N archivos · N pruebas) · npm run lint ✅ (0 warnings) · npm run build ✅
```

## Troubleshooting

| Síntoma | Causa | Acción |
|---|---|---|
| `No existe el tema: …` | El argumento del generador es el `topic-id` y el archivo se llama distinto | Pasa el nombre del archivo sin extensión o la ruta del `.md` |
| El parser reporta errores | Línea con formato inválido | Revisa `Q \| A \| E \| I` y elimina `|` de `Q` y `A` |
| Una carta falta | `E` inválido o `I` mal ubicado | Corrige el orden; el parser **no** avisa: el texto cae dentro de `A` |
| El id no coincide con el SVG | Slug calculado a ojo | Vuelve a volcar los ids con el parser (comando 3) |
| El generador sale con 1 | Falta un sketch | Añade la clave exacta en `sketches/index.mjs` |
| El test falla por huérfanos | Sketch registrado sin carta | Elimina la clave o crea la carta que falta |
| El test falla por asset | `I:` apunta a una ruta inexistente | Regenera el arte y verifica la ruta |
| Aparece un SVG en `assets/tema/` | Una carta sin `I:`: el generador la escribe con topic-id `tema` | Añade el `I:` a la carta y borra el archivo sobrante |
| El id del volcado lleva `|` | Barra dentro de `Q`: el parser la absorbe en el slug | Reescribe la pregunta sin `|` |
| El arte cambia al regenerar | El motor cambió desde la última generación | Revisa `git diff`; el determinismo se mide entre dos ejecuciones |
| El tema no aparece en la app | Archivo fuera de `src/content/topics/` o sin cartas | Mueve el archivo o corrige el parseo |
| `intruso` bloqueado | Solo hay un tema | Es lo esperado; añade otro tema |
| Todos los juegos en «Todo al día» | No quedan cartas elegibles | Revisa el SRS local |

## Definition of Done

- [ ] Mapa de cobertura completo y justificado.
- [ ] Tema con 0 errores y 100 % de cartas con `asset:`.
- [ ] `topic-id`, archivo y carpeta de assets coinciden (o la divergencia está
      documentada).
- [ ] Sketches registrados con ids exactos; sin faltantes ni huérfanos.
- [ ] SVG generados, accesibles, 512×512, <200 KB y deterministas.
- [ ] Juegos y dashboard verificados en la app.
- [ ] `npm test`, `npm run lint` y `npm run build` en verde.
- [ ] Reporte final entregado.
