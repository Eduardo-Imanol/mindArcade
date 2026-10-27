// src/core/repetition/decks.js — shared 10-card decks + SRS-derived mastery (pure, spec-18)
import { getCardLearningState } from './learning.js';

export const DECK_SIZE = 10;

export const DECK_MASTERY = {
  new: 'no-aprendida',
  review: 'repasar',
  learned: 'aprendida',
  empty: 'vacia',
};

export const DECK_MASTERY_LABELS = {
  'no-aprendida': 'No aprendida',
  repasar: 'Repasar',
  aprendida: 'Aprendida',
  vacia: 'Vacía',
};

function asCards(value) {
  return Array.isArray(value) ? value : [];
}

function asSrsTopic(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSize(value) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? Math.floor(size) : DECK_SIZE;
}

function normalizeNow(value) {
  const now = Number(value);
  return Number.isFinite(now) ? now : Date.now();
}

function isSrsNumber(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function stateFor(srs, cardId) {
  if (cardId === undefined || cardId === null) return null;
  if (!Object.prototype.hasOwnProperty.call(srs, cardId)) return null;
  return srs[cardId];
}

function hasValidNextReview(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function isDue(state, now) {
  return hasValidNextReview(state?.nextReview) && Number(state.nextReview) <= now;
}

function isStudied(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  return isSrsNumber(state.reps) || hasValidNextReview(state.nextReview);
}

function looksLikeOptions(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.prototype.hasOwnProperty.call(value, 'size') ||
      Object.prototype.hasOwnProperty.call(value, 'now'))
  );
}

export function deckMastery(deck, srsTopic = {}, now = Date.now()) {
  const cards = asCards(deck?.cards);
  const srs = asSrsTopic(srsTopic);
  const current = normalizeNow(now);
  const counts = {
    new: 0,
    learning: 0,
    learned: 0,
    due: 0,
    studied: 0,
    pending: 0,
    total: cards.length,
  };

  for (const card of cards) {
    const id = card ? card.id : undefined;
    const state = stateFor(srs, id);
    const learningState = getCardLearningState(state);
    if (learningState === 'new') counts.new += 1;
    else if (learningState === 'learning') counts.learning += 1;
    else counts.learned += 1;
    if (isDue(state, current)) counts.due += 1;
    if (isStudied(state)) counts.studied += 1;
  }
  counts.pending = counts.total - counts.studied;

  let status;
  if (counts.total === 0) status = DECK_MASTERY.empty;
  else if (counts.new > 0) status = DECK_MASTERY.new;
  else if (counts.learned === counts.total && counts.due === 0) status = DECK_MASTERY.learned;
  else status = DECK_MASTERY.review;

  return { status, counts };
}

export function buildDecks(cards = [], srsTopic = {}, options = {}) {
  const list = asCards(cards);
  let srs = srsTopic;
  let opts = options;

  if (arguments.length === 2 && looksLikeOptions(srsTopic)) {
    srs = {};
    opts = srsTopic;
  }

  const deckSize = normalizeSize(opts?.size);
  const now = normalizeNow(opts?.now);
  const source = asSrsTopic(srs);
  const decks = [];

  for (let start = 0; start < list.length; start += deckSize) {
    const chunk = list.slice(start, start + deckSize);
    const studiedIds = [];
    for (const card of chunk) {
      const id = card ? card.id : undefined;
      if (id !== undefined && id !== null && isStudied(stateFor(source, id))) {
        studiedIds.push(id);
      }
    }
    const from = start + 1;
    const to = start + chunk.length;
    const number = decks.length + 1;
    const total = chunk.length;
    const studied = studiedIds.length;
    const pending = total - studied;
    const mastery = deckMastery({ cards: chunk }, source, now);

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
      mastery: mastery.status,
      counts: mastery.counts,
    });
  }

  return decks;
}

export const buildFlashcardDecks = buildDecks;
