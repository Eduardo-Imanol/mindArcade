import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuizSignificado from './QuizSignificado.jsx';
import { click, fire, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'a', front: 'closure', back: 'captura el entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
];

const findButton = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);
const options = (container) => [...container.querySelectorAll('.quiz-option')];
const optionByBack = (container, back) =>
  options(container).find((button) => button.getAttribute('aria-label').endsWith(back));

const start = (container, rounds = 3) => {
  const select = container.querySelector('#quiz-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  click(findButton(container, 'Empezar'));
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('quiz-significado component flow', () => {
  it('plays a full 3-round session and emits signed grades', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mount(
      <QuizSignificado
        deck={DECK}
        selectCards={(count) => DECK.slice(0, count)}
        onGrade={onGrade}
        onExit={() => {}}
      />
    );
    start(view.container);
    expect(options(view.container)).toHaveLength(4);
    expect(view.container.querySelector('.quiz-question__text').textContent).toBe('closure');

    click(optionByBack(view.container, 'captura el entorno'));
    expect(onGrade).toHaveBeenCalledWith('a', 'facil');

    click(findButton(view.container, 'Siguiente'));
    expect(view.container.querySelector('.quiz-question__text').textContent).toBe('hoisting');
    const wrong = options(view.container).find(
      (button) => !button.getAttribute('aria-label').endsWith('elevación de declaraciones')
    );
    click(wrong);
    expect(wrong.disabled).toBe(true);
    expect(view.container.textContent).toContain('Te queda 1 intento');
    click(optionByBack(view.container, 'elevación de declaraciones'));
    expect(onGrade).toHaveBeenCalledWith('b', 'dificil');

    click(findButton(view.container, 'Siguiente'));
    expect(view.container.querySelector('.quiz-question__text').textContent).toBe('promise');
    const firstWrong = options(view.container).find(
      (button) => !button.getAttribute('aria-label').endsWith('valor futuro')
    );
    click(firstWrong);
    const secondWrong = options(view.container).find(
      (button) =>
        !button.disabled && !button.getAttribute('aria-label').endsWith('valor futuro')
    );
    click(secondWrong);
    expect(onGrade).toHaveBeenCalledWith('c', 'otra-vez');
    expect(view.container.textContent).toContain('La respuesta correcta es:');
    expect(view.container.querySelector('.quiz-option.is-correct')).not.toBeNull();

    click(findButton(view.container, 'Ver resumen'));
    expect(view.container.textContent).toContain('Sesión completada');
    expect(view.container.textContent).toContain(
      '1 de 3 aciertos al primer intento · 2 fallos · +35 XP'
    );
    expect(onGrade.mock.calls.map(([id, grade]) => [id, grade])).toEqual([
      ['a', 'facil'],
      ['b', 'dificil'],
      ['c', 'otra-vez'],
    ]);
    view.unmount();
  });

  it('exiting mid-session emits otra-vez for every unresolved round exactly once', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mount(
      <QuizSignificado
        deck={DECK}
        selectCards={(count) => DECK.slice(0, count)}
        onGrade={onGrade}
        onExit={onExit}
      />
    );
    start(view.container);
    click(optionByBack(view.container, 'captura el entorno'));
    click(findButton(view.container, 'Siguiente'));
    click(findButton(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      ['a', 'facil'],
      ['b', 'otra-vez'],
      ['c', 'otra-vez'],
    ]);
    view.unmount();
  });
});
