// src/views/topics.js — pure search/sort/filter for the topics hub (spec-12 AC-5/AC-6)
import { getTopicMetrics } from '../core/metrics/metrics.js';

export const SORT_OPTIONS = [
  { id: 'recent', label: 'Recientes' },
  { id: 'oldest', label: 'Antiguos' },
  { id: 'name-asc', label: 'Nombre A-Z' },
  { id: 'name-desc', label: 'Nombre Z-A' },
  { id: 'cards', label: 'Más cartas' },
  { id: 'progress', label: 'Progreso' },
];

export const STATUS_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Por aprender' },
  { id: 'done', label: 'Al día' },
];

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleOf(topic) {
  return topic && typeof topic.title === 'string' ? topic.title : '';
}

function addedAtTime(topic) {
  const time = Date.parse(topic && topic.addedAt ? topic.addedAt : '');
  return Number.isFinite(time) ? time : 0;
}

function compareTitle(a, b) {
  return titleOf(a).localeCompare(titleOf(b), 'es', { sensitivity: 'base' });
}

export function matchTopic(topic, query = '') {
  const needle = normalizeText(query);
  if (!needle) return true;
  const haystack = normalizeText(`${titleOf(topic)} ${topic && topic.description ? topic.description : ''}`);
  return needle.split(' ').every((token) => haystack.includes(token));
}

export function sortTopics(topics = [], sort = 'recent', metrics = {}) {
  const list = Array.isArray(topics) ? [...topics] : [];
  const progressOf = (topic) => {
    const entry = metrics[topic && topic.id];
    return entry && Number.isFinite(entry.progress) ? entry.progress : 0;
  };
  const comparators = {
    recent: (a, b) => addedAtTime(b) - addedAtTime(a) || compareTitle(a, b),
    oldest: (a, b) => addedAtTime(a) - addedAtTime(b) || compareTitle(a, b),
    'name-asc': compareTitle,
    'name-desc': (a, b) => compareTitle(b, a),
    cards: (a, b) => (b?.cards?.length || 0) - (a?.cards?.length || 0) || compareTitle(a, b),
    progress: (a, b) => progressOf(b) - progressOf(a) || compareTitle(a, b),
  };
  const compare = comparators[sort] || comparators.recent;
  return list.sort(compare);
}

export function statusOf(metrics) {
  if (!metrics) return 'pending';
  return metrics.notLearned > 0 ? 'pending' : 'done';
}

export function filterAndSortTopics(
  topics = [],
  { query = '', sort = 'recent', status = 'all', srs = {}, history = [], now = Date.now() } = {}
) {
  const metrics = {};
  for (const topic of Array.isArray(topics) ? topics : []) {
    if (!topic || !topic.id) continue;
    metrics[topic.id] = getTopicMetrics(topic, srs, history, now);
  }
  const filtered = (Array.isArray(topics) ? topics : []).filter((topic) => {
    if (!matchTopic(topic, query)) return false;
    if (status === 'all') return true;
    const state = statusOf(metrics[topic && topic.id]);
    return status === 'pending' ? state === 'pending' : state === 'done';
  });
  return { topics: sortTopics(filtered, sort, metrics), metrics };
}

export function buildTopicMetrics(topics = [], srs = {}, history = [], now = Date.now()) {
  const metrics = {};
  for (const topic of Array.isArray(topics) ? topics : []) {
    if (!topic || !topic.id) continue;
    metrics[topic.id] = getTopicMetrics(topic, srs, history, now);
  }
  return metrics;
}
