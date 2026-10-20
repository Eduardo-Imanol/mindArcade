import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import TopicView from './TopicView.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { mount } from '../test/render.jsx';

const FIXTURE_A = `# Funciones en Programación
Una función encapsula lógica reutilizable.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable | E: easy
- Q: ¿Qué es un parámetro? | A: Variable de entrada | E: easy`;

const FIXTURE_B = `# Tema amplio
- Q: perro | A: dog
- Q: gato | A: cat
- Q: sol | A: sun
- Q: luna | A: moon`;

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicView', () => {
  it('shows topic header + 8 game tiles, only flashcards openable with 2 cards', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Demo', md: FIXTURE_A });
    const { container } = mount(<TopicView topicId={topic.id} />);
    expect(container.textContent).toContain('Tema Demo');
    expect(container.textContent).toContain('2 cartas');

    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(8);
    expect(container.textContent).toContain('Flashcards');
    expect(container.textContent).toContain('Necesitas al menos 4 cartas');
    expect(container.textContent).toContain('Necesitas al menos 3 cartas');
    expect(container.textContent).toContain('Necesitas al menos 6 cartas');
    expect(container.textContent).not.toContain('Próximamente');

    const links = [...container.querySelectorAll('a[href*="/juego/"]')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(`#/tema/${topic.id}/juego/flashcards`);

    const disabled = [...container.querySelectorAll('button[disabled]')];
    expect(disabled).toHaveLength(7);

    const images = [...container.querySelectorAll('li img')];
    expect(images).toHaveLength(8);
    expect(new Set(images.map((img) => img.getAttribute('src'))).size).toBe(8);
    expect(images.every((img) => img.getAttribute('alt') === '')).toBe(true);
  });

  it('enables all available games, including intruso, with two eligible topics', () => {
    const { topic } = saveCustomTopic({ title: 'Tema amplio', md: FIXTURE_B });
    const { container } = mount(<TopicView topicId={topic.id} />);
    expect(container.textContent).toContain('4 cartas');

    const links = [...container.querySelectorAll('a[href*="/juego/"]')];
    expect(links).toHaveLength(7);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        `#/tema/${topic.id}/juego/flashcards`,
        `#/tema/${topic.id}/juego/memorama`,
        `#/tema/${topic.id}/juego/ahorcado`,
        `#/tema/${topic.id}/juego/quiz-significado`,
        `#/tema/${topic.id}/juego/intruso`,
        `#/tema/${topic.id}/juego/conecta-pares`,
        `#/tema/${topic.id}/juego/serpiente-significados`,
      ])
    );
    expect(container.textContent).not.toContain('Próximamente');
    expect(container.querySelectorAll('button[disabled]')).toHaveLength(1);
    const lluviaTile = [...container.querySelectorAll('li')].find((item) =>
      item.textContent.includes('Lluvia de meteoros')
    );
    expect(lluviaTile.textContent).toContain('Necesitas al menos 6 cartas');
  });

  it('enables lluvia-meteoros with at least 6 cards', () => {
    const fixture = `# Tema amplio
- Q: perro | A: dog
- Q: gato | A: cat
- Q: sol | A: sun
- Q: luna | A: moon
- Q: agua | A: water
- Q: fuego | A: fire`;
    const { topic } = saveCustomTopic({ title: 'Tema amplio', md: fixture });
    const { container } = mount(<TopicView topicId={topic.id} />);

    expect(
      container.querySelector(`a[href="#/tema/${topic.id}/juego/lluvia-meteoros"]`)
    ).toBeTruthy();
  });

  it('unknown topic → fallback with link home, no crash', () => {
    const { container } = mount(<TopicView topicId="no-existe" />);
    expect(container.textContent).toContain('404');
    expect(container.textContent).toContain('no encontrado');
    expect(container.querySelector('a[href="#/"]')).toBeTruthy();
  });
});
