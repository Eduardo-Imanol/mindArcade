import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasSource, listSourceKeys, loadSource } from './sources.js';
import { SOURCE_BY_TOPIC } from './library.js';

describe('sources registry lazy (spec-17 T3, spec-19 T1)', () => {
  it('resolves all manifest sources', () => {
    expect(listSourceKeys()).toHaveLength(Object.keys(SOURCE_BY_TOPIC).length);
    for (const sp of Object.values(SOURCE_BY_TOPIC)) {
      expect(hasSource(sp)).toBe(true);
    }
  });

  it('loads real source content as a string', async () => {
    const md = await loadSource('programacion/dart-funciones.md');
    expect(typeof md).toBe('string');
    expect(md).toContain('# Funciones en Dart');
  });

  it('normalizes slashes and accepts registry-relative paths', () => {
    expect(hasSource('programacion\\dart-funciones.md')).toBe(true);
    expect(hasSource('sources/programacion/dart-funciones.md')).toBe(true);
    expect(hasSource('src/content/sources/programacion/dart-funciones.md')).toBe(true);
  });

  it('inexistent returns null', async () => {
    expect(hasSource('programacion/no-existe.md')).toBe(false);
    expect(await loadSource('programacion/no-existe.md')).toBeNull();
    expect(await loadSource('otra-categoria/no-existe.md')).toBeNull();
  });

  it('blocks .. and absolute paths', () => {
    expect(hasSource('../secrets.md')).toBe(false);
    expect(hasSource('programacion/../secrets.md')).toBe(false);
    expect(hasSource('programacion/../../etc/passwd')).toBe(false);
    expect(hasSource('/etc/passwd')).toBe(false);
    expect(hasSource('//servidor/secreto.md')).toBe(false);
    expect(hasSource('')).toBe(false);
    expect(hasSource(null)).toBe(false);
  });

  it('keeps the registry lazy (no eager glob, loadSource is async)', () => {
    expect(loadSource('programacion/dart-funciones.md')).toBeInstanceOf(Promise);
    const source = fs.readFileSync(path.join(process.cwd(), 'src/core/content/sources.js'), 'utf8');
    expect(source).toMatch(/import\.meta\.glob\(/);
    expect(source).not.toMatch(/eager\s*:\s*true/);
  });
});
