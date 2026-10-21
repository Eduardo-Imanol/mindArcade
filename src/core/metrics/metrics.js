// src/core/metrics/metrics.js — derived metrics from catalog + SRS + history (pure, spec-12)
// Never persists: everything comes from sepect.srs.v1 + sepect.profile.v1.history.
// Day boundaries use UTC keys, consistent with recordStreak.
import { getCardLearningState } from '../repetition/learning.js';

export const GRADE_XP = { facil: 10, dificil: 25, 'otra-vez': 0 };
export const ACTIVITY_DAYS = 14;
const DAY_MS = 86400000;

function resolveNow(now) {
  return Number.isFinite(Number(now)) ? Number(now) : Date.now();
}

export function dayKey(at) {
  if (at === null || at === undefined || at === '') return null;
  const date = new Date(at);
  const time = date.getTime();
  return Number.isFinite(time) ? date.toISOString().slice(0, 10) : null;
}

function isValidAttempt(attempt) {
  return Boolean(
    attempt &&
      typeof attempt === 'object' &&
      typeof attempt.topicId === 'string' &&
      attempt.topicId.length > 0 &&
      dayKey(attempt.at)
  );
}

function filterAttempts(history) {
  return Array.isArray(history) ? history.filter(isValidAttempt) : [];
}

function xpOf(attempt) {
  if (typeof attempt.xp === 'number' && Number.isFinite(attempt.xp)) return attempt.xp;
  return GRADE_XP[attempt.grade] ?? 0;
}

function isCorrect(attempt) {
  return attempt.grade === 'facil' || attempt.grade === 'dificil';
}

function isDue(state, now) {
  const nextReview = Number(state ? state.nextReview : NaN);
  return Number.isFinite(nextReview) && nextReview <= now;
}

function topicSrsOf(srs, topicId) {
  const entry = srs && typeof srs === 'object' ? srs[topicId] : null;
  return entry && typeof entry === 'object' ? entry : {};
}

function summarizeAttempts(attempts) {
  const count = attempts.length;
  const correct = attempts.filter(isCorrect).length;
  const days = new Set();
  let xp = 0;
  let first = null;
  let last = null;
  let firstTime = Number.POSITIVE_INFINITY;
  let lastTime = Number.NEGATIVE_INFINITY;
  for (const attempt of attempts) {
    xp += xpOf(attempt);
    const key = dayKey(attempt.at);
    if (key) days.add(key);
    const time = new Date(attempt.at).getTime();
    if (time < firstTime) {
      firstTime = time;
      first = attempt.at;
    }
    if (time > lastTime) {
      lastTime = time;
      last = attempt.at;
    }
  }
  return {
    attempts: count,
    correct,
    accuracy: count > 0 ? correct / count : 0,
    daysStudied: days.size,
    firstStudiedAt: count > 0 ? first : null,
    lastStudiedAt: count > 0 ? last : null,
    xp,
    days,
  };
}

export function bestStreak(days = []) {
  const keys = [
    ...new Set((Array.isArray(days) ? days : []).filter((key) => typeof key === 'string' && key)),
  ].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of keys) {
    const time = Date.parse(`${key}T00:00:00Z`);
    if (!Number.isFinite(time)) continue;
    run = prev !== null && time - prev === DAY_MS ? run + 1 : 1;
    if (run > best) best = run;
    prev = time;
  }
  return best;
}

export function getActivity(history = [], days = ACTIVITY_DAYS, now = Date.now()) {
  const span = Number.isFinite(Number(days)) && Number(days) > 0 ? Math.floor(Number(days)) : ACTIVITY_DAYS;
  const reference = resolveNow(now);
  const totals = new Map();
  for (const attempt of filterAttempts(history)) {
    const key = dayKey(attempt.at);
    if (!key) continue;
    const counted = totals.get(key) || { attempts: 0, correct: 0 };
    counted.attempts += 1;
    if (isCorrect(attempt)) counted.correct += 1;
    totals.set(key, counted);
  }
  const nowDate = new Date(reference);
  const end = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate());
  const activity = [];
  for (let offset = span - 1; offset >= 0; offset -= 1) {
    const date = new Date(end - offset * DAY_MS).toISOString().slice(0, 10);
    const counted = totals.get(date);
    activity.push({
      date,
      attempts: counted ? counted.attempts : 0,
      correct: counted ? counted.correct : 0,
    });
  }
  return activity;
}

export function getTopicMetrics(topic, srs, history, now = Date.now()) {
  const reference = resolveNow(now);
  const cards = Array.isArray(topic && topic.cards) ? topic.cards : [];
  const topicSrs = topicSrsOf(srs, topic ? topic.id : undefined);
  let learned = 0;
  let learning = 0;
  let fresh = 0;
  let dueNow = 0;
  for (const card of cards) {
    const state = topicSrs[card ? card.id : undefined];
    const stage = getCardLearningState(state);
    if (stage === 'learned') {
      learned += 1;
      if (isDue(state, reference)) dueNow += 1;
    } else if (stage === 'learning') {
      learning += 1;
    } else {
      fresh += 1;
    }
  }
  const topicId = topic ? topic.id : undefined;
  const attempts = filterAttempts(history).filter((attempt) => attempt.topicId === topicId);
  const summary = summarizeAttempts(attempts);
  const total = cards.length;
  return {
    total,
    learned,
    learning,
    new: fresh,
    notLearned: learning + fresh,
    dueNow,
    progress: total > 0 ? learned / total : 0,
    daysStudied: summary.daysStudied,
    attempts: summary.attempts,
    correct: summary.correct,
    accuracy: summary.accuracy,
    firstStudiedAt: summary.firstStudiedAt,
    lastStudiedAt: summary.lastStudiedAt,
    xp: summary.xp,
  };
}

export function getGlobalMetrics(topics, srs, history, profile, now = Date.now()) {
  const reference = resolveNow(now);
  const list = Array.isArray(topics) ? topics : [];
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const known = new Set(list.map((topic) => topic && topic.id));
  const scoped = filterAttempts(history).filter((attempt) => known.has(attempt.topicId));
  const perTopic = list.map((topic) => getTopicMetrics(topic, srs, scoped, reference));
  const summary = summarizeAttempts(scoped);

  let total = 0;
  let learned = 0;
  let learning = 0;
  let fresh = 0;
  let notLearned = 0;
  let dueNow = 0;
  for (const metrics of perTopic) {
    total += metrics.total;
    learned += metrics.learned;
    learning += metrics.learning;
    fresh += metrics.new;
    notLearned += metrics.notLearned;
    dueNow += metrics.dueNow;
  }

  const profileXp = Number(safeProfile.xp);
  const streak = Number(safeProfile.streak);

  return {
    total,
    learned,
    learning,
    new: fresh,
    notLearned,
    dueNow,
    progress: total > 0 ? learned / total : 0,
    daysStudied: summary.daysStudied,
    attempts: summary.attempts,
    correct: summary.correct,
    accuracy: summary.accuracy,
    firstStudiedAt: summary.firstStudiedAt,
    lastStudiedAt: summary.lastStudiedAt,
    xp: Number.isFinite(profileXp) && profileXp >= 0 ? profileXp : summary.xp,
    currentStreak: Number.isFinite(streak) && streak > 0 ? Math.floor(streak) : 0,
    bestStreak: bestStreak([...summary.days]),
    topics: perTopic,
    activity: getActivity(scoped, ACTIVITY_DAYS, reference),
  };
}
