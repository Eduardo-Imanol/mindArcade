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

function deckCardCount(deck) {
  return Array.isArray(deck?.cards) ? deck.cards.length : 0;
}

// A single deck is playable when it reaches the game's minimum card count.
export function getDeckAvailability(game, deck) {
  if (!game || game.status !== 'available') {
    return { playable: false, reason: AVAILABILITY_REASONS.soon };
  }
  const minCards = positiveInt(game.minCards) || 1;
  const cardCount = deckCardCount(deck);
  if (cardCount < minCards) {
    return {
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards,
      cardCount,
      deckId: deck?.id,
      deckBased: true,
    };
  }
  return {
    playable: true,
    reason: AVAILABILITY_REASONS.ok,
    minCards,
    cardCount,
    deckId: deck?.id,
    deckBased: true,
  };
}

export function getDeckSetAvailability(game, decks = []) {
  if (!game || game.status !== 'available') {
    return { playable: false, reason: AVAILABILITY_REASONS.soon };
  }
  const minCards = positiveInt(game.minCards) || 1;
  const list = (Array.isArray(decks) ? decks : []).filter(Boolean);
  if (list.length === 0) {
    return {
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards,
      cardCount: 0,
      deckBased: true,
      playableDecks: [],
    };
  }
  const results = list.map((deck) => getDeckAvailability(game, deck));
  const playableDecks = results.filter((entry) => entry.playable).map((entry) => entry.deckId);
  const cardCount = Math.max(...results.map((entry) => entry.cardCount));
  if (playableDecks.length === 0) {
    return {
      playable: false,
      reason: AVAILABILITY_REASONS.minCards,
      minCards,
      cardCount,
      deckBased: true,
      playableDecks,
    };
  }
  return {
    playable: true,
    reason: AVAILABILITY_REASONS.ok,
    minCards,
    cardCount,
    deckBased: true,
    playableDecks,
  };
}

export function getGameAvailability(game, { topic, topics = [], studyCardCounts, decks } = {}) {
  if (!game || game.status !== 'available') {
    return { playable: false, reason: AVAILABILITY_REASONS.soon };
  }

  // Deck mode: every deck carries all topic cards, so SRS eligibility and the
  // «Todo al día» gate never block the deck. Only the per-deck minimum applies.
  if (Array.isArray(decks)) {
    const minCards = positiveInt(game.minCards) || 1;
    const deckState = getDeckSetAvailability(game, decks);
    const minTopics = positiveInt(game.minTopics);
    if (minTopics > 0) {
      const minCardsPerTopic = positiveInt(game.minCardsPerTopic) || minCards;
      const deckTopics = (Array.isArray(topics) ? topics : []).filter((entry) => {
        if (!entry) return false;
        if (entry.id === topic?.id) return deckState.cardCount >= minCardsPerTopic;
        return cardCountOf(entry) >= minCardsPerTopic;
      }).length;
      if (deckTopics < minTopics) {
        return {
          playable: false,
          reason: AVAILABILITY_REASONS.minTopics,
          minCards,
          cardCount: cardCountOf(topic),
          minTopics,
          minCardsPerTopic,
          eligible: deckTopics,
          deckBased: true,
          playableDecks: deckState.playableDecks || [],
        };
      }
    }
    if (!deckState.playable) {
      return { ...deckState, minTopics };
    }
    return { ...deckState, minTopics };
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
