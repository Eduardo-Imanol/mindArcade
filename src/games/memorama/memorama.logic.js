// src/games/memorama/memorama.logic.js — pure memorama reducer (no core imports)
export const DIFFICULTIES = [
  { id: 'facil', label: 'Fácil', pairs: 4 },
  { id: 'medio', label: 'Medio', pairs: 6 },
  { id: 'dificil', label: 'Difícil', pairs: 8 },
];

const PAIR_STEPS = [4, 6, 8, 10];

export function pairOptionsFor(deckSize) {
  const size = Math.max(0, Math.floor(Number(deckSize) || 0));
  if (size < PAIR_STEPS[0]) return [];
  const max = Math.min(size, PAIR_STEPS[PAIR_STEPS.length - 1]);
  const steps = [...PAIR_STEPS.filter((pairs) => pairs < max), max];
  return steps.map((pairs) => ({
    id: `pairs-${pairs}`,
    label: `${pairs} parejas`,
    pairs,
  }));
}

export function sessionCardsFor(cards, { mode = 'normal', pairs = 10 } = {}) {
  const list = Array.isArray(cards) ? cards.filter(Boolean) : [];
  if (mode === 'arcade') return [...list];
  const count = Math.max(1, Math.floor(Number(pairs) || 1));
  return list.slice(0, Math.min(count, list.length));
}

function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

export function buildTiles(cards = [], random = Math.random) {
  const tiles = [];
  for (const card of cards) {
    tiles.push({ key: `${card.id}:front`, cardId: card.id, face: 'front', text: card.front });
    tiles.push({ key: `${card.id}:back`, cardId: card.id, face: 'back', text: card.back });
  }
  return shuffle(tiles, random);
}

export function createState(cards = [], { random = Math.random } = {}) {
  const pairs = cards.length;
  return {
    tiles: buildTiles(cards, random),
    open: [],
    matched: [],
    seen: [],
    attempts: {},
    locked: false,
    complete: pairs === 0,
    pairs,
    lastMatch: null,
  };
}

export function gradeFor(attempts = 0) {
  const fails = Number(attempts) || 0;
  return fails <= 1 ? 'facil' : 'dificil';
}

export function unmatchedCardIds(state) {
  const matched = new Set((state && state.matched) || []);
  const ids = [];
  for (const tile of (state && state.tiles) || []) {
    if (!matched.has(tile.cardId) && !ids.includes(tile.cardId)) ids.push(tile.cardId);
  }
  return ids;
}

export function seenUnmatchedCardIds(state) {
  const matched = new Set((state && state.matched) || []);
  const seen = new Set((state && state.seen) || []);
  const ids = [];
  for (const tile of (state && state.tiles) || []) {
    if (seen.has(tile.cardId) && !matched.has(tile.cardId) && !ids.includes(tile.cardId)) {
      ids.push(tile.cardId);
    }
  }
  return ids;
}

export function pendingGrades(state) {
  return seenUnmatchedCardIds(state).map((cardId) => ({ cardId, grade: 'otra-vez' }));
}

export function reduce(state, action = {}) {
  if (!state) return state;
  if (state.complete) return state;

  if (action.type === 'close') {
    return state.locked ? { ...state, open: [], locked: false, lastMatch: null } : state;
  }

  if (action.type !== 'flip' || state.locked) return state;

  const { index } = action;
  if (!Number.isInteger(index) || index < 0 || index >= state.tiles.length) return state;
  if (state.open.includes(index)) return state;

  const tile = state.tiles[index];
  if (state.matched.includes(tile.cardId)) return state;
  if (state.open.length >= 2) return state;

  const seen = state.seen.includes(tile.cardId) ? state.seen : [...state.seen, tile.cardId];
  const open = [...state.open, index];
  if (open.length < 2) return { ...state, open, seen };

  const first = state.tiles[open[0]];
  if (first.cardId === tile.cardId) {
    const matched = [...state.matched, first.cardId];
    return {
      ...state,
      open: [],
      matched,
      seen,
      complete: matched.length === state.pairs,
      lastMatch: {
        seq: ((state.lastMatch && state.lastMatch.seq) || 0) + 1,
        cardId: first.cardId,
        grade: gradeFor(state.attempts[first.cardId]),
      },
    };
  }

  const attempts = {
    ...state.attempts,
    [first.cardId]: (state.attempts[first.cardId] || 0) + 1,
    [tile.cardId]: (state.attempts[tile.cardId] || 0) + 1,
  };
  return { ...state, open, seen, attempts, locked: true };
}
