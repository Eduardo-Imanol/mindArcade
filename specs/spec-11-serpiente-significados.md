---
feature: serpiente-significados
status: approved
owner: Eduardo
created: 2026-10-20
updated: 2026-10-20
related_tasks: specs/tasks-11-serpiente-significados.md (spec-11 — approved 2026-10-20)
---

# Spec — Serpiente de significados (spec-11)

> [!abstract] Resumen
> Décimo y último juego del catálogo (ID estable `serpiente-significados`):
> «Serpiente de significados». Adapta el Snake de VocaPlayLand al estudio de
> pregunta→significado. Arriba se muestran el `front` de la carta y su `CardImage`;
> en el tablero hay **3 manzanas numeradas 1–3** (sin texto) y debajo una
> **leyenda número→significado**. La serpiente come la manzana cuyo significado
> corresponde a la pregunta. Al comer se lee el significado por TTS. Hay dos modos:
> **Rondas** (4–10, default 8, puntuación arcade) y **Supervivencia** (hasta 0 vidas
> o agotar el mazo, puntuación = longitud). 5 vidas; comer una manzana incorrecta
> resta 1 vida y alarga la serpiente; chocar consigo misma resta 1 vida y reaparece
> en el centro. Sin dependencias nuevas ni cambios en el núcleo o `GameHost`.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (juego + lógica pura + loop/pausa + TTS + a11y + SRS + docs) |
| Fecha | 2026-10-20 |
| Revisada por | Eduardo — 2026-10-20 |

---

## 📖 Historias de usuario

