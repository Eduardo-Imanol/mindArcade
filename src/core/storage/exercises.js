// src/core/storage/exercises.js — progreso de ejercicios cuota-seguro (spec-21 T2).
// Única capa que toca sepect.exercises.v1; no lee ni escribe sepect.srs.v1.
import { recordExerciseAttempt } from '../exercises/mastery.js';

export const EXERCISES_KEY = 'sepect.exercises.v1';

function backendOf(backend) {
  if (backend) return backend;
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function sanitizeCount(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function sanitizeDate(value) {
  if (typeof value === 'string') {
    const time = Date.parse(value);
    if (Number.isFinite(time)) return new Date(time).toISOString();
  }
  if (Number.isFinite(Number(value)) && value !== null && value !== '') {
    return new Date(Number(value)).toISOString();
  }
  return null;
}

function sanitizeEntry(value) {
  if (!isObject(value)) return null;
  const attempts = sanitizeCount(value.attempts);
  const correct = Math.min(sanitizeCount(value.correct), attempts);
  const done = value.done === true || correct > 0;
  if (attempts === 0 && !done) return null;
  return {
    attempts,
    correct,
    done,
    updatedAt: sanitizeDate(value.updatedAt),
  };
}

function sanitizeDeck(value) {
  if (!isObject(value)) return null;
  const out = {};
  for (const [exerciseId, entry] of Object.entries(value)) {
    const id = sanitizeId(exerciseId);
    const clean = sanitizeEntry(entry);
    if (id && clean) out[id] = clean;
  }
  return Object.keys(out).length ? out : null;
}

function sanitizeTopic(value) {
  if (!isObject(value)) return null;
  const out = {};
  for (const [deckKey, deck] of Object.entries(value)) {
    const number = Number(deckKey);
    if (!Number.isInteger(number) || number < 1) continue;
    const clean = sanitizeDeck(deck);
    if (clean) out[String(number)] = clean;
  }
  return Object.keys(out).length ? out : null;
}

export function normalizeExerciseProgress(value) {
  if (!isObject(value)) return {};
  const out = {};
  for (const [topicId, topic] of Object.entries(value)) {
    const id = sanitizeId(topicId);
    const clean = sanitizeTopic(topic);
    if (id && clean) out[id] = clean;
  }
  return out;
}

export function loadExerciseProgress(backend) {
  const store = backendOf(backend);
  if (!store) return {};
  try {
    const raw = store.getItem(EXERCISES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return normalizeExerciseProgress(parsed);
  } catch {
    return {};
  }
}

export function saveExerciseProgress(progress = {}, backend) {
  const store = backendOf(backend);
  const normalized = normalizeExerciseProgress(progress);
  try {
    if (!store) return { ok: false };
    store.setItem(EXERCISES_KEY, JSON.stringify(normalized));
    return { ok: true };
  } catch {
    console.warn('Sepect: storage quota exceeded for exercise progress, keeping the session in memory');
    return { ok: false };
  }
}

export function recordExerciseResult(run, backend, now = Date.now()) {
  const progress = loadExerciseProgress(backend);
  const next = recordExerciseAttempt(progress, run, now);
  const saved = saveExerciseProgress(next, backend);
  return { ok: saved.ok, progress: next };
}
