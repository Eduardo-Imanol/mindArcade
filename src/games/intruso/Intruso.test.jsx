import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Intruso from './Intruso.jsx';
import { click, fire, mount } from '../../test/render.jsx';

const card = (id, front, back) => ({ id, front, back, difficulty: 'easy' });

const FUNCIONES = {
  id: 'funciones',
  title: 'Funciones',
  cards: [
    card('f1', 'encerrar lógica', 'bloque reutilizable'),
    card('f2', 'recibir datos', 'variable de entrada'),
    card('f3', 'devolver valor', 'resultado devuelto'),
    card('f4', 'capturar contexto', 'captura el entorno'),
  ],
};

const ALGORITMOS = {
  id: 'algoritmos',
  title: 'Algoritmos',
  cards: [
    card('a1', 'resolver paso a paso', 'conjunto de pasos'),
    card('a2', 'buscar en mitades', 'búsqueda binaria'),
    card('a3', 'medir el costo', 'complejidad temporal'),
    card('a4', 'ordenar sin perder iguales', 'ordenamiento estable'),
  ],
};

const GROUPS = [FUNCIONES, ALGORITMOS];
const FUNCTION_BACKS = FUNCIONES.cards.map((entry) => entry.back);
const ALGORITHM_BACKS = ALGORITMOS.cards.map((entry) => entry.back);
const FRONTS = [...FUNCIONES.cards, ...ALGORITMOS.cards].map((entry) => entry.front);

const mountGame = (props = {}) =>
  mount(
    <Intruso
      groups={GROUPS}
      anchorTopicId="funciones"
      onGrade={() => ({})}
      onExit={() => {}}
      {...props}
    />
  );

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const options = (container) => [...container.querySelectorAll('.intruso-option')];
const backOf = (button) => (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const intruderOption = (container) =>
  options(container).find((button) => ALGORITHM_BACKS.includes(backOf(button)));
const baseOption = (container) =>
  options(container).find((button) => FUNCTION_BACKS.includes(backOf(button)));
const intruderCard = (button) =>
  ALGORITMOS.cards.find((entry) => entry.back === backOf(button));

const startGame = (container, rounds = 3) => {
  const select = container.querySelector('#intruso-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  click(buttonByText(container, 'Empezar'));
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Intruso component flow', () => {
  it('plays a full 3-round session, grades the intruder topic and can replay', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    const select = view.container.querySelector('#intruso-rounds');
    expect(select.value).toBe('10');
    expect([...select.options].map((option) => option.value)).toEqual([
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    expect(view.container.textContent).toContain('Tema ancla:');
    expect(view.container.textContent).toContain('Funciones');

    startGame(view.container, 3);
    expect(view.container.textContent).toContain('¿Cuál no pertenece al tema «Funciones»?');
    expect(options(view.container)).toHaveLength(4);
    for (const front of FRONTS) expect(view.container.textContent).not.toContain(front);

    const firstIntruder = intruderOption(view.container);
    const firstCard = intruderCard(firstIntruder);
    click(firstIntruder);
    expect(onGrade).toHaveBeenLastCalledWith(firstCard.id, 'facil', {
      topicId: 'algoritmos',
    });
    expect(intruderOption(view.container).className).toContain('is-correct');
    expect(options(view.container).every((button) => button.disabled)).toBe(true);
    expect(view.container.textContent).toContain('tema «Algoritmos»');
    click(buttonByText(view.container, 'Siguiente'));

    const secondBase = baseOption(view.container);
    click(secondBase);
    const secondIntruder = intruderCard(intruderOption(view.container));
    expect(onGrade).toHaveBeenLastCalledWith(secondIntruder.id, 'otra-vez', {
      topicId: 'algoritmos',
    });
    expect(secondBase.className).toContain('is-wrong');
    expect(view.container.textContent).toContain('La intrusa era:');
    click(buttonByText(view.container, 'Siguiente'));

    click(intruderOption(view.container));
    click(buttonByText(view.container, 'Ver resumen'));
    expect(view.container.textContent).toContain('Sesión completada');
    expect(view.container.textContent).toContain('2 de 3 aciertos · 1 fallos · +20 XP');

    expect(onGrade.mock.calls).toHaveLength(3);
    expect(onGrade.mock.calls.map(([id, grade, context]) => [id, grade, context])).toEqual([
      [firstCard.id, 'facil', { topicId: 'algoritmos' }],
      [secondIntruder.id, 'otra-vez', { topicId: 'algoritmos' }],
      [expect.any(String), 'facil', { topicId: 'algoritmos' }],
    ]);

    click(buttonByText(view.container, 'Jugar de nuevo'));
    expect(view.container.querySelector('#intruso-rounds')).toBeTruthy();
    expect(buttonByText(view.container, 'Empezar')).toBeTruthy();
    view.unmount();
  });

  it('exiting mid-round emits otra-vez only for the current intruder, exactly once', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    startGame(view.container, 3);

    click(intruderOption(view.container));
    click(buttonByText(view.container, 'Siguiente'));

    const pendingIntruder = intruderCard(intruderOption(view.container));
    click(buttonByText(view.container, 'Salir'));
    click(buttonByText(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledTimes(2);
    expect(onGrade.mock.calls[1]).toEqual([
      pendingIntruder.id,
      'otra-vez',
      { topicId: 'algoritmos' },
    ]);
    view.unmount();
  });

  it('exiting from setup does not emit grades', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    click(buttonByText(view.container, 'Salir'));

    expect(onGrade).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('uses 3 options when the anchor has only 2 unique meanings', () => {
    const anchor = {
      id: 'funciones',
      title: 'Funciones',
      cards: [card('f1', 'uno', 'mismo'), card('f2', 'dos', 'mismo'), card('f3', 'tres', 'distinto')],
    };
    const view = mountGame({ groups: [anchor, ALGORITMOS], anchorTopicId: 'funciones' });
    startGame(view.container, 3);
    expect(options(view.container)).toHaveLength(3);
    expect(options(view.container).filter((button) => !button.disabled)).toHaveLength(3);
    view.unmount();
  });

  it('shows a safe state without two valid topics', () => {
    const onExit = vi.fn();
    const view = mountGame({ groups: [], onExit });
    expect(view.container.textContent).toContain(
      'Este juego necesita al menos dos temas con 3 cartas cada uno.'
    );
    click(buttonByText(view.container, 'Volver al tema'));
    expect(onExit).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('shows a safe empty session when no round can be built', () => {
    const anchor = {
      id: 'funciones',
      title: 'Funciones',
      cards: [card('f1', 'uno', 'mismo'), card('f2', 'dos', 'mismo'), card('f3', 'tres', 'mismo')],
    };
    const view = mountGame({ groups: [anchor, ALGORITMOS], anchorTopicId: 'funciones' });
    startGame(view.container, 3);

    expect(view.container.textContent).toContain('Sin rondas disponibles');
    click(buttonByText(view.container, 'Elegir rondas'));
    expect(view.container.querySelector('#intruso-rounds')).toBeTruthy();
    view.unmount();
  });
});
