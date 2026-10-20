import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.join(process.cwd(), 'src/games/conecta-pares');
const FORBIDDEN =
  /(?:from\s+['"]|import\s*\(\s*['"]|require\s*\(\s*['"])[^'"]*(storage|parser|content|router)[^'"]*['"]/;
const MODULE_FILES = fs
  .readdirSync(DIR)
  .filter((file) => /\.(js|jsx|mjs)$/.test(file) && !file.includes('.test.'));

const read = (file) => fs.readFileSync(path.join(DIR, file), 'utf8');

describe('conecta-pares isolation', () => {
  it('game module never imports core storage/parser/content/router', () => {
    expect(MODULE_FILES.length).toBeGreaterThan(0);
    for (const file of MODULE_FILES) {
      expect(FORBIDDEN.test(read(file)), `${file} imports forbidden core module`).toBe(false);
    }
  });

  it('game never persists, fetches, times or uses the shared engine', () => {
    for (const file of MODULE_FILES) {
      const source = read(file);
      expect(
        /localStorage|indexedDB|fetch\(/.test(source),
        `${file} touches persistence/network`
      ).toBe(false);
      expect(
        /createEngine|setInterval|requestAnimationFrame/.test(source),
        `${file} uses a timer or the shared engine`
      ).toBe(false);
    }
  });

  it('game is the only image-free title: no CardImage, img, canvas or p5', () => {
    for (const file of MODULE_FILES) {
      const source = read(file);
      expect(/CardImage/.test(source), `${file} imports CardImage`).toBe(false);
      expect(/<img\b|<canvas\b|p5/i.test(source), `${file} renders images or canvas`).toBe(false);
    }
  });

  it('receives data through the frozen props contract (+ additive selectCards)', () => {
    const source = read('ConectaPares.jsx');
    expect(source).toMatch(/deck = \[\]/);
    expect(source).toMatch(/onGrade/);
    expect(source).toMatch(/onExit/);
    expect(source).toMatch(/selectCards/);
  });

  it('SRS/XP stay in GameHost: pure logic has no imports nor grading math', () => {
    const source = read('conecta-pares.logic.js');
    expect(source).not.toMatch(/from\s+['"]/);
    expect(source).not.toMatch(/localStorage|indexedDB|fetch\(/);
    expect(source).not.toMatch(/awardXP|applyGrade|updateSrs|srs/i);
  });

  it('only exposes the game component as default export', () => {
    expect(read('index.jsx').trim()).toBe("export { default } from './ConectaPares.jsx';");
  });
});
