import { describe, expect, it } from 'vitest';
import {
  SORT_OPTIONS,
  STATUS_OPTIONS,
  buildTopicMetrics,
  filterAndSortTopics,
  matchTopic,
  normalizeText,
  sortTopics,
} from './topics.js';

const card = (id) => ({ id, front: `F ${id}`, back: `B ${id}` });

const topic = (id, title, size, extra = {}) => ({
  id,
  title,
  description: extra.description || '',
  cards: Array.from({ length: size }, (_, index) => card(`${id}-${index}`)),
  addedAt: extra.addedAt,
  ...extra,
});

const fullyLearned = (id, size) => {
  const entry = {};
  for (let index = 0; index < size; index += 1) {
    entry[`${id}-${index}`] = { reps: 3, nextReview: Date.now() + 86_400_000 };
  }
  return entry;
};

const SRS = { a: fullyLearned('a', 4) };

describe('normalizeText / matchTopic', () => {
  it('strips accents, casing and punctuation', () => {
    expect(normalizeText('Funciones en Programación')).toBe('funciones en programacion');
    expect(normalizeText('  ¡Hola, mundo! ')).toBe('hola mundo');
  });
  it('matches title and description without accents/case', () => {
    const t = topic('x', 'Funciones en Programación', 3, { description: 'Bloques reutilizables' });
    expect(matchTopic(t, 'FUNCION')).toBe(true);
    expect(matchTopic(t, 'programacion')).toBe(true);
    expect(matchTopic(t, 'reutilizables')).toBe(true);
    expect(matchTopic(t, 'inexistente')).toBe(false);
    expect(matchTopic(t, '')).toBe(true);
  });
});

describe('SORT_OPTIONS / STATUS_OPTIONS', () => {
  it('exposes the exact labels from AC-6', () => {
    expect(SORT_OPTIONS.map((option) => option.label)).toEqual([
      'Recientes',
      'Antiguos',
      'Nombre A-Z',
      'Nombre Z-A',
      'Más cartas',
      'Progreso',
    ]);
    expect(STATUS_OPTIONS.map((option) => option.label)).toEqual([
      'Todos',
      'Por aprender',
      'Al día',
    ]);
  });
});

describe('sortTopics', () => {
  const old = topic('old', 'Algoritmos', 5, { addedAt: '2026-01-01T00:00:00.000Z' });
  const mid = topic('mid', 'Biología', 2, { addedAt: '2026-05-01T00:00:00.000Z' });
  const fresh = topic('fresh', 'Zoología', 8, { addedAt: '2026-09-01T00:00:00.000Z' });
  const list = [old, fresh, mid];

  it('recent default = addedAt descending, tie by title', () => {
    expect(sortTopics(list, 'recent').map((t) => t.id)).toEqual(['fresh', 'mid', 'old']);
    expect(sortTopics(list).map((t) => t.id)).toEqual(['fresh', 'mid', 'old']);
  });
  it('oldest = addedAt ascending', () => {
    expect(sortTopics(list, 'oldest').map((t) => t.id)).toEqual(['old', 'mid', 'fresh']);
  });
  it('name A-Z / Z-A are locale-aware and accent-insensitive', () => {
    expect(sortTopics(list, 'name-asc').map((t) => t.id)).toEqual(['old', 'mid', 'fresh']);
    expect(sortTopics(list, 'name-desc').map((t) => t.id)).toEqual(['fresh', 'mid', 'old']);
  });
  it('cards = descending count, tie by title', () => {
    expect(sortTopics(list, 'cards').map((t) => t.id)).toEqual(['fresh', 'old', 'mid']);
  });
  it('progress = descending progress, tie by title', () => {
    const metrics = { old: { progress: 0.2 }, mid: { progress: 0.9 }, fresh: { progress: 0.5 } };
    expect(sortTopics(list, 'progress', metrics).map((t) => t.id)).toEqual(['mid', 'fresh', 'old']);
  });
  it('missing addedAt sorts last on recent, first on oldest', () => {
    const unknown = topic('unknown', 'AAA', 1);
    expect(sortTopics([unknown, fresh], 'recent').map((t) => t.id)).toEqual(['fresh', 'unknown']);
    expect(sortTopics([unknown, fresh], 'oldest').map((t) => t.id)).toEqual(['unknown', 'fresh']);
  });
  it('unknown sort falls back to recent; empty input is safe', () => {
    expect(sortTopics(list, 'nope').map((t) => t.id)).toEqual(['fresh', 'mid', 'old']);
    expect(sortTopics(null, 'recent')).toEqual([]);
  });
});

describe('filterAndSortTopics', () => {
  const list = [
    topic('a', 'Funciones', 4, { addedAt: '2026-01-01T00:00:00.000Z' }),
    topic('b', 'Algoritmos', 3, { addedAt: '2026-03-01T00:00:00.000Z' }),
  ];

  it('query filters by title/description; no match → empty', () => {
    expect(filterAndSortTopics(list, { query: 'ALGO' }).topics.map((t) => t.id)).toEqual(['b']);
    expect(filterAndSortTopics(list, { query: 'zzz' }).topics).toEqual([]);
  });

  it('pending = topics with notLearned > 0; done = fully learned', () => {
    const pending = filterAndSortTopics(list, { status: 'pending', srs: SRS });
    expect(pending.topics.map((t) => t.id)).toEqual(['b']);
    const done = filterAndSortTopics(list, { status: 'done', srs: SRS });
    expect(done.topics.map((t) => t.id)).toEqual(['a']);
  });

  it('returns metrics per topic id', () => {
    const result = filterAndSortTopics(list, { srs: SRS });
    expect(result.metrics.a.learned).toBe(4);
    expect(result.metrics.a.notLearned).toBe(0);
    expect(result.metrics.b.learned).toBe(0);
    expect(result.metrics.b.notLearned).toBe(3);
  });

  it('combines query + status + sort deterministically', () => {
    const result = filterAndSortTopics(list, { query: '', status: 'all', sort: 'name-desc' });
    expect(result.topics.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('safe with no topics and corrupt srs', () => {
    expect(filterAndSortTopics([], { srs: null }).topics).toEqual([]);
    expect(() => filterAndSortTopics(list, { srs: 'corrupt' })).not.toThrow();
  });
});

describe('buildTopicMetrics', () => {
  it('computes metrics keyed by topic id', () => {
    const metrics = buildTopicMetrics([topic('a', 'A', 2)], SRS);
    expect(metrics.a.total).toBe(2);
    expect(metrics.a.progress).toBe(1);
  });
});
