// scripts/generate-topic-art.test.mjs — verificación del pipeline de arte para N temas.
// Descubre todos los `src/content/topics/*.md`, parsea cada uno y valida:
// cobertura de sketches, ausencia de huérfanos, paridad assets↔cartas, calidad
// accesible del SVG, determinismo byte a byte y el comportamiento de `generateArt`.
// No fija números de cartas ni nombres de tema: el catálogo puede crecer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseTopic } from '../src/core/parser/parser.js';
import { slugify, uniqueId } from '../src/core/content/slug.js';
import { generateArt } from './generate-topic-art.mjs';
import { planTargets } from './generate-card-images.mjs';
import { escapeXml, hashSeed, renderSketch } from './p5-art/engine.mjs';
import { BG2, CYAN, MAGENTA, TEXT } from './p5-art/palette.mjs';
import { SKETCHES } from './p5-art/sketches/index.mjs';

const ROOT = process.cwd();
const TOPICS_DIR = path.join(ROOT, 'src/content/topics');
const ASSETS_DIR = path.join(ROOT, 'src/content/assets');
const MAX_BYTES = 200 * 1024;

const temps = [];

function tempRoot(prefix = 'sepect-art-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  while (temps.length > 0) fs.rmSync(temps.pop(), { recursive: true, force: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de verificación
// ─────────────────────────────────────────────────────────────────────────────

function problem(code, topic, card, message) {
  return { code, topic: topic ?? null, card: card ?? null, message };
}

function formatProblem(p) {
  const where = p.topic ? `${p.topic}${p.card ? `/${p.card}` : ''}` : p.card || '—';
  return `[${p.code}] ${where}: ${p.message}`;
}

function formatProblems(problems) {
  return problems.map(formatProblem).join('\n');
}

function assetCards(topic) {
  return topic.cards.filter((card) => card.image?.kind === 'asset');
}

function listSvgFiles(root, prefix = '') {
  if (!fs.existsSync(root)) return [];
  const found = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...listSvgFiles(path.join(root, entry.name), rel));
    else if (entry.name.endsWith('.svg')) found.push(rel);
  }
  return found.sort();
}

function discoverTopics(topicsDir = TOPICS_DIR) {
  if (!fs.existsSync(topicsDir)) return [];
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(full);
      }
    }
  }
  walk(topicsDir);
  files.sort();
  return files.map((fullPath) => {
    const md = fs.readFileSync(fullPath, 'utf8');
    const { topic, cards, errors } = parseTopic(md);
    const file = path.relative(topicsDir, fullPath);
    return { id: path.basename(fullPath, '.md'), file, md, title: topic.title, cards, errors };
  });
}

function findMissingImages(topics) {
  const problems = [];
  for (const topic of topics) {
    for (const card of topic.cards) {
      if (card.image?.kind !== 'asset') {
        problems.push(
          problem('missing-image', topic.id, card.id, `la carta «${card.front}» no declara "I: asset:"`)
        );
      }
    }
  }
  return problems;
}

function findMissingSketches(topics, sketches) {
  const problems = [];
  for (const topic of topics) {
    for (const card of assetCards(topic)) {
      if (!sketches[card.id]) {
        problems.push(
          problem('missing-sketch', topic.id, card.id, `no hay sketch para la carta «${card.front}»`)
        );
      }
    }
  }
  return problems;
}

function findOrphanSketches(topics, sketches) {
  const used = new Set(topics.flatMap((topic) => topic.cards.map((card) => card.id)));
  return Object.keys(sketches)
    .filter((id) => !used.has(id))
    .map((id) => problem('orphan-sketch', null, id, 'sketch registrado sin ninguna carta que lo use'));
}

function findAssetProblems(topics, assetsRoot = ASSETS_DIR) {
  const problems = [];
  const referenced = new Set();
  for (const topic of topics) {
    for (const card of assetCards(topic)) {
      const rel = card.image.value.replace(/^\/+/, '');
      referenced.add(rel);
      if (!fs.existsSync(path.join(assetsRoot, rel))) {
        problems.push(problem('missing-asset', topic.id, card.id, `no existe el archivo ${rel}`));
      }
    }
  }
  for (const rel of listSvgFiles(assetsRoot)) {
    if (!referenced.has(rel)) {
      problems.push(
        problem('orphan-asset', null, rel, `SVG en assets/ sin ninguna carta que lo referencie: ${rel}`)
      );
    }
  }
  return problems;
}

