// src/games/ahorcado/ahorcado.logic.js — pure ahorcado reducer (no core imports)
export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 10;
export const DEFAULT_ROUNDS = 10;
export const MAX_MISTAKES = 6;
export const PHASES = ['setup', 'playing', 'round-won', 'round-lost', 'complete'];
export const LETTERS = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];

const LETTER_SET = new Set(LETTERS);
const GUESSABLE = /^[A-Z]$/;

export function normalizeWord(text = '') {
  return String(text).normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
}

export function isValidLetter(letter = '') {
  return LETTER_SET.has(normalizeWord(letter));
}

export function mistakeCount(usedLetters = [], target = '') {
  const normalized = normalizeWord(target);
  return usedLetters.filter((letter) => !normalized.includes(letter)).length;
}

export function isWordComplete(target = '', usedLetters = []) {
  const used = new Set(usedLetters);
  return [...String(target ?? '')].every((char) => {
    const normalized = normalizeWord(char);
    return !GUESSABLE.test(normalized) || used.has(normalized);
  });
}

export function revealedIndices(target = '', usedLetters = [], { revealAll = false } = {}) {
  const used = new Set(usedLetters);
  const indices = [];
  [...String(target ?? '')].forEach((char, index) => {
    const normalized = normalizeWord(char);
    if (revealAll || !GUESSABLE.test(normalized) || used.has(normalized)) indices.push(index);
  });
  return indices;
}

export function gradeFor(mistakes = 0) {
  const fails = Number(mistakes) || 0;
  if (fails >= MAX_MISTAKES) return 'otra-vez';
  return fails <= 1 ? 'facil' : 'dificil';
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

function clampRounds(rounds) {
  const value = Number(rounds);
  const safe = Number.isFinite(value) ? Math.trunc(value) : DEFAULT_ROUNDS;
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, safe));
}

export function createState() {
  return {
    phase: 'setup',
    requested: DEFAULT_ROUNDS,
    total: 0,
    roundIndex: 0,
    cards: [],
    usedLetters: [],
    results: [],
    lastGrade: null,
  };
}

function currentCard(state) {
  return state.cards[state.roundIndex] || null;
}

function resolve(state, { lost, mistakes }) {
  const card = currentCard(state);
  const grade = lost ? 'otra-vez' : gradeFor(mistakes);
  const seq = state.results.length + 1;
  return {
    ...state,
    phase: lost ? 'round-lost' : 'round-won',
    results: [...state.results, { seq, cardId: card.id, grade, mistakes }],
    lastGrade: { seq, cardId: card.id, grade },
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const cards = Array.isArray(action.cards) ? action.cards : [];
    const requested = clampRounds(action.rounds);
    const total = Math.min(requested, cards.length);
    const base = { ...createState(), requested };
    if (total === 0) return { ...base, phase: 'complete' };
    const roundCards = shuffle(cards.slice(0, total), action.random || Math.random);
    return { ...base, phase: 'playing', total, cards: roundCards };
  }

  if (action.type === 'reset') return createState();

  if (action.type === 'guess') {
    if (state.phase !== 'playing') return state;
    const letter = normalizeWord(action.letter);
    if (!LETTER_SET.has(letter) || state.usedLetters.includes(letter)) return state;
    const usedLetters = [...state.usedLetters, letter];
    const target = currentCard(state).front;
    const mistakes = mistakeCount(usedLetters, target);
    if (mistakes >= MAX_MISTAKES) {
      return resolve({ ...state, usedLetters }, { lost: true, mistakes });
    }
    if (isWordComplete(target, usedLetters)) {
      return resolve({ ...state, usedLetters }, { lost: false, mistakes });
    }
    return { ...state, usedLetters };
  }

  if (action.type === 'next') {
    if (state.phase !== 'round-won' && state.phase !== 'round-lost') return state;
    if (state.roundIndex + 1 >= state.total) return { ...state, phase: 'complete' };
    return { ...state, phase: 'playing', roundIndex: state.roundIndex + 1, usedLetters: [] };
  }

  return state;
}

export function currentRound(state) {
  const card = state && state.cards ? currentCard(state) : null;
  if (!card) return null;
  const target = String(card.front ?? '');
  const lost = state.phase === 'round-lost';
  return {
    card,
    target,
    index: state.roundIndex,
    mistakes: mistakeCount(state.usedLetters, target),
    usedLetters: [...state.usedLetters],
    revealed: revealedIndices(target, state.usedLetters, { revealAll: lost }),
    won: state.phase === 'round-won',
    lost,
  };
}

export function pendingGrades(state) {
  if (!state) return [];
  const pending = [];
  for (let index = state.results.length; index < state.total; index += 1) {
    const card = state.cards[index];
    if (card) pending.push({ cardId: card.id, grade: 'otra-vez' });
  }
  return pending;
}
