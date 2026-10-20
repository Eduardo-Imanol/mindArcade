import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROUNDS,
  MAX_ATTEMPTS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  PHASES,
  buildQuestion,
  createState,
  currentQuestion,
  gradeFor,
  normalizeBack,
  pendingGrades,
  reduce,
  summarize,
} from './quiz-significado.logic.js';

const PRESERVE = () => 0.999999;
const DECK = [
  { id: 'a', front: 'closure', back: 'función que captura su entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro disponible' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'e', front: 'event loop', back: 'bucle que gestiona eventos' },
];

const optionIds = (question) => question.options.map((option) => option.card.id);
const start = (cards = DECK, rounds = DEFAULT_ROUNDS, random = PRESERVE, deck = DECK) =>
  reduce(createState(), { type: 'start', rounds, cards, deck, random });
const choose = (state, optionId) => reduce(state, { type: 'choose', optionId });

describe('quiz-significado normalizeBack', () => {
  it('trims, strips diacritics via NFD and lowercases (contract)', () => {
    expect(normalizeBack('  Función  ')).toBe('funcion');
    expect(normalizeBack('ÁRBOL')).toBe('arbol');
    expect(normalizeBack('NúMERO UNO')).toBe('numero uno');
  });

  it('survives empty and non-string input', () => {
    expect(normalizeBack()).toBe('');
    expect(normalizeBack('')).toBe('');
    expect(normalizeBack('   ')).toBe('');
  });
});

describe('quiz-significado gradeFor', () => {
  it('maps attempts to the signed SRS grades', () => {
    expect(gradeFor(true, 1)).toBe('facil');
    expect(gradeFor(true, 2)).toBe('dificil');
    expect(gradeFor(true, 3)).toBe('dificil');
    expect(gradeFor(false, 1)).toBe('otra-vez');
    expect(gradeFor(false, 2)).toBe('otra-vez');
    expect(gradeFor(true)).toBe('facil');
  });
});

describe('quiz-significado buildQuestion', () => {
  it('builds 4 unique options: the correct card plus 3 deck distractors', () => {
    const question = buildQuestion(DECK[0], DECK, PRESERVE);
    expect(question.card).toBe(DECK[0]);
    expect(optionIds(question)).toEqual(['a', 'b', 'c', 'd']);
    expect(question.options.filter((option) => option.correct)).toHaveLength(1);
    expect(question.options.find((option) => option.correct).card.id).toBe('a');
    expect(question.options.every((option) => option.correct === (option.card.id === 'a'))).toBe(true);
  });

  it('never invents options: every id belongs to the received deck and excludes the correct one', () => {
    const question = buildQuestion(DECK[1], DECK.slice(0, 4), PRESERVE);
    const deckIds = new Set(DECK.slice(0, 4).map((card) => card.id));
    for (const id of optionIds(question)) {
      expect(deckIds.has(id)).toBe(true);
    }
    expect(optionIds(question).filter((id) => id === 'b')).toHaveLength(1);
  });

  it('is deterministic with a fixed random and shuffles with another', () => {
    const first = buildQuestion(DECK[0], DECK, () => 0.42);
    const second = buildQuestion(DECK[0], DECK, () => 0.42);
    expect(optionIds(first)).toEqual(optionIds(second));
    expect(new Set(optionIds(first)).size).toBe(4);

    const shuffled = buildQuestion(DECK[0], DECK, () => 0);
    expect([...optionIds(shuffled)].sort()).toEqual(['a', 'c', 'd', 'e']);
    expect(optionIds(shuffled).find((id) => id === 'a')).toBeDefined();
  });

  it('dedupes normalized backs (trim + accents + case) between options', () => {
    const deck = [
      { id: 'a', front: 'A', back: 'uno' },
      { id: 'b', front: 'B', back: ' UNO ' },
      { id: 'c', front: 'C', back: 'ÚNO' },
      { id: 'd', front: 'D', back: 'dos' },
      { id: 'e', front: 'E', back: 'tres' },
    ];
    const question = buildQuestion(deck[0], deck, PRESERVE);
    expect(optionIds(question)).toEqual(['a', 'd', 'e']);
    expect(question.options).toHaveLength(3);
  });

  it('falls back to fewer unique options (2–4) without throwing', () => {
    const same = [
      { id: 'a', front: 'A', back: 'uno' },
      { id: 'b', front: 'B', back: 'UNO' },
      { id: 'c', front: 'C', back: 'uno ' },
    ];
    const single = buildQuestion(same[0], same, PRESERVE);
    expect(optionIds(single)).toEqual(['a']);
    expect(single.options[0].correct).toBe(true);

    const solo = buildQuestion(DECK[0], [DECK[0]], PRESERVE);
    expect(optionIds(solo)).toEqual(['a']);
  });

  it('skips cards without a usable back and survives an empty deck', () => {
    const deck = [
      { id: 'a', front: 'A', back: 'correcto' },
      { id: 'b', front: 'B' },
      { id: 'c', front: 'C', back: '  ' },
      { id: 'd', front: 'D', back: 'otro' },
    ];
    expect(optionIds(buildQuestion(deck[0], deck, PRESERVE))).toEqual(['a', 'd']);
    expect(buildQuestion(null, deck, PRESERVE)).toEqual({ card: null, options: [] });
    expect(optionIds(buildQuestion(DECK[0], [], PRESERVE))).toEqual(['a']);
  });
});

