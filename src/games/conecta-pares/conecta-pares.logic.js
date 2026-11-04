export const MIN_PAIRS = 3;
export const MAX_PAIRS = 10;
export const DEFAULT_PAIRS = 8;
export const DECK_BATCH_SIZE = 8;
export const PHASES = ['setup', 'playing', 'batch-complete', 'complete'];
export const SIDES = ['question', 'meaning'];

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

function hasText(value) {
  return String(value ?? '').trim() !== '';
}

export function normalizeText(text = '') {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();
}

function clampCount(count, min, max) {
  if (count === null || count === undefined) return DEFAULT_PAIRS;
  if (String(count).trim() === '') return DEFAULT_PAIRS;
  const value = Number(count);
  if (!Number.isFinite(value)) return DEFAULT_PAIRS;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function clampPairs(count) {
  return clampCount(count, MIN_PAIRS, MAX_PAIRS);
}

function validCard(card) {
  return (
    !!card &&
    card.id != null &&
    hasText(card.id) &&
    hasText(card.front) &&
    hasText(card.back)
  );
}

function uniqueCards(cards) {
  const seenIds = new Set();
  const seenFront = new Set();
  const seenBack = new Set();
  const out = [];
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!validCard(card)) continue;
    const id = String(card.id).trim();
    const front = normalizeText(card.front);
    const back = normalizeText(card.back);
    if (seenIds.has(id) || seenFront.has(front) || seenBack.has(back)) continue;
    seenIds.add(id);
    seenFront.add(front);
    seenBack.add(back);
    out.push(card);
  }
  return out;
}

export function buildSession({
  cards = [],
  count = DEFAULT_PAIRS,
  random = Math.random,
  minPairs = MIN_PAIRS,
} = {}) {
  const minimum = Math.max(1, Math.trunc(Number(minPairs)) || MIN_PAIRS);
  const unique = uniqueCards(cards);
  if (unique.length < minimum) return { cards: [], left: [], right: [], total: 0 };

  const requested = clampCount(count, minimum, MAX_PAIRS);
  const selected = unique.slice(0, Math.min(requested, unique.length));
  return {
    cards: selected,
    left: shuffle(selected, random),
    right: shuffle(selected, random),
    total: selected.length,
  };
}

export function buildDeckBatches(cards = [], { size = DECK_BATCH_SIZE } = {}) {
  const unique = uniqueCards(cards);
  const batchSize = Math.min(
    MAX_PAIRS,
    Math.max(1, Math.trunc(Number(size)) || DECK_BATCH_SIZE)
  );
  const batches = [];
  for (let start = 0; start < unique.length; start += batchSize) {
    batches.push(unique.slice(start, start + batchSize));
  }
  return batches;
}

export function createState() {
  return {
    phase: 'setup',
    requested: DEFAULT_PAIRS,
    total: 0,
    cards: [],
    left: [],
    right: [],
    selection: null,
    matched: [],
    attemptsByCard: {},
    errors: 0,
    feedback: null,
    results: [],
    lastGrade: null,
    lastMiss: null,
    missSeq: 0,
    batches: [],
    batchIndex: 0,
    batchCount: 0,
    deckTotal: 0,
  };
}

export function gradeFor(attempts = 0) {
  return Number(attempts) > 0 ? 'dificil' : 'facil';
}

function columnFor(state, side) {
  return side === 'question' ? state.left : state.right;
}

function isMatched(state, cardId) {
  return state.matched.some((entry) => entry.cardId === cardId);
}

function clearForNext(state) {
  return { ...state, selection: null, feedback: null };
}

function resolveMatch(state, questionCardId) {
  const attempts = state.attemptsByCard[questionCardId] || 0;
  const grade = gradeFor(attempts);
  const order = state.matched.length + 1;
  const matched = [...state.matched, { cardId: questionCardId, order }];
  const complete = matched.length >= state.total;
  const moreBatches = complete && state.batchIndex + 1 < state.batchCount;
  const phase = complete ? (moreBatches ? 'batch-complete' : 'complete') : 'playing';
  return {
    ...state,
    phase,
    selection: null,
    feedback: { type: 'correct', cardId: questionCardId },
    matched,
    results: [...state.results, { seq: order, cardId: questionCardId, grade }],
    lastGrade: { seq: order, cardId: questionCardId, grade },
  };
}

