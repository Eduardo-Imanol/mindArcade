import { describe, expect, it } from 'vitest';
import { selectStudyCards } from './selectStudyCards.js';

const NOW = 1_760_000_000_000;
const FIXED = () => 0.42;

function deck(...ids) {
  return ids.map((id) => ({ id }));
}

describe('selectStudyCards', () => {
  it('returns unlearned first, then only due learned, never not-due (AC-13)', () => {
    const cards = deck('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
    const srs = {
      c: { reps: 1, nextReview: NOW + 500 },
      d: { reps: 3, nextReview: NOW - 400 },
      e: { reps: 4, nextReview: NOW - 300 },
      f: { reps: 3, nextReview: NOW - 200 },
      g: { reps: 5, nextReview: NOW - 100 },
      h: { reps: 3, nextReview: NOW + 100 },
      i: { reps: 4, nextReview: NOW + 200 },
      j: { reps: 6, nextReview: NOW + 300 },
    };
    const picked = selectStudyCards(cards, srs, { count: 8, now: NOW, random: FIXED });
    expect(picked.length).toBeLessThanOrEqual(8);
    expect(picked).toHaveLength(7);
    expect(new Set(picked.slice(0, 3).map((card) => card.id))).toEqual(new Set(['a', 'b', 'c']));
    expect(picked.slice(3).map((card) => card.id)).toEqual(['d', 'e', 'f', 'g']);
    for (const id of ['h', 'i', 'j']) {
      expect(picked.some((card) => card.id === id)).toBe(false);
    }
  });

  it('returns only unlearned when they reach count', () => {
    const cards = deck('a', 'b', 'c', 'd', 'e');
    const srs = { a: { reps: 3, nextReview: NOW - 10 } };
    const picked = selectStudyCards(cards, srs, { count: 4, now: NOW, random: FIXED });
    expect(picked).toHaveLength(4);
    expect(picked.some((card) => card.id === 'a')).toBe(false);
  });

  it('fills with due learned sorted by nextReview ascending', () => {
    const cards = deck('a', 'b', 'c', 'd');
    const srs = {
      b: { reps: 5, nextReview: NOW + 500 },
      c: { reps: 3, nextReview: NOW - 50 },
      d: { reps: 4, nextReview: NOW - 500 },
    };
    const picked = selectStudyCards(cards, srs, { count: 4, now: NOW, random: FIXED });
    expect(picked.map((card) => card.id)).toEqual(['a', 'd', 'c']);
  });

  it('treats learned cards with invalid nextReview as not due', () => {
    const cards = deck('a', 'b', 'c');
    const srs = {
      b: { reps: 3, nextReview: NaN },
      c: { reps: 3 },
    };
    const picked = selectStudyCards(cards, srs, { count: 3, now: NOW, random: FIXED });
    expect(picked.map((card) => card.id)).toEqual(['a']);
  });

  it('returns [] when nothing is eligible', () => {
    const cards = deck('a', 'b', 'c');
    const srs = {
      a: { reps: 3, nextReview: NOW + 1 },
      b: { reps: 3, nextReview: NOW + 2 },
      c: { reps: 3, nextReview: NOW + 3 },
    };
    expect(selectStudyCards(cards, srs, { count: 5, now: NOW, random: FIXED })).toEqual([]);
  });

  it('handles count 0, negative, invalid and larger than the pool', () => {
    const cards = deck('a', 'b', 'c');
    expect(selectStudyCards(cards, {}, { count: 0, now: NOW })).toEqual([]);
    expect(selectStudyCards(cards, {}, { count: -5, now: NOW })).toEqual([]);
    expect(selectStudyCards(cards, {}, { count: NaN, now: NOW })).toHaveLength(3);
    expect(selectStudyCards(cards, {}, { count: 100, now: NOW })).toHaveLength(3);
    expect(selectStudyCards(cards, {}, { count: 2, now: NOW })).toHaveLength(2);
  });

  it('survives corrupt srs entries and malformed inputs', () => {
    const cards = deck('a', 'b');
    const srs = { a: null, b: 'nope' };
    expect(selectStudyCards(cards, srs, { count: 5, now: NOW, random: FIXED })).toHaveLength(2);
    expect(selectStudyCards([], {}, { count: 4, now: NOW })).toEqual([]);
    expect(selectStudyCards()).toEqual([]);
    expect(selectStudyCards(null, undefined, null)).toEqual([]);
    expect(selectStudyCards(cards, [], { count: 2, now: NOW })).toHaveLength(2);
  });

  it('is deterministic with a fixed random', () => {
    const cards = deck('a', 'b', 'c', 'd');
    const srs = { d: { reps: 3, nextReview: NOW - 1 } };
    const first = selectStudyCards(cards, srs, { count: 3, now: NOW, random: FIXED });
    const second = selectStudyCards(cards, srs, { count: 3, now: NOW, random: FIXED });
    expect(second.map((card) => card.id)).toEqual(first.map((card) => card.id));
  });

  it('does not mutate the input deck or srs', () => {
    const cards = deck('a', 'b');
    const srs = { a: { reps: 3, nextReview: NOW - 1 } };
    const snapshotCards = JSON.parse(JSON.stringify(cards));
    const snapshotSrs = JSON.parse(JSON.stringify(srs));
    selectStudyCards(cards, srs, { count: 2, now: NOW, random: FIXED });
    expect(cards).toEqual(snapshotCards);
    expect(srs).toEqual(snapshotSrs);
  });
});
