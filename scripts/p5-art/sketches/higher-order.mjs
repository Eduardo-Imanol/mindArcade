// scripts/p5-art/sketches/higher-order.mjs — lambdas, tear-offs, orden superior, typedef, composición.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function lambdaAnonima(p) {
  baseBg(p);
  varChip(p, 160, 140, 'f', { w: 60 });
  p.arrow(200, 140, 280, 140, { color: CYAN });
  fnPill(p, 360, 140, '(x) => x*2', { w: 190, h: 56, size: 22, color: MAGENTA });
  caption(p, 'sin nombre', 360, 200, { color: MUTED, size: 20 });
  p.arrow(256, 230, 256, 300, { color: MUTED, dashed: true });
  badge(p, 256, 340, 'o se pasa como argumento', { color: GREEN, size: 20, w: 300 });
  caption(p, 'función anónima / lambda', 256, 430, { color: '#f1f1f1', size: 24 });
}

export function tearOff(p) {
  baseBg(p);
  fnPill(p, 150, 140, 'int.parse', { w: 190, h: 56, size: 24 });
  p.arrow(255, 150, 340, 250, { color: CYAN });
  box(p, 250, 270, 220, 110, { color: GREEN, label: null });
  p.push();
  p.noStroke();
  p.fill(MUTED);
  p.text('en vez de', 150, 280, { size: 20 });
  p.text('(s) => int.parse(s)', 150, 330, { size: 20 });
  p.pop();
  p.arrow(200, 300, 248, 315, { color: MUTED, dashed: true });
  badge(p, 360, 325, 'pasar directo', { color: GREEN, size: 20, w: 170 });
  caption(p, 'tear-off: sin lambda trivial', 256, 445, { color: '#f1f1f1', size: 24 });
}

export function ordenSuperior(p) {
  baseBg(p);
  fnPill(p, 256, 100, 'alta(fn)', { w: 180, h: 58, size: 26 });
  fnPill(p, 130, 240, 'fn', { w: 90, h: 50, size: 24, color: MAGENTA });
  p.arrow(200, 150, 155, 212, { color: MAGENTA });
  caption(p, 'recibe', 120, 185, { color: MUTED, size: 18 });
  fnPill(p, 390, 240, 'devuelve f', { w: 160, h: 50, size: 20, color: GREEN });
  p.arrow(310, 150, 360, 212, { color: GREEN });
  caption(p, 'o devuelve', 400, 185, { color: MUTED, size: 18 });
  badge(p, 256, 380, 'función de orden superior', { color: CYAN, size: 22, w: 320 });
  dots(p, 180, 300, 330, { color: MUTED });
}

export function memoizacion(p) {
  baseBg(p);
  box(p, 60, 90, 200, 260, { color: MUTED, label: 'closure' });
  varChip(p, 160, 180, 'cache{}', { w: 120, color: AMBER });
  fnPill(p, 160, 280, 'fib(n)', { w: 130, h: 50, size: 22, color: CYAN });
  p.arrow(210, 175, 240, 250, { color: AMBER, dashed: true });
  badge(p, 380, 160, 'calc → guarda', { color: GREEN, size: 18, w: 170 });
  badge(p, 380, 260, 'siguiente → cache', { color: AMBER, size: 18, w: 190 });
  p.arrow(265, 175, 320, 160, { color: GREEN });
  p.arrow(265, 270, 320, 260, { color: AMBER });
  caption(p, 'no recalcular · O(n)', 256, 430, { color: '#f1f1f1', size: 24 });
}

