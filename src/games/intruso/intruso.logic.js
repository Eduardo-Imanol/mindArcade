// src/games/intruso/intruso.logic.js — pure intruder reducer (no core imports)
export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 10;
export const DEFAULT_ROUNDS = 10;
export const BASE_OPTIONS = 3;
export const MIN_BASE_OPTIONS = 2;
export const PHASES = ['setup', 'playing', 'answered', 'complete'];

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

export function normalizeBack(text = '') {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();
}

export function clampRounds(rounds) {
  const value = Number(rounds);
  const safe = Number.isFinite(value) ? Math.trunc(value) : DEFAULT_ROUNDS;
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, safe));
}

export function optionKey(option = {}) {
  return `${option.topicId ?? ''}:${option.card?.id ?? ''}`;
}

function uniqueBackCards(cards = []) {
  const seen = new Set();
  const out = [];
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!card || card.id == null) continue;
    const back = normalizeBack(card.back);
    if (!back || seen.has(back)) continue;
    seen.add(back);
    out.push(card);
  }
  return out;
}

function candidatesFrom(others, baseBacks) {
  const out = [];
  for (const group of Array.isArray(others) ? others : []) {
    if (!group || !Array.isArray(group.cards)) continue;
    for (const card of group.cards) {
      if (!card || card.id == null) continue;
      const back = normalizeBack(card.back);
      if (!back || baseBacks.has(back)) continue;
      out.push({
        topicId: group.id,
        topicTitle: group.title || group.id,
        card,
        key: `${group.id}:${card.id}`,
      });
    }
  }
  return out;
}

export function buildRound({ anchor, others = [], random = Math.random, used } = {}) {
  if (!anchor || !Array.isArray(anchor.cards)) return null;
  const bases = shuffle(uniqueBackCards(anchor.cards), random).slice(0, BASE_OPTIONS);
  if (bases.length < MIN_BASE_OPTIONS) return null;

  const baseBacks = new Set(bases.map((card) => normalizeBack(card.back)));
  const candidates = candidatesFrom(others, baseBacks);
  if (candidates.length === 0) return null;

  const usedKeys = used instanceof Set ? used : new Set();
  const fresh = candidates.filter((candidate) => !usedKeys.has(candidate.key));
  const pool = fresh.length > 0 ? fresh : candidates;
  const intruder = shuffle(pool, random)[0];
  usedKeys.add(intruder.key);

  const options = shuffle(
    [
      ...bases.map((card) => ({
        card,
        topicId: anchor.id,
        topicTitle: anchor.title || anchor.id,
        correct: false,
      })),
      {
        card: intruder.card,
        topicId: intruder.topicId,
        topicTitle: intruder.topicTitle,
        correct: true,
      },
    ],
    random
  ).map((option, index) => ({ ...option, index, key: optionKey(option) }));

  return {
    bases,
    intruder: {
      topicId: intruder.topicId,
      topicTitle: intruder.topicTitle,
      card: intruder.card,
    },
    options,
  };
}

export function buildSession({ groups = [], anchorTopicId, rounds = DEFAULT_ROUNDS, random = Math.random } = {}) {
  const list = Array.isArray(groups) ? groups : [];
  const anchor = list.find((group) => group && group.id === anchorTopicId);
  if (!anchor) return { anchor: null, total: 0, rounds: [] };

  const others = list.filter(
    (group) => group && group.id !== anchorTopicId && Array.isArray(group.cards) && group.cards.length > 0
  );
  if (others.length === 0) return { anchor, total: 0, rounds: [] };

  const used = new Set();
  const built = [];
  const requested = clampRounds(rounds);
  for (let index = 0; index < requested; index += 1) {
    const round = buildRound({ anchor, others, random, used });
    if (!round) break;
    built.push({ ...round, index });
  }

  return { anchor, total: built.length, rounds: built };
}

export function createState() {
  return {
    phase: 'setup',
    requested: DEFAULT_ROUNDS,
    total: 0,
    roundIndex: 0,
    rounds: [],
    results: [],
    chosenKey: null,
    lastGrade: null,
  };
}

export function gradeFor(correct) {
  return correct ? 'facil' : 'otra-vez';
}

function resolveRound(state, round, option) {
  const seq = state.results.length + 1;
  const grade = gradeFor(option.correct);
  return {
    ...state,
    phase: 'answered',
    chosenKey: option.key,
    results: [
      ...state.results,
      {
        seq,
        topicId: round.intruder.topicId,
        cardId: round.intruder.card.id,
        grade,
        correct: option.correct,
      },
    ],
    lastGrade: {
      seq,
      topicId: round.intruder.topicId,
      cardId: round.intruder.card.id,
      grade,
    },
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const requested = clampRounds(action.rounds);
    const session = buildSession({
      groups: action.groups,
      anchorTopicId: action.anchorTopicId,
      rounds: requested,
      random: action.random || Math.random,
    });
    const base = {
      ...createState(),
      requested,
      total: session.total,
      rounds: session.rounds,
    };
    if (session.total === 0) return { ...base, phase: 'complete' };
    return { ...base, phase: 'playing' };
  }

  if (action.type === 'reset') return createState();

  if (action.type === 'choose') {
    if (state.phase !== 'playing') return state;
    const round = state.rounds[state.roundIndex];
    if (!round) return state;
    const option = round.options.find((entry) => entry.key === action.optionKey);
    if (!option || option.key === state.chosenKey) return state;
    return resolveRound(state, round, option);
  }

  if (action.type === 'next') {
    if (state.phase !== 'answered') return state;
    if (state.roundIndex + 1 >= state.total) return { ...state, phase: 'complete' };
    return {
      ...state,
      phase: 'playing',
      roundIndex: state.roundIndex + 1,
      chosenKey: null,
    };
  }

  return state;
}

export function currentRound(state) {
  if (!state || !Array.isArray(state.rounds)) return null;
  const round = state.rounds[state.roundIndex];
  if (!round) return null;
  const answered = state.phase === 'answered';
  const correctOption = round.options.find((option) => option.correct) || null;
  const chosen = round.options.find((option) => option.key === state.chosenKey) || null;
  return {
    index: state.roundIndex,
    total: state.total,
    intruder: round.intruder,
    options: round.options,
    answered,
    chosenKey: state.chosenKey ?? null,
    correctKey: correctOption ? correctOption.key : null,
    won: answered ? !!(chosen && chosen.correct) : false,
    lost: answered ? !(chosen && chosen.correct) : false,
  };
}

export function pendingCurrent(state) {
  if (!state || state.phase !== 'playing') return [];
  const round = state.rounds[state.roundIndex];
  if (!round) return [];
  return [
    {
      topicId: round.intruder.topicId,
      cardId: round.intruder.card.id,
      grade: 'otra-vez',
    },
  ];
}

export function summarize(state) {
  const results = (state && state.results) || [];
  const total = (state && state.total) || 0;
  const correct = results.filter((result) => result.grade === 'facil').length;
  return {
    total,
    resolved: results.length,
    correct,
    fails: Math.max(0, total - correct),
  };
}
