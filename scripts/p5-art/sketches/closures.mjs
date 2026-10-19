// scripts/p5-art/sketches/closures.mjs — scope léxico, captura de variables, shadowing, late.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function scopeLexico(p) {
  baseBg(p);
  box(p, 60, 70, 392, 250, { color: MUTED, label: 'scope exterior' });
  varChip(p, 160, 170, 'x = 5', { w: 110 });
  box(p, 110, 130, 300, 160, { color: CYAN, label: 'función' });
  fnPill(p, 260, 230, 've a x', { w: 140, h: 54, size: 24, color: CYAN });
  p.arrow(160, 195, 200, 220, { color: MAGENTA, dashed: true });
  caption(p, 'visible por ESCRITURA, no por ejecución', 256, 400, { color: '#f1f1f1', size: 20 });
  caption(p, 'scope léxico', 256, 445, { color: CYAN, size: 24 });
}

export function queEsUnClosure(p) {
  baseBg(p);
  box(p, 50, 80, 412, 220, { color: MUTED, label: 'scope exterior' });
  varChip(p, 150, 180, 'cuenta', { w: 120 });
  fnPill(p, 330, 180, 'cierre', { w: 140, h: 56, size: 24, color: CYAN });
  p.arrow(215, 180, 258, 180, { color: MAGENTA });
  caption(p, 'función + variables vivas', 150, 260, { color: MUTED, size: 18 });
  p.arrow(256, 320, 256, 380, { color: CYAN });
  badge(p, 256, 420, 'las mantiene vivas', { color: GREEN, size: 22, w: 270 });
}

export function capturaValoresOVariables(p) {
  baseBg(p);
  varChip(p, 120, 120, 'x = 1', { w: 110 });
  fnPill(p, 320, 120, '() => x', { w: 150, h: 54, size: 22, color: CYAN });
  p.arrow(180, 120, 242, 120, { color: MAGENTA });
  varChip(p, 120, 250, 'x = 9', { w: 110 });
  p.arrow(180, 230, 240, 150, { color: MAGENTA, dashed: true });
  badge(p, 320, 250, '→ 9', { color: GREEN, size: 28, w: 100 });
  caption(p, 'captura la VARIABLE viva', 256, 360, { color: '#f1f1f1', size: 24 });
  caption(p, 've el valor actual, no el de antes', 256, 410, { color: MUTED, size: 20 });
}

export function nivelesDeScope(p) {
  baseBg(p);
  box(p, 40, 60, 432, 100, { color: MUTED, label: 'global / top-level' });
  varChip(p, 380, 110, 'g', { w: 50 });
  box(p, 80, 180, 352, 110, { color: CYAN, label: 'función' });
  varChip(p, 350, 235, 'f · params', { w: 130, size: 18, color: CYAN });
  box(p, 120, 310, 272, 100, { color: AMBER, label: '{ bloque }' });
  varChip(p, 310, 365, 'if / for', { w: 110, size: 18, color: AMBER });
  caption(p, 'anillos anidados de visibilidad', 256, 455, { color: MUTED, size: 20 });
}

export function shadowing(p) {
  baseBg(p);
  varChip(p, 140, 130, 'x = 1', { w: 110, color: MUTED });
  caption(p, 'exterior', 140, 185, { color: MUTED, size: 18 });
  box(p, 240, 70, 230, 180, { color: CYAN, label: 'interior' });
  varChip(p, 355, 160, 'x = 2', { w: 110, color: MAGENTA });
  badge(p, 140, 280, 'oculta', { color: MAGENTA, size: 22, w: 120 });
  p.arrow(200, 260, 300, 220, { color: MAGENTA, dashed: true });
  caption(p, 'mismo nombre gana el de adentro', 256, 400, { color: '#f1f1f1', size: 22 });
  caption(p, 'shadowing', 256, 445, { color: CYAN, size: 26 });
}

export function identificadorUnderscore(p) {
  baseBg(p);
  box(p, 60, 90, 190, 300, { color: CYAN, label: 'archivo.dart' });
  varChip(p, 155, 200, '_privado', { w: 130, color: CYAN, size: 18 });
  fnPill(p, 155, 290, '_ayuda()', { w: 140, h: 50, size: 20, color: CYAN });
  box(p, 300, 150, 160, 180, { color: MAGENTA, label: 'otro.dart' });
  badge(p, 380, 260, '✗ invisible', { color: MAGENTA, size: 20, w: 140 });
  p.arrow(252, 240, 298, 240, { color: MAGENTA, dashed: true });
  caption(p, '_ es privado a la BIBLIOTECA', 256, 435, { color: '#f1f1f1', size: 22 });
  caption(p, 'no a la clase', 256, 470, { color: MUTED, size: 18 });
}

export function forCapturaVariable(p) {
  baseBg(p);
  box(p, 60, 70, 200, 320, { color: MUTED, label: 'Dart' });
  varChip(p, 160, 160, 'iter 1 → v1', { w: 150, size: 16, color: GREEN });
  varChip(p, 160, 230, 'iter 2 → v2', { w: 150, size: 16, color: GREEN });
  varChip(p, 160, 300, 'iter 3 → v3', { w: 150, size: 16, color: GREEN });
  box(p, 300, 130, 170, 200, { color: CYAN, label: 'closures' });
  fnPill(p, 385, 210, '() => v', { w: 130, h: 48, size: 20, color: CYAN });
  badge(p, 385, 280, 'cada uno', { color: GREEN, size: 18, w: 120 });
  caption(p, 'cada iteración tiene SU copia', 256, 440, { color: '#f1f1f1', size: 22 });
  caption(p, 'sin el bug clásico de JavaScript', 256, 475, { color: MUTED, size: 18 });
}

export function palabraClaveLate(p) {
  baseBg(p);
  fnPill(p, 256, 100, 'late int x;', { w: 220, h: 58, size: 26, color: AMBER });
  p.arrow(256, 145, 256, 215, { color: AMBER });
  badge(p, 256, 250, 'sin inicializar', { color: MUTED, size: 22, w: 200 });
  p.arrow(256, 290, 256, 350, { color: GREEN });
  badge(p, 256, 385, '1er uso → se asigna', { color: GREEN, size: 22, w: 260 });
  caption(p, 'lazy · late final = una sola vez', 256, 455, { color: MUTED, size: 20 });
  dots(p, 150, 180, 360, { color: AMBER });
}
