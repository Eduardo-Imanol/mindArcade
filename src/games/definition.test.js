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
