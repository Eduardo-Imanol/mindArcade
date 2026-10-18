---
name: game-loop-architecture
description: Game loop con requestAnimationFrame, delta time, estados init-playing-paused-over y pausa en hidden tab.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: gameloop
  scope: mindArcade
---

# Game Loop Architecture

## Loop estándar
```js
// src/core/loop.js
let raf=0, last=0, running=false, current=null;
export function setGame(g){ current?.destroy?.(); current=g; current?.init?.() }
export function start(){ if(running) return; running=true; last=performance.now(); raf=requestAnimationFrame(tick) }
export function stop(){ running=false; cancelAnimationFrame(raf) }
function tick(t){
  if(!running) return;
  const dt=Math.min((t-last)/1000, 0.05); last=t;
  current?.update?.(dt); current?.render?.();
  raf=requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',()=>{ document.hidden?stop():start() });
```

## Estados
`boot -> menu -> playing <-> paused -> gameover`. Cada juego implementa `init/start/update/render/pause/destroy`.

## Reglas
1. **Un solo rAF global.** Prohibido un rAF por juego/componente.
2. **dt en segundos, clamp 50ms** para evitar saltos al volver de background.
3. **Limpieza obligatoria** en `destroy()`: cancelar timers, listeners, audio.
4. **Pausa automática** en `visibilitychange` y blur.
5. **Lógica en update, dibujo en render.** Nunca mezclar.

## Cuándo usar
Al crear/modificar cualquier mini-juego o animación continua.
