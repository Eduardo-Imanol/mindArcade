// src/ui/InteractiveGameCanvas.jsx
// Wrapper REACT (instance-mode). Usa Canvas nativo por defecto.
// p5 es OPCIONAL: pasa `p5sketch` + `p5` importado para activar modo p5.
// Requiere: npm i p5  (o CDN). Si no se pasa, usa motor nativo ligero.
//
//  import { InteractiveGameCanvas } from './InteractiveGameCanvas.jsx';
//  <InteractiveGameCanvas difficulty={2} onEnd={s=>console.log(s)} />
//
//  // Modo p5 opcional:
//  // import p5 from 'p5';
//  // <InteractiveGameCanvas p5={p5} p5sketch={(p)=>{ p.setup=()=>p.createCanvas(360,640); p.draw=()=>{...} }} />

import { useEffect, useRef } from 'react';
import { createGameCanvas } from './InteractiveGameCanvas.js';

export function InteractiveGameCanvas({
  difficulty = 2,
  onEnd = null,
  draw = null,       // (ctx, api) => void  — override del demo
  onPointer = null,  // ({type,x,y,pointer,burst,addScore}) => void
  p5 = null,         // clase p5 (opcional)
  p5sketch = null,   // (p) => void (opcional, instance mode)
  className = '',
  label = 'Minijuego interactivo. Toca o arrastra. También jugable con teclado.',
  style = {},
}) {
  const canvasRef = useRef(null);
  const holderRef = useRef(null);
  const apiRef = useRef(null);
  const p5Ref = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (p5 && p5sketch) {
      // --- Modo p5 instance (obligatorio en React, nunca global) ---
      p5Ref.current = new p5(p5sketch, holderRef.current);
      return () => { p5Ref.current?.remove(); p5Ref.current = null; };
    }

    // --- Modo nativo (por defecto, 0 deps) ---
    const api = createGameCanvas(canvas, { onEnd, draw: draw ?? undefined, onPointer });
    apiRef.current = api;
    api.init();
    api.start({ difficulty });

    // Fallback teclado mínimo (a11y): flechas mueven, Enter = tap
    const onKey = (e) => {
      const step = 12;
      const pt = api.pointer;
      if (e.key === 'ArrowLeft') pt.x -= step;
      else if (e.key === 'ArrowRight') pt.x += step;
      else if (e.key === 'ArrowUp') pt.y -= step;
      else if (e.key === 'ArrowDown') pt.y += step;
      else if (e.key === 'Enter' || e.key === ' ') {
        onPointer?.({ type: 'down', x: pt.x, y: pt.y, pointer: pt, burst: api.burst, addScore: api.addScore });
        api.burst(pt.x, pt.y);
      } else return;
      e.preventDefault();
    };
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', onKey);

    return () => {
      canvas.removeEventListener('keydown', onKey);
      api.destroy();
      apiRef.current = null;
    };
  }, [p5, p5sketch]);

  // Loop externo: si usas game-loop-architecture, llama api.update/render desde ahí.
  // Este rAF interno es solo demo autónoma; bórralo si integras al loop global.
  useEffect(() => {
    if (p5 && p5sketch) return;
    let raf = 0, last = performance.now();
    const tick = (t) => {
      const api = apiRef.current;
      if (api) {
        const dt = Math.min((t - last) / 1000, 0.05);
        last = t;
        api.update(dt);
        api.render(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p5, p5sketch]);

  return (
    <div ref={holderRef} style={{ width: '100%', maxWidth: 900, margin: '0 auto', ...style }}>
      {!(p5 && p5sketch) && (
        <canvas
          ref={canvasRef}
          className={className}
          role="img"
          aria-label={label}
          style={{ width: '100%', height: 'min(60vh, 560px)', display: 'block', borderRadius: 12, background: '#0f051d', touchAction: 'none' }}
        />
      )}
      <div aria-live="polite" className="sr-only" />
    </div>
  );
}

export default InteractiveGameCanvas;
