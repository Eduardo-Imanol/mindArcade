import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROUNDS,
  DIFFICULTIES,
  FEEDBACK_MS,
  GRACE_MS,
  LIVES,
  MAX_ROUNDS,
  MIN_ROUNDS,
  OPTIONS,
  PHASES,
  RADAR_THRESHOLD,
  RHYTHMS,
  TOKEN_THRESHOLD,
  buildRound,
  buildSession,
  createState,
  currentRound,
  fallDurationMs,
  normalizeBack,
  pendingCurrent,
  reduce,
  summarize,
  textProfile,
} from './lluvia-meteoros.logic.js';

const PRESERVE = () => 0.999999;
const DECK = [
  { id: 'a', front: 'closure', back: 'función que captura su entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro disponible' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'e', front: 'event loop', back: 'bucle que gestiona eventos' },
  { id: 'f', front: 'binding', back: 'enlace entre nombre y valor' },
];

const fill = (length) => 'a '.repeat(Math.floor(length / 2)) + (length % 2 ? 'a' : '');
const correctOption = (round) => round.options.find((option) => option.correct);
const wrongOption = (round) => round.options.find((option) => !option.correct);

const start = ({
  cards = DECK,
  deck = DECK,
  rounds = 5,
  difficulty = 'normal',
  rhythm = 'manual',
  random = PRESERVE,
} = {}) =>
  reduce(createState(), {
    type: 'start',
    cards,
    deck,
    rounds,
    difficulty,
    rhythm,
    random,
  });

const answer = (state, { correct = true, ratio = 0 } = {}) => {
  const round = currentRound(state);
  const option = correct ? correctOption(round) : wrongOption(round);
  return reduce(state, { type: 'answer', optionId: option.id, remainingRatio: ratio });
};

const resolveAndNext = (state, options) => reduce(answer(state, options), { type: 'next' });

describe('lluvia-meteoros constants', () => {
  it('exposes the signed rounds, options, lives, timings and modes', () => {
    expect([MIN_ROUNDS, MAX_ROUNDS, DEFAULT_ROUNDS]).toEqual([3, 10, 8]);
    expect(OPTIONS).toBe(3);
    expect(LIVES).toBe(3);
    expect(FEEDBACK_MS).toBe(2500);
    expect(GRACE_MS).toBe(700);
    expect(RADAR_THRESHOLD).toBe(72);
    expect(TOKEN_THRESHOLD).toBe(30);
    expect(DIFFICULTIES).toEqual(['tranquilo', 'normal', 'arcade']);
    expect(RHYTHMS).toEqual(['manual', 'auto', 'survival']);
    expect(PHASES).toEqual(['setup', 'playing', 'answered', 'paused', 'complete']);
  });
});

