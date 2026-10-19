// scripts/p5-art/sketches/params.mjs — parámetros: posicionales, nombrados, required, defecto, callbacks.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { badge, box, bracket, caption, fnPill, varChip } from '../primitives.mjs';

export function posicionalesOpcionales(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'f(a, [b])', { w: 210, h: 62, size: 28 });
  bracket(p, 268, 250, 90, '[');
  bracket(p, 356, 250, 90, ']');
  varChip(p, 232, 250, 'a', { w: 56, h: 48, color: CYAN });
  varChip(p, 312, 250, 'b?', { w: 56, h: 48, color: AMBER });
  caption(p, 'obligatorio', 232, 320, { color: CYAN, size: 20 });
  caption(p, 'opcional o null', 312, 320, { color: AMBER, size: 20 });
  caption(p, 'entre corchetes', 256, 420, { color: MUTED, size: 22 });
}

export function parametrosNombrados(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'f({a, b})', { w: 210, h: 62, size: 28 });
  bracket(p, 232, 260, 110, '{', { color: MAGENTA });
  bracket(p, 360, 260, 110, '}', { color: MAGENTA });
  varChip(p, 272, 230, 'a:', { w: 64, color: MAGENTA });
  varChip(p, 320, 300, 'b:', { w: 64, color: MAGENTA });
  caption(p, 'se pasan por nombre', 256, 400, { color: '#f1f1f1', size: 24 });
  caption(p, 'opcionales salvo required', 256, 440, { color: MUTED, size: 20 });
}

export function requiredEnNombrado(p) {
  baseBg(p);
  fnPill(p, 256, 130, 'f({required a})', { w: 280, h: 62, size: 26 });
  badge(p, 256, 250, 'required', { color: MAGENTA, size: 26, w: 170 });
  p.arrow(256, 180, 256, 218, { color: MAGENTA });
  caption(p, 'obliga a pasar a:', 256, 330, { color: '#f1f1f1', size: 24 });
  caption(p, 'estándar en Flutter · APIs legibles', 256, 420, { color: MUTED, size: 20 });
}

export function combinarCorchetesLlaves(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'f(a, [b], {c})', { w: 280, h: 60, size: 24 });
  badge(p, 256, 230, '✗ no', { color: MAGENTA, size: 30, w: 130 });
  caption(p, 'un solo estilo de opcionales', 256, 320, { color: '#f1f1f1', size: 24 });
  caption(p, 'posicionales primero', 256, 370, { color: MUTED, size: 22 });
  badge(p, 256, 440, 'f(a, [b])  ·  f(a, {c})', { color: GREEN, size: 20, w: 300 });
}

export function obligatoriosVsOpcionales(p) {
  baseBg(p);
  box(p, 56, 120, 180, 200, { color: CYAN, label: 'a, b' });
  caption(p, 'orden importa', 146, 210, { color: '#f1f1f1', size: 22 });
  caption(p, 'van primero', 146, 250, { color: MUTED, size: 18 });
  box(p, 276, 120, 180, 200, { color: AMBER, label: '[c, d]' });
  caption(p, 'orden libre', 366, 210, { color: '#f1f1f1', size: 22 });
  caption(p, 'en corchetes', 366, 250, { color: MUTED, size: 18 });
  p.arrow(236, 220, 276, 220, { color: MUTED });
  caption(p, 'obligatorios ≠ opcionales', 256, 420, { color: MUTED, size: 22 });
}

export function valoresPorDefectoConstantes(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'f([a = 1])', { w: 220, h: 58, size: 26 });
  badge(p, 160, 250, 'const ✓', { color: GREEN, size: 24, w: 150 });
  badge(p, 360, 250, 'runtime ✗', { color: MAGENTA, size: 24, w: 160 });
  caption(p, 'debe ser const de compilación', 256, 360, { color: '#f1f1f1', size: 24 });
  caption(p, 'nunca calculado en ejecución', 256, 410, { color: MUTED, size: 20 });
}

