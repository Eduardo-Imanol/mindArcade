# tasks.md — ahorcado (APPROVED 2026-10-19 — execution unblocked)

> Derived from `specs/spec-04-ahorcado.md`. Signed by Eduardo: `APPROVED spec-04 + tasks`.
> Previous increment archived at `specs/tasks-03-memorama.md` (done; su T10 quedó en `[~]`
> pendiente de aprobación humana del diff — revisar al cerrar spec-03).
> Roadmap of games: `specs/roadmap-games.md`. TTS mandatory (spec-03 AC-12).

## Dependency graph

```
T1 ahorcado.logic.js (reducer puro) ──► T2 logic tests ──► T5 Ahorcado.jsx ──► T6 registry available
T3 hangman-art.mjs (p5-art runtime) ──► T4 art tests ───────► T5 ──► T7 a11y + isolation tests
                                                          T5 ──► T8 GameHost integration test
T6 ──► T9 docs (roadmap/checklist/MEMORY)
T1..T9 ──► T10 adversarial verify + DoD
```

Pure reducer + SVG engine first (parallel, no deps), then UI, then registry, then
tests (a11y/integration), then docs, then adversarial verify.

## Tasks

### T1 — Ahorcado pure logic reducer [depends: none]
- [x] Deliverable: `src/games/ahorcado/ahorcado.logic.js` (+ `ahorcado.logic.test.js` en T2) — reducer puro SIN imports de core: `normalizeWord` (NFD strip `\p{M}` + upper, espacios como separadores), `createState` (fases `setup|playing|round-won|round-lost|complete`, rondas 3–10, letras usadas, fallos **derivados**, `MAX_MISTAKES=6`), acciones `start {rounds, cards}` / `guess {letter}` / `next` / `reset`, `gradeFor(mistakes)` → `0–1: facil | 2–5: dificil | perdida: otra-vez`, `pendingGrades(state)` con emisión única por `seq` monótono (patrón memorama); `random` inyectable
- Covers: AC-2 (lógica de rondas), AC-5 (lógica de letras), AC-6 (NFD/win/lose), AC-9 (grades), AC-10 (pendingGrades)
- Context needed: spec §2 HU-1/HU-2/HU-4, §4 mecánica; patrón `memorama.logic.js` (lastMatch seq, pendingGrades)
- Done when: secuencia completa testeada con `random` fijo (setup → rondas ganadas con 0 y 3 fallos → 6 fallos = perdida → resumen); `normalizeWord('Función Ñandú ÉXITO')` → `'FUNCION NANDU EXITO'`; grade mapping y pendingGrades verificados

### T2 — Ahorcado logic test suite [depends: T1]
- [x] Deliverable: `src/games/ahorcado/ahorcado.logic.test.js` — contrato de pruebas §6 de spec-04 completo: normalizeWord, secuencia de reduce, 6 fallos → `otra-vez`, gradeFor umbrales, pendingGrades (resueltas no re-emiten)
- Covers: AC-6, AC-9, AC-10 (pruebas), AC-14 (parcial)
- Context needed: spec §6 contrato de pruebas; `docs/testing.md` (seeds fijos, sin flaky)
- Done when: todos los bloques ENTRADA/SALIDA de §6 cubiertos y en verde

### T3 — Hangman SVG engine (p5-art runtime) [depends: none]
- [x] Deliverable: `src/games/ahorcado/hangman-art.mjs` (+ test en T4) — importa `Sketch`, `renderSketch`, `hashSeed` de `../../../scripts/p5-art/engine.mjs` y colores de `../../../scripts/p5-art/palette.mjs`; fábrica `hangmanSketch(mistakes)` → setupFn: base del poste (suelo, poste, viga, cuerda) siempre + `parts.slice(0, mistakes)` (cabeza, torso, brazo izq/der, pierna izq/der, geometría lienzo 250×250 escalado a `size`); wrapper `renderHangman({ mistakes, cardId, size, label })` con `seed = hashSeed(card.id)` → string SVG (`role="img"`, `aria-label`); colores neón palette (CYAN estructura, TEXT cuerpo, AMBER alarma ≥5)
- Covers: AC-7, AC-8 (svg base)
- Context needed: spec §3 HU-3, §4 restricción de arte; API de `scripts/p5-art/engine.mjs`; geometría VocaPlayLand (informe de referencia: viewBox 250×250, partes en orden)
- Done when: `npm run build` resuelve el import de `scripts/` desde `src/` (si no → fallback alias en `vite.config`, sin copiar engine); mistakes 0..6 → base + exactamente N partes

