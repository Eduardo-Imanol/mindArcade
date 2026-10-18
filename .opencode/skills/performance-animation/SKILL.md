---
name: performance-animation
description: Animaciones 60fps con transform y opacity, canvas eficiente y presupuesto de rendimiento mindArcade.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: performance
  scope: mindArcade
---

# Performance + Animation

## Reglas de oro
1. **Solo `transform` y `opacity`.** Nunca animar `width/top/left/margin`.
2. `will-change` solo en el elemento animado y quítalo al terminar.
3. Canvas: batch draws, evita gradients por frame, reutiliza paths.
4. Presupuesto: <50ms JS por frame, <100KB JS inicial, imágenes WebP + lazy.
5. `prefers-reduced-motion`: desactiva shake/confetti, deja fade.

```css
@media (prefers-reduced-motion: reduce){ *{animation:none!important; transition:none!important} }
.pop{ animation:pop .18s ease-out }
@keyframes pop{ from{transform:scale(.8)} to{transform:scale(1)} }
```

## Checklist
- [ ] Lighthouse perf >90 en móvil
- [ ] Sin layout thrash (lee luego escribe, usa rAF)
- [ ] Listas largas virtualizadas o paginadas
- [ ] Debounce resize/scroll/input

## Cuándo usar
Al añadir animaciones, confetti, transiciones o canvas.