function validateSvg(svg, label) {
  const errors = [];
  if (!svg.includes('<svg xmlns="http://www.w3.org/2000/svg"')) errors.push('falta el xmlns del svg');
  if (!svg.includes('viewBox="0 0 512 512"')) errors.push('el lienzo no es 512×512');
  if (!svg.includes('role="img"')) errors.push('falta role="img"');
  if (!/<title>[^<]*<\/title>/.test(svg)) errors.push('falta <title>');
  if (!/aria-label="[^"]+"/.test(svg)) errors.push('falta aria-label');
  if (Buffer.byteLength(svg, 'utf8') >= MAX_BYTES) errors.push(`supera el límite de ${MAX_BYTES} bytes`);
  if (label !== undefined && !svg.includes(`aria-label="${escapeXml(label)}"`)) {
    errors.push('el aria-label no coincide con la pregunta de la carta');
  }
  return errors;
}

function findQualityProblems(topics, sketches, assetsRoot = ASSETS_DIR) {
  const problems = [];
  for (const topic of topics) {
    for (const card of topic.cards) {
      const sketch = sketches[card.id];
      if (!sketch) continue;
      const svg = renderSketch(sketch, { label: card.front, seed: hashSeed(card.id) });
      for (const message of validateSvg(svg, card.front)) {
        problems.push(problem('invalid-svg', topic.id, card.id, message));
      }
      const again = renderSketch(sketch, { label: card.front, seed: hashSeed(card.id) });
      if (again !== svg) {
        problems.push(problem('non-deterministic', topic.id, card.id, 'el render del sketch no es determinista'));
      }
      if (card.image?.kind !== 'asset') continue;
      const rel = card.image.value.replace(/^\/+/, '');
      const file = path.join(assetsRoot, rel);
      if (!fs.existsSync(file)) continue;
      for (const message of validateSvg(fs.readFileSync(file, 'utf8'))) {
        problems.push(problem('invalid-svg', topic.id, card.id, `${rel}: ${message}`));
      }
    }
  }
  return problems;
}

function checkGenerateArt(topics, sketches) {
  const problems = [];
  for (const topic of topics) {
    const planned = planTargets(topic.md, 'tema').filter(({ card }) => sketches[card.id]);
    const rootA = tempRoot();
    const first = generateArt({ md: topic.md, assetsRoot: rootA, force: true, sketches });
    if (first.missing.length > 0) {
      problems.push(
        problem('missing-sketch', topic.id, first.missing.join(','), 'generateArt no encontró sketch para estas cartas')
      );
    }
    if (first.written.length !== planned.length) {
      problems.push(
        problem(
          'generate-art',
          topic.id,
          null,
          `generateArt escribió ${first.written.length} SVG y se esperaban ${planned.length}`
        )
      );
    }
    const rerun = generateArt({ md: topic.md, assetsRoot: rootA, sketches });
    if (rerun.written.length > 0) {
      problems.push(problem('generate-art', topic.id, null, 'generateArt sobrescribió SVG existentes sin --force'));
    }
    if (rerun.skipped.length !== planned.length) {
      problems.push(
        problem(
          'generate-art',
          topic.id,
          null,
          `generateArt omitió ${rerun.skipped.length} SVG y se esperaban ${planned.length}`
        )
      );
    }
    const rootB = tempRoot();
    generateArt({ md: topic.md, assetsRoot: rootB, force: true, sketches });
    for (const rel of first.written) {
      const a = path.join(rootA, rel);
      const b = path.join(rootB, rel);
      const same =
        fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));
      if (!same) {
        problems.push(problem('non-deterministic', topic.id, rel, 'el SVG no es idéntico entre ejecuciones'));
      }
    }
  }
  return problems;
}

