// scripts/p5-art/sketches/recursion.mjs — caso base, stack overflow, cola, fibonacci, árboles, backtracking.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, caption, dots, fnPill, stackFrame, treeNode, varChip } from '../primitives.mjs';

export function todaRecursivaCasoBase(p) {
  baseBg(p);
  fnPill(p, 130, 120, 'f(n)', { w: 110, h: 52, size: 24, color: CYAN });
  p.arrow(185, 145, 240, 195, { color: CYAN });
  fnPill(p, 310, 220, 'f(n-1)', { w: 140, h: 52, size: 22, color: CYAN });
  p.arrow(355, 250, 300, 300, { color: CYAN });
  badge(p, 240, 330, '…', { color: MUTED, size: 26, w: 70 });
  p.arrow(200, 350, 170, 390, { color: GREEN });
  badge(p, 150, 420, 'caso base', { color: GREEN, size: 22, w: 160 });
  caption(p, 'detiene + se acerca', 400, 420, { color: MUTED, size: 20 });
  caption(p, 'toda recursiva necesita ambos', 256, 70, { color: '#f1f1f1', size: 22 });
}

export function recursionSinCasoBase(p) {
  baseBg(p);
  for (let i = 0; i < 5; i += 1) {
    stackFrame(p, 100 + i * 14, 340 - i * 56, 240, 48, `f(${5 - i})`, { color: i === 4 ? MAGENTA : CYAN });
  }
  p.arrow(390, 120, 430, 90, { color: MAGENTA });
  badge(p, 300, 70, 'StackOverflowError', { color: MAGENTA, size: 22, w: 290 });
  caption(p, 'pila de llamadas sin tope', 256, 440, { color: '#f1f1f1', size: 22 });
  caption(p, 'nunca alcanza el caso base', 256, 475, { color: MUTED, size: 20 });
}

export function tailCallsNoOptimizan(p) {
  baseBg(p);
  fnPill(p, 150, 130, 'f(n-1) return', { w: 200, h: 56, size: 20, color: CYAN });
  badge(p, 380, 130, 'tail call', { color: MUTED, size: 20, w: 140 });
  p.arrow(256, 180, 256, 250, { color: MUTED });
  badge(p, 256, 290, '✗ Dart NO optimiza', { color: MAGENTA, size: 26, w: 280 });
  p.arrow(256, 330, 256, 390, { color: AMBER });
  badge(p, 256, 420, 'profundidad → usa iteración', { color: AMBER, size: 20, w: 300 });
}

export function recursionColaAcumulador(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'factorialCola(n, acc)', { w: 300, h: 58, size: 22 });
  varChip(p, 140, 230, 'n', { w: 60, color: CYAN });
  varChip(p, 256, 230, 'acc', { w: 80, color: AMBER });
  varChip(p, 372, 230, '→', { w: 60, color: MUTED });
  p.arrow(140, 160, 140, 200, { color: CYAN });
  p.arrow(256, 160, 256, 200, { color: AMBER });
  badge(p, 256, 330, 'acumula el parcial', { color: GREEN, size: 22, w: 240 });
  caption(p, 'en Dart aún consume pila', 256, 420, { color: MAGENTA, size: 22 });
  caption(p, 'no evita el consumo de stack', 256, 460, { color: MUTED, size: 18 });
}

export function fibonacciRecursivoLento(p) {
  baseBg(p);
  treeNode(p, 256, 110, 'f(5)', { r: 36, color: CYAN, size: 22 });
  treeNode(p, 150, 210, 'f(4)', { r: 32, color: AMBER, size: 20 });
  treeNode(p, 362, 210, 'f(3)', { r: 32, color: AMBER, size: 20 });
  treeNode(p, 90, 310, 'f(3)', { r: 28, color: MAGENTA, size: 18 });
  treeNode(p, 210, 310, 'f(2)', { r: 28, color: MAGENTA, size: 18 });
  p.line(230, 138, 165, 185, { color: MUTED, weight: 2 });
  p.line(282, 138, 347, 185, { color: MUTED, weight: 2 });
  p.line(130, 238, 100, 285, { color: MUTED, weight: 2 });
  p.line(172, 238, 198, 285, { color: MUTED, weight: 2 });
  badge(p, 400, 310, 'recalcula', { color: MAGENTA, size: 18, w: 130 });
  caption(p, 'O(2^n) · memo → O(n)', 256, 420, { color: '#f1f1f1', size: 24 });
}

export function arbolRecursivo(p) {
  baseBg(p);
  treeNode(p, 256, 110, '8', { r: 34, color: CYAN });
  treeNode(p, 150, 210, '3', { r: 30, color: GREEN });
  treeNode(p, 362, 210, '10', { r: 30, color: GREEN });
  treeNode(p, 90, 310, '·', { r: 26, color: MUTED, empty: true });
  treeNode(p, 210, 310, '6', { r: 26, color: GREEN });
  p.line(235, 136, 165, 188, { color: MUTED, weight: 2 });
  p.line(277, 136, 347, 188, { color: MUTED, weight: 2 });
  p.line(130, 236, 102, 286, { color: MUTED, weight: 2 });
  p.line(170, 236, 198, 286, { color: MUTED, weight: 2 });
  badge(p, 256, 380, 'inorden: izq · valor · der', { color: GREEN, size: 20, w: 300 });
  caption(p, 'caso base: nodo nulo', 256, 445, { color: MUTED, size: 20 });
}

export function backtracking(p) {
  baseBg(p);
  varChip(p, 90, 120, '[a, b, c]', { w: 130, size: 16, color: CYAN });
  p.arrow(170, 130, 250, 180, { color: CYAN });
  badge(p, 300, 210, 'elegir', { color: GREEN, size: 20, w: 110 });
  p.arrow(300, 245, 300, 295, { color: MUTED });
  badge(p, 300, 325, 'explorar', { color: CYAN, size: 20, w: 120 });
  p.arrow(250, 350, 170, 390, { color: MAGENTA });
  badge(p, 110, 415, 'deshacer', { color: MAGENTA, size: 20, w: 120 });
  p.arrow(170, 415, 250, 415, { color: MUTED });
  badge(p, 340, 415, 'seguir', { color: GREEN, size: 20, w: 100 });
  caption(p, 'como permutaciones', 430, 130, { color: MUTED, size: 18 });
}

export function recursionMutua(p) {
  baseBg(p);
  fnPill(p, 130, 180, 'esPar(n)', { w: 170, h: 58, size: 24, color: CYAN });
  fnPill(p, 382, 180, 'esImpar(n)', { w: 180, h: 58, size: 22, color: MAGENTA });
  p.arrow(220, 155, 300, 155, { color: CYAN });
  p.arrow(300, 210, 220, 210, { color: MAGENTA });
  caption(p, 'n-1', 260, 130, { color: MUTED, size: 18 });
  caption(p, 'n-1', 260, 240, { color: MUTED, size: 18 });
  badge(p, 256, 330, 'se llaman entre sí', { color: '#f1f1f1', size: 22, w: 230 });
  caption(p, 'ambas necesitan caso base', 256, 420, { color: MUTED, size: 22 });
  dots(p, 120, 330, 170, { color: MUTED });
}
