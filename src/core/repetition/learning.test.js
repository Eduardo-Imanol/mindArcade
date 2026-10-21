import { describe, expect, it } from 'vitest';
import { LEARNED_REPS, getCardLearningState } from './learning.js';

describe('getCardLearningState', () => {
  it('maps the documented reps ladder to new|learning|learned', () => {
    expect(getCardLearningState(undefined)).toBe('new');
    expect(getCardLearningState({ reps: 0 })).toBe('new');
    expect(getCardLearningState({ reps: 1 })).toBe('learning');
    expect(getCardLearningState({ reps: 2 })).toBe('learning');
    expect(getCardLearningState({ reps: 3 })).toBe('learned');
    expect(getCardLearningState({ reps: 9 })).toBe('learned');
  });

  it('normalizes invalid, negative and non-numeric reps without throwing', () => {
    expect(getCardLearningState(null)).toBe('new');
    expect(getCardLearningState({})).toBe('new');
    expect(getCardLearningState({ reps: -1 })).toBe('new');
    expect(getCardLearningState({ reps: -3 })).toBe('new');
    expect(getCardLearningState({ reps: 'x' })).toBe('new');
    expect(getCardLearningState({ reps: NaN })).toBe('new');
    expect(getCardLearningState({ reps: Infinity })).toBe('new');
    expect(getCardLearningState({ reps: null })).toBe('new');
    expect(getCardLearningState({ reps: '4' })).toBe('learned');
    expect(getCardLearningState({ reps: 2.9 })).toBe('learning');
  });

  it('exposes LEARNED_REPS = 3', () => {
    expect(LEARNED_REPS).toBe(3);
  });
});
