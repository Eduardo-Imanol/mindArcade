import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import TopicView from './TopicView.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { mount } from '../test/render.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

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
    expect(
      container.textContent.match(/Te quedan 2 cartas por aprender o repasar/g)
    ).toHaveLength(7);
    expect(container.textContent).not.toContain('Necesitas al menos');
    expect(container.textContent).not.toContain('Próximamente');

    const links = [...container.querySelectorAll('a[href*="/juego/"]')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(`#/tema/${topic.id}/juego/flashcards`);

    const disabled = [...container.querySelectorAll('button[disabled]')];
    expect(disabled).toHaveLength(7);

    const visuals = [...container.querySelectorAll('li [role="img"], li img, li canvas')];
    expect(visuals).toHaveLength(8);
    expect(visuals.every((node) => node.getAttribute('alt') === '' || node.getAttribute('aria-label') === '')).toBe(true);
    expect(container.textContent).not.toContain('Voltea la carta');
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
    expect(lluviaTile.textContent).toContain('Te quedan 4 cartas por aprender o repasar');
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

  it('renders the full description (no truncation) with pre-line (AC-2)', () => {
    const long = `Primer párrafo con una descripción extensa que supera ampliamente los ciento sesenta caracteres exigidos por la spec, porque queremos comprobar que no se recorta en la vista.`;
    const fixture = `# Tema descriptivo\n${long}\n\nSegundo párrafo independiente.\n\n- Q: a | A: uno\n- Q: b | A: dos`;
    const { topic } = saveCustomTopic({ title: 'Tema descriptivo', md: fixture });
    const { container } = mount(<TopicView topicId={topic.id} />);
    const desc = container.querySelector('.topic-description');
    expect(desc).toBeTruthy();
    expect(desc.textContent.length).toBeGreaterThan(200);
    expect(desc.textContent).toContain('Segundo párrafo independiente.');
    const css = readTokens();
    expect(css).toMatch(/\.topic-description\s*\{[^}]*white-space:\s*pre-line/);
    expect(css).not.toMatch(/\.topic-description\s*\{[^}]*line-clamp/);
    expect(css).not.toMatch(/\.topic-description\s*\{[^}]*text-overflow/);
  });

  it('header shows learned/pending/days and a progressbar (AC-19)', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Demo', md: FIXTURE_A });
    const { container } = mount(<TopicView topicId={topic.id} />);
    const bar = container.querySelector('.topic-metrics [role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(container.textContent).toContain('0 aprendidas · 2 por aprender');
    expect(container.textContent).toContain('Sin sesiones todavía');
    expect(container.querySelector('a[href="#/progreso"]')?.textContent).toBe('Progreso');
  });

  it('game tiles show title + shared cover and no game description (AC-10)', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Demo', md: FIXTURE_A });
    const { container } = mount(<TopicView topicId={topic.id} />);
    expect(container.textContent).toContain('Flashcards');
    expect(container.textContent).not.toContain('Voltea la carta');
    expect(container.textContent).not.toContain('Empareja cada término');
    expect(container.textContent).not.toContain('Más cartas');
  });

  it('each game tile shows the representative art of its own game', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Demo', md: FIXTURE_A });
    const { container } = mount(<TopicView topicId={topic.id} />);
    const tiles = [...container.querySelectorAll('li .game-tile__media img')];
    expect(tiles).toHaveLength(8);
    const sources = tiles.map((img) => img.getAttribute('src'));
    expect(new Set(sources).size).toBe(8);
    expect(sources.every((src) => /assets\/games\//.test(src))).toBe(true);
    expect(sources.some((src) => src.includes('flashcards'))).toBe(true);
    expect(sources.some((src) => src.includes('memorama'))).toBe(true);
    expect(tiles.every((img) => img.getAttribute('alt') === '')).toBe(true);
  });
});
