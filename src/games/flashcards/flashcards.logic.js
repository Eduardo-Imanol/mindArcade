// src/games/flashcards/flashcards.logic.js — pure session reducer (no core imports)
export const GRADES = ['otra-vez', 'dificil', 'facil'];

const GAIN = { 'otra-vez': 0, dificil: 25, facil: 10 };

function asDeck(value) {
  return Array.isArray(value) ? value : [];
}

function asGraded(value) {
  if (value instanceof Set) return new Set(value);
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}

function cardIdOf(card, index) {
  const id = card ? card.id : undefined;
  return id === undefined || id === null ? `index:${index}` : id;
}

function hasGrade(gradedIds, id) {
  const key = String(id);
  for (const graded of gradedIds) {
    if (String(graded) === key) return true;
  }
  return false;
}

function nextUngradedIndex(deck, gradedIds, index) {
  for (let offset = 1; offset <= deck.length; offset += 1) {
    const candidate = (index + offset) % deck.length;
    if (!hasGrade(gradedIds, cardIdOf(deck[candidate], candidate))) return candidate;
  }
  return index;
}

function allGraded(deck, gradedIds) {
  return deck.every((card, index) => hasGrade(gradedIds, cardIdOf(card, index)));
}

function activeDeck(state, deck) {
  return Array.isArray(state?.sessionDeck) ? state.sessionDeck : asDeck(deck);
}

export function createState(deck = [], overrides = {}) {
  const list = asDeck(deck);
  const base = {
    index: 0,
    flipped: false,
    correct: 0,
    wrong: 0,
    gained: 0,
    complete: list.length === 0,
    gradedIds: new Set(),
    sessionDeck: list,
  };
  return {
    ...base,
    ...overrides,
    gradedIds: asGraded(overrides.gradedIds ?? base.gradedIds),
    sessionDeck: Array.isArray(overrides.sessionDeck) ? overrides.sessionDeck : base.sessionDeck,
  };
}

export function reduce(state, action = {}, deck = []) {
  const current = state || createState(deck);

  if (action.type === 'start') {
    const nextDeck = asDeck(action.deck ?? action.cards ?? activeDeck(current, deck));
    const next = createState(nextDeck);
    if (action.phase) next.phase = action.phase;
    if (action.mode) next.mode = action.mode;
    return next;
  }

  const active = activeDeck(current, deck);
  const size = active.length;
  if (size === 0) return { ...current, complete: true };

  switch (action.type) {
    case 'reveal':
      return current.complete ? current : { ...current, flipped: true };
    case 'flip':
      return current.complete ? current : { ...current, flipped: !current.flipped };
    case 'next':
      return {
        ...current,
        index: Math.min(size - 1, current.index + 1),
        flipped: false,
      };
    case 'prev':
      return { ...current, index: Math.max(0, current.index - 1), flipped: false };
    case 'complete':
      return { ...current, complete: true, flipped: false };
    case 'reset':
      return createState(active);
    case 'grade': {
      const grade = GRADES.includes(action.grade) ? action.grade : 'otra-vez';
      const card = active[current.index];
      const cardId = action.cardId ?? cardIdOf(card, current.index);
      if (hasGrade(current.gradedIds, cardId)) return current;

      const passed = grade !== 'otra-vez';
      const fallbackGain = GAIN[grade] || 0;
      const gained = Number.isFinite(action.gained) ? action.gained : fallbackGain;
      const gradedIds = new Set(current.gradedIds);
      gradedIds.add(cardId);
      const complete = allGraded(active, gradedIds);

      return {
        ...current,
        flipped: false,
        correct: current.correct + (passed ? 1 : 0),
        wrong: current.wrong + (passed ? 0 : 1),
        gained: current.gained + gained,
        index: complete ? current.index : nextUngradedIndex(active, gradedIds, current.index),
        gradedIds,
        complete,
      };
    }
    default:
      return current;
  }
}
