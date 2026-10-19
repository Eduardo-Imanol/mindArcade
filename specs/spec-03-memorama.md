---
feature: memorama
status: approved
owner: Eduardo
created: 2026-10-19
updated: 2026-10-19
related_tasks: tasks.md (approved — execution unblocked)
---

# Spec — Memorama + SRS-driven card selection + responsive board + TTS (spec-03)

> [!abstract] Resumen
> Segundo juego del arcade: Memorama (emparejar término ↔ significado) conectado a la
> lógica SRS de flashcards (solo cartas no aprendidas), con tablero responsivo web+ móvil
> y TTS gratuito (Web Speech API) como requisito de todo juego. Firmada por Eduardo.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (multi-subsistema: core SRS + host + juego + TTS + responsive + docs) |
| Fecha | 2026-10-19 |
| Revisada por | Eduardo — 2026-10-19 |

---

## 📖 Historias de usuario

### HU-1 — Memorama jugable con cartas no aprendidas
**Como** aprendiz, **quiero** jugar un memorama cuyas parejas salgan prioritariamente de las
palabras que aún no he aprendido, **para** repasar justo lo que me falta.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('memorama').status === 'available'` con `load()` dinámico; `TopicView` lo habilita cuando el tema tiene ≥ `minCards: 4`; el resto del catálogo intacto (`registry.test.js`).
- [ ] AC-2: Pantalla de setup con dificultad Fácil = 4 parejas / Medio = 6 / Difícil = 8; tras elegir se entra al tablero; parejas reales = `min(pedido, cartas disponibles)`; con deck < pedido se usa todo lo disponible.
- [ ] AC-3: Selección de cartas = función pura `selectDueCards(cards, srs, { count, random, now })`: prioriza **no aprendidas** (sin estado SRS o `reps < 3`), en orden aleatorio con `random` inyectable; si el pool no alcanza, rellena con aprendidas por `nextReview` ascendente. Nunca devuelve más que `count`.

### HU-2 — Juego de emparejar con TTS
**Como** aprendiz, **quiero** voltear cartas, emparejar término con significado y oír las
palabras leídas en voz alta, **para** reforzar la memoria auditiva sin costo.

**Criterios de aceptación:**
- [ ] AC-4: Tablero = 2 tiles por carta del deck seleccionado (tile `front` con término + `CardImage`, tile `back` con significado + `CardImage`), barajados con `random` inyectable; todo tile renderiza `CardImage` (precedencia de imágenes spec-02 §4).
- [ ] AC-5: Lógica de volteo: máximo 2 tiles abiertos; mismo `card.id` → par emparejado (queda boca arriba, resaltado); distinto → se cierran tras ~1000 ms; mientras hay 2 abiertos los clics se ignoran; estado determinista en reducer puro.
- [ ] AC-6: Grades por intentos → `onGrade(cardId, grade)`: acierto al 1.er intento → `facil`; a los 2–3 intentos → `dificil`; nunca hallado al terminar la sesión → `otra-vez` para ambas caras; GameHost persiste SRS + XP + history idénticos tras reload simulado (test de integración).
- [ ] AC-9: TTS con Web Speech API (gratis, 0 dependencias): lectura automática del texto del tile al voltear (tras gesto del usuario), botón 🔊 por carta para repetir, toggle global de sonido persistido en `sepect.settings.v1`; navegador sin `speechSynthesis` → controles ocultos/deshabilitados sin crash. Flashcards también expone 🔊 (mismo helper).

### HU-3 — Se ve bien en web y en móvil
**Como** usuario de escritorio y de teléfono, **quiero** un tablero cómodo en ambos,
**para** jugar sin zoom ni scroll raro.

**Criterios de aceptación:**
- [ ] AC-7: Responsive: a 360px → ≥4 columnas, targets ≥44px, sin scroll horizontal; a ≥1024px → contenedor a ancho completo (`width:100%; max-width:100%`) con el tablero (~960px) centrado en `.game-stage`, grid escala hasta 8 columnas, tiles con aspect-ratio fijo y texto legible; estilos vía CSS (media queries / `grid auto-fill`), sin dependencias nuevas.
- [ ] AC-8: Teclado completo (Tab/Enter/Space) sobre setup, tiles y controles; focus visible (ring `--neon-green`); `aria-label` por tile y `aria-live` en resultados de par/resumen; funciona con `prefers-reduced-motion` (flip instantáneo).

### HU-4 — Regla TTS institucional
**Como** mantenedor, **quiero** documentado que todo juego nuevo debe incluir TTS,
**para** que la regla no se pierda entre sesiones.

**Criterios de aceptación:**
- [ ] AC-10: Aislamiento: el módulo memorama no importa `storage|parser|content|router` (test regex) y cumple el contrato congelado de props; la extensión `selectCards(count)` es **opcional y aditiva** (flashcards no la usa y sigue recibiendo deck completo).
- [ ] AC-12: `AGENTS.md` (Guardrails), `specs/roadmap-games.md` (contrato de reutilización) y las skills `.opencode/skills/mini-game-templates` y `audio-fx-integration` dejan explícito: **todo juego debe incluir TTS** (Web Speech API, helper `src/core/audio/tts.js`).
- [ ] AC-11: `npm test` 100% pass y `npm run lint` 0 errors/warnings en archivos enviados.

> Cada AC mapea a ≥1 test automatizado en §6. AC-7/AC-8 también usan checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: flip 3D = CSS puro (`transform-style: preserve-3d`, `rotateY`), NO framer-motion. TTS = `window.speechSynthesis` nativo.
- **Contrato de juego congelado (spec-02 §4) se extiende solo de forma aditiva**: props `{ deck, onGrade, onExit, selectCards? }`. `selectCards(count)` lo construye GameHost desde `topic.cards + srs[topic.id]` y lo pasa al juego; el juego lo invoca al confirmar dificultad. El SRS vive únicamente en el host — patrón reutilizable por los 9 juegos futuros.
- **Selección con SRS**: el deck completo sigue llegando ordenado por `orderDeck`; el memorama no lo recorta por su cuenta, pide cartas vía `selectCards`. "Aprendida" ≡ `srs[cardId].reps >= 3` (constante `LEARNED_REPS`, testeable).
- **TTS**: wrapper puro `src/core/audio/tts.js` — `speak(text, {lang})` (cancela utterance previo, rate 0.9, pitch 1.1, selección de voz por prefijo de idioma, fallback `onvoiceschanged`), `isSupported()`; toggle global persistido en `sepect.settings.v1 = { muted: bool }` con patrón quota-safe existente. La lectura al voltear ocurre tras clic/tecla del usuario (política de autoplay).
- **Grades SRS por intentos** (decisión de diseño firmada): 1.er intento → `facil`, 2–3 → `dificil`, nunca hallado → `otra-vez`. Mapeo a XP existente (`GRADE_DIFFICULTY` de GameHost) sin cambios.
- **Juego 1 jugador** (sin multiplayer — VocaPlayLand sirve solo como referencia de mecánica).
- Aislamiento de juegos y reglas de `docs/architecture.md` / `docs/testing.md` siguen vigentes; UI strings en español, identificadores en inglés.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Deck con menos cartas que la dificultad pedida | Se usa `min(pedido, disponibles)`; nunca crashea |
| Todas las cartas aprendidas (`reps ≥ 3`) | Relleno con aprendidas ordenadas por `nextReview` asc (vencidas primero) |
| Deck < 4 cartas | Juego deshabilitado en TopicView (`minCards: 4`) ya existente |
| Taps/clics rápidos con 2 tiles abiertos | Ignorados hasta resolver el par |
| Navegador sin `speechSynthesis` / sin voces | `isSupported()` false → botones 🔊 ocultos, juego 100% jugable |
| `prefers-reduced-motion` | Flip sin animación (estado cambia directo) |
| Timer de cierre (~1000 ms) tras desmontar | Se limpia en unmount del reducer/effect (sin setState tras unmount) |
| `selectCards` invocado con count > pool | Devuelve el pool completo (ver AC-3 backfill) |
| localStorage corrupto en `sepect.settings.v1` | Fallback `{ muted:false }`, sin crash |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  selectDueCards(8 cards, srs con 3 aprendidas y 2 con reps=1, { count: 6, random: fnFija, now })
SALIDA:   6 cards → primero las 5 no aprendidas (orden aleatorio determinista),
          relleno 1 aprendida con menor nextReview; nunca incluye más de `count`

ENTRADA:  reduce(memorama) secuencia: flip A1, flip B1 (no match), esperar, flip A1, flip A2 (match)
SALIDA:   estado determinista: intentos de A = 1 → grade 'facil' al completar

ENTRADA:  sesión terminada con par nunca hallado
SALIDA:   onGrade('cardId','otra-vez') invocado para ambas caras pendientes

ENTRADA:  speak('función') con speechSynthesis stubbeado + muted=false
SALIDA:   utterance encolado con rate 0.9; muted=true → sin utterance

ERROR ESPERADO: ninguno lanzado a la UI; soporte ausente → controles ocultos
```

---

## 📂 Fuera de alcance (Out of scope)

- Multijugador, niveles intermedios de dificultad más allá de 4/6/8, drag&drop.
- TTS con voces/neural cloud, STT (reconocimiento de voz), audio SFX (beeps) — los SFX quedan para spec futura.
- Retructura responsive de Hub/TopicView/Flashcards más allá del contenedor de juego compartido (mejoras puntuales solo si bloquean AC-7).
- Juegos 4–10 del roadmap (siguen `soon`, cada uno con su spec).
- Elo rating, Stats view, deploy/PWA, nuevas dependencias.

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-19** (decisiones: grades por intentos; dificultad 4/6/8 con selección solo de no aprendidas aleatorias; 1 jugador; TTS al voltear + 🔊 + toggle global; TTS al final del plan).
