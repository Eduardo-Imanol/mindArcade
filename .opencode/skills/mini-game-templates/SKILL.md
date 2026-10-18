---
name: mini-game-templates
description: Plantillas para crear mini-juegos de mindArcade en minutos con interfaz común, scoring y dificultad.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: scaffolding
  scope: mindArcade
---

# Mini-Game Templates

## Interfaz que todo juego cumple
```js
export default {
  id: 'quiz', title:'Quiz Relámpago',
  init(ctx){}, start(config){}, update(dt){},
  pause(){}, resume(){}, destroy(){},
  getScore(){ return 0 }
}
```

## Plantilla base
```js
// src/games/_template/GameTemplate.js
export function createGame({onEnd}){
  let score=0, lives=3, level=1;
  return {
    id:'template', init(){}, start(diff){ level=diff },
    update(dt){}, addScore(p){ score+=p; onEnd?.({score}) },
    destroy(){}
  }
}
```

## Tipos soportados
- `quiz`: pregunta + 4 opciones + timer 15s
- `memory`: parejas, grid 4x4, movimientos mínimos
- `sequence`: Simon / repite patrón, velocidad creciente
- `puzzle`: ordena / arrastra, validación por parser

## Reglas
1. Nuevo juego = copiar `_template/`, renombrar, registrar en `src/games/registry.js`.
2. Dificultad 1-5 siempre parametrizada, nunca hardcodeada.
3. Todo juego reporta `{score, timeMs, accuracy, xp}` al terminar.
4. Duración sesión: 60-180s.

## Cuándo usar
Al pedir "crea un mini-juego", "nuevo juego de X".
