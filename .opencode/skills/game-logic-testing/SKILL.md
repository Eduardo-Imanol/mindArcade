---
name: game-logic-testing
description: Testing de lógica de juegos con asserts simples, seeds fijos y cobertura de parser, scoring y SRS.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: testing
  scope: mindArcade
---

# Game Logic Testing

## Harness mínimo (sin deps)
```js
// tests/run.js
let pass=0, fail=0;
export function test(n,fn){ try{fn(); pass++; console.log('ok',n)}catch(e){fail++; console.error('FAIL',n,e.message)} }
export function eq(a,b){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error(`${a} !== ${b}`) }
```

## Qué testear siempre
1. `parser`: entrada válida/inválida, XSS, 3+ opciones.
2. `scoring`: combo, bonus tiempo, clamp negativo.
3. `srs.nextReview`: quality 0 resetea, quality 5 espacia.
4. `loop`: dt clamp 50ms, destroy limpia listeners.
5. Cada juego: `start->update->getScore` sin DOM (mock ctx).

## Reglas
- Seed fijo para shuffle en tests (`Math.random=()=>0.5`).
- `npm test` corre todo en <5s, sin navegador.
- Nuevo juego sin test = no merge.
- Fallo de parser nunca rompe el juego, solo warn.

## Cuándo usar
Al crear lógica de juego, parser, scoring o SRS.
