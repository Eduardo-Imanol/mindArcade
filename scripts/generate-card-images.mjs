#!/usr/bin/env node
// scripts/generate-card-images.mjs — zero-dep deterministic SVG card art.
// Writes one seeded SVG per card lacking an image (or filling a missing `asset:` reference)
// to src/content/assets/<topicId>/<cardId>.svg. Same input -> identical bytes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseTopic } from '../src/core/parser/parser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 128;
const HUES = [168, 320, 120, 45, 265];

export function hashSeed(text = '') {
  let h = 2166136261;
  const str = String(text);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function initials(label = '') {
  const words = String(label)
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((word) => word[0].toUpperCase()).join('') || '?';
}

export function renderSvg(card = {}) {
  const rand = mulberry32(hashSeed(card.id || card.front || 'carta'));
  const hue = HUES[Math.floor(rand() * HUES.length)];
  const circles = [];
  for (let i = 0; i < 4; i += 1) {
    const cx = (rand() * SIZE).toFixed(2);
    const cy = (rand() * SIZE).toFixed(2);
    const r = ((0.12 + rand() * 0.3) * SIZE).toFixed(2);
    const light = 55 + Math.round(rand() * 15);
    const opacity = (0.12 + rand() * 0.2).toFixed(2);
    circles.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${hue} 90% ${light}%)" fill-opacity="${opacity}"/>`
    );
  }
  const y1 = ((0.3 + rand() * 0.4) * SIZE).toFixed(2);
  const y2 = ((0.3 + rand() * 0.4) * SIZE).toFixed(2);
  const label = escapeXml(initials(card.front));
  const title = escapeXml(card.front || card.id || 'Carta');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="${title}">`,
    `<title>${title}</title>`,
    `<rect width="${SIZE}" height="${SIZE}" fill="#1a0b2e"/>`,
    ...circles.map((circle) => `  ${circle}`),
    `<line x1="12.80" y1="${y1}" x2="115.20" y2="${y2}" stroke="hsl(${hue} 90% 60%)" stroke-width="1.54"/>`,
    `<text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace, monospace" font-size="38" font-weight="700" fill="#f1f1f1">${label}</text>`,
    '</svg>',
    '',
  ].join('\n');
}

export function planTargets(md = '', topicId = 'tema') {
  const { cards } = parseTopic(md);
  const planned = [];
  for (const card of cards) {
    if (!card.image) {
      planned.push({ card, target: `${topicId}/${card.id}.svg` });
      continue;
    }
    if (card.image.kind === 'asset') {
      planned.push({ card, target: card.image.value.replace(/^\/+/, '') });
    }
  }
  return planned;
}

export function generate({ md = '', topicId = 'tema', assetsRoot, force = false } = {}) {
  const root = assetsRoot || path.join(ROOT, 'src/content/assets');
  const written = [];
  const skipped = [];
  for (const { card, target } of planTargets(md, topicId)) {
    const full = path.join(root, target);
    if (fs.existsSync(full) && !force) {
      skipped.push(target);
      continue;
    }
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, renderSvg(card), 'utf8');
    written.push(target);
  }
  return { written, skipped };
}

export const TOPICS_DIR = path.join(ROOT, 'src/content/topics');

export function findTopicFiles(id, topicsDir = TOPICS_DIR) {
  if (!id || typeof id !== 'string') return [];
  const base = path.resolve(topicsDir);
  if (!fs.existsSync(base)) return [];
  const wanted = `${id}.md`;
  const matches = [];
  const stack = [base];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (ent.isFile() && ent.name === wanted) matches.push(full);
    }
  }
  return matches.sort();
}

export function resolveTopicPath(target, { topicsDir = TOPICS_DIR } = {}) {
  if (target.endsWith('.md')) return path.resolve(target);
  const base = path.resolve(topicsDir);
  const flat = path.join(base, `${target}.md`);
  if (fs.existsSync(flat)) return flat;
  const matches = findTopicFiles(target, base);
  if (matches.length === 0) return flat;
  if (matches.length > 1) {
    const error = new Error(
      `El ID de tema "${target}" es ambiguo: aparece ${matches.length} veces en ${base}:\n` +
        matches.map((file) => `  - ${path.relative(ROOT, file)}`).join('\n')
    );
    error.code = 'AMBIGUOUS_TOPIC';
    error.matches = matches;
    throw error;
  }
  return matches[0];
}

function main(argv) {
  const args = argv.slice(2);
  const force = args.includes('--force');
  const target = args.find((arg) => !arg.startsWith('--'));
  if (!target) {
    console.error('Uso: node scripts/generate-card-images.mjs <topicId|ruta.md> [--force]');
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
  const { topic, cards, errors } = parseTopic(md);
  const topicId = target.endsWith('.md') ? path.basename(target, '.md') : target;
  const { written, skipped } = generate({ md, topicId, force });
  console.log(`Tema: ${topic.title || topicId} · ${cards.length} cartas · ${errors.length} errores`);
  console.log(`SVG escritos: ${written.length} · existentes omitidos: ${skipped.length}`);
  for (const file of written) console.log(`  + ${file}`);
  for (const file of skipped) console.log(`  = ${file} (existente; usa --force para regenerar)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv);
}
