import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConectaPares from './ConectaPares.jsx';
import { click, keydown, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'perro', front: 'perro', back: 'dog' },
  { id: 'gato', front: 'gato', back: 'cat' },
  { id: 'sol', front: 'sol', back: 'sun' },
  { id: 'luna', front: 'luna', back: 'moon' },
];

const byText = (container, text) =>
  [...container.querySelectorAll('.conecta-card')].find(
    (button) => button.querySelector('.conecta-card__text').textContent === text
  );

const start = (container) => {
  click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Empezar'));
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('conecta-pares smoke', () => {
  it('plays, errors, draws lines and emits grades once', () => {
    const onGrade = vi.fn();
    const onExit = vi.fn();
    const view = mount(
      <ConectaPares deck={DECK} selectCards={(count) => DECK.slice(0, count)} onGrade={onGrade} onExit={onExit} />
    );
    const { container } = view;
    expect(container.textContent).toContain('Conecta pregunta–significado');
    expect(container.querySelector('#conecta-pairs').value).toBe('4');
    expect([...container.querySelectorAll('#conecta-pairs option')].map((option) => option.value)).toEqual(['3', '4']);
    start(container);

    expect(container.querySelectorAll('.conecta-card')).toHaveLength(8);
    expect(container.querySelector('[aria-label="Preguntas"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Significados"]')).toBeTruthy();
    expect(container.querySelector('img, canvas')).toBeNull();

    click(byText(container, 'perro'));
    expect(byText(container, 'perro').getAttribute('aria-pressed')).toBe('true');
    click(byText(container, 'dog'));
    expect(onGrade.mock.calls).toEqual([['perro', 'facil']]);
    expect(container.querySelectorAll('.conecta-lines line')).toHaveLength(1);
    expect(container.querySelector('.conecta-lines').getAttribute('aria-hidden')).toBe('true');
    expect(byText(container, 'perro').disabled).toBe(true);
    expect(byText(container, 'perro').getAttribute('aria-label')).toContain('Conectada con el par 1');

    click(byText(container, 'gato'));
    click(byText(container, 'sun'));
    expect(container.querySelector('.conecta-feedback.is-wrong')).toBeTruthy();
    expect(container.querySelectorAll('.conecta-lines line')).toHaveLength(1);
    expect(byText(container, 'gato').className).toContain('is-wrong');
    expect(byText(container, 'sun').className).toContain('is-wrong');
    expect(onGrade.mock.calls).toEqual([['perro', 'facil']]);

    click(byText(container, 'gato'));
    click(byText(container, 'cat'));
    expect(onGrade.mock.calls).toEqual([
      ['perro', 'facil'],
      ['gato', 'dificil'],
    ]);
    expect(container.querySelectorAll('.conecta-lines line')).toHaveLength(2);

    click(byText(container, 'sol'));
    keydown(document, 'Escape');
    expect(byText(container, 'sol').getAttribute('aria-pressed')).toBe('false');

    click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Salir'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      ['perro', 'facil'],
      ['gato', 'dificil'],
      ['sol', 'otra-vez'],
      ['luna', 'otra-vez'],
    ]);
    view.unmount();
  });

  it('completes, summarizes and replays from setup', () => {
    const small = DECK.slice(0, 3);
    const onGrade = vi.fn();
    const view = mount(
      <ConectaPares deck={small} onGrade={onGrade} onExit={() => {}} />
    );
    const { container } = view;
    expect(container.querySelector('#conecta-pairs').value).toBe('3');
    start(container);

    for (const card of small) {
      click(byText(container, card.front));
      click(byText(container, card.back));
    }
    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('Pares emparejados: 3 de 3');
    expect(container.textContent).toContain('+30 XP');
    expect(onGrade).toHaveBeenCalledTimes(3);

    click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Jugar de nuevo'));
    expect(container.querySelector('#conecta-pairs').value).toBe('3');
    expect(onGrade).toHaveBeenCalledTimes(3);
    view.unmount();
  });
});
