---
feature: lluvia-meteoros
status: approved
owner: Eduardo
created: 2026-10-19
updated: 2026-10-19
related_tasks: tasks.md (spec-09 — approved 2026-10-19)
---

# Spec — Lluvia de meteoros (spec-09)

> [!abstract] Resumen
> Octavo juego del arcade (ID estable `lluvia-meteoros`): «Lluvia de meteoros».
> Un meteoro cae con el `front` de una carta y el jugador debe elegir su `back`
> entre tres opciones antes de que impacte. La adaptación clave frente a
> «Meteor Rush» de VocaPlayLand es que **el texto largo nunca rompe la partida**:
> los textos cortos viajan en una cápsula sobre el meteoro y los largos pasan a
> un panel fijo de lectura («modo radar»), mientras la duración de caída crece
> con la longitud del texto. TTS obligatorio (Web Speech API). Un jugador, sin
> dependencias nuevas y sin tocar el núcleo ni `GameHost`.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (juego + lógica pura + timer/pausa + TTS + a11y + SRS + docs) |
| Fecha | 2026-10-19 |
| Revisada por | Eduardo — 2026-10-19 |

---

## 📖 Historias de usuario

### HU-1 — Disponible con contenido suficiente
**Como** aprendiz, **quiero** jugar con cualquier tema que tenga al menos 6 cartas,
**para** practicar significados con presión de tiempo sin sets degenerados.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('lluvia-meteoros')` devuelve `status:'available'`, `minCards:6` y `load: () => import('./lluvia-meteoros/index.jsx')`; el catálogo queda en **6 available / 4 soon**, los otros IDs no cambian y `load()` resuelve el componente.
- [ ] AC-2: `TopicView` habilita el juego con temas de ≥6 cartas usando el helper existente `getGameAvailability`; con menos cartas muestra «Necesitas al menos 6 cartas». `GameHost` aplica el mismo gate en acceso directo por URL y muestra pantalla segura.
- [ ] AC-3: El setup ofrece dificultad (`tranquilo|normal|arcade`), ritmo (`manual|auto|survival`) y rondas 3–10 (default **8**). Al empezar se llama `selectCards(rounds)`; la sesión usa `min(rondas, cartas seleccionadas)`. Sin `selectCards` usa `deck.slice(0, rondas)` (retrocompatible).

### HU-2 — Textos largos legibles y jugables
**Como** aprendiz, **quiero** que preguntas y respuestas largas sigan siendo legibles
sin truncarse ni desbordar la pantalla, **para** que la presión de tiempo no dependa
de la longitud de la carta.

**Criterios de aceptación:**
- [ ] AC-4: `textProfile(text)` es puro y devuelve `{ graphemes, longestToken, mode, size }`:
  - `mode:'meteor'` si `graphemes ≤ 72`, no hay saltos de línea y `longestToken ≤ 30`.
  - `mode:'radar'` si supera cualquiera de esos límites, incluidos URLs/tokens sin espacios.
  - `size` es `lg|md|sm` según longitud para tipografía fluida.
  - Cuenta grafemas con `Array.from` (CJK/emoji sin `Intl.Segmenter`). Texto vacío o solo espacios → `mode:'radar'`, `graphemes:0`.
- [ ] AC-5: `fallDurationMs({ text, difficulty })` es puro, monótono con la longitud y determinista:
  - `base = clamp(6000, 5000 + 60 * graphemes, 20000)`.
  - `duration = clamp(4500, round(base * multiplier), 26000)`, con `tranquilo:1.25`, `normal:1`, `arcade:0.8`.
  - Dificultad inválida → `normal`; texto vacío → `6000`. La UI añade `GRACE_MS=700` antes de iniciar la caída.
- [ ] AC-6: En `meteor` el `front` completo viaja en una cápsula bajo el meteoro, con `overflow-wrap:anywhere`, `hyphens:auto` y sin truncado. En `radar` el `front` completo se muestra en un panel fijo superior; el meteoro se reduce a roca compacta + barra de progreso. Nunca se oculta texto con elipsis. A 360px no hay scroll horizontal.

### HU-3 — Ronda, opciones y resolución
**Como** aprendiz, **quiero** tres opciones claras y una sola oportunidad por meteoro,
**para** decidir rápido y recibir feedback inmediato.

**Criterios de aceptación:**
- [ ] AC-7: `buildRound({ card, deck, random })` devuelve exactamente **3 opciones** (1 correcta + 2 distractores) tomadas del `deck` completo, con `id` únicos y `back` normalizado único. Baraja con `random` inyectable (default `Math.random`). Si el deck tiene ≥3 `back` únicos, toda ronda construible tiene 3 opciones.
- [ ] AC-8: `buildSession({ cards, deck, rounds, difficulty, random })` filtra cartas sin `id`, `front` o `back`, exige ≥3 `back` únicos y devuelve sesión vacía segura si no se cumple. El orden de las cartas es el de `selectCards`; cada ronda precalcula `profile` y `durationMs`.
- [ ] AC-9: Un solo intento por meteoro. Acierto → `facil`; fallo o timeout → `otra-vez`. Se revela la opción correcta, se deshabilitan las tres y se emite `onGrade(cardId, grade)` exactamente una vez (seq monótono). Click doble o timeout posterior se ignoran por fase.

### HU-4 — Ritmo, vidas y puntuación
**Como** aprendiz, **quiero** elegir entre ritmo pausado, automático o con vidas,
**para** adaptar la partida a mi tiempo de lectura y a mi tolerancia al fallo.

**Criterios de aceptación:**
- [ ] AC-10: `manual` detiene el meteoro resuelto y espera «Siguiente». `auto` avanza solo a los `FEEDBACK_MS=2500` con cuenta visible, permitiendo «Siguiente» anticipado. `survival` usa 3 vidas y autoavance; cada fallo/timeout resta 1 vida; con 0 vidas la partida termina. En `survival`, las rondas no mostradas **no se califican**.
- [ ] AC-11: Puntos locales: acierto = `100 + round(remainingRatio * 100)`; fallo/timeout = 0. `score`, `streak` y `bestStreak` viven solo en el estado del juego. Resumen: puntos, aciertos, fallos, mejor racha, XP (`hits * 10`) y acciones «Jugar de nuevo» (vuelve al setup con los últimos ajustes) / «Volver al tema». Nada de esto se persiste desde el juego.
- [ ] AC-12: Salir a mitad de meteoro emite `otra-vez` **solo** para la carta actual sin resolver; las futuras no se emiten. Salir tras responder o desde setup/resumen no re-emite. Salir con 0 vidas no emite pendientes.

### HU-5 — Timer, pausa y movimiento
**Como** jugador, **quiero** que el meteoro se detenga al pausar o cambiar de pestaña,
**para** no perder por causas externas y conservar mi progreso.

**Criterios de aceptación:**
- [ ] AC-13: Se usa `createEngine` de `src/core/engine/engine.js` como único loop rAF. El progreso se actualiza por `ref`/transform (sin setState a 60fps); el timeout se dispara una sola vez. `stop()` y `stopSpeech()` en cleanup; sin setState tras unmount.
- [ ] AC-14: Pausa manual (botón) y automática en `visibilitychange=hidden`; se conserva el tiempo transcurrido y la posición. Al volver se muestra overlay «Continuar». La pausa también detiene la cuenta de autoavance. `resize` recalcula el recorrido sin reiniciar el tiempo.
- [ ] AC-15: Con `prefers-reduced-motion: reduce` no hay cola, partículas, shake ni transform de caída; se muestra una barra de progreso estática. La duración, reglas y puntuación son idénticas.

### HU-6 — TTS, accesibilidad y aislamiento
**Como** usuario con lector de pantalla o teclado, **quiero** jugar sin depender de la
animación ni del ratón, **para** que el juego sea inclusivo y mantenible.

**Criterios de aceptación:**
- [ ] AC-16: TTS con `src/core/audio/tts.js`: al aparecer cada meteoro se lee el `front` completo; al elegir opción se lee su `back`; en feedback se lee la correcta. Botón 🔊 «Pregunta» y «Respuesta», `<SoundToggle />` en setup, partida y resumen. Sin `speechSynthesis` los controles 🔊 se ocultan y el juego es 100% jugable. Muted respeta `sepect.settings.v1`; `stopSpeech()` al pausar/desmontar.
- [ ] AC-17: Accesibilidad: botones nativos, Tab/Shift+Tab/Enter/Space, teclas `1/2/3` para responder, `aria-live="polite"` con «Meteoro N de M: <front>» y resultado sin mensajes obsoletos, foco visible (`--neon-green`), targets ≥44px, textos largos con wrap, estado correcto/incorrecto por color + icono + texto, y foco predecible al empezar/siguiente/feedback.
- [ ] AC-18: Aislamiento: `lluvia-meteoros` no importa `storage|parser|content|router` ni usa `localStorage|indexedDB|fetch(`. Recibe `{ deck, selectCards?, onGrade, onExit }`; no conoce SRS/XP/history. La lógica pura no importa nada. `GameHost.jsx` y `src/core/` no se modifican.

### HU-7 — Integración y calidad
**Como** mantenedor, **quiero** que el juego se integre con el SRS existente y que los
gates queden en verde, **para** cerrar el incremento sin regresiones.

**Criterios de aceptación:**
- [ ] AC-19: Integración con `GameHost`: acierto `facil` y fallo/timeout `otra-vez` persisten SRS + XP + history y son idénticos tras remount. La selección de cartas prioriza no aprendidas vía `selectCards` (patrón existente). Salida a mitad emite solo la carta actual.
- [ ] AC-20: `npm test` 100% pass, `npm run lint` 0 errors/warnings y `npm run build` OK. Docs actualizadas: `specs/roadmap-games.md` (spec-09), `docs/manual-a11y-checklist.md` (sección Lluvia de meteoros), `MEMORY.md`, `FOCUS.md` y `tasks.md` archivado en `specs/tasks-09-lluvia-meteoros.md` al cerrar.

> Cada AC mapea a ≥1 test automatizado en §6. AC-17 y AC-20 también usan checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: React + CSS + Web APIs. Sin Framer Motion, canvas, p5 ni librerías de animación.
- **Contrato de juego congelado** (`specs/spec-02-topics-flashcards.md` §4): `deck`, `selectCards`, `onGrade`, `onExit`. `lluvia-meteoros` no necesita props nuevas ni cambios en `GameHost.jsx`.
- **SRS/XP/history solo en `GameHost`**: el juego emite `onGrade(cardId, grade)` y no persiste nada. Puntos/racha son estado efímero del componente.
- **Lógica pura**: `lluvia-meteoros.logic.js` sin imports; `random` inyectable; sin `Date`, sin acceso a DOM.
- **Loop único**: `createEngine` para el timer; el juego no crea loops paralelos. La animación visual se actualiza por ref/transform, no por setState a 60fps.
- **Texto largo**: `textProfile` decide `meteor|radar`; en radar nunca se trunca. La duración escala con grafemas para no penalizar la lectura.
- **Layout firmado**: 3 opciones fijas; columna única en móvil, hasta 3 columnas en desktop; imágenes de opción compactas; panel de prompt fijo en radar.
- **Ritmo firmado**: `manual`, `auto`, `survival` (3 vidas). Autoavance 2500 ms. En supervivencia no se califican rondas no mostradas.
- **Dificultad firmada**: solo velocidad (`×1.25 / ×1.0 / ×0.8`). No cambia nº de opciones ni selección de distractores.
- **Rondas firmadas**: 3–10, default 8.
- **Contenido**: `minCards: 6` en el registry; gate con el helper existente.
- **TTS**: wrapper compartido; lectura del `front` al aparecer, `back` elegido y `back` correcto en feedback.
- **Aislamiento**: imports permitidos del juego: React, `CardImage`, `SoundToggle`, `core/audio/tts.js`, `core/engine/engine.js` y su propia lógica. Prohibidos storage/parser/content/router.
- **Archivos permitidos**: `src/games/lluvia-meteoros/**`, `src/games/registry.js`, `src/games/registry.test.js`, `src/ui/tokens.css`, `src/views/GameHost.test.jsx`, `src/views/TopicView.test.jsx`, `specs/roadmap-games.md`, `docs/manual-a11y-checklist.md`, `MEMORY.md`, `FOCUS.md`, `tasks.md` y `specs/tasks-09-lluvia-meteoros.md`.
- **Sin cambios** en `src/core/**`, `src/views/GameHost.jsx`, `src/app/**` ni otros juegos.
- UI strings en español; identificadores en inglés.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|---|
| Tema con <6 cartas | Juego deshabilitado en TopicView; acceso directo muestra pantalla segura |
| Deck con <3 `back` únicos | Setup/sesión segura «Este tema no tiene suficientes significados distintos»; sin crash |
| Carta con `front`/`back`/`id` vacío | Se filtra de la sesión; si no quedan cartas, estado seguro |
| `back` duplicado entre cartas | Se deduplica al elegir distractores; la correcta siempre se incluye |
| Prompt >72 grafemas, con salto de línea o token >30 | Modo radar con panel fijo; nunca se trunca |
| URL o cadena sin espacios | Modo radar + `overflow-wrap:anywhere` |
| CJK, emoji o combinaciones | Conteo por grafemas; layout y duración estables |
| Texto de 500+ caracteres | Panel radar con scroll interno controlado; se mantiene la duración calculada |
| Respuesta correcta larga | Opción con wrap completo, sin ellipsis; feedback legible con TTS |
| Click doble o timeout tras responder | Ignorados por fase; una sola emisión |
| Pausa durante gracia/caída/feedback | Se congela el tiempo y la cuenta de autoavance; reanudación explícita |
| Pestaña oculta | Auto-pausa + overlay al volver; no se pierde progreso |
| Salir a mitad de meteoro | Solo la carta actual → `otra-vez`; futuras no se emiten |
| Salir tras responder | Sin re-emisión; sin pendientes |
| Supervivencia con 0 vidas | `complete`; la carta actual ya resuelta; no se califican no mostradas |
| Navegador sin `speechSynthesis` | Controles 🔊 ocultos; juego 100% jugable |
| Sonido silenciado | `speak()` no encola; el juego sigue |
| `prefers-reduced-motion` | Sin animaciones decorativas; barra de progreso; mismas reglas |
| Resize/orientación | Se recalcula el recorrido; el tiempo no se reinicia |
| Viewport de 360px | Sin scroll horizontal; opciones apiladas; targets ≥44px |
| localStorage corrupto | Fallback existente `{ muted:false }`; sin nueva persistencia |
| Desmontaje con TTS/loop activo | `stopSpeech()` + `engine.stop()`; sin setState tras unmount |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  textProfile('¿Qué es una función?')
SALIDA:   mode:'meteor', graphemes ≤72, longestToken ≤30

ENTRADA:  textProfile(<texto de 150 caracteres>); textProfile('https://...'); textProfile('a\nb')
SALIDA:   mode:'radar' en los tres casos; sin truncado en UI

ENTRADA:  textProfile('变量'); textProfile('🚀🚀🚀')
SALIDA:   graphemes 2 y 3 respectivamente (Array.from), sin excepción

ENTRADA:  fallDurationMs({ text:'corto', difficulty:'normal' }) vs 150 caracteres
SALIDA:   duración larga > corta; tranquilo > normal > arcade para el mismo texto;
          resultados dentro de [4500, 26000]; inválidos → normal/6000

ENTRADA:  buildRound({ card, deck: 6 cartas, random: fijo })
SALIDA:   3 opciones con ids únicos, la correcta incluida, backs normalizados únicos,
          determinista con el mismo random

ENTRADA:  buildSession({ cards: 8, deck: 8, rounds: 10, random: fijo })
SALIDA:   total 8; con cards:4 → total 4; con <3 backs únicos → sesión vacía segura

ENTRADA:  reduce(playing, { type:'answer', optionId: correcta, remainingRatio:.5 })
SALIDA:   phase 'answered', grade 'facil', puntos 150, lastGrade.seq 1

ENTRADA:  reduce(playing, { type:'timeout' })
SALIDA:   phase 'answered', grade 'otra-vez', puntos 0; survival resta 1 vida;
          con 0 vidas → phase 'complete'

ENTRADA:  reduce(paused, { type:'resume' }) / reduce(playing, { type:'pause' })
SALIDA:   phase 'playing' / 'paused'; acciones inválidas devuelven el mismo estado

ENTRADA:  pendingCurrent(estado en meteoro 2 de 5 sin responder)
SALIDA:   [{ cardId: <carta 2>, grade:'otra-vez' }] (solo la actual)
          tras responder → []; desde setup/complete → []

ENTRADA:  summarize(estado con 3 aciertos, 2 fallos, mejor racha 2)
SALIDA:   { hits:3, fails:2, bestStreak:2, xp:30, score:<suma> }

ENTRADA:  render setup con deck de 8 y selectCards mock
SALIDA:   dificultad 3 opciones, ritmo 3 opciones, rondas 3–10 default 8;
          Empezar llama selectCards(8); pantalla segura con deck <6 o <3 backs

ENTRADA:  render meteoro con front de 150 caracteres
SALIDA:   panel radar con el texto completo; no hay ellipsis; 3 botones de opción
          con aria-label "Opción N: <back>"; teclas 1/2/3 responden

ENTRADA:  render sin speechSynthesis / muted=true
SALIDA:   controles 🔊 ocultos / speak no encola; juego jugable

ERROR ESPERADO: ninguno lanzado a la UI; deck/backs insuficientes → pantalla segura;
                aislamiento: cero imports de storage|parser|content|router
```

Además:
- UI: flujo manual (espera Siguiente), auto (avance 2500 ms con fake timers), supervivencia (3 vidas → complete), pausa/reanudación, feedback correcto/incorrecto/timeout, replay.
- A11y: `aria-live` sin mensajes obsoletos, foco visible, targets, reduced motion, wrap de textos largos, ausencia de scroll horizontal (regex + checklist manual).
- Integración `GameHost.test.jsx`: SRS+XP+history para `facil` y `otra-vez`, estabilidad tras remount, salida mid-meteoro y `selectCards` no aprendidas primero.
- Registry: 6 available / 4 soon, `load()` de lluvia resuelve.

---

## 📂 Fuera de alcance (Out of scope)

- Multijugador, modo mecanografía, leaderboards, SFX, música o nuevas dependencias.
- Persistencia de puntos/racha fuera de la sesión; solo SRS/XP/history vía `GameHost`.
- Canvas, p5.js, pestañas de dificultad por carta o selección de distractores por similitud semántica.
- Cambios en `GameHost.jsx`, `src/core/**`, router, parser, SRS, stats, deploy o PWA.
- Implementar otros juegos (`sopa-de-letras`, `caza-significados`, etc.).
- Reglas nuevas de disponibilidad más allá de `minCards: 6`.

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-19**.
- Decisiones firmadas: adaptación híbrida meteoro/radar para textos largos; 3 opciones fijas; selector de ritmo Manual/Auto/Supervivencia (3 vidas); dificultad solo de velocidad; 8 rondas por defecto (3–10); `minCards: 6`; puntos arcade + XP vía `onGrade`; TTS obligatorio; sin cambios en `GameHost` ni en el núcleo.
