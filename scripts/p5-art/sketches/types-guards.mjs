// scripts/p5-art/sketches/types-guards.mjs — throw, assert y tipo Never.
import { baseBg } from '../engine.mjs';
import { AMBER, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, fnPill } from '../primitives.mjs';

export function throwEnFuncion(p) {
  baseBg(p);
  fnPill(p, 170, 130, 'f(b)', { w: 110, h: 52, size: 24 });
  p.arrow(235, 140, 300, 200, { color: MAGENTA });
  badge(p, 370, 240, 'throw', { color: MAGENTA, size: 26, w: 140 });
  p.arrow(370, 280, 370, 340, { color: MAGENTA });
  box(p, 240, 350, 260, 70, { color: AMBER, label: null });
  p.push();
  p.noStroke();
  p.fill(AMBER);
  p.text('ArgumentError', 370, 385, { size: 22 });
  p.pop();
  caption(p, 'lanza una excepción', 150, 300, { color: '#f1f1f1', size: 22 });
  caption(p, 'b == 0 → error', 150, 340, { color: MUTED, size: 18 });
}

export function assertDebug(p) {
  baseBg(p);
  box(p, 50, 90, 200, 220, { color: GREEN, label: 'debug' });
  badge(p, 150, 190, 'assert(x > 0)', { color: GREEN, size: 18, w: 180 });
  badge(p, 150, 260, 'se evalúa ✓', { color: GREEN, size: 18, w: 150 });
  box(p, 262, 90, 200, 220, { color: MAGENTA, label: 'producción' });
  badge(p, 362, 190, 'assert(x > 0)', { color: MUTED, size: 18, w: 180 });
  badge(p, 362, 260, 'ignorado ✗', { color: MAGENTA, size: 18, w: 140 });
  caption(p, 'solo existe en modo debug', 256, 390, { color: '#f1f1f1', size: 24 });
  caption(p, 'en release no se evalúa', 256, 435, { color: MUTED, size: 20 });
}

export function tipoNever(p) {
  baseBg(p);
  fnPill(p, 256, 100, 'Never fallo()', { w: 230, h: 56, size: 24, color: MAGENTA });
  p.arrow(256, 145, 256, 215, { color: MAGENTA });
  badge(p, 256, 250, 'throw siempre', { color: MAGENTA, size: 24, w: 220 });
  p.arrow(256, 290, 256, 350, { color: AMBER });
  badge(p, 256, 385, 'nunca termina normal', { color: AMBER, size: 22, w: 260 });
  caption(p, 'el retorno de lo que no retorna', 256, 460, { color: '#f1f1f1', size: 22 });
}
