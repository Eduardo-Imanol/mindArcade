---
name: p5js-interactive-canvas
description: Gráficos interactivos mindArcade con Canvas nativo por defecto y p5.js opcional, responsivo touch+mouse, partículas y minijuegos educativos.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: interactive-graphics
  scope: mindArcade
---

# P5.js Interactive Canvas — mindArcade

## Propósito
Enseñar a generar minijuegos educativos interactivos (flashcards, puzzles drag-drop,
barras de progreso dinámicas, partículas al acertar) con código limpio, sin assets
pesados ni APIs de pago. Todo generado con matemáticas, formas, texto vectorial y Canvas.

**Decisión por defecto:** Canvas nativo (0 KB extra). p5.js solo si el juego necesita
dibujo generativo rápido y aceptas ~1 MB extra. Esta skill cubre ambos con la misma API.

## Cuándo usar
- "crea un minijuego visual", "canvas interactivo", "dibujar/arrastrar", "partículas",
  "flashcard interactiva", "puzzle visual".
- Combinar siempre con: `game-loop-architecture` (un solo rAF),
  `mini-game-templates` (interfaz común), `performance-animation`,
  `mobile-first-responsive`, `accessibility-a11y`, `audio-fx-integration`.

## Reglas técnicas (obligatorias)
1. **Un solo rAF global** (`src/core/loop.js`). El canvas NUNCA crea su propio
   `requestAnimationFrame` ni `setInterval` permanente. Recibe `update(dt)/render(ctx)`.
2. **React = modo instancia.** Si usas p5 con React, SIEMPRE instance mode + cleanup:
   ```js
   useEffect(()=>{ const p = new p5(sketch, ref.current); return ()=>p.remove(); },[])
   ```
   Nunca p5 en modo global (`window.setup`) dentro de React.
3. **Vanilla = funciones limpias.** `createSketch({setup,draw,onPointer})`, sin globales.
4. **Responsivo real:**
   - `resize()` recalcula `canvas.width = clientWidth * dpr` (dpr clamp 2).
   - `touch-action:none` solo sobre el canvas, `preventDefault` en touchmove.
   - Unifica eventos: `pointerdown/move/up` cubre mouse+táctil. No dupliques mouse+touch.
5. **Cero assets pesados.** Prohibido PNG/JPG >50KB, fuentes externas bloqueantes o
   APIs de pago. Formas, gradientes por código, texto del sistema.
6. **Performance:** solo `transform/opacity` en DOM, en Canvas bachea draws,
   evita `shadowBlur` y gradientes por frame, pool de partículas (máx 300).
   Respeta `prefers-reduced-motion` (partículas → fade simple).
7. **Accesibilidad:** cada canvas tiene fallback teclado (botones 1-4 / flechas),
   `aria-label`, `role=img` + `<div aria-live>` con resultado. Nunca solo-color.
8. **Ciclo de vida:** `destroy()` remueve listeners, cancela rAF si es propio y
   llama `p.remove()` / `ctx.reset()`. Sin leaks entre juegos.

## Estructura de ejemplo — Loop básico

### A) Nativo (por defecto, recomendado)
```js
// setup() una vez, draw(ctx, dt) cada frame
export function setup(canvas, opts){
  const dpr = Math.min(devicePixelRatio||1, 2);
  canvas.width = canvas.clientWidth*dpr;
  canvas.height = canvas.clientHeight*dpr;
  return { w:canvas.width, h:canvas.height, dpr };
}
export function draw(ctx, s, t){
  ctx.clearRect(0,0,s.w,s.h);
  ctx.fillStyle='#00f5d4';
  ctx.beginPath(); ctx.arc(s.w/2, s.h/2, 40+10*Math.sin(t), 0, 7); ctx.fill();
}
```

### B) p5 instance mode (opcional, React)
```js
import p5 from 'p5';
export const sketch = (p)=>{
  let x=0;
  p.setup=()=>{ p.createCanvas(360,640); };
  p.draw=()=>{ p.background(13,13,26); p.circle(x=(x+2)%360, 320, 50); };
  p.touchStarted=()=>{ /* tap */ };
};
```

## Componente base
Usa `src/ui/InteractiveGameCanvas.jsx` (React) o `src/ui/InteractiveGameCanvas.js`
(vanilla). Ambos exponen: `init/start/update/render/pause/destroy + getScore`,
capturan pointer, escalan por DPR y emiten `{score,timeMs,accuracy}` al terminar.

## Plantillas por tipo
- **Flashcard interactiva:** carta que rota con drag (translateX), suelta >80px = sé/no-sé.
- **Puzzle drag-drop:** piezas en array `{x,y,home}`, hit-test distancia, snap <24px.
- **Progreso dinámico:** barra `lerp(ancho)` + texto vectorial, sin DOM por frame.
- **Partículas acierto:** pool reutilizado, gravedad simple, vida 600ms, `sfx.ok()`.

## Anti-patrones que bloquean (`impeccable`)
- rAF por componente, p5 global en React, canvas fijo 800x600 sin resize.
- `mousedown` + `touchstart` duplicados (doble disparo en móvil).
- Imágenes externas para lo que un `arc()/rect()` resuelve.
- Juego imposible sin mouse (sin fallback teclado/tap).

## Instalación
```bash
# Nativo: cero deps (recomendado)
# p5 opcional:
npm i p5
# o CDN en HTML nativo:
# <script src="https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js"></script>
```
