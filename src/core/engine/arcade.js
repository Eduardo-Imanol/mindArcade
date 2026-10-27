// src/core/engine/arcade.js — shared arcade lives/score rules (pure, spec-18)
export const ARCADE_LIVES = 3;
export const BASE_POINTS = 100;
export const STREAK_STEP = 10;
export const STREAK_CAP = 100;
export const LIFE_BONUS = 50;

function finiteInt(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function normalizeArcade(state) {
  const source = state && typeof state === 'object' ? state : {};
  return {
    lives: Math.min(ARCADE_LIVES, finiteInt(source.lives, ARCADE_LIVES)),
    score: finiteInt(source.score, 0),
    streak: finiteInt(source.streak, 0),
    correct: finiteInt(source.correct, 0),
    wrong: finiteInt(source.wrong, 0),
    over: Boolean(source.over),
    completed: Boolean(source.completed),
  };
}

export function createArcade() {
  return {
    lives: ARCADE_LIVES,
    score: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    over: false,
    completed: false,
  };
}

export function pointsFor(streak = 0) {
  const current = finiteInt(streak, 0);
  return BASE_POINTS + Math.min(STREAK_CAP, STREAK_STEP * current);
}

export function arcadeHit(state) {
  const current = normalizeArcade(state);
  if (current.over) return current;
  return {
    ...current,
    score: current.score + pointsFor(current.streak),
    streak: current.streak + 1,
    correct: current.correct + 1,
  };
}

export function arcadeMiss(state) {
  const current = normalizeArcade(state);
  if (current.over) return current;
  const lives = Math.max(0, current.lives - 1);
  return {
    ...current,
    lives,
    streak: 0,
    wrong: current.wrong + 1,
    over: lives === 0,
  };
}

export function arcadeFinish(state) {
  const current = normalizeArcade(state);
  if (current.over || current.completed) return current;
  return {
    ...current,
    score: current.score + current.lives * LIFE_BONUS,
    completed: true,
    over: true,
  };
}

export function arcadeSnapshot(state) {
  return { ...normalizeArcade(state) };
}
