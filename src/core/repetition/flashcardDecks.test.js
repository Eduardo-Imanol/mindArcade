import { describe, expect, it } from 'vitest';
import { FLASHCARD_DECK_SIZE, buildFlashcardDecks } from './flashcardDecks.js';

const cards = (count) =>
  Array.from({ length: count }, (_, index) => ({ id: `c${index + 1}`, front: `F${index + 1}` }));

describe('buildFlashcardDecks', () => {
  it('chunks cards consecutively in content order with the default size', () => {
    const decks = buildFlashcardDecks(cards(25));
    expect(FLASHCARD_DECK_SIZE).toBe(10);
    expect(decks.map((deck) => deck.total)).toEqual([10, 10, 5]);
    expect(decks.map((deck) => deck.number)).toEqual([1, 2, 3]);
    expect(decks.map((deck) => [deck.from, deck.to])).toEqual([
      [1, 10],
      [11, 20],
      [21, 25],
    ]);
    expect(decks[0].cards.map((card) => card.id)).toEqual(cards(10).map((card) => card.id));
    expect(decks[2].cards.map((card) => card.id)).toEqual(['c21', 'c22', 'c23', 'c24', 'c25']);
  });

  it('accepts an injectable size and keeps a partial last deck', () => {
    const decks = buildFlashcardDecks(cards(7), {}, { size: 3 });
    expect(decks.map((deck) => deck.total)).toEqual([3, 3, 1]);
    expect(decks.map((deck) => deck.label)).toEqual(['1–3', '4–6', '7–7']);
  });

  it('derives studied and pending from valid SRS entries, including otra-vez', () => {
    const topicCards = cards(3);
    const decks = buildFlashcardDecks(topicCards, {
      c1: { reps: 1, nextReview: 10 },
      c2: { reps: 0, nextReview: 20 },
      c3: { nextReview: 30 },
    });
    expect(decks[0]).toMatchObject({
      total: 3,
      studied: 3,
      studiedIds: ['c1', 'c2', 'c3'],
      pending: 0,
      complete: true,
    });
  });

  it('ignores missing, invalid and non-object SRS entries', () => {
    const decks = buildFlashcardDecks(cards(4), {
      c1: { reps: 2 },
      c2: null,
      c3: { reps: 'x' },
      c4: {},
    });
    expect(buildFlashcardDecks(cards(1), { c1: { reps: null, nextReview: null } })[0].studied).toBe(
      0
    );
    expect(decks[0]).toMatchObject({
      total: 4,
      studied: 1,
      studiedIds: ['c1'],
      pending: 3,
      complete: false,
    });
  });

  it('returns no decks for empty or invalid input and never mutates inputs', () => {
    expect(buildFlashcardDecks()).toEqual([]);
    expect(buildFlashcardDecks(null, null)).toEqual([]);

    const topicCards = Object.freeze(cards(4));
    const srs = Object.freeze({ c1: Object.freeze({ reps: 1 }) });
    const before = JSON.stringify({ topicCards, srs });
    const decks = buildFlashcardDecks(topicCards, srs, { size: 2 });
    expect(JSON.stringify({ topicCards, srs })).toBe(before);
    expect(decks[1].studied).toBe(0);
  });

  it('falls back to the default size when the injected size is invalid', () => {
    expect(buildFlashcardDecks(cards(12), {}, { size: 0 })[0].total).toBe(10);
    expect(buildFlashcardDecks(cards(12), {}, { size: -2 })[0].total).toBe(10);
    expect(buildFlashcardDecks(cards(12), {}, { size: 'x' })[0].total).toBe(10);
  });
});
