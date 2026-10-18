import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import TopicView from './TopicView.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { mount } from '../test/render.jsx';

const FIXTURE_A = `# Funciones en Programación
Una función encapsula lógica reutilizable.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable | E: easy
- Q: ¿Qué es un parámetro? | A: Variable de entrada | E: easy`;

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicView', () => {
  it('shows topic header + 10 game tiles, only flashcards openable', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Demo', md: FIXTURE_A });
    const { container } = mount(<TopicView topicId={topic.id} />);
    expect(container.textContent).toContain('Tema Demo');
    expect(container.textContent).toContain('2 cartas');

    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(10);
    expect(container.textContent).toContain('Flashcards');
    expect(container.textContent.match(/Próximamente/g)).toHaveLength(9);

    const links = [...container.querySelectorAll('a[href*="/juego/"]')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(`#/tema/${topic.id}/juego/flashcards`);

    const disabled = [...container.querySelectorAll('button[disabled]')];
    expect(disabled).toHaveLength(9);
  });

  it('unknown topic → fallback with link home, no crash', () => {
    const { container } = mount(<TopicView topicId="no-existe" />);
    expect(container.textContent).toContain('404');
    expect(container.textContent).toContain('no encontrado');
    expect(container.querySelector('a[href="#/"]')).toBeTruthy();
  });
});
