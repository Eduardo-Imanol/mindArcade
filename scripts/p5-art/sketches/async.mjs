// scripts/p5-art/sketches/async.mjs — Future, await, try/catch, Future.wait, then/catchError.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill } from '../primitives.mjs';

export function asyncDevuelveFuture(p) {
  baseBg(p);
  fnPill(p, 160, 130, 'async f()', { w: 170, h: 56, size: 24 });
  p.arrow(250, 140, 330, 220, { color: CYAN });
  box(p, 300, 250, 160, 90, { color: AMBER, label: null });
  p.push();
  p.noStroke();
  p.fill(AMBER);
  p.text('Future', 380, 295, { size: 30 });
  p.pop();
  caption(p, 'siempre, aunque', 140, 280, { color: MUTED, size: 20 });
  caption(p, 'no haya await', 140, 315, { color: MUTED, size: 20 });
  p.arrow(160, 170, 160, 260, { color: MUTED, dashed: true });
  badge(p, 256, 420, 'devuelve un Future', { color: AMBER, size: 24, w: 260 });
}

export function syncVsAsync(p) {
  baseBg(p);
  box(p, 40, 80, 210, 320, { color: CYAN, label: 'sync*' });
  badge(p, 145, 180, 'yield', { color: CYAN, size: 22, w: 120 });
  badge(p, 145, 270, 'Iterable', { color: GREEN, size: 22, w: 140 });
  caption(p, 'perezoso', 145, 350, { color: MUTED, size: 18 });
  box(p, 262, 80, 210, 320, { color: MAGENTA, label: 'async*' });
  badge(p, 367, 180, 'yield', { color: MAGENTA, size: 22, w: 120 });
  badge(p, 367, 270, 'Stream', { color: AMBER, size: 22, w: 140 });
  caption(p, 'eventos en el tiempo', 367, 350, { color: MUTED, size: 16 });
  caption(p, 'Iterable ≠ Stream', 256, 455, { color: '#f1f1f1', size: 24 });
}

export function awaitNoBloqueaElHilo(p) {
  baseBg(p);
  box(p, 40, 110, 432, 90, { color: MUTED, label: 'hilo principal' });
  dots(p, 80, 170, 430, { color: GREEN, n: 8, r: 5 });
  caption(p, 'sigue libre', 256, 230, { color: GREEN, size: 20 });
  box(p, 100, 270, 312, 120, { color: AMBER, label: 'función async' });
  p.arrow(200, 290, 200, 340, { color: AMBER });
  badge(p, 256, 350, 'await pausa solo esto', { color: AMBER, size: 20, w: 250 });
  caption(p, 'NO bloquea: pausa la función async', 256, 440, { color: '#f1f1f1', size: 22 });
}

export function tryCatchFinally(p) {
  baseBg(p);
  box(p, 70, 70, 372, 280, { color: MUTED, label: null });
  box(p, 100, 100, 312, 70, { color: CYAN, label: null });
  caption(p, 'try', 256, 135, { color: CYAN, size: 26 });
  box(p, 100, 190, 312, 70, { color: MAGENTA, label: null });
  caption(p, 'catch (opcional)', 256, 225, { color: MAGENTA, size: 22 });
  box(p, 100, 280, 312, 70, { color: GREEN, label: null });
  caption(p, 'finally', 256, 315, { color: GREEN, size: 26 });
  badge(p, 256, 410, 'siempre se ejecuta', { color: GREEN, size: 24, w: 260 });
  caption(p, 'haya error o no', 256, 465, { color: MUTED, size: 20 });
}

export function futureWait(p) {
  baseBg(p);
  fnPill(p, 256, 90, 'Future.wait([...])', { w: 300, h: 56, size: 22 });
  fnPill(p, 110, 220, 'f1()', { w: 100, h: 48, size: 22, color: CYAN });
  fnPill(p, 256, 220, 'f2()', { w: 100, h: 48, size: 22, color: MAGENTA });
  fnPill(p, 402, 220, 'f3()', { w: 100, h: 48, size: 22, color: GREEN });
  p.arrow(180, 130, 130, 190, { color: CYAN });
  p.arrow(256, 130, 256, 190, { color: MAGENTA });
  p.arrow(332, 130, 382, 190, { color: GREEN });
  dots(p, 110, 300, 402, { color: AMBER, n: 5, r: 5 });
  badge(p, 256, 360, 'espera a todos', { color: AMBER, size: 24, w: 220 });
  caption(p, 'en paralelo, un solo await', 256, 440, { color: '#f1f1f1', size: 22 });
}

export function thenCatchError(p) {
  baseBg(p);
  fnPill(p, 90, 160, 'f()', { w: 90, h: 48, size: 22 });
  p.arrow(140, 160, 195, 160, { color: MUTED });
  fnPill(p, 280, 160, '.then((v) => …)', { w: 200, h: 52, size: 20, color: GREEN });
  p.arrow(385, 190, 385, 260, { color: GREEN });
  fnPill(p, 300, 300, '.catchError((e) => …)', { w: 260, h: 52, size: 18, color: MAGENTA });
  p.arrow(200, 300, 160, 300, { color: MUTED, dashed: true });
  badge(p, 140, 350, 'error', { color: MAGENTA, size: 20, w: 100 });
  caption(p, 'sin async/await: encadena', 256, 430, { color: '#f1f1f1', size: 22 });
  caption(p, 'then → catchError', 256, 470, { color: MUTED, size: 20 });
}
