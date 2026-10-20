import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const catalog = vi.hoisted(() => ({ topics: [] }));

vi.mock('../core/content/catalog.js', () => ({
  loadCatalog: () => catalog.topics,
}));

import TopicView from './TopicView.jsx';
import { mount } from '../test/render.jsx';

const card = (id) => ({ id, front: `frente ${id}`, back: `reverso ${id}` });

const topic = (id, title, size) => ({
  id,
  source: 'custom',
  title,
  description: '',
  cards: Array.from({ length: size }, (_, index) => card(`${id}-${index}`)),
  errors: [],
  images: {},
});

function tileFor(container, title) {
  return [...container.querySelectorAll('li')].find((item) => item.textContent.includes(title));
}

afterEach(() => {
  catalog.topics = [];
  document.body.innerHTML = '';
});

describe('TopicView intruso availability', () => {
  it('shows the maintenance message when only the anchor topic is eligible', () => {
    const anchor = topic('funciones', 'Funciones', 3);
    catalog.topics = [anchor];

    const { container } = mount(<TopicView topicId={anchor.id} />);
    const tile = tileFor(container, 'El intruso');

    expect(tile).toBeTruthy();
    expect(tile.textContent).toContain(
      'En mantenimiento · agrega otro tema con al menos 3 cartas'
    );
    expect(tile.querySelector('button[disabled]')).toBeTruthy();
    expect(tile.querySelector(`a[href="#/tema/${anchor.id}/juego/intruso"]`)).toBeNull();
  });

  it('enables the intruso link with two topics of at least 3 cards', () => {
    const anchor = topic('funciones', 'Funciones', 3);
    const other = topic('algoritmos', 'Algoritmos', 3);
    catalog.topics = [anchor, other];

    const { container } = mount(<TopicView topicId={anchor.id} />);

    expect(
      container.querySelector(`a[href="#/tema/${anchor.id}/juego/intruso"]`)
    ).toBeTruthy();
    expect(tileFor(container, 'El intruso').textContent).toContain('Jugar ahora');
  });
});