function audit(topics, sketches, assetsRoot = ASSETS_DIR) {
  return [
    ...findMissingImages(topics),
    ...findMissingSketches(topics, sketches),
    ...findOrphanSketches(topics, sketches),
    ...findAssetProblems(topics, assetsRoot),
    ...findQualityProblems(topics, sketches, assetsRoot),
    ...checkGenerateArt(topics, sketches),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo real
// ─────────────────────────────────────────────────────────────────────────────

describe('catálogo de temas', () => {
  const topics = discoverTopics();

  it('descubre al menos un tema y todas sus cartas parsean sin errores', () => {
    expect(topics.length).toBeGreaterThan(0);
    for (const topic of topics) {
      expect(topic.errors, topic.file).toEqual([]);
      expect(topic.cards.length, topic.file).toBeGreaterThan(0);
    }
  });

  it('cada carta con asset: tiene sketch y ningún sketch queda huérfano', () => {
    const problems = [
      ...findMissingImages(topics),
      ...findMissingSketches(topics, SKETCHES),
      ...findOrphanSketches(topics, SKETCHES),
    ];
    expect(formatProblems(problems)).toBe('');
  });

  it('mantiene la paridad entre assets y cartas', () => {
    expect(formatProblems(findAssetProblems(topics))).toBe('');
  });

  it('genera SVG accesibles, deterministas y por debajo de 200 KB', () => {
    expect(formatProblems(findQualityProblems(topics, SKETCHES))).toBe('');
  });

  it('generateArt escribe, omite y reproduce cada tema', () => {
    expect(formatProblems(checkGenerateArt(topics, SKETCHES))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures sintéticos: un tema y dos temas
// ─────────────────────────────────────────────────────────────────────────────

const ALPHA = {
  file: 'alfa.md',
  title: 'Tema Alfa',
  description: 'Descripción del tema alfa para ejercitar el pipeline de arte.',
  questions: [
    { q: '¿Qué es un nodo?', a: 'Un elemento con datos y enlaces', e: 'easy' },
    { q: '¿Qué es una arista?', a: 'Un enlace dirigido entre dos nodos', e: 'easy' },
    { q: '¿Cuándo degenera un grafo?', a: 'Cuando todos los nodos quedan en una cadena', e: 'hard' },
  ],
};

const BETA = {
  file: 'beta.md',
  title: 'Tema Beta',
  description: 'Descripción del tema beta para ejercitar varios temas a la vez.',
  questions: [
    { q: '¿Qué es una pila LIFO?', a: 'Inserta y extrae siempre por el mismo extremo', e: 'easy' },
    { q: '¿Qué es una cola FIFO?', a: 'Inserta al final y extrae por el inicio', e: 'easy' },
  ],
};

function fixtureSketch(label) {
  return (p) => {
    p.background(BG2);
    p.noStroke();
    p.fill(CYAN);
    p.circle(256, 256, 220);
    p.fill(MAGENTA);
    p.rect(140, 140, 120, 120, 12);
    p.fill(TEXT);
    p.text(label, 256, 256, { size: 26 });
  };
}

function writeFixtureTopic(topicsDir, spec) {
  const folder = path.basename(spec.file, '.md');
  const taken = new Set();
  const lines = [`# ${spec.title}`, '', spec.description, ''];
  for (const question of spec.questions) {
    const cardId = uniqueId(slugify(question.q), taken);
    taken.add(cardId);
    lines.push(
      `- Q: ${question.q} | A: ${question.a} | E: ${question.e} | I: asset:${folder}/${cardId}.svg`
    );
  }
  fs.writeFileSync(path.join(topicsDir, spec.file), `${lines.join('\n')}\n`, 'utf8');
}

function createFixture(specs) {
  const root = tempRoot('sepect-art-fixture-');
  const topicsDir = path.join(root, 'topics');
  const assetsRoot = path.join(root, 'assets');
  fs.mkdirSync(topicsDir, { recursive: true });
  fs.mkdirSync(assetsRoot, { recursive: true });
  const sketches = {};
  for (const spec of specs) {
    writeFixtureTopic(topicsDir, spec);
    const md = fs.readFileSync(path.join(topicsDir, spec.file), 'utf8');
    for (const card of parseTopic(md).cards) sketches[card.id] = fixtureSketch(card.id);
  }
  for (const spec of specs) {
    const md = fs.readFileSync(path.join(topicsDir, spec.file), 'utf8');
    generateArt({ md, assetsRoot, force: true, sketches });
  }
  return { root, topicsDir, assetsRoot, sketches };
}

describe('fixtures sintéticos', () => {
  it('valida un tema sintético', () => {
    const fixture = createFixture([ALPHA]);
    const topics = discoverTopics(fixture.topicsDir);
    expect(topics).toHaveLength(1);
    expect(topics[0].cards.length).toBe(ALPHA.questions.length);
    expect(formatProblems(audit(topics, fixture.sketches, fixture.assetsRoot))).toBe('');
  });

  it('valida dos temas sintéticos sin números fijados', () => {
    const fixture = createFixture([ALPHA, BETA]);
    const topics = discoverTopics(fixture.topicsDir);
    expect(topics).toHaveLength(2);
    const total = ALPHA.questions.length + BETA.questions.length;
    expect(topics.reduce((sum, topic) => sum + topic.cards.length, 0)).toBe(total);
    expect(formatProblems(audit(topics, fixture.sketches, fixture.assetsRoot))).toBe('');
  });

  it('identifica el tema y la carta cuando falta un asset', () => {
    const fixture = createFixture([ALPHA, BETA]);
    const topics = discoverTopics(fixture.topicsDir);
    const card = topics[1].cards[0];
    fs.rmSync(path.join(fixture.assetsRoot, card.image.value));
    const problems = findAssetProblems(topics, fixture.assetsRoot);
    expect(problems).toHaveLength(1);
    expect(problems[0].code).toBe('missing-asset');
    expect(problems[0].topic).toBe(topics[1].id);
    expect(problems[0].card).toBe(card.id);
    expect(formatProblem(problems[0])).toContain(card.image.value);
  });

  it('reporta los SVG huérfanos de la carpeta del tema', () => {
    const fixture = createFixture([ALPHA]);
    const topics = discoverTopics(fixture.topicsDir);
    const extra = path.join(fixture.assetsRoot, topics[0].id, 'svg-sobrante.svg');
    fs.writeFileSync(extra, '<svg xmlns="http://www.w3.org/2000/svg"/>', 'utf8');
    const problems = findAssetProblems(topics, fixture.assetsRoot);
    expect(problems.map((p) => p.code)).toEqual(['orphan-asset']);
    expect(problems[0].message).toContain('svg-sobrante.svg');
  });

  it('reporta los sketches huérfanos contra la unión de ids', () => {
    const fixture = createFixture([ALPHA, BETA]);
    const topics = discoverTopics(fixture.topicsDir);
    fixture.sketches['sketch-sin-carta'] = fixtureSketch('huerfano');
    const problems = findOrphanSketches(topics, fixture.sketches);
    expect(problems.map((p) => p.code)).toEqual(['orphan-sketch']);
    expect(problems[0].card).toBe('sketch-sin-carta');
  });

  it('reporta la carta sin sketch con su tema y su id', () => {
    const fixture = createFixture([ALPHA]);
    const topics = discoverTopics(fixture.topicsDir);
    const card = topics[0].cards[0];
    delete fixture.sketches[card.id];
    const problems = findMissingSketches(topics, fixture.sketches);
    expect(problems).toHaveLength(1);
    expect(problems[0].code).toBe('missing-sketch');
    expect(problems[0].topic).toBe(topics[0].id);
    expect(problems[0].card).toBe(card.id);
  });

  it('reporta la carta sin referencia de arte', () => {
    const fixture = createFixture([ALPHA]);
    const topicsDir = fixture.topicsDir;
    const md = fs.readFileSync(path.join(topicsDir, ALPHA.file), 'utf8');
    fs.writeFileSync(
      path.join(topicsDir, ALPHA.file),
      md.replace(/\s*\|\s*I:\s*asset:[^\n]+/, ''),
      'utf8'
    );
    const topics = discoverTopics(topicsDir);
    const problems = findMissingImages(topics);
    expect(problems).toHaveLength(1);
    expect(problems[0].code).toBe('missing-image');
    expect(problems[0].card).toBe(topics[0].cards[0].id);
  });

  it('generateArt informa los ids sin sketch y no escribe esos archivos', () => {
    const fixture = createFixture([ALPHA, BETA]);
    const topics = discoverTopics(fixture.topicsDir);
    const root = tempRoot();
    const result = generateArt({ md: topics[1].md, assetsRoot: root, force: true, sketches: {} });
    expect(result.written).toEqual([]);
    expect(result.missing).toEqual(topics[1].cards.map((card) => card.id));
  });

  it('generateArt omite los SVG existentes salvo con --force', () => {
    const fixture = createFixture([ALPHA]);
    const topics = discoverTopics(fixture.topicsDir);
    const root = tempRoot();
    const first = generateArt({ md: topics[0].md, assetsRoot: root, force: true, sketches: fixture.sketches });
    expect(first.written.length).toBe(topics[0].cards.length);
    const second = generateArt({ md: topics[0].md, assetsRoot: root, sketches: fixture.sketches });
    expect(second.written).toEqual([]);
    expect(second.skipped.length).toBe(topics[0].cards.length);
  });

  it('el SVG generado es idéntico byte a byte entre ejecuciones', () => {
    const fixture = createFixture([ALPHA]);
    const topics = discoverTopics(fixture.topicsDir);
    const rootA = tempRoot();
    const rootB = tempRoot();
    generateArt({ md: topics[0].md, assetsRoot: rootA, force: true, sketches: fixture.sketches });
    generateArt({ md: topics[0].md, assetsRoot: rootB, force: true, sketches: fixture.sketches });
    const rel = topics[0].cards[0].image.value;
    expect(fs.readFileSync(path.join(rootA, rel)).equals(fs.readFileSync(path.join(rootB, rel)))).toBe(true);
  });
});
