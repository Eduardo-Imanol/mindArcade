import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EXERCISES_KEY,
  loadExerciseProgress,
  normalizeExerciseProgress,
  recordExerciseResult,
  saveExerciseProgress,
} from './exercises.js';

const TOPIC_ID = 'funciones-en-programacion';
const NOW = 1_700_000_000_000;

function memoryBackend(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    failWrites: false,
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      if (this.failWrites) throw new Error('QuotaExceededError');
      data.set(key, String(value));
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadExerciseProgress (spec-21 T2)', () => {
  it('returns an empty object for missing or corrupt JSON', () => {
    const backend = memoryBackend();
    expect(loadExerciseProgress(backend)).toEqual({});
    backend.data.set(EXERCISES_KEY, '{ roto');
    expect(loadExerciseProgress(backend)).toEqual({});
    backend.data.set(EXERCISES_KEY, '[]');
    expect(loadExerciseProgress(backend)).toEqual({});
    expect(loadExerciseProgress(null)).toEqual({});
  });

  it('sanitizes ids, counts, booleans and dates', () => {
    const backend = memoryBackend({
      [EXERCISES_KEY]: JSON.stringify({
        [TOPIC_ID]: {
          '1': {
            e1: { attempts: 2, correct: 1, done: true, updatedAt: new Date(NOW).toISOString() },
            e2: { attempts: 1, correct: 0, done: false, updatedAt: 'no-fecha' },
            e3: { attempts: 0, correct: 0, done: false },
            e4: { attempts: 3, correct: 9, done: true, updatedAt: NOW },
          },
          '2': { e1: { attempts: 'x', correct: -2, done: 'sí' } },
          mala: { e1: { attempts: 1, correct: 1, done: true } },
        },
        '': { '1': { e1: { attempts: 1, correct: 1, done: true } } },
      }),
    });
    expect(loadExerciseProgress(backend)).toEqual({
      [TOPIC_ID]: {
        '1': {
          e1: {
            attempts: 2,
            correct: 1,
            done: true,
            updatedAt: new Date(NOW).toISOString(),
          },
          e2: { attempts: 1, correct: 0, done: false, updatedAt: null },
          e4: {
            attempts: 3,
            correct: 3,
            done: true,
            updatedAt: new Date(NOW).toISOString(),
          },
        },
      },
    });
  });

  it('normalizes an in-memory progress object without mutating it', () => {
    const raw = {
      [TOPIC_ID]: {
        '1': {
          e1: { attempts: 1, correct: 1, done: true, updatedAt: new Date(NOW).toISOString() },
        },
      },
    };
    const frozen = JSON.parse(JSON.stringify(raw));
    expect(normalizeExerciseProgress(raw)).toEqual(raw);
    expect(raw).toEqual(frozen);
    expect(normalizeExerciseProgress(null)).toEqual({});
  });
});

describe('saveExerciseProgress and recordExerciseResult (spec-21 T2)', () => {
  it('round-trips progress through the dedicated key', () => {
    const backend = memoryBackend();
    const progress = {
      [TOPIC_ID]: {
        '1': {
          e1: { attempts: 1, correct: 1, done: true, updatedAt: new Date(NOW).toISOString() },
        },
      },
    };
    expect(saveExerciseProgress(progress, backend)).toEqual({ ok: true });
    expect(loadExerciseProgress(backend)).toEqual(progress);
    expect([...backend.data.keys()]).toEqual([EXERCISES_KEY]);
  });

  it('records a result, returns the new progress and does not touch SRS', () => {
    const srs = JSON.stringify({ [TOPIC_ID]: { c1: { reps: 2 } } });
    const backend = memoryBackend({ 'sepect.srs.v1': srs });
    const result = recordExerciseResult(
      { topicId: TOPIC_ID, deckNumber: 1, exerciseId: 'e1', correct: true },
      backend,
      NOW
    );
    expect(result.ok).toBe(true);
    expect(result.progress).toEqual({
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
    expect(loadExerciseProgress(backend)).toEqual(result.progress);
    expect(backend.data.get('sepect.srs.v1')).toBe(srs);
  });

  it('keeps the session alive and reports ok:false when quota is full', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const backend = memoryBackend();
    backend.failWrites = true;
    const result = recordExerciseResult(
      { topicId: TOPIC_ID, deckNumber: 1, exerciseId: 'e1', correct: false },
      backend,
      NOW
    );
    expect(result.ok).toBe(false);
    expect(result.progress).toEqual({
      [TOPIC_ID]: {
        '1': {
          e1: {
            attempts: 1,
            correct: 0,
            done: false,
            updatedAt: new Date(NOW).toISOString(),
          },
        },
      },
    });
    expect(loadExerciseProgress(backend)).toEqual({});
  });

  it('does not throw for invalid runs or missing storage', () => {
    const backend = memoryBackend();
    expect(recordExerciseResult({ topicId: '', deckNumber: 1, exerciseId: '' }, backend)).toMatchObject({
      progress: {},
    });
    expect(saveExerciseProgress({}, {})).toEqual({ ok: false });
  });
});
