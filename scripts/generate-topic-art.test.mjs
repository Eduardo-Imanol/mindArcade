import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateArt } from './generate-topic-art.mjs';
import { parseTopic } from '../src/core/parser/parser.js';
import { escapeXml, hashSeed, renderSketch } from './p5-art/engine.mjs';
import { SKETCHES } from './p5-art/sketches/index.mjs';

const MD_PATH = path.join(process.cwd(), 'src/content/topics/funciones-programacion.md');
const MD = fs.readFileSync(MD_PATH, 'utf8');
const MAX_BYTES = 200 * 1024;

const temps = [];

function tempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sepect-art-'));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  while (temps.length > 0) fs.rmSync(temps.pop(), { recursive: true, force: true });
});

describe('sketch registry coverage', () => {
  it('covers every asset: card in funciones-programacion.md', () => {
    const { cards } = parseTopic(MD);
    expect(cards.length).toBe(96);
    const missing = cards.filter((card) => card.image?.kind === 'asset' && !SKETCHES[card.id]);
    expect(missing.map((card) => card.id)).toEqual([]);
  });

  it('has no unused sketches', () => {
    const { cards } = parseTopic(MD);
    const ids = new Set(cards.map((card) => card.id));
    const extra = Object.keys(SKETCHES).filter((id) => !ids.has(id));
    expect(extra).toEqual([]);
  });
});

describe('generated art quality', () => {
  it('every sketch renders accessible svg under 200KB and deterministically', () => {
    const { cards } = parseTopic(MD);
    for (const card of cards) {
      const sketch = SKETCHES[card.id];
      const svg = renderSketch(sketch, { label: card.front, seed: hashSeed(card.id) });
      expect(svg, card.id).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg, card.id).toContain('viewBox="0 0 512 512"');
      expect(svg, card.id).toContain('role="img"');
      expect(svg, card.id).toContain(`aria-label="${escapeXml(card.front)}"`);
      expect(svg, card.id).toContain(`<title>${escapeXml(card.front)}</title>`);
      expect(Buffer.byteLength(svg, 'utf8'), card.id).toBeLessThan(MAX_BYTES);
      const again = renderSketch(sketch, { label: card.front, seed: hashSeed(card.id) });
      expect(again, card.id).toBe(svg);
    }
  });
});

describe('generateArt', () => {
  it('writes all 96 SVGs to a fresh root', () => {
    const root = tempRoot();
    const result = generateArt({ md: MD, assetsRoot: root, force: true });
    expect(result.missing).toEqual([]);
    expect(result.written.length).toBe(96);
    const files = fs.readdirSync(path.join(root, 'funciones-programacion'));
    expect(files.length).toBe(96);
    const sample = fs.readFileSync(
      path.join(root, 'funciones-programacion/que-es-un-closure.svg'),
      'utf8'
    );
    expect(sample).toContain('¿Qué es un closure?');
  });

  it('skips existing files unless --force', () => {
    const root = tempRoot();
    generateArt({ md: MD, assetsRoot: root, force: true });
    const rerun = generateArt({ md: MD, assetsRoot: root });
    expect(rerun.written).toEqual([]);
    expect(rerun.skipped.length).toBe(96);
  });

  it('reports missing sketches without writing them', () => {
    const root = tempRoot();
    const result = generateArt({ md: MD, assetsRoot: root, force: true, sketches: {} });
    expect(result.written).toEqual([]);
    expect(result.missing.length).toBe(96);
  });

  it('output is byte-identical across runs (deterministic seeds)', () => {
    const rootA = tempRoot();
    const rootB = tempRoot();
    generateArt({ md: MD, assetsRoot: rootA, force: true });
    generateArt({ md: MD, assetsRoot: rootB, force: true });
    const a = fs.readFileSync(path.join(rootA, 'funciones-programacion/que-es-un-closure.svg'));
    const b = fs.readFileSync(path.join(rootB, 'funciones-programacion/que-es-un-closure.svg'));
    expect(a.equals(b)).toBe(true);
  });
});
