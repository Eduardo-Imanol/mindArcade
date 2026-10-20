---
feature: intruso
status: approved
owner: Eduardo
created: 2026-10-19
updated: 2026-10-19
related_tasks: tasks.md (spec-08 — approved)
---

# Spec — El intruso (spec-08)

> [!abstract] Resumen
> Séptimo juego del arcade (ID estable `intruso`): «El intruso». Cada ronda muestra
> cuatro significados con su imagen: **tres pertenecen al tema actual** (ancla) y
> **uno pertenece a otro tema**. El jugador debe tocar el significado que no
> pertenece. Se califica la carta intrusa **en su propio tema**, con un solo intento.
> El juego se implementa completo pero queda **en mantenimiento** hasta que el
> catálogo tenga al menos **2 temas con 3 cartas**; en ese momento se libera solo,
> sin cambios de código. TTS obligatorio (Web Speech API). Inspirado en «Intruder»
> de VocaPlayLand, adaptado a significados + imágenes y a temas de Sepect.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (juego + contrato multi-tema + gate de contenido + SRS + TTS + a11y + docs) |
| Fecha | 2026-10-19 |
| Revisada por | Eduardo — 2026-10-19 |

---

## 📖 Historias de usuario

### HU-1 — Juego disponible cuando hay contenido suficiente
**Como** aprendiz, **quiero** que el juego aparezca en mantenimiento mientras solo
exista un tema y se libere automáticamente al agregar otro, **para** no jugar sets
imposibles o repetitivos.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('intruso').status === 'available'` con `load()` dinámico, `minCards: 3`, `minTopics: 2` y `minCardsPerTopic: 3`; el resto del catálogo conserva sus IDs y estados (5 `available`, 5 `soon`).
- [ ] AC-2: Helper puro `getGameAvailability(game, { topic, topics })` devuelve `playable` + `reason` (`ok` | `soon` | `min-cards` | `min-topics`). `intruso` solo es jugable si el tema ancla tiene ≥3 cartas **y** el catálogo tiene ≥2 temas con ≥3 cartas (builtin + custom). Agregar un segundo tema elegible lo desbloquea sin tocar código.
- [ ] AC-3: `TopicView` muestra `intruso` deshabilitado con «En mantenimiento · agrega otro tema con al menos 3 cartas» cuando falta el segundo tema, y como enlace «Jugar ahora» cuando se cumple el gate. `GameHost` aplica el mismo gate en acceso directo por URL y muestra una pantalla segura de mantenimiento en vez de cargar el juego.

### HU-2 — Ronda: tres significados del tema y uno intruso
**Como** aprendiz, **quiero** ver tres significados del tema actual y uno de otro tema,
**para** identificar el que no pertenece por su contenido e imagen.

**Criterios de aceptación:**
- [ ] AC-4: Cada ronda tiene exactamente **3 cartas base del tema ancla** con `back` normalizado único + **1 carta intrusa de otro tema** (nunca del ancla); las 4 se barajan con un `random` inyectable. La carta intrusa no se repite entre rondas mientras existan alternativas sin usar.
- [ ] AC-5: Cada opción renderiza `CardImage` (decorativa, `alt=""`) + `back`; **nunca** se muestra el `front`, el tema ni la etiqueta de la carta antes de responder. El prompt superior muestra el título del tema ancla: `¿Cuál no pertenece al tema «<título>»?`. El deck base sale de `groups`, no de datos inventados.
- [ ] AC-6: La intrusa se elige de un grupo con `id !== anchorTopicId`; se descartan candidatas con `back` normalizado duplicado respecto a las bases. Si el ancla solo tiene 2 significados únicos, la ronda usa 3 opciones (2+1); con menos de 2 únicos o sin candidata válida, no se construye la ronda y el juego muestra un estado seguro.

### HU-3 — Un intento, grade en el tema de la intrusa y salida
**Como** aprendiz, **quiero** un intento rápido y que mi repaso se actualice en el tema
correcto, **para** practicar sin penalizar el tema equivocado.

**Criterios de aceptación:**
- [ ] AC-7: Un solo intento por ronda. Acierto → `facil`; fallo → `otra-vez`; en ambos casos se resuelve la ronda y se revela la intrusa. Se emite `onGrade(intruderCardId, grade, { topicId: intruderTopicId })` exactamente una vez por ronda (seq monótono). `GameHost` persiste SRS + history bajo el tema de la intrusa y XP/racha con el mapeo existente (`facil` +10, `otra-vez` 0), idéntico tras remount.
- [ ] AC-8: Salir a mitad de una ronda sin responder emite `otra-vez` **solo** para la intrusa de esa ronda; las rondas futuras no se emiten porque sus intrusas nunca se mostraron. Las rondas resueltas no se re-emiten. Salir desde setup o resumen no emite grades pendientes.
- [ ] AC-9: Feedback: acierto → intrusa en verde; fallo → opción elegida en rojo e intrusa en verde; se revela el tema de la intrusa; todas las opciones quedan deshabilitadas y aparece «Siguiente». Última ronda → resumen (aciertos/total, fallos, XP) con «Jugar de nuevo» y «Volver al tema».

### HU-4 — TTS obligatorio
**Como** aprendiz, **quiero** oír el reto y los significados, **para** reforzar la
discriminación entre temas sin depender solo de la lectura visual.

**Criterios de aceptación:**
- [ ] AC-10: TTS con `src/core/audio/tts.js`: al iniciar cada ronda (tras gesto) se lee el prompt con el título del tema ancla; 🔊 «Pregunta» lo repite; al pulsar una opción se lee su `back`; en el feedback «🔊 Intruso» lee el `back` de la intrusa. `<SoundToggle />` global en setup, ronda y resumen. Sin `speechSynthesis` → todos los controles 🔊 se ocultan y el juego es 100% jugable. `stopSpeech()` al desmontar. Nunca se lee el `front` de la intrusa antes de responder.

### HU-5 — Accesibilidad, aislamiento y mantenibilidad
**Como** usuario de teclado/lector de pantalla y mantenedor, **quiero** un juego
completo y aislado, **para** que el arcade siga creciendo sin regresiones.

**Criterios de aceptación:**
- [ ] AC-11: Teclado completo (Tab/Shift+Tab/Enter/Space) sobre selector, opciones, 🔊, «Siguiente», «Salir» y resumen; botones nativos `type="button"`; `aria-label` «Opción N: <significado>»; `aria-live="polite"` anuncia ronda y resultado sin repetir mensajes obsoletos; foco visible (`--neon-green`); targets ≥44px; 2×2 sin scroll horizontal a 360px; textos largos envueltos; `prefers-reduced-motion` sin animaciones.
- [ ] AC-12: Aislamiento: el módulo `intruso` no importa `storage|parser|content|router` (test regex) ni usa `localStorage|indexedDB|fetch(`; recibe `{ groups, anchorTopicId, onGrade, onExit }` (y `deck` retrocompatible) y no conoce SRS/XP/history. `GameHost` mantiene el SRS/XP/history y es el único que toca almacenamiento.
- [ ] AC-13: Docs actualizadas: `specs/roadmap-games.md` → `intruso` spec-08 aprobada y gate de contenido; `docs/manual-a11y-checklist.md` con sección «El intruso»; `MEMORY.md` y `FOCUS.md` con las decisiones de spec-08.
- [ ] AC-14: `npm test` 100% pass, `npm run lint` 0 errors/warnings y `npm run build` OK en los archivos enviados.

> Cada AC mapea a ≥1 test automatizado en §6. AC-11 también usa checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: grid 2×2 con CSS, TTS nativo, cero librerías.
- **Contrato de juego congelado (spec-02 §4) se extiende solo de forma aditiva**:
  - `groups: [{ id, title, cards }]` con todos los temas elegibles (≥`minCardsPerTopic`), incluyendo el ancla, con overrides de imagen ya aplicados por `GameHost`.
  - `anchorTopicId: string` — tema desde el que se entra; aporta las 3 cartas base.
  - `onGrade(cardId, grade, context?)` — `context = { topicId }` opcional. Las llamadas existentes con 2 argumentos siguen funcionando; `GameHost` usa `context.topicId ?? topic.id`.
- **SRS/XP/history solo en GameHost**: el juego no importa storage ni conoce el SRS. La carta intrusa se califica bajo `intruderTopicId`; XP y racha no cambian.
- **Gate de contenido**: `minCards: 3` (ancla), `minTopics: 2` y `minCardsPerTopic: 3` en el registry. La regla vive en el helper puro `src/games/availability.js`, compartido por `TopicView` y `GameHost`. No hay estado nuevo persistido.
- **Sin selección SRS de preguntas**: la ronda se arma con el ancla completa y candidatas intrusas de otros temas; anti-repetición por clave `topicId:cardId`. `selectCards` se mantiene en el contrato para otros juegos, pero `intruso` no lo usa.
- **Grades firmados**: un intento; acierto `facil`, fallo `otra-vez`. El fallo revela la intrusa y su tema.
- **Rondas firmadas**: selector 3–10, default 10; sesión = `min(pedidas, rondas construibles)`.
- **Layout firmado**: prompt con título del tema ancla; 4 opciones (3+1) en 2×2 con `CardImage` + `back`; sin `front` ni tema antes de responder.
- **TTS**: wrapper puro `src/core/audio/tts.js`; lectura del prompt (título del ancla), `back` al pulsar y `back` de la intrusa en feedback. Nunca el `front`.
- **Juego 1 jugador**; VocaPlayLand es solo referencia de mecánica/layout.
- Aislamiento de juegos y reglas de `docs/architecture.md` / `docs/testing.md` siguen vigentes; UI strings en español, identificadores en inglés.
- **Cambios permitidos**: `GameHost.jsx` (props aditivas + grade con topicId + gate), `TopicView.jsx` (mensaje de mantenimiento), `registry.js`, `tokens.css`, docs y tests. Sin cambios en el núcleo (`src/core/`).

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Solo existe `funciones-programacion` | `intruso` deshabilitado como «En mantenimiento»; el resto de juegos sin cambios |
| Segundo tema con 1–2 cartas | Sigue en mantenimiento (no cumple `minCardsPerTopic: 3`) |
| Segundo tema con ≥3 cartas | Se libera automáticamente en ambos temas, sin cambios de código |
| Tema ancla con <3 cartas | Deshabilitado por `minCards` (mensaje existente «Necesitas al menos 3 cartas») |
| Tema ancla con 3 cartas y solo 2 `back` únicos | Ronda con 3 opciones (2 bases + intrusa), sin crash |
| Tema ancla con <2 `back` únicos | No se construyen rondas; estado seguro con salida |
| Intrusa con `back` duplicado de una base | Se busca otra candidata; si no existe, no se construye la ronda |
| Todas las candidatas ya usadas | Se permite repetir la intrusa para completar la sesión |
| `groups` ausente/vacío o sin otro tema | Pantalla segura de mantenimiento/estado vacío; sin crash |
| Tema custom con imágenes subidas | `CardImage` resuelve uploads; sin imagen → fallback sin filtrar el `front` |
| Salir durante una ronda sin responder | Solo esa intrusa → `otra-vez`; las futuras no se emiten |
| Salir tras responder | La ronda ya emitida no se re-emite; sin pendientes |
| Salir desde setup/resumen | Sin emisiones pendientes |
| Navegador sin `speechSynthesis` / sin voces | Controles 🔊 ocultos; juego 100% jugable |
| `prefers-reduced-motion` | Sin transiciones/animaciones |
| localStorage corrupto en `sepect.settings.v1` | Fallback `{ muted:false }` (comportamiento existente) |
| Desmontaje con TTS encolado | `stopSpeech()` en cleanup; sin setState tras unmount |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  buildSession({ groups: [funciones(4), algoritmos(4)], anchorTopicId:'funciones',
          rounds: 10, random: fijo })
SALIDA:   sesión con min(10, construibles) rondas; cada ronda tiene 3 bases de
          funciones con backs únicos + 1 intrusa de algoritmos; 4 opciones barajadas;
          ninguna intrusa del tema ancla; determinista con `random` fijo

ENTRADA:  buildSession con ancla de 3 cartas cuyos backs únicos son 2
SALIDA:   ronda con 3 opciones (2 bases + 1 intrusa); no lanza error

ENTRADA:  reduce(estado, { type:'choose', optionKey }) sobre la intrusa
SALIDA:   phase 'answered', grade 'facil', resultado con topicId del tema intruso,
          lastGrade { seq:1, cardId, topicId, grade:'facil' }, sin segundo intento

ENTRADA:  choose sobre una base
SALIDA:   grade 'otra-vez', intrusa revelada, todas las opciones deshabilitadas

ENTRADA:  pendingCurrent(estado en ronda 2 de 5 sin responder)
SALIDA:   [{ topicId: <tema intruso>, cardId: <intrusa>, grade:'otra-vez' }]
          (solo ronda actual; rondas 3–5 no se emiten)

ENTRADA:  getGameAvailability(intruso, { topic: funciones(3), topics:[funciones(3)] })
SALIDA:   { playable:false, reason:'min-topics', minTopics:2, minCardsPerTopic:3 }

ENTRADA:  getGameAvailability(intruso, { topic: funciones(3), topics:[funciones(3), algoritmos(3)] })
SALIDA:   { playable:true, reason:'ok' }

ENTRADA:  render con groups válidos y selectCards mock
SALIDA:   selector 3–10 default 10; 4 botones de opción con CardImage y
          aria-label "Opción N: <back>"; prompt con el título del ancla; nunca
          el `front` de las cartas

ENTRADA:  speak(prompt) con speechSynthesis stubbeado + muted=false
SALIDA:   utterance encolado con rate 0.9; muted=true → sin utterance;
          sin speechSynthesis → controles 🔊 ocultos

ERROR ESPERADO: ninguno lanzado a la UI; gate/estado insuficiente → pantalla segura;
                aislamiento: cero imports de storage|parser|content|router
```

---

## 📂 Fuera de alcance (Out of scope)

- Cronómetro, puntuación arcade, SFX, multijugador, niveles de dificultad más allá del selector de rondas.
- Implementar `caza-significados` (spec-07) ni los juegos 8–10; cada uno conserva su spec.
- Agregar un tema de algoritmos u otro contenido nuevo en este incremento (el usuario lo agregará después; los tests usan fixtures/custom topics).
- Cambios en el núcleo (`src/core/`), Elo rating, Stats view, deploy/PWA, nuevas dependencias.
- Cambios de routing (`#/tema/:id/juego/intruso` ya es genérico).

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-19** (decisiones: ID `intruso` y título «El intruso»; 3 significados del tema ancla + 1 de otro tema; gate 2 temas con ≥3 cartas; un intento con grade en el tema de la intrusa; rondas 3–10 default 10; TTS obligatorio; `caza-significados` spec-07 queda intacta).
