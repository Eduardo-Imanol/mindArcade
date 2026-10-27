# Manual a11y checklist (AC-7) — run before closing a spec

Automated coverage lives in `Flashcards.a11y.test.jsx`, `Memorama.a11y.test.jsx`,
`Ahorcado.a11y.test.jsx`, `QuizSignificado.a11y.test.jsx`, `Intruso.a11y.test.jsx`,
`LluviaMeteoros.a11y.test.jsx`, `ConectaPares.a11y.test.jsx`,
`SerpienteSignificados.a11y.test.jsx`, `serpiente-significados.isolation.test.js`,
`TopicsHub.test.jsx`, `TopicsHub.a11y.test.jsx`, `TopicView.test.jsx`,
`TopicView.availability.test.jsx`, `TopicView.a11y.test.jsx`, `SourceReader.test.jsx`,
`SourceReader.a11y.test.jsx`, `Dashboard.test.jsx`, `Dashboard.a11y.test.jsx`,
`CardImage.test.jsx`, `tts.integration.test.jsx`, `design-system.test.js` (spec-13 gate)
and `title.test.js`;
jsdom cannot measure layout, so this checklist is completed by a human on a real
browser (Chrome/Firefox, touch + keyboard). The automated suites cover native
controls/labels, `role="progressbar"` values, no `line-clamp`/ellipsis on the topic
description, 44 px target CSS, focus-visible and `prefers-reduced-motion`; the
360 px no-horizontal-scroll contract is checked here manually plus CSS regexes.

## Setup
- [ ] `npm run dev`, open at 360×640 (DevTools device mode) then 1280×800.
- [ ] Keyboard only (no mouse): Tab, Shift+Tab, Enter, Space.

## Hub (`#/`)
- [ ] Tab reaches "Crear tema"; Enter opens the modal.
- [ ] Every category card is a native link reachable with Enter; visible focus ring.
- [ ] No horizontal scroll at 360px; touch targets ≥44px.
- [ ] (spec-17) Header shows "Biblioteca"/"Progreso" and **not** "Sepect".
- [ ] (spec-17) Se ven las cuatro categorías: Programación, Idiomas, Universidad y Mis temas.
      Idiomas/Universidad muestran «Próximamente» sin enlaces rotos.
- [ ] (spec-17) Cada tarjeta con contenido muestra temas, cartas y una barra de progreso
      con `role="progressbar"` + `aria-valuenow`; Mis temas refleja los temas custom.
- [ ] Cada tarjeta muestra una imagen representativa decorativa (`alt=""`) de 720×405,
      sin romper la rejilla ni provocar scroll horizontal a 360px.
- [ ] (spec-17) "Progreso" es accesible por teclado y abre `#/progreso`.

## Category view (`#/categoria/:id`)
- [ ] (spec-17) La cabecera permite volver a la biblioteca con un enlace nativo.
- [ ] (spec-17) Programación muestra Módulo 1 y Módulo 2 en orden; ambos empiezan
      cerrados y cada cabecera es un botón con `aria-expanded` y `aria-controls`.
- [ ] Cada módulo se abre/cierra con Enter o Espacio; «Abrir módulos»/«Cerrar módulos»
      abre o cierra todos; el panel cerrado usa `hidden`.
- [ ] Con un módulo abierto, cada tema es un enlace nativo a `#/tema/:id` con cartas,
      aprendidas y días de estudio.
- [ ] La búsqueda y los filtros (orden por recientes/antiguos/nombre/cartas/progreso y
      estado) muestran una lista plana sin módulos; en categorías con módulos
      «Por módulos» es el orden inicial y «Limpiar filtros» restaura la vista.
- [ ] Mis temas usa «Recientes» por defecto y no ofrece «Por módulos».
- [ ] Categoría desconocida → 404; categoría sin contenido → «Próximamente».
- [ ] Mis temas lista los temas custom en una rejilla plana; vacío → CTA a la biblioteca.
- [ ] Sin scroll horizontal a 360px; foco visible y targets ≥44px.
- [ ] `prefers-reduced-motion` desactiva las transiciones de tarjetas y chevrons.