export function functionSinTipo(p) {
  baseBg(p);
  badge(p, 140, 140, 'Function f', { color: MAGENTA, size: 22, w: 180 });
  badge(p, 380, 140, '✗ seguro', { color: MAGENTA, size: 22, w: 150 });
  p.arrow(240, 170, 200, 250, { color: MAGENTA, dashed: true });
  badge(p, 140, 300, 'typedef', { color: GREEN, size: 24, w: 150 });
  badge(p, 380, 300, 'int Function(int)', { color: GREEN, size: 20, w: 220 });
  badge(p, 256, 390, '✓ tipos concretos', { color: GREEN, size: 22, w: 240 });
  caption(p, 'evita Function sin tipo', 256, 455, { color: '#f1f1f1', size: 22 });
}

export function typedefAlias(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('typedef Operacion', 256, 120, { size: 30 });
  p.text('= int Function(int, int)', 256, 165, { size: 26 });
  p.pop();
  p.arrow(256, 210, 256, 280, { color: CYAN });
  badge(p, 256, 320, 'Operacion op = suma', { color: GREEN, size: 22, w: 300 });
  caption(p, 'alias legible del tipo', 256, 410, { color: '#f1f1f1', size: 24 });
  caption(p, 'typedef', 256, 455, { color: CYAN, size: 26 });
}

export function typedefGenerico(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('typedef Transformador', 256, 110, { size: 28 });
  p.text('<T, R> = R Function(T)', 256, 155, { size: 26 });
  p.pop();
  varChip(p, 130, 280, 'T=int', { w: 100, color: MAGENTA });
  varChip(p, 256, 280, 'R=str', { w: 100, color: GREEN });
  varChip(p, 382, 280, 'T, R…', { w: 100, color: AMBER });
  caption(p, 'alias parametrizado', 256, 380, { color: '#f1f1f1', size: 24 });
  caption(p, 'se infiere en cada uso', 256, 425, { color: MUTED, size: 20 });
}

export function composicionDeFunciones(p) {
  baseBg(p);
  varChip(p, 80, 200, 'x', { w: 60 });
  p.arrow(115, 200, 155, 200, { color: MUTED });
  fnPill(p, 220, 200, 'g(x)', { w: 110, h: 54, size: 24, color: CYAN });
  p.arrow(280, 200, 320, 200, { color: CYAN });
  fnPill(p, 390, 200, 'f( )', { w: 110, h: 54, size: 24, color: MAGENTA });
  p.arrow(450, 200, 480, 200, { color: MAGENTA });
  p.push();
  p.noStroke();
  p.fill('#f1f1f1');
  p.text('f(g(x))', 256, 320, { size: 38 });
  p.pop();
  caption(p, 'g primero · f después', 256, 400, { color: MUTED, size: 22 });
  caption(p, 'componer(f, g) = (x) => f(g(x))', 256, 450, { color: CYAN, size: 20 });
}

export function lambdaSeRefiereASiMisma(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'late int Function(int) f', { w: 330, h: 56, size: 20, color: AMBER });
  p.arrow(256, 155, 256, 220, { color: AMBER });
  fnPill(p, 256, 260, 'f = (n) => … f(n-1) …', { w: 340, h: 56, size: 20, color: CYAN });
  badge(p, 256, 360, '✗ no directo', { color: MAGENTA, size: 24, w: 180 });
  caption(p, 'declara la variable antes', 256, 430, { color: '#f1f1f1', size: 22 });
  caption(p, 'luego asigna la lambda', 256, 470, { color: MUTED, size: 20 });
}

export function tiposDeTearOffs(p) {
  baseBg(p);
  const tipos = [
    ['int.parse', 'estático', CYAN],
    ["'hola'.toUpperCase", 'método ligado', MAGENTA],
    ['Persona.new', 'constructor', GREEN],
  ];
  tipos.forEach(([code, kind, color], i) => {
    const y = 120 + i * 110;
    fnPill(p, 220, y, code, { w: 250, h: 52, size: 20, color });
    badge(p, 400, y, kind, { color, size: 16, w: 130, h: 36 });
  });
  caption(p, '3 tipos de tear-offs en Dart', 256, 455, { color: '#f1f1f1', size: 22 });
}
