import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generate, planTargets, renderSvg } from './generate-card-images.mjs';
import { parseTopic } from '../src/core/parser/parser.js';

const FIXTURE_C = `# Animales
- Q: dog | A: perro | I: 🐶
- Q: house | A: casa | I: https://example.com/house.png
- Q: book | A: libro`;

const temps = [];

function tempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sepect-assets-'));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  while (temps.length > 0) {
    fs.rmSync(temps.pop(), { recursive: true, force: true });
  }
});

describe('planTargets', () => {
  it('only plans cards without image or with asset: token', () => {
    const md = `# Animales
- Q: dog | A: perro | I: 🐶
- Q: house | A: casa | I: https://example.com/house.png
- Q: book | A: libro
- Q: cat | A: gato | I: asset:animales/cat.svg`;
    const plan = planTargets(md, 'animales');
    expect(plan.map((entry) => entry.target).sort()).toEqual(['animales/book.svg', 'animales/cat.svg']);
  });
});

describe('renderSvg determinism', () => {
  it('same card → identical bytes', () => {
    const card = { id: 'book', front: 'book', back: 'libro', difficulty: 'easy' };
    expect(renderSvg(card)).toBe(renderSvg(card));
    expect(renderSvg(card)).toContain('<svg');
  });
});

describe('generate-card-images', () => {
  it('fixture C → exactly one SVG (book), emoji/url skipped', () => {
    const root = tempRoot();
    const first = generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root });
    expect(first.written).toEqual(['animales/book.svg']);
    expect(first.skipped).toEqual([]);
    const file = path.join(root, 'animales/book.svg');
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toContain('<svg');
  });

  it('re-run is byte-identical and skips existing assets', () => {
    const root = tempRoot();
    generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root });
    const file = path.join(root, 'animales/book.svg');
    const firstBytes = fs.readFileSync(file);
    const second = generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root });
    expect(second.written).toEqual([]);
    expect(second.skipped).toEqual(['animales/book.svg']);
    expect(fs.readFileSync(file).equals(firstBytes)).toBe(true);
  });

  it('existing skipped unless --force overwrites', () => {
    const root = tempRoot();
    fs.mkdirSync(path.join(root, 'animales'), { recursive: true });
    const file = path.join(root, 'animales/book.svg');
    fs.writeFileSync(file, 'SENTINEL', 'utf8');

    const noForce = generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root });
    expect(noForce.written).toEqual([]);
    expect(fs.readFileSync(file, 'utf8')).toBe('SENTINEL');

    const forced = generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root, force: true });
    expect(forced.written).toEqual(['animales/book.svg']);
    expect(fs.readFileSync(file, 'utf8')).toContain('<svg');
  });

  it('force re-run is byte-identical (deterministic)', () => {
    const root = tempRoot();
    generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root, force: true });
    const file = path.join(root, 'animales/book.svg');
    const firstBytes = fs.readFileSync(file);
    generate({ md: FIXTURE_C, topicId: 'animales', assetsRoot: root, force: true });
    expect(fs.readFileSync(file).equals(firstBytes)).toBe(true);
  });

  it('parses fixture without errors and ids match card slugs', () => {
    const { cards, errors } = parseTopic(FIXTURE_C);
    expect(errors).toEqual([]);
    expect(cards.map((card) => card.id)).toEqual(['dog', 'house', 'book']);
  });
});