## Create-topic modal
- [ ] Paste MD → card preview appears; counts ("N cartas válidas · N líneas ignoradas") announced.
- [ ] Tab reaches título, Markdown, each emoji button, URL field, "Subir imagen", Guardar, Cancelar.
- [ ] URL field shows focus ring; emoji suggestion applies on Enter.
- [ ] Save with 0 valid cards shows the error message and does not close.
- [ ] Reopen the topic after reload: overrides applied in the modal preview.

## Topic view (`#/tema/:id`)
- [ ] Only available games are focusable/openable; `soon` tiles are skipped or announced "Próximamente".
- [ ] Games below `minCards` are disabled and announce "Necesitas al menos N cartas".
- [ ] Screen reader announces headings and card count.
- [ ] (spec-12) The full topic description is visible, with paragraph breaks; no
      `line-clamp`, ellipsis or max-height truncation.
- [ ] (spec-12) Header shows learned/pending counts, progress and days studied.
- [ ] (spec-12) Each game tile shows **only** title + topic cover + status/CTA; no game
      or topic description is rendered inside the tile.
- [ ] (spec-12) The cover is decorative (`alt=""`); status text is not conveyed by color
      alone ("Jugar ahora", "Próximamente", "Necesitas N cartas").
- [ ] (spec-12) With no eligible cards the view announces «Todo al día» and does not
      mount the game; the safe screen keeps "Volver al tema" reachable.
- [ ] (spec-12) Direct URL with too few **eligible** cards shows the safe screen.

## Source reader (`#/tema/:id/fuente`, spec-19)
- [ ] Topic view shows "Leer documento original" only for built-in topics with a source; custom topics and missing sources show no link.
- [ ] The reader opens by keyboard/Enter, updates the title to `Sepect — Fuente: <tema>`, and survives reload and Back.
- [ ] Breadcrumb "Volver al tema" is a native link with a visible focus ring; one page `h1` names the topic.
- [ ] The document renders headings, paragraphs, lists, quotes, rules and code blocks in order; no content is truncated.
- [ ] Keyboard: Tab reaches Leer, Pausar, Reanudar, Detener and the global sound toggle; disabled buttons are skipped.
- [ ] Screen reader announces the `aria-live` status ("Listo para leer", "Leyendo en voz alta", "Lectura en pausa", "Sonido silenciado") without repeats.
- [ ] TTS reads headings, paragraphs and list items in order; code blocks are rendered but not spoken; long text finishes without truncation.
- [ ] Selecting text inside the document reads only that fragment after a short pause; «Leer selección» repeats it; Detener/mute/navigation cancel it; an empty selection emits no audio.
- [ ] Pausar/Reanudar keeps the current fragment; Detener, mute, navigation and unmount cancel speech with no orphaned utterances.
- [ ] With `speechSynthesis` unavailable the controls are hidden and an accessible notice remains; the document stays readable.
- [ ] Loading, empty and error states are announced (`role="status"`/`role="alert"`) and keep the way back to the topic.
- [ ] No horizontal scroll at 360px; long words wrap, code scrolls inside its block; targets ≥44px; `prefers-reduced-motion` disables the pulse/shimmer.

## Dashboard (`#/progreso`, spec-12)
- [ ] Reachable from the hub and from a topic; the route survives reload.
- [ ] Keyboard order: back/hub → KPI section → topic cards → activity; visible focus ring.
- [ ] KPIs (aprendidas, pendientes, precisión, racha, XP) are text, not color-only.
- [ ] Each topic card shows cover (`alt=""`), progress bar with `role="progressbar"` +
      `aria-valuenow`, counts, days studied and last session; links to the topic.
- [ ] 14-day activity has a text alternative (e.g. "N sesiones en los últimos 14 días")
      and does not rely on color alone; days with 0 are represented.
- [ ] Empty state (no topics/no history) is readable and announces what to do next.
- [ ] No horizontal scroll at 360px; touch targets ≥44px; `prefers-reduced-motion`
      disables bar animations without hiding values.

