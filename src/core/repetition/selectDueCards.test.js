import { describe, expect, it } from 'vitest';
import { LEARNED_REPS, selectDueCards } from './selectDueCards.js';

const NOW = 1_760_000_000_000;
const FIXED = () => 0.42;

function deck(...ids) {
  return ids.map((id) => ({ id }));
}

describe('selectDueCards', () => {
  it('prioritizes unlearned (shuffled) and backfills learned by nextReview asc', () => {
    const cards = deck('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
    const srs = {
      c: { reps: 3, nextReview: NOW + 300 },
      d: { reps: 4, nextReview: NOW + 200 },
      e: { reps: 5, nextReview: NOW + 100 },
      f: { reps: 1, nextReview: NOW + 999 },
      g: { reps: 2, nextReview: NOW + 999 },
    };
    const picked = selectDueCards(cards, srs, { count: 6, random: FIXED });
    expect(picked).toHaveLength(6);
    expect(new Set(picked.slice(0, 5).map((card) => card.id))).toEqual(
      new Set(['a', 'b', 'h', 'f', 'g'])
    );
    expect(picked[5].id).toBe('e');
  });

  it('returns only unlearned when the pool reaches count', () => {
    const cards = deck('a', 'b', 'c', 'd', 'e');
    const picked = selectDueCards(cards, { a: { reps: 3, nextReview: NOW } }, {
      count: 4,
      random: FIXED,
    });
    expect(picked).toHaveLength(4);
    expect(picked.some((card) => card.id === 'a')).toBe(false);
  });

  it('never returns more than count and all cards when count exceeds deck', () => {
    const cards = deck('a', 'b', 'c');
    expect(selectDueCards(cards, {}, { count: 100, random: FIXED })).toHaveLength(3);
    expect(selectDueCards(cards, {}, { count: 2, random: FIXED })).toHaveLength(2);
  });

  it('fills with learned sorted by nextReview ascending when everything is learned', () => {
    const cards = deck('a', 'b', 'c');
    const srs = {
      a: { reps: 5, nextReview: NOW + 300 },
      b: { reps: 6, nextReview: NOW - 100 },
      c: { reps: 3, nextReview: NOW + 50 },
    };
    const picked = selectDueCards(cards, srs, { count: 3, random: FIXED });
    expect(picked.map((card) => card.id)).toEqual(['b', 'c', 'a']);
  });

  it('is deterministic for a fixed random', () => {
    const cards = deck('a', 'b', 'c', 'd');
    const srs = { d: { reps: 3, nextReview: NOW } };
    const first = selectDueCards(cards, srs, { count: 3, random: FIXED });
    const second = selectDueCards(cards, srs, { count: 3, random: FIXED });
    expect(second.map((card) => card.id)).toEqual(first.map((card) => card.id));
  });

  it('handles empty decks, zero count and missing options safely', () => {
    expect(selectDueCards([], {}, { count: 4 })).toEqual([]);
    expect(selectDueCards(deck('a'), {}, { count: 0 })).toEqual([]);
    expect(selectDueCards(deck('a'), {}, {})).toHaveLength(1);
    expect(selectDueCards()).toEqual([]);
  });

  it('does not mutate the input deck or srs', () => {
    const cards = deck('a', 'b');
    const srs = { a: { reps: 3, nextReview: NOW } };
    const snapshotCards = JSON.parse(JSON.stringify(cards));
    const snapshotSrs = JSON.parse(JSON.stringify(srs));
    selectDueCards(cards, srs, { count: 2, random: FIXED });
    expect(cards).toEqual(snapshotCards);
    expect(srs).toEqual(snapshotSrs);
  });

  it('exposes LEARNED_REPS = 3', () => {
    expect(LEARNED_REPS).toBe(3);
  });
});
