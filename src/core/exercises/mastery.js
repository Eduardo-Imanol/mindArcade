// src/core/exercises/mastery.js — estados, nivel de mazo y selección (spec-21 T2).
// Puro: no importa storage, React ni DOM.
import { resolveDeckProgress } from './select.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function normalizeId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

export const EXERCISE_STATUS = Object.freeze({
  NEW: 'no-intentado',
  PROGRESS: 'en-progreso',
  LEARNED: 'aprendido',
});

export const DECK_EXERCISE_STATUS = Object.freeze({
  NEW: 'no-iniciado',
  PROGRESS: 'en-progreso',
  COMPLETE: 'completado',
});

export function exerciseStatus(entry) {
  if (!isObject(entry)) return EXERCISE_STATUS.NEW;
  if (entry.done === true || Number(entry.correct) > 0) return EXERCISE_STATUS.LEARNED;
  if (Number(entry.attempts) > 0) return EXERCISE_STATUS.PROGRESS;
  return EXERCISE_STATUS.NEW;
}

export function pendingFirst(exercises, progress) {
  const map = isObject(progress) ? progress : {};
  const pending = [];
  const learned = [];
  for (const exercise of asArray(exercises)) {
    if (!isObject(exercise) || !normalizeId(exercise.id)) continue;
    if (exerciseStatus(map[exercise.id]) === EXERCISE_STATUS.LEARNED) learned.push(exercise);
    else pending.push(exercise);
  }
  return [...pending, ...learned];
}

export function deckExerciseMastery(deckNumber, exercises, progress) {
  const list = asArray(exercises).filter((exercise) => isObject(exercise) && normalizeId(exercise.id));
  const map = resolveDeckProgress(progress, deckNumber);
  const learnedIds = [];
  let attempted = 0;
  for (const exercise of list) {
    const status = exerciseStatus(map[exercise.id]);
    if (status === EXERCISE_STATUS.LEARNED) learnedIds.push(exercise.id);
    if (status !== EXERCISE_STATUS.NEW) attempted += 1;
  }
  const total = list.length;
  const done = learnedIds.length;
  let status = DECK_EXERCISE_STATUS.NEW;
  if (total > 0 && done === total) status = DECK_EXERCISE_STATUS.COMPLETE;
  else if (attempted > 0) status = DECK_EXERCISE_STATUS.PROGRESS;
  return { status, done, total, learnedIds };
}

function sanitizeEntry(entry) {
  if (!isObject(entry)) return { attempts: 0, correct: 0, done: false, updatedAt: null };
  const attempts = isInteger(entry.attempts) ? Number(entry.attempts) : 0;
  const correctRaw = isInteger(entry.correct) ? Number(entry.correct) : 0;
  const correct = Math.min(correctRaw, attempts);
  const done = entry.done === true || correct > 0;
  const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : null;
  return { attempts, correct, done, updatedAt };
}

export function recordExerciseAttempt(progress, run, now = Date.now()) {
  const base = isObject(progress) ? progress : {};
  if (!isObject(run)) return { ...base };
  const topicId = normalizeId(run.topicId);
  const exerciseId = normalizeId(run.exerciseId);
  const deckNumber = Number(run.deckNumber);
  if (!topicId || !exerciseId || !Number.isInteger(deckNumber) || deckNumber < 1) return { ...base };

  const topic = isObject(base[topicId]) ? base[topicId] : {};
  const deckKey = String(deckNumber);
  const deck = isObject(topic[deckKey]) ? topic[deckKey] : {};
  const previous = sanitizeEntry(deck[exerciseId]);
  const attempts = previous.attempts + 1;
  const correct = previous.correct + (run.correct ? 1 : 0);
  const at = Number.isFinite(Number(now)) ? new Date(Number(now)) : new Date();
  const entry = {
    attempts,
    correct,
    done: previous.done || correct > 0,
    updatedAt: Number.isNaN(at.getTime()) ? new Date().toISOString() : at.toISOString(),
  };

  return {
    ...base,
    [topicId]: {
      ...topic,
      [deckKey]: {
        ...deck,
        [exerciseId]: entry,
      },
    },
  };
}
