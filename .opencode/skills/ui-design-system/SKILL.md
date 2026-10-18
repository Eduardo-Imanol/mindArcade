---
name: ui-design-system
description: Sistema de diseño arcade oscuro neón para mindArcade, componentes Button Card Modal y tokens CSS.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: ui
  scope: mindArcade
---

# UI Design System

## Tokens
```css
:root{
  --bg:#0d0d1a; --surface:#1a1a2e; --neon:#00f5d4; --pink:#ff2e93;
  --text:#f1f1f1; --muted:#9a9ab0; --radius:12px; --font:'Outfit',system-ui;
}
```

## Componentes (una clase = un uso)
- `.btn`, `.btn-primary`, `.btn-ghost` — min-height 44px, focus ring neón.
- `.card` — surface + radius + borde sutil.
- `.modal-backdrop`, `.modal` — centrada, cierra con Esc.
- `.hud` — barra superior score/timer/vidas.
- `.toast` — feedback de acierto/fallo.

## Reglas
1. **Solo tokens.** Prohibido hex suelto fuera de `:root`.
2. Componentes en `/src/ui/`, estilos co-locados `Button.css`.
3. Feedback <100ms: press scale 0.97, acierto verde, fallo shake.
4. Modo oscuro por defecto, claro opcional.
5. Sin frameworks pesados: CSS vanilla + variables.

## Cuándo usar
Al crear pantallas, botones, HUD o modales.
