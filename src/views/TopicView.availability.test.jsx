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

describe('TopicView serpiente availability', () => {
  it('gates serpiente-significados below 4 cards and enables it with 4+', () => {
    const short = topic('corto', 'Corto', 3);
    catalog.topics = [short];
    const gated = mount(<TopicView topicId={short.id} />);
    const gatedTile = tileFor(gated.container, 'Serpiente de significados');
    expect(gatedTile).toBeTruthy();
    expect(gatedTile.textContent).toContain('Necesitas al menos 4 cartas');
    expect(gatedTile.querySelector('button[disabled]')).toBeTruthy();
    expect(
      gated.container.querySelector(
        `a[href="#/tema/${short.id}/juego/serpiente-significados"]`
      )
    ).toBeNull();
    gated.unmount();

    const ready = topic('listo', 'Listo', 4);
    catalog.topics = [ready];
    const open = mount(<TopicView topicId={ready.id} />);
    expect(
      open.container.querySelector(
        `a[href="#/tema/${ready.id}/juego/serpiente-significados"]`
      )
    ).toBeTruthy();
    expect(tileFor(open.container, 'Serpiente de significados').textContent).toContain(
      'Jugar ahora'
    );
    open.unmount();
  });
});
