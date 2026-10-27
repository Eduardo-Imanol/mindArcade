// src/core/storage/arcade.js — quota-safe arcade records (sepect.arcade.v1, spec-18)
export const ARCADE_KEY = 'sepect.arcade.v1';
export const MAX_ARCADE_RUNS = 20;

function backendOf(backend) {
  if (backend) return backend;
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

function sanitizeId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function sanitizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function sanitizeDate(value) {
  if (typeof value === 'string') {
    const time = Date.parse(value);
    if (Number.isFinite(time)) return new Date(time).toISOString();
  }
  return new Date().toISOString();
}

function sanitizeRun(run) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return null;
  const topicId = sanitizeId(run.topicId);
  const gameId = sanitizeId(run.gameId);
  const deckId = sanitizeId(run.deckId);
  if (!topicId || !gameId || !deckId) return null;
  return {
    topicId,
    gameId,
    deckId,
    score: sanitizeCount(run.score),
    correct: sanitizeCount(run.correct),
    wrong: sanitizeCount(run.wrong),
    lives: sanitizeCount(run.lives),
    completed: Boolean(run.completed),
    at: sanitizeDate(run.at),
  };
}

function recordKey(topicId, gameId, deckId) {
  return `${topicId}:${gameId}:${deckId}`;
}

function normalizeRecord(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const runs = (Array.isArray(entry.runs) ? entry.runs : [])
    .map(sanitizeRun)
    .filter(Boolean)
    .slice(-MAX_ARCADE_RUNS);
  const bestFromRuns = runs.reduce((max, run) => Math.max(max, run.score), 0);
  const best = Math.max(sanitizeCount(entry.best), bestFromRuns);
  return { best, runs };
}

function normalizeRecords(records) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) return {};
  const out = {};
  for (const [key, entry] of Object.entries(records)) {
    if (!sanitizeId(key)) continue;
    const normalized = normalizeRecord(entry);
    if (normalized) out[key] = normalized;
  }
  return out;
}

export function loadArcadeRecords(backend) {
  const store = backendOf(backend);
  try {
    const raw = store ? store.getItem(ARCADE_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return normalizeRecords(parsed);
  } catch {
    return {};
  }
}

export function saveArcadeRecords(records = {}, backend) {
  const store = backendOf(backend);
  const normalized = normalizeRecords(records);
  try {
    if (!store) return { ok: false };
    store.setItem(ARCADE_KEY, JSON.stringify(normalized));
    return { ok: true };
  } catch {
    console.warn('Sepect: storage quota exceeded for arcade records, keeping the run in memory');
    return { ok: false };
  }
}

export function bestFor(records, topicId, gameId, deckId) {
  const normalized = normalizeRecords(records);
  const entry = normalized[recordKey(sanitizeId(topicId), sanitizeId(gameId), sanitizeId(deckId))];
  return entry ? entry.best : 0;
}

export function recordArcadeRun(run, backend) {
  const clean = sanitizeRun(run);
  const records = loadArcadeRecords(backend);
  if (!clean) {
    return { ok: false, records, best: 0, isRecord: false };
  }

  const key = recordKey(clean.topicId, clean.gameId, clean.deckId);
  const previous = records[key] || { best: 0, runs: [] };
  const best = Math.max(previous.best, clean.score);
  const isRecord = clean.score > previous.best;
  const nextRecords = {
    ...records,
    [key]: {
      best,
      runs: [...previous.runs, clean].slice(-MAX_ARCADE_RUNS),
    },
  };
  const saved = saveArcadeRecords(nextRecords, backend);
  return {
    ok: saved.ok,
    records: saved.ok ? nextRecords : records,
    best,
    isRecord,
  };
}
