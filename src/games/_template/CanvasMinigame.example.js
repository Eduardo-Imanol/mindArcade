// src/games/_template/CanvasMinigame.example.js
// Ejemplo: flashcard drag + partículas. Copia esta carpeta para cada juego nuevo.
// Registra en src/games/registry.js: registry.canvasQuiz = ...
import { createGameCanvas } from '../../ui/InteractiveGameCanvas.js';

export function createCanvasQuiz(canvasEl, topic = []) {
  let card = 0, dragX = 0;

  const api = createGameCanvas(canvasEl, {
    onPointer: ({ type, x, pointer, burst, addScore }) => {
      if (type === 'move' && pointer.down) dragX = x - pointer.x;
      if (type === 'up') {
        // swipe >80px decide sé / no-sé
        if (Math.abs(dragX) > 80) {
          const ok = dragX > 0;
          if (ok) { burst(x, 200); addScore(100, { hit: true }); }
          else addScore(-20, { hit: false });
          card = (card + 1) % Math.max(1, topic.length || 3);
        }
        dragX = 0;
      }
    },
    draw: (ctx, { w, h }) => {
      ctx.fillStyle = '#1a1a2e';
      roundRect(ctx, w / 2 - 130 + dragX * 0.1, h / 2 - 90, 260, 180, 16);
      ctx.fill();
      ctx.fillStyle = '#f1f1f1'; ctx.textAlign = 'center';
      ctx.font = '18px system-ui';
      const q = topic[card]?.q ?? '¿Qué es `let`? (demo)';
      ctx.fillText(String(q).slice(0, 28), w / 2, h / 2);
      // progreso dinámico: barra lerp sin DOM
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(w / 2 - 100, h / 2 + 70, 200 * ((card + 1) / Math.max(1, topic.length || 3)), 8);
    },
  });
  return api;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
