import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROUNDS,
  LETTERS,
  MAX_MISTAKES,
  MAX_ROUNDS,
  MIN_ROUNDS,
  PHASES,
  createState,
  currentRound,
  gradeFor,
  isWordComplete,
  isValidLetter,
  mistakeCount,
  normalizeWord,
  pendingGrades,
  reduce,
  revealedIndices,
} from './ahorcado.logic.js';

const PRESERVE = () => 0.999999;
const DECK = [
  { id: 'a', front: 'SOL', back: 'estrella' },
  { id: 'b', front: 'LUNA', back: 'satélite natural' },
  { id: 'c', front: 'FUNCIÓN', back: 'rol o cometido' },
  { id: 'd', front: 'ÑANDÚ', back: 'ave sudamericana' },
  { id: 'e', front: 'ÁRBOL', back: 'planta leñosa' },
];

const guess = (state, letter) => reduce(state, { type: 'guess', letter });
const play = (state, letters) => letters.reduce(guess, state);
const start = (cards = DECK, rounds = DEFAULT_ROUNDS, random = PRESERVE) =>
  reduce(createState(), { type: 'start', rounds, cards, random });

describe('ahorcado normalizeWord', () => {
  it('strips diacritics via NFD and uppercases (contract)', () => {
    expect(normalizeWord('Función Ñandú ÉXITO')).toBe('FUNCION NANDU EXITO');
  });

  it('preserves spaces as separators and survives empty input', () => {
    expect(normalizeWord(' A B ')).toBe(' A B ');
    expect(normalizeWord('')).toBe('');
    expect(normalizeWord(undefined)).toBe('');
  });
});

describe('ahorcado gradeFor', () => {
  it('maps mistakes to the signed SRS thresholds', () => {
    expect(gradeFor(0)).toBe('facil');
    expect(gradeFor(1)).toBe('facil');
    expect(gradeFor(2)).toBe('dificil');
    expect(gradeFor(5)).toBe('dificil');
    expect(gradeFor(MAX_MISTAKES)).toBe('otra-vez');
    expect(gradeFor(9)).toBe('otra-vez');
    expect(gradeFor()).toBe('facil');
  });
});

describe('ahorcado letters', () => {
  it('exposes the 27-letter Spanish alphabet with Ñ', () => {
    expect(LETTERS).toHaveLength(27);
    expect(LETTERS).toContain('Ñ');
    expect(new Set(LETTERS).size).toBe(27);
  });

  it('validates letters after NFD normalization but not words or symbols', () => {
    expect(isValidLetter('ñ')).toBe(true);
    expect(isValidLetter('N')).toBe(true);
    expect(isValidLetter('á')).toBe(true);
    expect(isValidLetter('1')).toBe(false);
    expect(isValidLetter(' ')).toBe(false);
    expect(isValidLetter('AB')).toBe(false);
    expect(isValidLetter('')).toBe(false);
  });
});

describe('ahorcado derivation helpers', () => {
  it('derives mistakes from used letters (never accumulated)', () => {
    expect(mistakeCount(['X', 'S', 'Y'], 'SOL')).toBe(2);
    expect(mistakeCount(['S', 'O', 'L'], 'SOL')).toBe(0);
    expect(mistakeCount([], 'SOL')).toBe(0);
  });

  it('reveals Ñ with N and accents with their plain vowel (NFD)', () => {
    expect(revealedIndices('FUNCIÓN', ['N'])).toEqual([2, 6]);
    expect(revealedIndices('FUNCIÓN', ['O'])).toEqual([5]);
    expect(revealedIndices('FUNCIÓN', ['N', 'O'])).toEqual([2, 5, 6]);
    expect(mistakeCount(['N'], 'FUNCIÓN')).toBe(0);
  });

  it('keeps spaces always visible while guessable chars stay hidden', () => {
    expect(revealedIndices('A B', [])).toEqual([1]);
    expect(isWordComplete('A B', ['A', 'B'])).toBe(true);
    expect(isWordComplete('A B', ['A'])).toBe(false);
  });
});