describe('quiz-significado reducer', () => {
  it('contract sequence: 1st-try hit (facil), fail+hit (dificil), 2 fails (otra-vez) then complete', () => {
    let state = start(DECK.slice(0, 3), 3);
    expect(state.phase).toBe('playing');
    expect(state.total).toBe(3);
    expect(state.questions.map((question) => question.card.id)).toEqual(['a', 'b', 'c']);

    state = choose(state, 'a');
    expect(state.phase).toBe('answered');
    expect(state.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'facil' });
    expect(state.results[0]).toEqual({ seq: 1, cardId: 'a', grade: 'facil', attempts: 1 });

    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(1);

    state = choose(state, 'a');
    expect(state.phase).toBe('playing');
    expect(state.wrongOptionIds).toEqual(['a']);
    expect(state.results).toHaveLength(1);
    let round = currentQuestion(state);
    expect(round.attempts).toBe(1);
    expect(round.remaining).toBe(1);
    expect(round.won).toBe(false);

    state = choose(state, 'b');
    expect(state.phase).toBe('answered');
    expect(state.lastGrade).toEqual({ seq: 2, cardId: 'b', grade: 'dificil' });
    expect(state.results[1]).toEqual({ seq: 2, cardId: 'b', grade: 'dificil', attempts: 2 });

    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(2);
    expect(state.wrongOptionIds).toEqual([]);

    state = choose(state, 'a');
    state = choose(state, 'b');
    expect(state.phase).toBe('answered');
    expect(state.lastGrade).toEqual({ seq: 3, cardId: 'c', grade: 'otra-vez' });
    expect(state.results[2]).toEqual({ seq: 3, cardId: 'c', grade: 'otra-vez', attempts: 2 });
    round = currentQuestion(state);
    expect(round.lost).toBe(true);
    expect(round.correctOptionId).toBe('c');
    expect(round.chosenOptionId).toBe('b');

    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('complete');
    expect(state.results.map((result) => result.grade)).toEqual(['facil', 'dificil', 'otra-vez']);
    expect(pendingGrades(state)).toEqual([]);
    expect(summarize(state)).toEqual({ total: 3, resolved: 3, firstTry: 1, fails: 2 });
  });

  it('lists unresolved rounds as otra-vez and never re-emits resolved ones', () => {
    let state = start(DECK, 3);
    state = choose(state, 'a');
    expect(pendingGrades(state)).toEqual([
      { cardId: 'b', grade: 'otra-vez' },
      { cardId: 'c', grade: 'otra-vez' },
    ]);

    state = reduce(state, { type: 'next' });
    state = choose(state, 'a');
    expect(state.phase).toBe('playing');
    expect(pendingGrades(state)).toEqual([
      { cardId: 'b', grade: 'otra-vez' },
      { cardId: 'c', grade: 'otra-vez' },
    ]);

    state = choose(state, 'b');
    expect(pendingGrades(state)).toEqual([{ cardId: 'c', grade: 'otra-vez' }]);
    expect(pendingGrades(state)).toEqual(pendingGrades(state));
    expect(pendingGrades(createState())).toEqual([]);
  });

  it('ignores invalid, repeated and out-of-phase choices without mutating', () => {
    let state = start(DECK.slice(0, 2), 3);
    expect(choose(state, 'nope')).toBe(state);
    expect(choose(state, undefined)).toBe(state);

    state = choose(state, 'a');
    const repeated = choose(state, 'a');
    expect(repeated).toBe(state);
    expect(reduce(state, { type: 'next' })).not.toBe(state);
    expect(choose(state, 'b')).toBe(state);

    const setup = createState();
    expect(choose(setup, 'a')).toBe(setup);
    expect(reduce(setup, { type: 'next' })).toBe(setup);
    expect(currentQuestion(setup)).toBeNull();
  });

  it('resets to a fresh setup state from any phase', () => {
    let state = start(DECK.slice(0, 1), 3);
    state = choose(state, 'a');
    expect(reduce(state, { type: 'reset' })).toEqual(createState());
  });

  it('clamps requested rounds to 3–10 and never exceeds the returned cards', () => {
    expect(start(DECK, 99).requested).toBe(MAX_ROUNDS);
    expect(start(DECK, 1).requested).toBe(MIN_ROUNDS);
    expect(start(DECK).requested).toBe(DEFAULT_ROUNDS);
    expect(start(DECK, 4).total).toBe(4);
    expect(start(DECK.slice(0, 2), 5).total).toBe(2);
    expect(start(DECK, 5.7).requested).toBe(5);
    expect(start(DECK, 5.7).total).toBe(5);
    expect(start(DECK, 'abc').requested).toBe(DEFAULT_ROUNDS);
    expect(start(DECK, 3).deck).toEqual(DECK);
  });

  it('starts complete with zero selected cards and never throws', () => {
    const state = start([], 5);
    expect(state.phase).toBe('complete');
    expect(state.total).toBe(0);
    expect(state.questions).toEqual([]);
    expect(pendingGrades(state)).toEqual([]);
    expect(summarize(state)).toEqual({ total: 0, resolved: 0, firstTry: 0, fails: 0 });
    expect(currentQuestion(state)).toBeNull();
    expect(reduce(undefined, { type: 'start', cards: DECK })).toBeUndefined();
  });

  it('ignores choices once the round is resolved and reports no pending grades when done', () => {
    let state = start(DECK.slice(0, 2), 2);
    state = choose(state, 'a');
    const answered = state;
    for (const optionId of ['nope', 'a', 'b']) {
      expect(choose(state, optionId)).toBe(answered);
    }

    state = reduce(state, { type: 'next' });
    state = choose(state, 'b');
    expect(state.phase).toBe('answered');
    expect(pendingGrades(state)).toEqual([]);

    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('complete');
    expect(pendingGrades(state)).toEqual([]);
    expect(reduce(state, { type: 'next' })).toBe(state);
  });

  it('does not mutate the previous state', () => {
    const state = start(DECK.slice(0, 2), 2);
    const snapshot = JSON.parse(JSON.stringify(state));
    choose(state, 'a');
    expect(state).toEqual(snapshot);
  });
});

describe('quiz-significado constants', () => {
  it('exposes the signed phases, attempts and round bounds', () => {
    expect(PHASES).toEqual(['setup', 'playing', 'answered', 'complete']);
    expect(MAX_ATTEMPTS).toBe(2);
    expect([MIN_ROUNDS, MAX_ROUNDS, DEFAULT_ROUNDS]).toEqual([3, 10, 10]);
  });
});
