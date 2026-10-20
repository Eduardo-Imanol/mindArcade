---
feature: ahorcado
status: approved
owner: Eduardo
created: 2026-10-19
updated: 2026-10-19
related_tasks: tasks.md (spec-04 — se redacta inmediatamente tras la firma)
---

# Spec — Ahorcado SRS-driven + muñequito p5-art + rondas seleccionables + TTS (spec-04)

> [!abstract] Resumen
> Tercer juego del arcade: Ahorcado por rondas. La pista de cada ronda es el significado
> (`back`) + `CardImage`; la palabra a adivinar es el término (`front`) letra a letra con
> teclado español (27 letras, normalización NFD). Cada fallo agrega una parte al muñequito
> dibujado con el motor interno p5-art (`scripts/p5-art/`, SVG runtime determinista). Las
> rondas salen solo de cartas no vistas/no aprendidas (aleatorias) vía `selectCards(count)`.
> Firmada por Eduardo.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada |
| Escala | Alta (juego + arte runtime p5-art + SRS + TTS + a11y + docs) |
| Fecha | 2026-10-19 |
| Revisada por | Eduardo — 2026-10-19 |

---

## 📖 Historias de usuario

### HU-1 — Sesión de rondas con cartas no aprendidas
**Como** aprendiz, **quiero** elegir cuántas rondas jugar (3–10) y que salgan palabras que
aún no domino, **para** repasar justo lo que me falta.

**Criterios de aceptación:**
- [ ] AC-1: `getGame('ahorcado').status === 'available'` con `load()` dinámico; `TopicView` lo habilita cuando el tema tiene ≥ `minCards: 3`; el resto del catálogo intacto (`registry.test.js`: 3 `available`, 7 `soon`, catálogo = 10).
- [ ] AC-2: Pantalla de setup con selector de rondas 3–10 (default 10); tras confirmar se invoca `selectCards(rondas)` (prop opcional de GameHost construida con `selectDueCards`); rondas reales = `min(pedido, cartas devueltas)`; la sesión dura exactamente esas rondas.
- [ ] AC-3: La selección prioriza **no vistas/no aprendidas** (sin estado SRS o `reps < 3`) en orden aleatorio con `random` inyectable; si el pool no alcanza, rellena con aprendidas por `nextReview` ascendente (mismo comportamiento firmado en spec-03 AC-3); nunca devuelve más que `count`; deck < 3 cartas → juego deshabilitado en TopicView (gate `minCards` ya existente, sin cambios).

### HU-2 — Ronda de adivinanza con pista
**Como** aprendiz, **quiero** ver el significado y la imagen del término como pista y
adivinar el término letra a letra, **para** fijar el concepto sin ver la respuesta.

**Criterios de aceptación:**
- [ ] AC-4: Cada ronda muestra: `CardImage` (props `{ card, size }`, precedencia de imágenes spec-02 §4) + texto del `back` como pista + casillas ocultas del `front`; al iniciar la ronda (tras gesto del usuario) el TTS lee el `back` automáticamente; botón 🔊 repite la pista; `<SoundToggle />` global presente; sin `speechSynthesis` → controles ocultos y juego 100% jugable.
- [ ] AC-5: Teclado en pantalla con las **27 letras del alfabeto español (A–Z + Ñ)** como `<button>` nativos + entrada por teclado físico; letra usada → deshabilitada (acierto o fallo) e ignorada si se repite; letras correctas revelan sus casillas; incorrectas suman un fallo.
- [ ] AC-6: Normalización NFD (`normalize('NFD')` + strip `\p{M}` + `toUpperCase`) para comparar: pulsar `N` revela `Ñ`, pulsar `A` revela `Á/É/Í/Ó/Ú`; las casillas muestran los caracteres **originales**; espacios son separadores siempre visibles (términos compuestos jugables); victoria = todas las casillas reveladas (6 fallos máx.), derrota = 6 fallos → se revela la palabra completa con su TTS.

### HU-3 — Muñequito del ahorcado con el motor p5-art
**Como** mantenedor, **quiero** que el muñequito se genere con el motor interno estilo p5
(`scripts/p5-art/`), **para** reutilizar la casa de arte neón sin dependencias ni assets.

**Criterios de aceptación:**
- [ ] AC-7: Módulo `src/games/ahorcado/hangman-art.mjs` que importa `Sketch`/`renderSketch`/`hashSeed` de `scripts/p5-art/engine.mjs` (ESM zero-dep) y expone una fábrica `hangmanSketch(mistakes)` → SVG runtime: postre/base siempre visible + `parts.slice(0, mistakes)` (cabeza, torso, 2 brazos, 2 piernas — geometría 250×250 tipo VocaPlayLand), colores de `scripts/p5-art/palette.mjs`, `seed = hashSeed(card.id)`; determinismo: mismos `(mistakes, cardId, size)` → mismos bytes (test).
- [ ] AC-8: Cada parte nueva anima su entrada (keyframes CSS de opacidad/escala al re-montar el SVG) y con `mistakes ≥ 5` el muñequito entra en estado de alarma (pulso/rojo); `prefers-reduced-motion` → sin animación ni pulso; SVG inline con `role="img"` + `aria-label` (proveniente de `toSVG`).

