// src/ui/InteractiveGameCanvas.js
// Plantilla base VANILLA (0 deps) — recomendada por defecto.
// Compatible con game-loop-architecture (un solo rAF) y mini-game-templates.
// Uso:
//   import { createGameCanvas } from './InteractiveGameCanvas.js';
//   const c = createGameCanvas(canvasEl, { onEnd, draw, onPointer });
//   c.start({ difficulty: 2 }); ... c.destroy();

export function createGameCanvas(canvas, opts = {}) {
  const {
    onEnd = null,
    setup = defaultSetup,
    draw = defaultDraw,
    onPointer = null,
    maxDpr = 2,
  } = opts;

  const ctx = canvas.getContext('2d');
  let s = { w: 0, h: 0, dpr: 1 };
  let running = false;
  let score = 0, startTime = 0, hits = 0, tries = 0;
  const pointer = { x: 0, y: 0, down: false, dragging: null };

  // Pool de partículas reutilizado (máx 300, sin alloc por frame)
  const particles = [];
  for (let i = 0; i < 120; i++) particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1 });
  let pIdx = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    s = { w: canvas.width, h: canvas.height, dpr };
    setup(canvas, s);
  }

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    const p = e.touches?.[0] ?? e;
    return { x: (p.clientX - r.left) * s.dpr, y: (p.clientY - r.top) * s.dpr };
  }
  function down(e) {
    e.preventDefault?.();
    const p = toLocal(e);
    pointer.x = p.x; pointer.y = p.y; pointer.down = true;
    onPointer?.({ type: 'down', ...p, pointer, burst, addScore });
  }
  function move(e) {
    if (!pointer.down) return;
    e.preventDefault?.();
    const p = toLocal(e);
    pointer.x = p.x; pointer.y = p.y;
    onPointer?.({ type: 'move', ...p, pointer, burst, addScore });
  }
  function up(e) {
    const p = toLocal(e);
    pointer.down = false; pointer.dragging = null;
    onPointer?.({ type: 'up', ...p, pointer, burst, addScore });
  }

  // Partículas al acertar: matemáticas puras, sin imágenes
  function burst(x, y, n = reduced ? 0 : 24, color = '#00ffcc') {
    for (let i = 0; i < n; i++) {
      const pt = particles[pIdx++ % particles.length];
      const a = Math.random() * Math.PI * 2, sp = (1 + Math.random() * 3) * s.dpr;
      pt.x = x; pt.y = y;
      pt.vx = Math.cos(a) * sp; pt.vy = Math.sin(a) * sp - 1;
      pt.life = pt.max = 0.6;
      pt.color = color;
    }
  }
  function stepParticles(dt) {
    for (const pt of particles) {
      if (pt.life <= 0) continue;
      pt.life -= dt;
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.08 * s.dpr;
    }
  }
  function addScore(p, { hit = true } = {}) {
    tries++; if (hit) hits++;
    score = Math.max(0, score + p);
  }

  return {
    id: 'interactive-canvas',
    init() {
      canvas.style.touchAction = 'none';
      resize();
      window.addEventListener('resize', resize);
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      // Fallback táctil legacy
      canvas.addEventListener('touchstart', down, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', up);
    },
    start() { running = true; startTime = performance.now(); },
    pause() { running = false; },
    resume() { running = true; },
    update(dt) { if (running) stepParticles(dt); },
    render(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      const w = canvas.width / s.dpr, h = canvas.height / s.dpr;
      draw(ctx, { w, h, dpr: s.dpr, t, pointer, burst, addScore, score });
      // partículas en coordenadas CSS (tras setTransform dpr)
      ctx.save(); ctx.scale(s.dpr, s.dpr); paintParticlesScaled(w, h); ctx.restore();
    },
    getScore() {
      return { score, accuracy: tries ? hits / tries : 0, timeMs: performance.now() - startTime };
    },
    destroy() {
      running = false;
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      canvas.removeEventListener('touchstart', down);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', up);
      onEnd?.(this.getScore());
    },
    burst, addScore, pointer,
  };

  function paintParticlesScaled() {
    // pinta en espacio device-px dividido por dpr para mantener tamaño
    for (const pt of particles) {
      if (pt.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x / s.dpr - 2, pt.y / s.dpr - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}

function defaultSetup() {}
function defaultDraw(ctx, { w, h, t }) {
  // Demo: círculo pulsante + texto vectorial (sin assets)
  ctx.fillStyle = '#0f051d'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 36 + 8 * Math.sin(t / 300), 0, 7); ctx.fill();
  ctx.fillStyle = '#f1f1f1'; ctx.font = '16px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('Arrastra o toca — reemplaza draw()', w / 2, h / 2 + 70);
}
