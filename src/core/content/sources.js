// src/core/content/sources.js — Registro lazy de documentos fuente originales
// Spec-17 AC-8; consumido por spec-19. Sin carga eager.

const SOURCES = import.meta.glob('../../content/sources/**/*.md', {
  query: '?raw',
  import: 'default',
});

function resolveKey(input) {
  if (!input || typeof input !== 'string') return null;
  let s = input.replace(/\\/g, '/');
  if (s.includes('..') || s.startsWith('/')) return null;
  if (s.includes('content/sources/')) {
    const idx = s.indexOf('content/sources/');
    s = s.slice(idx + 'content/sources/'.length);
  } else if (s.startsWith('sources/')) {
    s = s.slice('sources/'.length);
  }
  return s;
}

export function hasSource(path) {
  const key = resolveKey(path);
  if (!key) return false;
  for (const k of Object.keys(SOURCES)) {
    if (k.endsWith('/' + key) || k.endsWith(key)) return true;
  }
  return false;
}

export async function loadSource(path) {
  const key = resolveKey(path);
  if (!key) return null;
  for (const [k, loader] of Object.entries(SOURCES)) {
    if (k.endsWith('/' + key) || k.endsWith(key)) {
      try {
        const res = await loader();
        return typeof res === 'string' ? res : (res && typeof res === 'object' && 'default' in res ? res.default : null);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function listSourceKeys() {
  return Object.keys(SOURCES);
}
