import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildDecks } from '../repetition/decks.js';
import { parseExercisesMarkdown } from './parse.js';
import {
  EXERCISE_DECK_COUNT,
  EXERCISES_PER_DECK,
  validateExercises,
} from './schema.js';
import {
  EXERCISE_COUNTS,
  countExercises,
  exercisesForDifficulty,
  hasExerciseDocument,
  resolveDeckProgress,
  selectExercises,
} from './select.js';
import {
  hasExerciseDocument as hasDocumentInManifest,
  hasExercises,
  listExerciseKeys,
  loadExercises,
  normalizeExerciseTopicId,
  resolveExerciseKey,
} from '../../content/exercises/index.js';

const TOPIC_ID = 'funciones-en-programacion';
const NOW = 1_700_000_000_000;

const cards = Array.from({ length: 100 }, (_, index) => ({ id: `c${index + 1}` }));
const decks = buildDecks(cards, {}, { size: 10, now: NOW });

function functionNames(deckNumber, index) {
  return `sumar${deckNumber}_${index}`;
}

function exerciseMarkdown(deckNumber, index, options = {}) {
  const name = options.functionName || functionNames(deckNumber, index);
  const cardId = options.cardId || `c${(deckNumber - 1) * 10 + 1}`;
  const solution = options.solution || `function ${name}(a, b) {\n  return a + b;\n}`;
  const starter = options.starter || `function ${name}(a, b) {\n  // tu código\n}`;
  const template = options.template || `function ${name}({{a}}, {{b}}) {\n  return {{op}};\n}`;
  const lines = [
    `### E: ${options.id || `ejercicio-${deckNumber}-${index}`}`,
    `- Cartas: ${cardId}`,
    `- Prompt: ${options.prompt || `Resuelve el ejercicio ${deckNumber}-${index}.`}`,
    `- Lenguaje: ${options.language || 'javascript'}`,
    '',
    'Solución:',
    '```js',
    solution,
    '```',
    '',
    'Starter:',
    '```js',
    starter,
    '```',
    '',
    'Plantilla:',
    '```js',
    template,
    '```',
    '',
    'Blanks:',
    ...(options.blanks || ['- a = a', '- b = b', '- op = a + b | b + a']),
    '',
    `Función: ${name}`,
    '',
    'Casos:',
    ...(options.cases || ['- [2, 3] → 5', '- [0, 0] → 0']),
  ];
  if (options.pieces) lines.push('', 'Piezas:', ...options.pieces);
  return lines.join('\n');
}

function makeMarkdown({ deckCount = EXERCISE_DECK_COUNT, exercisesPerDeck = EXERCISES_PER_DECK } = {}) {
  const lines = ['# Funciones en Programación — Ejercicios', '', `Tema: ${TOPIC_ID}`, ''];
  for (let deckNumber = 1; deckNumber <= deckCount; deckNumber += 1) {
    lines.push(`## Mazo ${deckNumber}`, '');
    for (let index = 0; index < exercisesPerDeck; index += 1) {
      lines.push(exerciseMarkdown(deckNumber, index), '');
    }
  }
  return lines.join('\n');
}

