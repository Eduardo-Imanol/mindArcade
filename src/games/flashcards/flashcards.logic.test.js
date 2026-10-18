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
