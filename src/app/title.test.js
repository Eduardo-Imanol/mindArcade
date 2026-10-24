import { describe, expect, it } from 'vitest';
import { titleForRoute } from './App.jsx';

describe('titleForRoute (AC-19)', () => {
  it('sets a title per route', () => {
    expect(titleForRoute({ view: 'hub' })).toBe('Sepect — Biblioteca');
    expect(titleForRoute({ view: 'category', categoryId: 'programacion' })).toBe(
      'Sepect — Programación'
    );
    expect(titleForRoute({ view: 'category', categoryId: 'no-existe' })).toBe(
      'Sepect — Categoría no encontrada'
    );
    expect(titleForRoute({ view: 'progress' })).toBe('Sepect — Progreso');
    expect(titleForRoute({ view: 'notFound' })).toBe('Sepect — 404');
    expect(titleForRoute({ view: 'topic', topicId: 'no-existe' })).toBe(
      'Sepect — Tema no encontrado'
    );
    expect(titleForRoute({ view: 'game', topicId: 'x', gameId: 'flashcards' })).toBe(
      'Sepect — Flashcards'
    );
    expect(titleForRoute({ view: 'game', topicId: 'x', gameId: 'no-existe' })).toBe(
      'Sepect — Juego'
    );
  });
});
