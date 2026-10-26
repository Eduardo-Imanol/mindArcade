// src/core/content/sources.js — Registro lazy de documentos fuente originales
// Spec-17 AC-8; consumido por spec-19. Sin carga eager.

const SOURCES = import.meta.glob('../../content/sources/**/*.md', {
  query: '?raw',
  import: 'default',
});

function resolveKey(input) {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim().replace(/\\/g, '/');
  if (!s || s.includes('..') || s.startsWith('/') || s.startsWith('//')) return null;
  if (s.includes('content/sources/')) {
    const idx = s.indexOf('content/sources/');
    s = s.slice(idx + 'content/sources/'.length);
  } else if (s.startsWith('sources/')) {
    s = s.slice('sources/'.length);
  }
  return s || null;
}

function findKey(key) {
  for (const candidate of Object.keys(SOURCES)) {
    const normalized = candidate.replace(/\\/g, '/');
    if (normalized === key || normalized.endsWith('/' + key)) return candidate;
  }
  return null;
}

export function hasSource(path) {
  const key = resolveKey(path);
  return key ? findKey(key) !== null : false;
}

export async function loadSource(path) {
  const key = resolveKey(path);
  if (!key) return null;
  const found = findKey(key);
  if (!found) return null;
  try {
    const res = await SOURCES[found]();
    return typeof res === 'string' ? res : (res && typeof res === 'object' && 'default' in res ? res.default : null);
  } catch {
    return null;
  }
}

export function listSourceKeys() {
  return Object.keys(SOURCES);
}
