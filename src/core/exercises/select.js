// src/core/exercises/select.js — selección determinista de ejercicios (spec-21 T1/T2).
export const EXERCISE_COUNTS = Object.freeze({
  facil: 2,
  medio: 4,
  dificil: 6,
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLearned(entry) {
  if (!isObject(entry)) return false;
  return entry.done === true || Number(entry.correct) > 0;
}

function hasAttempt(entry) {
  if (!isObject(entry)) return false;
  return Number(entry.attempts) > 0 || isLearned(entry);
}

export function resolveDeckProgress(progress, deckNumber) {
  if (!isObject(progress)) return {};
  const key = String(deckNumber);
  if (isObject(progress[key])) return progress[key];
  const numericKey = Number(deckNumber);
  if (Number.isInteger(numericKey) && isObject(progress[numericKey])) return progress[numericKey];
  const entries = Object.values(progress);
  if (entries.some((entry) => isObject(entry) && (hasAttempt(entry) || 'done' in entry))) {
    return progress;
  }
  return {};
}

export function findExerciseDeck(data, deckNumber) {
  const decks = asArray(data?.decks);
  return decks.find((deck) => isObject(deck) && Number(deck.number) === Number(deckNumber)) || null;
}

export function countExercises(data, deckNumber) {
  return asArray(findExerciseDeck(data, deckNumber)?.exercises).length;
}

export function pendingFirst(exercises, progress) {
  const list = asArray(exercises).filter(isObject);
  const map = isObject(progress) ? progress : {};
  const pending = [];
  const learned = [];
  for (const exercise of list) {
    if (isLearned(map[exercise.id])) learned.push(exercise);
    else pending.push(exercise);
  }
  return [...pending, ...learned];
}

function targetCount(options) {
  const explicit = Number(options?.count);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  const difficulty = options?.difficulty;
  if (typeof difficulty === 'string' && EXERCISE_COUNTS[difficulty] !== undefined) {
    return EXERCISE_COUNTS[difficulty];
  }
  return null;
}

export function selectExercises(data, deckNumber, options = {}) {
  const deck = findExerciseDeck(data, deckNumber);
  if (!deck) return [];
  const progress = resolveDeckProgress(options.progress, deckNumber);
  const ordered = pendingFirst(deck.exercises, progress);
  const count = targetCount(options);
  return count === null ? ordered : ordered.slice(0, count);
}

export function exercisesForDifficulty(data, deckNumber, difficulty, progress) {
  return selectExercises(data, deckNumber, { difficulty, progress });
}

export function hasExerciseDocument(data) {
  return isObject(data) && asArray(data.decks).some((deck) => asArray(deck?.exercises).length > 0);
}
