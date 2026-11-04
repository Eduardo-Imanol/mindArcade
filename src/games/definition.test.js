import { describe, it, expect, vi } from 'vitest';
import { defineGame } from './definition.js';

const load = () => Promise.resolve({ default: () => null });

describe('defineGame', () => {
  it('returns a frozen object with the full contract', () => {
    const game = defineGame({
      id: 'demo',
      title: 'Demo',
      description: 'Una demo.',
      art: 'demo.svg',
      status: 'available',
      minCards: 3,
      minTopics: 2,
      minCardsPerTopic: 3,
      load,
    });
    expect(Object.isFrozen(game)).toBe(true);
    expect(game).toEqual({
      id: 'demo',
      title: 'Demo',
      description: 'Una demo.',
      art: 'demo.svg',
      status: 'available',
      minCards: 3,
      categories: ['*'],
      minTopics: 2,
      minCardsPerTopic: 3,
      load,
    });
  });

  it('omits optional fields when not provided', () => {
    const game = defineGame({ id: 'min', title: 'Mínimo', status: 'soon', minCards: 1, load });
    expect(game.description).toBeUndefined();
    expect(game.art).toBeUndefined();
    expect(game.minTopics).toBeUndefined();
    expect(game.minCardsPerTopic).toBeUndefined();
    expect(game.needsExercises).toBeUndefined();
    expect(game.minExercises).toBeUndefined();
  });

  it('trims string fields', () => {
    const game = defineGame({ id: ' demo ', title: ' Demo ', status: 'available', minCards: 2, load });
    expect(game.id).toBe('demo');
    expect(game.title).toBe('Demo');
  });

  it('rejects invalid required fields', () => {
    expect(() => defineGame()).toThrow(TypeError);
    expect(() => defineGame(null)).toThrow(TypeError);
    expect(() => defineGame({ title: 'x', status: 'available', minCards: 1, load })).toThrow(/id/);
    expect(() => defineGame({ id: 'x', status: 'available', minCards: 1, load })).toThrow(/title/);
    expect(() => defineGame({ id: 'x', title: 'x', minCards: 1, load })).toThrow(/status/);
    expect(() =>
      defineGame({ id: 'x', title: 'x', status: 'pronto', minCards: 1, load })
    ).toThrow(/status/);
    expect(() => defineGame({ id: 'x', title: 'x', status: 'available', load })).toThrow(
      /minCards/
    );
    expect(() =>
      defineGame({ id: 'x', title: 'x', status: 'available', minCards: 1 })
    ).toThrow(/load/);
  });

  it('rejects invalid numbers and optionals', () => {
    expect(() =>
      defineGame({ id: 'x', title: 'x', status: 'available', minCards: 0, load })
    ).toThrow(/minCards/);
    expect(() =>
      defineGame({ id: 'x', title: 'x', status: 'available', minCards: 1.5, load })
    ).toThrow(/minCards/);
    expect(() =>
      defineGame({ id: 'x', title: 'x', status: 'available', minCards: 1, minTopics: 0, load })
    ).toThrow(/minTopics/);
    expect(() =>
      defineGame({
        id: 'x',
        title: 'x',
        status: 'available',
        minCards: 1,
        minCardsPerTopic: 'tres',
        load,
      })
    ).toThrow(/minCardsPerTopic/);
    expect(() =>
      defineGame({ id: 'x', title: 'x', status: 'available', minCards: 1, description: 42, load })
    ).toThrow(/description/);
  });

  it('validates the exercise contract additively', () => {
    const game = defineGame({
      id: 'codigo',
      title: 'Código',
      status: 'available',
      minCards: 1,
      needsExercises: true,
      minExercises: 2,
      load,
    });
    expect(game.needsExercises).toBe(true);
    expect(game.minExercises).toBe(2);
    expect(() =>
      defineGame({
        id: 'x',
        title: 'x',
        status: 'available',
        minCards: 1,
        needsExercises: 'sí',
        load,
      })
    ).toThrow(/needsExercises/);
    expect(() =>
      defineGame({
        id: 'x',
        title: 'x',
        status: 'available',
        minCards: 1,
        minExercises: 0,
        load,
      })
    ).toThrow(/minExercises/);
  });

  it('never mutates the input spec', () => {
    const spec = { id: 'demo', title: 'Demo', status: 'available', minCards: 1, load };
    const game = defineGame(spec);
    expect(game).not.toBe(spec);
    expect(Object.keys(spec)).toEqual([
      'id',
      'title',
      'status',
      'minCards',
      'load',
    ]);
  });

  describe('categories', () => {
    const base = { id: 'demo', title: 'Demo', status: 'available', minCards: 1, load };

    it('defaults to a frozen global scope', () => {
      const game = defineGame(base);
      expect(game.categories).toEqual(['*']);
      expect(Object.isFrozen(game.categories)).toBe(true);
    });

    it('keeps a valid category list, trimmed and frozen', () => {
      const game = defineGame({ ...base, categories: [' programacion ', 'idiomas'] });
      expect(game.categories).toEqual(['programacion', 'idiomas']);
      expect(Object.isFrozen(game.categories)).toBe(true);
    });

    it('deduplicates categories without mutating the input array', () => {
      const categories = ['programacion', 'programacion', ' idiomas ', 'programacion'];
      const game = defineGame({ ...base, categories });
      expect(game.categories).toEqual(['programacion', 'idiomas']);
      expect(game.categories).not.toBe(categories);
      expect(categories).toEqual(['programacion', 'programacion', ' idiomas ', 'programacion']);
    });

    it('rejects an empty array', () => {
      expect(() => defineGame({ ...base, categories: [] })).toThrow(TypeError);
      expect(() => defineGame({ ...base, categories: [] })).toThrow(/categories/);
    });

    it('rejects non-array values', () => {
      for (const value of ['programacion', 42, {}, null, true]) {
        expect(() => defineGame({ ...base, categories: value })).toThrow(TypeError);
      }
    });

    it('rejects empty or non-string entries', () => {
      for (const value of [[''], ['  '], [42], [null], ['ok', '']]) {
        expect(() => defineGame({ ...base, categories: value })).toThrow(/categories/);
      }
    });

    it('prevents runtime mutation of the category array', () => {
      const game = defineGame({ ...base, categories: ['programacion'] });
      expect(() => {
        'use strict';
        game.categories.push('idiomas');
      }).toThrow();
      expect(game.categories).toEqual(['programacion']);
    });
  });

  it('freezing prevents runtime mutation attempts', () => {
    const game = defineGame({ id: 'demo', title: 'Demo', status: 'available', minCards: 1, load });
    expect(() => {
      'use strict';
      game.title = 'Hackeado';
    }).toThrow();
    expect(game.title).toBe('Demo');
    const spy = vi.fn(load);
    expect(defineGame({ id: 'spy', title: 'Spy', status: 'available', minCards: 1, load: spy }).load).toBe(
      spy
    );
  });
});
