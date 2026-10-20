---
feature: quiz-significado
status: approved
owner: Eduardo
created: 2026-10-19
updated: 2026-10-19
related_tasks: tasks.md (spec-06 — approved)
---

# Spec — Elige el significado + rondas SRS + opciones 2×2 + TTS (spec-06)

> [!abstract] Resumen
> Quinto juego del arcade (ID estable `quiz-significado`): «Elige el significado».
> Cada ronda muestra la pregunta (`front`) en la parte superior y cuatro cartas de
> significado (`back`) en una cuadrícula 2×2, cada una con su `CardImage`. Una es la
> respuesta correcta y tres son distractores sacados del deck completo del tema.
> El jugador tiene dos intentos; el grado SRS se decide por el intento en que acierta.
> Las preguntas salen de cartas no vistas/no aprendidas vía `selectCards(count)`.
> TTS obligatorio (Web Speech API). Inspirado en «Choose the Word» / «Quiz» de
> VocaPlayLand, adaptado a término → significado.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (juego + SRS + TTS + a11y + docs) |
| Fecha | 2026-10-19 |
| Revisada por | Eduardo — 2026-10-19 |

---

## 📖 Historias de usuario

### HU-1 — Sesión de preguntas con cartas no aprendidas
**Como** aprendiz, **quiero** elegir cuántas preguntas jugar y que salgan de las cartas
que aún no domino, **para** repasar justo lo que me falta.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('quiz-significado').status === 'available'` con `load()` dinámico y `minCards: 4`; `TopicView` lo habilita con ≥4 cartas; el resto del catálogo intacto (`registry.test.js`: 4 `available`, 6 `soon`, catálogo = 10, `load()` resuelve `{ default: Component }`).
- [ ] AC-2: Pantalla de setup con selector nativo de rondas 3–10 (default 10); al confirmar se invoca `selectCards(rondas)` (prop opcional construida por GameHost con `selectDueCards`); preguntas reales = `min(pedido, cartas devueltas)`; la sesión dura exactamente esas preguntas; «Jugar de nuevo» vuelve al setup.
- [ ] AC-3: La selección prioriza **no vistas/no aprendidas** (sin estado SRS o `reps < 3`) en orden aleatorio con `random` inyectable; si el pool no alcanza, rellena con aprendidas por `nextReview` ascendente (comportamiento ya firmado en spec-03 AC-3, sin cambios de núcleo). Deck < 4 cartas → juego deshabilitado en `TopicView` por `minCards` (sin cambios de código).

### HU-2 — Ronda: pregunta arriba y cuatro significados abajo
**Como** aprendiz, **quiero** ver el término/pregunta arriba y cuatro cartas de significado
con imagen abajo en 2×2, **para** elegir la definición correcta de forma visual y táctil.

**Criterios de aceptación:**
- [ ] AC-4: Cada ronda muestra en la parte superior el `front` de la carta como pregunta (solo texto, **sin** `CardImage` arriba) + botón 🔊; debajo, una cuadrícula 2×2 con exactamente 4 cartas de opción cuando el deck lo permite: 1 correcta (`back` de la carta de la ronda) + 3 distractores (`back` de otras cartas del **deck completo**), barajadas con `random` inyectable. Cada opción renderiza `CardImage` (decorativa, `alt=""`) + texto del `back`.
- [ ] AC-5: Los distractores nunca repiten el `back` de la correcta ni entre sí (comparación normalizada: trim + NFD sin diacríticos + minúsculas); se excluye la carta correcta por `id`. Si el tema no tiene 3 significados distintos, se usan los únicos disponibles (2–4 opciones), se mantiene jugable y nunca se lanza error. Las opciones siempre provienen del deck recibido, nunca de datos inventados.

### HU-3 — Intentos, grades y cierre de sesión
**Como** aprendiz, **quiero** tener un segundo intento y saber cómo se actualiza mi repaso,
**para** aprender del error sin que un despiste marque la tarjeta como fallada para siempre.

**Criterios de aceptación:**
- [ ] AC-6: Dos intentos por ronda: acierto al **1.er intento → `facil`**; fallo y acierto al **2.º intento → `dificil`**; **2 fallos → `otra-vez`**. Al resolver se emite `onGrade(cardId, grade)` exactamente una vez (seq monótono); GameHost persiste SRS + XP + history con el mapeo existente (facil +10, dificil +25, otra-vez 0) e idéntico tras reload simulado (test de integración).
- [ ] AC-7: Feedback por ronda: opción incorrecta → rojo, deshabilitada y queda 1 intento; acierto → verde; al resolver (acierto o 2.º fallo) se resalta la correcta en verde, se deshabilitan todas las opciones y aparece «Siguiente». En la última ronda → resumen (aciertos/total, fallos, XP) con «Jugar de nuevo» y «Volver al tema». Salir a mitad de sesión → `pendingGrades(state)` emite `otra-vez` para las rondas sin resolver (las ya resueltas no se re-emiten), luego `onExit()`.

### HU-4 — TTS obligatorio
**Como** aprendiz, **quiero** oír la pregunta y los significados, **para** reforzar la
asociación término–definición sin depender de la lectura visual.

**Criterios de aceptación:**
- [ ] AC-8: TTS con `src/core/audio/tts.js`: al iniciar cada ronda (tras gesto del usuario) se lee el `front` automáticamente; botón 🔊 en la pregunta para repetir; al pulsar una opción se lee su `back`; en el feedback hay «🔊 Respuesta» para oír el `back` correcto; `<SoundToggle />` global en setup, ronda y resumen. Sin `speechSynthesis` → todos los controles 🔊 se ocultan y el juego es 100% jugable. `stopSpeech()` al desmontar.

### HU-5 — Accesibilidad, aislamiento y calidad
**Como** usuario de teclado/lector de pantalla y mantenedor, **quiero** un juego completo,
documentado y sin regresiones, **para** que el arcade crezca sostenible.

**Criterios de aceptación:**
- [ ] AC-9: Teclado completo (Tab/Shift+Tab/Enter/Space) sobre selector, opciones, 🔊, «Siguiente», «Salir» y resumen; botones nativos con `type="button"`; `aria-label` por opción («Opción N: <significado>»); `aria-live="polite"` anuncia acierto/fallo/intentos restantes y respuesta correcta sin repetir mensajes obsoletos; focus visible (`--neon-green`); targets ≥44px; 2×2 sin scroll horizontal a 360px; textos largos envuelven sin truncarse; `prefers-reduced-motion` → sin animaciones.
- [ ] AC-10: Aislamiento: el módulo `quiz-significado` no importa `storage|parser|content|router` (test regex) ni usa `localStorage|indexedDB|fetch(`; cumple el contrato congelado de props `{ deck, onGrade, onExit, selectCards? }`; el SRS/XP/history vive únicamente en GameHost; sin cambios en `GameHost.jsx`.
- [ ] AC-11: Docs actualizadas: `specs/roadmap-games.md` → `quiz-significado` spec-06 aprobada; `docs/manual-a11y-checklist.md` con sección «Elige el significado»; `MEMORY.md` y `FOCUS.md` con las decisiones de spec-06.
- [ ] AC-12: `npm test` 100% pass, `npm run lint` 0 errors/warnings y `npm run build` OK en los archivos enviados.

> Cada AC mapea a ≥1 test automatizado en §6. AC-9 también usa checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: grid 2×2 con CSS (`display:grid; grid-template-columns: repeat(2, minmax(0,1fr))`), animaciones CSS mínimas (solo transform/opacity) o ninguna. TTS = `window.speechSynthesis` nativo.
- **Contrato de juego congelado (spec-02 §4) se extiende solo de forma aditiva**: props `{ deck, onGrade, onExit, selectCards? }`; el juego pide sus preguntas con `selectCards(count)`. El SRS/XP/history vive únicamente en GameHost (patrón spec-03/spec-04, `GameHost.jsx` sin cambios).
- **Selección con SRS**: sin núcleo nuevo — reutiliza `selectDueCards(cards, srs, { count, random })` (LEARNED_REPS = 3) tal cual.
- **Distractores del deck completo**: las preguntas se seleccionan con `selectCards`, pero los significados distractores salen del `deck` completo (recibido del host, con overrides de imagen ya aplicados) para que cualquier tema tenga 4 opciones. Se deduplican por `back` normalizado y se excluye la carta correcta por `id`.
- **Layout firmado**: pregunta = solo `front` (sin imagen superior); opciones = `CardImage` + `back` en 2×2. La imagen de la opción correcta coincide con la del término preguntado y se acepta como pista visual intencional; el `alt` de las imágenes de opción es vacío/decorativo para no duplicar el nombre accesible.
- **Grades firmados**: 1.er intento → `facil`; 2.º intento → `dificil`; 2 fallos → `otra-vez` con la correcta revelada. Mapeo XP existente sin cambios.
- **Rondas firmadas**: selector 3–10, default 10; una carta por ronda; `random` inyectable para tests deterministas.
- **TTS**: wrapper puro `src/core/audio/tts.js`; lectura tras gesto del usuario (autoplay); botón 🔊 por pregunta, lectura de la opción pulsada y de la respuesta correcta; toggle global persistido en `sepect.settings.v1`.
- **Juego 1 jugador** (VocaPlayLand sirve solo como referencia de mecánica/layout).
- Aislamiento de juegos y reglas de `docs/architecture.md` / `docs/testing.md` siguen vigentes; UI strings en español, identificadores en inglés.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Rondas pedidas > cartas disponibles | Preguntas reales = `min(pedido, devueltas)`; nunca crashea |
| Pool de no aprendidas vacío | `selectDueCards` rellena con aprendidas por `nextReview` asc (backfill firmado) |
| Deck < 4 cartas | Juego deshabilitado en TopicView (`minCards: 4`) ya existente |
| Menos de 3 significados distintos en el tema | Se muestran las opciones únicas disponibles (2–4); se mantiene jugable, sin error |
| `back` duplicado o igual al correcto | Se deduplica (normalizado) y se excluye de los distractores |
| Significado muy largo | Envuelve dentro de la carta; la página crece en vertical; sin truncar texto |
| 2.º fallo | Se revela la correcta en verde, grade `otra-vez`, botón «Siguiente» |
| Salir a mitad de ronda | La ronda actual y las no iniciadas → `otra-vez`; las ya resueltas no se re-emiten |
| Salir desde el resumen | No emite grades pendientes (todo resuelto) |
| `selectCards` devuelve 0 cartas | Estado completo/vacío seguro con mensaje y salida, sin crash |
| Navegador sin `speechSynthesis` / sin voces | `isSupported()` false → botones 🔊 ocultos, juego 100% jugable |
| `prefers-reduced-motion` | Sin transiciones/animaciones |
| localStorage corrupto en `sepect.settings.v1` | Fallback `{ muted:false }` (comportamiento existente) |
| Desmontaje con TTS encolado | `stopSpeech()` en cleanup; sin setState tras unmount |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  buildQuestion(correctCard, deck, randomFijo)
SALIDA:   4 opciones únicas: la correcta + 3 distractores del deck (nunca otra carta
          con el mismo back normalizado); determinista con `random` fijo; la correcta
          está identificada por id

ENTRADA:  deck con 4 cartas cuyos backs únicos son 3
SALIDA:   opciones = 3 (correcta + 2 distractores), sin duplicados; no lanza error

ENTRADA:  reduce(quiz) con 3 preguntas: 1.ª correcta al primer intento,
          2.ª fallo + correcta, 3.ª fallo + fallo
SALIDA:   emisiones onGrade(r1,'facil'), onGrade(r2,'dificil'),
          onGrade(r3,'otra-vez'); estado final 'complete' con 1 acierto y 2 fallos

ENTRADA:  pendingGrades(estado con 1 pregunta resuelta de 3)
SALIDA:   2 entradas { grade:'otra-vez' } (la resuelta no se re-emite)

ENTRADA:  render del juego con selectCards mock
SALIDA:   selectCards llamado con 10 por defecto; 4 botones de opción con CardImage
          y aria-label "Opción N: <back>"; la pregunta superior no contiene CardImage;
          grid 2×2 declarado en tokens.css

ENTRADA:  speak('¿Qué es un closure?') con speechSynthesis stubbeado + muted=false
SALIDA:   utterance encolado con rate 0.9; muted=true → sin utterance;
          sin speechSynthesis → botones 🔊 ocultos

ERROR ESPERADO: ninguno lanzado a la UI; soporte ausente → controles ocultos;
                aislamiento: cero imports de storage|parser|content|router
```

---

## 📂 Fuera de alcance (Out of scope)

- Multijugador, turnos, temporizadores, puntuación estilo arcade, niveles de dificultad más allá del selector de rondas.
- Modo inverso imagen→término, preguntas de audio, STT, SFX de acierto/fallo.
- Reordenar o implementar spec-05 (sopa de letras) ni los juegos 7–10; cada uno conserva su spec.
- Elo rating, Stats view, deploy/PWA, nuevas dependencias.
- Cambios de routing/vistas (`#/tema/:id/juego/quiz-significado` ya es genérico) y de `GameHost.jsx`.

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-19** (decisiones: pregunta arriba solo texto + TTS; 4 opciones 2×2 con `CardImage` + `back`; distractores del deck completo con dedupe; 2 intentos → facil/dificil/otra-vez; rondas 3–10 default 10 vía `selectCards`; TTS automático + 🔊 + toggle global).
