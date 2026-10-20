export const MIN_PAIRS = 3;
export const MAX_PAIRS = 10;
export const DEFAULT_PAIRS = 8;
export const PHASES = ['setup', 'playing', 'complete'];
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

export function clampPairs(count) {
  if (count === null || count === undefined) return DEFAULT_PAIRS;
  if (String(count).trim() === '') return DEFAULT_PAIRS;
  const value = Number(count);
  if (!Number.isFinite(value)) return DEFAULT_PAIRS;
  return Math.min(MAX_PAIRS, Math.max(MIN_PAIRS, Math.trunc(value)));
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

export function buildSession({ cards = [], count = DEFAULT_PAIRS, random = Math.random } = {}) {
  const unique = uniqueCards(cards);
  if (unique.length < MIN_PAIRS) return { cards: [], left: [], right: [], total: 0 };

  const requested = clampPairs(count);
  const selected = unique.slice(0, Math.min(requested, unique.length));
  return {
    cards: selected,
    left: shuffle(selected, random),
    right: shuffle(selected, random),
    total: selected.length,
  };
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
  return {
    ...state,
    phase: complete ? 'complete' : 'playing',
    selection: null,
    feedback: { type: 'correct', cardId: questionCardId },
    matched,
    results: [...state.results, { seq: order, cardId: questionCardId, grade }],
    lastGrade: { seq: order, cardId: questionCardId, grade },
  };
}

function resolveMiss(state, questionCardId, meaningCardId) {
  return {
    ...state,
    selection: null,
    feedback: { type: 'wrong', questionCardId, meaningCardId },
    errors: state.errors + 1,
    attemptsByCard: {
      ...state.attemptsByCard,
      [questionCardId]: (state.attemptsByCard[questionCardId] || 0) + 1,
    },
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const requested = clampPairs(action.count);
    const session = buildSession({
      cards: action.cards,
      count: requested,
      random: action.random || Math.random,
    });
    const base = {
      ...createState(),
      requested,
      total: session.total,
      cards: session.cards,
      left: session.left,
      right: session.right,
    };
    if (session.total < MIN_PAIRS) return base;
    return { ...base, phase: 'playing' };
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
  const total = (state && state.total) || 0;
  const matched = (state && state.matched ? state.matched.length : 0) || 0;
  const errors = (state && state.errors) || 0;
  const results = (state && state.results) || [];
  const firstTry = results.filter((result) => result.grade === 'facil').length;
  const xp = firstTry * 10 + (matched - firstTry) * 25;
  return { total, matched, errors, firstTry, xp };
}