function parseValid(markdown = makeMarkdown()) {
  const parsed = parseExercisesMarkdown(markdown, { topicId: TOPIC_ID });
  expect(parsed.errors).toEqual([]);
  return parsed;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

describe('parseExercisesMarkdown (spec-21 T1)', () => {
  it('parses a minimal exercise, derives pieces and keeps universal fields', () => {
    const parsed = parseValid(makeMarkdown({ deckCount: 1 }));
    expect(parsed.topicId).toBe(TOPIC_ID);
    expect(parsed.decks).toHaveLength(1);
    expect(parsed.decks[0].number).toBe(1);
    const exercise = parsed.decks[0].exercises[0];
    expect(exercise).toMatchObject({
      id: 'ejercicio-1-0',
      deckNumber: 1,
      cardIds: ['c1'],
      prompt: 'Resuelve el ejercicio 1-0.',
      language: 'javascript',
      functionName: 'sumar1_0',
      solution: 'function sumar1_0(a, b) {\n  return a + b;\n}',
      starter: 'function sumar1_0(a, b) {\n  // tu código\n}',
      template: 'function sumar1_0({{a}}, {{b}}) {\n  return {{op}};\n}',
    });
    expect(exercise.blanks).toEqual([
      { id: 'a', answer: 'a', alternatives: [] },
      { id: 'b', answer: 'b', alternatives: [] },
      { id: 'op', answer: 'a + b', alternatives: ['b + a'] },
    ]);
    expect(exercise.cases).toEqual([
      { args: [2, 3], expected: 5 },
      { args: [0, 0], expected: 0 },
    ]);
    expect(exercise.pieces).toEqual([
      { id: 'p1', code: 'function sumar1_0(a, b) {' },
      { id: 'p2', code: '  return a + b;' },
      { id: 'p3', code: '}' },
    ]);
  });

  it('accepts explicit Piezas with stable ids and both case arrows', () => {
    const markdown = makeMarkdown({ deckCount: 1, exercisesPerDeck: 1 }).replace(
      '- [0, 0] → 0',
      '- ["a", "b"] -> 0'
    );
    const withPieces = `${markdown}
Piezas:
- l1 = function sumar1_0(a, b) {
- l2 =   return a + b;
- l3 = }
`;
    const parsed = parseExercisesMarkdown(withPieces, { topicId: TOPIC_ID });
    expect(parsed.errors).toEqual([]);
    const exercise = parsed.decks[0].exercises[0];
    expect(exercise.pieces.map((piece) => piece.id)).toEqual(['l1', 'l2', 'l3']);
    expect(exercise.cases[1]).toEqual({ args: ['a', 'b'], expected: 0 });
  });

  it('accumulates errors without throwing for missing/invalid structure', () => {
    const missingTopic = parseExercisesMarkdown('# T\n\n## Mazo 1\n\n### E: x', { topicId: TOPIC_ID });
    expect(missingTopic.errors).toEqual(expect.arrayContaining([expect.stringContaining('Falta el campo Tema')]));

    const mismatch = parseExercisesMarkdown(makeMarkdown({ deckCount: 1 }), { topicId: 'otro-tema' });
    expect(mismatch.topicId).toBe(TOPIC_ID);
    expect(mismatch.errors.join('\n')).toContain('no coincide');

    const invalid = parseExercisesMarkdown(
      [
        `Tema: ${TOPIC_ID}`,
        '## Mazo uno',
        '### Ejercicio x',
        'Texto suelto',
        '```js',
        'const x = 1;',
        '```',
        '- campo: valor',
      ].join('\n'),
      { topicId: TOPIC_ID }
    );
    expect(invalid.errors.length).toBeGreaterThan(0);
    expect(invalid.errors.join('\n')).toContain('encabezado de mazo inválido');
    expect(invalid.errors.join('\n')).toContain('encabezado de ejercicio inválido');
    expect(invalid.errors.join('\n')).toContain('línea no reconocida');
    expect(invalid.errors.join('\n')).toContain('bloque de código sin campo');
  });

  it('does not hide out-of-deck or future cards', () => {
    const markdown = makeMarkdown({ deckCount: 2, exercisesPerDeck: 1 });
    const parsed = parseValid(markdown);
    expect(parsed.decks[1].exercises[0].cardIds).toEqual(['c11']);
  });
});

describe('validateExercises (spec-21 T1)', () => {
  it('validates the full 10 × 6 document and the current-deck cards', () => {
    const parsed = parseValid();
    const result = validateExercises(TOPIC_ID, parsed, { cards, decks });
    expect(result).toEqual({ ok: true, errors: [] });
    expect(parsed.decks).toHaveLength(10);
    expect(parsed.decks.every((deck) => deck.exercises.length === 6)).toBe(true);
    expect(parsed.decks.every((deck) => deck.exercises.every((exercise) => !('type' in exercise)))).toBe(true);
  });

  it('rejects wrong deck counts and exercise counts', () => {
    const missingDeck = clone(parseValid());
    missingDeck.decks.pop();
    expect(validateExercises(TOPIC_ID, missingDeck, { cards, decks }).errors.join('\n')).toContain(
      'Se esperaban 10 mazos y hay 9'
    );

    const missingExercise = clone(parseValid());
    missingExercise.decks[0].exercises.pop();
    expect(validateExercises(TOPIC_ID, missingExercise, { cards, decks }).errors.join('\n')).toContain(
      'Mazo 1: se esperaban 6 ejercicios y hay 5'
    );
  });

  it('rejects cards from another or future deck with deck and card ids', () => {
    const otherDeck = clone(parseValid());
    otherDeck.decks[1].exercises[0].cardIds = ['c1'];
    const otherResult = validateExercises(TOPIC_ID, otherDeck, { cards, decks });
    expect(otherResult.ok).toBe(false);
    expect(otherResult.errors.join('\n')).toContain('Mazo 2');
    expect(otherResult.errors.join('\n')).toContain('c1');
    expect(otherResult.errors.join('\n')).toContain('mazo 1');

    const futureDeck = clone(parseValid());
    futureDeck.decks[0].exercises[0].cardIds = ['c11'];
    expect(validateExercises(TOPIC_ID, futureDeck, { cards, decks }).errors.join('\n')).toContain(
      'carta del mazo 2: c11'
    );

    const unknown = clone(parseValid());
    unknown.decks[0].exercises[0].cardIds = ['no-existe'];
    expect(validateExercises(TOPIC_ID, unknown, { cards, decks }).errors.join('\n')).toContain(
      'carta desconocida: no-existe'
    );

    const empty = clone(parseValid());
    empty.decks[0].exercises[0].cardIds = [];
    expect(validateExercises(TOPIC_ID, empty, { cards, decks }).errors.join('\n')).toContain(
      'cardIds debe tener al menos una carta'
    );
  });

  it('rejects duplicate exercise ids and invalid fields', () => {
    const duplicate = clone(parseValid());
    duplicate.decks[1].exercises[0].id = duplicate.decks[0].exercises[0].id;
    expect(validateExercises(TOPIC_ID, duplicate, { cards, decks }).errors.join('\n')).toContain(
      'id de ejercicio duplicado'
    );

    const invalid = clone(parseValid());
    const exercise = invalid.decks[0].exercises[0];
    exercise.template = 'function sumar1_0(a, b) {\n  return 0;\n}';
    exercise.cases = [];
    exercise.functionName = '1 inválido';
    exercise.language = 'dart';
    const errors = validateExercises(TOPIC_ID, invalid, { cards, decks }).errors.join('\n');
    expect(errors).toContain('lenguaje no permitido: dart');
    expect(errors).toContain('functionName inválido');
    expect(errors).toContain('cases debe tener al menos un caso');
    expect(errors).toContain('plantilla + blanks no coincide');
  });

  it('rejects invalid blanks, markers and pieces', () => {
    const duplicateBlank = clone(parseValid());
    duplicateBlank.decks[0].exercises[0].blanks.push({ id: 'a', answer: 'x' });
    expect(validateExercises(TOPIC_ID, duplicateBlank, { cards, decks }).errors.join('\n')).toContain(
      'blank duplicado: a'
    );

    const emptyAnswer = clone(parseValid());
    emptyAnswer.decks[0].exercises[0].blanks[0].answer = '   ';
    expect(validateExercises(TOPIC_ID, emptyAnswer, { cards, decks }).errors.join('\n')).toContain(
      'blank a sin respuesta'
    );

    const marker = clone(parseValid());
    marker.decks[0].exercises[0].template = 'function x() {\n  return {{nope}};\n}';
    expect(validateExercises(TOPIC_ID, marker, { cards, decks }).errors.join('\n')).toContain(
      'marcador {{nope}} sin blank declarado'
    );

    const unused = clone(parseValid());
    unused.decks[0].exercises[0].blanks.push({ id: 'extra', answer: 'x' });
    expect(validateExercises(TOPIC_ID, unused, { cards, decks }).errors.join('\n')).toContain(
      'blank extra sin marcador en template'
    );

    const duplicatePiece = clone(parseValid());
    duplicatePiece.decks[0].exercises[0].pieces.push({ id: 'p1', code: 'x' });
    expect(validateExercises(TOPIC_ID, duplicatePiece, { cards, decks }).errors.join('\n')).toContain(
      'pieza duplicada: p1'
    );

    const badPieces = clone(parseValid());
    badPieces.decks[0].exercises[0].pieces = [{ id: 'p1', code: 'no coincide' }];
    expect(validateExercises(TOPIC_ID, badPieces, { cards, decks }).errors.join('\n')).toContain(
      'las piezas no reconstruyen la solución'
    );

    const badCase = clone(parseValid());
    badCase.decks[0].exercises[0].cases = [{ args: 'no-array' }];
    const caseErrors = validateExercises(TOPIC_ID, badCase, { cards, decks }).errors.join('\n');
    expect(caseErrors).toContain('args debe ser un array');
    expect(caseErrors).toContain('falta expected');
  });

  it('includes parser errors and tolerates invalid documents', () => {
    const parsed = parseExercisesMarkdown(makeMarkdown({ deckCount: 1 }), { topicId: 'otro' });
    expect(validateExercises('otro', parsed, { cards, decks }).errors.join('\n')).toContain('parse:');
    expect(validateExercises(TOPIC_ID, null).ok).toBe(false);
  });
});

describe('selectExercises (spec-21 T1/T2)', () => {
  const parsed = parseValid();

  it('counts deck exercises and selects 2/4/6', () => {
    expect(countExercises(parsed, 1)).toBe(6);
    expect(countExercises(parsed, 99)).toBe(0);
    expect(EXERCISE_COUNTS).toEqual({ facil: 2, medio: 4, dificil: 6 });
    expect(selectExercises(parsed, 1, { count: 2 })).toHaveLength(2);
    expect(selectExercises(parsed, 1, { count: 4 })).toHaveLength(4);
    expect(selectExercises(parsed, 1, { count: 6 })).toHaveLength(6);
    expect(exercisesForDifficulty(parsed, 1, 'facil')).toHaveLength(2);
    expect(exercisesForDifficulty(parsed, 1, 'medio')).toHaveLength(4);
    expect(exercisesForDifficulty(parsed, 1, 'dificil')).toHaveLength(6);
  });

  it('prioritizes not-learned exercises in authoring order', () => {
    const progress = { '1': { 'ejercicio-1-0': { attempts: 1, correct: 1, done: true } } };
    const selected = selectExercises(parsed, 1, { count: 2, progress });
    expect(selected.map((exercise) => exercise.id)).toEqual(['ejercicio-1-1', 'ejercicio-1-2']);

    expect(resolveDeckProgress(progress, 1)).toEqual(progress['1']);
    expect(selectExercises(parsed, 1, { count: 6, progress: progress['1'] })).toHaveLength(6);
    expect(selectExercises(parsed, 2)).toHaveLength(6);
    expect(selectExercises(parsed, 99)).toEqual([]);
  });

  it('detects whether a document has exercises', () => {
    expect(hasExerciseDocument(parsed)).toBe(true);
    expect(hasExerciseDocument(null)).toBe(false);
    expect(hasExerciseDocument({ decks: [] })).toBe(false);
  });
});

describe('exercise manifest (spec-21 T1)', () => {
  it('normalizes topic ids and blocks traversal', () => {
    expect(normalizeExerciseTopicId('programacion/funciones-en-programacion')).toBe(
      'programacion/funciones-en-programacion'
    );
    expect(normalizeExerciseTopicId('programacion\\funciones-en-programacion.md')).toBe(
      'programacion/funciones-en-programacion'
    );
    expect(normalizeExerciseTopicId('src/content/exercises/programacion/funciones-en-programacion.md')).toBe(
      'programacion/funciones-en-programacion'
    );
    expect(normalizeExerciseTopicId('funciones-en-programacion')).toBe('funciones-en-programacion');
    expect(normalizeExerciseTopicId('../secreto')).toBeNull();
    expect(normalizeExerciseTopicId('programacion/../../etc/passwd')).toBeNull();
    expect(normalizeExerciseTopicId('/etc/passwd')).toBeNull();
    expect(normalizeExerciseTopicId('//servidor/x')).toBeNull();
    expect(normalizeExerciseTopicId('')).toBeNull();
    expect(normalizeExerciseTopicId(null)).toBeNull();
  });

  it('returns null/false for topics without a manifest', async () => {
    expect(hasExercises('programacion/no-existe')).toBe(false);
    expect(hasExercises('../no-existe')).toBe(false);
    expect(hasDocumentInManifest('programacion/no-existe')).toBe(false);
    expect(resolveExerciseKey('programacion/no-existe')).toBeNull();
    expect(await loadExercises('programacion/no-existe')).toBeNull();
    expect(Array.isArray(listExerciseKeys())).toBe(true);
  });

  it('keeps the registry lazy and does not use eager globs', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/content/exercises/index.js'), 'utf8');
    expect(source).toMatch(/import\.meta\.glob\(/);
    expect(source).not.toMatch(/eager\s*:\s*true/);
  });
});
