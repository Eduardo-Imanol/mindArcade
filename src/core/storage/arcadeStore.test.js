import { describe, expect, it } from 'vitest';
import {
  ARCADE_KEY,
  MAX_ARCADE_RUNS,
  bestFor,
  loadArcadeRecords,
  recordArcadeRun,
  saveArcadeRecords,
} from './arcade.js';

function memoryBackend(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}

const run = (overrides = {}) => ({
  topicId: 'topic',
  gameId: 'flashcards',
  deckId: 'deck-1',
  score: 300,
  correct: 3,
  wrong: 0,
  lives: 2,
  completed: true,
  at: '2026-01-02T03:04:05.000Z',
  ...overrides,
});

describe('arcade records storage', () => {
  it('round-trips records under sepect.arcade.v1 only', () => {
    const backend = memoryBackend({ 'sepect.srs.v1': '{"topic":{}}', 'sepect.profile.v1': '{}' });
    const result = recordArcadeRun(run(), backend);
    expect(result).toMatchObject({ ok: true, best: 300, isRecord: true });
    expect(Object.keys(backend.data).sort()).toEqual([
      'sepect.arcade.v1',
      'sepect.profile.v1',
      'sepect.srs.v1',
    ]);
    expect(loadArcadeRecords(backend)).toEqual({
      'topic:flashcards:deck-1': {
        best: 300,
        runs: [run()],
      },
    });
    expect(bestFor(loadArcadeRecords(backend), 'topic', 'flashcards', 'deck-1')).toBe(300);
    expect(bestFor(loadArcadeRecords(backend), 'topic', 'flashcards', 'deck-2')).toBe(0);
  });

  it('tracks the best score and whether a run is a record', () => {
    const backend = memoryBackend();
    const first = recordArcadeRun(run({ score: 300 }), backend);
    const lower = recordArcadeRun(run({ score: 250 }), backend);
    const higher = recordArcadeRun(run({ score: 420 }), backend);
    expect(first.isRecord).toBe(true);
    expect(lower).toMatchObject({ best: 300, isRecord: false });
    expect(higher).toMatchObject({ best: 420, isRecord: true });
    expect(bestFor(loadArcadeRecords(backend), 'topic', 'flashcards', 'deck-1')).toBe(420);
  });

  it('keeps at most the last 20 runs per deck', () => {
    const backend = memoryBackend();
    for (let index = 0; index < 25; index += 1) {
      recordArcadeRun(run({ score: index + 1 }), backend);
    }
    const records = loadArcadeRecords(backend);
    const entry = records['topic:flashcards:deck-1'];
    expect(entry.runs).toHaveLength(MAX_ARCADE_RUNS);
    expect(entry.runs[0].score).toBe(6);
    expect(entry.runs[MAX_ARCADE_RUNS - 1].score).toBe(25);
    expect(entry.best).toBe(25);
  });

  it('recovers from corrupt JSON and discards invalid runs', () => {
    const backend = memoryBackend({ [ARCADE_KEY]: '{not json' });
    expect(loadArcadeRecords(backend)).toEqual({});

    const invalid = recordArcadeRun({ score: 100 }, backend);
    expect(invalid).toMatchObject({ ok: false, best: 0, isRecord: false });

    const weird = memoryBackend({
      [ARCADE_KEY]: JSON.stringify({
        'topic:flashcards:deck-1': {
          best: 'nope',
          runs: [{ score: 'x' }, run({ score: 120.9, at: 'invalid' })],
        },
        bad: null,
      }),
    });
    const records = loadArcadeRecords(weird);
    expect(Object.keys(records)).toEqual(['topic:flashcards:deck-1']);
    expect(records['topic:flashcards:deck-1'].best).toBe(120);
    expect(records['topic:flashcards:deck-1'].runs[0]).toMatchObject({
      score: 120,
      correct: 3,
      wrong: 0,
      lives: 2,
      completed: true,
    });
    expect(Number.isNaN(Date.parse(records['topic:flashcards:deck-1'].runs[0].at))).toBe(false);
  });

  it('does not break the run when storage quota is full', () => {
    const backend = {
      getItem: () => null,
      setItem() {
        throw new Error('QuotaExceededError');
      },
    };
    const result = recordArcadeRun(run(), backend);
    expect(result).toMatchObject({ ok: false, best: 300, isRecord: true, records: {} });
    expect(saveArcadeRecords({}, backend)).toEqual({ ok: false });
  });

  it('sanitizes ids, scores and dates without mutating the input', () => {
    const backend = memoryBackend();
    const input = run({ score: -10, correct: '2', wrong: 1.9, lives: 3.7 });
    const before = JSON.stringify(input);
    recordArcadeRun(input, backend);
    expect(JSON.stringify(input)).toBe(before);
    const stored = loadArcadeRecords(backend)['topic:flashcards:deck-1'].runs[0];
    expect(stored).toMatchObject({ score: 0, correct: 2, wrong: 1, lives: 3 });
  });
});
