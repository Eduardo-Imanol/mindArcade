// scripts/p5-art/sketches/basics.mjs — fundamentos: qué es función, main, retorno, flecha.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function queEsUnaFuncionEnDart(p) {
  baseBg(p);
  fnPill(p, 256, 256, 'f(x)', { w: 150, h: 70, size: 34 });
  varChip(p, 72, 256, 'datos', { w: 104, color: MAGENTA });
  varChip(p, 440, 256, 'resultado', { w: 120, color: GREEN });
  p.arrow(130, 256, 175, 256, { color: CYAN });
  p.arrow(337, 256, 376, 256, { color: GREEN });
  caption(p, 'recibe', 152, 210, { color: MUTED });
  caption(p, 'devuelve', 360, 210, { color: MUTED });
}

export function porQueLasFuncionesSonObjetosEnDart(p) {
  baseBg(p);
  box(p, 96, 96, 320, 150, { color: CYAN, label: 'class Function' });
  fnPill(p, 256, 180, 'f(x)', { w: 120, h: 56, size: 26 });
  varChip(p, 120, 360, 'var f', { w: 96 });
  p.arrow(150, 340, 210, 260, { color: MAGENTA });
  caption(p, 'se guarda / se pasa / se devuelve', 256, 452, { color: MUTED, size: 22 });
  dots(p, 200, 360, 400, { color: CYAN });
}

export function mainEsElPuntoDeEntrada(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'main()', { w: 170, h: 66, size: 32, color: GREEN });
  p.arrow(256, 160, 256, 240, { color: GREEN });
  box(p, 146, 250, 220, 60, { color: MUTED, label: null });
  caption(p, 'tu programa', 256, 280, { color: '#f1f1f1', size: 24 });
  p.arrow(256, 316, 256, 380, { color: MUTED, dashed: true });
  caption(p, 'todo empieza aquí', 256, 420, { color: GREEN, size: 22 });
}

export function tipoDeRetorno(p) {
  baseBg(p);
  fnPill(p, 200, 200, 'int f()', { w: 150, h: 60, size: 28 });
  p.arrow(275, 200, 372, 200, { color: GREEN });
  varChip(p, 420, 200, '42', { w: 70, color: GREEN });
  fnPill(p, 200, 330, 'void f()', { w: 150, h: 60, size: 26, color: MUTED });
  badge(p, 380, 330, 'sin valor', { color: AMBER, size: 20 });
  caption(p, 'return entrega…', 256, 90, { color: MUTED, size: 22 });
}

export function operadorFlecha(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('=>', 256, 180, { size: 110 });
  p.pop();
  p.arrow(256, 250, 256, 300, { color: CYAN });
  box(p, 116, 320, 280, 110, { color: MUTED, label: '{ return expr; }' });
  caption(p, 'una sola expresión', 256, 88, { color: MUTED, size: 24 });
}

export function restriccionesDeLaFlecha(p) {
  baseBg(p);
  badge(p, 160, 160, 'expr', { color: GREEN, size: 26, w: 110 });
  badge(p, 160, 230, '?? ternario', { color: GREEN, size: 20, w: 170 });
  badge(p, 380, 160, 'if { }', { color: MAGENTA, size: 22, w: 110 });
  badge(p, 380, 230, 'for { }', { color: MAGENTA, size: 22, w: 110 });
  caption(p, '=> solo admite 1 expresión', 256, 360, { color: CYAN, size: 26 });
  caption(p, 'sentencias van con llaves', 256, 410, { color: MUTED, size: 22 });
}

export function returnEnVoid(p) {
  baseBg(p);
  box(p, 116, 110, 280, 290, { color: MUTED, label: 'void f()' });
  box(p, 156, 180, 200, 50, { color: MUTED, label: null });
  caption(p, 'código', 256, 205, { color: '#f1f1f1', size: 20 });
  p.arrow(256, 250, 256, 320, { color: AMBER });
  p.push();
  p.noStroke();
  p.fill(AMBER);
  p.text('return;', 300, 288, { size: 24, align: 'start' });
  p.pop();
  caption(p, 'sale antes sin valor', 256, 450, { color: AMBER, size: 22 });
}

export function retornoSinReturn(p) {
  baseBg(p);
  fnPill(p, 190, 170, 'int f()', { w: 140, h: 58, size: 26 });
  badge(p, 360, 170, 'sin return', { color: MAGENTA, size: 20, w: 150 });
  p.arrow(190, 210, 190, 280, { color: MAGENTA });
  badge(p, 190, 320, 'error', { color: MAGENTA, size: 24 });
  caption(p, 'int no admite null', 190, 390, { color: MUTED, size: 20 });
  fnPill(p, 340, 300, 'f()', { w: 96, h: 48, size: 22, color: MUTED });
  p.arrow(340, 260, 340, 236, { color: MUTED, dashed: true });
  caption(p, 'sin tipo → null', 340, 380, { color: MUTED, size: 20 });
}

export function cuandoUsarFlechaVsLlaves(p) {
  baseBg(p);
  box(p, 60, 140, 180, 220, { color: GREEN, label: '=> simple' });
  caption(p, '1 expresión', 150, 230, { color: '#f1f1f1', size: 24 });
  p.arrow(150, 270, 150, 320, { color: GREEN });
  caption(p, 'corta y clara', 150, 345, { color: MUTED, size: 18 });
  box(p, 272, 140, 180, 220, { color: MUTED, label: '{ }' });
  caption(p, 'varias', 362, 230, { color: '#f1f1f1', size: 24 });
  caption(p, 'sentencias', 362, 265, { color: '#f1f1f1', size: 24 });
  caption(p, 'usa llaves', 362, 345, { color: MUTED, size: 18 });
}
