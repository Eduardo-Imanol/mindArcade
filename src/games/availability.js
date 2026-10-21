// src/games/availability.js — pure content gate shared by TopicView and GameHost
// Optional studyCardCounts ({ [topicId]: eligibleCards }) switches the gate from
// total cards to study-eligible cards (spec-12 AC-15/AC-20).
export const AVAILABILITY_REASONS = {
  ok: 'ok',
  soon: 'soon',
  minCards: 'min-cards',
  minTopics: 'min-topics',
  allCaughtUp: 'all-caught-up',
};

function positiveInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function cardCountOf(topic) {
  return Array.isArray(topic?.cards) ? topic.cards.length : 0;
}

export function getGameAvailability(game, { topic, topics = [], studyCardCounts } = {}) {
  if (!game || game.status !== 'available') {
    return { playable: false, reason: AVAILABILITY_REASONS.soon };
  }

  const counts = studyCardCounts && typeof studyCardCounts === 'object' ? studyCardCounts : null;
  const eligibleOf = (entry) => {
    if (!entry) return 0;
    if (counts && Object.prototype.hasOwnProperty.call(counts, entry.id)) {
      return positiveInt(counts[entry.id]);
    }
    return cardCountOf(entry);
  };

  const minCards = positiveInt(game.minCards) || 1;
  const cardCount = cardCountOf(topic);
  const eligible = eligibleOf(topic);

  if (counts && eligible === 0) {
    return {
      playable: false,
      reason: AVAILABILITY_REASONS.allCaughtUp,
      minCards,
      cardCount,
      eligible,
    };
  }

  if (eligible < minCards) {
    return {
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards,
      cardCount,
      eligible,
      eligibleBased: Boolean(counts),
    };
  }

  const minTopics = positiveInt(game.minTopics);
  if (minTopics > 0) {
    const minCardsPerTopic = positiveInt(game.minCardsPerTopic) || minCards;
    const eligibleTopics = (Array.isArray(topics) ? topics : []).filter(
      (entry) => eligibleOf(entry) >= minCardsPerTopic
    ).length;
    if (eligibleTopics < minTopics) {
      return {
        playable: false,
        reason: AVAILABILITY_REASONS.minTopics,
        minCards,
        cardCount,
        minTopics,
        minCardsPerTopic,
        eligible: eligibleTopics,
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
  if (availability.reason === AVAILABILITY_REASONS.allCaughtUp) return 'Todo al día';
  if (availability.reason === AVAILABILITY_REASONS.minCards) {
    if (availability.eligibleBased) {
      return `Te quedan ${availability.eligible} cartas por aprender o repasar`;
    }
    return `Necesitas al menos ${availability.minCards} cartas`;
  }
  if (availability.reason === AVAILABILITY_REASONS.minTopics) {
    return `En mantenimiento · agrega otro tema con al menos ${availability.minCardsPerTopic} cartas`;
  }
  return '';
}
