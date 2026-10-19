// scripts/p5-art/sketches/oop.mjs — constructores, super, this.nombre, getters, estáticos.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, fnPill, varChip } from '../primitives.mjs';

export function superparametro(p) {
  baseBg(p);
  box(p, 60, 70, 392, 140, { color: MUTED, label: 'class Padre' });
  varChip(p, 256, 150, 'nombre', { w: 130, color: CYAN });
  box(p, 100, 250, 312, 150, { color: MAGENTA, label: 'class Hijo' });
  fnPill(p, 256, 330, 'Hijo(super.nombre)', { w: 280, h: 54, size: 20, color: MAGENTA });
  p.arrow(256, 220, 256, 250, { color: GREEN });
  caption(p, 'reenvía al constructor padre', 256, 440, { color: '#f1f1f1', size: 22 });
  caption(p, 'Dart 2.17+', 256, 475, { color: MUTED, size: 18 });
}

export function initializingFormal(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'Punto(this.x, this.y)', { w: 320, h: 58, size: 22 });
  p.arrow(160, 160, 160, 250, { color: CYAN });
  p.arrow(352, 160, 352, 250, { color: MAGENTA });
  varChip(p, 160, 290, 'x', { w: 70, color: CYAN });
  varChip(p, 352, 290, 'y', { w: 70, color: MAGENTA });
  caption(p, 'this.nombre asigna el campo', 256, 380, { color: '#f1f1f1', size: 22 });
  badge(p, 256, 440, 'atajo de constructor', { color: GREEN, size: 22, w: 240 });
}

export function gettersSetters(p) {
  baseBg(p);
  box(p, 60, 90, 392, 230, { color: MUTED, label: 'class C' });
  fnPill(p, 160, 190, 'get nombre', { w: 180, h: 52, size: 20, color: GREEN });
  fnPill(p, 352, 190, 'set nombre', { w: 180, h: 52, size: 20, color: MAGENTA });
  badge(p, 160, 280, 'propiedad', { color: GREEN, size: 18, w: 130 });
  badge(p, 352, 280, 'asignar', { color: MAGENTA, size: 18, w: 120 });
  caption(p, 'c.nombre  (sin paréntesis)', 256, 380, { color: CYAN, size: 24 });
  caption(p, 'propiedades calculadas', 256, 430, { color: MUTED, size: 22 });
}

export function metodoEstatico(p) {
  baseBg(p);
  box(p, 80, 90, 352, 150, { color: MUTED, label: 'class Mate' });
  fnPill(p, 256, 170, 'static cuadrado(n)', { w: 280, h: 54, size: 20, color: CYAN });
  badge(p, 160, 320, 'Mate.cuadrado(4)', { color: '#f1f1f1', size: 20, w: 250 });
  p.arrow(256, 250, 200, 290, { color: CYAN });
  badge(p, 380, 320, '→ 16', { color: GREEN, size: 24, w: 100 });
  caption(p, 'sin instancia', 256, 410, { color: '#f1f1f1', size: 24 });
  caption(p, 'se llama sobre la clase', 256, 450, { color: MUTED, size: 20 });
}

export function tiposDeConstructores(p) {
  baseBg(p);
  const tipos = [
    ['generativo', CYAN],
    ['nombrado()', MAGENTA],
    ['factory', GREEN],
    ['const', AMBER],
  ];
  tipos.forEach(([t, c], i) => {
    const x = 130 + (i % 2) * 250;
    const y = 130 + Math.floor(i / 2) * 120;
    badge(p, x, y, t, { color: c, size: 22, w: 190, h: 50 });
  });
  caption(p, 'class Punto { … }', 256, 80, { color: MUTED, size: 22 });
  caption(p, '4 tipos de constructores', 256, 400, { color: '#f1f1f1', size: 24 });
  caption(p, 'Punto.origen() · const Punto(0,0)', 256, 450, { color: MUTED, size: 18 });
}

export function constructorFactory(p) {
  baseBg(p);
  fnPill(p, 256, 100, 'factory Config()', { w: 260, h: 56, size: 22, color: GREEN });
  p.arrow(160, 145, 130, 230, { color: GREEN });
  p.arrow(352, 145, 382, 230, { color: MUTED });
  box(p, 40, 240, 180, 130, { color: GREEN, label: 'caché' });
  varChip(p, 130, 320, 'misma inst.', { w: 150, size: 16, color: GREEN });
  box(p, 292, 240, 180, 130, { color: MUTED, label: 'nueva' });
  varChip(p, 382, 320, 'o decide', { w: 130, size: 16 });
  caption(p, 'devuelve instancias existentes', 256, 420, { color: '#f1f1f1', size: 22 });
  caption(p, 'caches · singletons', 256, 460, { color: GREEN, size: 22 });
}
