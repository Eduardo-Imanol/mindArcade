#!/usr/bin/env node
// scripts/generate-topic-art.mjs — generates per-question conceptual SVG art from p5-style sketches.
// Writes src/content/assets/<target>.svg for every card with an `asset:` reference that has a sketch.
// Usage: node scripts/generate-topic-art.mjs <topicId|ruta.md> [--force]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseTopic } from '../src/core/parser/parser.js';
import { hashSeed, renderSketch } from './p5-art/engine.mjs';
import { SKETCHES } from './p5-art/sketches/index.mjs';
import { planTargets, resolveTopicPath, TOPICS_DIR } from './generate-card-images.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function generateArt({ md = '', assetsRoot, force = false, sketches = SKETCHES } = {}) {
  const root = assetsRoot || path.join(ROOT, 'src/content/assets');
  const { cards } = parseTopic(md);
  const byId = new Map(cards.map((card) => [card.id, card]));
  const written = [];
  const skipped = [];
  const missing = [];
  for (const { card, target } of planTargets(md, 'tema')) {
    const sketch = sketches[card.id];
    if (!sketch) {
      missing.push(card.id);
      continue;
    }
    const full = path.join(root, target);
    if (fs.existsSync(full) && !force) {
      skipped.push(target);
      continue;
    }
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const source = byId.get(card.id) || card;
    const svg = renderSketch(sketch, { label: source.front, seed: hashSeed(card.id) });
    fs.writeFileSync(full, svg, 'utf8');
    written.push(target);
  }
  return { written, skipped, missing };
}

function main(argv) {
  const args = argv.slice(2);
  const force = args.includes('--force');
  const target = args.find((arg) => !arg.startsWith('--'));
  if (!target) {
    console.error('Uso: node scripts/generate-topic-art.mjs <topicId|ruta.md> [--force]');
    process.exit(1);
  }
  let mdPath;
  try {
    mdPath = resolveTopicPath(target);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!fs.existsSync(mdPath)) {
    console.error(`No existe el tema "${target}" en ${TOPICS_DIR}`);
    process.exit(1);
  }
  const md = fs.readFileSync(mdPath, 'utf8');
  const { topic, cards } = parseTopic(md);
  const { written, skipped, missing } = generateArt({ md, force });
  console.log(`Tema: ${topic.title || target} · ${cards.length} cartas`);
  console.log(`SVG escritos: ${written.length} · existentes omitidos: ${skipped.length}`);
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
