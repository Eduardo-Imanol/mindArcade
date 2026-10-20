---
feature: conecta-pares
status: approved
owner: Eduardo
created: 2026-10-19
updated: 2026-10-19
related_tasks: tasks.md (spec-10 — approved 2026-10-19)
---

# Spec — Conecta pregunta–significado (spec-10)

> [!abstract] Resumen
> Noveno juego del catálogo (ID estable `conecta-pares`): «Conecta pregunta–significado».
> El tablero muestra dos columnas con hasta **10 preguntas (`front`) y 10 significados
> (`back`)**; el jugador toca una tarjeta de cualquier columna y luego su pareja en la
> contraria. Los pares resueltos se unen con una línea SVG y reciben un color/número.
> Es el **único juego sin imágenes**: no usa `CardImage`, `<img>`, canvas ni arte
> generativo. TTS obligatorio, SRS vía `onGrade`, sin dependencias nuevas y sin tocar
> el núcleo ni `GameHost`.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (juego + lógica pura + SVG + TTS + a11y + SRS + docs) |
| Fecha | 2026-10-19 |
| Revisada por | Eduardo — 2026-10-19 |

---

## 📖 Historias de usuario

### HU-1 — Disponible con al menos 3 pares
**Como** aprendiz, **quiero** jugar con cualquier tema que tenga al menos 3 cartas,
**para** practicar preguntas y significados emparejándolos sin sets degenerados.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('conecta-pares')` devuelve `status:'available'`, `minCards:3` y
  `load: () => import('./conecta-pares/index.jsx')`; el título visible es
  «Conecta pregunta–significado» y la descripción «Une cada pregunta con su significado
  tocando ambas columnas». El catálogo queda en **7 available / 3 soon**, los otros IDs
  no cambian, el orden se conserva y `load()` resuelve un componente por defecto.
- [ ] AC-2: `TopicView` habilita el juego con temas de ≥3 cartas usando el helper
  existente `getGameAvailability`; con menos cartas muestra «Necesitas al menos 3 cartas».
  `GameHost` aplica el mismo gate en acceso directo por URL y muestra pantalla segura.
- [ ] AC-3: El setup ofrece un selector de pares de **3 a min(10, pares únicos
  disponibles)**, con default **min(8, disponibles)**. Al empezar se llama
  `selectCards(cantidad)`; sin `selectCards` se usa `deck.slice(0, cantidad)`. La sesión
  usa como máximo los pares únicos devueltos. Si hay menos de 3 pares únicos válidos,
  se muestra un estado seguro y no se inicia la partida.
- [ ] AC-4: El setup muestra el número de pares disponibles, el selector, `SoundToggle`,
  «Empezar» y «Salir». Los textos de UI están en español y no se renderiza ninguna
  imagen, ni siquiera si las cartas traen `image`.

### HU-2 — Tablero de dos columnas
**Como** aprendiz, **quiero** ver todas las preguntas y significados a la vez,
**para** conectar cada pregunta con su significado sin pasos intermedios.

**Criterios de aceptación:**
- [ ] AC-5: `buildSession({ cards, count, random })` es puro y determinista:
  - Filtra cartas sin `id`, `front` o `back` no vacíos.
  - Deduplica por `front` normalizado y por `back` normalizado (gana la primera
    aparición); evita preguntas o significados repetidos en el tablero.
  - Acepta `count` 3–10; valores inválidos → `DEFAULT_PAIRS=8`; `total = min(count,
    cartas únicas)`.
  - `left` y `right` contienen las mismas cartas barajadas de forma independiente con
    `random` inyectable (default `Math.random`); cada id aparece una vez por columna.
  - Con menos de 3 cartas únicas devuelve una sesión vacía segura.
- [ ] AC-6: La partida muestra dos columnas etiquetadas «Preguntas» y «Significados»,
  con `front` a la izquierda y `back` a la derecha. No se importa `CardImage` ni se
  renderiza `<img>`, `<canvas>` o p5. El texto completo se muestra con
  `overflow-wrap:anywhere` y `hyphens:auto`, sin ellipsis ni truncado. A 360px no hay
  scroll horizontal, las dos columnas siguen visibles y cada tarjeta tiene un target
  ≥44px.
- [ ] AC-7: La selección funciona desde cualquier columna:
  - Primer clic → selecciona la tarjeta y la marca con `aria-pressed="true"`.
  - Clic en la misma tarjeta → deselecciona.
  - Clic en otra tarjeta de la misma columna → reemplaza la selección.
  - Clic en una tarjeta de la columna contraria → resuelve el par.
  - `Escape` limpia la selección. Las tarjetas ya emparejadas quedan deshabilitadas y
    no se pueden seleccionar.

### HU-3 — Aciertos, errores, líneas y cierre
**Como** aprendiz, **quiero** feedback inmediato y ver las conexiones que ya resolví,
**para** corregir mis errores y saber cuánto me falta.

**Criterios de aceptación:**
- [ ] AC-8: Par correcto: ambas tarjetas se bloquean, el par recibe un orden de acierto
  1..N y un color/número único, se dibuja una línea SVG entre ambas y se anuncia el
  acierto. Un par no puede resolverse dos veces. Al emparejar el último par, la fase
  pasa a `complete`.
- [ ] AC-9: Par incorrecto: se incrementa `errors`, se incrementa el fallo de la carta
  de la columna de preguntas implicada, ambas tarjetas muestran estado de error, no se
  dibuja línea, la selección se limpia y ambas tarjetas siguen disponibles para
  reintentar. El feedback de error permanece hasta la siguiente selección o acción; no
  usa timers. El fallo se atribuye siempre a la pregunta, aunque la selección haya
  empezado por el significado.
- [ ] AC-10: Conexiones visuales: una línea SVG por par emparejado entre el borde
  derecho de la pregunta y el borde izquierdo del significado, con color y número de
  par únicos (paleta de 10). El SVG es `aria-hidden="true"` y `pointer-events:none`.
  Las coordenadas se recalculan al emparejar, redimensionar, cambiar orientación,
  cargar fuentes y reflow del tablero (`ResizeObserver`), sin loops rAF ni estado a
  60fps. Las líneas aparecen de forma estática y con `prefers-reduced-motion` no hay
  animación. El color se usa solo en borde, línea y badge; el texto conserva contraste.
- [ ] AC-11: Calificación SRS: al emparejar, `grade = attemptsByCard[cardId] === 0 ?
  'facil' : 'dificil'` y se emite `onGrade(cardId, grade)` exactamente una vez. Al salir
  desde `playing`, cada carta no emparejada emite `otra-vez` exactamente una vez; las
  emparejadas no se re-emiten. Salir desde `setup` o `complete` no emite nada. Un guard
  de secuencia evita duplicados y una carta solo recibe una calificación por sesión.
- [ ] AC-12: Al completar se muestra un resumen con pares emparejados, errores, pares
  acertados al primer intento y XP local (`facil*10 + dificil*25`). Acciones «Jugar de
  nuevo» (vuelve al setup con el último número de pares) y «Volver al tema». Nada de
  esto se persiste desde el juego.
- [ ] AC-13: La partida no tiene temporizador, ni vidas, ni pausa, ni loop de animación.
  No se usa `createEngine`. El progreso depende exclusivamente de las conexiones.

### HU-4 — TTS y accesibilidad
**Como** usuario con lector de pantalla o teclado, **quiero** jugar sin depender del
ratón ni de la vista, **para** que el juego sea inclusivo y mantenible.

**Criterios de aceptación:**
- [ ] AC-14: TTS con `src/core/audio/tts.js`:
  - Al seleccionar una pregunta se lee su `front`; al seleccionar un significado, su
    `back`; al acertar se lee `«front». «back»`.
  - La barra de selección muestra el texto activo y un botón 🔊 para repetirlo.
  - `<SoundToggle />` en setup, partida y resumen.
  - Sin `speechSynthesis`, los controles 🔊 se ocultan y el juego es 100% jugable.
  - Se respeta el mute de `sepect.settings.v1` y se llama `stopSpeech()` al salir y al
    desmontar. El TTS nunca bloquea la interacción.
- [ ] AC-15: Accesibilidad:
  - Botones nativos con `type="button"`, Tab/Shift+Tab, Enter/Space y `Escape`.
  - `aria-pressed` en tarjetas seleccionadas; columnas con `aria-label`; cada tarjeta
    con `aria-label` «Pregunta N de M: <front>» o «Significado N de M: <back>», más
    «conectada con el par K» cuando corresponde.
  - `aria-live="polite"` anuncia selección, acierto, error y fin, sin mensajes obsoletos.
  - Al emparejar, el foco se mueve a la siguiente pregunta no emparejada; al completar,
    al encabezado del resumen. Sin pérdida de foco al deshabilitar tarjetas.
  - Foco visible con `--neon-green`, targets ≥44px y estado de acierto/error transmitido
    por color + número + texto, nunca solo por color.
- [ ] AC-16: Con `prefers-reduced-motion: reduce` no hay animaciones de línea, shake ni
  transiciones decorativas; las reglas, el orden y la puntuación son idénticos.

### HU-5 — Integración, aislamiento y calidad
**Como** mantenedor, **quiero** que el juego respete el contrato existente y no rompa
la arquitectura, **para** cerrar el incremento sin regresiones.

**Criterios de aceptación:**
- [ ] AC-17: Aislamiento: `conecta-pares` no importa `storage|parser|content|router`,
  no usa `localStorage|indexedDB|fetch(`, no importa `CardImage` y no renderiza imágenes.
  Recibe `{ deck, selectCards?, onGrade, onExit }`; no conoce SRS/XP/history. La lógica
  pura no importa nada. `GameHost.jsx` y `src/core/**` no se modifican.
- [ ] AC-18: Integración con `GameHost`: la selección de cartas usa `selectCards(cantidad)`
  (prioriza no aprendidas) con fallback a `deck`. Los aciertos `facil`/`dificil` y las
  salidas con `otra-vez` persisten SRS + XP + history y son idénticos tras remount.
  Un tema con <3 cartas queda bloqueado por el gate existente.
- [ ] AC-19: `npm test` 100% pass, `npm run lint` 0 errors/warnings y `npm run build`
  OK. Docs actualizadas: `specs/roadmap-games.md` (conecta available, excepción de
  imágenes y TTS de elemento activo), `docs/manual-a11y-checklist.md`, `MEMORY.md`,
  `FOCUS.md` y `tasks.md` sincronizado con `specs/tasks-10-conecta-pares.md`.

> Cada AC mapea a ≥1 test automatizado en §6. AC-10, AC-15 y AC-19 también usan
> checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: React + CSS + Web APIs. Sin librerías de drag & drop,
  animación, canvas o p5.
- **Contrato de juego congelado** (`specs/spec-02-topics-flashcards.md` §4):
  `{ deck, selectCards?, onGrade, onExit }`. No se necesitan props nuevas ni cambios en
  `GameHost.jsx`.
- **SRS/XP/history solo en `GameHost`**: el juego emite `onGrade(cardId, grade)` y no
  persiste nada. El resumen y el XP local son estado efímero.
- **Lógica pura**: `conecta-pares.logic.js` sin imports, sin DOM, sin `Date`, sin
  `localStorage`; `random` inyectable.
- **Sin imágenes**: único juego exento de `CardImage`. Las líneas SVG son decorativas,
  no arte de carta. La regla de `specs/roadmap-games.md` se actualiza con esta excepción.
- **Selección bidireccional**: cualquier columna puede iniciar el par. El fallo se
  atribuye a la carta de pregunta implicada.
- **Pares**: 3–10, default 8 (o el máximo disponible). `minCards: 3` en el registry.
- **Colores**: paleta de 10 colores; el orden de acierto asigna color y número. El color
  nunca es el único indicador de estado.
- **Líneas**: SVG absoluto sobre el tablero, sin loops rAF; recálculo por eventos y
  `ResizeObserver`. `aria-hidden` y `pointer-events:none`.
- **TTS**: lectura al seleccionar + repetición del elemento activo. No se añaden 20
  botones de audio; la interpretación de «botón por elemento» se documenta en el
  roadmap como «botón del elemento activo».
- **Sin timer**: no hay pausa ni loop; no se usa `createEngine`.
- **Archivos permitidos**: `src/games/conecta-pares/**`, `src/games/registry.js`,
  `src/games/registry.test.js`, `src/ui/tokens.css`, `src/views/TopicView.test.jsx`,
  `src/views/GameHost.test.jsx`, `specs/roadmap-games.md`,
  `docs/manual-a11y-checklist.md`, `MEMORY.md`, `FOCUS.md`, `tasks.md` y
  `specs/tasks-10-conecta-pares.md`.
- **Sin cambios** en `src/core/**`, `src/views/GameHost.jsx`, `src/app/**`, router,
  parser, SRS, stats, deploy o PWA.
- UI strings en español; identificadores en inglés.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Tema con <3 cartas | Juego deshabilitado en TopicView; acceso directo muestra pantalla segura |
| `selectCards` devuelve menos de lo pedido | Se usan los pares únicos devueltos; si son <3, estado seguro |
| Menos de 3 pares únicos tras deduplicar | Setup seguro; no se inicia la partida |
| Cartas con `id`/`front`/`back` vacío | Se filtran; si no quedan 3, estado seguro |
| `front` o `back` duplicado | Se deduplica por texto normalizado; gana la primera aparición |
| `front` y `back` idénticos en una carta | Permitido; el par es trivial pero válido |
| `count` inválido o fuera de rango | Se normaliza a 3–10; default 8 |
| Carta con `image` | Se ignora; el juego no renderiza imágenes |
| Texto de pregunta o significado muy largo | Wrap completo, sin ellipsis; el tablero crece verticalmente |
| URL o cadena sin espacios | Wrap con `overflow-wrap:anywhere`; sin scroll horizontal |
| 10 pares en 360px | Dos columnas, targets ≥44px, página con scroll vertical, sin scroll horizontal |
| Clic en tarjeta ya emparejada | Ignorado; la tarjeta está deshabilitada |
| Clic doble o clicks rápidos | Guardas de fase/estado; una sola resolución y una sola emisión |
| Selección pregunta → significado incorrecto | Error rojo, `errors+1`, fallo de la pregunta, sin línea, reintento permitido |
| Selección significado → pregunta incorrecta | Igual; el fallo se atribuye a la pregunta implicada |
| Varios errores en la misma pregunta y luego acierto | Un solo `onGrade` con `dificil`; el contador de errores es local |
| Pregunta con 0 fallos y acierto | `facil` |
| Salir a mitad de partida | Solo las cartas no emparejadas emiten `otra-vez` |
| Salir tras completar | Sin emisiones pendientes |
| Salir desde setup | Sin emisiones |
| Jugar de nuevo | Reset de estado y guards; vuelve al setup con el último count |
| Sin `speechSynthesis` | Controles 🔊 ocultos; juego 100% jugable |
| Sonido silenciado | `speak()` no encola; el juego sigue |
| `prefers-reduced-motion` | Sin animaciones; líneas estáticas; mismas reglas |
| Redimensionar u orientar | Se recalculan las líneas; no se pierde el estado ni los pares |
| Fuentes tardías o reflow | `ResizeObserver`/`fonts.ready` recalcula las líneas |
| Foco en tarjeta que se deshabilita al emparejar | Se mueve a la siguiente pregunta no emparejada |
| Desmontaje con TTS activo | `stopSpeech()`; sin setState tras unmount |
| localStorage corrupto | El fallback de `SoundToggle`/settings existente sigue vigente |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  buildSession({ cards: 8 válidas, count: 8, random: fijo })
SALIDA:   total 8; left/right con los mismos ids, barajados de forma independiente,
          sin duplicados; determinista con el mismo random

ENTRADA:  buildSession({ cards: 10 con 2 backs duplicados, count: 10, random: fijo })
SALIDA:   total 8 (deduplicado); sin backs repetidos; left/right coherentes

ENTRADA:  buildSession({ cards: 3 válidas, count: 10, random: fijo })
SALIDA:   total 3 (clamp a disponibles)

ENTRADA:  buildSession({ cards: 2 válidas, count: 3, random: fijo })
SALIDA:   sesión vacía segura; la UI no inicia partida

ENTRADA:  reduce(playing, { type:'select', side:'question', cardId:'q1' })
SALIDA:   selection { side:'question', cardId:'q1' }

ENTRADA:  reduce(playing, { type:'select', side:'meaning', cardId:'q1' })
SALIDA:   par correcto; matched+1; grade 'facil'; feedback 'correct';
          línea/orden asignados; selección limpia

ENTRADA:  reduce(playing, { type:'select', side:'meaning', cardId:'q2' })
          con q1 seleccionada
SALIDA:   par incorrecto; errors+1; attemptsByCard['q1']+1; feedback 'wrong';
          sin línea; selección limpia; ambas tarjetas disponibles

ENTRADA:  reduce(playing, { type:'select', ... misma tarjeta ... })
SALIDA:   selección limpia (toggle)

ENTRADA:  reduce(playing, { type:'select', ... misma columna, otra tarjeta ... })
SALIDA:   la selección se reemplaza por la nueva tarjeta

ENTRADA:  reduce(..., { type:'select', ... tarjeta ya emparejada ... })
SALIDA:   mismo estado; sin cambios

ENTRADA:  reduce(playing con 1 error en q1, seleccionar q1 + su significado)
SALIDA:   matched+1; grade 'dificil'; un solo resultado para q1

ENTRADA:  completar todos los pares
SALIDA:   phase 'complete'; pendingGrades []

ENTRADA:  pendingGrades(playing con 8 pares y 5 emparejados)
SALIDA:   3 entradas { cardId, grade:'otra-vez' }; las 5 emparejadas no aparecen

ENTRADA:  pendingGrades(setup) / pendingGrades(complete)
SALIDA:   []

ENTRADA:  summarize(8 pares, 5 facil, 2 dificil, 3 errores)
SALIDA:   { total:8, matched:7, errors:3, firstTry:5, xp:100 }

ENTRADA:  render setup con deck de 8 y selectCards mock
SALIDA:   selector 3–8 default 8; Empezar llama selectCards(8);
          SoundToggle visible; sin imágenes

ENTRADA:  render tablero con 8 pares
SALIDA:   dos columnas etiquetadas; 8 preguntas + 8 significados;
          sin <img>, <canvas>, CardImage ni p5; botones ≥44px; sin ellipsis

ENTRADA:  render tras emparejar 2 pares
SALIDA:   2 líneas SVG con color/número; SVG aria-hidden; tarjetas deshabilitadas;
          foco en la siguiente pregunta no emparejada

ENTRADA:  render sin speechSynthesis / muted=true
SALIDA:   controles 🔊 ocultos / speak no encola; juego jugable

ERROR ESPERADO: ninguno lanzado a la UI; datos insuficientes → pantalla segura;
                aislamiento: cero imports de storage|parser|content|router,
                cero CardImage/img/canvas/p5 y cero localStorage/indexedDB/fetch
```

Además:
- UI: selección bidireccional, toggle, reemplazo, error + reintento, acierto, completo,
  resumen, replay, salida con pendientes, sin emisiones duplicadas.
- A11y: labels por columna/posición, `aria-pressed`, `aria-live` sin stale, foco tras
  emparejar/completar, teclado completo, reduced motion, ausencia de scroll horizontal.
- Líneas: se generan por par, se recalculan con resize y no capturan punteros.
- Registry: 7 available / 3 soon; conecta `available` con `minCards:3` y `load()`.
- Integración `GameHost.test.jsx`: SRS + XP + history para `facil`, `dificil` y
  `otra-vez`, estabilidad tras remount, `selectCards` y gate con <3 cartas.

---

## 📂 Fuera de alcance (Out of scope)

- Multijugador, turnos, puntuación comparativa o leaderboards.
- Drag & drop real; la conexión es por clic/tap.
- Temporizador, vidas, pausa, niveles de dificultad o selector de distractores.
- Imágenes, `CardImage`, canvas, p5.js, SFX, música o assets.
- Persistencia de puntos/racha fuera de la sesión; solo SRS/XP/history vía `GameHost`.
- Cambios en `GameHost.jsx`, `src/core/**`, router, parser, SRS, stats, deploy o PWA.
- Implementar otros juegos (`sopa-de-letras`, `caza-significados`, etc.).
- Reglas nuevas de disponibilidad más allá de `minCards: 3`.

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-19**.
- Decisiones firmadas: selector de pares 3–10 con default 8; selección desde cualquier
  columna; error rojo con fallo SRS de la pregunta; líneas SVG con color/número por par;
  TTS al seleccionar + botón repetir del elemento activo; sin imágenes; `minCards: 3`;
  sin cambios en `GameHost` ni en el núcleo.
