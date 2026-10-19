// scripts/p5-art/primitives.mjs — reusable diagram components over the mini p5 engine.
import { CYAN, GREEN, MAGENTA, MUTED, TEXT, hsl } from './palette.mjs';

export function fnPill(p, cx, cy, label, { w = 150, h = 62, color = CYAN, size = 28 } = {}) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  p.push();
  p.fill('rgba(0, 255, 204, 0.08)');
  p.stroke(color);
  p.strokeWeight(2.5);
  p.rect(x, y, w, h, 14);
  p.noStroke();
  p.fill(TEXT);
  p.text(label, cx, cy, { size });
  p.pop();
  return { x, y, w, h, cx, cy };
}

export function varChip(p, cx, cy, label, { w = 78, h = 42, color = MAGENTA, size = 22 } = {}) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  p.push();
  p.fill('rgba(255, 0, 127, 0.1)');
  p.stroke(color);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 10);
  p.noStroke();
  p.fill(TEXT);
  p.text(label, cx, cy, { size });
  p.pop();
  return { x, y, w, h, cx, cy };
}

export function box(p, x, y, w, h, { color = MUTED, label = null, dashed = false, fill = 'rgba(15, 5, 29, 0.55)', size = 22 } = {}) {
  p.push();
  p.fill(dashed ? null : fill);
  p.stroke(color);
  p.strokeWeight(2.5);
  p.dash(dashed ? '9 8' : null);
  p.rect(x, y, w, h, 12);
  p.dash(null);
  if (label) {
    p.noStroke();
    p.fill(color);
    p.text(label, x + 14, y + 18, { size, align: 'start', weight: 700 });
  }
  p.pop();
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

export function stackFrame(p, x, y, w, h, label, { color = CYAN, size = 22 } = {}) {
  p.push();
  p.fill('rgba(0, 255, 204, 0.07)');
  p.stroke(color);
  p.strokeWeight(2);
  p.rect(x, y, w, h, 8);
  p.stroke(color);
  p.line(x + 8, y + 8, x + w - 8, y + 8);
  p.noStroke();
  p.fill(TEXT);
  p.text(label, x + w / 2, y + h / 2 + 4, { size });
  p.pop();
  return { x, y, w, h };
}

export function treeNode(p, x, y, label, { r = 30, color = GREEN, size = 22, empty = false } = {}) {
  p.push();
  p.fill(empty ? 'none' : 'rgba(57, 255, 20, 0.1)');
  p.stroke(empty ? MUTED : color);
  p.strokeWeight(2.5);
  p.circle(x, y, r * 2);
  p.noStroke();
  p.fill(empty ? MUTED : TEXT);
  p.text(label, x, y, { size });
  p.pop();
  return { x, y, r };
}

export function badge(p, cx, cy, label, { color = GREEN, w = null, h = 40, size = 22 } = {}) {
  const width = w ?? Math.max(64, label.length * size * 0.62 + 26);
  p.push();
  p.fill('rgba(57, 255, 20, 0.1)');
  p.stroke(color);
  p.strokeWeight(2);
  p.rect(cx - width / 2, cy - h / 2, width, h, h / 2);
  p.noStroke();
  p.fill(color);
  p.text(label, cx, cy, { size });
  p.pop();
  return { x: cx - width / 2, y: cy - h / 2, w: width, h };
}

export function bracket(p, cx, cy, h, kind = '[', { color = CYAN, thick = 3.5 } = {}) {
  const x = cx;
  const half = h / 2;
  const depth = 18;
  p.push();
  p.stroke(color);
  p.strokeWeight(thick);
  p.noFill();
  if (kind === '[') {
    p.line(x + depth, cy - half, x, cy - half);
    p.line(x, cy - half, x, cy + half);
    p.line(x, cy + half, x + depth, cy + half);
  } else {
    p.line(x - depth, cy - half, x, cy - half);
    p.line(x, cy - half, x, cy + half);
    p.line(x, cy + half, x - depth, cy + half);
  }
  p.pop();
}

export function dashRect(p, x, y, w, h, { color = MUTED, r = 12 } = {}) {
  p.push();
  p.noFill();
  p.stroke(color);
  p.strokeWeight(2.5);
  p.rect(x, y, w, h, r);
  p.pop();
}

export function caption(p, text, x, y, { color = MUTED, size = 20, align = 'middle' } = {}) {
  p.push();
  p.noStroke();
  p.fill(color);
  p.text(text, x, y, { size, align, weight: 700 });
  p.pop();
}

export function dots(p, x1, y, x2, { color = MUTED, r = 4, n = 3 } = {}) {
  p.push();
  p.noStroke();
  p.fill(color);
  const span = (x2 - x1) / (n + 1);
  for (let i = 1; i <= n; i += 1) p.circle(x1 + span * i, y, r * 2);
  p.pop();
}

export function glowLine(p, x1, y1, x2, y2, { hue = 168 } = {}) {
  p.push();
  p.stroke(hsl(hue, 90, 60, 0.25));
  p.strokeWeight(8);
  p.line(x1, y1, x2, y2);
  p.stroke(hsl(hue, 90, 65));
  p.strokeWeight(2.5);
  p.line(x1, y1, x2, y2);
  p.pop();
}
