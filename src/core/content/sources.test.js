import { describe, expect, it } from 'vitest';
import { hasSource, loadSource } from './sources.js';
import { SOURCE_BY_TOPIC } from './library.js';

describe('sources registry lazy (spec-17 T3)', () => {
  it('resolves all manifest sources', () => {
    for (const sp of Object.values(SOURCE_BY_TOPIC)) {
      expect(hasSource(sp)).toBe(true);
    }
  });

  it('inexistent returns null', async () => {
    expect(hasSource('programacion/no-existe.md')).toBe(false);
    expect(await loadSource('programacion/no-existe.md')).toBeNull();
  });

  it('blocks .. and absolute paths', () => {
    expect(hasSource('../secrets.md')).toBe(false);
    expect(hasSource('/etc/passwd')).toBe(false);
  });
});