function resolveMiss(state, questionCardId, meaningCardId) {
  const missSeq = (state.missSeq || 0) + 1;
  return {
    ...state,
    selection: null,
    feedback: { type: 'wrong', questionCardId, meaningCardId },
    errors: state.errors + 1,
    attemptsByCard: {
      ...state.attemptsByCard,
      [questionCardId]: (state.attemptsByCard[questionCardId] || 0) + 1,
    },
    lastMiss: { seq: missSeq, cardId: questionCardId, grade: 'otra-vez' },
    missSeq,
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const hasBatches = Array.isArray(action.batches) && action.batches.length > 0;
    const batches = hasBatches
      ? action.batches.filter((batch) => Array.isArray(batch) && batch.length > 0)
      : [];
    const firstCards = hasBatches ? batches[0] || [] : action.cards;
    const minPairs = hasBatches ? 1 : MIN_PAIRS;
    const requested = hasBatches ? firstCards.length : clampPairs(action.count);
    const session = buildSession({
      cards: firstCards,
      count: requested,
      random: action.random || Math.random,
      minPairs,
    });
    const deckTotal = hasBatches
      ? batches.reduce((sum, batch) => sum + batch.length, 0)
      : session.total;
    const base = {
      ...createState(),
      requested,
      total: session.total,
      cards: session.cards,
      left: session.left,
      right: session.right,
      batches,
      batchCount: hasBatches ? batches.length : 0,
      batchIndex: 0,
      deckTotal,
    };
    if (session.total < minPairs) return base;
    return { ...base, phase: 'playing' };
  }

  if (action.type === 'nextBatch') {
    if (state.phase !== 'batch-complete') return state;
    const nextIndex = state.batchIndex + 1;
    const cards = state.batches[nextIndex];
    if (!Array.isArray(cards) || cards.length === 0) {
      return { ...state, phase: 'complete' };
    }
    const session = buildSession({
      cards,
      count: cards.length,
      random: action.random || Math.random,
      minPairs: 1,
    });
    if (session.total === 0) return { ...state, phase: 'complete' };
    return {
      ...state,
      phase: 'playing',
      batchIndex: nextIndex,
      total: session.total,
      cards: session.cards,
      left: session.left,
      right: session.right,
      selection: null,
      matched: [],
      attemptsByCard: {},
      feedback: null,
      lastGrade: null,
      lastMiss: null,
    };
  }

  if (action.type === 'reset') return createState();

  if (action.type === 'clear') {
    if (state.phase !== 'playing') return state;
    return clearForNext(state);
  }

  if (action.type !== 'select') return state;
  if (state.phase !== 'playing') return state;

  const { side, cardId } = action;
  if (!SIDES.includes(side) || cardId == null) return state;
  const column = columnFor(state, side);
  if (!column.some((card) => card.id === cardId)) return state;
  if (isMatched(state, cardId)) return state;

  if (!state.selection) {
    return { ...state, selection: { side, cardId }, feedback: null };
  }

  const selection = state.selection;
  if (selection.side === side) {
    if (selection.cardId === cardId) return clearForNext(state);
    return { ...state, selection: { side, cardId }, feedback: null };
  }

  const questionCardId = side === 'question' ? cardId : selection.cardId;
  const meaningCardId = side === 'meaning' ? cardId : selection.cardId;
  if (questionCardId === meaningCardId) return resolveMatch(state, questionCardId);
  return resolveMiss(state, questionCardId, meaningCardId);
}

export function pendingGrades(state) {
  if (!state || state.phase !== 'playing') return [];
  const matchedIds = new Set(state.matched.map((entry) => entry.cardId));
  return state.cards
    .filter((card) => !matchedIds.has(card.id))
    .map((card) => ({ cardId: card.id, grade: 'otra-vez' }));
}

export function summarize(state) {
  const total = Number(state?.deckTotal ?? state?.total) || 0;
  const results = (state && state.results) || [];
  const matched = results.length;
  const errors = (state && state.errors) || 0;
  const firstTry = results.filter((result) => result.grade === 'facil').length;
  const xp = firstTry * 10 + (matched - firstTry) * 25;
  return { total, matched, errors, firstTry, xp };
}
