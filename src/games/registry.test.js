import { describe, it, expect } from 'vitest';
import { getGame, listGames } from './registry.js';

describe('games registry', () => {
  it('eight games available, unknown id null', () => {
    expect(getGame('flashcards').status).toBe('available');
    expect(getGame('memorama').status).toBe('available');
    expect(getGame('ahorcado').status).toBe('available');
    expect(getGame('quiz-significado').status).toBe('available');
    expect(getGame('intruso').status).toBe('available');
    expect(getGame('lluvia-meteoros').status).toBe('available');
    expect(getGame('conecta-pares').status).toBe('available');
    expect(getGame('serpiente-significados').status).toBe('available');
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
  it('quiz-significado load() resolves a default component with minCards 4', async () => {
    const game = getGame('quiz-significado');
    expect(game.minCards).toBe(4);
    const module = await game.load();
    expect(typeof module.default).toBe('function');
  });
  it('intruso load() resolves with the content gate metadata', async () => {
    const game = getGame('intruso');
    expect(game.minCards).toBe(3);
    expect(game.minTopics).toBe(2);
    expect(game.minCardsPerTopic).toBe(3);
    const module = await game.load();
    expect(typeof module.default).toBe('function');
  });
  it('lluvia-meteoros load() resolves a default component with minCards 6', async () => {
    const game = getGame('lluvia-meteoros');
    expect(game.minCards).toBe(6);
    const module = await game.load();
    expect(typeof module.default).toBe('function');
  });
  it('conecta-pares load() resolves a default component with minCards 3', async () => {
    const game = getGame('conecta-pares');
    expect(game.title).toBe('Conecta pregunta–significado');
    expect(game.description).toBe(
      'Une cada pregunta con su significado tocando ambas columnas.'
    );
    expect(game.minCards).toBe(3);
    const module = await game.load();
    expect(typeof module.default).toBe('function');
  });
  it('serpiente-significados load() resolves with minCards 4', async () => {
    const game = getGame('serpiente-significados');
    expect(game.title).toBe('Serpiente de significados');
    expect(game.minCards).toBe(4);
    const module = await game.load();
    expect(typeof module.default).toBe('function');
  });
  it('catalog exposes exactly 8 available games and no upcoming ones', () => {
    const games = listGames();
    expect(games).toHaveLength(8);
    expect(games.filter((game) => game.status === 'available')).toHaveLength(8);
    expect(games.filter((game) => game.status === 'soon')).toHaveLength(0);
  });
  it('catalog is the full ordered list of 8 stable ids', () => {
    const ids = listGames().map((game) => game.id);
    expect(ids).toEqual([
      'flashcards',
      'memorama',
      'ahorcado',
      'quiz-significado',
      'intruso',
      'lluvia-meteoros',
      'conecta-pares',
      'serpiente-significados',
    ]);
  });
  it('every game exposes load()', () => {
    for (const game of listGames()) {
      expect(typeof game.load).toBe('function');
    }
    expect(typeof getGame('flashcards').load).toBe('function');
  });
  it('every entry is a frozen GameDefinition (AC-27)', () => {
    for (const game of listGames()) {
      expect(Object.isFrozen(game)).toBe(true);
    }
    expect(Object.isFrozen(getGame('flashcards'))).toBe(true);
    expect(Object.isFrozen(getGame('intruso'))).toBe(true);
  });
  it('getGame returns the very same frozen instance as listGames', () => {
    const flashcards = listGames().find((game) => game.id === 'flashcards');
    expect(getGame('flashcards')).toBe(flashcards);
  });
});
