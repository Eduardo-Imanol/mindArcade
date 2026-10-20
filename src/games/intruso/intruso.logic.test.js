import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  buildRound,
  buildSession,
  clampRounds,
  createState,
  currentRound,
  gradeFor,
  normalizeBack,
  pendingCurrent,
  reduce,
  summarize,
} from './intruso.logic.js';

function seeded(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const card = (id, back, front = id) => ({ id, front, back, difficulty: 'easy' });

const FUNCIONES = {
  id: 'funciones',
  title: 'Funciones',
  cards: [
    card('f1', 'bloque reutilizable'),
    card('f2', 'variable de entrada'),
    card('f3', 'resultado devuelto'),
    card('f4', 'captura el entorno'),
  ],
};

const ALGORITMOS = {
  id: 'algoritmos',
  title: 'Algoritmos',
  cards: [
    card('a1', 'conjunto de pasos'),
    card('a2', 'búsqueda binaria'),
    card('a3', 'complejidad temporal'),
    card('a4', 'ordenamiento estable'),
  ],
};

const GROUPS = [FUNCIONES, ALGORITMOS];

function start(overrides = {}) {
  return reduce(createState(), {
    type: 'start',
    groups: GROUPS,
    anchorTopicId: 'funciones',
    rounds: 3,
    random: seeded(7),
    ...overrides,
  });
}

function correctOption(round) {
  return round.options.find((option) => option.correct);
}

function wrongOption(round) {
  return round.options.find((option) => !option.correct);
}

describe('intruso logic — composition', () => {
  it('builds 3 anchor bases + 1 intruder from another topic, deterministically', () => {
    const first = start();
    const second = start();
    expect(first.phase).toBe('playing');
    expect(first.total).toBe(3);
    expect(first).toEqual(second);

    for (const round of first.rounds) {
      expect(round.options).toHaveLength(4);
      expect(round.options.filter((option) => option.correct)).toHaveLength(1);
      expect(new Set(round.options.map((option) => option.key)).size).toBe(4);

      const bases = round.options.filter((option) => !option.correct);
      expect(bases).toHaveLength(3);
      expect(bases.every((option) => option.topicId === 'funciones')).toBe(true);
      expect(new Set(bases.map((option) => normalizeBack(option.card.back))).size).toBe(3);

      expect(round.intruder.topicId).toBe('algoritmos');
      expect(correctOption(round).topicId).toBe('algoritmos');
      expect(round.intruder.topicId).not.toBe('funciones');
    }
  });

  it('never repeats the intruder while fresh candidates remain', () => {
    const state = start({ rounds: 3 });
    const keys = state.rounds.map(
      (round) => `${round.intruder.topicId}:${round.intruder.card.id}`
    );
    expect(new Set(keys).size).toBe(3);
  });

  it('excludes intruder candidates whose back duplicates an anchor base', () => {
    const anchor = {
      id: 'funciones',
      title: 'Funciones',
      cards: [card('f1', 'bloque reutilizable'), card('f2', 'variable de entrada'), card('f3', 'resultado devuelto')],
    };
    const others = [
      {
        id: 'algoritmos',
        title: 'Algoritmos',
        cards: [card('dup', 'bloque reutilizable'), card('ok', 'conjunto de pasos')],
      },
    ];
    const used = new Set();
    for (let index = 0; index < 4; index += 1) {
      const round = buildRound({ anchor, others, random: seeded(index + 1), used });
      expect(round.intruder.card.id).toBe('ok');
    }
  });

  it('falls back to 3 options when the anchor has only 2 unique backs', () => {
    const anchor = {
      id: 'funciones',
      title: 'Funciones',
      cards: [card('f1', 'uno'), card('f2', 'uno'), card('f3', 'dos')],
    };
    const round = buildRound({ anchor, others: [ALGORITMOS], random: seeded(3) });
    expect(round.options).toHaveLength(3);
    expect(round.options.filter((option) => option.correct)).toHaveLength(1);
  });

  it('returns no rounds when the anchor has fewer than 2 unique backs', () => {
    const anchor = { id: 'uno', title: 'Uno', cards: [card('x1', 'mismo'), card('x2', 'mismo')] };
    const session = buildSession({
      groups: [anchor, ALGORITMOS],
      anchorTopicId: 'uno',
      rounds: 3,
      random: seeded(1),
    });
    expect(session.total).toBe(0);
    expect(buildRound({ anchor, others: [ALGORITMOS], random: seeded(1) })).toBeNull();
  });

  it('returns no rounds without another topic or without anchor', () => {
    expect(start({ groups: [FUNCIONES] }).total).toBe(0);
    expect(start({ anchorTopicId: 'no-existe' }).total).toBe(0);
    expect(start({ groups: [] }).total).toBe(0);
  });

  it('allows repeating the intruder when every candidate is already used', () => {
    const used = new Set(['algoritmos:a1', 'algoritmos:a2', 'algoritmos:a3', 'algoritmos:a4']);
    const round = buildRound({ anchor: FUNCIONES, others: [ALGORITMOS], random: seeded(2), used });
    expect(round).not.toBeNull();
    expect(round.intruder.topicId).toBe('algoritmos');
  });

  it('clamps requested rounds to 3..10', () => {
    expect(clampRounds(1)).toBe(MIN_ROUNDS);
    expect(clampRounds(99)).toBe(MAX_ROUNDS);
    expect(clampRounds('5')).toBe(5);
    expect(clampRounds(undefined)).toBe(DEFAULT_ROUNDS);
  });
});

describe('intruso logic — one attempt and grading', () => {
  it('correct intruder → facil with the intruder topic', () => {
    const state = start();
    const round = currentRound(state);
    const option = correctOption(round);
    const next = reduce(state, { type: 'choose', optionKey: option.key });

    expect(next.phase).toBe('answered');
    expect(next.lastGrade).toEqual({
      seq: 1,
      topicId: 'algoritmos',
      cardId: option.card.id,
      grade: 'facil',
    });
    const answered = currentRound(next);
    expect(answered.won).toBe(true);
    expect(answered.lost).toBe(false);
    expect(answered.options.every((entry) => entry.correct === (entry.key === option.key))).toBe(
      true
    );
  });

  it('wrong option → otra-vez and reveals the intruder; no second attempt', () => {
    const state = start();
    const round = currentRound(state);
    const option = wrongOption(round);
    const next = reduce(state, { type: 'choose', optionKey: option.key });

    expect(next.lastGrade.grade).toBe('otra-vez');
    expect(next.lastGrade.topicId).toBe('algoritmos');
    const answered = currentRound(next);
    expect(answered.won).toBe(false);
    expect(answered.lost).toBe(true);
    expect(answered.correctKey).toBe(correctOption(round).key);

    const again = reduce(next, {
      type: 'choose',
      optionKey: correctOption(round).key,
    });
    expect(again).toBe(next);
    expect(again.results).toHaveLength(1);
  });

  it('ignores choices outside playing phase and unknown option keys', () => {
    const state = createState();
    expect(reduce(state, { type: 'choose', optionKey: 'x:y' })).toBe(state);

    const playing = start();
    expect(reduce(playing, { type: 'choose', optionKey: 'nope' })).toBe(playing);
  });

  it('advances rounds and completes the session', () => {
    let state = start();
    for (let index = 0; index < 3; index += 1) {
      const round = currentRound(state);
      state = reduce(state, { type: 'choose', optionKey: correctOption(round).key });
      state = reduce(state, { type: 'next' });
    }
    expect(state.phase).toBe('complete');
    expect(state.results).toHaveLength(3);
    expect(summarize(state)).toEqual({ total: 3, resolved: 3, correct: 3, fails: 0 });
  });

  it('summarizes correct/fails and resets cleanly', () => {
    let state = start();
    const choices = [true, false, true];
    for (const pickCorrect of choices) {
      const round = currentRound(state);
      const option = pickCorrect ? correctOption(round) : wrongOption(round);
      state = reduce(state, { type: 'choose', optionKey: option.key });
      state = reduce(state, { type: 'next' });
    }
    expect(summarize(state)).toEqual({ total: 3, resolved: 3, correct: 2, fails: 1 });
    expect(reduce(state, { type: 'reset' })).toEqual(createState());
  });

  it('gradeFor maps one attempt to facil/otra-vez', () => {
    expect(gradeFor(true)).toBe('facil');
    expect(gradeFor(false)).toBe('otra-vez');
  });
});

describe('intruso logic — pending current round', () => {
  it('emits only the current unanswered round', () => {
    const state = start();
    const round = currentRound(state);
    expect(pendingCurrent(state)).toEqual([
      {
        topicId: round.intruder.topicId,
        cardId: round.intruder.card.id,
        grade: 'otra-vez',
      },
    ]);

    const answered = reduce(state, {
      type: 'choose',
      optionKey: correctOption(round).key,
    });
    expect(pendingCurrent(answered)).toEqual([]);
    expect(pendingCurrent(reduce(answered, { type: 'next' }))).toEqual([
      expect.objectContaining({ grade: 'otra-vez' }),
    ]);
    expect(pendingCurrent(createState())).toEqual([]);
  });

  it('does not emit future rounds when exiting mid-session', () => {
    const state = start({ rounds: 10 });
    expect(state.total).toBe(10);
    expect(pendingCurrent(state)).toHaveLength(1);
  });
});
