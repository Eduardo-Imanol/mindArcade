// src/content/exercises/index.js — manifiesto lazy topicId → Markdown (spec-21 T1).
// Sin carga eager: el bundle inicial solo registra los imports dinámicos.
const EXERCISES = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
});

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function normalizeExerciseTopicId(input) {
  if (typeof input !== 'string') return null;
  let value = input.trim().replace(/\\/g, '/');
  if (!value || value.includes('..') || value.startsWith('/') || value.startsWith('//')) return null;
  for (const prefix of ['src/content/exercises/', 'content/exercises/', 'exercises/']) {
    if (value.startsWith(prefix)) {
      value = value.slice(prefix.length);
      break;
    }
  }
  value = value.replace(/\.md$/i, '').replace(/^\/+|\/+$/g, '');
  if (!value) return null;
  const segments = value.split('/');
  if (segments.some((segment) => !SAFE_SEGMENT.test(segment))) return null;
  return value;
}

function candidateKeys(topicId) {
  return Object.keys(EXERCISES)
    .map((key) => key.replace(/\\/g, '/'))
    .filter((key) => key.endsWith(`/${topicId}.md`));
}

export function resolveExerciseKey(topicId) {
  const normalized = normalizeExerciseTopicId(topicId);
  if (!normalized) return null;
  const keys = candidateKeys(normalized);
  return keys.length === 1 ? keys[0] : null;
}

export function hasExercises(topicId) {
  return resolveExerciseKey(topicId) !== null;
}

export const hasExerciseDocument = hasExercises;

export function listExerciseKeys() {
  return Object.keys(EXERCISES);
}

export async function loadExercises(topicId) {
  const key = resolveExerciseKey(topicId);
  if (!key) return null;
  try {
    const loaded = await EXERCISES[key]();
    if (typeof loaded === 'string') return loaded;
    if (loaded && typeof loaded === 'object' && 'default' in loaded) return loaded.default;
    return null;
  } catch {
    return null;
  }
}
