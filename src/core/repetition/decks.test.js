import { describe, expect, it } from 'vitest';
import {
  DECK_SIZE,
  buildDecks,
  buildFlashcardDecks,
  deckMastery,
} from './decks.js';

const cards = (count) =>
  Array.from({ length: count }, (_, index) => ({ id: `c${index + 1}`, front: `F${index + 1}` }));

const NOW = 1_700_000_000_000;

describe('buildDecks', () => {
  it('chunks cards consecutively and keeps a partial last deck', () => {
    const decks = buildDecks(cards(25), {}, { now: NOW });
    expect(DECK_SIZE).toBe(10);
    expect(decks.map((deck) => deck.total)).toEqual([10, 10, 5]);
    expect(decks.map((deck) => deck.id)).toEqual(['deck-1', 'deck-2', 'deck-3']);
    expect(decks.map((deck) => [deck.from, deck.to])).toEqual([
      [1, 10],
      [11, 20],
      [21, 25],
    ]);
    expect(decks[2].cards.map((card) => card.id)).toEqual(['c21', 'c22', 'c23', 'c24', 'c25']);
  });

  it('accepts options as the second argument and a custom size', () => {
    const decks = buildDecks(cards(7), { size: 3, now: NOW });
    expect(decks.map((deck) => deck.total)).toEqual([3, 3, 1]);
    expect(decks.map((deck) => deck.label)).toEqual(['1–3', '4–6', '7–7']);
  });

  it('keeps studied, pending and complete derived from valid SRS entries', () => {
    const decks = buildDecks(
      cards(3),
      {
        c1: { reps: 1, nextReview: NOW + 1000 },
        c2: { reps: 0, nextReview: NOW + 2000 },
        c3: { nextReview: NOW + 3000 },
      },
      { now: NOW }
    );
    expect(decks[0]).toMatchObject({
      total: 3,
      studied: 3,
      studiedIds: ['c1', 'c2', 'c3'],
      pending: 0,
      complete: true,
    });
  });

  it('ignores invalid SRS entries', () => {
    const decks = buildDecks(
      cards(4),
      {
        c1: { reps: 2 },
        c2: null,
        c3: { reps: 'x' },
        c4: {},
      },
      { now: NOW }
    );
    expect(decks[0]).toMatchObject({
      total: 4,
      studied: 1,
      studiedIds: ['c1'],
      pending: 3,
      complete: false,
    });
  });

  it('adds mastery and counts for every deck', () => {
    const decks = buildDecks(
      cards(12),
      { c1: { reps: 1, nextReview: NOW + 1000 } },
      { now: NOW }
    );
    expect(decks[0].mastery).toBe('no-aprendida');
    expect(decks[0].counts).toMatchObject({
      new: 9,
      learning: 1,
      learned: 0,
      due: 0,
      studied: 1,
      pending: 9,
      total: 10,
    });
    expect(decks[1].mastery).toBe('no-aprendida');
    expect(decks[1].counts.total).toBe(2);
  });

  it('returns an empty list for empty or invalid input and never mutates inputs', () => {
    expect(buildDecks()).toEqual([]);
    expect(buildDecks(null, null, { now: NOW })).toEqual([]);

    const topicCards = Object.freeze(cards(4));
    const srs = Object.freeze({ c1: Object.freeze({ reps: 1 }) });
    const before = JSON.stringify({ topicCards, srs });
    const decks = buildDecks(topicCards, srs, { size: 2, now: NOW });
    expect(JSON.stringify({ topicCards, srs })).toBe(before);
    expect(decks).toHaveLength(2);
  });

  it('falls back to the default size for invalid sizes', () => {
    expect(buildDecks(cards(12), {}, { size: 0 })[0].total).toBe(DECK_SIZE);
    expect(buildDecks(cards(12), {}, { size: -2 })[0].total).toBe(DECK_SIZE);
    expect(buildDecks(cards(12), {}, { size: 'x' })[0].total).toBe(DECK_SIZE);
  });

  it('is deterministic for the same input and keeps the legacy alias', () => {
    const input = cards(15);
    const srs = { c2: { reps: 3, nextReview: NOW + 100 } };
    expect(buildDecks(input, srs, { now: NOW })).toEqual(buildDecks(input, srs, { now: NOW }));
    expect(buildFlashcardDecks(input, srs, { now: NOW })).toEqual(
      buildDecks(input, srs, { now: NOW })
    );
    expect(buildFlashcardDecks).toBe(buildDecks);
  });
});

describe('deckMastery', () => {
  const deck = (list) => ({ cards: list });

  it('returns vacia for an empty deck', () => {
    expect(deckMastery(deck([]), {}, NOW)).toEqual({
      status: 'vacia',
      counts: { new: 0, learning: 0, learned: 0, due: 0, studied: 0, pending: 0, total: 0 },
    });
  });

  it('is no-aprendida when at least one card is new, including a failed rep', () => {
    const result = deckMastery(
      deck(cards(3)),
      {
        c1: { reps: 3, nextReview: NOW + 1000 },
        c2: { reps: 2, nextReview: NOW + 1000 },
        c3: { reps: 0, nextReview: NOW + 1000 },
      },
      NOW
    );
    expect(result.status).toBe('no-aprendida');
    expect(result.counts).toMatchObject({ new: 1, learning: 1, learned: 1, due: 0 });
  });

  it('is aprendida when every card is learned and none is due', () => {
    const learned = Object.fromEntries(
      cards(3).map((card) => [card.id, { reps: 3, nextReview: NOW + 1000 }])
    );
    const result = deckMastery(deck(cards(3)), learned, NOW);
    expect(result.status).toBe('aprendida');
    expect(result.counts).toMatchObject({ new: 0, learning: 0, learned: 3, due: 0 });
  });

  it('is repasar when a learned card is due or some cards are still learning', () => {
    const due = deckMastery(
      deck(cards(2)),
      {
        c1: { reps: 3, nextReview: NOW - 1 },
        c2: { reps: 3, nextReview: NOW + 1000 },
      },
      NOW
    );
    expect(due.status).toBe('repasar');
    expect(due.counts.due).toBe(1);

    const learning = deckMastery(
      deck(cards(2)),
      {
        c1: { reps: 1, nextReview: NOW + 1000 },
        c2: { reps: 3, nextReview: NOW + 1000 },
      },
      NOW
    );
    expect(learning.status).toBe('repasar');
  });

  it('treats invalid reps as new and ignores NaN nextReview as due', () => {
    const result = deckMastery(
      deck(cards(2)),
      { c1: { reps: 'x', nextReview: NaN }, c2: { reps: 3, nextReview: NaN } },
      NOW
    );
    expect(result.status).toBe('no-aprendida');
    expect(result.counts).toMatchObject({ new: 1, learned: 1, due: 0 });
  });
});