### HU-4 — Ciclo de rondas y grades SRS
**Como** aprendiz, **quiero** ganar o perder cada ronda, avanzar a la siguiente y ver un
resumen final, **para** sentir progreso y que mi memoria se actualice con justicia.

**Criterios de aceptación:**
- [ ] AC-9: Al terminar cada ronda se emite `onGrade(cardId, grade)` con los umbrales firmados: ganada con **0–1 fallos → `facil`** (+10 XP vía GameHost); ganada con **2–5 fallos → `dificil`** (+25 XP); **perdida (6 fallos) → `otra-vez`** (0 XP, SM-2 resetea `reps`); GameHost persiste SRS + XP + history idénticos tras reload simulado (test de integración, patrón memorama).
- [ ] AC-10: Tras cada ronda → pantalla Ganada/Perdida con la palabra revelada + botón "Siguiente ronda"; en la última → pantalla de resumen (aciertos/total, XP ganada, errores) con "Jugar de nuevo"; salida a mitad de sesión → `pendingGrades(state)` emite `otra-vez` para las rondas sin resolver (emisión única por `seq` monótono, patrón memorama), luego `onExit()`.
- [ ] AC-11: Aislamiento: el módulo ahorcado no importa `storage|parser|content|router` (test regex) ni usa `localStorage|indexedDB|fetch(`; cumple el contrato congelado de props `{ deck, onGrade, onExit, selectCards? }`; el SRS vive únicamente en GameHost.

### HU-5 — Accesibilidad, docs y calidad
**Como** usuario de teclado/lector de pantalla y mantenedor, **quiero** un juego completo,
documentado y sin regresiones, **para** que el arcade crezca sostenible.

**Criterios de aceptación:**
- [ ] AC-12: Teclado completo (Tab/Enter/Space) sobre selector de rondas, letras y controles; focus visible (ring `--neon-green`); `aria-label` por letra (incluye estado usada/disponible); `aria-live` anuncia fallos/restantes y resultado de ronda; targets ≥44px; sin scroll horizontal a 360px.
- [ ] AC-13: Docs actualizadas: `specs/roadmap-games.md` → ahorcado `available` (spec-04), `docs/manual-a11y-checklist.md` con sección Ahorcado, `MEMORY.md` con el aprendizaje del patrón SVG runtime p5-art.
- [ ] AC-14: `npm test` 100% pass y `npm run lint` 0 errors/warnings en archivos enviados.

> Cada AC mapea a ≥1 test automatizado en §6. AC-12 también usa checklist manual.

---

## 🚧 Restricciones arquitectónicas

- **Sin dependencias nuevas**: el muñequito usa el motor ESM zero-dep `scripts/p5-art/engine.mjs` + `palette.mjs` (solo se importan desde `src/games/ahorcado/hangman-art.mjs` con ruta relativa; si el build/lint lo rechazara, fallback = alias en `vite.config` — sin copiar código). Animación = CSS keyframes, NO framer-motion. TTS = `window.speechSynthesis` nativo.
- **Contrato de juego congelado (spec-02 §4) se extiende solo de forma aditiva**: props `{ deck, onGrade, onExit, selectCards? }`; el juego pide sus cartas con `selectCards(count)` al confirmar rondas. El SRS/XP/history vive únicamente en GameHost (patrón firmado en spec-03, sin cambios en `GameHost.jsx` salvo tests de integración).
- **Selección con SRS**: sin núcleo nuevo — reutiliza `selectDueCards(cards, srs, { count, random })` (LEARNED_REPS = 3) tal cual; "no aprendida" ≡ sin estado SRS o `reps < 3`.
- **Mecánica de rondas**: 1 carta por ronda; `MAX_MISTAKES = 6` (6 partes del muñequito); fallos **derivados** (`usedLetters.filter(l => !target.includes(l)).length`), no acumulados; selector de rondas 3–10, default 10.
- **Grades SRS por ronda** (decisión de diseño firmada): 0–1 fallos → `facil`; 2–5 → `dificil`; perdida → `otra-vez`. Mapeo a XP existente (`GRADE_DIFFULTY` de GameHost) sin cambios.
- **TTS**: wrapper puro `src/core/audio/tts.js` — `speak(text, {lang})` (cancela previo, rate 0.9, pitch 1.1), `isSupported()`; lectura del `back` tras gesto de usuario (política de autoplay), botón 🔊 por ronda, `<SoundToggle />` persistido en `sepect.settings.v1`.
- **Arte**: determinismo obligatorio (mismo seed → mismos bytes); seed = `hashSeed(card.id)`; colores exclusivamente de `palette.mjs` (tokens neón de `src/ui/tokens.css`); el arte es **decorativo-aditivo**: si el SVG fallara, el juego sigue siendo jugable (letras + pista de texto).
- **Juego 1 jugador** (VocaPlayLand sirve solo como referencia de mecánica — geometría del muñequito, pipeline NFD, estados ganada/perdida).
- Aislamiento de juegos y reglas de `docs/architecture.md` / `docs/testing.md` siguen vigentes; UI strings en español, identificadores en inglés.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Rondas pedidas > cartas disponibles | Rondas reales = `min(pedido, devueltas)`; nunca crashea |
| Pool de no aprendidas vacío | `selectDueCards` rellena con aprendidas por `nextReview` asc (backfill firmado) |
| Deck < 3 cartas | Juego deshabilitado en TopicView (`minCards: 3`) ya existente |
| Término con espacios / compuesto | Espacios = separadores siempre revelados; se juega completo |
| Término con Ñ / acentos | NFD: `N` revela `Ñ`, `A` revela vocales acentuadas; casillas muestran original |
| Letra repetida (clic o tecla) | Ignorada; la tecla queda deshabilitada tras usarse |
| 6 fallos | Ronda perdida inmediata; se revela la palabra + TTS; grade `otra-vez` |
| Salir a mitad de ronda o sesión | `pendingGrades` → `otra-vez` para rondas sin resolver; luego `onExit()` |
| Término más ancho que el stage | `overflow-wrap` / grid de casillas que envuelve; sin scroll horizontal |
| Navegador sin `speechSynthesis` / sin voces | `isSupported()` false → botones 🔊 ocultos, juego 100% jugable |
| `prefers-reduced-motion` | Sin animación de partes ni pulso de alarma |
| Motor p5-art inimportable en browser | Fallback: alias `vite.config` (sin dependencias, sin copiar engine) |
| localStorage corrupto en `sepect.settings.v1` | Fallback `{ muted:false }` (comportamiento existente) |
| Desmontaje con TTS encolado | `speak` cancela utterance previo; sin setState tras unmount |

