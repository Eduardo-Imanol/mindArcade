import { describe, expect, it } from 'vitest';
import {
  AVAILABILITY_REASONS,
  availabilityMessage,
  getDeckAvailability,
  getDeckSetAvailability,
  getGameAvailability,
} from './availability.js';

const topic = (id, size) => ({
  id,
  title: id,
  cards: Array.from({ length: size }, (_, index) => ({ id: `${id}-${index}`, back: `${id} ${index}` })),
});

const INTRUSO = {
  id: 'intruso',
  status: 'available',
  minCards: 3,
  minTopics: 2,
  minCardsPerTopic: 3,
};

describe('game availability gate', () => {
  it('soon games are never playable', () => {
    const result = getGameAvailability({ status: 'soon', minCards: 4 }, { topic: topic('a', 10) });
    expect(result).toEqual({ playable: false, reason: AVAILABILITY_REASONS.soon });
    expect(availabilityMessage(result)).toBe('Próximamente');
  });

  it('requires the anchor topic to reach minCards', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 4 },
      { topic: topic('a', 3) }
    );
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards: 4,
      cardCount: 3,
    });
    expect(availabilityMessage(result)).toBe('Necesitas al menos 4 cartas');
  });

  it('ignores minTopics for single-topic games', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 1 },
      { topic: topic('a', 1), topics: [topic('a', 1)] }
    );
    expect(result.playable).toBe(true);
    expect(result.reason).toBe(AVAILABILITY_REASONS.ok);
    expect(availabilityMessage(result)).toBe('');
  });

  it('keeps intruso in maintenance with only one eligible topic', () => {
    const result = getGameAvailability(INTRUSO, {
      topic: topic('funciones', 3),
      topics: [topic('funciones', 3)],
    });
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minTopics,
      minTopics: 2,
      minCardsPerTopic: 3,
      eligible: 1,
    });
    expect(availabilityMessage(result)).toBe(
      'En mantenimiento · agrega otro tema con al menos 3 cartas'
    );
  });

  it('keeps intruso locked when the second topic has fewer than 3 cards', () => {
    const result = getGameAvailability(INTRUSO, {
      topic: topic('funciones', 3),
      topics: [topic('funciones', 3), topic('algoritmos', 2)],
    });
    expect(result.playable).toBe(false);
    expect(result.reason).toBe(AVAILABILITY_REASONS.minTopics);
    expect(result.eligible).toBe(1);
  });

  it('unlocks intruso with two topics of at least 3 cards', () => {
    const result = getGameAvailability(INTRUSO, {
      topic: topic('funciones', 3),
      topics: [topic('funciones', 3), topic('algoritmos', 3)],
    });
    expect(result).toEqual({
      playable: true,
      reason: AVAILABILITY_REASONS.ok,
      minCards: 3,
      cardCount: 3,
      minTopics: 2,
    });
  });

  it('uses minCards as fallback for minCardsPerTopic', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 4, minTopics: 2 },
      { topic: topic('a', 4), topics: [topic('a', 4), topic('b', 3)] }
    );
    expect(result.playable).toBe(false);
    expect(result.minCardsPerTopic).toBe(4);
  });

  it('handles missing topic/catalog safely', () => {
    const result = getGameAvailability(INTRUSO, {});
    expect(result.playable).toBe(false);
    expect(result.reason).toBe(AVAILABILITY_REASONS.minCards);
    expect(getGameAvailability(null).reason).toBe(AVAILABILITY_REASONS.soon);
  });

  it('switches to eligible counts when studyCardCounts is provided', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 4 },
      {
        topic: topic('a', 10),
        topics: [topic('a', 10)],
        studyCardCounts: { a: 2 },
      }
    );
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards: 4,
      cardCount: 10,
      eligible: 2,
      eligibleBased: true,
    });
    expect(availabilityMessage(result)).toBe('Te quedan 2 cartas por aprender o repasar');
  });

  it('reports «Todo al día» when no card is study-eligible', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 1 },
      {
        topic: topic('a', 8),
        topics: [topic('a', 8)],
        studyCardCounts: { a: 0 },
      }
    );
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.allCaughtUp,
      eligible: 0,
    });
    expect(availabilityMessage(result)).toBe('Todo al día');
  });

  it('falls back to total cards when the counts map omits a topic', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 4 },
      { topic: topic('a', 5), topics: [topic('a', 5)], studyCardCounts: { other: 0 } }
    );
    expect(result.playable).toBe(true);
  });

  it('counts only topics with enough eligible cards as intruso distractors', () => {
    const result = getGameAvailability(INTRUSO, {
      topic: topic('funciones', 6),
      topics: [topic('funciones', 6), topic('algoritmos', 4), topic('idiomas', 5)],
      studyCardCounts: { funciones: 6, algoritmos: 2, idiomas: 1 },
    });
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minTopics,
      eligible: 1,
    });
    expect(availabilityMessage(result)).toBe(
      'En mantenimiento · agrega otro tema con al menos 3 cartas'
    );
  });

  it('unlocks intruso with two topics of at least 3 eligible cards', () => {
    const result = getGameAvailability(INTRUSO, {
      topic: topic('funciones', 6),
      topics: [topic('funciones', 6), topic('idiomas', 5)],
      studyCardCounts: { funciones: 6, idiomas: 3 },
    });
    expect(result).toMatchObject({ playable: true, reason: AVAILABILITY_REASONS.ok });
  });
});

