// scripts/p5-art/sketches/collections.mjs — colecciones, mapas de funciones, currying, fluent, puras.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function metodosConFuncionesAnonimas(p) {
  baseBg(p);
  const metodos = ['map', 'where', 'reduce', 'fold', 'any', 'every', 'sort', 'forEach'];
  metodos.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 130 + col * 250;
    const y = 110 + row * 80;
    fnPill(p, x, y, `${m}(fn)`, { w: 170, h: 52, size: 22, color: row % 2 ? CYAN : GREEN });
  });
  caption(p, 'todos reciben funciones anónimas', 256, 460, { color: '#f1f1f1', size: 22 });
}

export function mapWherePerezosos(p) {
  baseBg(p);
  box(p, 50, 100, 170, 90, { color: MUTED, label: null });
  p.push();
  p.noStroke();
  p.fill('#f1f1f1');
  p.text('[1, 2, 3]', 135, 145, { size: 24 });
  p.pop();
  p.arrow(225, 145, 285, 145, { color: CYAN });
  badge(p, 360, 145, 'map', { color: CYAN, size: 22, w: 100 });
  badge(p, 360, 230, 'Iterable', { color: AMBER, size: 22, w: 150 });
  p.arrow(360, 185, 360, 205, { color: AMBER });
  badge(p, 360, 320, 'nada calculado', { color: MAGENTA, size: 20, w: 190 });
  p.arrow(360, 270, 360, 295, { color: MAGENTA });
  p.arrow(135, 200, 135, 300, { color: GREEN });
  badge(p, 135, 340, '.toList() → sí', { color: GREEN, size: 20, w: 180 });
  caption(p, 'perezosos: se itera o .toList()', 256, 440, { color: '#f1f1f1', size: 22 });
}

export function mapaDeFunciones(p) {
  baseBg(p);
  box(p, 80, 90, 352, 240, { color: MUTED, label: 'Map ops' });
  varChip(p, 160, 180, "'+'", { w: 70, color: CYAN });
  fnPill(p, 320, 180, '(a,b)=>a+b', { w: 190, h: 50, size: 18, color: GREEN });
  varChip(p, 160, 270, "'*'", { w: 70, color: CYAN });
  fnPill(p, 320, 270, '(a,b)=>a*b', { w: 190, h: 50, size: 18, color: GREEN });
  p.arrow(200, 180, 222, 180, { color: MUTED });
  p.arrow(200, 270, 222, 270, { color: MUTED });
  badge(p, 256, 400, "ops['+'](2, 3) → 5", { color: '#f1f1f1', size: 22, w: 260 });
  caption(p, 'despachar comportamientos', 256, 460, { color: MUTED, size: 20 });
}

export function currying(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('(a) => (b) => a + b', 256, 130, { size: 32 });
  p.pop();
  badge(p, 160, 250, 'sumaCurry(2)', { color: GREEN, size: 20, w: 190 });
  p.arrow(160, 290, 160, 340, { color: GREEN });
  badge(p, 160, 375, '(b) => 2 + b', { color: MUTED, size: 20, w: 170 });
  badge(p, 380, 375, '(3) → 5', { color: GREEN, size: 22, w: 120 });
  p.arrow(250, 375, 315, 375, { color: MUTED });
  caption(p, 'una función devuelve otra', 256, 460, { color: '#f1f1f1', size: 22 });
}

export function interfazFluent(p) {
  baseBg(p);
  fnPill(p, 120, 160, 'Validador', { w: 160, h: 54, size: 22 });
  p.arrow(205, 160, 265, 160, { color: CYAN });
  fnPill(p, 350, 160, '.agregar(x)', { w: 170, h: 54, size: 20, color: GREEN });
  p.arrow(440, 190, 440, 250, { color: GREEN });
  p.push();
  p.noStroke();
  p.fill(GREEN);
  p.text('return this', 400, 275, { size: 22, align: 'end' });
  p.pop();
  p.arrow(350, 300, 260, 200, { color: GREEN, dashed: true });
  badge(p, 256, 380, 'a.agregar(1).agregar(2)', { color: '#f1f1f1', size: 22, w: 300 });
  caption(p, 'patrón fluent / fluid', 256, 450, { color: CYAN, size: 24 });
}

export function miniProyectoValidador(p) {
  baseBg(p);
  const conceptos = ['T', 'typedef', 'closure', 'lambda', 'call()', 'orden sup.'];
  conceptos.forEach((c, i) => {
    const x = 120 + (i % 3) * 136;
    const y = 130 + Math.floor(i / 3) * 110;
    badge(p, x, y, c, { color: i % 2 ? CYAN : GREEN, size: 18, w: 120, h: 44 });
  });
  p.arrow(256, 300, 256, 360, { color: MUTED });
  badge(p, 256, 395, 'Validador.agregar()', { color: MAGENTA, size: 22, w: 260 });
  caption(p, 'todo combinado + encadenamiento', 256, 465, { color: '#f1f1f1', size: 20 });
}

export function funcionPura(p) {
  baseBg(p);
  varChip(p, 90, 200, 'x = 2', { w: 100 });
  p.arrow(150, 200, 210, 200, { color: MUTED });
  fnPill(p, 290, 200, 'f(x)', { w: 110, h: 54, size: 24, color: CYAN });
  p.arrow(355, 200, 415, 200, { color: CYAN });
  varChip(p, 450, 200, '4', { w: 56, color: GREEN });
  varChip(p, 90, 320, 'x = 2', { w: 100 });
  p.arrow(150, 320, 210, 320, { color: MUTED });
  fnPill(p, 290, 320, 'f(x)', { w: 110, h: 54, size: 24, color: CYAN });
  p.arrow(355, 320, 415, 320, { color: CYAN });
  varChip(p, 450, 320, '4', { w: 56, color: GREEN });
  caption(p, 'misma entrada → misma salida', 256, 415, { color: '#f1f1f1', size: 22 });
  caption(p, 'sin efectos secundarios · fácil de probar', 256, 455, { color: MUTED, size: 18 });
  dots(p, 180, 260, 340, { color: MUTED, n: 4 });
}