## Flashcards
- [ ] Space/Enter flips; click/tap flips; back text is read via aria-live.
- [ ] Grade buttons appear after flip; Tab order: Salir → carta → grades → nav.
- [ ] Every card image shows (asset/emoji/fallback) and has meaningful alt text; broken image never shows a broken icon.
- [ ] Session summary and "Volver al tema" reachable by keyboard.
- [ ] No horizontal scroll at 360px; targets ≥44px; `prefers-reduced-motion` respected (no animation loops).

## Memorama
- [ ] Difficulty ladder (Fácil/Medio/Difícil) reachable by Tab; Enter/Space starts a board.
- [ ] Each tile is a focusable `<button>`; Tab visits tiles in order; visible `--neon-green` focus ring.
- [ ] Enter/Space on a tile flips it; a matched pair stays face up with an accessible label ending "Emparejada".
- [ ] Pair result and "no coinciden" announcement appear in the `aria-live` region and are NOT re-announced stale after a later mismatch resolves.
- [ ] Revealed tile exposes a "🔊 Escuchar …" button reachable by keyboard; nothing plays automatically without a user gesture (autoplay policy).
- [ ] Board fits without horizontal scroll at 360px (≥4 columns); reaches 8 columns inside the centered ~960px stage (`.game-stage`) on a full-width desktop container (no side gutters).
- [ ] `prefers-reduced-motion` → flip is instant (no transition).
- [ ] Without `speechSynthesis` (or with sound muted) all 🔊 controls are hidden and the game is fully playable.

## Ahorcado
- [ ] Setup: native labelled rounds `<select>` (3–10, default 10) reachable by Tab; Enter/Space on "Empezar" starts; "Salir" and sound toggle reachable.
- [ ] Round: the 27 letter buttons (A–Z + Ñ) are reachable by Tab; Enter/Space guesses; the physical keyboard also plays letters (including `ñ`).
- [ ] Used letters are disabled and their accessible name includes "usada (acierto|fallo)"; focus ring uses `--neon-green`.
- [ ] `aria-live` announces mistakes/attempts remaining, round result and the revealed word on loss, without stale repeats.
- [ ] Word boxes reveal the original characters (accents/Ñ preserved) and spaces stay visible; no horizontal scroll at 360px; targets ≥44px.
- [ ] "🔊 Pista" repeats the hint after the round starts; global sound toggle works; without `speechSynthesis` all 🔊 controls are hidden and the game is fully playable.
- [ ] Result screen: "Siguiente ronda", "Ver resumen" and "Jugar de nuevo"/"Volver al tema" reachable by keyboard.
- [ ] `prefers-reduced-motion` → no hangman part-entry animation nor alarm pulse.

## Elige el significado
- [ ] Setup: native labelled rounds `<select>` (3–10, default 10) reachable by Tab; sound toggle and "Salir" reachable; "Empezar" starts with a user gesture.
- [ ] Round: question stays at the top as text (no image); four meaning cards form a 2×2 grid, each with a decorative image and a native `<button>` option labelled "Opción N: <significado>".
- [ ] First wrong answer turns red and is disabled; a second wrong answer or a correct answer reveals the correct option in green and shows "Siguiente".
- [ ] `aria-live` announces correct/incorrect, remaining attempt and the correct answer without stale repeats.
- [ ] Keyboard: Tab/Shift+Tab reach every option, question 🔊, "Siguiente", "Salir" and sound toggle; Enter/Space activate; focus ring uses `--neon-green`.
- [ ] 2×2 grid fits without horizontal scroll at 360px; long meanings wrap (no truncation); targets ≥44px.
- [ ] TTS: question is read at round start, 🔊 repeats it, selecting an option reads its meaning and "🔊 Respuesta" reads the correct meaning; global mute works.
- [ ] Without `speechSynthesis` all 🔊 controls are hidden and the game is fully playable.
- [ ] `prefers-reduced-motion` → no transitions/animations.

