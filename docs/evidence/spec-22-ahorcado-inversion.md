# Evidencia — spec-22 Ahorcado: palabra arriba, pista abajo

> Medición con Chrome headless 155 y CDP sobre
> `#/tema/funciones-en-programacion/juego/ahorcado` (botón «Empezar» pulsado).
> Viewports: 360×900, 768×1000 y 1440×1000. Las capturas y medidas se tomaron
> antes del cambio y se repitieron con el código final en T4. La posición de la
> pista varía con el arte y el texto de cada carta; el orden palabra → pista es
> invariante.

## T1 — Antes (pista arriba, palabra abajo)

| Viewport | Orden DOM (recortado) | `hint.top` | `word.top` | Scroll horizontal |
|---|---|---|---|---|
| 360 | art → hint → word → status → keyboard | 355 | 697 | 360/360 |
| 768 | art → hint → word → status → keyboard | 73 | 415 | 768/768 |
| 1440 | art → hint → word → status → keyboard | 73 | 391 | 1440/1440 |

El DOM y el layout coincidían: la pista precedía a la palabra en los tres
tamaños. Capturas: `before-360.png`, `before-768.png`, `before-1440.png`.

## T2 — Después (palabra arriba, pista abajo)

Medición final de T4 sobre el código cerrado:

| Viewport | Orden DOM | `word.top` | `hint.top` | `word.top < hint.top` | Scroll horizontal |
|---|---|---|---|---|---|
| 360 | word → art → hint → status → keyboard | 123 | 581 | ✅ | 360/360 |
| 768 | word → art → hint → status → keyboard | 73 | 203 | ✅ | 768/768 |
| 1440 | word → art → hint → status → keyboard | 73 | 203 | ✅ | 1440/1440 |

El arte decorativo queda entre palabra y pista y por debajo de la palabra; el
estado de intentos y el teclado cierran el orden. Capturas:
`after-360.png`, `after-768.png`, `after-1440.png`.

## T3 — Tests DOM y accesibilidad

`src/games/ahorcado/Ahorcado.test.jsx` (6 tests):

- palabra antes que pista (y pista antes que estado y teclado) con
  `compareDocumentPosition`, además de `data-testid="ahorcado-word"` y
  `data-testid="ahorcado-hint"`;
- pista con `role="group"` y `aria-label="Pista"`, etiqueta visual
  `aria-hidden`, imagen de pista llamada «Pista visual» sin filtrar la palabra;
- una sola región `role="status"`/`aria-live="polite"` en la ronda y palabra sin
  `aria-live` propio (sin anuncios duplicados);
- teclado físico y en pantalla, letras usadas deshabilitadas y XP `+10` al ganar;
- TTS automático al iniciar, botón «Escuchar la pista», silencio global y
  `stopSpeech` al desmontar;
- regresión arcade: vidas 3→2→1→0, puntuación 100, grados `facil`/`otra-vez` y
  cierre con `onArcadeEnd`.

## T4 — Verificación final

- **Árbol de accesibilidad** (Chrome CDP, misma fuente que usa VoiceOver en
  macOS): `group "Palabra de 23 letras"` → `image "Muñeco del ahorcado…"` →
  `group "Pista"` → `group "Letras"`; la imagen interna se anuncia como
  «Pista visual» y la única región viva contiene «0 de 6 fallos · 6 intentos
  restantes».
- **Reduced motion**: con `prefers-reduced-motion: reduce`, el arte y su SVG
  tienen `animation-name: none` (sin animación de piezas ni pulso de alarma).
- **Layout**: `word.top < hint.top` en 360/768/1440 y
  `scrollWidth === clientWidth` en los tres tamaños.
- **Sin regresión**: lógica, mazos, scoring, arcade, SRS y texto de la pista
  intactos; solo cambian orden y hooks de test.
- **Gates**: `npm test` 936/936, `npm run lint` 0, `npm run build` OK (solo
  warning preexistente de chunk >500 kB).

## Comprobaciones

- [x] `[data-testid="ahorcado-word"]` antes de `[data-testid="ahorcado-hint"]`.
- [x] Pista con `role="group"` y `aria-label="Pista"`; etiqueta visual sin
  duplicar el anuncio.
- [x] Progreso con un único `role="status"` y `aria-live="polite"` intacto.
- [x] Sin scroll horizontal a 360 px.
- [x] Sin cambios de lógica, vidas, scoring, SRS, arcade ni TTS.
- [x] Tests DOM/a11y dedicados (T3) y cierre visual final (T4).
- [x] Árbol de accesibilidad y reduced motion verificados por CDP.
- [ ] Lectura hablada real con VoiceOver: pendiente de la pasada manual humana.
