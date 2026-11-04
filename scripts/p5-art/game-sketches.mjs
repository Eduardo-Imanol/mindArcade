import { baseBg } from './engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT, hsl } from './palette.mjs';
import { badge, caption, varChip } from './primitives.mjs';

function tile(p, x, y, w, h, { color = MUTED, text = '?', dashed = false, fill = 'rgba(26, 11, 46, .92)', size = 30 } = {}) {
  p.push();
  p.fill(fill);
  p.stroke(color);
  p.strokeWeight(2.5);
  p.dash(dashed ? '8 7' : null);
  p.rect(x, y, w, h, 12);
  p.dash(null);
  p.noStroke();
  p.fill(TEXT);
  p.text(text, x + w / 2, y + h / 2, { size });
  p.pop();
}

function option(p, x, y, w, h, { color = MAGENTA, text = '?', size = 22 } = {}) {
  p.push();
  p.fill('rgba(255, 0, 127, .06)');
  p.stroke(color);
  p.strokeWeight(2.5);
  p.rect(x, y, w, h, 12);
  p.noStroke();
  p.fill(TEXT);
  p.text(text, x + w / 2, y + h / 2, { size });
  p.pop();
}

export function flashcards(p) {
  baseBg(p, { bubbles: 3, hue: 168 });
  tile(p, 82, 64, 150, 190, { color: MAGENTA, text: 'Q', fill: 'rgba(255, 0, 127, .07)', size: 58 });
  caption(p, 'pregunta', 157, 212, { color: MUTED, size: 19 });
  tile(p, 280, 64, 150, 190, { color: GREEN, text: 'A', fill: 'rgba(57, 255, 20, .07)', size: 58 });
  caption(p, 'respuesta', 355, 212, { color: MUTED, size: 19 });
  p.arrow(240, 158, 272, 158, { color: CYAN, head: 10 });
  caption(p, 'voltea y autoevalúa', 256, 292, { color: CYAN, size: 20 });
}

export function memorama(p) {
  baseBg(p, { bubbles: 3, hue: 320 });
  const xs = [116, 220, 324];
  const ys = [50, 146];
  tile(p, xs[0], ys[0], 92, 82, { color: GREEN, text: 'A', fill: 'rgba(57, 255, 20, .1)' });
  tile(p, xs[1], ys[0], 92, 82, { color: GREEN, text: 'A', fill: 'rgba(57, 255, 20, .1)' });
  tile(p, xs[2], ys[0], 92, 82, { color: MUTED, dashed: true });
  tile(p, xs[0], ys[1], 92, 82, { color: MUTED, dashed: true });
  tile(p, xs[1], ys[1], 92, 82, { color: CYAN, text: 'B', fill: 'rgba(0, 255, 204, .08)' });
  tile(p, xs[2], ys[1], 92, 82, { color: MUTED, dashed: true });
  caption(p, 'empareja y recuerda', 256, 282, { color: MAGENTA, size: 20 });
}

