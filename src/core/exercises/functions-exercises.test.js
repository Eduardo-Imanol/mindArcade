import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../content/catalog.js';
import { buildDecks } from '../repetition/decks.js';
import { parseExercisesMarkdown } from './parse.js';
import { EXERCISE_DECK_COUNT, EXERCISES_PER_DECK, validateExercises } from './schema.js';

const TOPIC_ID = 'funciones-en-programacion';
const FILE = path.join(
  process.cwd(),
  'src/content/exercises/programacion/funciones-en-programacion.md'
);

function realContext() {
  const topic = loadCatalog().find((entry) => entry.id === TOPIC_ID);
  const decks = buildDecks(topic.cards, {}, { size: 10, now: 1_700_000_000_000 });
  return { topic, decks };
}

function loadDocument() {
  const md = fs.readFileSync(FILE, 'utf8');
  return parseExercisesMarkdown(md, { topicId: TOPIC_ID });
}

function allExercises(documentValue) {
  return documentValue.decks.flatMap((deck) => deck.exercises);
}

function runSolution(exercise, args) {
  const context = vm.createContext({ console: { assert() {} } });
  vm.runInContext(exercise.solution, context);
  return vm.runInContext(exercise.functionName, context)(...args);
}

describe('Funciones exercise content (spec-21 T18)', () => {
  it('ships 10 decks with exactly 6 universal exercises each', () => {
    const documentValue = loadDocument();
    expect(documentValue.errors).toEqual([]);
    expect(documentValue.topicId).toBe(TOPIC_ID);
    expect(documentValue.decks).toHaveLength(EXERCISE_DECK_COUNT);
    for (const deck of documentValue.decks) {
      expect(deck.exercises).toHaveLength(EXERCISES_PER_DECK);
    }
    expect(allExercises(documentValue)).toHaveLength(60);
  });

  it('validates against the real catalog decks and cards', () => {
    const { topic, decks } = realContext();
    expect(topic).toBeTruthy();
    const result = validateExercises(TOPIC_ID, loadDocument(), {
      cards: topic.cards,
      decks,
    });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('uses unique ids and only cards from the exercise deck', () => {
    const { decks } = realContext();
    const documentValue = loadDocument();
    const ids = new Set();
    for (const deck of documentValue.decks) {
      const ownCards = new Set(decks[deck.number - 1].cards.map((card) => card.id));
      for (const exercise of deck.exercises) {
        expect(ids.has(exercise.id), `id duplicado: ${exercise.id}`).toBe(false);
        ids.add(exercise.id);
        expect(exercise.cardIds.length).toBeGreaterThan(0);
        for (const cardId of exercise.cardIds) {
          expect(ownCards.has(cardId), `${exercise.id}: ${cardId} no es del mazo ${deck.number}`).toBe(
            true
          );
        }
      }
    }
    expect(ids.size).toBe(60);
  });

  it('keeps every exercise ready for the three mechanics', () => {
    for (const exercise of allExercises(loadDocument())) {
      expect(exercise.language).toBe('javascript');
      expect(exercise.prompt.trim().length).toBeGreaterThan(0);
      expect(exercise.solution.trim().length).toBeGreaterThan(0);
      expect(exercise.starter.trim().length).toBeGreaterThan(0);
      expect(exercise.template).toContain('{{');
      expect(exercise.blanks.length).toBeGreaterThan(0);
      expect(exercise.pieces.length).toBeGreaterThan(0);
      expect(exercise.functionName).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
      expect(exercise.cases.length).toBeGreaterThan(0);
    }
  });

  it('runs every solution against its own cases', () => {
    for (const deck of loadDocument().decks) {
      for (const exercise of deck.exercises) {
        for (const testCase of exercise.cases) {
          const actual = runSolution(exercise, testCase.args);
          expect(
            actual,
            `Mazo ${deck.number} / ${exercise.id}: ${JSON.stringify(testCase.args)}`
          ).toEqual(testCase.expected);
        }
      }
    }
  });
});