export function valorNoConstanteComoDefecto(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'f([List? l])', { w: 230, h: 60, size: 24 });
  p.arrow(256, 165, 256, 225, { color: CYAN });
  box(p, 116, 240, 280, 80, { color: AMBER, label: null });
  p.push();
  p.noStroke();
  p.fill(AMBER);
  p.text('l ??= []', 256, 280, { size: 34 });
  p.pop();
  caption(p, 'nulable + ??= dentro', 256, 390, { color: '#f1f1f1', size: 24 });
  caption(p, 'lista vacía en cada llamada', 256, 430, { color: MUTED, size: 20 });
}

export function parametroCallback(p) {
  baseBg(p);
  fnPill(p, 200, 200, 'f(fn)', { w: 130, h: 58, size: 26 });
  fnPill(p, 380, 200, '(x) => …', { w: 160, h: 58, size: 24, color: MAGENTA });
  p.arrow(268, 200, 298, 200, { color: CYAN });
  p.arrow(380, 240, 380, 310, { color: MAGENTA });
  box(p, 290, 320, 180, 60, { color: MUTED, label: null });
  caption(p, 'fn(x) se invoca', 380, 350, { color: '#f1f1f1', size: 22 });
  caption(p, 'parametro de tipo int Function(int)', 240, 440, { color: MUTED, size: 18 });
}

export function argumentosVariables(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'f(List args)', { w: 240, h: 58, size: 24 });
  varChip(p, 130, 260, '[1, 2, 3]', { w: 130, color: CYAN, size: 20 });
  p.arrow(200, 240, 240, 170, { color: CYAN });
  caption(p, 'no existe …args', 256, 350, { color: MAGENTA, size: 24 });
  badge(p, 380, 260, '…spread', { color: GREEN, size: 20, w: 130 });
  p.arrow(330, 250, 300, 180, { color: GREEN, dashed: true });
  caption(p, 'o usa … al llamar', 256, 420, { color: MUTED, size: 20 });
}

export function parametrosGenericos(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'T primero<T>()', { w: 270, h: 62, size: 24 });
  varChip(p, 140, 280, 'T=int', { w: 100, color: CYAN });
  varChip(p, 256, 280, 'T=str', { w: 100, color: MAGENTA });
  varChip(p, 372, 280, 'T=bool', { w: 110, color: GREEN });
  caption(p, 'T se infiere en la llamada', 256, 380, { color: '#f1f1f1', size: 24 });
  caption(p, ' admite restricción extends', 256, 430, { color: MUTED, size: 20 });
}

export function parametrosFinal(p) {
  baseBg(p);
  fnPill(p, 256, 130, 'f(final x)', { w: 200, h: 60, size: 28 });
  varChip(p, 256, 270, 'x = 1', { w: 110, color: CYAN });
  p.arrow(256, 175, 256, 235, { color: CYAN });
  badge(p, 256, 360, 'x = 2 ✗', { color: MAGENTA, size: 26, w: 150 });
  caption(p, 'parámetros = variables locales', 256, 440, { color: MUTED, size: 22 });
}

export function cuandoNombradosRequired(p) {
  baseBg(p);
  box(p, 50, 100, 200, 140, { color: MAGENTA, label: null });
  caption(p, 'más de', 150, 150, { color: '#f1f1f1', size: 24 });
  caption(p, '2-3 args', 150, 195, { color: MAGENTA, size: 28 });
  box(p, 262, 100, 200, 140, { color: AMBER, label: null });
  caption(p, 'booleans', 362, 150, { color: '#f1f1f1', size: 24 });
  caption(p, 'ambiguos', 362, 195, { color: AMBER, size: 24 });
  p.arrow(150, 260, 150, 330, { color: MUTED });
  p.arrow(362, 260, 362, 330, { color: MUTED });
  badge(p, 256, 370, 'autodocumenta', { color: GREEN, size: 24, w: 230 });
  caption(p, 'f(nombre: "Ana", esAdmin: true)', 256, 445, { color: MUTED, size: 18 });
}
