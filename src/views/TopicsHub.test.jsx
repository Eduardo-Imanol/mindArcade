import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import TopicsHub from './TopicsHub.jsx';
import { click, mount, setValue } from '../test/render.jsx';

const FIXTURE_A = `# Funciones en Programación
Una función encapsula lógica reutilizable y evita repetir código.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable que realiza una tarea | E: easy
- Q: ¿Qué es un parámetro? | A: Variable que recibe valores de entrada | E: easy
- Q: ¿Qué es el valor de retorno? | A: Resultado que la función devuelve al llamador | E: hard
- LINEA SIN MARCADORES`;

const byText = (container, selector, text) =>
  [...container.querySelectorAll(selector)].find((element) => element.textContent === text);

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicsHub', () => {
  it('empty catalog → "Aún no hay temas" + create action, no crash', () => {
    const { container } = mount(<TopicsHub loadTopics={() => []} />);
    expect(container.textContent).toContain('Aún no hay temas');
    expect(byText(container, 'button', 'Crear mi primer tema')).toBeTruthy();
  });

  it('header shows "Tus temas" and never the word "Sepect" (AC-4)', () => {
    const { container } = mount(<TopicsHub />);
    expect(container.textContent).toContain('Tus temas');
    expect(container.textContent).not.toContain('Sepect');
    expect(byText(container, 'button', 'Crear tema')).toBeTruthy();
    expect(container.querySelector('a[href="#/progreso"]')?.textContent).toBe('Progreso');
  });

  it('search filters by title/description without accents (AC-5)', () => {
    const { container } = mount(<TopicsHub />);
    const search = container.querySelector('#hub-search');
    expect(search).toBeTruthy();
    expect(search.getAttribute('type')).toBe('search');
    expect(search.getAttribute('aria-label')).toBe('Buscar temas');

    setValue(search, 'PROGRAMACION');
    expect(container.textContent).toContain('Funciones en Programación');

    setValue(search, 'zzz-no-existe');
    expect(container.textContent).toContain('Sin resultados');
    expect(byText(container, 'button', 'Limpiar filtros')).toBeTruthy();
  });

  it('clear button resets the search query (AC-5)', () => {
    const { container } = mount(<TopicsHub />);
    const search = container.querySelector('#hub-search');
    setValue(search, 'programacion');
    const clear = container.querySelector('button[aria-label="Limpiar búsqueda"]');
    expect(clear).toBeTruthy();
    click(clear);
    expect(container.querySelector('#hub-search').value).toBe('');
  });

  it('exposes sort and status selectors with the exact options (AC-6)', () => {
    const { container } = mount(<TopicsHub />);
    const sort = container.querySelector('select[aria-label="Ordenar temas"]');
    const status = container.querySelector('select[aria-label="Filtrar por estado"]');
    expect(sort.value).toBe('recent');
    expect([...sort.options].map((o) => o.textContent)).toEqual([
      'Recientes',
      'Antiguos',
      'Nombre A-Z',
      'Nombre Z-A',
      'Más cartas',
      'Progreso',
    ]);
    expect([...status.options].map((o) => o.textContent)).toEqual([
      'Todos',
      'Por aprender',
      'Al día',
    ]);
  });

  it('status filter "Al día" hides topics with pending cards (AC-6)', () => {
    const { container } = mount(<TopicsHub />);
    const status = container.querySelector('select[aria-label="Filtrar por estado"]');
    setValue(status, 'done');
    expect(container.textContent).toContain('Sin resultados');
  });

  it('topic card shows cover, progress bar and learned/pending counts (AC-7)', () => {
    const { container } = mount(<TopicsHub />);
    const tile = container.querySelector(
      'a.topic-card-tile[href="#/tema/funciones-en-programacion"]'
    );
    expect(tile).toBeTruthy();
    const bar = tile.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(tile.textContent).toMatch(/0 aprendidas · 96 por aprender/);
    expect(tile.textContent).toContain('Sin sesiones todavía');
    expect(tile.querySelector('.topic-card-tile__media canvas, .topic-card-tile__media img, .topic-card-tile__media span[role="img"]')).toBeTruthy();
  });

  it('cover image fills its media box: full width, cover, no forced square (regression)', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const media = css.match(/\.topic-card-tile__media\s*\{[^}]*\}/s)?.[0] || '';
    expect(media).toMatch(/aspect-ratio:\s*16\s*\/\s*10/);
    expect(media).toMatch(/overflow:\s*hidden/);
    const override =
      css.match(/\.topic-card-tile__media \.card-image--fill\s*\{[^}]*\}/s)?.[0] || '';
    expect(override).toMatch(/width:\s*100%/);
    expect(override).toMatch(/height:\s*100%/);
    expect(override).toMatch(/object-fit:\s*cover/);
    expect(override).toMatch(/aspect-ratio:\s*auto/);
    const cardImage = fs.readFileSync(
      path.join(process.cwd(), 'src/components/CardImage.jsx'),
      'utf8'
    );
    expect(cardImage).not.toMatch(/objectFit:\s*fill\s*\?\s*'contain'/);
  });

  it('shows the builtin topic with its card count', () => {
    const { container } = mount(<TopicsHub />);
    expect(container.textContent).toContain('Funciones en Programación');
    expect(container.textContent).toContain('96 cartas');
  });

  it('persists first-seen addedAt for builtin topics on load (AC-8)', () => {
    mount(<TopicsHub />);
    const meta = JSON.parse(localStorage.getItem('sepect.topics.meta.v1'));
    expect(meta['funciones-en-programacion']?.addedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    const first = meta['funciones-en-programacion'].addedAt;
    mount(<TopicsHub />);
    const again = JSON.parse(localStorage.getItem('sepect.topics.meta.v1'));
    expect(again['funciones-en-programacion'].addedAt).toBe(first);
  });

  it('create flow: paste fixture A → preview counts → save → topic visible with 3 cards', () => {
    const { container } = mount(<TopicsHub />);
    click(byText(container, 'button', 'Crear tema'));

    setValue(container.querySelector('#topic-md'), FIXTURE_A);
    expect(container.textContent).toContain('3 cartas válidas');
    expect(container.textContent).toContain('1 líneas ignoradas');
    expect(container.querySelector('#topic-md').value).toBe(FIXTURE_A);

    click(byText(container, 'button', 'Guardar tema'));

    const stored = JSON.parse(localStorage.getItem('sepect.topics.custom.v1'));
    expect(stored).toHaveLength(1);
    expect(stored[0].md).toBe(FIXTURE_A);

    expect(container.textContent).toContain('Funciones en Programación');
    expect(container.textContent).toContain('3 cartas');
    expect(container.textContent).toContain('Personalizado');
  });

  it('rejects 0 valid cards with message and persists nothing', () => {
    const { container } = mount(<TopicsHub />);
    click(byText(container, 'button', 'Crear tema'));
    setValue(container.querySelector('#topic-md'), 'texto sin preguntas');
    click(byText(container, 'button', 'Guardar tema'));
    const alert = container.querySelector('[role="alert"]');
    expect(alert.textContent).toBe('No se encontraron preguntas válidas');
    expect(localStorage.getItem('sepect.topics.custom.v1')).toBeNull();
  });

  it('per-card image controls render (emoji suggestion + URL field + upload button)', () => {
    const { container } = mount(<TopicsHub />);
    click(byText(container, 'button', 'Crear tema'));
    setValue(container.querySelector('#topic-md'), FIXTURE_A);
    const urlInputs = [...container.querySelectorAll('input[type="url"]')];
    expect(urlInputs).toHaveLength(3);
    expect(container.textContent).toContain('Sugerir 🧩');
    expect(byText(container, 'button', 'Subir imagen')).toBeTruthy();

    setValue(urlInputs[1], 'https://example.com/img.png');
    const storedAfterSave = () =>
      JSON.parse(localStorage.getItem('sepect.topics.custom.v1') || 'null');
    click(byText(container, 'button', 'Guardar tema'));
    const stored = storedAfterSave();
    expect(stored[0].images['que-es-un-parametro']).toEqual({
      kind: 'url',
      value: 'https://example.com/img.png',
    });
  });
});
