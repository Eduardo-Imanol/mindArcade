---
name: user-history-analytics
description: Historial de sesiones y analítica local de progreso, precisión, rachas y tópicos débiles en mindArcade.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: analytics
  scope: mindArcade
---

# User History Analytics

## Evento estándar
```js
// src/state/history.js
export function logSession({gameId, topic, score, accuracy, timeMs}){
  const db=store.get();
  db.history.push({t:Date.now(), gameId, topic, score, accuracy, timeMs});
  store.set({history:db.history.slice(-500)}); // tope 500
}
export function statsByTopic(topic){
  const h=store.get().history.filter(s=>s.topic===topic);
  const acc=h.reduce((a,s)=>a+s.accuracy,0)/(h.length||1);
  return {plays:h.length, accuracy:acc, best:Math.max(...h.map(s=>s.score),0)};
}
```

## Métricas mínimas
- `plays`, `accuracy`, `bestScore`, `avgTime`, `streak`, `weakTopics[]` (accuracy < 60%).

## Reglas
1. **Local-first:** sin backend, todo en IndexedDB/localStorage. Sin tracking externo.
2. **Tope 500 sesiones**, agrega el resto a resumen mensual.
3. **Tópico débil = accuracy <60% en 3+ plays** → sugerir repaso.
4. Dashboard lee solo de `history.js`, nunca calcula inline.
5. Privacidad: export/borrar historial en settings.

## Cuándo usar
Al mostrar progreso, rachas, estadísticas o recomendar repaso.
