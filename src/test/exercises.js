import { buildDecks } from '../core/repetition/decks.js';

export const EXERCISE_TOPIC_ID = 'funciones-en-programacion';

export const EXERCISE_CARDS = Array.from({ length: 20 }, (_value, index) => ({
  id: `card-${index + 1}`,
  front: `Concepto ${index + 1}`,
  back: `Significado ${index + 1}`,
  difficulty: 'easy',
}));

export function exerciseId(deckNumber, index) {
  return `ex-${deckNumber}-${index}`;
}

export function pieceId(deckNumber, index, pieceNumber) {
  return `${exerciseId(deckNumber, index)}-p${pieceNumber}`;
}

export function makeExercise(deckNumber, index, overrides = {}) {
  const serial = (deckNumber - 1) * 6 + index;
  const solution = `function suma${serial}(a) {\n  return a + ${serial};\n}`;
  const exercise = {
    id: exerciseId(deckNumber, index),
    deckNumber,
    cardIds: [EXERCISE_CARDS[(deckNumber - 1) * 10 + index - 1].id],
    prompt: `Completa la función suma${serial}.`,
    language: 'javascript',
    solution,
    starter: `function suma${serial}(a) {\n  return a;\n}`,
    template: `function suma${serial}(a) {\n  return {{op}};\n}`,
    blanks: [{ id: 'op', answer: `a + ${serial}`, alternatives: [] }],
    functionName: `suma${serial}`,
    cases: [{ args: [1], expected: 1 + serial }],
    pieces: [
      { id: pieceId(deckNumber, index, 1), code: `function suma${serial}(a) {` },
      { id: pieceId(deckNumber, index, 2), code: `  return a + ${serial};` },
      { id: pieceId(deckNumber, index, 3), code: '}' },
    ],
  };
  return { ...exercise, ...overrides };
}

export function makeExerciseDocument({ deckCount = 2, perDeck = 6 } = {}) {
  return {
    topicId: EXERCISE_TOPIC_ID,
    decks: Array.from({ length: deckCount }, (_value, deckIndex) => {
      const number = deckIndex + 1;
      return {
        number,
        exercises: Array.from({ length: perDeck }, (_entry, exerciseIndex) =>
          makeExercise(number, exerciseIndex + 1)
        ),
      };
    }),
    errors: [],
  };
}

export function makeCardDecks() {
  return buildDecks(EXERCISE_CARDS, {}, { size: 10, now: 1000 });
}

export function learnedProgress(ids, deckNumber = 1) {
  const deck = {};
  for (const id of ids) {
    deck[id] = {
      attempts: 1,
      correct: 1,
      done: true,
      updatedAt: '2026-10-27T00:00:00.000Z',
    };
  }
  return { [EXERCISE_TOPIC_ID]: { [deckNumber]: deck } };
}
