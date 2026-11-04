import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ topics: [], emptyFor: null }));

vi.mock('../core/content/catalog.js', () => ({
  loadCatalog: () => state.topics,
}));

vi.mock('../games/registry.js', async (importOriginal) => {
  const actual = await importOriginal();
  const scoped = {
    id: 'codigo-puzzle',
    title: 'Puzzle de código',
    status: 'available',
    minCards: 1,
    categories: ['programacion'],
    load: async () => ({ default: () => null }),
  };
  return {
    ...actual,
    listGames: ({ categoryId } = {}) => {
      if (categoryId === state.emptyFor) return [];
      const games = actual.listGames({ categoryId });
      if (categoryId === undefined || categoryId === 'programacion') {
        return [...games, scoped];
      }
      return games;
    },
  };
});

import TopicView from './TopicView.jsx';
import { mount } from '../test/render.jsx';

const makeTopic = (id, title, categoryId, size = 6) => ({
  id,
  source: 'builtin',
  title,
  description: '',
  categoryId,
  cards: Array.from({ length: size }, (_, index) => ({
    id: `${id}-${index}`,
    front: `frente ${index}`,
    back: `reverso ${index}`,
  })),
  errors: [],
  images: {},
});

const gamesIn = (container) =>
  [...container.querySelectorAll('.game-grid__item')].map((item) => item.textContent);

beforeEach(() => {
  state.topics = [
    makeTopic('prog', 'Programación', 'programacion'),
    makeTopic('idiomas', 'Idiomas', 'idiomas'),
    makeTopic('mio', 'Mi tema', 'personalizados'),
  ];
  state.emptyFor = null;
});

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicView category scope (spec-20 AC-4, AC-6)', () => {
  it('shows global games plus the category game for Programación', () => {
    const { container } = mount(<TopicView topicId="prog" />);
    const games = gamesIn(container);

    expect(games).toHaveLength(12);
    expect(games.some((text) => text.includes('Puzzle de código'))).toBe(true);
    expect(games.some((text) => text.includes('Flashcards'))).toBe(true);
    expect(container.textContent).toContain('9 de 12 disponibles');
    expect(container.textContent).toContain('Próximamente');
  });

  it('hides programming-only games from Idiomas', () => {
    const { container } = mount(<TopicView topicId="idiomas" />);
    const games = gamesIn(container);

    expect(games).toHaveLength(8);
    expect(container.textContent).not.toContain('Puzzle de código');
    expect(container.textContent).toContain('8 de 8 disponibles');
  });

  it('shows only global games for a custom topic', () => {
    const { container } = mount(<TopicView topicId="mio" />);
    const games = gamesIn(container);

    expect(games).toHaveLength(8);
    expect(container.textContent).not.toContain('Puzzle de código');
    expect(container.textContent).toContain('8 de 8 disponibles');
  });

  it('renders a friendly empty state instead of a broken grid', () => {
    state.topics = [...state.topics, makeTopic('vacia', 'Vacía', 'vacia')];
    state.emptyFor = 'vacia';

    const { container } = mount(<TopicView topicId="vacia" />);

    expect(container.querySelectorAll('.game-grid__item')).toHaveLength(0);
    expect(container.querySelector('.game-grid')).toBeNull();
    expect(container.querySelector('.topic-games__count')).toBeNull();
    const empty = container.querySelector('.topic-games__empty');
    expect(empty.getAttribute('role')).toBe('status');
    expect(empty.textContent).toContain('Aún no hay juegos disponibles para esta categoría');
    expect(empty.querySelector('a[href="#/"]')).toBeTruthy();
  });
});
