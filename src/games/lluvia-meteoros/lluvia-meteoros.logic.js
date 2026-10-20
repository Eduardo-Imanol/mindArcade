export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 10;
export const DEFAULT_ROUNDS = 8;
export const OPTIONS = 3;
export const LIVES = 3;
export const FEEDBACK_MS = 2500;
export const GRACE_MS = 700;
export const RADAR_THRESHOLD = 72;
export const TOKEN_THRESHOLD = 30;
export const PHASES = ['setup', 'playing', 'answered', 'paused', 'complete'];
export const DIFFICULTIES = ['tranquilo', 'normal', 'arcade'];
export const RHYTHMS = ['manual', 'auto', 'survival'];

const DIFFICULTY_MULTIPLIER = { tranquilo: 1.25, normal: 1, arcade: 0.8 };
const SIZE_LG_MAX = 32;
const SIZE_MD_MAX = 56;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function hasText(value) {
  return String(value ?? '').trim() !== '';
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

function uniqueDeckBacks(deck) {
  const backs = new Set();
  for (const card of Array.isArray(deck) ? deck : []) {
    if (!card || card.id == null || !hasText(card.id)) continue;
    const back = normalizeBack(card.back);
    if (back) backs.add(back);
  }
  return backs;
}

export function clampRounds(rounds) {
  const value = Number(rounds);
  const safe = Number.isFinite(value) ? Math.trunc(value) : DEFAULT_ROUNDS;
  return clamp(safe, MIN_ROUNDS, MAX_ROUNDS);
}

export function normalizeBack(text = '') {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();
}

export function textProfile(text = '') {
  const value = String(text ?? '');
  const trimmed = value.trim();
  const graphemes = trimmed ? Array.from(value).length : 0;
  const tokens = trimmed ? trimmed.split(/\s+/) : [];
  const longestToken = tokens.reduce(
    (longest, token) => Math.max(longest, Array.from(token).length),
    0
  );
  const hasLineBreak = /[\r\n]/.test(value);

  let size = 'sm';
  if (graphemes <= SIZE_LG_MAX) size = 'lg';
  else if (graphemes <= SIZE_MD_MAX) size = 'md';

  const mode =
    graphemes === 0 ||
    graphemes > RADAR_THRESHOLD ||
    longestToken > TOKEN_THRESHOLD ||
    hasLineBreak
      ? 'radar'
      : 'meteor';

  return { graphemes, longestToken, mode, size };
}

export function fallDurationMs({ text = '', difficulty = 'normal' } = {}) {
  const { graphemes } = textProfile(text);
  if (graphemes === 0) return 6000;

  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? DIFFICULTY_MULTIPLIER.normal;
  const base = clamp(5000 + 60 * graphemes, 6000, 20000);
  return clamp(Math.round(base * multiplier), 4500, 26000);
}

export function buildRound({ card, deck = [], random = Math.random } = {}) {
  if (!card || card.id == null || !hasText(card.id)) return { card: null, options: [] };

  const correctBack = normalizeBack(card.back);
  if (!correctBack) return { card, options: [] };

  const seenIds = new Set([card.id]);
  const seenBacks = new Set([correctBack]);
  const distractors = [];

  for (const entry of Array.isArray(deck) ? deck : []) {
    if (!entry || entry.id == null || !hasText(entry.id)) continue;
    if (seenIds.has(entry.id)) continue;
    const back = normalizeBack(entry.back);
    if (!back || seenBacks.has(back)) continue;
    seenIds.add(entry.id);
    seenBacks.add(back);
    distractors.push(entry);
  }

  const picks = shuffle(distractors, random).slice(0, OPTIONS - 1);
  const options = [card, ...picks].map((entry) => ({
    id: entry.id,
    back: entry.back,
    card: entry,
    correct: entry.id === card.id,
  }));

  return { card, options: shuffle(options, random) };
}

export function buildSession({
  cards = [],
  deck,
  rounds = DEFAULT_ROUNDS,
  difficulty = 'normal',
  random = Math.random,
} = {}) {
  const list = Array.isArray(cards) ? cards : [];
  const fullDeck = Array.isArray(deck) ? deck : list;
  const valid = list.filter(validCard);
  const requested = clampRounds(rounds);
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'normal';
  const total = Math.min(requested, valid.length);
  const empty = {
    total: 0,
    requested,
    rounds: [],
    difficulty: safeDifficulty,
  };

  if (total === 0 || uniqueDeckBacks(fullDeck).size < OPTIONS) return empty;

  const built = [];
  for (let index = 0; index < total; index += 1) {
    const card = valid[index];
    const round = buildRound({ card, deck: fullDeck, random });
    if (round.options.length < OPTIONS) return empty;
    built.push({
      index,
      card,
      options: round.options,
      profile: textProfile(card.front),
      durationMs: fallDurationMs({ text: card.front, difficulty: safeDifficulty }),
    });
  }

  return {
    total: built.length,
    requested,
    rounds: built,
    difficulty: safeDifficulty,
  };
}

export function createState() {
  return {
    phase: 'setup',
    requested: DEFAULT_ROUNDS,
    total: 0,
    roundIndex: 0,
    rounds: [],
    difficulty: 'normal',
    rhythm: 'manual',
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: LIVES,
    chosenOptionId: null,
    results: [],
    lastGrade: null,
    resumePhase: null,
  };
}

function resolveRound(state, round, { grade, points, optionId }) {
  const correct = grade === 'facil';
  const seq = state.results.length + 1;
  const streak = correct ? state.streak + 1 : 0;
  const lives =
    state.rhythm === 'survival' && !correct ? Math.max(0, state.lives - 1) : state.lives;
  const complete = state.rhythm === 'survival' && lives === 0;
  const result = {
    seq,
    cardId: round.card.id,
    grade,
    correct,
    points,
  };

  return {
    ...state,
    phase: complete ? 'complete' : 'answered',
    chosenOptionId: optionId ?? null,
    score: state.score + points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lives,
    results: [...state.results, result],
    lastGrade: { seq, cardId: round.card.id, grade },
    resumePhase: null,
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const cards = Array.isArray(action.cards) ? action.cards : [];
    const session = buildSession({
      cards,
      deck: arrayOr(action.deck, cards),
      rounds: action.rounds,
      difficulty: action.difficulty,
      random: action.random || Math.random,
    });
    const rhythm = RHYTHMS.includes(action.rhythm) ? action.rhythm : 'manual';
    const base = {
      ...createState(),
      requested: session.requested,
      total: session.total,
      rounds: session.rounds,
      difficulty: session.difficulty,
      rhythm,
    };
    if (session.total === 0) return { ...base, phase: 'complete' };
    return { ...base, phase: 'playing' };
  }

  if (action.type === 'reset') return createState();

  if (action.type === 'answer') {
    if (state.phase !== 'playing') return state;
    const round = state.rounds[state.roundIndex];
    if (!round) return state;
    const option = round.options.find((entry) => entry.id === action.optionId);
    if (!option) return state;
    const rawRatio = Number(action.remainingRatio);
    const ratio = Number.isFinite(rawRatio) ? clamp(rawRatio, 0, 1) : 0;
    return resolveRound(state, round, {
      grade: option.correct ? 'facil' : 'otra-vez',
      points: option.correct ? 100 + Math.round(ratio * 100) : 0,
      optionId: option.id,
    });
  }

  if (action.type === 'timeout') {
    if (state.phase !== 'playing') return state;
    const round = state.rounds[state.roundIndex];
    if (!round) return state;
    return resolveRound(state, round, { grade: 'otra-vez', points: 0, optionId: null });
  }

  if (action.type === 'next') {
    if (state.phase !== 'answered') return state;
    if (state.roundIndex + 1 >= state.total) {
      return { ...state, phase: 'complete', resumePhase: null };
    }
    return {
      ...state,
      phase: 'playing',
      roundIndex: state.roundIndex + 1,
      chosenOptionId: null,
      resumePhase: null,
    };
  }

  if (action.type === 'pause') {
    if (state.phase !== 'playing' && state.phase !== 'answered') return state;
    return { ...state, phase: 'paused', resumePhase: state.phase };
  }

  if (action.type === 'resume') {
    if (state.phase !== 'paused') return state;
    return { ...state, phase: state.resumePhase || 'playing', resumePhase: null };
  }

  return state;
}

function arrayOr(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

export function currentRound(state) {
  if (!state || !Array.isArray(state.rounds)) return null;
  const round = state.rounds[state.roundIndex];
  if (!round) return null;
  const answered = state.results.length > state.roundIndex;
  const result = answered ? state.results[state.roundIndex] : null;
  const correctOption = round.options.find((option) => option.correct) || null;
  return {
    index: state.roundIndex,
    total: state.total,
    card: round.card,
    options: round.options,
    profile: round.profile,
    durationMs: round.durationMs,
    answered,
    chosenOptionId: state.chosenOptionId ?? null,
    correctOptionId: correctOption ? correctOption.id : null,
    won: !!result && result.grade === 'facil',
    lost: !!result && result.grade === 'otra-vez',
  };
}

export function pendingCurrent(state) {
  if (!state || (state.phase !== 'playing' && state.phase !== 'paused')) return [];
  if (state.results.length > state.roundIndex) return [];
  const round = state.rounds[state.roundIndex];
  if (!round) return [];
  return [{ cardId: round.card.id, grade: 'otra-vez' }];
}

export function summarize(state) {
  const results = (state && state.results) || [];
  const hits = results.filter((result) => result.grade === 'facil').length;
  const fails = results.filter((result) => result.grade === 'otra-vez').length;
  return {
    hits,
    fails,
    score: (state && state.score) || 0,
    bestStreak: (state && state.bestStreak) || 0,
    xp: hits * 10,
  };
}
