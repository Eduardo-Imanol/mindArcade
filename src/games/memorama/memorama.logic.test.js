import { describe, expect, it } from 'vitest';
import {
  DIFFICULTIES,
  buildTiles,
  createState,
  gradeFor,
  pairOptionsFor,
  pendingGrades,
  reduce,
  seenUnmatchedCardIds,
  sessionCardsFor,
  unmatchedCardIds,
} from './memorama.logic.js';

const PRESERVE = () => 0.999999;
const DECK = [
  { id: 'a', front: 'A', back: 'a' },
  { id: 'b', front: 'B', back: 'b' },
];

function run(actions, state) {
  return actions.reduce((current, action) => reduce(current, action), state);
}

describe('memorama buildTiles', () => {
  it('builds two tiles (front + back) per card and shuffles with injected random', () => {
    const tiles = buildTiles(DECK, PRESERVE);
    expect(tiles).toHaveLength(4);
    expect(tiles.map((tile) => `${tile.cardId}:${tile.face}`)).toEqual([
      'a:front',
      'a:back',
      'b:front',
      'b:back',
    ]);
    expect(tiles[0].text).toBe('A');
    expect(tiles[1].text).toBe('a');
  });
});

describe('memorama gradeFor', () => {
  it('maps attempts to SRS grades (contract)', () => {
    expect(gradeFor(0)).toBe('facil');
    expect(gradeFor(1)).toBe('facil');
    expect(gradeFor(2)).toBe('dificil');
    expect(gradeFor(3)).toBe('dificil');
    expect(gradeFor()).toBe('facil');
  });
});

describe('memorama reducer', () => {
  it('contract sequence: mismatch then match → attempts 1 and grade facil', () => {
    let state = createState(DECK, { random: PRESERVE });
    state = reduce(state, { type: 'flip', index: 0 });
    state = reduce(state, { type: 'flip', index: 2 });
    expect(state.locked).toBe(true);
    expect(state.attempts).toEqual({ a: 1, b: 1 });

    state = reduce(state, { type: 'close' });
    expect(state.locked).toBe(false);
    expect(state.open).toEqual([]);

    state = reduce(state, { type: 'flip', index: 0 });
    state = reduce(state, { type: 'flip', index: 1 });
    expect(state.matched).toEqual(['a']);
    expect(state.attempts.a).toBe(1);
    expect(state.lastMatch).toEqual({ seq: 1, cardId: 'a', grade: 'facil' });
    expect(state.open).toEqual([]);
  });

  it('grades dificil when matched after two mismatches', () => {
    let state = createState(DECK, { random: PRESERVE });
    state = run(
      [
        { type: 'flip', index: 0 },
        { type: 'flip', index: 2 },
        { type: 'close' },
        { type: 'flip', index: 0 },
        { type: 'flip', index: 3 },
        { type: 'close' },
        { type: 'flip', index: 0 },
        { type: 'flip', index: 1 },
      ],
      state
    );
    expect(state.attempts.a).toBe(2);
    expect(state.lastMatch).toEqual({ seq: 1, cardId: 'a', grade: 'dificil' });
  });

  it('ignores flips while two tiles are open (locked)', () => {
    let state = createState(DECK, { random: PRESERVE });
    state = reduce(state, { type: 'flip', index: 0 });
    state = reduce(state, { type: 'flip', index: 2 });
    const locked = state;
    expect(reduce(state, { type: 'flip', index: 3 })).toBe(locked);
    expect(reduce(state, { type: 'flip', index: 1 })).toBe(locked);
  });

  it('ignores re-flipping an already open tile and out-of-range indices', () => {
    let state = createState(DECK, { random: PRESERVE });
    state = reduce(state, { type: 'flip', index: 0 });
    expect(reduce(state, { type: 'flip', index: 0 })).toBe(state);
    expect(reduce(state, { type: 'flip', index: 99 })).toBe(state);
    expect(reduce(state, { type: 'flip', index: -1 })).toBe(state);
    expect(reduce(state, { type: 'nope' })).toBe(state);
  });

  it('completes when every card is matched and exposes no pending grades', () => {
    const state = run(
      [
        { type: 'flip', index: 0 },
        { type: 'flip', index: 1 },
        { type: 'flip', index: 2 },
        { type: 'flip', index: 3 },
      ],
      createState(DECK, { random: PRESERVE })
    );
    expect(state.complete).toBe(true);
    expect(state.matched).toEqual(['a', 'b']);
    expect(state.lastMatch).toEqual({ seq: 2, cardId: 'b', grade: 'facil' });
    expect(pendingGrades(state)).toEqual([]);
  });

  it('lists only seen unmatched cards as otra-vez (AC-12)', () => {
    let state = createState(DECK, { random: PRESERVE });
    expect(pendingGrades(state)).toEqual([]);

    state = reduce(state, { type: 'flip', index: 2 });
    expect(seenUnmatchedCardIds(state)).toEqual(['b']);
    expect(pendingGrades(state)).toEqual([{ cardId: 'b', grade: 'otra-vez' }]);

    state = run(
      [{ type: 'flip', index: 0 }, { type: 'flip', index: 1 }],
      createState(DECK, { random: PRESERVE })
    );
    expect(unmatchedCardIds(state)).toEqual(['b']);
    expect(pendingGrades(state)).toEqual([]);
  });

  it('empty deck is complete and reduce never throws', () => {
    expect(createState([]).complete).toBe(true);
    expect(reduce(createState([]), { type: 'flip', index: 0 }).complete).toBe(true);
    expect(reduce(undefined, { type: 'flip', index: 0 })).toBeUndefined();
    expect(createState([]).tiles).toEqual([]);
  });

  it('does not mutate the previous state', () => {
    const state = createState(DECK, { random: PRESERVE });
    const snapshot = JSON.parse(JSON.stringify(state));
    reduce(state, { type: 'flip', index: 0 });
    expect(state).toEqual(snapshot);
  });

  it('exposes the signed difficulty ladder (4/6/8)', () => {
    expect(DIFFICULTIES.map((option) => option.pairs)).toEqual([4, 6, 8]);
  });
});

describe('memorama decks (spec-18 T9)', () => {
  it('offers pair options capped to the deck size', () => {
    expect(pairOptionsFor(10).map((option) => option.pairs)).toEqual([4, 6, 8, 10]);
    expect(pairOptionsFor(7).map((option) => option.pairs)).toEqual([4, 6, 7]);
    expect(pairOptionsFor(5).map((option) => option.pairs)).toEqual([4, 5]);
    expect(pairOptionsFor(4).map((option) => option.pairs)).toEqual([4]);
    expect(pairOptionsFor(3)).toEqual([]);
    expect(pairOptionsFor()).toEqual([]);
  });

  it('selects pairs only inside the deck and the full deck in arcade', () => {
    const cards = Array.from({ length: 10 }, (_, index) => ({ id: `c${index}`, front: 'f', back: 'b' }));
    expect(sessionCardsFor(cards, { mode: 'normal', pairs: 6 })).toHaveLength(6);
    expect(sessionCardsFor(cards, { mode: 'normal', pairs: 99 })).toHaveLength(10);
    expect(sessionCardsFor(cards, { mode: 'arcade', pairs: 4 })).toHaveLength(10);
    expect(sessionCardsFor(cards, { mode: 'normal', pairs: 4 })[0].id).toBe('c0');
  });
});
