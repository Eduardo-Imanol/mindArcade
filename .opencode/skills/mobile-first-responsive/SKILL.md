---
name: mobile-first-responsive
description: Diseño mobile-first para mindArcade, touch grande, viewport seguro y layouts que escalan a desktop.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: responsive
  scope: mindArcade
---

# Mobile First Responsive

## Base
```css
/* base 360px, luego sube */
.game-board{ display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:16px }
@media(min-width:768px){ .game-board{grid-template-columns:repeat(4,1fr); max-width:900px; margin:auto} }
```

## Reglas
1. **Diseña 360x640 primero.** Desktop es mejora, no base.
2. Touch targets ≥44px, gap ≥12px, sin hover como única vía.
3. `meta viewport`, `touch-action:manipulation`, `user-scalable` accesible.
4. Safe-area: `padding-env(safe-area-inset-*)` en HUD y botones bajos.
5. Breakpoints solo 2: 768px y 1024px. Nada de 5 breakpoints.
6. Test táctil: jugar una sesión completa solo con pulgares.

## Cuándo usar
Al maquetar boards, grids de memoria, quiz o HUD.
