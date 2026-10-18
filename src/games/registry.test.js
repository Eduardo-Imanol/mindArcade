import { describe, it, expect } from 'vitest';
import { getGame, listGames } from './registry.js';

describe('games registry', () => {
  it('flashcards available, memorama soon, nope null', () => {
    expect(getGame('flashcards').status).toBe('available');
    expect(getGame('memorama').status).toBe('soon');
    expect(getGame('nope')).toBeNull();
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
