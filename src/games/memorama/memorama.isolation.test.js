import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.join(process.cwd(), 'src/games/memorama');
const FORBIDDEN = /from\s+['"][^'"]*(storage|parser|content|router)[^'"]*['"]/;

describe('memorama isolation', () => {
  it('game module never imports core storage/parser/content/router', () => {
    const files = fs
      .readdirSync(DIR)
      .filter((file) => /\.(js|jsx)$/.test(file) && !file.includes('.test.'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = fs.readFileSync(path.join(DIR, file), 'utf8');
      expect(FORBIDDEN.test(source), `${file} imports forbidden core module`).toBe(false);
    }
  });

  it('game receives data via frozen props contract (+ additive selectCards)', () => {
    const source = fs.readFileSync(path.join(DIR, 'Memorama.jsx'), 'utf8');
    expect(source).toMatch(/deck/);
    expect(source).toMatch(/onGrade/);
    expect(source).toMatch(/onExit/);
    expect(source).toMatch(/selectCards/);
    expect(source).not.toMatch(/localStorage|indexedDB|fetch\(/);
  });
});
