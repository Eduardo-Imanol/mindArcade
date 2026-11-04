import { buildDecks } from '../core/repetition/decks.js';
import { bestFor } from '../core/storage/arcade.js';

export const MASTERY_ORDER = ['no-aprendida', 'repasar', 'aprendida'];

export function buildTopicDecks(topic, srsTopic = {}, now = Date.now()) {
  return buildDecks(topic?.cards || [], srsTopic, { now });
}

export function summarizeDecks(decks = []) {
  const list = (Array.isArray(decks) ? decks : []).filter(Boolean);
  const summary = { total: list.length, 'no-aprendida': 0, repasar: 0, aprendida: 0, vacia: 0 };
  for (const deck of list) {
    const status = summary[deck.mastery] === undefined ? 'vacia' : deck.mastery;
    summary[status] += 1;
  }
  return summary;
}

export function bestRecordsByGame(records, topicId, games = [], decks = []) {
  const deckList = (Array.isArray(decks) ? decks : []).filter(Boolean);
  return (Array.isArray(games) ? games : [])
    .filter((game) => game && game.id)
    .map((game) => {
      let best = 0;
      let deck = null;
      for (const entry of deckList) {
        const score = bestFor(records, topicId, game.id, entry.id);
        if (score > best) {
          best = score;
          deck = entry;
        }
      }
      return { game, best, deck };
    });
}
