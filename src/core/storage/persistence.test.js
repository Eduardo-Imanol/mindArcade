import { describe, it, expect } from 'vitest';
import { awardXP } from './xp.js';
import { createStore } from './store.js';

describe('xp', () => {
  it('hard > easy, wrong = 0', () => {
    const h = awardXP({ xp: 0 }, { correct: true, difficulty: 'hard' });
    const e = awardXP({ xp: 0 }, { correct: true, difficulty: 'easy' });
    expect(h.gained).toBeGreaterThan(e.gained);
    expect(awardXP({ xp: 5 }, { correct: false }).gained).toBe(0);
  });
});

describe('persistence', () => {
  it('save/load deep-equal (mocked storage)', () => {
    const mem = {};
    const backend = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
    const s = createStore(backend);
    const profile = { xp: 35, streak: 2, lastDay: '2026-10-16', history: [{ q: 1 }, { q: 2 }] };
    s.save(profile);
    expect(s.load()).toMatchObject({ xp: 35, streak: 2, history: [{ q: 1 }, { q: 2 }] });
  });
  it('quota fallback warns without crash', () => {
    const backend = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
    const s = createStore(backend);
    const r = s.save({ xp: 1, history: [] });
    expect(r.quotaWarning).toBe(true);
  });
  it('caps history at 5000 attempts keeping the newest', () => {
    const mem = {};
    const backend = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
    const s = createStore(backend);
    s.save({ xp: 0, history: Array.from({ length: 6000 }, (_, index) => ({ index })) });
    const loaded = s.load();
    expect(loaded.history).toHaveLength(5000);
    expect(loaded.history[0]).toEqual({ index: 1000 });
    expect(loaded.history[4999]).toEqual({ index: 5999 });
  });
  it('keeps the per-attempt xp field when present', () => {
    const mem = {};
    const backend = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); } };
    const s = createStore(backend);
    const next = s.addAttempt(
      { xp: 10, history: [] },
      {
        topicId: 'tema',
        cardId: 'carta',
        grade: 'facil',
        xp: 10,
        at: '2026-10-20T10:00:00.000Z',
      }
    );
    expect(next.history[0]).toMatchObject({
      topicId: 'tema',
      cardId: 'carta',
      grade: 'facil',
      xp: 10,
    });
    expect(s.load().history[0].xp).toBe(10);
  });
});
