// src/core/content/catalog.js — builtin (Vite ?raw glob) + custom (localStorage) topics
import { parseTopic } from '../parser/parser.js';
import { slugify, uniqueId } from './slug.js';
import { loadTopicMeta, normalizeDate } from './topicMeta.js';
import { sourceForTopic, TOPIC_TO_MODULE } from './library.js';

const KEY = 'sepect.topics.custom.v1';

const BUILTIN = import.meta.glob('../../content/topics/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export { slugify, uniqueId };

export function loadBuiltinTopicMds() {
  return Object.entries(BUILTIN)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, md]) => md);
}

export function loadBuiltinTopicEntries() {
  return Object.entries(BUILTIN)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, md]) => ({ md, path }));
}

function ingest(md, source, titleHint, taken, images, meta = {}, createdAt) {
  if (typeof md !== 'string' || !md.trim()) return null;
  const { topic, cards, errors } = parseTopic(md);
  if (cards.length === 0) return null;
  const id = uniqueId(slugify(titleHint || topic.title), taken);
  taken.add(id);
  const addedAt = normalizeDate(createdAt) || normalizeDate(meta?.[id]?.addedAt);
  const parsed = {
    id,
    source,
    title: (titleHint || topic.title || 'Tema sin título').slice(0, 80),
    description: topic.description || '',
    cards,
    errors,
    images: images && typeof images === 'object' ? images : {},
  };
  if (addedAt) parsed.addedAt = addedAt;
  // Adjuntar metadatos de biblioteca si existe
  if (source === 'builtin') {
    const mod = TOPIC_TO_MODULE[id];
    if (mod) {
      parsed.categoryId = mod.categoryId;
      parsed.moduleId = mod.moduleId;
      parsed.moduleTitle = mod.moduleTitle;
    } else {
      parsed.categoryId = 'personalizados';
      parsed.moduleId = null;
      parsed.moduleTitle = null;
    }
    parsed.sourcePath = sourceForTopic(id) || null;
  } else if (source === 'custom') {
    parsed.categoryId = 'personalizados';
    parsed.moduleId = null;
    parsed.moduleTitle = null;
    parsed.sourcePath = null;
  }
  return parsed;
}

export function buildCatalog(builtinTopicMds = [], customTopics = [], meta = {}) {
  const safeMeta = meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
  const taken = new Set();
  const topics = [];
  for (const entry of builtinTopicMds) {
    const topic = ingest(
      typeof entry === 'string' ? entry : entry?.md,
      'builtin',
      null,
      taken,
      undefined,
      safeMeta
    );
    if (topic) topics.push(topic);
  }
  for (const entry of customTopics) {
    if (!entry) continue;
    const topic = ingest(entry.md, 'custom', entry.title, taken, entry.images, safeMeta, entry.createdAt);
    if (topic) topics.push(topic);
  }
  return topics;
}

export function loadCustomTopics() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && typeof t.md === 'string' && typeof t.title === 'string');
  } catch {
    return [];
  }
}

export function saveCustomTopics(list = []) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-100)));
    }
    return { ok: true };
  } catch {
    console.warn('Sepect: storage quota exceeded for custom topics');
    return { ok: false };
  }
}

export function saveCustomTopic({ title = '', md = '', images = {} } = {}) {
  const parsed = parseTopic(md);
  if (parsed.cards.length === 0) {
    return { ok: false, error: 'No se encontraron preguntas válidas' };
  }
  const builtin = buildCatalog(loadBuiltinTopicMds(), []);
  const custom = loadCustomTopics();
  const taken = [...builtin.map((t) => t.id), ...custom.map((t) => t.id)];
  const id = uniqueId(slugify(title || parsed.topic.title), taken);
  const createdAt = new Date().toISOString();
  const record = {
    id,
    title: title || parsed.topic.title || 'Tema sin título',
    md,
    images,
    createdAt,
  };
  const persisted = saveCustomTopics([...custom, record]);
  if (!persisted.ok) {
    return { ok: false, error: 'No se pudo guardar (almacenamiento lleno)' };
  }
  return {
    ok: true,
    topic: {
      id,
      title: record.title,
      source: 'custom',
      description: parsed.topic.description,
      cards: parsed.cards,
      errors: parsed.errors,
      images,
      addedAt: createdAt,
    },
  };
}

export function loadCatalog() {
  return buildCatalog(loadBuiltinTopicMds(), loadCustomTopics(), loadTopicMeta());
}
