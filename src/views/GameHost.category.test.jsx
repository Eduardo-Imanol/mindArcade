import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ loads: 0, props: null }));

vi.mock('../games/registry.js', async (importOriginal) => {
  const actual = await importOriginal();
  const scoped = {
    id: 'codigo-puzzle',
    title: 'Puzzle de código',
    status: 'available',
    minCards: 1,
    categories: ['programacion'],
    load: async () => {
      fake.loads += 1;
      return {
        default: (props) => {
          fake.props = props;
          return null;
        },
      };
    },
  };
  return {
    ...actual,
    getGame: (id) => (id === 'codigo-puzzle' ? scoped : actual.getGame(id)),
  };
});

import GameHost from './GameHost.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { mount, waitFor } from '../test/render.jsx';

const MD = `# Tema de categoría
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four`;

afterEach(() => {
  fake.loads = 0;
  fake.props = null;
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  vi.restoreAllMocks();
});

describe('GameHost category scope (spec-20 AC-5)', () => {
  it('rejects a programming-only game for a custom topic without loading it', () => {
    const { topic } = saveCustomTopic({ title: 'Tema propio', md: MD });
    const { container } = mount(<GameHost topicId={topic.id} gameId="codigo-puzzle" />);

    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1').textContent).toBe(
      'Juego no disponible para esta categoría'
    );
    expect(container.textContent).toContain('Puzzle de código');
    expect(container.textContent).toContain('Programación');
    expect(container.textContent).toContain('Mis temas');
    expect(container.textContent).not.toContain('Cargando juego');
    expect(container.querySelector(`a[href="#/tema/${topic.id}"]`)).toBeTruthy();
    expect(fake.loads).toBe(0);
  });

  it('loads a programming-only game for a programming topic', async () => {
    const { container } = mount(
      <GameHost topicId="funciones-en-programacion" gameId="codigo-puzzle" />
    );
    await waitFor(() => fake.props);

    expect(container.textContent).not.toContain('Juego no disponible para esta categoría');
    expect(fake.loads).toBe(1);
    expect(Array.isArray(fake.props.deck)).toBe(true);
    expect(fake.props.deck.length).toBeGreaterThan(0);
    expect(typeof fake.props.onGrade).toBe('function');
  });

  it('keeps global games available for custom topics', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema global', md: MD });
    mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => document.body.textContent.includes('Empezar mazo'));
    expect(document.body.textContent).not.toContain(
      'Juego no disponible para esta categoría'
    );
  });
});
