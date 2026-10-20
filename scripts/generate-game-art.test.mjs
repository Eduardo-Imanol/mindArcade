import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateGameArt, renderGameArt } from './generate-game-art.mjs';
import { GAME_SKETCHES } from './p5-art/game-sketches.mjs';
import { listGames } from '../src/games/registry.js';
import { escapeXml } from './p5-art/engine.mjs';

const GAMES = listGames();
const ASSETS = path.join(process.cwd(), 'src/assets/games');
const MAX_BYTES = 100 * 1024;
const temps = [];

function tempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sepect-game-art-'));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  while (temps.length > 0) fs.rmSync(temps.pop(), { recursive: true, force: true });
});

describe('game sketch coverage', () => {
  it('has one sketch per registry game and no extras', () => {
    const ids = GAMES.map((game) => game.id).sort();
    expect(Object.keys(GAME_SKETCHES).sort()).toEqual(ids);
  });

  it('renders accessible, deterministic 16:10 art under 100KB', () => {
    for (const game of GAMES) {
      const svg = renderGameArt(game, GAME_SKETCHES[game.id]);
      expect(svg, game.id).toContain('viewBox="0 0 512 320"');
      expect(svg, game.id).toContain('role="img"');
      expect(svg, game.id).toContain(`aria-label="${escapeXml(game.title)}"`);
      expect(svg, game.id).toContain(`<title>${escapeXml(game.title)}</title>`);
      expect(Buffer.byteLength(svg, 'utf8'), game.id).toBeLessThan(MAX_BYTES);
      expect(renderGameArt(game, GAME_SKETCHES[game.id]), game.id).toBe(svg);
    }
  });
});

describe('generateGameArt', () => {
  it('writes one SVG per game to a fresh root', () => {
    const root = tempRoot();
    const result = generateGameArt({ root, force: true });
    expect(result.missing).toEqual([]);
    expect(result.written).toEqual(GAMES.map((game) => `${game.id}.svg`));
    expect(fs.readdirSync(root).sort()).toEqual(
      GAMES.map((game) => `${game.id}.svg`).sort()
    );
  });

  it('skips existing files unless forced', () => {
    const root = tempRoot();
    generateGameArt({ root, force: true });
    const rerun = generateGameArt({ root });
    expect(rerun.written).toEqual([]);
    expect(rerun.skipped).toHaveLength(GAMES.length);
  });

  it('reports missing sketches without writing them', () => {
    const root = tempRoot();
    const result = generateGameArt({ root, force: true, sketches: {} });
    expect(result.written).toEqual([]);
    expect(result.missing).toEqual(GAMES.map((game) => game.id));
  });

  it('keeps committed assets in sync with the sketches', () => {
    for (const game of GAMES) {
      const file = path.join(ASSETS, `${game.id}.svg`);
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.readFileSync(file, 'utf8'), game.id).toBe(
        renderGameArt(game, GAME_SKETCHES[game.id])
      );
    }
  });
});
