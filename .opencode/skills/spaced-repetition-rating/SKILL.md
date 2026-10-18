---
name: spaced-repetition-rating
description: Repetición espaciada SM-2 simplificada y rating Elo por pregunta para priorizar repaso en mindArcade.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: learning-algorithm
  scope: mindArcade
---

# Spaced Repetition + Rating

## Algoritmo SM-2 simplificado
```js
// src/core/srs.js
export function nextReview(card, quality /*0-5*/){
  if(quality<3){ card.reps=0; card.interval=1; }
  else{
    card.reps++;
    card.ef=Math.max(1.3, (card.ef||2.5)+(0.1-(5-quality)*(0.08+(5-quality)*0.02)));
    card.interval= card.reps===1?1 : card.reps===2?6 : Math.round(card.interval*card.ef);
  }
  card.due=Date.now()+card.interval*864e5;
  return card;
}
```

## Rating de pregunta
- Cada pregunta tiene `rating` 800-2000. Acierto sube, fallo baja (K=32).
- Orden de quiz: `due` vencidas primero, luego rating cercano al nivel del jugador.

## Reglas
1. `quality`: 5 perfecto, 4 duda, 3 difícil, 0-2 fallo.
2. Nunca mostrar misma carta 2 veces seguidas en una sesión.
3. Persistir `reps, ef, interval, due` por `topic:q-hash`.
4. XP bonus x1.5 si repasas carta vencida.

## Cuándo usar
Al ordenar preguntas, programar repasos o calcular XP.
