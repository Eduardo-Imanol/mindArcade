---
name: impeccable
description: Estándar de calidad impecable, cero warnings, código limpio, revisión adversarial y definition of done.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: quality-gate
  scope: mindArcade
---

# Impeccable — Puerta de calidad

## Definition of Done
- [ ] `npm test` verde, `lint` cero warnings.
- [ ] Sin `console.log` residual, sin TODO sin issue.
- [ ] Nombres claros, funciones <40 líneas, archivos <200.
- [ ] Accesible (teclado + contraste) y mobile 360px OK.
- [ ] Sin secrets, sin assets >200KB sin optimizar.
- [ ] Otra pasada adversarial: ¿rompe parser? ¿rompe loop? ¿rompe persistencia?

## Revisión obligatoria antes de cerrar
1. Corre tests de `game-logic-testing`.
2. Juega 1 sesión completa en 360px + teclado.
3. Revisa diff: ¿respeta `code-structure-modular`? ¿usa tokens de `ui-design-system`?
4. Audio con toggle, animación con reduced-motion.
5. Commit convencional según `git-deployment-pipeline`.

## Anti-patrones que bloquean
Duplicar lógica entre juegos, estado global suelto, rAF múltiple, hex fuera de tokens, `any` sin justificar.

## Cuándo usar
Al final de CUALQUIER tarea, como gate previo a commit.
