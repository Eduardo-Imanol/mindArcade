import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  TOPICS_DIR,
  findTopicFiles,
  generate,
  planTargets,
  renderSvg,
  resolveTopicPath,
} from './generate-card-images.mjs';
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

describe('recursive topic resolution (spec-17 T7)', () => {
  const IDS = [
    'algoritmos-y-complejidad-guia-tecnica-exhaustiva',
    'estructuras-de-datos',
    'funciones-programacion',
    'persistencia-local-pwas-y-offline-first',
  ];

  it('resolves the four built-in topic ids in nested folders', () => {
    for (const id of IDS) {
      const resolved = resolveTopicPath(id);
      expect(fs.existsSync(resolved), id).toBe(true);
      expect(path.relative(TOPICS_DIR, resolved).split(path.sep)).toContain('programacion');
      expect(path.basename(resolved)).toBe(`${id}.md`);
    }
  });

  it('finds a fixture topic inside a nested folder', () => {
    const root = tempRoot();
    fs.mkdirSync(path.join(root, 'idiomas', 'a1'), { recursive: true });
    const nested = path.join(root, 'idiomas', 'a1', 'saludos.md');
    fs.writeFileSync(nested, '# Saludos\n- Q: hola | A: hello', 'utf8');

    expect(findTopicFiles('saludos', root)).toEqual([nested]);
    expect(resolveTopicPath('saludos', { topicsDir: root })).toBe(nested);
  });

  it('rejects an ambiguous id instead of choosing one file', () => {
    const root = tempRoot();
    fs.mkdirSync(path.join(root, 'programacion'), { recursive: true });
    fs.mkdirSync(path.join(root, 'idiomas'), { recursive: true });
    const first = path.join(root, 'programacion', 'dup.md');
    const second = path.join(root, 'idiomas', 'dup.md');
    fs.writeFileSync(first, '# Dup A\n- Q: a | A: b', 'utf8');
    fs.writeFileSync(second, '# Dup B\n- Q: c | A: d', 'utf8');

    expect(() => resolveTopicPath('dup', { topicsDir: root })).toThrow(/ambiguo/i);
    try {
      resolveTopicPath('dup', { topicsDir: root });
    } catch (error) {
      expect(error.code).toBe('AMBIGUOUS_TOPIC');
      expect(error.matches.sort()).toEqual([first, second].sort());
    }
  });

  it('returns the flat path when the id does not exist so main can report it', () => {
    const root = tempRoot();
    const missing = resolveTopicPath('no-existe', { topicsDir: root });
    expect(missing).toBe(path.join(path.resolve(root), 'no-existe.md'));
    expect(fs.existsSync(missing)).toBe(false);
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
