// scripts/p5-art/sketches/records.mjs — Dart 3 records, anulables y paso por referencia.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function multiplesValoresRecords(p) {
  baseBg(p);
  fnPill(p, 170, 140, 'f()', { w: 110, h: 56, size: 26 });
  p.arrow(230, 140, 320, 140, { color: GREEN });
  box(p, 330, 100, 140, 80, { color: GREEN, label: null });
  p.push();
  p.noStroke();
  p.fill(GREEN);
  p.text('(1, 2)', 400, 140, { size: 30 });
  p.pop();
  caption(p, 'Record', 400, 200, { color: MUTED, size: 20 });
  p.arrow(256, 220, 256, 290, { color: CYAN });
  box(p, 106, 310, 130, 70, { color: CYAN, label: null });
  box(p, 276, 310, 130, 70, { color: CYAN, label: null });
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('a = 1', 171, 345, { size: 26 });
  p.text('b = 2', 341, 345, { size: 26 });
  p.pop();
  caption(p, 'desestructura en la llamada', 256, 430, { color: MUTED, size: 22 });
}

export function recordsNombrados(p) {
  baseBg(p);
  box(p, 76, 130, 360, 150, { color: MAGENTA, label: null });
  p.push();
  p.noStroke();
  p.fill(TEXT);
  p.text('({String nombre, int edad})', 256, 205, { size: 24 });
  p.pop();
  varChip(p, 160, 360, '.nombre', { w: 130, color: CYAN, size: 20 });
  varChip(p, 340, 360, '.edad', { w: 120, color: CYAN, size: 20 });
  caption(p, 'acceso por nombre, no por posición', 256, 440, { color: MUTED, size: 20 });
}

export function tipoAnulable(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'int? f()', { w: 180, h: 60, size: 28 });
  p.arrow(256, 155, 256, 220, { color: AMBER });
  varChip(p, 160, 280, '42', { w: 80, color: GREEN });
  varChip(p, 352, 280, 'null', { w: 90, color: AMBER });
  caption(p, 'el ? permite ambos', 256, 370, { color: '#f1f1f1', size: 24 });
  caption(p, 'sin ? null sería error', 256, 420, { color: MUTED, size: 20 });
}

export function listaPorReferencia(p) {
  baseBg(p);
  varChip(p, 130, 140, 'lista', { w: 110, color: CYAN });
  box(p, 300, 100, 150, 80, { color: GREEN, label: null });
  p.push();
  p.noStroke();
  p.fill(GREEN);
  p.text('[1, 2]', 375, 140, { size: 28 });
  p.pop();
  p.arrow(190, 150, 298, 140, { color: CYAN });
  caption(p, 'misma referencia', 256, 230, { color: MUTED, size: 20 });
  fnPill(p, 160, 330, 'add(3)', { w: 130, h: 54, size: 24, color: GREEN });
  fnPill(p, 360, 330, 'lista = []', { w: 150, h: 54, size: 22, color: MAGENTA });
  badge(p, 160, 420, 'afecta al original', { color: GREEN, size: 18, w: 200 });
  badge(p, 360, 420, 'solo local', { color: MAGENTA, size: 18, w: 150 });
  dots(p, 230, 330, 290, { color: MUTED });
}
