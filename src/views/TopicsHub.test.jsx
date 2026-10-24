import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
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

describe('TopicsHub (category-first, spec-17 T5)', () => {
  it('empty catalog → empty state with create action', () => {
    const { container } = mount(<TopicsHub loadTopics={() => []} />);
    expect(container.textContent).toContain('Aún no hay temas');
    expect(byText(container, 'button', 'Crear mi primer tema')).toBeTruthy();
  });

  it('header shows Biblioteca, actions Crear tema and Progreso', () => {
    const { container } = mount(<TopicsHub />);
    expect(container.textContent).toContain('Biblioteca');
    expect(byText(container, 'button', 'Crear tema')).toBeTruthy();
    expect(container.querySelector('a[href="#/progreso"]')?.textContent).toBe('Progreso');
  });

  it('shows four categories', () => {
    const { container } = mount(<TopicsHub />);
    expect(container.textContent).toContain('Programación');
    expect(container.textContent).toContain('Idiomas');
    expect(container.textContent).toContain('Universidad');
    expect(container.textContent).toContain('Mis temas');
  });

  it('Programación links to category route with counts', () => {
    const { container } = mount(<TopicsHub />);
    const link = container.querySelector('a[href="#/categoria/programacion"]');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('4 temas');
    expect(link.textContent).toContain('565 cartas');
  });

  it('Idiomas and Universidad show Próximamente', () => {
    const { container } = mount(<TopicsHub />);
    expect(container.textContent).toContain('Próximamente');
  });

  it('create flow: paste fixture A → save → appears in Mis temas', () => {
    const { container } = mount(<TopicsHub />);
    click(byText(container, 'button', 'Crear tema'));

    setValue(container.querySelector('#topic-md'), FIXTURE_A);
    expect(container.textContent).toContain('3 cartas válidas');
    expect(container.querySelector('#topic-md').value).toBe(FIXTURE_A);

    click(byText(container, 'button', 'Guardar tema'));

    const stored = JSON.parse(localStorage.getItem('sepect.topics.custom.v1'));
    expect(stored).toHaveLength(1);
    expect(stored[0].md).toBe(FIXTURE_A);

    expect(container.textContent).toContain('Mis temas');
    expect(container.textContent).toContain('1 tema');
    expect(container.textContent).toContain('3 cartas');
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

  it('per-card image controls render', () => {
    const { container } = mount(<TopicsHub />);
    click(byText(container, 'button', 'Crear tema'));
    setValue(container.querySelector('#topic-md'), FIXTURE_A);
    const urlInputs = [...container.querySelectorAll('input[type="url"]')];
    expect(urlInputs).toHaveLength(3);
    expect(container.textContent).toContain('Sugerir 🧩');
    expect(byText(container, 'button', 'Subir imagen')).toBeTruthy();

    setValue(urlInputs[1], 'https://example.com/img.png');
    click(byText(container, 'button', 'Guardar tema'));
    const stored = JSON.parse(localStorage.getItem('sepect.topics.custom.v1'));
    expect(stored[0].images['que-es-un-parametro']).toEqual({
      kind: 'url',
      value: 'https://example.com/img.png',
    });
  });
});
