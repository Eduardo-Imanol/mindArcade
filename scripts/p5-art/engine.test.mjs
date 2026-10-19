import { describe, expect, it } from 'vitest';
import { Sketch, escapeXml, hashSeed, mulberry32, renderSketch } from './engine.mjs';

describe('seeded randomness', () => {
  it('hashSeed is stable and mulberry32 is deterministic', () => {
    expect(hashSeed('closure')).toBe(hashSeed('closure'));
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('escapeXml', () => {
  it('escapes xml special chars', () => {
    expect(escapeXml('a < b & c > "d" \'e\'')).toBe('a &lt; b &amp; c &gt; &quot;d&quot; &apos;e&apos;');
  });
});

describe('Sketch', () => {
  it('emits accessible svg with title and aria-label', () => {
    const svg = renderSketch((p) => {
      p.background('#1a0b2e');
    }, { label: '¿Qué es un closure?' });
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="¿Qué es un closure?"');
    expect(svg).toContain('<title>¿Qué es un closure?</title>');
  });

  it('is deterministic for the same seed and sketch', () => {
    const sketch = (p) => {
      p.background('#1a0b2e');
      p.fill('#00ffcc');
      p.circle(p.random() * 100, 50, 20);
    };
    const a = renderSketch(sketch, { label: 'x', seed: 7 });
    const b = renderSketch(sketch, { label: 'x', seed: 7 });
    expect(a).toBe(b);
  });

  it('draws shapes with fill and stroke attributes', () => {
    const svg = renderSketch((p) => {
      p.background('#000');
      p.fill('#111');
      p.stroke('#00ffcc');
      p.strokeWeight(3);
      p.rect(10, 20, 100, 50, 8);
      p.circle(60, 60, 40);
      p.ellipse(10, 10, 30, 20);
      p.line(0, 0, 100, 100);
      p.text('f(x)', 50, 50, { size: 24 });
      p.arrow(0, 0, 50, 50, { color: '#ff007f' });
      p.poly([[0, 0], [10, 0], [10, 10]], { color: '#39ff14' });
    }, { label: 'shapes' });
    expect(svg).toContain('<rect x="10" y="20" width="100" height="50" rx="8"');
    expect(svg).toContain('<ellipse');
    expect(svg).toContain('stroke-width="3"');
    expect(svg).toContain('f(x)');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('<line');
  });

  it('push/pop restores style and translate', () => {
    const p = new Sketch(100, 100, 1);
    p.stroke('#00ffcc');
    p.translate(10, 10);
    p.push();
    p.stroke('#ff007f');
    p.translate(5, 5);
    p.pop();
    p.line(0, 0, 10, 10);
    const svg = p.toSVG({ label: 't' });
    expect(svg).toContain('x1="10" y1="10"');
    expect(svg).toContain('stroke="#00ffcc"');
    expect(svg).not.toContain('stroke="#ff007f"');
  });

  it('dash applies stroke-dasharray', () => {
    const svg = renderSketch((p) => {
      p.stroke('#8a7fb5');
      p.dash('9 8');
      p.rect(0, 0, 50, 50);
    }, { label: 'd' });
    expect(svg).toContain('stroke-dasharray="9 8"');
  });
});
