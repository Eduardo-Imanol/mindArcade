# Manual a11y checklist (AC-7) — run before closing a spec

Automated coverage lives in `Flashcards.a11y.test.jsx`, `TopicsHub.test.jsx`,
`TopicView.test.jsx` and `CardImage.test.jsx`; jsdom cannot measure layout, so this
checklist is completed by a human on a real browser (Chrome/Firefox, touch + keyboard).

## Setup
- [ ] `npm run dev`, open at 360×640 (DevTools device mode) then 1280×800.
- [ ] Keyboard only (no mouse): Tab, Shift+Tab, Enter, Space.

## Hub (`#/`)
- [ ] Tab reaches "Crear tema"; Enter opens the modal.
- [ ] Every topic card is reachable and activable with Enter; visible focus ring.
- [ ] No horizontal scroll at 360px; touch targets ≥44px.

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

## Screen reader pass (VoiceOver/TalkBack or NVDA)
- [ ] Dialog opens with content reachable; Cerrar and Cancelar both work.
- [ ] Grade + XP summary announced on completion.
