// src/games/quiz-significado/quiz-significado.logic.js — pure quiz reducer (no core imports)
export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 10;
export const DEFAULT_ROUNDS = 10;
export const MAX_ATTEMPTS = 2;
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

function clampRounds(rounds) {
  const value = Number(rounds);
  const safe = Number.isFinite(value) ? Math.trunc(value) : DEFAULT_ROUNDS;
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, safe));
}

export function normalizeBack(text = '') {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();
}

export function gradeFor(correct, attempts = 1) {
  if (!correct) return 'otra-vez';
  const used = Number(attempts) || 1;
  return used <= 1 ? 'facil' : 'dificil';
}

export function buildQuestion(correctCard, deck = [], random = Math.random) {
  if (!correctCard || correctCard.id == null) return { card: null, options: [] };
  const cards = Array.isArray(deck) ? deck : [];
  const seen = new Set([normalizeBack(correctCard.back)]);
  const distractors = [];

  for (const card of cards) {
    if (!card || card.id === correctCard.id) continue;
    const key = normalizeBack(card.back);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    distractors.push(card);
  }

  const options = [correctCard, ...shuffle(distractors, random).slice(0, 3)].map((card) => ({
    card,
    correct: card.id === correctCard.id,
  }));
  return { card: correctCard, options: shuffle(options, random) };
}

export function createState() {
  return {
    phase: 'setup',
    requested: DEFAULT_ROUNDS,
    total: 0,
    roundIndex: 0,
    questions: [],
    deck: [],
    wrongOptionIds: [],
    chosenOptionId: null,
    results: [],
    lastGrade: null,
  };
}

function resolveRound(state, question, { grade, attempts, wrongOptionIds, chosenOptionId }) {
  const seq = state.results.length + 1;
  return {
    ...state,
    phase: 'answered',
    wrongOptionIds,
    chosenOptionId,
    results: [...state.results, { seq, cardId: question.card.id, grade, attempts }],
    lastGrade: { seq, cardId: question.card.id, grade },
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const cards = Array.isArray(action.cards)
      ? action.cards.filter((card) => card && card.id != null)
      : [];
    const deck = Array.isArray(action.deck) ? action.deck : cards;
    const requested = clampRounds(action.rounds);
    const total = Math.min(requested, cards.length);
    const base = { ...createState(), requested, deck };
    if (total === 0) return { ...base, phase: 'complete' };
    const random = action.random || Math.random;
    const questions = cards
      .slice(0, total)
      .map((card) => buildQuestion(card, deck, random));
    return { ...base, phase: 'playing', total, questions };
  }

  if (action.type === 'reset') return createState();

  if (action.type === 'choose') {
    if (state.phase !== 'playing') return state;
    const question = state.questions[state.roundIndex];
    if (!question) return state;
    const option = question.options.find(
      (entry) => entry.card && entry.card.id === action.optionId
    );
    if (!option) return state;

    const wrongOptionIds = state.wrongOptionIds || [];
    if (wrongOptionIds.includes(action.optionId)) return state;
    const attempts = wrongOptionIds.length + 1;

    if (option.correct) {
      return resolveRound(state, question, {
        grade: gradeFor(true, attempts),
        attempts,
        wrongOptionIds,
        chosenOptionId: action.optionId,
      });
    }

    const nextWrong = [...wrongOptionIds, action.optionId];
    if (nextWrong.length >= MAX_ATTEMPTS) {
      return resolveRound(state, question, {
        grade: gradeFor(false, nextWrong.length),
        attempts: nextWrong.length,
        wrongOptionIds: nextWrong,
        chosenOptionId: action.optionId,
      });
    }
    return { ...state, wrongOptionIds: nextWrong, chosenOptionId: action.optionId };
  }

  if (action.type === 'next') {
    if (state.phase !== 'answered') return state;
    if (state.roundIndex + 1 >= state.total) return { ...state, phase: 'complete' };
    return {
      ...state,
      phase: 'playing',
      roundIndex: state.roundIndex + 1,
      wrongOptionIds: [],
      chosenOptionId: null,
    };
  }

  return state;
}

export function currentQuestion(state) {
  if (!state || !Array.isArray(state.questions)) return null;
  const question = state.questions[state.roundIndex];
  if (!question) return null;
  const wrongOptionIds = [...(state.wrongOptionIds || [])];
  const result = state.phase === 'answered' ? state.results[state.roundIndex] || null : null;
  const correctOption = question.options.find((option) => option.correct);
  return {
    card: question.card,
    options: question.options,
    index: state.roundIndex,
    attempts: wrongOptionIds.length,
    remaining: Math.max(0, MAX_ATTEMPTS - wrongOptionIds.length),
    wrongOptionIds,
    chosenOptionId: state.chosenOptionId ?? null,
    correctOptionId: correctOption ? correctOption.card.id : null,
    answered: state.phase === 'answered',
    won: !!result && result.grade !== 'otra-vez',
    lost: !!result && result.grade === 'otra-vez',
  };
}

export function pendingGrades(state) {
  if (!state || !Array.isArray(state.questions)) return [];
  const pending = [];
  const resolved = (state.results || []).length;
  for (let index = resolved; index < state.total; index += 1) {
    const question = state.questions[index];
    if (question && question.card) {
      pending.push({ cardId: question.card.id, grade: 'otra-vez' });
    }
  }
  return pending;
}

export function summarize(state) {
  const results = (state && state.results) || [];
  const total = (state && state.total) || 0;
  const firstTry = results.filter((result) => result.grade === 'facil').length;
  return {
    total,
    resolved: results.length,
    firstTry,
    fails: Math.max(0, total - firstTry),
  };
}
