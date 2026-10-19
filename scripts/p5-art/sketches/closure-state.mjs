// scripts/p5-art/sketches/closure-state.mjs — closures con estado: contador, fábricas, encapsulado, fugas.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, varChip } from '../primitives.mjs';

export function contadorIndependiente(p) {
  baseBg(p);
  fnPill(p, 256, 90, 'contador()', { w: 190, h: 56, size: 24 });
  p.arrow(160, 130, 130, 230, { color: CYAN });
  p.arrow(352, 130, 382, 230, { color: MAGENTA });
  box(p, 40, 240, 180, 140, { color: CYAN, label: 'entorno 1' });
  varChip(p, 130, 320, 'cuenta=1', { w: 120, size: 18, color: CYAN });
  box(p, 292, 240, 180, 140, { color: MAGENTA, label: 'entorno 2' });
  varChip(p, 382, 320, 'cuenta=1', { w: 120, size: 18, color: MAGENTA });
  caption(p, 'c1() y c2() → valores independientes', 256, 440, { color: '#f1f1f1', size: 22 });
}

export function fabricaDeFunciones(p) {
  baseBg(p);
  fnPill(p, 140, 130, 'multiplicadorPor(2)', { w: 260, h: 58, size: 22 });
  p.arrow(260, 160, 340, 250, { color: CYAN });
  fnPill(p, 360, 290, '(n) => n*2', { w: 200, h: 56, size: 22, color: GREEN });
  badge(p, 200, 300, '(3) → 6', { color: GREEN, size: 22, w: 130 });
  p.arrow(250, 280, 280, 285, { color: MUTED, dashed: true });
  caption(p, 'una función que devuelve closures', 256, 420, { color: '#f1f1f1', size: 22 });
  caption(p, 'fábrica de funciones', 256, 460, { color: CYAN, size: 24 });
}

export function estadoPrivadoConClosures(p) {
  baseBg(p);
  box(p, 60, 90, 392, 300, { color: MUTED, label: 'cuentaBanco()' });
  varChip(p, 256, 180, '_saldo', { w: 120, color: AMBER });
  caption(p, 'privado', 340, 180, { color: MUTED, size: 16 });
  fnPill(p, 150, 290, 'depositar()', { w: 170, h: 52, size: 20, color: GREEN });
  fnPill(p, 360, 290, 'saldo()', { w: 140, h: 52, size: 20, color: CYAN });
  p.arrow(200, 220, 175, 260, { color: GREEN, dashed: true });
  p.arrow(310, 220, 340, 260, { color: CYAN, dashed: true });
  caption(p, '_saldo solo vía sus closures', 256, 440, { color: '#f1f1f1', size: 22 });
}

export function fugasDeMemoria(p) {
  baseBg(p);
  box(p, 50, 80, 200, 260, { color: MUTED, label: 'listener' });
  fnPill(p, 150, 190, 'onTap', { w: 120, h: 50, size: 22, color: CYAN });
  varChip(p, 150, 280, 'objeto grande', { w: 160, size: 16, color: AMBER });
  box(p, 300, 130, 170, 160, { color: MAGENTA, label: 'closure vivo' });
  p.arrow(255, 200, 298, 200, { color: MAGENTA });
  badge(p, 385, 250, 'no se libera', { color: MAGENTA, size: 18, w: 140 });
  caption(p, 'mientras exista el closure,', 256, 400, { color: '#f1f1f1', size: 22 });
  caption(p, 'captura → memoria retenida', 256, 440, { color: MUTED, size: 20 });
  caption(p, 'cancela listeners en dispose', 256, 478, { color: AMBER, size: 18 });
}

export function iife(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.text('(() => 42)()', 256, 170, { size: 44 });
  p.pop();
  p.arrow(256, 230, 256, 300, { color: CYAN });
  badge(p, 256, 340, '42', { color: GREEN, size: 30, w: 100 });
  caption(p, 'función anónima invocada ya', 256, 430, { color: '#f1f1f1', size: 22 });
  caption(p, 'IIFE', 256, 470, { color: CYAN, size: 26 });
}

export function funcionLocalAnidada(p) {
  baseBg(p);
  box(p, 60, 60, 392, 340, { color: MUTED, label: 'externa()' });
  varChip(p, 140, 150, 'x = 3', { w: 100 });
  box(p, 110, 200, 292, 160, { color: CYAN, label: 'interna()' });
  fnPill(p, 256, 290, 've a x', { w: 130, h: 50, size: 22, color: CYAN });
  p.arrow(145, 175, 200, 250, { color: MAGENTA, dashed: true });
  caption(p, 'solo existe dentro', 256, 440, { color: MUTED, size: 20 });
  caption(p, 've las variables de la contenedora', 256, 475, { color: '#f1f1f1', size: 20 });
  dots(p, 120, 175, 190, { color: MUTED });
}
