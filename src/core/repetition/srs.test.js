import { afterEach, describe, expect, it } from 'vitest';
import { applyGrade, loadSrs, orderDeck, saveSrs } from './srs.js';

const NOW = 1_760_000_000_000;

afterEach(() => {
  localStorage.clear();
});

describe('orderDeck', () => {
  it('unseen first (content order), then nextReview ascending', () => {
    const cards = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ];
    const srs = {
      c: { interval: 1, ease: 2.5, reps: 1, nextReview: NOW - 5000 },
      a: { interval: 6, ease: 2.5, reps: 2, nextReview: NOW - 86400000 },
    };
    const ordered = orderDeck(cards, srs, NOW);
    expect(ordered.map((c) => c.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('empty srs keeps content order; injectable now; whole deck playable', () => {
    const cards = [{ id: 'x' }, { id: 'y' }];
    expect(orderDeck(cards, {}, NOW).map((c) => c.id)).toEqual(['x', 'y']);
    expect(orderDeck(cards, { x: { nextReview: Number.POSITIVE_INFINITY } }, NOW)).toHaveLength(2);
  });
});

describe('applyGrade', () => {
  it('unseen card + facil → scheduleNext(easy) output', () => {
    const out = applyGrade({}, 'tema', 'card-1', 'facil', NOW);
    const state = out.tema['card-1'];
    expect(state.reps).toBe(1);
    expect(state.interval).toBe(1);
    expect(state.nextReview).toBe(NOW + 86400000);
  });

  it('otra-vez resets reps and keeps interval 1', () => {
    const prev = { tema: { c: { interval: 6, ease: 2.5, reps: 3, nextReview: NOW } } };
    const out = applyGrade(prev, 'tema', 'c', 'otra-vez', NOW);
    expect(out.tema.c.reps).toBe(0);
    expect(out.tema.c.interval).toBe(1);
  });

  it('persisted (save/load deep-equal) and survives simulated reload', () => {
    const next = applyGrade(applyGrade({}, 'tema', 'a', 'facil', NOW), 'tema', 'b', 'dificil', NOW);
    const res = saveSrs(next);
    expect(res.ok).toBe(true);
    const reload = loadSrs();
    expect(reload).toEqual(next);
  });

  it('corrupt srs JSON → {} without crash', () => {
    localStorage.setItem('sepect.srs.v1', '{broken');
    expect(loadSrs()).toEqual({});
  });

  it('does not mutate the input srs', () => {
    const prev = {};
    applyGrade(prev, 'tema', 'x', 'facil', NOW);
    expect(prev).toEqual({});
  });
});
