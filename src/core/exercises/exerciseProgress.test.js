import { describe, expect, it } from 'vitest';
import {
  DECK_EXERCISE_STATUS,
  EXERCISE_STATUS,
  deckExerciseMastery,
  exerciseStatus,
  pendingFirst,
  recordExerciseAttempt,
} from './mastery.js';
import { selectExercises } from './select.js';

const TOPIC_ID = 'funciones-en-programacion';
const NOW = 1_700_000_000_000;

const exercises = Array.from({ length: 6 }, (_, index) => ({
  id: `e${index + 1}`,
  deckNumber: 1,
}));

const data = { topicId: TOPIC_ID, decks: [{ number: 1, exercises }] };

function record(progress, exerciseId, correct, now = NOW) {
  return recordExerciseAttempt(
    progress,
    { topicId: TOPIC_ID, deckNumber: 1, exerciseId, correct },
    now
  );
}

describe('exerciseStatus (spec-21 T2)', () => {
  it('derives no-intentado, en-progreso and aprendido', () => {
    expect(exerciseStatus(null)).toBe(EXERCISE_STATUS.NEW);
    expect(exerciseStatus({})).toBe(EXERCISE_STATUS.NEW);
    expect(exerciseStatus({ attempts: 1, correct: 0, done: false })).toBe(
      EXERCISE_STATUS.PROGRESS
    );
    expect(exerciseStatus({ attempts: 1, correct: 1, done: true })).toBe(
      EXERCISE_STATUS.LEARNED
    );
    expect(exerciseStatus({ attempts: 0, correct: 1 })).toBe(EXERCISE_STATUS.LEARNED);
    expect(exerciseStatus({ attempts: 'x', correct: 'y' })).toBe(EXERCISE_STATUS.NEW);
  });
});

describe('deckExerciseMastery (spec-21 T2)', () => {
  it('starts not started and becomes en-progreso after a failed attempt', () => {
    expect(deckExerciseMastery(1, exercises, {})).toEqual({
      status: DECK_EXERCISE_STATUS.NEW,
      done: 0,
      total: 6,
      learnedIds: [],
    });
    const progress = record({}, 'e1', false);
    expect(deckExerciseMastery(1, exercises, progress[TOPIC_ID]['1'])).toMatchObject({
      status: DECK_EXERCISE_STATUS.PROGRESS,
      done: 0,
      total: 6,
    });
  });

  it('completes only when all six exercises are learned', () => {
    let progress = {};
    for (const exercise of exercises.slice(0, 5)) {
      progress = record(progress, exercise.id, true);
    }
    expect(deckExerciseMastery(1, exercises, progress[TOPIC_ID]['1'])).toMatchObject({
      status: DECK_EXERCISE_STATUS.PROGRESS,
      done: 5,
      total: 6,
      learnedIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
    });

    progress = record(progress, 'e6', true);
    expect(deckExerciseMastery(1, exercises, progress[TOPIC_ID]['1'])).toEqual({
      status: DECK_EXERCISE_STATUS.COMPLETE,
      done: 6,
      total: 6,
      learnedIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'],
    });
  });

  it('keeps an exercise learned after later mistakes and empty decks not started', () => {
    let progress = record({}, 'e1', true);
    progress = record(progress, 'e1', false);
    const entry = progress[TOPIC_ID]['1'].e1;
    expect(entry).toMatchObject({ attempts: 2, correct: 1, done: true });
    expect(exerciseStatus(entry)).toBe(EXERCISE_STATUS.LEARNED);
    expect(deckExerciseMastery(1, [], {})).toMatchObject({
      status: DECK_EXERCISE_STATUS.NEW,
      done: 0,
      total: 0,
    });
  });

  it('accepts a deck-scoped progress map', () => {
    const progress = record({}, 'e1', true);
    expect(deckExerciseMastery(1, exercises, progress[TOPIC_ID])).toMatchObject({
      done: 1,
      total: 6,
    });
  });
});

describe('recordExerciseAttempt (spec-21 T2)', () => {
  it('creates the nested schema without mutating the input', () => {
    const before = Object.freeze({});
    const next = record(before, 'e1', true);
    expect(next).toEqual({
      [TOPIC_ID]: {
        '1': {
          e1: {
            attempts: 1,
            correct: 1,
            done: true,
            updatedAt: new Date(NOW).toISOString(),
          },
        },
      },
    });
    expect(before).toEqual({});
  });

  it('increments attempts/correct and preserves other topics', () => {
    let progress = record({}, 'e1', false);
    progress = record(progress, 'e1', true, NOW + 1000);
    progress = record(progress, 'e2', false, NOW + 2000);
    expect(progress[TOPIC_ID]['1'].e1).toEqual({
      attempts: 2,
      correct: 1,
      done: true,
      updatedAt: new Date(NOW + 1000).toISOString(),
    });
    expect(progress[TOPIC_ID]['1'].e2).toMatchObject({
      attempts: 1,
      correct: 0,
      done: false,
    });
    expect(progress[TOPIC_ID]['1'].e1.updatedAt).not.toBe(new Date(NOW + 2000).toISOString());

    const withOther = record(progress, 'e1', true);
    withOther.otroTema = { '2': { x: { attempts: 1, correct: 1, done: true } } };
    const after = record(withOther, 'e1', true);
    expect(after.otroTema).toBe(withOther.otroTema);
  });

  it('ignores invalid runs and invalid progress gracefully', () => {
    const progress = record({}, 'e1', true);
    expect(recordExerciseAttempt(progress, null)).toEqual(progress);
    expect(
      recordExerciseAttempt(progress, { topicId: '', deckNumber: 1, exerciseId: 'e1' })
    ).toEqual(progress);
    expect(
      recordExerciseAttempt(progress, { topicId: TOPIC_ID, deckNumber: 0, exerciseId: 'e1' })
    ).toEqual(progress);
    expect(recordExerciseAttempt(null, null)).toEqual({});
  });
});

describe('pendingFirst and selection (spec-21 T2)', () => {
  it('puts pending exercises before learned ones in authoring order', () => {
    let progress = record({}, 'e2', true);
    progress = record(progress, 'e5', true);
    const ordered = pendingFirst(exercises, progress[TOPIC_ID]['1']);
    expect(ordered.map((exercise) => exercise.id)).toEqual(['e1', 'e3', 'e4', 'e6', 'e2', 'e5']);
  });

  it('feeds 2/4/6 selection from cross-session progress', () => {
    let progress = record({}, 'e1', true);
    progress = record(progress, 'e2', false);
    const selected = selectExercises(data, 1, { difficulty: 'facil', progress: progress[TOPIC_ID] });
    expect(selected.map((exercise) => exercise.id)).toEqual(['e2', 'e3']);
  });
});