---

## 🧪 Contrato de pruebas

> Interfaz de entrada/salida contra la cual se escriben los tests.

```
ENTRADA:  normalizeWord('Función Ñandú ÉXITO') para comparación de casillas
SALIDA:   'FUNCION NANDU EXITO' (NFD strip \p{M} + upper); espacios preservados como
          separadores; display conserva los caracteres originales

ENTRADA:  reduce(ahorcado) secuencia: iniciar ronda, adivinar letras válidas hasta
          completarla con 0 fallos → ronda siguiente → completar 2ª ronda con 3 fallos
SALIDA:   estado determinista; emisiones: onGrade(r1,'facil'), onGrade(r2,'dificil')

ENTRADA:  reduce con 6 letras incorrectas
SALIDA:   state.complete='lost' en la ronda, palabra revelada, emisión onGrade(...,'otra-vez')

ENTRADA:  selectDueCards(10 cards con 4 no aprendidas, srs, { count: 6, random: fnFija })
SALIDA:   6 cards → 4 no aprendidas en orden aleatorio determinista + 2 aprendidas por
          nextReview asc; nunca más de `count`

ENTRADA:  renderHangman({ mistakes: 3, cardId: 'q-xyz', size: 512 }) ejecutado 2 veces
SALIDA:   strings idénticos (bytes); contiene base + exactamente 3 partes; mistakes=0 →
          solo la base; mistakes=6 → las 6 partes

ENTRADA:  pendingGrades(estado con 2 rondas resueltas y 3 sin empezar)
SALIDA:   3 entradas con grade 'otra-vez' (las resueltas no se re-emiten: seq monótono)

ENTRADA:  speak('significado') con speechSynthesis stubbeado + muted=false
SALIDA:   utterance encolado con rate 0.9; muted=true → sin utterance

ERROR ESPERADO: ninguno lanzado a la UI; soporte ausente → controles ocultos;
                aislamiento: cero imports de storage|parser|content|router
```

---

## 📂 Fuera de alcance (Out of scope)

- Multijugador, turnos, temporizadores por ronda, niveles de dificultad más allá del selector 3–10.
- Pista extra de traducción, botones de bombilla/pista parcial — la pista es `back` + `CardImage`.
- SFX de audio (beeps/golpes), STT (reconocimiento de voz), voces neuronales/cloud.
- Reescritura del motor `scripts/p5-art/` (solo se consume; si se requiere soporte de `rect` con stroke se añade aditivamente con test).
- Elo rating, Stats view, deploy/PWA, nuevas dependencias.
- Juegos 5–10 del roadmap (siguen `soon`, cada uno con su spec).
- Cambios de routing/vistas (ruta `#/tema/:id/juego/ahorcado` ya es genérica).

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-19** (decisiones: muñequito con motor p5-art + `CardImage` como pista; selector de rondas 3–10 con backfill de aprendidas; grades 0–1 fallos `facil` / 2–5 `dificil` / perdida `otra-vez`; alfabeto español 27 letras con Ñ + normalización NFD; TTS de la pista al iniciar ronda + 🔊 + toggle global).
