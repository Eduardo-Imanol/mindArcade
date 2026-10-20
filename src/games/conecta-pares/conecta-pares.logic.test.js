import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAIRS,
  MAX_PAIRS,
  MIN_PAIRS,
  buildSession,
  clampPairs,
  createState,
  gradeFor,
  normalizeText,
  pendingGrades,
  reduce,
  summarize,
} from './conecta-pares.logic.js';

function seeded(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const card = (id, back, front = `Pregunta ${id}`) => ({ id, front, back });

const CARDS = [
  card('q1', 'Significado uno'),
  card('q2', 'Significado dos'),
  card('q3', 'Significado tres'),
  card('q4', 'Significado cuatro'),
  card('q5', 'Significado cinco'),
  card('q6', 'Significado seis'),
  card('q7', 'Significado siete'),
  card('q8', 'Significado ocho'),
];

const IDS = CARDS.map((entry) => entry.id);

function start(overrides = {}) {
  return reduce(createState(), {
    type: 'start',
    cards: CARDS,
    count: 8,
    random: seeded(11),
    ...overrides,
  });
}

function select(state, side, cardId) {
  return reduce(state, { type: 'select', side, cardId });
}

function matchedIds(state) {
  return state.matched.map((entry) => entry.cardId);
}

function sortedIds(cards) {
  return cards.map((entry) => entry.id).sort();
}

describe('conecta-pares logic — normalizeText', () => {
  it('trims, removes accents and lowercases', () => {
    expect(normalizeText('  Programación  ')).toBe('programacion');
    expect(normalizeText('ÁRBOL')).toBe('arbol');
    expect(normalizeText('¿Qué es?')).toBe('¿que es?');
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });
});

describe('conecta-pares logic — clampPairs', () => {
  it('clamps to 3..10 and defaults invalid values to 8', () => {
    expect(clampPairs(2)).toBe(MIN_PAIRS);
    expect(clampPairs(11)).toBe(MAX_PAIRS);
    expect(clampPairs(5)).toBe(5);
    expect(clampPairs('7')).toBe(7);
    expect(clampPairs(5.9)).toBe(5);
    expect(clampPairs(undefined)).toBe(DEFAULT_PAIRS);
    expect(clampPairs(null)).toBe(DEFAULT_PAIRS);
    expect(clampPairs('')).toBe(DEFAULT_PAIRS);
    expect(clampPairs('   ')).toBe(DEFAULT_PAIRS);
    expect(clampPairs('abc')).toBe(DEFAULT_PAIRS);
    expect(clampPairs(Number.NaN)).toBe(DEFAULT_PAIRS);
  });
});

describe('conecta-pares logic — buildSession', () => {
  it('builds 8 pairs with the same ids in both columns, each exactly once', () => {
    const session = buildSession({ cards: CARDS, count: 8, random: seeded(5) });
    expect(session.total).toBe(8);
    expect(session.cards).toHaveLength(8);
    expect(sortedIds(session.left)).toEqual([...IDS].sort());
    expect(sortedIds(session.right)).toEqual([...IDS].sort());
    expect(new Set(session.left.map((entry) => entry.id)).size).toBe(8);
    expect(new Set(session.right.map((entry) => entry.id)).size).toBe(8);
    expect(session.left).not.toBe(session.right);
    expect(session.left).not.toBe(session.cards);
    expect(session.right).not.toBe(session.cards);
  });

  it('is deterministic with the same random source and does not mutate the input', () => {
    const snapshot = JSON.stringify(CARDS);
    const first = buildSession({ cards: CARDS, count: 8, random: seeded(9) });
    const second = buildSession({ cards: CARDS, count: 8, random: seeded(9) });
    expect(first).toEqual(second);
    expect(JSON.stringify(CARDS)).toBe(snapshot);
    expect(CARDS.map((entry) => entry.id)).toEqual(IDS);
  });

  it('deduplicates by normalized front and back, keeping the first appearance', () => {
    const cards = [
      card('a', 'Árbol', 'Programación'),
      card('b', 'Otra cosa', 'programacion'),
      card('c', 'arbol', 'Distinta'),
      card('d', 'Cuarta', 'Cuarta front'),
      card('e', 'Quinta', 'Quinta front'),
    ];
    const session = buildSession({ cards, count: 10, random: seeded(2) });
    expect(session.total).toBe(3);
    expect(session.cards.map((entry) => entry.id)).toEqual(['a', 'd', 'e']);
    expect(new Set(session.right.map((entry) => normalizeText(entry.back))).size).toBe(3);
  });

  it('deduplicates by id so each id appears once per column', () => {
    const cards = [
      card('same', 'Primero', 'Front uno'),
      card('same', 'Segundo', 'Front dos'),
      card('b', 'Tercero', 'Front tres'),
      card('c', 'Cuarto', 'Front cuatro'),
    ];
    const session = buildSession({ cards, count: 10, random: seeded(8) });
    expect(session.total).toBe(3);
    expect(session.cards.map((entry) => entry.id)).toEqual(['same', 'b', 'c']);
    expect(session.cards[0].back).toBe('Primero');
    expect(new Set(session.left.map((entry) => entry.id)).size).toBe(3);
    expect(new Set(session.right.map((entry) => entry.id)).size).toBe(3);
  });

  it('clamps to the unique cards available', () => {
    const three = CARDS.slice(0, 3);
    const session = buildSession({ cards: three, count: 10, random: seeded(3) });
    expect(session.total).toBe(3);
    expect(sortedIds(session.left)).toEqual(['q1', 'q2', 'q3']);
    expect(sortedIds(session.right)).toEqual(['q1', 'q2', 'q3']);
  });

  it('returns a safe empty session with fewer than 3 unique cards', () => {
    const session = buildSession({ cards: CARDS.slice(0, 2), count: 3, random: seeded(4) });
    expect(session).toEqual({ cards: [], left: [], right: [], total: 0 });
  });

  it('filters cards without id, front or back', () => {
    const cards = [
      null,
      {},
      { id: 'x', front: 'Front' },
      { id: '', front: 'Front', back: 'Back' },
      { id: '   ', front: 'Front', back: 'Back' },
      { id: 'y', front: '   ', back: 'Back' },
      { id: 'z', front: 'Front', back: '' },
      card('ok1', 'Uno'),
      card('ok2', 'Dos'),
      card('ok3', 'Tres'),
    ];
    const session = buildSession({ cards, count: 10, random: seeded(6) });
    expect(session.total).toBe(3);
    expect(session.cards.map((entry) => entry.id)).toEqual(['ok1', 'ok2', 'ok3']);
  });

  it('uses DEFAULT_PAIRS for invalid counts', () => {
    const session = buildSession({ cards: CARDS, count: 'nope', random: seeded(7) });
    expect(session.total).toBe(DEFAULT_PAIRS);
  });

  it('uses the default random source when none is injected', () => {
    const session = buildSession({ cards: CARDS, count: 4 });
    expect(session.total).toBe(4);
    expect(sortedIds(session.left)).toEqual(['q1', 'q2', 'q3', 'q4']);
  });
});

describe('conecta-pares logic — selection flow', () => {
  it('selects from the question column and from the meaning column', () => {
    const state = start();
    const question = select(state, 'question', 'q1');
    expect(question.selection).toEqual({ side: 'question', cardId: 'q1' });
    expect(question.feedback).toBeNull();

    const meaning = select(state, 'meaning', 'q2');
    expect(meaning.selection).toEqual({ side: 'meaning', cardId: 'q2' });
  });

  it('toggles the same card off', () => {
    const state = select(start(), 'question', 'q1');
    const toggled = select(state, 'question', 'q1');
    expect(toggled.selection).toBeNull();
    expect(toggled.feedback).toBeNull();
  });

  it('replaces the selection with another card in the same column', () => {
    const state = select(start(), 'question', 'q1');
    const replaced = select(state, 'question', 'q2');
    expect(replaced.selection).toEqual({ side: 'question', cardId: 'q2' });
    expect(replaced.matched).toEqual([]);
  });

  it('resolves a correct pair from either direction', () => {
    const fromQuestion = select(select(start(), 'question', 'q1'), 'meaning', 'q1');
    expect(matchedIds(fromQuestion)).toEqual(['q1']);
    expect(fromQuestion.feedback).toEqual({ type: 'correct', cardId: 'q1' });

    const fromMeaning = select(select(start(), 'meaning', 'q4'), 'question', 'q4');
    expect(matchedIds(fromMeaning)).toEqual(['q4']);
    expect(fromMeaning.feedback).toEqual({ type: 'correct', cardId: 'q4' });
  });

  it('reports a wrong pair, attributes the fault to the question and allows retry', () => {
    const state = select(select(start(), 'question', 'q1'), 'meaning', 'q2');
    expect(state.errors).toBe(1);
    expect(state.attemptsByCard).toEqual({ q1: 1 });
    expect(state.feedback).toEqual({
      type: 'wrong',
      questionCardId: 'q1',
      meaningCardId: 'q2',
    });
    expect(state.matched).toEqual([]);
    expect(state.selection).toBeNull();
    expect(state.results).toEqual([]);

    const retry = select(select(state, 'question', 'q1'), 'meaning', 'q1');
    expect(matchedIds(retry)).toEqual(['q1']);
    expect(retry.phase).toBe('playing');
  });

  it('attributes the fault to the question when the meaning is selected first', () => {
    const state = select(select(start(), 'meaning', 'q4'), 'question', 'q3');
    expect(state.feedback).toEqual({
      type: 'wrong',
      questionCardId: 'q3',
      meaningCardId: 'q4',
    });
    expect(state.attemptsByCard).toEqual({ q3: 1 });
    expect(state.errors).toBe(1);
  });

  it('ignores matched cards and unknown cards', () => {
    const matched = select(select(start(), 'question', 'q1'), 'meaning', 'q1');
    expect(select(matched, 'question', 'q1')).toBe(matched);
    expect(select(matched, 'meaning', 'q1')).toBe(matched);

    const state = start();
    expect(select(state, 'question', 'nope')).toBe(state);
    expect(select(state, 'meaning', 'nope')).toBe(state);
    expect(select(state, 'other', 'q1')).toBe(state);
  });

  it('clears the selection and feedback with clear', () => {
    const wrong = select(select(start(), 'question', 'q1'), 'meaning', 'q2');
    expect(wrong.feedback).not.toBeNull();

    const cleared = reduce(wrong, { type: 'clear' });
    expect(cleared.selection).toBeNull();
    expect(cleared.feedback).toBeNull();
    expect(cleared.errors).toBe(1);

    const setup = createState();
    expect(reduce(setup, { type: 'clear' })).toBe(setup);
  });

  it('ignores selections outside the playing phase', () => {
    const setup = createState();
    expect(select(setup, 'question', 'q1')).toBe(setup);
  });

  it('ignores unknown actions and returns the same state', () => {
    const state = start();
    expect(reduce(state, { type: 'nope' })).toBe(state);
    expect(reduce(state, {})).toBe(state);
    expect(reduce(null, { type: 'start' })).toBeNull();
  });

  it('resets to a fresh setup state', () => {
    const state = select(select(start(), 'question', 'q1'), 'meaning', 'q2');
    expect(reduce(state, { type: 'reset' })).toEqual(createState());
  });
});

describe('conecta-pares logic — grading and completion', () => {
  it('grades facil with no previous attempts and dificil with at least one', () => {
    expect(gradeFor(0)).toBe('facil');
    expect(gradeFor(1)).toBe('dificil');
    expect(gradeFor(3)).toBe('dificil');
    expect(gradeFor(undefined)).toBe('facil');
  });

  it('registers exactly one result per card with the right grade', () => {
    const firstTry = select(select(start(), 'question', 'q2'), 'meaning', 'q2');
    expect(firstTry.results).toEqual([{ seq: 1, cardId: 'q2', grade: 'facil' }]);
    expect(firstTry.lastGrade).toEqual({ seq: 1, cardId: 'q2', grade: 'facil' });
    expect(firstTry.matched).toEqual([{ cardId: 'q2', order: 1 }]);

    const missed = select(select(firstTry, 'question', 'q3'), 'meaning', 'q4');
    const retried = select(select(missed, 'question', 'q3'), 'meaning', 'q3');
    expect(retried.results).toEqual([
      { seq: 1, cardId: 'q2', grade: 'facil' },
      { seq: 2, cardId: 'q3', grade: 'dificil' },
    ]);
    expect(retried.lastGrade).toEqual({ seq: 2, cardId: 'q3', grade: 'dificil' });
    expect(retried.matched).toEqual([
      { cardId: 'q2', order: 1 },
      { cardId: 'q3', order: 2 },
    ]);
  });

  it('clears feedback on the next selection', () => {
    const matched = select(select(start(), 'question', 'q1'), 'meaning', 'q1');
    expect(matched.feedback).toEqual({ type: 'correct', cardId: 'q1' });
    const next = select(matched, 'question', 'q2');
    expect(next.feedback).toBeNull();
  });

  it('completes the session after matching every pair and rejects further selections', () => {
    let state = start();
    for (const id of IDS) {
      state = select(select(state, 'question', id), 'meaning', id);
    }
    expect(state.phase).toBe('complete');
    expect(state.matched).toHaveLength(8);
    expect(state.results).toHaveLength(8);
    expect(state.errors).toBe(0);
    expect(pendingGrades(state)).toEqual([]);
    expect(select(state, 'question', 'q1')).toBe(state);
  });

  it('starts a fresh session from a previous state', () => {
    const previous = select(select(start(), 'question', 'q1'), 'meaning', 'q2');
    const next = select(start(previous), 'question', 'q5');
    expect(next.selection).toEqual({ side: 'question', cardId: 'q5' });
    expect(next.errors).toBe(0);
    expect(next.attemptsByCard).toEqual({});
    expect(next.matched).toEqual([]);
  });

  it('stays in setup with a safe empty session when fewer than 3 pairs are available', () => {
    const state = start({ cards: CARDS.slice(0, 2), count: 3 });
    expect(state.phase).toBe('setup');
    expect(state.total).toBe(0);
    expect(state.cards).toEqual([]);
    expect(state.left).toEqual([]);
    expect(state.right).toEqual([]);
    expect(state.selection).toBeNull();
  });

  it('clamps the requested count and never exceeds the available cards', () => {
    const high = start({ count: 99 });
    expect(high.requested).toBe(MAX_PAIRS);
    expect(high.total).toBe(8);

    const low = start({ count: 1 });
    expect(low.requested).toBe(MIN_PAIRS);
    expect(low.total).toBe(MIN_PAIRS);
  });
});

describe('conecta-pares logic — pendingGrades', () => {
  it('emits otra-vez only for unmatched cards while playing', () => {
    let state = start();
    for (const id of IDS.slice(0, 5)) {
      state = select(select(state, 'question', id), 'meaning', id);
    }
    expect(state.phase).toBe('playing');
    expect(pendingGrades(state)).toEqual([
      { cardId: 'q6', grade: 'otra-vez' },
      { cardId: 'q7', grade: 'otra-vez' },
      { cardId: 'q8', grade: 'otra-vez' },
    ]);
    const pending = pendingGrades(state);
    expect(pending.some((entry) => matchedIds(state).includes(entry.cardId))).toBe(false);
  });

  it('emits nothing in setup or after completing', () => {
    expect(pendingGrades(createState())).toEqual([]);

    let state = start();
    for (const id of IDS) {
      state = select(select(state, 'question', id), 'meaning', id);
    }
    expect(state.phase).toBe('complete');
    expect(pendingGrades(state)).toEqual([]);
    expect(pendingGrades(null)).toEqual([]);
  });
});

describe('conecta-pares logic — summarize', () => {
  it('reports pairs, errors, first tries and xp for a partial session', () => {
    let state = start();
    for (const id of ['q1', 'q2', 'q3', 'q4', 'q5']) {
      state = select(select(state, 'question', id), 'meaning', id);
    }

    state = select(select(state, 'question', 'q6'), 'meaning', 'q7');
    state = select(select(state, 'question', 'q6'), 'meaning', 'q6');

    state = select(select(state, 'question', 'q7'), 'meaning', 'q8');
    state = select(select(state, 'question', 'q7'), 'meaning', 'q8');
    state = select(select(state, 'question', 'q7'), 'meaning', 'q7');

    expect(state.phase).toBe('playing');
    expect(summarize(state)).toEqual({
      total: 8,
      matched: 7,
      errors: 3,
      firstTry: 5,
      xp: 100,
    });
  });

  it('returns a zeroed summary for an empty state', () => {
    expect(summarize(createState())).toEqual({
      total: 0,
      matched: 0,
      errors: 0,
      firstTry: 0,
      xp: 0,
    });
    expect(summarize(null)).toEqual({
      total: 0,
      matched: 0,
      errors: 0,
      firstTry: 0,
      xp: 0,
    });
  });
});