describe('ahorcado reducer', () => {
  it('contract sequence: win with 0 fails (facil) then 3 fails (dificil), then complete', () => {
    let state = start(DECK.slice(0, 2), 3);
    expect(state.phase).toBe('playing');
    expect(state.total).toBe(2);
    expect(state.cards.map((card) => card.id)).toEqual(['a', 'b']);

    state = play(state, ['S', 'O', 'L']);
    expect(state.phase).toBe('round-won');
    expect(state.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'facil' });
    expect(state.results[0]).toEqual({ seq: 1, cardId: 'a', grade: 'facil', mistakes: 0 });

    const won = state;
    expect(guess(state, 'A')).toBe(won);
    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(1);
    expect(state.usedLetters).toEqual([]);

    state = play(state, ['X', 'Y', 'Z', 'L', 'U', 'N', 'A']);
    expect(state.phase).toBe('round-won');
    expect(state.lastGrade).toEqual({ seq: 2, cardId: 'b', grade: 'dificil' });
    expect(state.results[1]).toEqual({ seq: 2, cardId: 'b', grade: 'dificil', mistakes: 3 });

    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('complete');
    expect(pendingGrades(state)).toEqual([]);
  });

  it('loses the round on the 6th mistake, reveals the word and grades otra-vez', () => {
    let state = start(DECK.slice(0, 1), 3);
    expect(state.total).toBe(1);

    state = play(state, ['X', 'Y', 'Z', 'W', 'K', 'J']);
    expect(state.phase).toBe('round-lost');
    expect(state.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'otra-vez' });
    expect(state.results[0].mistakes).toBe(MAX_MISTAKES);

    const round = currentRound(state);
    expect(round.mistakes).toBe(6);
    expect(round.revealed).toEqual([0, 1, 2]);
    expect(round.lost).toBe(true);

    const lost = state;
    expect(guess(state, 'S')).toBe(lost);
    expect(reduce(state, { type: 'guess', letter: 'S' })).toBe(lost);

    const summary = reduce(state, { type: 'next' });
    expect(summary.phase).toBe('complete');
  });

  it('keeps mistakes derived during play (3 wrong + 2 right = 3)', () => {
    let state = start(DECK.slice(0, 1), 3);
    state = play(state, ['X', 'Y', 'S', 'Z', 'O']);
    expect(state.phase).toBe('playing');
    expect(mistakeCount(state.usedLetters, 'SOL')).toBe(3);
    expect(currentRound(state).mistakes).toBe(3);
    expect(currentRound(state).revealed).toEqual([0, 1]);
  });

  it('wins compound words with Ñ and accents using NFD letters', () => {
    let state = start([{ id: 'd', front: 'ÑANDÚ', back: 'ave' }], 3);
    state = play(state, ['N', 'A', 'D', 'U']);
    expect(state.phase).toBe('round-won');
    expect(state.lastGrade.grade).toBe('facil');
    expect(currentRound(state).revealed).toEqual([0, 1, 2, 3, 4]);

    let accented = start([{ id: 'e', front: 'ÁRBOL', back: 'planta' }], 3);
    accented = play(accented, ['A', 'R', 'B', 'O', 'L']);
    expect(accented.phase).toBe('round-won');
  });

  it('ignores repeated, invalid and out-of-phase guesses without mutating', () => {
    const state = start(DECK.slice(0, 1), 3);
    const afterOne = guess(state, 's');
    expect(afterOne.usedLetters).toEqual(['S']);
    expect(guess(afterOne, 'S')).toBe(afterOne);
    expect(guess(afterOne, 's')).toBe(afterOne);
    expect(guess(afterOne, '1')).toBe(afterOne);
    expect(guess(afterOne, 'AB')).toBe(afterOne);
    expect(reduce(afterOne, { type: 'nope' })).toBe(afterOne);

    const setup = createState();
    expect(guess(setup, 'A')).toBe(setup);
    expect(reduce(setup, { type: 'next' })).toBe(setup);
    expect(currentRound(setup)).toBeNull();
  });

  it('clamps requested rounds to 3–10 and never exceeds available cards', () => {
    expect(start(DECK, 99).requested).toBe(MAX_ROUNDS);
    expect(start(DECK, 1).requested).toBe(MIN_ROUNDS);
    expect(start(DECK).requested).toBe(DEFAULT_ROUNDS);
    expect(start(DECK, 4).total).toBe(4);
    expect(start(DECK.slice(0, 2), 5).total).toBe(2);
    expect(start(DECK, 5.7).requested).toBe(5);
    expect(start(DECK, 5.7).total).toBe(5);
    expect(start(DECK, 'abc').requested).toBe(DEFAULT_ROUNDS);
  });

  it('shuffles round order with the injectable random', () => {
    const preserved = start(DECK.slice(0, 3), 3, PRESERVE);
    expect(preserved.cards.map((card) => card.id)).toEqual(['a', 'b', 'c']);
    const reversed = start(DECK.slice(0, 3), 3, () => 0);
    expect(reversed.cards.map((card) => card.id)).toEqual(['b', 'c', 'a']);
  });

  it('starts complete with an empty deck and never throws', () => {
    const state = start([], 5);
    expect(state.phase).toBe('complete');
    expect(state.total).toBe(0);
    expect(pendingGrades(state)).toEqual([]);
    expect(reduce(undefined, { type: 'start', cards: DECK })).toBeUndefined();
  });

  it('lists unresolved rounds as otra-vez and never re-emits resolved ones', () => {
    let state = start(DECK, 5);
    state = play(state, ['S', 'O', 'L']);
    state = reduce(state, { type: 'next' });
    state = play(state, ['L', 'U', 'N', 'A']);
    expect(state.phase).toBe('round-won');
    expect(state.results).toHaveLength(2);

    expect(pendingGrades(state)).toEqual([
      { cardId: 'c', grade: 'otra-vez' },
      { cardId: 'd', grade: 'otra-vez' },
      { cardId: 'e', grade: 'otra-vez' },
    ]);
    expect(pendingGrades(state)).toEqual(pendingGrades(state));
    expect(pendingGrades(createState())).toEqual([]);
  });

  it('resets to a fresh setup state and ignores next while playing', () => {
    let state = start(DECK.slice(0, 1), 3);
    expect(reduce(state, { type: 'next' })).toBe(state);
    state = play(state, ['S', 'O', 'L']);
    expect(state.phase).toBe('round-won');
    expect(reduce(state, { type: 'reset' })).toEqual(createState());
  });

  it('does not mutate the previous state', () => {
    const state = start(DECK.slice(0, 2), 2);
    const snapshot = JSON.parse(JSON.stringify(state));
    guess(state, 'S');
    expect(state).toEqual(snapshot);
  });
});

describe('ahorcado constants', () => {
  it('exposes the signed phases and mistake budget', () => {
    expect(PHASES).toEqual(['setup', 'playing', 'round-won', 'round-lost', 'complete']);
    expect(MAX_MISTAKES).toBe(6);
  });
});