describe('deck availability gate', () => {
  const deck = (id, size) => ({
    id,
    cards: Array.from({ length: size }, (_, index) => ({ id: `${id}-${index}` })),
  });

  it('checks a single deck against the game minimum', () => {
    const game = { status: 'available', minCards: 4 };
    expect(getDeckAvailability(game, deck('deck-1', 3))).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards: 4,
      cardCount: 3,
      deckId: 'deck-1',
      deckBased: true,
    });
    expect(getDeckAvailability(game, deck('deck-2', 4))).toMatchObject({
      playable: true,
      reason: AVAILABILITY_REASONS.ok,
    });
    expect(availabilityMessage(getDeckAvailability(game, deck('deck-1', 3)))).toBe(
      'Necesitas al menos 4 cartas'
    );
  });

  it('keeps the game playable when at least one deck reaches the minimum', () => {
    const game = { status: 'available', minCards: 6 };
    expect(getDeckSetAvailability(game, [deck('deck-1', 10), deck('deck-2', 2)])).toMatchObject({
      playable: true,
      playableDecks: ['deck-1'],
    });
    expect(getDeckSetAvailability(game, [deck('deck-1', 5), deck('deck-2', 2)])).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      playableDecks: [],
    });
    expect(getDeckSetAvailability(game, [])).toMatchObject({
      playable: false,
      cardCount: 0,
    });
  });

  it('does not block play with «Todo al día» when decks are available', () => {
    const game = { status: 'available', minCards: 4 };
    const result = getGameAvailability(game, {
      topic: topic('a', 8),
      topics: [topic('a', 8)],
      studyCardCounts: { a: 0 },
      decks: [deck('deck-1', 8)],
    });
    expect(result).toMatchObject({
      playable: true,
      reason: AVAILABILITY_REASONS.ok,
      deckBased: true,
    });
  });

  it('still gates deck mode by the anchor minimum', () => {
    const game = { status: 'available', minCards: 6 };
    const result = getGameAvailability(game, {
      topic: topic('a', 5),
      topics: [topic('a', 5)],
      decks: [deck('deck-1', 5)],
    });
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      deckBased: true,
    });
    expect(availabilityMessage(result)).toBe('Necesitas al menos 6 cartas');
  });

  it('keeps the intruder topic gate based on all cards in deck mode', () => {
    const result = getGameAvailability(INTRUSO, {
      topic: topic('funciones', 6),
      topics: [topic('funciones', 6), topic('algoritmos', 2)],
      studyCardCounts: { funciones: 0, algoritmos: 0 },
      decks: [deck('deck-1', 6)],
    });
    expect(result).toMatchObject({
      playable: false,
      reason: AVAILABILITY_REASONS.minTopics,
      eligible: 1,
      deckBased: true,
    });
  });

  it('preserves the legacy eligible-based gate when decks are not provided', () => {
    const result = getGameAvailability(
      { status: 'available', minCards: 1 },
      {
        topic: topic('a', 8),
        topics: [topic('a', 8)],
        studyCardCounts: { a: 0 },
      }
    );
    expect(result.reason).toBe(AVAILABILITY_REASONS.allCaughtUp);
  });
});