describe('lluvia-meteoros normalizeBack', () => {
  it('trims, strips diacritics and lowercases', () => {
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

describe('lluvia-meteoros textProfile', () => {
  it('keeps short single-line text in meteor mode', () => {
    const profile = textProfile('¿Qué es una función?');
    expect(profile.mode).toBe('meteor');
    expect(profile.graphemes).toBeLessThanOrEqual(RADAR_THRESHOLD);
    expect(profile.longestToken).toBeLessThanOrEqual(TOKEN_THRESHOLD);
    expect(profile.size).toBe('lg');
  });

  it('switches to radar at 73 graphemes but keeps 72 in meteor', () => {
    const atLimit = textProfile(fill(RADAR_THRESHOLD));
    const overLimit = textProfile(fill(RADAR_THRESHOLD + 1));
    expect(atLimit.graphemes).toBe(72);
    expect(atLimit.mode).toBe('meteor');
    expect(overLimit.graphemes).toBe(73);
    expect(overLimit.mode).toBe('radar');
  });

  it('switches to radar for line breaks, long tokens and URLs', () => {
    expect(textProfile('hola\nmundo').mode).toBe('radar');
    expect(textProfile('a'.repeat(TOKEN_THRESHOLD + 1)).mode).toBe('radar');
    expect(textProfile('https://example.com/' + 'x'.repeat(40)).mode).toBe('radar');
  });

  it('counts graphemes with Array.from for CJK and emoji', () => {
    expect(textProfile('变量').graphemes).toBe(2);
    expect(textProfile('变量').mode).toBe('meteor');
    expect(textProfile('🚀🚀🚀').graphemes).toBe(3);
    expect(textProfile('🚀🚀🚀').mode).toBe('meteor');
  });

  it('treats empty and whitespace-only text as radar with zero graphemes', () => {
    for (const value of ['', '   ', '\n\t']) {
      expect(textProfile(value)).toEqual({
        graphemes: 0,
        longestToken: 0,
        mode: 'radar',
        size: 'lg',
      });
    }
    expect(textProfile()).toMatchObject({ graphemes: 0, mode: 'radar' });
  });

  it('scales the font size by length', () => {
    expect(textProfile('palabra').size).toBe('lg');
    expect(textProfile('ab '.repeat(14).trim()).size).toBe('md');
    expect(textProfile('ab '.repeat(20).trim()).size).toBe('sm');
  });
});

describe('lluvia-meteoros fallDurationMs', () => {
  it('grows with text length', () => {
    const short = fallDurationMs({ text: 'corto', difficulty: 'normal' });
    const long = fallDurationMs({ text: fill(150), difficulty: 'normal' });
    const longer = fallDurationMs({ text: fill(300), difficulty: 'normal' });
    expect(long).toBeGreaterThan(short);
    expect(longer).toBeGreaterThanOrEqual(long);
  });

  it('applies the signed difficulty multipliers', () => {
    const text = fill(60);
    const tranquilo = fallDurationMs({ text, difficulty: 'tranquilo' });
    const normal = fallDurationMs({ text, difficulty: 'normal' });
    const arcade = fallDurationMs({ text, difficulty: 'arcade' });
    expect(tranquilo).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(arcade);
  });

  it('is deterministic and clamps every duration to 4500–26000 ms', () => {
    expect(fallDurationMs({ text: fill(80) })).toBe(fallDurationMs({ text: fill(80) }));
    for (const difficulty of DIFFICULTIES) {
      for (const text of ['x', fill(100), fill(1000), fill(5000)]) {
        const duration = fallDurationMs({ text, difficulty });
        expect(duration).toBeGreaterThanOrEqual(4500);
        expect(duration).toBeLessThanOrEqual(26000);
      }
    }
  });

  it('falls back to normal for invalid difficulties and 6000 for empty text', () => {
    const text = fill(60);
    expect(fallDurationMs({ text, difficulty: 'nope' })).toBe(
      fallDurationMs({ text, difficulty: 'normal' })
    );
    expect(fallDurationMs({ text: '' })).toBe(6000);
    expect(fallDurationMs({ text: '   ' })).toBe(6000);
    expect(fallDurationMs()).toBe(6000);
  });
});

describe('lluvia-meteoros buildRound', () => {
  it('builds exactly 3 options with the correct card and unique ids/backs', () => {
    const round = buildRound({ card: DECK[0], deck: DECK, random: PRESERVE });
    expect(round.card).toBe(DECK[0]);
    expect(round.options).toHaveLength(OPTIONS);
    expect(round.options.map((option) => option.id)).toEqual(['a', 'b', 'c']);
    expect(round.options.filter((option) => option.correct)).toHaveLength(1);
    expect(correctOption(round).card).toBe(DECK[0]);

    const ids = round.options.map((option) => option.id);
    const backs = round.options.map((option) => normalizeBack(option.back));
    expect(new Set(ids).size).toBe(OPTIONS);
    expect(new Set(backs).size).toBe(OPTIONS);
  });

  it('takes every distractor from the received deck and keeps the correct card', () => {
    const deck = DECK.slice(0, 4);
    const round = buildRound({ card: DECK[0], deck, random: () => 0 });
    const deckIds = new Set(deck.map((card) => card.id));
    expect(round.options).toHaveLength(OPTIONS);
    expect(round.options.map((option) => option.id).sort()).toEqual(['a', 'c', 'd']);
    for (const option of round.options) {
      if (option.id !== 'a') expect(deckIds.has(option.id)).toBe(true);
    }
  });

  it('includes the correct card even when it is absent from the deck', () => {
    const card = { id: 'solo', front: 'pregunta', back: 'respuesta' };
    const round = buildRound({ card, deck: DECK.slice(0, 3), random: PRESERVE });
    expect(round.options).toHaveLength(OPTIONS);
    expect(correctOption(round).id).toBe('solo');
  });

  it('dedupes normalized backs and duplicate ids', () => {
    const deck = [
      { id: 'a', front: 'A', back: 'uno' },
      { id: 'b', front: 'B', back: ' UNO ' },
      { id: 'c', front: 'C', back: 'ÚNO' },
      { id: 'c', front: 'C bis', back: 'dos' },
      { id: 'd', front: 'D', back: 'dos' },
      { id: 'e', front: 'E', back: 'tres' },
    ];
    const round = buildRound({ card: deck[0], deck, random: PRESERVE });
    expect(round.options.map((option) => option.id)).toEqual(['a', 'c', 'e']);
    expect(new Set(round.options.map((option) => normalizeBack(option.back))).size).toBe(3);
  });

  it('is deterministic with a fixed random and shuffles with another', () => {
    const first = buildRound({ card: DECK[0], deck: DECK, random: () => 0.42 });
    const second = buildRound({ card: DECK[0], deck: DECK, random: () => 0.42 });
    expect(first.options.map((option) => option.id)).toEqual(
      second.options.map((option) => option.id)
    );

    const fixed = buildRound({ card: DECK[0], deck: DECK, random: PRESERVE });
    const reversed = buildRound({ card: DECK[0], deck: DECK, random: () => 0 });
    expect(reversed.options.map((option) => option.id)).not.toEqual(
      fixed.options.map((option) => option.id)
    );
  });

  it('returns a safe empty round for invalid cards or missing backs', () => {
    expect(buildRound()).toEqual({ card: null, options: [] });
    expect(buildRound({ card: { id: 'a', front: 'x' }, deck: DECK })).toEqual({
      card: { id: 'a', front: 'x' },
      options: [],
    });
    expect(buildRound({ card: { id: '', back: 'x' }, deck: DECK })).toEqual({
      card: null,
      options: [],
    });
  });
});

describe('lluvia-meteoros buildSession', () => {
  it('caps the session at the requested rounds and available cards', () => {
    expect(buildSession({ cards: DECK, deck: DECK, rounds: 10, random: PRESERVE })).toMatchObject({
      total: 6,
      requested: 10,
    });
    expect(buildSession({ cards: DECK.slice(0, 4), deck: DECK, rounds: 10 })).toMatchObject({
      total: 4,
      requested: 10,
    });
    expect(buildSession({ cards: DECK, deck: DECK, rounds: 4 })).toMatchObject({
      total: 4,
      requested: 4,
    });
  });

  it('clamps rounds to 3–10 and preserves the card order', () => {
    const session = buildSession({ cards: DECK, deck: DECK, rounds: 2, random: PRESERVE });
    expect(session.requested).toBe(MIN_ROUNDS);
    expect(session.total).toBe(MIN_ROUNDS);
    expect(session.rounds.map((round) => round.card.id)).toEqual(['a', 'b', 'c']);
  });

  it('precomputes profile and duration with the session difficulty', () => {
    const session = buildSession({
      cards: DECK,
      deck: DECK,
      rounds: 3,
      difficulty: 'tranquilo',
      random: PRESERVE,
    });
    expect(session.difficulty).toBe('tranquilo');
    for (const round of session.rounds) {
      expect(round.options).toHaveLength(OPTIONS);
      expect(round.profile).toEqual(textProfile(round.card.front));
      expect(round.durationMs).toBe(
        fallDurationMs({ text: round.card.front, difficulty: 'tranquilo' })
      );
    }
  });

  it('falls back to normal for invalid difficulty', () => {
    const session = buildSession({ cards: DECK, deck: DECK, difficulty: 'nope' });
    expect(session.difficulty).toBe('normal');
    expect(session.rounds[0].durationMs).toBe(
      fallDurationMs({ text: session.rounds[0].card.front, difficulty: 'normal' })
    );
  });

  it('filters cards without id, front or back', () => {
    const cards = [
      DECK[0],
      { id: '', front: 'sin id', back: 'x' },
      { id: 'no-front', front: '   ', back: 'y' },
      { id: 'no-back', front: 'z', back: '  ' },
      DECK[1],
      DECK[2],
    ];
    const session = buildSession({ cards, deck: DECK, rounds: 10, random: PRESERVE });
    expect(session.rounds.map((round) => round.card.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty safe session with fewer than 3 unique deck backs', () => {
    const deck = [
      { id: 'a', front: 'A', back: 'uno' },
      { id: 'b', front: 'B', back: 'UNO' },
      { id: 'c', front: 'C', back: 'dos' },
    ];
    expect(buildSession({ cards: deck, deck, rounds: 5 })).toEqual({
      total: 0,
      requested: 5,
      rounds: [],
      difficulty: 'normal',
    });
  });

  it('uses the cards as deck when deck is omitted and survives empty input', () => {
    expect(buildSession({ cards: DECK, rounds: 3 }).total).toBe(3);
    expect(buildSession({ cards: [], deck: [], rounds: 5 })).toMatchObject({ total: 0, rounds: [] });
    expect(buildSession()).toMatchObject({ total: 0, requested: DEFAULT_ROUNDS, rounds: [] });
  });
});

describe('lluvia-meteoros reduce', () => {
  it('starts a manual session with the signed defaults', () => {
    const state = start();
    expect(state.phase).toBe('playing');
    expect(state.total).toBe(5);
    expect(state.roundIndex).toBe(0);
    expect(state.difficulty).toBe('normal');
    expect(state.rhythm).toBe('manual');
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.lives).toBe(LIVES);
    expect(currentRound(state)).toMatchObject({
      index: 0,
      total: 5,
      answered: false,
      won: false,
      lost: false,
    });
  });

  it('contract sequence: correct answer at ratio .5 awards 150 points and facil', () => {
    let state = start();
    state = answer(state, { correct: true, ratio: 0.5 });
    expect(state.phase).toBe('answered');
    expect(state.score).toBe(150);
    expect(state.streak).toBe(1);
    expect(state.bestStreak).toBe(1);
    expect(state.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'facil' });
    expect(state.results[0]).toEqual({
      seq: 1,
      cardId: 'a',
      grade: 'facil',
      correct: true,
      points: 150,
    });
    const round = currentRound(state);
    expect(round.answered).toBe(true);
    expect(round.won).toBe(true);
    expect(round.lost).toBe(false);
    expect(round.correctOptionId).toBe(correctOption(round).id);
  });

  it('marks wrong answers as otra-vez with zero points and resets the streak', () => {
    let state = start();
    state = answer(state, { correct: true });
    state = reduce(state, { type: 'next' });
    state = answer(state, { correct: false });
    expect(state.phase).toBe('answered');
    expect(state.score).toBe(100);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(1);
    expect(state.lastGrade).toEqual({ seq: 2, cardId: 'b', grade: 'otra-vez' });
    expect(state.results[1]).toMatchObject({ grade: 'otra-vez', correct: false, points: 0 });
    expect(currentRound(state).lost).toBe(true);
  });

  it('handles timeout as otra-vez and ignores later actions in the round', () => {
    let state = start();
    state = reduce(state, { type: 'timeout' });
    expect(state.phase).toBe('answered');
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'otra-vez' });
    expect(state.chosenOptionId).toBeNull();
    const answered = state;

    expect(reduce(state, { type: 'timeout' })).toBe(answered);
    expect(answer(state, { correct: true })).toBe(answered);
    expect(reduce(state, { type: 'next' }).phase).toBe('playing');
  });

  it('accepts a single attempt per meteor', () => {
    let state = start();
    state = answer(state, { correct: true });
    const answered = state;
    expect(answer(state, { correct: true })).toBe(answered);
    expect(answer(state, { correct: false })).toBe(answered);
    expect(reduce(state, { type: 'answer', optionId: 'nope' })).toBe(answered);
  });

  it('advances with next and completes after the last round', () => {
    let state = start({ rounds: 3 });
    state = answer(state);
    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('playing');
    expect(state.roundIndex).toBe(1);
    expect(state.chosenOptionId).toBeNull();
    expect(currentRound(state).card.id).toBe('b');

    state = answer(state);
    state = reduce(state, { type: 'next' });
    state = answer(state);
    state = reduce(state, { type: 'next' });
    expect(state.phase).toBe('complete');
    expect(state.results).toHaveLength(3);
    expect(reduce(state, { type: 'next' })).toBe(state);
  });

  it('awards points only for hits and tracks the best streak', () => {
    let state = start();
    state = resolveAndNext(state, { correct: true, ratio: 0 });
    state = resolveAndNext(state, { correct: true, ratio: 0.25 });
    state = resolveAndNext(state, { correct: false });
    state = resolveAndNext(state, { correct: true, ratio: 1 });
    state = answer(state, { correct: false });

    expect(state.score).toBe(100 + 125 + 200);
    expect(state.bestStreak).toBe(2);
    expect(state.streak).toBe(0);
  });

  it('survival starts with 3 lives and completes when they reach zero', () => {
    let state = start({ rhythm: 'survival' });
    expect(state.lives).toBe(LIVES);

    state = reduce(state, { type: 'timeout' });
    expect(state.lives).toBe(2);
    expect(state.phase).toBe('answered');
    state = reduce(state, { type: 'next' });
    state = resolveAndNext(state, { correct: false });
    expect(state.lives).toBe(1);
    state = resolveAndNext(state, { correct: false, ratio: 0.9 });
    expect(state.lives).toBe(0);
    expect(state.phase).toBe('complete');
    expect(state.results).toHaveLength(3);
    expect(pendingCurrent(state)).toEqual([]);
  });

  it('survival does not grade rounds that were never shown', () => {
    let state = start({ rhythm: 'survival' });
    for (let index = 0; index < LIVES; index += 1) {
      state = reduce(state, { type: 'timeout' });
      if (state.phase === 'answered') state = reduce(state, { type: 'next' });
    }
    expect(state.total).toBe(5);
    expect(state.results).toHaveLength(3);
    expect(summarize(state)).toMatchObject({ hits: 0, fails: 3 });
  });

  it('survival does not lose lives on hits', () => {
    let state = start({ rhythm: 'survival' });
    state = answer(state, { correct: true });
    expect(state.lives).toBe(LIVES);
    state = reduce(state, { type: 'next' });
    state = answer(state, { correct: true, ratio: 0.5 });
    expect(state.lives).toBe(LIVES);
  });

  it('pauses and resumes without losing progress', () => {
    let state = start();
    state = reduce(state, { type: 'pause' });
    expect(state.phase).toBe('paused');
    expect(state.resumePhase).toBe('playing');
    expect(currentRound(state).index).toBe(0);
    expect(answer(state, { correct: true })).toBe(state);
    state = reduce(state, { type: 'resume' });
    expect(state.phase).toBe('playing');
    expect(state.resumePhase).toBeNull();
    expect(answer(state, { correct: true }).phase).toBe('answered');
  });

  it('can pause during feedback and restores the answered phase', () => {
    let state = start();
    state = answer(state);
    state = reduce(state, { type: 'pause' });
    expect(state.phase).toBe('paused');
    expect(state.resumePhase).toBe('answered');
    state = reduce(state, { type: 'resume' });
    expect(state.phase).toBe('answered');
  });

  it('ignores pause/resume from invalid phases', () => {
    const setup = createState();
    expect(reduce(setup, { type: 'pause' })).toBe(setup);
    expect(reduce(setup, { type: 'resume' })).toBe(setup);

    let state = start();
    expect(reduce(state, { type: 'resume' })).toBe(state);
    state = reduce(state, { type: 'pause' });
    expect(reduce(state, { type: 'pause' })).toBe(state);
  });

  it('ignores out-of-phase and unknown actions', () => {
    const setup = createState();
    expect(reduce(setup, { type: 'answer', optionId: 'a' })).toBe(setup);
    expect(reduce(setup, { type: 'timeout' })).toBe(setup);
    expect(reduce(setup, { type: 'next' })).toBe(setup);
    expect(reduce(setup, { type: 'unknown' })).toBe(setup);
    expect(reduce(setup)).toBe(setup);
    expect(reduce(undefined, { type: 'start', cards: DECK })).toBeUndefined();

    const state = start();
    expect(reduce(state, { type: 'next' })).toBe(state);
    expect(reduce(state, { type: 'bogus' })).toBe(state);
    expect(reduce(state, { type: 'answer', optionId: 'nope' })).toBe(state);
    expect(reduce(state, { type: 'answer' })).toBe(state);
  });

  it('resets to a fresh setup state from any phase', () => {
    const state = answer(start());
    expect(reduce(state, { type: 'reset' })).toEqual(createState());
    expect(reduce(reduce(state, { type: 'pause' }), { type: 'reset' })).toEqual(createState());
  });

  it('clamps rounds and falls back to safe settings on start', () => {
    expect(start({ rounds: 99 }).requested).toBe(MAX_ROUNDS);
    expect(start({ rounds: 1 }).requested).toBe(MIN_ROUNDS);
    expect(start({ rounds: 'abc' }).requested).toBe(DEFAULT_ROUNDS);
    expect(start({ rounds: 5.7 }).requested).toBe(5);
    expect(start({ difficulty: 'nope' }).difficulty).toBe('normal');
    expect(start({ rhythm: 'nope' }).rhythm).toBe('manual');
    expect(start({ cards: DECK.slice(0, 2) }).total).toBe(2);
  });

  it('starts complete with an empty or insufficient session and never throws', () => {
    const empty = start({ cards: [], deck: [] });
    expect(empty.phase).toBe('complete');
    expect(empty.total).toBe(0);
    expect(empty.rounds).toEqual([]);
    expect(currentRound(empty)).toBeNull();
    expect(pendingCurrent(empty)).toEqual([]);
    expect(summarize(empty)).toEqual({ hits: 0, fails: 0, score: 0, bestStreak: 0, xp: 0 });

    const duplicate = start({
      cards: [
        { id: 'a', front: 'A', back: 'uno' },
        { id: 'b', front: 'B', back: 'UNO' },
        { id: 'c', front: 'C', back: 'uno ' },
      ],
      deck: [
        { id: 'a', front: 'A', back: 'uno' },
        { id: 'b', front: 'B', back: 'UNO' },
        { id: 'c', front: 'C', back: 'uno ' },
      ],
    });
    expect(duplicate.phase).toBe('complete');
    expect(duplicate.total).toBe(0);
  });

  it('does not mutate the previous state', () => {
    const state = start();
    const snapshot = JSON.parse(JSON.stringify(state));
    answer(state, { correct: true, ratio: 0.5 });
    reduce(state, { type: 'timeout' });
    reduce(state, { type: 'pause' });
    expect(state).toEqual(snapshot);
  });
});

describe('lluvia-meteoros pendingCurrent', () => {
  it('returns only the current unresolved meteor', () => {
    let state = start();
    expect(pendingCurrent(state)).toEqual([{ cardId: 'a', grade: 'otra-vez' }]);

    state = answer(state);
    expect(pendingCurrent(state)).toEqual([]);

    state = reduce(state, { type: 'next' });
    expect(pendingCurrent(state)).toEqual([{ cardId: 'b', grade: 'otra-vez' }]);

    state = reduce(state, { type: 'pause' });
    expect(pendingCurrent(state)).toEqual([{ cardId: 'b', grade: 'otra-vez' }]);

    state = reduce(state, { type: 'resume' });
    state = reduce(state, { type: 'timeout' });
    expect(pendingCurrent(state)).toEqual([]);
  });

  it('is empty from setup, complete and paused-after-answer states', () => {
    expect(pendingCurrent(createState())).toEqual([]);
    expect(pendingCurrent(undefined)).toEqual([]);

    let state = answer(start());
    state = reduce(state, { type: 'pause' });
    expect(pendingCurrent(state)).toEqual([]);
    state = reduce(state, { type: 'resume' });
    state = reduce(state, { type: 'next' });

    for (let index = 0; index < 4; index += 1) {
      state = resolveAndNext(state, { correct: true });
    }
    expect(state.phase).toBe('complete');
    expect(pendingCurrent(state)).toEqual([]);
  });
});

describe('lluvia-meteoros summarize', () => {
  it('reports hits, fails, score, best streak and xp from resolved rounds', () => {
    let state = start();
    state = resolveAndNext(state, { correct: true, ratio: 0 });
    state = resolveAndNext(state, { correct: true, ratio: 0 });
    state = resolveAndNext(state, { correct: false });
    state = resolveAndNext(state, { correct: true, ratio: 0 });
    state = answer(state, { correct: false });

    expect(summarize(state)).toEqual({
      hits: 3,
      fails: 2,
      score: 300,
      bestStreak: 2,
      xp: 30,
    });
  });

  it('handles empty and missing states', () => {
    expect(summarize(createState())).toEqual({
      hits: 0,
      fails: 0,
      score: 0,
      bestStreak: 0,
      xp: 0,
    });
    expect(summarize(undefined)).toEqual({
      hits: 0,
      fails: 0,
      score: 0,
      bestStreak: 0,
      xp: 0,
    });
  });
});
