#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listGames } from '../src/games/registry.js';
import { hashSeed, renderSketch } from './p5-art/engine.mjs';
import { GAME_SKETCHES } from './p5-art/game-sketches.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 512;
const HEIGHT = 320;

export function renderGameArt(game, sketch) {
  return renderSketch(sketch, {
    label: game.title,
    seed: hashSeed(`game:${game.id}`),
    size: WIDTH,
    height: HEIGHT,
  });
}

export function generateGameArt({
  root,
  force = false,
  sketches = GAME_SKETCHES,
  games = listGames(),
} = {}) {
  const targetRoot = root || path.join(ROOT, 'src/assets/games');
  const written = [];
  const skipped = [];
  const missing = [];

  for (const game of games) {
    const sketch = sketches[game.id];
    if (!sketch) {
      missing.push(game.id);
      continue;
    }
    const target = path.join(targetRoot, `${game.id}.svg`);
    if (fs.existsSync(target) && !force) {
      skipped.push(`${game.id}.svg`);
      continue;
    }
    fs.mkdirSync(targetRoot, { recursive: true });
    fs.writeFileSync(target, renderGameArt(game, sketch), 'utf8');
    written.push(`${game.id}.svg`);
  }

  return { written, skipped, missing };
}

function main(argv) {
  const force = argv.slice(2).includes('--force');
  const { written, skipped, missing } = generateGameArt({ force });
  console.log(`SVG de juegos escritos: ${written.length} · existentes omitidos: ${skipped.length}`);
  for (const file of written) console.log(`  + ${file}`);
  if (missing.length > 0) {
    console.error(`Sin sketch (${missing.length}):`);
    for (const id of missing) console.error(`  ? ${id}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv);
}
