// scripts/p5-art/sketches/async-gen.mjs — generadores yield*, streams, await, isolates.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function yieldStarGenerador(p) {
  baseBg(p);
  fnPill(p, 170, 130, 'sync* f()', { w: 180, h: 54, size: 22 });
  p.arrow(270, 140, 340, 200, { color: CYAN });
  fnPill(p, 360, 240, 'yield* g()', { w: 180, h: 54, size: 22, color: GREEN });
  caption(p, 'delega', 280, 180, { color: MUTED, size: 18 });
  varChip(p, 150, 280, 'valores', { w: 110, color: CYAN });
  p.arrow(160, 230, 155, 255, { color: MUTED, dashed: true });
  badge(p, 256, 380, 'recursión con yield', { color: GREEN, size: 24, w: 260 });
  caption(p, 'yield* reenvía todo el generador', 256, 450, { color: MUTED, size: 20 });
}

export function consumirStreamAsync(p) {
  baseBg(p);
  fnPill(p, 140, 120, 'async* s()', { w: 180, h: 54, size: 22, color: MAGENTA });
  p.arrow(240, 130, 320, 180, { color: MAGENTA });
  dots(p, 140, 240, 420, { color: AMBER, n: 6, r: 7 });
  caption(p, 'Stream', 280, 290, { color: AMBER, size: 22 });
  p.arrow(256, 310, 256, 360, { color: CYAN });
  badge(p, 256, 395, 'await for (v in s)', { color: CYAN, size: 24, w: 270 });
  caption(p, 'itera los valores emitidos', 256, 460, { color: '#f1f1f1', size: 22 });
}

export function practicaAwait(p) {
  baseBg(p);
  fnPill(p, 160, 130, 'async f()', { w: 160, h: 54, size: 22 });
  fnPill(p, 360, 130, 'Future', { w: 130, h: 54, size: 22, color: AMBER });
  p.arrow(245, 130, 292, 130, { color: AMBER });
  p.arrow(160, 175, 160, 245, { color: GREEN });
  badge(p, 160, 280, 'await ✓', { color: GREEN, size: 24, w: 140 });
  p.arrow(360, 175, 360, 245, { color: MAGENTA });
  badge(p, 360, 280, 'olvidado ✗', { color: MAGENTA, size: 22, w: 160 });
  caption(p, 'await SIEMPRE los Futures', 256, 380, { color: '#f1f1f1', size: 24 });
  badge(p, 256, 440, 'linter: unawaited_futures', { color: MUTED, size: 18, w: 280 });
}

export function existenIsolates(p) {
  baseBg(p);
  box(p, 40, 90, 200, 260, { color: CYAN, label: 'isolate A' });
  dots(p, 80, 200, 200, { color: CYAN, n: 4, r: 6 });
  caption(p, 'mono-hilo', 140, 280, { color: MUTED, size: 18 });
  box(p, 272, 90, 200, 260, { color: GREEN, label: 'isolate B' });
  dots(p, 312, 200, 432, { color: GREEN, n: 4, r: 6 });
  caption(p, 'Isolate.run', 372, 280, { color: MUTED, size: 18 });
  p.arrow(245, 160, 268, 160, { color: AMBER, dashed: true });
  caption(p, 'Dart es mono-hilo POR isolate', 256, 410, { color: '#f1f1f1', size: 22 });
  caption(p, 'trabajo pesado → otro isolate', 256, 450, { color: GREEN, size: 20 });
}

export function restriccionIsolate(p) {
  baseBg(p);
  fnPill(p, 140, 130, 'Isolate.run(f)', { w: 210, h: 54, size: 20 });
  varChip(p, 380, 130, 'f', { w: 60, color: CYAN });
  p.arrow(255, 130, 345, 130, { color: CYAN });
  badge(p, 140, 260, 'transferible ✓', { color: GREEN, size: 22, w: 190 });
  varChip(p, 140, 320, 'ints · strings', { w: 180, size: 16, color: GREEN });
  badge(p, 380, 260, 'captura ✗', { color: MAGENTA, size: 22, w: 150 });
  varChip(p, 380, 320, 'objeto externo', { w: 190, size: 16, color: MAGENTA });
  caption(p, 'la función enviada debe poder transferirse', 256, 430, { color: '#f1f1f1', size: 20 });
}
