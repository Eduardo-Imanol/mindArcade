// scripts/p5-art/sketches/types-patterns.mjs — genéricos con restricción, agruparPor, switch patterns.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function tExtendsComparable(p) {
  baseBg(p);
  fnPill(p, 256, 100, 'T extends Comparable<T>', { w: 340, h: 58, size: 20 });
  p.arrow(256, 145, 256, 210, { color: CYAN });
  badge(p, 150, 260, 'compareTo ✓', { color: GREEN, size: 22, w: 180 });
  badge(p, 380, 260, 'no comparable ✗', { color: MAGENTA, size: 20, w: 200 });
  caption(p, 'limita T a tipos comparables', 256, 370, { color: '#f1f1f1', size: 24 });
  caption(p, 'usar compareTo dentro con seguridad', 256, 430, { color: MUTED, size: 20 });
}

export function agruparPor(p) {
  baseBg(p);
  box(p, 50, 90, 200, 200, { color: MUTED, label: 'elementos' });
  dots(p, 90, 190, 210, { color: CYAN, n: 5, r: 7 });
  p.arrow(255, 190, 310, 190, { color: CYAN });
  fnPill(p, 390, 140, 'agruparPor(f)', { w: 190, h: 52, size: 20, color: GREEN });
  box(p, 290, 220, 200, 160, { color: GREEN, label: 'Map' });
  varChip(p, 390, 290, 'clave → grupo', { w: 170, size: 16, color: GREEN });
  caption(p, 'clave calculada por función', 256, 430, { color: '#f1f1f1', size: 22 });
  caption(p, 'función genérica', 256, 470, { color: MUTED, size: 20 });
}

export function extensionesGenericas(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'extension IterableX<T>', { w: 320, h: 56, size: 20 });
  fnPill(p, 256, 175, 'on Iterable<T>', { w: 220, h: 50, size: 20, color: CYAN });
  varChip(p, 120, 290, 'Iterable<int>', { w: 180, size: 16, color: GREEN });
  varChip(p, 392, 290, 'Iterable<str>', { w: 190, size: 16, color: MAGENTA });
  p.arrow(200, 220, 160, 260, { color: MUTED, dashed: true });
  p.arrow(312, 220, 352, 260, { color: MUTED, dashed: true });
  badge(p, 256, 380, 'sí, genéricas', { color: GREEN, size: 24, w: 200 });
  caption(p, 'sirven para cualquier Iterable<T>', 256, 450, { color: '#f1f1f1', size: 22 });
}

export function patternMatchingSwitch(p) {
  baseBg(p);
  box(p, 60, 70, 392, 260, { color: MUTED, label: 'switch (v)' });
  const casos = [
    ['int n => …', CYAN],
    ['[a, b] => …', GREEN],
    ['(int, int) => …', MAGENTA],
    ['_ => …', MUTED],
  ];
  casos.forEach(([c, color], i) => {
    badge(p, 256, 130 + i * 56, c, { color, size: 20, w: 240, h: 44 });
  });
  p.arrow(256, 340, 256, 390, { color: CYAN });
  caption(p, 'devuelve un valor', 256, 420, { color: '#f1f1f1', size: 24 });
  caption(p, 'tipos + listas + records + guardas', 256, 465, { color: MUTED, size: 18 });
}

export function guardaWhen(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('int n when n < 0', 256, 130, { size: 36 });
  p.pop();
  badge(p, 150, 230, 'tipo', { color: CYAN, size: 20, w: 100 });
  badge(p, 300, 230, 'when condición', { color: AMBER, size: 20, w: 190 });
  p.arrow(150, 265, 150, 320, { color: CYAN, dashed: true });
  p.arrow(300, 265, 300, 320, { color: AMBER, dashed: true });
  badge(p, 225, 360, "→ 'negativo'", { color: GREEN, size: 24, w: 200 });
  caption(p, 'condición extra sobre el patrón', 256, 445, { color: '#f1f1f1', size: 22 });
}

export function tiposEnFuncionesPublicas(p) {
  baseBg(p);
  fnPill(p, 170, 140, 'sumar(a, b)', { w: 200, h: 54, size: 22, color: MUTED });
  badge(p, 400, 140, 'legible?', { color: AMBER, size: 20, w: 130 });
  p.arrow(256, 195, 256, 260, { color: CYAN });
  fnPill(p, 170, 310, 'int sumar(int a, int b)', { w: 330, h: 56, size: 20, color: GREEN });
  badge(p, 420, 310, '✓', { color: GREEN, size: 28, w: 60 });
  caption(p, 'más seguridad y claridad', 256, 410, { color: '#f1f1f1', size: 24 });
  caption(p, 'aunque los tipos son opcionales', 256, 455, { color: MUTED, size: 20 });
}
