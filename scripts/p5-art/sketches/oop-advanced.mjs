// scripts/p5-art/sketches/oop-advanced.mjs — sobrecarga, invocables, extensions, mixins, override.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, fnPill, varChip } from '../primitives.mjs';

export function sobrecargaDeMetodos(p) {
  baseBg(p);
  fnPill(p, 160, 130, 'sumar(int)', { w: 170, h: 54, size: 22, color: CYAN });
  fnPill(p, 360, 130, 'sumar(int, int)', { w: 210, h: 54, size: 20, color: MAGENTA });
  badge(p, 256, 240, '✗ mismo nombre', { color: MAGENTA, size: 28, w: 260 });
  p.arrow(256, 280, 256, 340, { color: MUTED });
  badge(p, 256, 375, 'opcionales · nombrados · otro nombre', { color: GREEN, size: 18, w: 350 });
  caption(p, 'Dart NO soporta sobrecarga', 256, 455, { color: '#f1f1f1', size: 24 });
}

export function sobrecargaDeOperadores(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('operator +  ==', 256, 120, { size: 40 });
  p.pop();
  p.arrow(256, 165, 256, 230, { color: CYAN });
  box(p, 60, 250, 392, 100, { color: MUTED, label: null });
  badge(p, 160, 300, 'a + b', { color: CYAN, size: 24, w: 120 });
  badge(p, 360, 300, 'a == b', { color: MAGENTA, size: 24, w: 130 });
  badge(p, 256, 400, '== exige hashCode', { color: AMBER, size: 22, w: 250 });
  caption(p, 'al definir == sobrescribe hashCode', 256, 465, { color: MUTED, size: 18 });
}

export function objetoInvocable(p) {
  baseBg(p);
  box(p, 80, 80, 352, 180, { color: MUTED, label: 'class Multiplicador' });
  varChip(p, 160, 170, 'n = 3', { w: 100, color: AMBER });
  fnPill(p, 330, 170, 'call(x)', { w: 140, h: 52, size: 22, color: CYAN });
  p.arrow(256, 280, 256, 330, { color: CYAN });
  badge(p, 170, 370, 'por3(5)', { color: '#f1f1f1', size: 24, w: 140 });
  p.arrow(250, 370, 300, 370, { color: MUTED });
  badge(p, 380, 370, '→ 15', { color: GREEN, size: 24, w: 100 });
  caption(p, 'objeto con call() = invocable', 256, 455, { color: '#f1f1f1', size: 22 });
}

export function extensionMethod(p) {
  baseBg(p);
  box(p, 60, 90, 200, 150, { color: MUTED, label: 'String' });
  badge(p, 160, 180, '"hola"', { color: '#f1f1f1', size: 24, w: 130 });
  p.arrow(270, 160, 330, 160, { color: CYAN });
  box(p, 320, 90, 152, 150, { color: CYAN, label: 'StringX' });
  fnPill(p, 396, 180, '.saludo()', { w: 130, h: 48, size: 18, color: CYAN });
  caption(p, 'extension StringX on String', 256, 290, { color: MUTED, size: 20 });
  badge(p, 256, 360, 'añade métodos al tipo', { color: GREEN, size: 22, w: 260 });
  caption(p, 'sin modificar la clase', 256, 430, { color: '#f1f1f1', size: 22 });
}

export function queEsUnMixin(p) {
  baseBg(p);
  box(p, 60, 80, 200, 130, { color: GREEN, label: 'mixin Volador' });
  fnPill(p, 160, 160, 'volar()', { w: 130, h: 48, size: 20, color: GREEN });
  p.arrow(270, 145, 330, 145, { color: GREEN });
  box(p, 310, 80, 162, 130, { color: MUTED, label: 'class Pato' });
  badge(p, 391, 170, 'with', { color: AMBER, size: 20, w: 90 });
  p.arrow(256, 240, 256, 300, { color: MUTED });
  badge(p, 256, 340, 'Pato.volar()', { color: CYAN, size: 24, w: 190 });
  caption(p, 'bloque de métodos reutilizable', 256, 430, { color: '#f1f1f1', size: 22 });
}

export function anotacionOverride(p) {
  baseBg(p);
  box(p, 60, 70, 392, 130, { color: MUTED, label: 'superclase' });
  fnPill(p, 256, 145, 'area()', { w: 130, h: 50, size: 22 });
  p.arrow(256, 210, 256, 270, { color: CYAN });
  box(p, 100, 290, 312, 130, { color: CYAN, label: 'subclase' });
  p.push();
  p.noStroke();
  p.fill(AMBER);
  p.text('@override', 256, 340, { size: 26, align: 'start' });
  p.pop();
  fnPill(p, 350, 340, 'area()', { w: 110, h: 46, size: 18, color: GREEN });
  caption(p, 'reimplementa el método', 256, 460, { color: '#f1f1f1', size: 22 });
}