## El intruso
- [ ] Topic view: with only one eligible topic, the "El intruso" tile is disabled and announces "En mantenimiento · agrega otro tema con al menos 3 cartas"; with two topics of ≥3 cards it becomes a "Jugar ahora" link.
- [ ] Direct URL below `minCards` or without the second eligible topic shows the safe screen and "Volver al tema"; the game never loads in that state.
- [ ] Setup: native labelled rounds `<select>` (3–10, default 10) reachable by Tab; sound toggle, "Empezar" and "Salir" reachable; "Empezar" starts with a user gesture.
- [ ] Round: prompt shows the anchor topic title; four meaning buttons form a 2×2 grid with a decorative image and an accessible name "Opción N: <significado>"; no `front` is exposed before answering.
- [ ] One attempt: a wrong base turns red, the intruder turns green, its topic is revealed, every option is disabled and "Siguiente" appears; a correct pick announces "¡Correcto!".
- [ ] `aria-live` announces the round, the result and the intruder topic without stale repeats after "Siguiente".
- [ ] Keyboard: Tab/Shift+Tab reach every option, question 🔊, "Siguiente", "Salir" and sound toggle; Enter/Space activate; focus ring uses `--neon-green`.
- [ ] 2×2 grid fits without horizontal scroll at 360px; long meanings wrap; targets ≥44px.
- [ ] TTS: the prompt is read at round start, 🔊 "Pregunta" repeats it, selecting an option reads its meaning and 🔊 "Intruso" reads the revealed intruder; global mute works.
- [ ] Without `speechSynthesis` all 🔊 controls are hidden and the game is fully playable.
- [ ] `prefers-reduced-motion` → no transitions/animations.

## Lluvia de meteoros
- [ ] Topic view: with fewer than 6 cards the tile is disabled and announces «Necesitas al menos 6 cartas»; with 6+ it becomes a "Jugar ahora" link. Direct URL below `minCards` shows the safe screen.
- [ ] Setup: native labelled rounds `<select>` (3–10, default 8); difficulty (Tranquilo/Normal/Arcade) and rhythm (Manual/Auto/Supervivencia) are native buttons with `aria-pressed`; sound toggle, "Empezar" and "Salir" reachable by keyboard.
- [ ] Round: a short prompt travels in the capsule under the meteor; ≥73 graphemes, line breaks or tokens >30 characters switch to the fixed radar panel with the full text (internal scroll for 500+ characters). No ellipsis anywhere.
- [ ] Exactly three option buttons labelled "Opción N: <significado>"; keys 1/2/3 answer; one attempt disables all three and reveals the correct option in green with ✓ + text (wrong pick magenta with ✗ + text).
- [ ] `aria-live="polite"` announces "Meteoro N de M: <front>" and the result, without stale repeats after "Siguiente".
- [ ] Focus: start/next → first option; feedback → "Siguiente"; pause → "Continuar"; completion → summary heading; visible `--neon-green` ring.
- [ ] Pause button and hidden tab freeze the fall, elapsed time and the auto-advance countdown; "Continuar" resumes explicitly.
- [ ] Manual waits for "Siguiente"; Auto shows the countdown and advances after 2.5 s (early "Siguiente" works); Supervivencia shows 3 lives, auto-advances and ends at 0 lives without grading unshown rounds.
- [ ] TTS: the prompt is read when each meteor appears; 🔊 "Pregunta" repeats it; choosing reads the chosen meaning; on a miss the correct meaning is read after it finishes; 🔊 "Respuesta" repeats it; global mute works; without `speechSynthesis` all 🔊 controls are hidden.
- [ ] Exit mid-meteor emits only the current card as `otra-vez`; exit after answering does not re-emit; summary shows score, hits, fails, best streak and XP; "Jugar de nuevo" returns to setup with the last settings.
- [ ] 360px: no horizontal scroll; options stacked; long prompts, status and feedback wrap (`overflow-wrap:anywhere`) without ellipsis; targets ≥44px.
- [ ] `prefers-reduced-motion` → no falling transform, tail or shake; progress bar only; identical duration, rules and score.

