import { describe, expect, it } from 'vitest';
import {
  ARCADE_LIVES,
  BASE_POINTS,
  LIFE_BONUS,
  STREAK_CAP,
  arcadeFinish,
  arcadeHit,
  arcadeMiss,
  arcadeSnapshot,
  createArcade,
  pointsFor,
} from './arcade.js';

describe('arcade rules', () => {
  it('starts with 3 lives and zero score', () => {
    expect(ARCADE_LIVES).toBe(3);
    expect(createArcade()).toEqual({
      lives: 3,
      score: 0,
      streak: 0,
      correct: 0,
      wrong: 0,
      over: false,
      completed: false,
    });
  });

  it('scores a hit and grows the streak until the cap', () => {
    expect(pointsFor(0)).toBe(BASE_POINTS);
    expect(pointsFor(3)).toBe(BASE_POINTS + 30);
    expect(pointsFor(100)).toBe(BASE_POINTS + STREAK_CAP);

    let state = createArcade();
    state = arcadeHit(state);
    expect(state).toMatchObject({ score: 100, streak: 1, correct: 1, wrong: 0 });
    state = arcadeHit(state);
    expect(state).toMatchObject({ score: 210, streak: 2, correct: 2 });
  });

  it('caps the streak bonus at 100 points', () => {
    let state = { ...createArcade(), streak: 50 };
    state = arcadeHit(state);
    expect(state.score).toBe(BASE_POINTS + STREAK_CAP);
    expect(state.streak).toBe(51);
  });

  it('a miss removes a life, resets the streak and ends at zero lives', () => {
    let state = arcadeHit(arcadeHit(createArcade()));
    state = arcadeMiss(state);
    expect(state).toMatchObject({ lives: 2, streak: 0, wrong: 1, over: false });
    state = arcadeMiss(state);
    expect(state).toMatchObject({ lives: 1, wrong: 2, over: false });
    state = arcadeMiss(state);
    expect(state).toMatchObject({ lives: 0, wrong: 3, over: true });
  });

  it('does not score or change state after the run is over', () => {
    const over = { ...createArcade(), lives: 0, over: true, score: 250, streak: 4 };
    expect(arcadeHit(over)).toEqual(over);
    expect(arcadeMiss(over)).toEqual(over);
    expect(arcadeFinish(over)).toEqual(over);
  });

  it('finishes a completed deck with the remaining-lives bonus', () => {
    const state = { ...createArcade(), score: 420 };
    const finished = arcadeFinish(state);
    expect(finished.score).toBe(420 + 3 * LIFE_BONUS);
    expect(finished).toMatchObject({ completed: true, over: true, lives: 3 });
    expect(arcadeFinish(finished)).toEqual(finished);
  });

  it('never adds a life bonus when the run ends with zero lives', () => {
    const over = { ...createArcade(), lives: 0, over: true, score: 200 };
    expect(arcadeFinish(over)).toEqual(over);
  });

  it('returns a safe serializable snapshot', () => {
    const snapshot = arcadeSnapshot({ lives: '2', score: 12.9, streak: -4, wrong: 'x' });
    expect(snapshot).toEqual({
      lives: 2,
      score: 12,
      streak: 0,
      correct: 0,
      wrong: 0,
      over: false,
      completed: false,
    });
    expect(() => JSON.stringify(snapshot)).not.toThrow();
  });
});
