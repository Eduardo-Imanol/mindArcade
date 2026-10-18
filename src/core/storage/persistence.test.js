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
});