## Conecta pregunta–significado
- [ ] Topic view: with fewer than 3 cards the tile is disabled and announces «Necesitas al menos 3 cartas»; with 3+ it becomes a "Jugar ahora" link. Direct URL below `minCards` shows the safe screen.
- [ ] Setup: native labelled pairs `<select>` (3..min(10, disponibles), default min(8, disponibles)) reachable by Tab; sound toggle, "Empezar" and "Salir" reachable; the available-pairs note is visible; no images are rendered even if the cards define `image`.
- [ ] Board: two labelled columns («Preguntas» and «Significados»); every card is a native `<button>` with an accessible name «Pregunta/Significado N de M: <texto>», reachable in visual order by Tab/Shift+Tab; focus ring uses `--neon-green`.
- [ ] Selection works from either column: first click selects (`aria-pressed="true"`), same card deselects, same column replaces, opposite column resolves; `Escape` clears the selection; matched cards are disabled and cannot be selected.
- [ ] Correct pair: both cards lock, show a unique color + pair number, an SVG line appears between the question's right edge and the meaning's left edge (never capturing clicks), and the `aria-live` region announces the correct pair; focus moves to the next unmatched question.
- [ ] Wrong pair: both cards turn red, the error counter increases, no line is drawn, the `aria-live` region announces the mismatch, and both cards remain available for retry. Attribution is always to the question card.
- [ ] `aria-live` announcements (selection, correct, wrong, completion) do not repeat stale messages after the next selection.
- [ ] Completion: summary heading receives focus; summary shows matched pairs, errors, first-try hits and local XP; "Jugar de nuevo" returns to setup with the last pair count and "Volver al tema" exits; both reachable by keyboard.
- [ ] TTS: selecting a question reads its `front`, selecting a meaning reads its `back`, and a correct pair reads «front». «back»; the selection bar shows the active text and a 🔊 repeat button; `<SoundToggle />` is available in setup, board and summary; global mute works.
- [ ] Exiting mid-game stops speech and emits `otra-vez` only for unmatched cards; exiting after completion or from setup emits nothing.
- [ ] 360px: no horizontal scroll, both columns remain visible, long texts/URLs wrap (`overflow-wrap:anywhere`, `hyphens:auto`) without ellipsis, and targets are ≥44px.
- [ ] Resize, orientation change and late fonts reflow recalculate the lines without losing the session or the matched pairs.
- [ ] `prefers-reduced-motion` → no line animation, shake or decorative transitions; rules, order and scoring remain identical.
- [ ] Without `speechSynthesis` all 🔊 controls are hidden and the game is fully playable.


