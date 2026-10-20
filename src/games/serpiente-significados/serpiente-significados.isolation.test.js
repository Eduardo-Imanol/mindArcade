import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.join(process.cwd(), 'src/games/serpiente-significados');
const FORBIDDEN =
  /(?:from\s+['"]|import\s*\(\s*['"]|require\s*\(\s*['"])[^'"]*(storage|parser|content|router)[^'"]*['"]/;
const MODULE_FILES = fs
  .readdirSync(DIR)
  .filter((file) => /\.(js|jsx|mjs)$/.test(file) && !file.includes('.test.'));

const read = (file) => fs.readFileSync(path.join(DIR, file), 'utf8');

describe('serpiente-significados isolation', () => {
  it('game module never imports core storage/parser/content/router', () => {
    expect(MODULE_FILES.length).toBeGreaterThan(0);
    for (const file of MODULE_FILES) {
      expect(FORBIDDEN.test(read(file)), `${file} imports forbidden core module`).toBe(false);
    }
  });

  it('game never persists or fetches data itself', () => {
    for (const file of MODULE_FILES) {
      const source = read(file);
      expect(
        /localStorage|indexedDB|fetch\(/.test(source),
        `${file} touches persistence/network`
      ).toBe(false);
    }
  });

  it('receives data through the frozen props contract (+ additive selectCards)', () => {
    const source = read('SerpienteSignificados.jsx');
    expect(source).toMatch(/deck = \[\]/);
    expect(source).toMatch(/onGrade/);
    expect(source).toMatch(/onExit/);
    expect(source).toMatch(/selectCards/);
  });

  it('SRS/XP stay in GameHost: pure logic has no imports, Date or grading math', () => {
    const source = read('serpiente-significados.logic.js');
    expect(source).not.toMatch(/from\s+['"]/);
    expect(source).not.toMatch(/\bDate\b/);
    expect(source).not.toMatch(/awardXP|applyGrade|updateSrs|srs/i);
    expect(source).not.toMatch(/localStorage|indexedDB|fetch\(/);
  });

  it('does not add canvas, p5 or extra dependencies', () => {
    for (const file of MODULE_FILES) {
      const source = read(file);
      expect(/p5|from\s+['"]p5['"]|<canvas\b/.test(source), `${file} uses canvas/p5`).toBe(
        false
      );
    }
  });

  it('only exposes the game component as default export', () => {
    expect(read('index.jsx').trim()).toBe(
      "export { default } from './SerpienteSignificados.jsx';"
    );
  });
});
