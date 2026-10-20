import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.join(process.cwd(), 'src/games/quiz-significado');
const FORBIDDEN =
  /(?:from\s+['"]|import\s*\(\s*['"]|require\s*\(\s*['"])[^'"]*(storage|parser|content|router)[^'"]*['"]/;
const MODULE_FILES = fs
  .readdirSync(DIR)
  .filter((file) => /\.(js|jsx|mjs)$/.test(file) && !file.includes('.test.'));

describe('quiz-significado isolation', () => {
  it('game module never imports core storage/parser/content/router', () => {
    expect(MODULE_FILES.length).toBeGreaterThan(0);
    for (const file of MODULE_FILES) {
      const source = fs.readFileSync(path.join(DIR, file), 'utf8');
      expect(FORBIDDEN.test(source), `${file} imports forbidden core module`).toBe(false);
    }
  });

  it('game never persists or fetches data itself', () => {
    for (const file of MODULE_FILES) {
      const source = fs.readFileSync(path.join(DIR, file), 'utf8');
      expect(
        /localStorage|indexedDB|fetch\(/.test(source),
        `${file} touches persistence/network`
      ).toBe(false);
    }
  });

  it('game receives data via frozen props contract (+ additive selectCards)', () => {
    const source = fs.readFileSync(path.join(DIR, 'QuizSignificado.jsx'), 'utf8');
    expect(source).toMatch(/deck/);
    expect(source).toMatch(/onGrade/);
    expect(source).toMatch(/onExit/);
    expect(source).toMatch(/selectCards/);
  });

  it('SRS/XP stay in GameHost: pure logic has no imports nor grading math', () => {
    const source = fs.readFileSync(path.join(DIR, 'quiz-significado.logic.js'), 'utf8');
    expect(source).not.toMatch(/from\s+['"]/);
    expect(source).not.toMatch(/awardXP|applyGrade|updateSrs|srs/i);
  });
});
