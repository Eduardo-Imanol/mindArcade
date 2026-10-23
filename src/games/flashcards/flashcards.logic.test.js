import { describe, expect, it } from 'vitest';
import { createState, reduce } from './flashcards.logic.js';

const DECK = [{ id: 'a' }, { id: 'b' }];

function run(actions, deck = DECK) {
  return actions.reduce((state, action) => reduce(state, action, deck), createState(deck));
}

describe('flashcards reducer', () => {
  it('flip toggles, nav resets flip and clamps', () => {
    let state = run([{ type: 'flip' }, { type: 'flip' }]);
    expect(state.flipped).toBe(false);
    state = run([{ type: 'flip' }, { type: 'next' }]);
    expect(state).toMatchObject({ index: 1, flipped: false });
    state = run([{ type: 'next' }, { type: 'next' }]);
    expect(state.index).toBe(1);
    state = run([{ type: 'prev' }, { type: 'prev' }]);
    expect(state.index).toBe(0);
  });

  it('full session: flip → grade → advance → summary', () => {
    const state = run([
      { type: 'flip' },
      { type: 'grade', grade: 'facil', gained: 10 },
      { type: 'flip' },
      { type: 'grade', grade: 'otra-vez', gained: 0 },
    ]);
    expect(state).toMatchObject({ index: 1, flipped: false, correct: 1, wrong: 1, gained: 10, complete: true });
  });

  it('uses built-in gain map when host gain absent', () => {
    const state = run([{ type: 'grade', grade: 'dificil' }]);
    expect(state.gained).toBe(25);
  });

  it('single-card deck finishes after grade', () => {
    const state = run([{ type: 'grade', grade: 'dificil', gained: 25 }], [{ id: 'solo' }]);
    expect(state).toMatchObject({ index: 0, complete: true, correct: 1, gained: 25 });
  });

  it('empty deck is complete and reduce never throws', () => {
    expect(createState([]).complete).toBe(true);
    expect(reduce(undefined, { type: 'flip' }, []).complete).toBe(true);
    expect(reduce(createState(DECK), { type: 'unknown' }, DECK).index).toBe(0);
  });

  it('reset restarts the session', () => {
    const graded = run([{ type: 'grade', grade: 'facil' }]);
    const reset = reduce(graded, { type: 'reset' }, DECK);
    expect(reset).toEqual(createState(DECK));
  });
});

describe('flashcards deck session reducer', () => {
  it('start initializes the session deck and reset clears grades', () => {
    const started = reduce(createState([]), { type: 'start', deck: DECK, phase: 'playing' });
    expect(started).toMatchObject({ index: 0, complete: false, phase: 'playing' });
    expect(started.sessionDeck).toEqual(DECK);
    expect(started.gradedIds.size).toBe(0);

    const graded = reduce(started, { type: 'grade', grade: 'facil' }, []);
    const reset = reduce(graded, { type: 'reset' }, []);
    expect(reset.gradedIds.size).toBe(0);
    expect(reset.complete).toBe(false);
    expect(reset.sessionDeck).toEqual(DECK);
  });

  it('graded cards are never graded twice', () => {
    let state = run([{ type: 'grade', grade: 'facil', gained: 10 }]);
    expect(state.gradedIds.has('a')).toBe(true);
    expect(state).toMatchObject({ correct: 1, wrong: 0, gained: 10, index: 1 });

    state = reduce(state, { type: 'grade', cardId: 'a', grade: 'otra-vez', gained: 0 }, DECK);
    expect(state).toMatchObject({ correct: 1, wrong: 0, gained: 10, index: 1 });
    expect(state.gradedIds.size).toBe(1);

    state = reduce(state, { type: 'grade', cardId: 'a', grade: 'dificil', gained: 25 }, DECK);
    expect(state).toMatchObject({ correct: 1, wrong: 0, gained: 10, index: 1 });
  });

  it('does not complete until every card in the session is graded', () => {
    let state = run([{ type: 'grade', grade: 'facil', gained: 10 }]);
    expect(state.complete).toBe(false);

    state = reduce(state, { type: 'prev' }, DECK);
    expect(state.index).toBe(0);
    state = reduce(state, { type: 'grade', grade: 'otra-vez' }, DECK);
    expect(state.complete).toBe(false);

    state = reduce(state, { type: 'next' }, DECK);
    state = reduce(state, { type: 'grade', grade: 'facil', gained: 10 }, DECK);
    expect(state).toMatchObject({ complete: true, correct: 2, wrong: 0, gained: 20 });
  });

  it('returns to the next ungraded card when grading out of order', () => {
    let state = run([{ type: 'next' }]);
    state = reduce(state, { type: 'grade', grade: 'facil', gained: 10 }, DECK);
    expect(state).toMatchObject({ index: 0, complete: false, correct: 1 });
    expect(state.gradedIds.has('b')).toBe(true);

    state = reduce(state, { type: 'grade', grade: 'facil', gained: 10 }, DECK);
    expect(state).toMatchObject({ index: 0, complete: true, correct: 2 });
  });

  it('reveal sets the card face-up and flip keeps toggling', () => {
    let state = reduce(createState(DECK), { type: 'reveal' }, DECK);
    expect(state.flipped).toBe(true);
    state = reduce(state, { type: 'reveal' }, DECK);
    expect(state.flipped).toBe(true);
    state = reduce(state, { type: 'flip' }, DECK);
    expect(state.flipped).toBe(false);
  });

  it('complete finalizes the session without grading remaining cards', () => {
    const state = reduce(createState(DECK), { type: 'complete' }, DECK);
    expect(state).toMatchObject({ complete: true, flipped: false, correct: 0, wrong: 0 });
    expect(state.gradedIds.size).toBe(0);
  });
});
