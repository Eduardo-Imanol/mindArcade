import { describe, expect, it } from 'vitest';
import { bestRecordsByGame, buildTopicDecks, summarizeDecks } from './topicDecks.js';

const cards = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `c${index + 1}`,
    front: `front ${index + 1}`,
    back: `back ${index + 1}`,
  }));

const topic = (count) => ({ id: 'tema', title: 'Tema', cards: cards(count) });

describe('topicDecks', () => {
  it('builds 10-card decks from all topic cards and SRS', () => {
    const decks = buildTopicDecks(topic(12), { c1: { reps: 3, nextReview: 500 } }, 1000);
    expect(decks.map((deck) => deck.total)).toEqual([10, 2]);
    expect(decks[0].studied).toBe(1);
    expect(decks[0].mastery).toBe('no-aprendida');
  });

  it('summarizes deck mastery and tolerates invalid statuses', () => {
    const summary = summarizeDecks([
      { mastery: 'aprendida' },
      { mastery: 'repasar' },
      { mastery: 'no-aprendida' },
      { mastery: 'desconocida' },
    ]);
    expect(summary).toEqual({
      total: 4,
      'no-aprendida': 1,
      repasar: 1,
      aprendida: 1,
      vacia: 1,
    });
  });

  it('picks the best record per game and the deck that holds it', () => {
    const decks = [{ id: 'deck-1', number: 1 }, { id: 'deck-2', number: 2 }];
    const games = [{ id: 'flashcards' }, { id: 'quiz-significado' }];
    const records = {
      'tema:flashcards:deck-1': { best: 200 },
      'tema:flashcards:deck-2': { best: 540 },
      'tema:quiz-significado:deck-1': { best: 100 },
    };
    expect(bestRecordsByGame(records, 'tema', games, decks)).toEqual([
      { game: games[0], best: 540, deck: decks[1] },
      { game: games[1], best: 100, deck: decks[0] },
    ]);
  });

  it('returns zero records for games without runs and safe empty inputs', () => {
    expect(bestRecordsByGame({}, 'tema', [{ id: 'flashcards' }], [])).toEqual([
      { game: { id: 'flashcards' }, best: 0, deck: null },
    ]);
    expect(bestRecordsByGame(null, 'tema', null, null)).toEqual([]);
    expect(summarizeDecks(null).total).toBe(0);
    expect(buildTopicDecks(null)).toEqual([]);
  });
});
