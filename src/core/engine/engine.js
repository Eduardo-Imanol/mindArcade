// src/core/engine/engine.js — single rAF loop, dt clamp, auto-pause on hidden
export function createEngine({ onTick } = {}) {
  let raf = 0;
  let state = 'init';
  let last = 0;
  const api = {
    get state() { return state; },
    start() {
      if (raf) return; // double-start no-op
      state = 'playing';
      last = performance.now();
      const loop = (t) => {
        if (state !== 'playing') return;
        let dt = (t - last) / 1000;
        last = t;
        if (dt > 0.1) dt = 0.1; // clamp 100ms
        onTick?.(dt, t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    },
    pause() {
      state = 'paused';
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    resume() {
      if (state !== 'paused') return;
      state = 'playing';
      last = performance.now();
      // restart loop without double-handle (start() is no-op if a handle exists;
      // here raf is 0 because pause() cleared it)
      if (!raf) {
        const loop = (t) => {
          if (state !== 'playing') return;
          let dt = (t - last) / 1000;
          last = t;
          if (dt > 0.1) dt = 0.1;
          onTick?.(dt, t);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
    },
    stop() {
      state = 'over';
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    _handles: () => raf,
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state === 'playing') api.pause();
    });
  }
  return api;
}
