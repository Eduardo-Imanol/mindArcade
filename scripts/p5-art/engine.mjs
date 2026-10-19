// scripts/p5-art/engine.mjs — zero-dep mini p5-style sketch API that emits SVG.
// Instance mode: const p = new Sketch(w, h, seed); setup(p); p.toSVG({ label }).
import { BG2, HUES, hsl } from './palette.mjs';

export function hashSeed(text = '') {
  let h = 2166136261;
  const str = String(text);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function escapeXml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const num = (value) => Math.round(value * 100) / 100;

export class Sketch {
  constructor(w = 512, h = 512, seed = 1) {
    this.w = w;
    this.h = h;
    this._els = [];
    this._stack = [];
    this._rand = mulberry32(seed >>> 0);
    this._fill = null;
    this._stroke = '#f1f1f1';
    this._sw = 2;
    this._tx = 0;
    this._ty = 0;
    this._textSize = 28;
    this._textAlign = 'center';
    this._textWeight = 700;
    this._radius = 10;
    this._dash = null;
  }

  background(color = BG2) {
    this._els.push(`<rect x="0" y="0" width="${this.w}" height="${this.h}" fill="${color}"/>`);
  }

  fill(color) {
    this._fill = color;
  }

  noFill() {
    this._fill = null;
  }

  stroke(color) {
    this._stroke = color;
  }

  noStroke() {
    this._stroke = null;
  }

  strokeWeight(value) {
    this._sw = value;
  }

  cornerRadius(value) {
    this._radius = value;
  }

  dash(value) {
    this._dash = value;
  }

  textSize(value) {
    this._textSize = value;
  }

  textAlign(value) {
    this._textAlign = value;
  }

  textWeight(value) {
    this._textWeight = value;
  }

  push() {
    this._stack.push({
      _fill: this._fill,
      _stroke: this._stroke,
      _sw: this._sw,
      _tx: this._tx,
      _ty: this._ty,
      _textSize: this._textSize,
      _textAlign: this._textAlign,
      _textWeight: this._textWeight,
      _radius: this._radius,
      _dash: this._dash,
    });
  }

  pop() {
    const saved = this._stack.pop();
    if (saved) Object.assign(this, saved);
  }

  translate(x, y) {
    this._tx += x;
    this._ty += y;
  }

  random() {
    return this._rand();
  }

  randomSeed(seed) {
    this._rand = mulberry32(seed >>> 0);
  }

  circle(x, y, d) {
    this.ellipse(x, y, d, d);
  }

  ellipse(x, y, w, h) {
    this._shape(
      `<ellipse cx="${num(x + this._tx)}" cy="${num(y + this._ty)}" rx="${num(w / 2)}" ry="${num(h / 2)}"`
    );
  }

  rect(x, y, w, h, r = this._radius) {
    this._shape(
      `<rect x="${num(x + this._tx)}" y="${num(y + this._ty)}" width="${num(w)}" height="${num(h)}" rx="${num(r)}"`
    );
  }

  line(x1, y1, x2, y2, { color, weight } = {}) {
    const strokeColor = color ?? this._stroke;
    if (!strokeColor) return;
    const width = weight ?? this._sw;
    const dash = this._dash ? ` stroke-dasharray="${this._dash}"` : '';
    this._els.push(
      `<line x1="${num(x1 + this._tx)}" y1="${num(y1 + this._ty)}" x2="${num(x2 + this._tx)}" y2="${num(y2 + this._ty)}" stroke="${strokeColor}" stroke-width="${num(width)}" stroke-linecap="round"${dash}/>`
    );
  }

  poly(points, { close = true, color } = {}) {
    const pts = points.map(([x, y]) => `${num(x + this._tx)},${num(y + this._ty)}`).join(' ');
    const fill = close ? this._fill ?? color ?? 'none' : color ?? this._fill ?? 'none';
    const strokeAttr = this._stroke ? ` stroke="${this._stroke}" stroke-width="${num(this._sw)}"` : '';
    const tag = close ? 'polygon' : 'polyline';
    this._els.push(`<${tag} points="${pts}" fill="${fill}"${strokeAttr}/>`);
  }

  arrow(x1, y1, x2, y2, { color = this._stroke, head = 12, dashed = false } = {}) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const back = head * 0.9;
    const bx = x2 - Math.cos(angle) * back;
    const by = y2 - Math.sin(angle) * back;
    const left = angle + Math.PI * 0.82;
    const right = angle - Math.PI * 0.82;
    const dash = dashed ? ' stroke-dasharray="8 7"' : '';
    this._els.push(
      `<line x1="${num(x1 + this._tx)}" y1="${num(y1 + this._ty)}" x2="${num(bx + this._tx)}" y2="${num(by + this._ty)}" stroke="${color}" stroke-width="${num(this._sw)}" stroke-linecap="round"${dash}/>`
    );
    this._els.push(
      `<polygon points="${num(x2 + this._tx)},${num(y2 + this._ty)} ${num((x2 + Math.cos(left) * head) + this._tx)},${num((y2 + Math.sin(left) * head) + this._ty)} ${num((x2 + Math.cos(right) * head) + this._tx)},${num((y2 + Math.sin(right) * head) + this._ty)}" fill="${color}"/>`
    );
  }

  text(value, x, y, { size, align, weight, color } = {}) {
    const anchor = align || this._textAlign;
    const fill = color || this._fill || '#f1f1f1';
    this._els.push(
      `<text x="${num(x + this._tx)}" y="${num(y + this._ty)}" text-anchor="${anchor}" dominant-baseline="central" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${num(size || this._textSize)}" font-weight="${weight || this._textWeight}" fill="${fill}">${escapeXml(value)}</text>`
    );
  }

  _shape(open) {
    const attrs = [];
    if (this._fill) attrs.push(`fill="${this._fill}"`);
    else attrs.push('fill="none"');
    if (this._stroke) attrs.push(`stroke="${this._stroke}" stroke-width="${num(this._sw)}"`);
    if (this._dash) attrs.push(`stroke-dasharray="${this._dash}"`);
    this._els.push(`${open} ${attrs.join(' ')}/>`);
  }

  toSVG({ label = 'Ilustración' } = {}) {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-label="${escapeXml(label)}">`,
      `<title>${escapeXml(label)}</title>`,
      ...this._els,
      '</svg>',
      '',
    ].join('\n');
  }
}

export function baseBg(p, { bubbles = 4, hue } = {}) {
  p.background(BG2);
  const picked = hue ?? HUES[Math.floor(p.random() * HUES.length)];
  for (let i = 0; i < bubbles; i += 1) {
    const x = p.random() * p.w;
    const y = p.random() * p.h;
    const r = (0.14 + p.random() * 0.26) * p.w;
    p.push();
    p.noStroke();
    p.fill(hsl(picked, 90, 58, Number((0.14 + p.random() * 0.1).toFixed(3))));
    p.circle(x, y, r * 2);
    p.pop();
  }
}

export function renderSketch(setupFn, { label, seed = 1, size = 512 } = {}) {
  const p = new Sketch(size, size, seed);
  setupFn(p);
  return p.toSVG({ label });
}
