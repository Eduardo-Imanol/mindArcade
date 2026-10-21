import { afterEach, describe, expect, it } from 'vitest';
import { ensureTopicMeta, loadTopicMeta, normalizeDate, saveTopicMeta } from './topicMeta.js';

const KEY = 'sepect.topics.meta.v1';
const NOW = new Date('2026-10-20T12:00:00.000Z');

afterEach(() => {
  localStorage.clear();
});

describe('normalizeDate', () => {
  it('valid ISO → normalized ISO', () => {
    expect(normalizeDate('2026-10-20T12:00:00.000Z')).toBe('2026-10-20T12:00:00.000Z');
    expect(normalizeDate('2026-10-20')).toBe('2026-10-20T00:00:00.000Z');
  });
  it('invalid values → null without throwing', () => {
    expect(normalizeDate('no es fecha')).toBeNull();
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate(42)).toBeNull();
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate(undefined)).toBeNull();
    expect(normalizeDate({})).toBeNull();
  });
});

describe('saveTopicMeta / loadTopicMeta', () => {
  it('roundtrip persists dates', () => {
    const res = saveTopicMeta({ funciones: { addedAt: '2026-10-20T12:00:00.000Z' } });
    expect(res.ok).toBe(true);
    expect(loadTopicMeta()).toEqual({ funciones: { addedAt: '2026-10-20T12:00:00.000Z' } });
  });
  it('corrupt JSON → {} without crash', () => {
    localStorage.setItem(KEY, '{oops');
    expect(loadTopicMeta()).toEqual({});
    expect(() => ensureTopicMeta([], NOW)).not.toThrow();
  });
  it('entries with invalid dates are dropped', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: { addedAt: 'nope' }, b: { addedAt: '2026-01-01T00:00:00.000Z' }, c: 'x', d: null }));
    expect(loadTopicMeta()).toEqual({ b: { addedAt: '2026-01-01T00:00:00.000Z' } });
  });
});

describe('ensureTopicMeta', () => {
  it('assigns addedAt, persists and stays stable on a second call', () => {
    const topics = [{ id: 'funciones', source: 'builtin' }];
    const first = ensureTopicMeta(topics, NOW);
    expect(first[0].addedAt).toBe('2026-10-20T12:00:00.000Z');
    expect(loadTopicMeta().funciones.addedAt).toBe('2026-10-20T12:00:00.000Z');

    const later = new Date('2026-11-01T00:00:00.000Z');
    const second = ensureTopicMeta(topics, later);
    expect(second[0].addedAt).toBe('2026-10-20T12:00:00.000Z');
    expect(loadTopicMeta().funciones.addedAt).toBe('2026-10-20T12:00:00.000Z');
  });
  it('does not mutate the input array', () => {
    const topics = [{ id: 'funciones' }];
    ensureTopicMeta(topics, NOW);
    expect(topics[0].addedAt).toBeUndefined();
  });
  it('keeps an existing meta date instead of the fallback', () => {
    saveTopicMeta({ funciones: { addedAt: '2026-01-01T00:00:00.000Z' } });
    const out = ensureTopicMeta([{ id: 'funciones' }], NOW);
    expect(out[0].addedAt).toBe('2026-01-01T00:00:00.000Z');
  });
  it('custom topic with createdAt keeps it and is not rewritten into meta', () => {
    const out = ensureTopicMeta([{ id: 'mi-tema', source: 'custom', createdAt: '2026-03-04T05:06:07.000Z' }], NOW);
    expect(out[0].addedAt).toBe('2026-03-04T05:06:07.000Z');
    expect(loadTopicMeta()['mi-tema']).toBeUndefined();
  });
  it('old custom topic without createdAt gets first-seen date persisted', () => {
    const out = ensureTopicMeta([{ id: 'viejo', source: 'custom' }], NOW);
    expect(out[0].addedAt).toBe('2026-10-20T12:00:00.000Z');
    expect(loadTopicMeta().viejo.addedAt).toBe('2026-10-20T12:00:00.000Z');
  });
  it('corrupt stored meta → regenerated safely', () => {
    localStorage.setItem(KEY, 'not-json');
    const out = ensureTopicMeta([{ id: 'funciones' }], NOW);
    expect(out[0].addedAt).toBe('2026-10-20T12:00:00.000Z');
    expect(loadTopicMeta()).toEqual({ funciones: { addedAt: '2026-10-20T12:00:00.000Z' } });
  });
  it('handles garbage input', () => {
    expect(ensureTopicMeta(null, NOW)).toEqual([]);
    expect(ensureTopicMeta([null, 42, { noId: true }], NOW)).toEqual([null, 42, { noId: true }]);
  });
});
