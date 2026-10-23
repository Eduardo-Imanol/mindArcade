// src/core/repetition/flashcardDecks.js — fixed flashcard decks derived from SRS (pure, spec-16)
export const FLASHCARD_DECK_SIZE = 10;

function asCards(value) {
  return Array.isArray(value) ? value : [];
}

function asSrsTopic(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSize(value) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? Math.floor(size) : FLASHCARD_DECK_SIZE;
}

function isSrsNumber(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function isStudied(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  return isSrsNumber(state.reps) || isSrsNumber(state.nextReview);
}

export function buildFlashcardDecks(cards = [], srsTopic = {}, { size } = {}) {
  const list = asCards(cards);
  const srs = asSrsTopic(srsTopic);
  const deckSize = normalizeSize(size);
  const decks = [];

  for (let start = 0; start < list.length; start += deckSize) {
    const chunk = list.slice(start, start + deckSize);
    const studiedIds = [];
    for (const card of chunk) {
      const id = card ? card.id : undefined;
      if (id !== undefined && id !== null && isStudied(srs[id])) studiedIds.push(id);
    }
    const from = start + 1;
    const to = start + chunk.length;
    const number = decks.length + 1;
    const total = chunk.length;
    const studied = studiedIds.length;
    const pending = total - studied;

    decks.push({
      id: `deck-${number}`,
      number,
      label: `${from}–${to}`,
      from,
      to,
      cards: chunk,
      total,
      studied,
      studiedIds,
      pending,
      complete: pending === 0,
    });
  }

  return decks;
}
