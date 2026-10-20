import { describe, expect, it } from 'vitest';
import {
  AVAILABILITY_REASONS,
  availabilityMessage,
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
});
