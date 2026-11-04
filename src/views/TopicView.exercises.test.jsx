import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import TopicView from './TopicView.jsx';
import { mount } from '../test/render.jsx';

const CODE_GAMES = [
  ['ordena-codigo', 'Ordena el código'],
  ['escribe-codigo', 'Escribe el código'],
  ['completa-codigo', 'Completa el código'],
];

function tileFor(container, title) {
  return [...container.querySelectorAll('.game-grid__item')].find((item) =>
    item.textContent.includes(title)
  );
}

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicView exercise availability (spec-21 T19)', () => {
  it('opens the three code games when the topic has an exercise manifest', () => {
    const { container } = mount(<TopicView topicId="funciones-en-programacion" />);

    for (const [id, title] of CODE_GAMES) {
      const tile = tileFor(container, title);
      expect(tile, title).toBeTruthy();
      expect(tile.textContent).toContain('Jugar ahora');
      expect(
        tile.querySelector(`a[href="#/tema/funciones-en-programacion/juego/${id}"]`)
      ).toBeTruthy();
    }
  });

  it('shows code games as upcoming for programming topics without exercises', () => {
    const { container } = mount(<TopicView topicId="estructuras-de-datos" />);

    for (const [, title] of CODE_GAMES) {
      const tile = tileFor(container, title);
      expect(tile, title).toBeTruthy();
      expect(tile.textContent).toContain('Próximamente');
      expect(tile.querySelector('button[disabled]')).toBeTruthy();
      expect(tile.querySelector('a[href*="/juego/"]')).toBeNull();
    }
  });
});