export function ahorcado(p) {
  baseBg(p, { bubbles: 3, hue: 45 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(4);
  p.line(70, 240, 220, 240);
  p.line(140, 240, 140, 52);
  p.line(140, 56, 320, 56);
  p.line(320, 56, 320, 92);
  p.pop();
  p.push();
  p.stroke(CYAN);
  p.strokeWeight(4);
  p.circle(320, 113, 40);
  p.line(320, 133, 320, 190);
  p.line(320, 150, 292, 172);
  p.line(320, 150, 348, 172);
  p.line(320, 190, 296, 228);
  p.line(320, 190, 344, 228);
  p.pop();
  p.push();
  p.stroke(MUTED);
  p.strokeWeight(3);
  for (let i = 0; i < 4; i += 1) p.line(72 + i * 46, 264, 106 + i * 46, 264);
  p.pop();
  tile(p, 392, 72, 58, 52, { color: CYAN, text: 'A', size: 24 });
  tile(p, 392, 140, 58, 52, { color: MAGENTA, text: 'E', size: 24 });
  tile(p, 392, 208, 58, 52, { color: MUTED, text: '?', size: 24 });
  caption(p, 'adivina la palabra', 256, 300, { color: MUTED, size: 19 });
}

export function quizSignificado(p) {
  baseBg(p, { bubbles: 3, hue: 265 });
  p.push();
  p.fill('rgba(0, 255, 204, .08)');
  p.stroke(CYAN);
  p.strokeWeight(2.5);
  p.rect(116, 30, 280, 56, 14);
  p.noStroke();
  p.fill(TEXT);
  p.text('elige el significado', 256, 58, { size: 20 });
  p.pop();
  option(p, 74, 112, 170, 62, { color: MAGENTA, text: 'opción' });
  option(p, 268, 112, 170, 62, { color: MAGENTA, text: 'opción' });
  option(p, 74, 192, 170, 62, { color: GREEN, text: '✓ correcta', size: 20 });
  option(p, 268, 192, 170, 62, { color: MAGENTA, text: 'opción' });
  caption(p, 'elige 1 de 4', 256, 292, { color: CYAN, size: 20 });
}

export function intruso(p) {
  baseBg(p, { bubbles: 3, hue: 320 });
  option(p, 76, 62, 168, 70, { color: CYAN, text: 'del tema' });
  option(p, 268, 62, 168, 70, { color: CYAN, text: 'del tema' });
  option(p, 76, 152, 168, 70, { color: CYAN, text: 'del tema' });
  option(p, 268, 152, 168, 70, { color: MAGENTA, text: 'otro tema' });
  caption(p, 'encuentra el que sobra', 256, 282, { color: GREEN, size: 20 });
}

export function lluviaMeteoros(p) {
  baseBg(p, { bubbles: 3, hue: 45 });
  p.push();
  p.stroke(hsl(45, 90, 60, 0.28));
  p.strokeWeight(12);
  p.line(348, 18, 276, 78);
  p.stroke(AMBER);
  p.strokeWeight(2.5);
  p.line(348, 18, 276, 78);
  p.noStroke();
  p.fill(hsl(45, 92, 62));
  p.circle(266, 86, 38);
  p.fill(hsl(45, 92, 72, 0.5));
  p.circle(258, 78, 14);
  p.pop();
  option(p, 56, 214, 120, 54, { color: MAGENTA, text: 'A' });
  option(p, 196, 214, 120, 54, { color: GREEN, text: 'B' });
  option(p, 336, 214, 120, 54, { color: MAGENTA, text: 'C' });
  p.push();
  p.stroke(MUTED);
  p.strokeWeight(2);
  p.dash('7 8');
  p.line(266, 110, 266, 204);
  p.dash(null);
  p.pop();
  caption(p, 'responde antes del impacto', 256, 294, { color: AMBER, size: 20 });
}

export function conectaPares(p) {
  baseBg(p, { bubbles: 3, hue: 168 });
  p.push();
  p.stroke(GREEN);
  p.strokeWeight(3);
  p.line(224, 77, 288, 219);
  p.stroke(CYAN);
  p.line(224, 149, 288, 77);
  p.line(224, 221, 288, 149);
  p.noStroke();
  p.fill(GREEN);
  p.circle(224, 77, 10);
  p.circle(288, 219, 10);
  p.fill(CYAN);
  p.circle(224, 149, 10);
  p.circle(288, 77, 10);
  p.circle(224, 221, 10);
  p.circle(288, 149, 10);
  p.pop();
  option(p, 64, 54, 160, 46, { color: CYAN, text: 'término', size: 20 });
  option(p, 64, 126, 160, 46, { color: CYAN, text: 'término', size: 20 });
  option(p, 64, 198, 160, 46, { color: CYAN, text: 'término', size: 20 });
  option(p, 288, 54, 160, 46, { color: CYAN, text: 'significado', size: 18 });
  option(p, 288, 126, 160, 46, { color: CYAN, text: 'significado', size: 18 });
  option(p, 288, 198, 160, 46, { color: GREEN, text: 'significado', size: 18 });
  caption(p, 'toca ambas columnas', 256, 288, { color: CYAN, size: 20 });
}

export function serpienteSignificados(p) {
  baseBg(p, { bubbles: 3, hue: 120 });
  p.push();
  p.noStroke();
  p.fill(hsl(120, 90, 60, 0.12));
  for (let x = 40; x <= 472; x += 54) {
    for (let y = 36; y <= 260; y += 54) p.circle(x, y, 5);
  }
  const path = [
    [88, 244],
    [136, 212],
    [188, 224],
    [238, 190],
    [288, 204],
    [330, 172],
  ];
  p.stroke(hsl(120, 90, 28));
  p.strokeWeight(20);
  for (let i = 1; i < path.length; i += 1) p.line(...path[i - 1], ...path[i]);
  p.stroke(GREEN);
  p.strokeWeight(12);
  for (let i = 1; i < path.length; i += 1) p.line(...path[i - 1], ...path[i]);
  p.pop();
  p.push();
  p.fill(GREEN);
  p.stroke(hsl(120, 90, 28));
  p.strokeWeight(3);
  p.circle(330, 172, 40);
  p.noStroke();
  p.fill('#0f051d');
  p.circle(338, 165, 7);
  p.fill(TEXT);
  p.circle(339, 164, 3);
  p.pop();
  p.push();
  p.fill(MAGENTA);
  p.stroke(hsl(320, 90, 40));
  p.strokeWeight(3);
  p.circle(402, 108, 46);
  p.noStroke();
  p.fill(GREEN);
  p.rect(397, 76, 10, 18, 4);
  p.fill(TEXT);
  p.text('1', 402, 108, { size: 24 });
  p.pop();
  caption(p, 'come el significado correcto', 256, 294, { color: GREEN, size: 19 });
}

export function ordenaCodigo(p) {
  baseBg(p, { bubbles: 3, hue: 168 });
  const pieces = ['return a + b;', '}', 'const total = a + b;', 'function suma(a, b) {'];
  pieces.forEach((text, index) => {
    const y = 44 + index * 54;
    tile(p, 34, y, 206, 44, {
      color: index === 0 ? GREEN : CYAN,
      text,
      size: 15,
    });
  });
  p.arrow(254, 158, 292, 158, { color: MAGENTA, head: 10 });
  p.push();
  p.fill('rgba(57, 255, 20, .06)');
  p.stroke(GREEN);
  p.strokeWeight(2.5);
  p.rect(306, 44, 176, 206, 12);
  p.noStroke();
  p.fill(TEXT);
  const ordered = ['function suma(a, b) {', 'const total = a + b;', 'return a + b;', '}'];
  ordered.forEach((text, index) => {
    p.text(`${index + 1} ${text}`, 318, 74 + index * 46, { size: 13, align: 'start' });
  });
  p.pop();
  caption(p, 'ordena las piezas', 256, 292, { color: GREEN, size: 20 });
}

export function escribeCodigo(p) {
  baseBg(p, { bubbles: 3, hue: 265 });
  p.push();
  p.fill('rgba(15, 5, 29, .92)');
  p.stroke(CYAN);
  p.strokeWeight(2.5);
  p.rect(42, 34, 428, 212, 14);
  p.noStroke();
  p.fill(MUTED);
  p.circle(64, 54, 9);
  p.circle(84, 54, 9);
  p.circle(104, 54, 9);
  p.fill(TEXT);
  const lines = [
    'function suma(a, b) {',
    '  const total = a + b;',
    '  return total;',
    '}',
  ];
  lines.forEach((text, index) => {
    p.text(text, 66, 88 + index * 34, { size: 17, align: 'start' });
  });
  p.fill(GREEN);
  p.rect(68, 190, 10, 22, 2);
  p.pop();
  badge(p, 384, 206, '✓ 3/3 casos', { color: GREEN, size: 18 });
  caption(p, 'escribe y ejecuta', 256, 286, { color: CYAN, size: 20 });
}

export function completaCodigo(p) {
  baseBg(p, { bubbles: 3, hue: 320 });
  const rows = [
    ['function suma(a, b) {', CYAN],
    ['  const total = ', MUTED],
    ['  return ', MUTED],
    ['}', CYAN],
  ];
  rows.forEach(([text], index) => {
    const y = 40 + index * 48;
    p.push();
    p.noStroke();
    p.fill(TEXT);
    p.text(text, 46, y + 22, { size: 17, align: 'start' });
    p.pop();
    if (index === 1 || index === 2) {
      tile(p, index === 1 ? 238 : 176, y + 2, 96, 30, {
        color: MAGENTA,
        text: index === 1 ? 'a + b' : 'total',
        size: 15,
      });
    }
    if (index === 0) tile(p, 340, y + 2, 96, 30, { color: MUTED, text: '?', size: 15 });
  });
  p.arrow(256, 236, 256, 210, { color: GREEN, head: 9 });
  varChip(p, 150, 258, 'a + b', { color: MAGENTA, size: 17 });
  varChip(p, 256, 258, 'total', { color: MAGENTA, size: 17 });
  varChip(p, 362, 258, 'return', { color: MUTED, size: 17 });
  caption(p, 'rellena los huecos', 256, 300, { color: MAGENTA, size: 19 });
}

export const GAME_SKETCHES = {
  flashcards,
  memorama,
  ahorcado,
  'quiz-significado': quizSignificado,
  intruso,
  'lluvia-meteoros': lluviaMeteoros,
  'conecta-pares': conectaPares,
  'serpiente-significados': serpienteSignificados,
  'ordena-codigo': ordenaCodigo,
  'escribe-codigo': escribeCodigo,
  'completa-codigo': completaCodigo,
};