### T4 — Hangman art tests [depends: T3]
- [x] Deliverable: `src/games/ahorcado/hangman-art.test.mjs` — determinismo (dos renders idénticos byte a byte), conteo de partes por mistakes, presencia de `<title>`/`aria-label`, ausencia de partes no dibujadas, colores solo de palette
- Covers: AC-7 (pruebas), AC-8 (parcial)
- Context needed: T3 API; patrón `scripts/p5-art/engine.test.mjs`
- Done when: suite en verde, mismo seed → mismos bytes
- Estado: [x] 2026-10-19 — 11 tests verdes (determinismo bytes, base+partes 0..6, clamps, alarma ≥5, escape XML, palette-only, escalado) + fix de flakiness en `Memorama.a11y.test.jsx` (mismatch determinista: segunda carta de distinto `cardId`)

### T5 — Ahorcado UI component (setup + rondas + teclado ES + TTS) [depends: T1, T3]
- [x] Deliverable: `src/games/ahorcado/Ahorcado.jsx` + `index.jsx` — fases: setup (selector de rondas 3–10, default 10 → `selectCards(rondas)`), ronda (`CardImage {card,size}` + pista `back` + casillas del `front` original + SVG `renderHangman` inline con keyframes de entrada y alarma ≥5 + teclado 27 letras `<button>` + teclado físico), transición Ganada/Perdida (palabra revelada + TTS), resumen final (aciertos/total/XP) + replay; TTS: `speak(back)` al iniciar ronda (tras gesto), 🔊 pista, `<SoundToggle />`; emisión `onGrade` por ronda con patrón seq, `pendingGrades` + `onExit` al salir; estilos tokens neón (`.game-stage`, `.btn-neon`, `.card-neon`), `prefers-reduced-motion`, controles TTS ocultos sin soporte
- Covers: AC-2 (UI), AC-4, AC-5 (UI), AC-6 (UI), AC-7 (render), AC-8 (animación/alarma), AC-9 (emisión), AC-10 (flujos)
- Context needed: contrato congelado de props; `CardImage` (`src/components/CardImage.jsx`, props `{card,size}`); `tts.js` + `SoundToggle`; `Memorama.jsx` (fases, seq emission); tokens.css
- Done when: flujo completo setup → N rondas → resumen jugable con mouse+teclado; salir a mitad emite `otra-vez` pendientes; sin imports prohibidos (test de T7)
- Estado: [x] 2026-10-19 — `Ahorcado.jsx` + `index.jsx` + estilos `.ahorcado-*` en tokens.css; smoke temporal verificó setup→rondas→resumen (mouse+flechas), derrota con palabra revelada + `otra-vez`, salida con pendientes `otra-vez`, alarma ≥5 y remount del arte; `npm run build` resuelve `scripts/p5-art` desde `src` (R1 sin alias); lint 0

### T6 — Registry: ahorcado → available [depends: T5]
- [x] Deliverable: `src/games/registry.js` — entrada `ahorcado` con `status:'available'`, `minCards:3`, `load: () => import('./ahorcado/index.jsx')`; `src/games/registry.test.js` actualizado (3 `available`, 7 `soon`, catálogo 10, `load()` resuelve `{default: Component}`)
- Covers: AC-1
- Context needed: spec AC-1; contrato registry spec-02 §4
- Done when: `getGame('ahorcado').status==='available'` + `load()` dinámico; resto intacto; `TopicView` habilita con ≥3 cartas sin cambios de código
- Estado: [x] 2026-10-19 — registry con `ahorcado` available + `load()` dinámico; tests: 3 available / 7 soon / catálogo 10 / `{default: Component}` verde

### T7 — A11y + isolation tests [depends: T5]
- [x] Deliverable: `src/games/ahorcado/ahorcado.isolation.test.js` (regex sin `storage|parser|content|router`; sin `localStorage|indexedDB|fetch(`) + `src/games/ahorcado/Ahorcado.a11y.test.jsx` (teclado Tab/Enter/Space en selector/letras/controles, `aria-label` por letra con estado, `aria-live` de fallos/restantes/resultado, targets ≥44px) + check 360px sin scroll horizontal
- Covers: AC-11, AC-12, AC-14 (parcial)
- Context needed: patrones `memorama.isolation.test.js` / `Memorama.a11y.test.jsx`; `docs/manual-a11y-checklist.md`
- Done when: ambas suites en verde; sin violaciones de a11y en el componente
- Estado: [x] 2026-10-19 — 4 isolation + 10 a11y tests verdes; fixes a11y en `Ahorcado.jsx` (aria-label `disponible`, intentos restantes en `aria-live`, N/Ñ normalizadas) y `.ahorcado-key { min-width:44px }`; lint 0

