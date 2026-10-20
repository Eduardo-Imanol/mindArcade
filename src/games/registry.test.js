import { describe, it, expect } from 'vitest';
import { getGame, listGames } from './registry.js';

describe('games registry', () => {
  it('flashcards + memorama + ahorcado available, nope null', () => {
    expect(getGame('flashcards').status).toBe('available');
    expect(getGame('memorama').status).toBe('available');
    expect(getGame('ahorcado').status).toBe('available');
    expect(getGame('nope')).toBeNull();
  });
  it('memorama load() resolves a default component', async () => {
    const module = await getGame('memorama').load();
    expect(typeof module.default).toBe('function');
  });
  it('ahorcado load() resolves a default component with minCards 3', async () => {
    const game = getGame('ahorcado');
    expect(game.minCards).toBe(3);
    const module = await game.load();
    expect(typeof module.default).toBe('function');
  });
  it('the other 7 games stay soon', () => {
    const soon = listGames().filter((game) => game.status === 'soon');
    expect(soon.map((game) => game.id)).toEqual([
      'sopa-de-letras',
      'quiz-significado',
      'caza-significados',
      'intruso',
      'lluvia-meteoros',
      'conecta-pares',
      'serpiente-significados',
    ]);
  });
  it('catalog exposes exactly 3 available and 7 soon', () => {
    const games = listGames();
    expect(games.filter((game) => game.status === 'available')).toHaveLength(3);
    expect(games.filter((game) => game.status === 'soon')).toHaveLength(7);
  });
  it('catalog is the full ordered list of 10 stable ids', () => {
    const ids = listGames().map((game) => game.id);
    expect(ids).toEqual([
      'flashcards',
      'memorama',
      'ahorcado',
      'sopa-de-letras',
      'quiz-significado',
      'caza-significados',
      'intruso',
      'lluvia-meteoros',
      'conecta-pares',
      'serpiente-significados',
    ]);
  });
  it('only available games expose load()', () => {
    for (const game of listGames()) {
      if (game.status === 'available') expect(typeof game.load).toBe('function');
      else expect(game.load).toBeUndefined();
    }
    expect(typeof getGame('flashcards').load).toBe('function');
  });
});