## Serpiente de significados
- [ ] Topic view: with fewer than 4 cards the tile is disabled and announces «Necesitas al menos 4 cartas»; with 4+ it is a "Jugar ahora" link. Direct URL below `minCards` shows the safe screen.
- [ ] Setup: Modo (Rondas/Supervivencia) and Dificultad (Tranquilo/Normal/Arcade) are native buttons with `aria-pressed`; the rounds selector (4–10, default 8) appears only in Rondas; the note shows mode, available cards, board size and step speed; sound toggle, "Empezar" and "Salir" are reachable by keyboard.
- [ ] Round: the prompt shows the full `front` + `CardImage`; the board has exactly 3 apples numbered 1–3 without meanings; the legend lists the 3 number→`back` rows with the same colors; eaten rows show «✕ Comida» and the correct one «✓ Correcta» (color + icon + text).
- [ ] Keyboard: arrows/WASD move on desktop; the mobile D-pad has 4 buttons ≥48 px labelled «Mover arriba/abajo/izquierda/derecha» and sits directly under the board; the board does not steal focus and Tab reaches pause/exit/sound controls.
- [ ] Pause: «Pausa», `Escape` and a hidden tab pause the game; a labelled modal keeps focus on «Continuar» (Tab cycles inside); resuming is explicit.
- [ ] Correct apple: the snake grows 1 segment, Rondas adds 100 points, feedback lasts ~1.4 s, the back is read by TTS and the next round starts; the legend marks the correct row.
- [ ] Wrong apple: loses 1 life, grows 3 segments, removes that apple from the board, resets the streak, stays in the same round and reads the back; with 0 lives the game ends.
- [ ] Collision: loses 1 life, respawns near the centre with length 2, keeps the round/apples/progress; 0 lives or no safe cell ends the game with the current round `otra-vez` and does not grade unshown rounds.
- [ ] `aria-live` announces the round, result, remaining lives and the end without stale messages; the summary heading receives focus.
- [ ] TTS: the prompt is read at round start; eating any apple reads its back; collision and game over announce the event; 🔊 «Pregunta» and one 🔊 per legend row repeat the text; `<SoundToggle />` is present in setup, game and summary; mute is respected; speech stops on pause/exit/unmount; without `speechSynthesis` all 🔊 controls are hidden and the game is fully playable.
- [ ] 360 px: no horizontal scroll; prompt and legend wrap completely (`overflow-wrap:anywhere`, `hyphens:auto`); the board is centered and ≤480 px on desktop; its cell count stays fixed on resize (only scales visually).
- [ ] Summary: Rondas shows points, hits, fails, first-try hits, best streak, lives and local XP; Supervivencia shows final length, hits, fails, best streak and XP; "Jugar de nuevo" keeps mode/difficulty/rounds and "Volver al tema" exits; both are keyboard reachable.
- [ ] `prefers-reduced-motion` → no apple pulse/animation; rules, speed and scoring are identical.

## Spec-13 — impeccable UI retouch
- [ ] Create-topic modal: Tab/Shift+Tab stay trapped inside; Escape closes; clicking the
      backdrop closes; body scroll is locked while open; focus returns to «Crear tema».
- [ ] All buttons/inputs show the visible focus ring; `.btn-neon` hover/active feel right.
- [ ] Search field: the ✕ clear button never overlaps the typed text at 360px.
- [ ] Serpiente setup select looks styled like the quiz one (border/background/radius).
- [ ] No horizontal scroll at 360px in hub, topic, game and error screens; `html`/`body`
      show the app background while overscrolling (iOS-style).
- [ ] Error/404 screens (`NotFound`, GameHost guards) keep the h1→p→action rhythm.
- [ ] Browser tab title follows the route (Biblioteca / Categoría / Progreso / tema / juego / 404).
- [ ] Sound toggle in the header and in-game stay in sync; mute persists after reload.
- [ ] `prefers-reduced-motion` → `.btn-neon` and modal transitions are instant.

## Spec-15 — PWA instalable + carátula
- [ ] Hub: la carátula (`img.hub-cover`) aparece bajo la cabecera, con `alt` descriptivo, `width`/`height` 1200×630 y sin desplazamiento horizontal a 360px; no duplica el `h1` ni añade texto navegable.
- [ ] La carátula no tapa ni desplaza los controles del hub en 360px ni en escritorio; el orden de tabulación sigue siendo cabecera → acciones → categorías.
- [ ] Con lector de pantalla, la carátula se anuncia como imagen con su descripción y no como texto suelto.
- [ ] Chrome (escritorio y Android): aparece la opción «Instalar» con el icono propio del arcade (no el «N» de Netlify); el nombre instalado es «Sepect — Arcade de aprendizaje».
- [ ] Instalado, la app abre a pantalla completa (`display: standalone`), arranca sin conexión y conserva la portada/carátula.
- [ ] `manifest.webmanifest` responde `Content-Type: application/manifest+json` (verificar en DevTools → Network) y el service worker se registra en producción (DevTools → Application → Service Workers).
- [ ] La pantalla «Añadir a pantalla de inicio» en iOS muestra la carátula/imagen propia (apple-touch-icon 180×180).

## Screen reader pass (VoiceOver/TalkBack or NVDA)
- [ ] Dialog opens with content reachable; Cerrar and Cancelar both work.
- [ ] Grade + XP summary announced on completion.
