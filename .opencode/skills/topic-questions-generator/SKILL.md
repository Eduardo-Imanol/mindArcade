---
name: topic-questions-generator
description: Genera un tema completo de mindArcade desde un source markdown: extracción exhaustiva, tarjetas Q/A/E/I, arte SVG con el motor p5 y verificación de juegos, hub, dashboard y estadísticas. Usar cuando el usuario diga "genera el tema de X con @archivo", "genera los juegos de este tema", "crea el topic y todo lo necesario para jugar", "haz las preguntas de @archivo" o adjunte un source pidiendo las tarjetas.
license: MIT
compatibility: opencode
metadata:
  audience: content
  workflow: content-pipeline
  scope: mindArcade
---

# Topic Content Pipeline — mindArcade

Convierte un **source** largo en un **tema built-in jugable y medible**: extracción
exhaustiva, tarjetas en el formato oficial, un SVG conceptual por carta y
verificación de juegos y estadísticas. Todo local, determinista y sin cableado
manual en hub ni dashboard.

## Cuándo usar

- «Genera el tema de X con `@src/content/sources/<archivo>.md`».
- «Genera los juegos de este tema», «crea todo lo necesario para jugar».
- «Haz las preguntas de `@archivo`», «crea el topic de <tema>».
- El usuario adjunta un source con `@` y espera el paquete completo.

Combinar con: `topic-parser-engine` (formato congelado),
`p5js-interactive-canvas` (estilo de dibujo), `game-logic-testing` (verificación),
`impeccable` (calidad) y `sdd-desarrollo-profesional` (proceso).

## Qué produce

| Artefacto | Ruta |
|---|---|
| Source de entrada | `src/content/sources/<slug>.md` |
| Tema | `src/content/topics/<topic-id>.md` |
| Sketches p5 | `scripts/p5-art/sketches/<topic-id>.mjs` + alta en `sketches/index.mjs` |
| Arte por carta | `src/content/assets/<topic-id>/<card-id>.svg` (generado) |
| Reporte final | cartas, SVG, juegos habilitados y rutas para probar |

**No hace:** no edita juegos, registry, parser, vistas, store ni dashboard; no añade
dependencias; no escribe SVG a mano; no inventa un formato distinto al del parser.

## Pipeline

Sigue los pasos en orden. El detalle de cada uno vive en `reference/`.

1. **Inventariar el source** — líneas, H2/H3, tipo de documento y tramo de densidad.
   → `reference/extraction.md`
2. **Construir el mapa de cobertura** — cuota de cartas por sección antes de
   redactar. Ninguna sección se omite sin justificación escrita.
   → `reference/extraction.md`
3. **Escribir el tema** — H1, descripción ≤160 chars y una carta por concepto
   atómico con `Q | A | E | I`. Valida el parseo (0 errores) y saca los ids reales
   con el parser.
   → `reference/topic-format.md`
4. **Diseñar los sketches** — un diagrama conceptual por `card-id`, agrupado en un
   módulo nuevo por tema y registrado con la clave exacta.
   → `reference/p5-art.md`
5. **Generar los SVG** — ejecuta el generador; si imprime ids faltantes, corrige el
   registro hasta que no quede ninguno.
   → `reference/p5-art.md`
6. **Verificar juegos y métricas** — sin tocar código: predice y comprueba qué
   juegos se habilitan y que el tema aparece en `#/progreso`.
   → `reference/games-dashboard.md`
7. **Cerrar con gates** — tests, lint, build y reporte. El test de arte ya está
   generalizado a N temas: comprueba que sigue en verde con el catálogo nuevo.
   → `reference/validation.md`

## Reglas no negociables

1. Una carta = una idea atómica. Sin duplicados ni preguntas ambiguas.
2. `Q` y `A` no contienen `|`: el parser lo absorbe, ensucia el id y confunde los
   cortes de campo.
3. `E` solo `easy` o `hard`: `easy` para definición o dato directo; `hard` para
   matiz, excepción, complejidad o trade-off.
4. `I: asset:<topic-id>/<card-id>.svg` en el 100 % de las cartas.
5. `topic-id` = `slugify(H1)` (≤60); `card-id` = `slugify(Q)` (≤60). Se obtienen
   del parser, nunca a ojo. Si el H1 pasa de 80 chars, propone un título más corto
   antes de escribir.
6. El arte es conceptual y determinista: 512×512, ≤4 etiquetas, sin assets
   externos y sin aleatoriedad no sembrada.
7. Un sketch registrado sin carta rompe el test: no dejes huérfanos.
8. No toques la app para que el tema funcione; el catálogo built-in se auto-registra.

## Gates

```bash
node scripts/generate-topic-art.mjs <archivo-sin-ext> --force   # exit 1 si falta un sketch
npm test                                                       # suite completa (incluye el test de arte)
npm run lint                                                   # 0 errores/warnings
npm run build                                                  # build OK
```

El argumento del generador es el **nombre del archivo del tema sin extensión**
(no el `topic-id` del H1, que puede divergir). Ver `reference/validation.md`.

`scripts/generate-topic-art.test.mjs` ya está generalizado a N temas: descubre
`src/content/topics/*.md` y valida cobertura de sketches, huérfanos, paridad
assets↔cartas, calidad accesible y determinismo. Al añadir un tema no hay que
tocarlo; sí hay que registrar sus sketches en `sketches/index.mjs` sin dejar claves
huérfanas.

## Reporte final al usuario

- Tema y ruta del archivo, número de cartas y errores de parseo (debe ser 0).
- SVG escritos y confirmación de que no falta ningún sketch.
- Juegos habilitados y bloqueados, con el motivo (`minCards`, `intruso` sin segundo
  tema, «Todo al día»).
- Rutas para probar: `#/`, `#/tema/<topic-id>`, `#/progreso`.
- Resultado de `npm test`, `npm run lint` y `npm run build`.

## Referencias

| Archivo | Contenido |
|---|---|
| `reference/extraction.md` | Inventario, densidad, mapa de cobertura, redacción y auditoría |
| `reference/topic-format.md` | Formato congelado, semántica del parser, ids y assets |
| `reference/p5-art.md` | Motor, paleta, primitivas, playbook visual y generación |
| `reference/games-dashboard.md` | Disponibilidad de juegos, métricas, portada y verificación |
| `reference/validation.md` | Comandos, troubleshooting, reporte y Definition of Done |

## Definition of Done

- [ ] Source inventariado y mapa de cobertura completo.
- [ ] `topics/<topic-id>.md` parsea con 0 errores y descripción válida.
- [ ] 100 % de cartas con `I: asset:` y `card-id` correcto.
- [ ] Un sketch por carta, sin huérfanos; generador sin ids faltantes.
- [ ] SVG accesibles, 512×512, <200 KB y byte-deterministas.
- [ ] Juegos y tema verificados en hub, vista de tema y progreso.
- [ ] `npm test`, `npm run lint` y `npm run build` en verde.
- [ ] Reporte final entregado.
