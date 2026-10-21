import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_DAYS,
  GRADE_XP,
  bestStreak,
  dayKey,
  getActivity,
  getGlobalMetrics,
  getTopicMetrics,
} from './metrics.js';

const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);
const DAY = 86400000;

const ALPHA_CARDS = Array.from({ length: 10 }, (_, index) => ({ id: `c${index + 1}` }));
const ALPHA = { id: 'alpha', title: 'Funciones', cards: ALPHA_CARDS };
const BETA = {
  id: 'beta',
  title: 'Idiomas',
  cards: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }, { id: 'b4' }],
};

const SRS = {
  alpha: {
    c1: { reps: 3, interval: 1, ease: 2.5, nextReview: NOW - DAY },
    c2: { reps: 4, interval: 6, ease: 2.5, nextReview: NOW - 1000 },
    c3: { reps: 3, interval: 6, ease: 2.5, nextReview: NOW + DAY },
    c4: { reps: 5, interval: 10, ease: 2.5, nextReview: NOW + 7 * DAY },
    c5: { reps: 1, interval: 1, ease: 2.5, nextReview: NOW + DAY },
    c6: { reps: 2, interval: 1, ease: 2.5, nextReview: NOW + DAY },
    c7: { reps: 2, nextReview: NaN },
  },
  beta: {
    b1: { reps: 3, interval: 1, ease: 2.5, nextReview: NOW - 500 },
    b2: { reps: 1, interval: 1, ease: 2.5, nextReview: NOW + DAY },
  },
};

const HISTORY = [
  { topicId: 'alpha', cardId: 'c1', grade: 'facil', xp: 10, at: '2026-10-19T10:00:00.000Z' },
  { topicId: 'alpha', cardId: 'c2', grade: 'facil', at: '2026-10-19T11:00:00.000Z' },
  { topicId: 'alpha', cardId: 'c5', grade: 'otra-vez', at: '2026-10-19T12:00:00.000Z' },
  { topicId: 'alpha', cardId: 'c1', grade: 'dificil', xp: 25, at: '2026-10-20T09:00:00.000Z' },
  { topicId: 'alpha', cardId: 'c3', grade: 'facil', xp: 10, at: '2026-10-20T10:00:00.000Z' },
  { topicId: 'beta', cardId: 'b1', grade: 'facil', at: '2026-10-17T09:00:00.000Z' },
  { topicId: 'beta', cardId: 'b2', grade: 'dificil', xp: 25, at: '2026-10-18T09:00:00.000Z' },
  { topicId: 'borrado', cardId: 'x', grade: 'facil', xp: 10, at: '2026-10-16T09:00:00.000Z' },
  { cardId: 'c9', grade: 'facil', xp: 10, at: '2026-10-19T13:00:00.000Z' },
  { topicId: 'alpha', grade: 'facil', xp: 10, at: 'no-importa' },
  'garbage',
  null,
];

const ALPHA_EXPECTED = {
  total: 10,
  learned: 4,
  learning: 3,
  new: 3,
  notLearned: 6,
  dueNow: 2,
  progress: 0.4,
  daysStudied: 2,
  attempts: 5,
  correct: 4,
  accuracy: 0.8,
  firstStudiedAt: '2026-10-19T10:00:00.000Z',
  lastStudiedAt: '2026-10-20T10:00:00.000Z',
  xp: 55,
};