### HU-1 — Disponible con contenido suficiente
**Como** aprendiz, **quiero** jugar con cualquier tema que tenga al menos 4 cartas,
**para** practicar significados con una serpiente sin sets degenerados.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('serpiente-significados')` devuelve `status:'available'`,
  `minCards:4` y `load: () => import('./serpiente-significados/index.jsx')`; el título
  visible es «Serpiente de significados» y la descripción «La serpiente come la fruta
  con el significado correcto.». El catálogo queda en **8 available / 2 soon**
  (`sopa-de-letras`, `caza-significados`), los otros IDs no cambian, el orden se
  conserva y `load()` resuelve un componente por defecto.
- [ ] AC-2: `TopicView` habilita el juego con temas de ≥4 cartas usando el helper
  existente `getGameAvailability`; con menos cartas muestra «Necesitas al menos 4
  cartas». `GameHost` aplica el mismo gate en acceso directo por URL y muestra pantalla
  segura.

### HU-2 — Setup claro y modos de juego
**Como** aprendiz, **quiero** elegir modo, dificultad y duración antes de empezar,
**para** adaptar la partida a mi tiempo y a mi forma de estudiar.

**Criterios de aceptación:**
- [ ] AC-3: El setup ofrece:
  - Modo `rounds` (**Rondas**) o `survival` (**Supervivencia**), con `aria-pressed`.
  - Dificultad `tranquilo|normal|arcade` (Tranquilo/Normal/Arcade), con `aria-pressed`.
  - Selector de rondas 4–10 (default 8) visible solo en modo Rondas.
  - `SoundToggle`, «Empezar» y «Salir».
  - Al empezar en Rondas se llama `selectCards(rondas)`; en Supervivencia se llama
    `selectCards(min(20, cartas del mazo))`. Sin `selectCards` se usa
    `deck.slice(0, cantidad)`.
  - El tablero se fija al empezar según el viewport: móvil (≤767 px) 13/15/17 y
    desktop 15/20/20 para Tranquilo/Normal/Arcade. La velocidad es 350/250/180 ms por
    paso respectivamente.
  - La nota del setup muestra cartas disponibles, modo, tamaño de tablero y velocidad.
- [ ] AC-4: Estados seguros:
  - Si el deck tiene <4 cartas, <3 `back` únicos válidos o no quedan cartas válidas,
    se muestra «Este tema no tiene suficientes significados distintos» y no se inicia
    la partida.
  - Cartas sin `id`, `front` o `back` no vacíos se filtran.
  - Cartas con `id` o `back` normalizado duplicado se deduplican (gana la primera).
  - Nunca se lanza una excepción a la UI.

### HU-3 — Pregunta, manzanas numeradas y leyenda
**Como** aprendiz, **quiero** ver la pregunta y la imagen arriba y relacionar cada
manzana con su significado en una leyenda, **para** jugar sin texto amontonado en el
tablero.

**Criterios de aceptación:**
- [ ] AC-5: La zona superior muestra el `front` completo de la carta actual y su
  `CardImage` (pista visual). El texto usa `overflow-wrap:anywhere` y `hyphens:auto`,
  sin ellipsis ni truncado. A 360 px no hay scroll horizontal. El botón 🔊 «Pregunta»
  repite el `front` cuando TTS está disponible.
- [ ] AC-6: El tablero contiene exactamente **3 manzanas**, cada una con un número
  visible **1, 2 o 3** (sin el texto del significado) y un color de la paleta de 3.
  Debajo del tablero hay una leyenda ordenada que asigna cada número a su `back`
  completo, con el mismo color y un botón 🔊 por fila. El mapeo número→significado se
  baraja en cada ronda con `random` inyectable. Las filas comidas/falladas y la correcta
  se distinguen por color + icono + texto, nunca solo por color.
- [ ] AC-7: `buildSession` y `spawnRound` son puros y deterministas con `random`
  inyectable:
  - `buildSession` filtra cartas inválidas, deduplica por `id` y `back` normalizado,
    exige ≥3 `back` únicos en el deck y devuelve una sesión vacía segura si no se
    cumple.
  - En Rondas `total = min(clamp(rondas,4,10), cartas únicas)`; en Supervivencia
    `total = min(cartas únicas, 20)`.
  - `spawnRound` elige 1 carta correcta + 2 distractores del deck completo con `id` y
    `back` normalizado únicos, baraja los números 1–3 y coloca las manzanas en celdas
    libres (nunca encima de la serpiente ni entre sí) usando una lista de celdas libres;
    sin celdas suficientes devuelve `null` y la partida termina de forma segura.
  - La serpiente inicial mide 2 segmentos, está centrada y mira a la derecha.

### HU-4 — Movimiento, loop y pausa
**Como** jugador, **quiero** que la serpiente se mueva por pasos, dé la vuelta en los
bordes y se pause al cambiar de pestaña, **para** jugar con control y sin perder por
causas externas.

**Criterios de aceptación:**
- [ ] AC-8: Cada paso mueve la cabeza una celda en la dirección actual; los bordes
  envuelven (salir por un lado entra por el contrario). Se bloquea el giro de 180°
  respecto a la dirección aplicada. Si la cabeza ocupa una celda del cuerpo (sin contar
  la cola que se moverá salvo que coma), hay choque.
- [ ] AC-9: Se usa `createEngine` de `src/core/engine/engine.js` como único loop rAF.
  El componente acumula `dt` y despacha como máximo un paso por tick cuando se alcanza
  `stepMs`; no hay `setState` a 60 fps. Pausa manual y automática en
  `visibilitychange=hidden`; se conservan posición, vidas, serpiente, manzanas y el
  feedback pendiente. `engine.stop()` y `stopSpeech()` en cleanup; sin `setState` tras
  unmount. Con `prefers-reduced-motion: reduce` no hay animaciones decorativas (el paso
  sigue siendo discreto) y las reglas, velocidad y puntuación son idénticas.

### HU-5 — Comer, vidas, choque y calificación
**Como** aprendiz, **quiero** recibir feedback inmediato y que mis errores se reflejen
en el SRS, **para** corregir y repasar lo que fallo.

**Criterios de aceptación:**
- [ ] AC-10: Manzana correcta:
  - La serpiente crece 1 segmento.
  - La ronda se resuelve con `grade = wrongEats === 0 ? 'facil' : 'dificil'`.
  - En Rondas suma 100 puntos y racha +1; en Supervivencia la puntuación es la longitud.
  - Se muestra feedback ~1400 ms con «¡Correcto! La manzana N era «back»» y se lee el
    `back` por TTS.
  - Al terminar el feedback se pasa a la siguiente ronda o a `complete`.
- [ ] AC-11: Manzana incorrecta:
  - Resta 1 vida, alarga la serpiente 3 segmentos, elimina esa manzana del tablero y
    reinicia la racha.
  - Se muestra feedback «Incorrecto. La manzana N era «back»» y se lee el `back` por
    TTS; se continúa en la misma ronda.
  - Con 0 vidas la partida termina (`gameover`), la ronda actual se califica
    `otra-vez` y las cartas no mostradas no se califican.
- [ ] AC-12: Choque contra la propia serpiente:
  - Resta 1 vida y recoloca la serpiente en una posición segura cerca del centro con
    longitud 2, conservando la ronda, las manzanas y el progreso.
  - Si no hay posición segura o las vidas llegan a 0, la partida termina (`gameover`)
    con la ronda actual `otra-vez`.
  - El choque no convierte por sí solo la ronda en `dificil` (solo las manzanas
    incorrectas cuentan para el grado).
- [ ] AC-13: Calificación SRS:
  - Cada carta se califica como máximo una vez por sesión, con guard de secuencia
    (`seq`) y una única llamada a `onGrade(cardId, grade)`.
  - Al salir desde `playing` o `paused` con una ronda sin resolver se emite `otra-vez`
    solo para la carta actual; las futuras no se emiten.
  - Salir desde `resolved`, `complete`, `gameover` o `setup` no re-emite.
  - El juego no conoce SRS/XP/history; solo emite `onGrade`.

### HU-6 — Modos, puntuación y resumen
**Como** aprendiz, **quiero** que la partida tenga un final claro y un resumen útil,
**para** saber cómo me fue y volver a intentarlo.

**Criterios de aceptación:**
- [ ] AC-14: El HUD muestra modo, ronda actual (`Ronda X de N` o `Carta X de N`),
  vidas (corazones + texto `Vidas: X/5`), puntuación (`Puntos` en Rondas, `Longitud` en
  Supervivencia), racha, pausa, `SoundToggle` y «Salir».
- [ ] AC-15: Resumen:
  - En Rondas: puntos, aciertos, fallos, aciertos al primer intento, mejor racha,
    vidas restantes y XP local (`facil*10 + dificil*25`).
  - En Supervivencia: longitud final, aciertos, fallos, mejor racha y XP local.
  - Acciones «Jugar de nuevo» (vuelve al setup conservando modo/dificultad/rondas) y
    «Volver al tema».
  - `gameover` muestra «Partida terminada»; `complete` muestra «Sesión completada».
    Nada de esto se persiste desde el juego.

### HU-7 — TTS, accesibilidad y responsive
**Como** usuario con lector de pantalla, teclado o móvil, **quiero** jugar sin depender
del ratón, **para** que el juego sea inclusivo y usable en cualquier dispositivo.

**Criterios de aceptación:**
- [ ] AC-16: TTS con `src/core/audio/tts.js`:
  - Al iniciar cada ronda se lee el `front`; al comer cualquier manzana se lee su
    `back`; en choque y fin de partida se anuncia el evento.
  - 🔊 «Pregunta» repite el `front`; cada fila de la leyenda tiene 🔊 para repetir su
    `back`.
  - `<SoundToggle />` en setup, partida y resumen.
  - Sin `speechSynthesis`, los controles 🔊 se ocultan y el juego es 100% jugable.
  - Se respeta el mute de `sepect.settings.v1` y se llama `stopSpeech()` al pausar,
    salir y desmontar. El TTS nunca bloquea la interacción.
- [ ] AC-17: Accesibilidad:
  - Botones nativos con `type="button"`; Tab/Shift+Tab, Enter/Space.
  - Flechas y WASD mueven la serpiente en desktop; D-pad táctil de 4 botones ≥48 px en
    móvil (visible con CSS ≤767 px) con `aria-label` «Mover arriba/abajo/izquierda/
    derecha».
  - `aria-live="polite"` anuncia ronda, resultado, vidas y fin, sin mensajes obsoletos.
  - La leyenda es la representación accesible de las manzanas: número, significado
    completo y estado.
  - Foco visible (`--neon-green`), targets ≥44 px y estado por color + número + texto.
  - El tablero no captura el foco de forma obligatoria; los controles de pausa/salir
    siguen siendo alcanzables.
- [ ] AC-18: Responsive:
  - Tablero cuadrado, fluido y centrado, con tamaño máximo de 480 px en desktop.
  - A 360 px no hay scroll horizontal; la leyenda y el prompt hacen wrap completo.
  - El tablero no cambia de tamaño durante la partida al redimensionar; solo escala
    visualmente.

### HU-8 — Integración, aislamiento y calidad
**Como** mantenedor, **quiero** que el juego respete el contrato existente y no rompa
la arquitectura, **para** cerrar el catálogo sin regresiones.

**Criterios de aceptación:**
- [ ] AC-19: Aislamiento:
  - `serpiente-significados` no importa `storage|parser|content|router`, no usa
    `localStorage|indexedDB|fetch(` y no conoce SRS/XP/history.
  - Recibe `{ deck, selectCards?, onGrade, onExit }`.
  - La lógica pura no importa nada y no usa `Date`; `random` es inyectable.
  - `GameHost.jsx` y `src/core/**` no se modifican.
- [ ] AC-20: Integración con `GameHost`:
  - La selección usa `selectCards(cantidad)` (prioriza no aprendidas) con fallback a
    `deck`.
  - Los grados `facil`/`dificil`/`otra-vez` persisten SRS + XP + history y son idénticos
    tras remount.
  - Salir a mitad de ronda emite solo la carta actual como `otra-vez`.
  - Un tema con <4 cartas queda bloqueado por el gate existente.
- [ ] AC-21: `npm test` 100% pass, `npm run lint` 0 errors/warnings y `npm run build`
  OK. Docs actualizadas: `specs/roadmap-games.md` (serpiente available), 
  `docs/manual-a11y-checklist.md` (sección Serpiente de significados), `MEMORY.md`,
  `FOCUS.md` y `tasks.md` sincronizado con
  `specs/tasks-11-serpiente-significados.md`.

> Cada AC mapea a ≥1 test automatizado en §6. AC-17, AC-18 y AC-21 también usan
> checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: React + CSS + Web APIs. Sin canvas para el juego, sin
  p5, sin librerías de animación.
- **Contrato de juego congelado** (`specs/spec-02-topics-flashcards.md` §4):
  `{ deck, selectCards?, onGrade, onExit }`. Sin props nuevas ni cambios en
  `GameHost.jsx`.
- **SRS/XP/history solo en `GameHost`**: el juego emite `onGrade(cardId, grade)` y no
  persiste nada. Puntos, racha, vidas y longitud son estado efímero.
- **Lógica pura**: `serpiente-significados.logic.js` sin imports, sin DOM, sin `Date`,
  sin `localStorage`; `random` inyectable.
- **Un solo loop**: `createEngine`; el movimiento se actualiza por pasos discretos, no
  por setState a 60 fps.
- **Tablero DOM**: segmentos y manzanas posicionados por porcentajes; fondo de rejilla
  con CSS. Sin canvas ni p5.
- **Manzanas numeradas**: solo el número en el tablero; el `back` completo vive en la
  leyenda inferior. No se renderiza texto del significado sobre el tablero.
- **Imágenes**: `CardImage` solo como pista de la pregunta; las manzanas no llevan
  imagen ni texto.
- **Vidas**: 5; manzana incorrecta −1 y +3 segmentos; choque −1 y respawn con longitud
  2; 0 vidas → `gameover`.
- **Grados**: ronda sin manzanas incorrectas → `facil`; con ≥1 → `dificil`; ronda sin
  resolver al salir/perder → `otra-vez`. El choque no altera el grado.
- **Modos**: Rondas (4–10 default 8, puntos) y Supervivencia (máx. 20 cartas, longitud).
- **Dificultad**: solo velocidad y tamaño de tablero según viewport; no cambia reglas.
- **TTS**: wrapper compartido; `front` al iniciar, `back` al comer, botones manuales y
  toggle global.
- **Archivos permitidos**: `src/games/serpiente-significados/**`,
  `src/games/registry.js`, `src/games/registry.test.js`, `src/ui/tokens.css`,
  `src/views/TopicView.test.jsx`, `src/views/GameHost.test.jsx`,
  `specs/roadmap-games.md`, `docs/manual-a11y-checklist.md`, `MEMORY.md`, `FOCUS.md`,
  `tasks.md` y `specs/tasks-11-serpiente-significados.md`.
- **Sin cambios** en `src/core/**`, `src/views/GameHost.jsx`, `src/app/**`, router,
  parser, SRS, stats, deploy o PWA.
- UI strings en español; identificadores en inglés.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Tema con <4 cartas | Juego deshabilitado en TopicView; acceso directo muestra pantalla segura |
| Deck con <3 `back` únicos | Setup/sesión segura; sin crash |
| Carta con `id`/`front`/`back` vacío | Se filtra; si no quedan, estado seguro |
| `id` o `back` duplicado | Dedupe por `id` y por `back` normalizado (primera aparición) |
| Manzana generada sobre la serpiente | Imposible: se elige de celdas libres |
| Tablero sin celdas libres | `spawnRound` devuelve `null`; la partida termina de forma segura |
| Giro de 180° | Ignorado; se conserva la dirección aplicada |
| Dos teclas entre pasos | La última dirección válida respecto a la aplicada gana |
| Choque con la cola | Permitido si la cola se mueve (no hay crecimiento) |
| Choque con el cuerpo | −1 vida y respawn; 0 vidas → gameover |
| Manzana incorrecta dos veces en la misma ronda | `dificil`; cada una resta vida |
| Última manzana incorrecta con 1 vida | Gameover; ronda actual `otra-vez` |
| Salir en pausa/feedback | Solo la carta actual si no está resuelta |
| Salir tras acertar | Sin re-emisión |
| Pausa durante feedback | Se congela el temporizador de feedback |
| Pestaña oculta | Auto-pausa + overlay al volver |
| Resize/orientación | El tablero escala; no cambia `boardSize` ni reinicia la partida |
| Viewport 360 px | Sin scroll horizontal; leyenda y prompt con wrap; targets ≥44 px |
| Navegador sin `speechSynthesis` | Controles 🔊 ocultos; juego 100% jugable |
| Sonido silenciado | `speak()` no encola; el juego sigue |
| `prefers-reduced-motion` | Sin animaciones decorativas; mismas reglas y velocidad |
| Desmontaje con loop/TTS | `engine.stop()` + `stopSpeech()`; sin setState tras unmount |
| localStorage corrupto | Fallback existente `{ muted:false }`; sin persistencia nueva |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  buildSession({ cards: 8 válidas, deck: 8, mode:'rounds', rounds:10,
                         difficulty:'normal', viewport:'desktop', random: fijo })
SALIDA:   total 8, boardSize 20, stepMs 250, fase de sesión válida

ENTRADA:  buildSession({ cards: 3, deck: 3, mode:'rounds', rounds:8, ... })
SALIDA:   sesión vacía segura (no hay 3 backs únicos)

ENTRADA:  buildSession({ cards: 25, mode:'survival', ... })
SALIDA:   total 20 (MAX_SURVIVAL_CARDS)

ENTRADA:  buildSession({ cards: 4, difficulty:'arcade', viewport:'mobile', ... })
SALIDA:   boardSize 17, stepMs 180; viewport desktop → boardSize 20

ENTRADA:  spawnRound({ card, deck: 6, snake, boardSize: 15, random: fijo })
SALIDA:   3 manzanas con números 1..3, una correcta, backs normalizados únicos,
          posiciones libres, determinista con el mismo random

ENTRADA:  spawnRound con tablero lleno (sin celdas libres)
SALIDA:   null; el reducer termina la partida de forma segura

ENTRADA:  reduce(playing, { type:'direction', direction:'LEFT' } mientras RIGHT )
SALIDA:   mismo estado (180° bloqueado); 'UP' se aplica en el siguiente paso

ENTRADA:  reduce(playing, { type:'step' }) con cabeza en el borde derecho
SALIDA:   cabeza en x=0 (wrap); la cola se mueve si no come

ENTRADA:  reduce(playing, { type:'step' }) con cabeza sobre la manzana correcta
SALIDA:   phase 'resolved', grade 'facil' (sin fallos), +100 en Rondas,
          lastGrade.seq 1, feedback.type 'correct', longitud +1

ENTRADA:  reduce(playing, { type:'step' }) con 1 manzana incorrecta previa y luego
          la correcta
SALIDA:   grade 'dificil', +100 en Rondas, ronda resuelta

ENTRADA:  reduce(playing, { type:'step' }) sobre manzana incorrecta
SALIDA:   lives 4, longitud +3, manzana eliminada, wrongEats 1, feedback 'wrong',
          fase 'playing' (si quedan vidas)

ENTRADA:  reduce(playing, { type:'step' }) con choque propio y 2 vidas
SALIDA:   lives 1, serpiente recolocada en 2 segmentos, misma ronda y manzanas

ENTRADA:  reduce(playing, { type:'step' }) con 1 vida y choque/manzana incorrecta
SALIDA:   phase 'gameover', ronda actual `otra-vez`, cartas futuras sin calificar

ENTRADA:  reduce(resolved, { type:'next' }) en la última ronda
SALIDA:   phase 'complete', sin pendientes

ENTRADA:  pendingCurrent(playing con ronda 2 sin resolver)
SALIDA:   [{ cardId: <carta 2>, grade:'otra-vez' }] (solo la actual)

ENTRADA:  summarize(estado con 3 aciertos, 2 fallos, mejor racha 2, modo rounds)
SALIDA:   { hits:3, fails:2, firstTry:<n>, score:<puntos>, bestStreak:2,
           length:<n>, xp:<facil*10+dificil*25> }

ENTRADA:  render setup con deck de 8 y selectCards mock
SALIDA:   modos Rondas/Supervivencia, dificultad 3 opciones, rondas 4–10 default 8;
          Empezar llama selectCards(8); en Supervivencia selectCards(8) y sin selector

ENTRADA:  render partida con 3 manzanas
SALIDA:   tablero con números 1..3 (sin backs), leyenda con 3 filas número→back,
          botones 🔊 por fila, pregunta + CardImage arriba

ENTRADA:  render sin speechSynthesis / muted=true
SALIDA:   controles 🔊 ocultos / speak no encola; juego jugable

ERROR ESPERADO: ninguno lanzado a la UI; deck/backs insuficientes → pantalla segura;
                aislamiento: cero imports de storage|parser|content|router
```

Además:
- UI: inicio con `selectCards`, acierto/fallo/choque simulando ticks, pausa,
  reanudación, gameover, complete, replay y salida.
- A11y: `aria-live` sin stale, foco, labels, D-pad, targets, reduced motion, wrap de
  textos largos.
- Integración `GameHost.test.jsx`: SRS+XP+history para `facil`, `dificil` y `otra-vez`,
  estabilidad tras remount, salida mid-ronda y `selectCards` no aprendidas primero.
- Registry: 8 available / 2 soon, `load()` de serpiente resuelve.

---

## 📂 Fuera de alcance (Out of scope)

- Multijugador, leaderboards, SFX, música o nuevas dependencias.
- Persistencia de puntos/racha/vidas fuera de la sesión; solo SRS/XP/history vía
  `GameHost`.
- Canvas, p5.js, drag & drop, swipe gestures o controles por voz.
- Cambios en `GameHost.jsx`, `src/core/**`, router, parser, SRS, stats, deploy o PWA.
- Implementar `sopa-de-letras` o `caza-significados`.
- Reglas nuevas de disponibilidad más allá de `minCards: 4`.
- Ciclos infinitos del mazo en Supervivencia: el mazo se recorre una vez.

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-20**.
- Decisiones firmadas: 5 vidas; choque resta vida y reaparece (no termina de golpe);
  modos Rondas (4–10 default 8, puntos) y Supervivencia (hasta 20 cartas, longitud);
  tableros 13/15/17 en móvil y 15/20/20 en desktop; D-pad en móvil y teclado en
  desktop; manzanas solo con número 1–3 y leyenda número→significado; TTS del
  significado al comer; `minCards:4`; sin cambios en `GameHost` ni en el núcleo.
