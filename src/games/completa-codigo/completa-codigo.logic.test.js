import { describe, expect, it } from 'vitest';
import {
  blankMatches,
  evaluateBlanks,
  normalizeAnswer,
  parseTemplate,
} from './completa-codigo.logic.js';

const BLANKS = [
  { id: 'a', answer: 'a', alternatives: [] },
  { id: 'b', answer: 'b', alternatives: [] },
  { id: 'op', answer: 'a + b', alternatives: ['b + a'] },
];

describe('completa-codigo logic (spec-21 T7)', () => {
  it('parses markers while preserving the surrounding code and slots', () => {
    const parsed = parseTemplate(
      'function sumar({{a}}, {{b}}) {\n  return {{op}};\n}',
      BLANKS
    );

    expect(parsed.ok).toBe(true);
    expect(parsed.slotCount).toBe(3);
    expect(parsed.segments).toEqual([
      { type: 'text', value: 'function sumar(' },
      { type: 'blank', id: 'a', slot: 0 },
      { type: 'text', value: ', ' },
      { type: 'blank', id: 'b', slot: 1 },
      { type: 'text', value: ') {\n  return ' },
      { type: 'blank', id: 'op', slot: 2 },
      { type: 'text', value: ';\n}' },
    ]);
    expect(parsed.blanks).toEqual([
      { id: 'a', answer: 'a', alternatives: [] },
      { id: 'b', answer: 'b', alternatives: [] },
      { id: 'op', answer: 'a + b', alternatives: ['b + a'] },
    ]);
  });

  it('rejects empty templates, missing answers and unmatched markers', () => {
    expect(parseTemplate('', BLANKS).errors).toContain('La plantilla está vacía.');

    const missing = parseTemplate('return {{missing}};', BLANKS);
    expect(missing.ok).toBe(false);
    expect(missing.errors.join(' ')).toContain('{{missing}}');

    const extra = parseTemplate('return {{a}};', [BLANKS[0], BLANKS[1]]);
    expect(extra.ok).toBe(false);
    expect(extra.errors.join(' ')).toContain('El espacio b no aparece');

    const empty = parseTemplate('return {{a}};', [{ id: 'a', answer: ' ' }]);
    expect(empty.ok).toBe(false);
    expect(empty.errors.join(' ')).toContain('sin respuesta');
  });

  it('matches exact answers and alternatives only after trim', () => {
    expect(normalizeAnswer('  a + b  ')).toBe('a + b');
    expect(blankMatches(BLANKS[2], '  a + b ')).toBe(true);
    expect(blankMatches(BLANKS[2], 'b + a')).toBe(true);
    expect(blankMatches(BLANKS[2], 'a+b')).toBe(false);
    expect(blankMatches(BLANKS[2], 'A + B')).toBe(false);
    expect(blankMatches(BLANKS[2], '   ')).toBe(false);
  });

  it('evaluates every blank and reports the expected answer', () => {
    const all = evaluateBlanks(BLANKS, { a: ' a ', b: 'b', op: 'b + a' });
    expect(all.ok).toBe(true);
    expect(all.results).toEqual([
      { id: 'a', ok: true, given: 'a', expected: 'a' },
      { id: 'b', ok: true, given: 'b', expected: 'b' },
      { id: 'op', ok: true, given: 'b + a', expected: 'a + b' },
    ]);

    const partial = evaluateBlanks(BLANKS, { a: 'a', b: 'x' });
    expect(partial.ok).toBe(false);
    expect(partial.results[1]).toEqual({
      id: 'b',
      ok: false,
      given: 'x',
      expected: 'b',
    });
    expect(partial.results[2]).toEqual({
      id: 'op',
      ok: false,
      given: '',
      expected: 'a + b',
    });
  });
});
