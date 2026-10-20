// src/core/content/topicMeta.js — fechas de primer avistamiento por tema (addedAt)
const KEY = 'sepect.topics.meta.v1';

export function normalizeDate(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const time = Date.parse(trimmed);
  if (!Number.isFinite(time)) return null;
  try {
    return new Date(time).toISOString();
  } catch {
    return null;
  }
}

function sanitize(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  const clean = {};
  for (const [id, entry] of Object.entries(meta)) {
    if (!id || !entry || typeof entry !== 'object') continue;
    const addedAt = normalizeDate(entry.addedAt);
    if (addedAt) clean[id] = { addedAt };
  }
  return clean;
}

export function loadTopicMeta() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return {};
    return sanitize(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveTopicMeta(meta = {}) {
  const next = sanitize(meta);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(next));
    }
    return { ok: true, meta: next };
  } catch {
    console.warn('Sepect: storage quota exceeded for topic meta');
    return { ok: false, meta: next };
  }
}

export function ensureTopicMeta(topics = [], now = new Date()) {
  const list = Array.isArray(topics) ? topics : [];
  const stored = loadTopicMeta();
  const fallback = normalizeDate(now instanceof Date ? now.toISOString() : now) || new Date().toISOString();
  const nextMeta = { ...stored };
  let changed = false;
  const result = list.map((topic) => {
    if (!topic || typeof topic !== 'object' || typeof topic.id !== 'string' || !topic.id) return topic;
    const own = normalizeDate(topic.addedAt) || normalizeDate(topic.createdAt);
    const known = stored[topic.id]?.addedAt || null;
    const addedAt = own || known || fallback;
    if (!own && !known) {
      nextMeta[topic.id] = { addedAt };
      changed = true;
    }
    return { ...topic, addedAt };
  });
  if (changed) saveTopicMeta(nextMeta);
  return result;
}