### T8 — GameHost integration test [depends: T5]
- [x] Deliverable: ampliar `src/views/GameHost.test.jsx` — Ahorcado recibe `selectCards` que devuelve no-aprendidas primero (random fijo); tras simular rondas (facil/dificil/otra-vez) la persistencia SRS + XP + history es idéntica tras reload; salida con pendientes → `otra-vez` persistido
- Covers: AC-3 (integración), AC-9 (persistencia)
- Context needed: `selectDueCards`/`applyGrade`/`awardXP` APIs; test de integración de memorama como plantilla
- Done when: asserts de persistencia en verde; flashcards/memorama sin regresiones
- Estado: [x] 2026-10-19 — 3 tests nuevos verdes: selección no-aprendidas + backfill por `nextReview`, sesión facil/dificil/otra-vez con SRS (reps/interval/ease), XP e history idénticos tras remount, y salida con pendientes → `otra-vez`; GameHost.test.jsx 10/10

### T9 — Docs: roadmap + checklist + MEMORY [depends: T6]
- [x] Deliverable: `specs/roadmap-games.md` → ahorcado marcado disponible (spec-04 firmada); `docs/manual-a11y-checklist.md` con sección "Ahorcado"; `MEMORY.md` con patrón SVG runtime p5-art desde `src/`
- Covers: AC-13
- Context needed: spec AC-13; formato de secciones existentes
- Done when: los 3 archivos actualizados sin romper índice existente
- Estado: [x] 2026-10-19 — roadmap con `spec-04 (available)`, checklist manual con sección Ahorcado (teclado 27 letras, aria-live, TTS, reduced-motion, 360px) y MEMORY con el patrón SVG runtime p5-art + nota de integración GameHost

### T10 — Adversarial verify + DoD [depends: all]
- [x] Deliverable: verificador independiente (agente distinto al autor) contra AC-1..AC-14; `npm test` 100%; `npm run lint` 0; `npm run build` ok (resolución p5-art R1); revisión de diff humana; cierre de `MEMORY.md`/`FOCUS.md`
- Covers: AC-14 (y smoke de todos)
- Context needed: spec §5 ACs, `docs/testing.md`, `docs/security.md`
- Done when: gates al 100%, verificador sin hallazgos, Eduardo aprueba diff
- Estado: [~] 2026-10-19 — verificador independiente en 3 pasadas: 1 bloqueante + 4 mayores + 7 nits corregidos (F1 `alt="Pista visual"` en CardImage evita filtrar el `front`; F4 focus ring del select; F5 tests TTS de ahorcado; F6 test AC-3 no tautológico con random fijo; F7 `stopSpeech()` en unmount; F8 `Math.trunc` de rondas; F11 keyframe solo transform/opacity; F12 guard `exiting` + reset en start/replay; F13 tests de acentos/espacios y replay). Gates: `npm test` 214/214, `npm run lint` 0, `npm run build` OK (p5-art resuelto sin alias). Residuales aceptados y documentados en MEMORY: layout real/scroll 360px solo regex + checklist manual, aislamiento textual (no grafo transitivo), ruta directa con <3 cartas fuera de TopicView, seed decorativo, AMBER vs "rojo", warnings `act(...)` preexistentes. Pendiente: aprobación humana del diff (Eduardo)

## Sizing / execution flow
- Scope: subsistema único FE (10 tareas: reducer + arte + UI + registry + tests + docs)
- Mode: single-agent secuencial; T1 ∥ T3 paralelizables al inicio (sin dependencias)
- Sequential chains: T1 → T2 → T5; T3 → T4 → T5; T5 → T6 → T9; T5 → T7, T8; T10 al final
- Estimate: T1 M, T2 S, T3 M, T4 S, T5 L, T6 S, T7 S, T8 S, T9 S, T10 S
- Out of scope respected: sin nuevas deps, sin SFX, sin juegos 5–10, sin cambios en GameHost/routing (salvo tests)

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-19 (decisiones: muñequito p5-art + CardImage como pista; rondas 3–10 con backfill de aprendidas; grades 0–1 facil / 2–5 dificil / perdida otra-vez; alfabeto ES 27 con NFD; TTS pista al iniciar + 🔊 + toggle)
