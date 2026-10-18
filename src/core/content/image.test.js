import { describe, expect, it } from 'vitest';
import { EMOJI_DICT, findEmoji, resolveCardImage } from './image.js';

describe('resolveCardImage', () => {
  it('precedence: override > I: > emoji dict > fallback', () => {
    const card = { id: 'dog', front: 'dog', image: { kind: 'url', value: 'https://x/p.png' } };
    expect(resolveCardImage(card, { dog: { kind: 'emoji', value: '🐕' } })).toEqual({ kind: 'emoji', value: '🐕' });
    expect(resolveCardImage(card)).toEqual({ kind: 'url', value: 'https://x/p.png' });
    expect(resolveCardImage({ id: 'dog', front: 'dog' })).toEqual({ kind: 'emoji', value: '🐶' });
    expect(resolveCardImage({ id: 'x1', front: 'concepto abstracto' })).toEqual({ kind: 'fallback', value: 'x1' });
  });

  it('accepts string overrides and asset tokens', () => {
    expect(resolveCardImage({ id: 'a', front: 'zzz' }, { a: 'asset:tema/a.svg' })).toEqual({
      kind: 'asset',
      value: 'tema/a.svg',
    });
    expect(resolveCardImage({ id: 'a', front: 'zzz' }, { a: 'https://x/y.png' })).toEqual({
      kind: 'url',
      value: 'https://x/y.png',
    });
  });

  it('ignores empty/broken values and falls through', () => {
    expect(resolveCardImage({ id: 'b', front: 'zzz', image: { kind: 'url', value: '' } }, { b: null })).toEqual({
      kind: 'fallback',
      value: 'b',
    });
    expect(resolveCardImage({}, {}, {})).toEqual({ kind: 'fallback', value: 'carta' });
  });

  it('detects emoji dictionary words ignoring accents/case', () => {
    expect(findEmoji('¿Qué es una función?')).toBe('🧩');
    expect(findEmoji('LA CASA')).toBe('🏠');
    expect(findEmoji('xyzabc')).toBeNull();
    expect(EMOJI_DICT.dog).toBe('🐶');
  });
});
