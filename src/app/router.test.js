import { describe, it, expect } from 'vitest';
import { parseHash } from './router.js';

describe('parseHash', () => {
  it('hub routes', () => {
    expect(parseHash('#/')).toEqual({ view: 'hub' });
    expect(parseHash('')).toEqual({ view: 'hub' });
    expect(parseHash('#')).toEqual({ view: 'hub' });
  });
  it('topic route', () => {
    expect(parseHash('#/tema/funciones')).toEqual({ view: 'topic', topicId: 'funciones' });
  });
  it('progress route', () => {
    expect(parseHash('#/progreso')).toEqual({ view: 'progress' });
    expect(parseHash('#/progreso/')).toEqual({ view: 'progress' });
  });
  it('source reader route', () => {
    expect(parseHash('#/tema/funciones/fuente')).toEqual({
      view: 'source',
      topicId: 'funciones',
    });
    expect(parseHash('#/tema/funciones/fuente/extra')).toEqual({ view: 'notFound' });
  });
  it('game route', () => {
    expect(parseHash('#/tema/funciones/juego/flashcards')).toEqual({
      view: 'game',
      topicId: 'funciones',
      gameId: 'flashcards',
    });
  });
  it('unknown / malformed → notFound, never throws', () => {
    expect(parseHash('#/x')).toEqual({ view: 'notFound' });
    expect(parseHash('#/tema')).toEqual({ view: 'notFound' });
    expect(parseHash('#/tema/a/juego')).toEqual({ view: 'notFound' });
    expect(parseHash('#/tema/a/otro/b')).toEqual({ view: 'notFound' });
    expect(parseHash('#/tema/a/juego/b/extra')).toEqual({ view: 'notFound' });
    expect(parseHash('#/tema/%E0%A4%A')).toEqual({ view: 'notFound' });
    expect(parseHash(null)).toEqual({ view: 'hub' });
  });
});
