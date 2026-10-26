#!/usr/bin/env node
// scripts/generate-pwa-assets.mjs — genera los assets PWA (PNG) y la carátula del arcade.
// Cero dependencias: rasteriza con scripts/p5-art/raster.mjs y codifica PNG con zlib.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drawCategory, drawCover, drawIcon } from './p5-art/arcade-brand.mjs';
import { createCanvas, encodePNG } from './p5-art/raster.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const ICON_TARGETS = [
  { file: 'icons/icon-192.png', size: 192, maskable: false },
  { file: 'icons/icon-512.png', size: 512, maskable: false },
  { file: 'icons/icon-maskable-512.png', size: 512, maskable: true },
  { file: 'icons/apple-touch-icon.png', size: 180, maskable: false },
  { file: 'icons/favicon-32.png', size: 32, maskable: false },
];

export const COVER_TARGET = { file: 'cover/arcade-cover.png', width: 1200, height: 630 };

export const CATEGORY_TARGETS = [
  { category: 'programacion', file: 'categories/programacion.png', width: 720, height: 405 },
  { category: 'idiomas', file: 'categories/idiomas.png', width: 720, height: 405 },
  { category: 'universidad', file: 'categories/universidad.png', width: 720, height: 405 },
  { category: 'personalizados', file: 'categories/personalizados.png', width: 720, height: 405 },
];

export function renderIcon(size, { maskable = false } = {}) {
  const canvas = createCanvas(size, size);
  drawIcon(canvas, { maskable });
  return encodePNG(canvas);
}

export function renderCover(width = COVER_TARGET.width, height = COVER_TARGET.height) {
  const canvas = createCanvas(width, height);
  drawCover(canvas);
  return encodePNG(canvas);
}

export function renderCategory(categoryId, width = 720, height = 405) {
  const canvas = createCanvas(width, height);
  drawCategory(canvas, categoryId);
  return encodePNG(canvas);
}

export function generatePwaAssets({ root = ROOT, force = false } = {}) {
  const publicRoot = path.join(root, 'public');
  const written = [];
  const skipped = [];

  for (const target of ICON_TARGETS) {
    const file = path.join(publicRoot, target.file);
    if (fs.existsSync(file) && !force) {
      skipped.push(target.file);
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderIcon(target.size, { maskable: target.maskable }));
    written.push(target.file);
  }

  const coverFile = path.join(publicRoot, COVER_TARGET.file);
  if (fs.existsSync(coverFile) && !force) {
    skipped.push(COVER_TARGET.file);
  } else {
    fs.mkdirSync(path.dirname(coverFile), { recursive: true });
    fs.writeFileSync(coverFile, renderCover());
    written.push(COVER_TARGET.file);
  }

  for (const target of CATEGORY_TARGETS) {
    const file = path.join(publicRoot, target.file);
    if (fs.existsSync(file) && !force) {
      skipped.push(target.file);
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderCategory(target.category, target.width, target.height));
    written.push(target.file);
  }

  return { written, skipped };
}

function main(argv) {
  const force = argv.slice(2).includes('--force');
  const { written, skipped } = generatePwaAssets({ force });
  console.log(`Assets PWA escritos: ${written.length} · existentes omitidos: ${skipped.length}`);
  for (const file of written) console.log(`  + public/${file}`);
  for (const file of skipped) console.log(`  = public/${file} (ya existe)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv);
}