describe('dayKey', () => {
  it('uses UTC day boundaries', () => {
    expect(dayKey('2026-10-20T23:59:59.999Z')).toBe('2026-10-20');
    expect(dayKey('2026-10-20T00:30:00+02:00')).toBe('2026-10-19');
    expect(dayKey(NOW)).toBe('2026-10-20');
    expect(dayKey(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01');
  });

  it('returns null for invalid input instead of throwing', () => {
    expect(dayKey('no-importa')).toBeNull();
    expect(dayKey(undefined)).toBeNull();
    expect(dayKey(null)).toBeNull();
    expect(dayKey('')).toBeNull();
    expect(dayKey(NaN)).toBeNull();
  });
});

describe('bestStreak', () => {
  it('measures the longest consecutive run of unique days', () => {
    expect(
      bestStreak(['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'])
    ).toBe(4);
    expect(
      bestStreak([
        '2026-10-01',
        '2026-10-02',
        '2026-10-05',
        '2026-10-06',
        '2026-10-07',
        '2026-10-07',
      ])
    ).toBe(3);
    expect(bestStreak(['2026-10-03'])).toBe(1);
    expect(bestStreak([])).toBe(0);
    expect(bestStreak(['no-importa', null])).toBe(0);
    expect(bestStreak()).toBe(0);
    expect(
      bestStreak(['2026-10-31', '2026-11-01', '2026-11-02'])
    ).toBe(3);
  });
});

describe('getTopicMetrics', () => {
  it('returns the exact AC-16 shape for the 10-card fixture', () => {
    expect(getTopicMetrics(ALPHA, SRS, HISTORY, NOW)).toEqual(ALPHA_EXPECTED);
  });

  it('computes precision, progress and XP legacy derivation', () => {
    const metrics = getTopicMetrics(ALPHA, SRS, HISTORY, NOW);
    expect(metrics.accuracy).toBe(0.8);
    expect(metrics.progress).toBe(0.4);
    expect(metrics.xp).toBe(55);
    expect(GRADE_XP).toEqual({ facil: 10, dificil: 25, 'otra-vez': 0 });
  });

  it('handles a topic without attempts and a single attempt', () => {
    expect(getTopicMetrics(BETA, {}, [], NOW)).toEqual({
      total: 4,
      learned: 0,
      learning: 0,
      new: 4,
      notLearned: 4,
      dueNow: 0,
      progress: 0,
      daysStudied: 0,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      firstStudiedAt: null,
      lastStudiedAt: null,
      xp: 0,
    });

    const single = getTopicMetrics(BETA, {}, [
      { topicId: 'beta', grade: 'dificil', at: '2026-10-20T08:00:00.000Z' },
    ], NOW);
    expect(single.attempts).toBe(1);
    expect(single.correct).toBe(1);
    expect(single.accuracy).toBe(1);
    expect(single.xp).toBe(25);
    expect(single.daysStudied).toBe(1);
    expect(single.firstStudiedAt).toBe('2026-10-20T08:00:00.000Z');
    expect(single.lastStudiedAt).toBe('2026-10-20T08:00:00.000Z');
  });

  it('ignores corrupt history, entries without topicId and without valid at', () => {
    const corrupt = getTopicMetrics(ALPHA, null, 'no-array', NOW);
    expect(corrupt.attempts).toBe(0);
    expect(corrupt.xp).toBe(0);
    expect(corrupt.daysStudied).toBe(0);

    const noTopicId = getTopicMetrics(ALPHA, SRS, [
      { cardId: 'c1', grade: 'facil', xp: 10, at: '2026-10-19T10:00:00.000Z' },
      { topicId: '', grade: 'facil', at: '2026-10-19T10:00:00.000Z' },
      { topicId: 'beta', grade: 'facil', xp: 10, at: '2026-10-19T10:00:00.000Z' },
    ], NOW);
    expect(noTopicId.attempts).toBe(0);
    expect(noTopicId.xp).toBe(0);
  });

  it('counts a failed card as new again and invalid nextReview as not due', () => {
    const metrics = getTopicMetrics(
      { id: 'g', cards: [{ id: 'a' }, { id: 'b' }] },
      { g: { a: { reps: 0 }, b: { reps: 3, nextReview: 'x' } } },
      [],
      NOW
    );
    expect(metrics.new).toBe(1);
    expect(metrics.learned).toBe(1);
    expect(metrics.dueNow).toBe(0);
    expect(metrics.notLearned).toBe(1);
    expect(metrics.progress).toBe(0.5);
  });

  it('never throws on malformed topic or srs shapes', () => {
    expect(() => getTopicMetrics(undefined, undefined, undefined, NOW)).not.toThrow();
    expect(() => getTopicMetrics(null, { x: 'y' }, [1, 2], NOW)).not.toThrow();
    expect(getTopicMetrics({ id: 'x', cards: 'nope' }, {}, [], NOW).total).toBe(0);
  });
});

describe('getActivity', () => {
  it('returns 14 UTC days including zeros, oldest first', () => {
    const activity = getActivity(HISTORY, 14, NOW);
    expect(activity).toHaveLength(ACTIVITY_DAYS);
    expect(activity[0]).toEqual({ date: '2026-10-07', attempts: 0, correct: 0 });
    expect(activity[13]).toEqual({ date: '2026-10-20', attempts: 2, correct: 2 });
    expect(activity.find((day) => day.date === '2026-10-16')).toEqual({
      date: '2026-10-16',
      attempts: 1,
      correct: 1,
    });
    expect(activity.find((day) => day.date === '2026-10-17')).toEqual({
      date: '2026-10-17',
      attempts: 1,
      correct: 1,
    });
    expect(activity.find((day) => day.date === '2026-10-19')).toEqual({
      date: '2026-10-19',
      attempts: 3,
      correct: 2,
    });
    expect(activity.every((day) => typeof day.attempts === 'number')).toBe(true);
  });

  it('supports a custom window and corrupt history', () => {
    const week = getActivity(HISTORY, 7, NOW);
    expect(week).toHaveLength(7);
    expect(week[6].date).toBe('2026-10-20');
    expect(getActivity('no-array', 14, NOW)).toHaveLength(14);
    expect(getActivity([], 0, NOW)).toHaveLength(ACTIVITY_DAYS);
    expect(getActivity([], 14, NOW).every((day) => day.attempts === 0)).toBe(true);
  });
});

describe('getGlobalMetrics', () => {
  const PROFILE = { xp: 90, streak: 3, lastDay: '2026-10-20' };

  it('aggregates two topics with unique days, streaks and 14-day activity', () => {
    const global = getGlobalMetrics([ALPHA, BETA], SRS, HISTORY, PROFILE, NOW);
    expect(global).toMatchObject({
      total: 14,
      learned: 5,
      learning: 4,
      new: 5,
      notLearned: 9,
      dueNow: 3,
      daysStudied: 4,
      attempts: 7,
      correct: 6,
      xp: 90,
      currentStreak: 3,
      bestStreak: 4,
      firstStudiedAt: '2026-10-17T09:00:00.000Z',
      lastStudiedAt: '2026-10-20T10:00:00.000Z',
    });
    expect(global.progress).toBe(5 / 14);
    expect(global.accuracy).toBe(6 / 7);
    expect(global.topics).toHaveLength(2);
    expect(global.topics[0]).toEqual(ALPHA_EXPECTED);
    expect(global.activity).toHaveLength(14);
    expect(global.activity[0].date).toBe('2026-10-07');
    expect(global.activity.filter((day) => day.attempts === 0)).toHaveLength(10);
    expect(global.activity.find((day) => day.date === '2026-10-16').attempts).toBe(0);
  });

  it('prefers profile.xp but derives XP from attempts when it is missing or corrupt', () => {
    const withProfile = getGlobalMetrics([ALPHA, BETA], SRS, HISTORY, PROFILE, NOW);
    expect(withProfile.xp).toBe(90);

    const noXp = getGlobalMetrics([ALPHA, BETA], SRS, HISTORY, { streak: 1 }, NOW);
    expect(noXp.xp).toBe(90);
    expect(noXp.currentStreak).toBe(1);

    const corruptProfile = getGlobalMetrics([ALPHA, BETA], SRS, HISTORY, 'nope', NOW);
    expect(corruptProfile.xp).toBe(90);
    expect(corruptProfile.currentStreak).toBe(0);

    const negative = getGlobalMetrics([ALPHA], SRS, HISTORY, { xp: -5, streak: -2 }, NOW);
    expect(negative.xp).toBe(55);
    expect(negative.currentStreak).toBe(0);
  });

  it('ignores attempts from topics that are not in the catalog', () => {
    const global = getGlobalMetrics([ALPHA], SRS, HISTORY, PROFILE, NOW);
    expect(global.attempts).toBe(5);
    expect(global.daysStudied).toBe(2);
    expect(global.bestStreak).toBe(2);
    expect(global.activity.find((day) => day.date === '2026-10-16').attempts).toBe(0);
    expect(global.xp).toBe(90);
  });

  it('survives empty catalogs and corrupt inputs with zeroed metrics', () => {
    const empty = getGlobalMetrics([], {}, 'corrupt', null, NOW);
    expect(empty).toMatchObject({
      total: 0,
      learned: 0,
      learning: 0,
      new: 0,
      notLearned: 0,
      dueNow: 0,
      progress: 0,
      daysStudied: 0,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      firstStudiedAt: null,
      lastStudiedAt: null,
      xp: 0,
      currentStreak: 0,
      bestStreak: 0,
    });
    expect(empty.topics).toEqual([]);
    expect(empty.activity).toHaveLength(14);
    expect(empty.activity.every((day) => day.attempts === 0 && day.correct === 0)).toBe(true);

    const undefinedArgs = getGlobalMetrics(undefined, undefined, undefined, undefined, NOW);
    expect(undefinedArgs.attempts).toBe(0);
    expect(undefinedArgs.topics).toEqual([]);
  });
});
