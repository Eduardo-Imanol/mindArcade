---
name: accessibility-a11y
description: Accesibilidad WCAG AA para mindArcade, teclado completo, lector de pantalla y contraste.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: a11y
  scope: mindArcade
---

# Accessibility A11y

## Mínimos no negociables
1. **Teclado:** todo jugable con Tab/Enter/Espacio/1-4/flechas. Focus visible neón.
2. **ARIA:** `role=button/dialog`, `aria-live=polite` para score/feedback, `aria-label` en iconos.
3. **Contraste 4.5:1** texto normal, 3:1 grande. No transmitir info solo por color.
4. **Timer accesible:** pausa extra +30s opcional, sin parpadeo >3/s.
5. **Tamaño texto** escala a 200% sin romper layout.

```html
<button class="btn" aria-label="Opción A: declaración mutable">A) let</button>
<div aria-live="polite" id="feedback"></div>
```

## Test
- Navega con solo teclado una partida completa.
- Pasa axe/lighthouse a11y 100.
- Lector (TalkBack/VoiceOver) anuncia pregunta, opciones y resultado.

## Cuándo usar
En cada UI, juego nuevo o modal.
