---
name: code-structure-modular
description: Estructura modular para mindArcade, separación por dominios, mini-juegos aislados, imports limpios y escalabilidad web.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: architecture
  scope: mindArcade
---

# Code Structure Modular — mindArcade

## Qué hace
Define cómo organizar el proyecto para que cada mini-juego, tópico y sistema sea independiente y reutilizable.

## Estructura obligatoria
```
/src
  /core          # game-loop, state, parser, router
  /games         # un folder por mini-juego: quiz/, memory/, puzzle/
    /quiz/{QuizGame.js, quiz.css, quiz.test.js}
  /topics        # parser + datos: topics/*.md o *.json
  /ui            # design-system: Button.js, Card.js, Modal.js
  /audio         # fx-manager
  /utils
  /state         # store + persistence
```

## Reglas
1. **Un módulo = una responsabilidad.** Nada de `utils.js` gigante. Máx 200 líneas por archivo.
2. **Cada juego expone la misma interfaz:**
```js
export default { id:'quiz', init(ctx), start(), update(dt), destroy() }
```
3. **Prohibido importar entre juegos.** Solo desde `/core` y `/ui`.
4. **Barrel files:** cada carpeta con `index.js` que exporta lo público.
5. **Sin circulares:** si necesitas circular, extrae a `/core`.

## Cuándo usar
Al crear archivos, mover código, o si un import cruza `games/X -> games/Y`.
