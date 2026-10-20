import { describe, expect, it } from 'vitest';
import { AMBER, BG, BG2, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../../../scripts/p5-art/palette.mjs';
import { BASE_SIZE, PART_COUNT, renderHangman } from './hangman-art.mjs';

const PALETTE = [AMBER, BG, BG2, CYAN, GREEN, MAGENTA, MUTED, TEXT];
const HEX = /#[0-9a-fA-F]{3,8}/g;

const occurrences = (svg, pattern) => (svg.match(pattern) || []).length;
const cyanLines = (svg) => occurrences(svg, new RegExp(`<line[^>]*stroke="${CYAN}"`, 'g'));
const bodyLines = (svg, color) => occurrences(svg, new RegExp(`<line[^>]*stroke="${color}"`, 'g'));
const headCircles = (svg, color) =>
  occurrences(svg, new RegExp(`<ellipse[^>]*stroke="${color}"`, 'g'));

const colorsUsed = (svg) => svg.match(HEX) || [];

const bodyColor = (mistakes) => (mistakes >= 5 ? AMBER : TEXT);

describe('hangman art (AC-7, AC-8)', () => {
  it('is byte-identical for the same seed, mistakes and size', () => {
    const options = { mistakes: 3, cardId: 'q-xyz', size: 512 };
    const a = renderHangman(options);
    const b = renderHangman(options);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('draws only the gallows base with 0 mistakes', () => {
    const svg = renderHangman({ mistakes: 0, cardId: 'q-1' });
    expect(svg).toContain('role="img"');
    expect(cyanLines(svg)).toBe(4);
    expect(svg).not.toContain(`stroke="${TEXT}"`);
    expect(svg).not.toContain(`stroke="${AMBER}"`);
    expect(svg).not.toContain('<ellipse');
  });

  it('adds exactly one part per mistake (0..6)', () => {
    for (let mistakes = 0; mistakes <= PART_COUNT; mistakes += 1) {
      const svg = renderHangman({ mistakes, cardId: `q-${mistakes}` });
      const color = bodyColor(mistakes);
      const expectedBodyLines = mistakes === 0 ? 0 : mistakes - 1;
      expect(cyanLines(svg), `cyan base for mistakes=${mistakes}`).toBe(4);
      expect(bodyLines(svg, color), `body lines for mistakes=${mistakes}`).toBe(expectedBodyLines);
      expect(headCircles(svg, color), `head for mistakes=${mistakes}`).toBe(mistakes >= 1 ? 1 : 0);
    }
  });

  it('omits the head and each limb until its mistake happens', () => {
    const base = renderHangman({ mistakes: 0, cardId: 'q' });
    expect(base).not.toContain('cy="79"');
    expect(base).not.toContain('y1="102"');

    const head = renderHangman({ mistakes: 1, cardId: 'q' });
    expect(head).toContain('cy="79"');
    expect(head).not.toContain('y1="102"');
    expect(head).not.toContain('y1="116"');

    const torso = renderHangman({ mistakes: 2, cardId: 'q' });
    expect(torso).toContain('y1="102"');
    expect(torso).not.toContain('x2="118"');

    const arms = renderHangman({ mistakes: 4, cardId: 'q' });
    expect(arms).toContain('x2="118"');
    expect(arms).toContain('x2="182"');
    expect(arms).not.toContain('x2="120"');

    const complete = renderHangman({ mistakes: 6, cardId: 'q' });
    expect(complete).toContain('x2="120"');
    expect(complete).toContain('x2="180"');
  });

  it('caps mistakes at 6 parts and ignores invalid input', () => {
    const max = renderHangman({ mistakes: 6, cardId: 'q' });
    expect(renderHangman({ mistakes: 7, cardId: 'q' })).toBe(max);
    expect(renderHangman({ mistakes: 99, cardId: 'q' })).toBe(max);
    expect(renderHangman({ mistakes: -3, cardId: 'q' })).toBe(renderHangman({ mistakes: 0, cardId: 'q' }));
    expect(renderHangman({ mistakes: NaN, cardId: 'q' })).toBe(renderHangman({ mistakes: 0, cardId: 'q' }));
  });

  it('turns into alarm state with 5 or more mistakes', () => {
    for (let mistakes = 0; mistakes < 5; mistakes += 1) {
      const svg = renderHangman({ mistakes, cardId: 'q' });
      expect(svg, `mistakes=${mistakes} should not use AMBER`).not.toContain(AMBER);
    }
    for (let mistakes = 5; mistakes <= PART_COUNT; mistakes += 1) {
      const svg = renderHangman({ mistakes, cardId: 'q' });
      expect(svg, `mistakes=${mistakes} should use AMBER`).toContain(AMBER);
      expect(svg).not.toContain(`stroke="${TEXT}"`);
    }
  });

  it('exposes an accessible title and escaped aria-label', () => {
    const svg = renderHangman({ mistakes: 2, cardId: 'q-esc', label: '<Muñeco & "amigo">' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('<title>&lt;Muñeco &amp; &quot;amigo&quot;&gt;</title>');
    expect(svg).toContain('aria-label="&lt;Muñeco &amp; &quot;amigo&quot;&gt;"');
  });

  it('uses a default label with mistakes/total', () => {
    const svg = renderHangman({ mistakes: 3, cardId: 'q-label' });
    expect(svg).toContain(`<title>Muñeco del ahorcado: 3 de ${PART_COUNT} fallos</title>`);
    expect(svg).toContain(`aria-label="Muñeco del ahorcado: 3 de ${PART_COUNT} fallos"`);
  });

  it('only paints with palette colors', () => {
    for (let mistakes = 0; mistakes <= PART_COUNT; mistakes += 1) {
      const svg = renderHangman({ mistakes, cardId: `q-palette-${mistakes}`, size: 300 });
      for (const color of colorsUsed(svg)) {
        expect(PALETTE, `unexpected color ${color} at mistakes=${mistakes}`).toContain(color);
      }
    }
  });

  it('scales geometry to the requested size', () => {
    const size = 512;
    const svg = renderHangman({ mistakes: 6, cardId: 'q-size', size });
    expect(svg).toContain(`viewBox="0 0 ${size} ${size}"`);
    expect(svg).toContain(`width="${size}"`);
    expect(svg).toContain(`height="${size}"`);
    const scale = size / BASE_SIZE;
    const expected = Math.round(18 * scale * 100) / 100;
    expect(svg).toContain(`x1="${expected}"`);
  });

  it('defaults to BASE_SIZE and zero mistakes', () => {
    const svg = renderHangman({ cardId: 'q-default' });
    expect(svg).toContain(`viewBox="0 0 ${BASE_SIZE} ${BASE_SIZE}"`);
    expect(cyanLines(svg)).toBe(4);
    expect(svg).not.toContain(AMBER);
  });
});
