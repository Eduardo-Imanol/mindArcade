// src/games/availability.js — pure content gate shared by TopicView and GameHost
export const AVAILABILITY_REASONS = {
  ok: 'ok',
  soon: 'soon',
  minCards: 'min-cards',
  minTopics: 'min-topics',
};

function positiveInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function cardCountOf(topic) {
  return Array.isArray(topic?.cards) ? topic.cards.length : 0;
}

export function getGameAvailability(game, { topic, topics = [] } = {}) {
  if (!game || game.status !== 'available') {
    return { playable: false, reason: AVAILABILITY_REASONS.soon };
  }

  const minCards = positiveInt(game.minCards) || 1;
  const cardCount = cardCountOf(topic);
  if (cardCount < minCards) {
    return {
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards,
      cardCount,
    };
  }

  const minTopics = positiveInt(game.minTopics);
  if (minTopics > 0) {
    const minCardsPerTopic = positiveInt(game.minCardsPerTopic) || minCards;
    const eligible = (Array.isArray(topics) ? topics : []).filter(
      (entry) => cardCountOf(entry) >= minCardsPerTopic
    ).length;
    if (eligible < minTopics) {
      return {
        playable: false,
        reason: AVAILABILITY_REASONS.minTopics,
        minCards,
        cardCount,
        minTopics,
        minCardsPerTopic,
        eligible,
      };
    }
  }

  return {
    playable: true,
    reason: AVAILABILITY_REASONS.ok,
    minCards,
    cardCount,
    minTopics,
  };
}

export function availabilityMessage(availability = {}) {
  if (availability.reason === AVAILABILITY_REASONS.soon) return 'Próximamente';
  if (availability.reason === AVAILABILITY_REASONS.minCards) {
    return `Necesitas al menos ${availability.minCards} cartas`;
  }
  if (availability.reason === AVAILABILITY_REASONS.minTopics) {
    return `En mantenimiento · agrega otro tema con al menos ${availability.minCardsPerTopic} cartas`;
  }
  return '';
}
