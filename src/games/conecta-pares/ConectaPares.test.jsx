import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConectaPares from './ConectaPares.jsx';
import { click, fire, keydown, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'perro', front: 'perro', back: 'dog' },
  { id: 'gato', front: 'gato', back: 'cat' },
  { id: 'sol', front: 'sol', back: 'sun' },
  { id: 'luna', front: 'luna', back: 'moon' },
  { id: 'mar', front: 'mar', back: 'sea' },
  { id: 'flor', front: 'flor', back: 'flower' },
  { id: 'libro', front: 'libro', back: 'book' },
  { id: 'mesa', front: 'mesa', back: 'table' },
  { id: 'agua', front: 'agua', back: 'water' },
  { id: 'fuego', front: 'fuego', back: 'fire' },
];

const findButton = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);
const byText = (container, text) =>
  [...container.querySelectorAll('.conecta-card')].find(
    (button) => button.querySelector('.conecta-card__text')?.textContent === text
  );
const questions = (container) => [
  ...container.querySelectorAll('section[aria-label="Preguntas"] .conecta-card'),
];
const meanings = (container) => [
  ...container.querySelectorAll('section[aria-label="Significados"] .conecta-card'),
];
const choosePairs = (container, count) => {
  const select = container.querySelector('#conecta-pairs');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(count));
  fire(select, 'change');
};
const start = (container) => click(findButton(container, 'Empezar'));
const match = (container, front, back) => {
  click(byText(container, front));
  click(byText(container, back));
};

const mountGame = (props = {}) =>
  mount(
    <ConectaPares
      deck={DECK}
      selectCards={(count) => DECK.slice(0, count)}
      onGrade={() => {}}
      onExit={() => {}}
      {...props}
    />
  );

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('conecta-pares setup', () => {
  it('defaults to 8 pairs and offers the range 3..min(10, available)', () => {
    const selectCards = vi.fn((count) => DECK.slice(0, count));
    const view = mountGame({ selectCards });
    const { container } = view;
    const select = container.querySelector('#conecta-pairs');

    expect(select.value).toBe('8');
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
    expect(container.querySelector('label[for="conecta-pairs"]').textContent).toContain('Pares');
    expect(container.textContent).toContain('10 pares únicos disponibles');
    expect(container.textContent).not.toContain('🔊');
    expect(container.querySelector('img, canvas')).toBeNull();

    start(container);
    expect(selectCards).toHaveBeenCalledWith(8);
    expect(questions(container)).toHaveLength(8);
    expect(meanings(container)).toHaveLength(8);
    expect(container.querySelectorAll('.conecta-card')).toHaveLength(16);
    expect(container.querySelector('img, canvas')).toBeNull();
    view.unmount();
  });

  it('limits the selector to available cards and passes the chosen count', () => {
    const six = DECK.slice(0, 6);
    const selectCards = vi.fn((count) => six.slice(0, count));
    const view = mountGame({ deck: six, selectCards });
    const select = view.container.querySelector('#conecta-pairs');

    expect(select.value).toBe('6');
    expect([...select.options].map((option) => option.value)).toEqual(['3', '4', '5', '6']);

    choosePairs(view.container, 4);
    start(view.container);
    expect(selectCards).toHaveBeenCalledWith(4);
    expect(questions(view.container)).toHaveLength(4);
    expect(meanings(view.container)).toHaveLength(4);
    view.unmount();
  });

  it('falls back to deck.slice when selectCards is not provided', () => {
    const four = DECK.slice(0, 4);
    const view = mount(
      <ConectaPares deck={four} onGrade={() => {}} onExit={() => {}} />
    );
    const { container } = view;

    expect(container.querySelector('#conecta-pairs').value).toBe('4');
    choosePairs(container, 3);
    start(container);

    const texts = [...container.querySelectorAll('.conecta-card__text')].map(
      (node) => node.textContent
    );
    expect(new Set(texts)).toEqual(new Set(['perro', 'dog', 'gato', 'cat', 'sol', 'sun']));
    view.unmount();
  });

  it('shows a safe screen with fewer than 3 pairs and never starts', () => {
    const onExit = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 2), onExit });
    const { container } = view;

    expect(container.textContent).toContain('Necesitas al menos 3 pares únicos');
    expect(findButton(container, 'Empezar')).toBeUndefined();
    click(findButton(container, 'Volver al tema'));
    expect(onExit).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('falls back to setup when selectCards returns fewer than 3 unique pairs', () => {
    const onGrade = vi.fn();
    const view = mountGame({
      deck: DECK.slice(0, 4),
      selectCards: () => DECK.slice(0, 2),
      onGrade,
    });
    const { container } = view;

    start(container);
    expect(container.textContent).toContain('Necesitas al menos 3 pares únicos');
    expect(findButton(container, 'Elegir pares')).toBeTruthy();
    expect(onGrade).not.toHaveBeenCalled();

    click(findButton(container, 'Elegir pares'));
    expect(container.querySelector('#conecta-pairs')).toBeTruthy();
    view.unmount();
  });
});

describe('conecta-pares selection and matching', () => {
  it('selects from either column, toggles, replaces and locks matched cards', () => {
    const onGrade = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 4), onGrade });
    const { container } = view;
    start(container);

    click(byText(container, 'dog'));
    expect(byText(container, 'dog').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.conecta-selection').textContent).toContain('dog');

    click(byText(container, 'dog'));
    expect(byText(container, 'dog').getAttribute('aria-pressed')).toBe('false');

    click(byText(container, 'perro'));
    click(byText(container, 'gato'));
    expect(byText(container, 'perro').getAttribute('aria-pressed')).toBe('false');
    expect(byText(container, 'gato').getAttribute('aria-pressed')).toBe('true');

    click(byText(container, 'cat'));
    expect(onGrade.mock.calls).toEqual([['gato', 'facil']]);
    expect(byText(container, 'gato').disabled).toBe(true);
    expect(byText(container, 'cat').disabled).toBe(true);
    expect(byText(container, 'gato').getAttribute('aria-label')).toContain(
      'Conectada con el par 1'
    );
    expect(container.querySelectorAll('.conecta-lines line')).toHaveLength(1);

    click(byText(container, 'gato'));
    click(byText(container, 'cat'));
    expect(onGrade.mock.calls).toEqual([['gato', 'facil']]);

    click(byText(container, 'moon'));
    click(byText(container, 'luna'));
    expect(onGrade.mock.calls).toEqual([
      ['gato', 'facil'],
      ['luna', 'facil'],
    ]);
    view.unmount();
  });

  it('keeps a wrong pair available for retry and grades it dificil once solved', () => {
    const onGrade = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 3), onGrade });
    const { container } = view;
    start(container);

    click(byText(container, 'perro'));
    click(byText(container, 'cat'));
    expect(container.querySelector('.conecta-progress').textContent).toContain('1 error');
    expect(container.querySelector('.conecta-feedback.is-wrong')).toBeTruthy();
    expect(container.querySelectorAll('.conecta-lines line')).toHaveLength(0);
    expect(byText(container, 'perro').disabled).toBe(false);
    expect(byText(container, 'cat').disabled).toBe(false);
    expect(byText(container, 'perro').className).toContain('is-wrong');
    expect(byText(container, 'cat').className).toContain('is-wrong');

    click(byText(container, 'perro'));
    click(byText(container, 'dog'));
    expect(onGrade.mock.calls).toEqual([['perro', 'dificil']]);
    expect(container.querySelector('.conecta-feedback.is-correct')).toBeTruthy();
    expect(container.querySelectorAll('.conecta-lines line')).toHaveLength(1);
    view.unmount();
  });

  it('attributes a miss started from the meaning column to the question card', () => {
    const onGrade = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 3), onGrade });
    const { container } = view;
    start(container);

    click(byText(container, 'cat'));
    click(byText(container, 'sol'));
    expect(container.querySelector('.conecta-progress').textContent).toContain('1 error');

    click(byText(container, 'cat'));
    click(byText(container, 'gato'));
    expect(onGrade.mock.calls).toEqual([['gato', 'facil']]);

    click(byText(container, 'sol'));
    click(byText(container, 'sun'));
    expect(onGrade.mock.calls).toEqual([
      ['gato', 'facil'],
      ['sol', 'dificil'],
    ]);
    view.unmount();
  });

  it('clears the selection with Escape without emitting grades', () => {
    const onGrade = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 3), onGrade });
    const { container } = view;
    start(container);

    click(byText(container, 'perro'));
    expect(byText(container, 'perro').getAttribute('aria-pressed')).toBe('true');
    keydown(document, 'Escape');
    expect(byText(container, 'perro').getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.conecta-selection')).toBeNull();
    expect(onGrade).not.toHaveBeenCalled();
    view.unmount();
  });
});

describe('conecta-pares completion and exit', () => {
  it('completes the session, summarizes XP and replays from setup', () => {
    const onGrade = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 3), onGrade });
    const { container } = view;
    start(container);

    for (const card of DECK.slice(0, 3)) match(container, card.front, card.back);

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('Pares emparejados: 3 de 3');
    expect(container.textContent).toContain('Errores: 0');
    expect(container.textContent).toContain('Aciertos al primer intento: 3 de 3');
    expect(container.textContent).toContain('+30 XP');
    expect(onGrade.mock.calls).toEqual([
      ['perro', 'facil'],
      ['gato', 'facil'],
      ['sol', 'facil'],
    ]);

    click(findButton(container, 'Jugar de nuevo'));
    expect(container.querySelector('#conecta-pairs').value).toBe('3');
    expect(onGrade).toHaveBeenCalledTimes(3);

    start(container);
    match(container, 'perro', 'dog');
    expect(onGrade.mock.calls).toHaveLength(4);
    expect(onGrade.mock.calls[3]).toEqual(['perro', 'facil']);
    view.unmount();
  });

  it('emits otra-vez only for unmatched cards on exit, exactly once', () => {
    const onGrade = vi.fn();
    const onExit = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 4), onGrade, onExit });
    const { container } = view;
    start(container);

    match(container, 'perro', 'dog');
    match(container, 'gato', 'cat');
    click(findButton(container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      ['perro', 'facil'],
      ['gato', 'facil'],
      ['sol', 'otra-vez'],
      ['luna', 'otra-vez'],
    ]);

    click(findButton(container, 'Salir'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledTimes(4);
    view.unmount();
  });

  it('does not emit pending grades when leaving setup or a completed session', () => {
    const onGrade = vi.fn();
    const onExit = vi.fn();
    const setupView = mountGame({ deck: DECK.slice(0, 3), onGrade, onExit });
    click(findButton(setupView.container, 'Salir'));
    expect(onGrade).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
    setupView.unmount();
    onExit.mockClear();

    const completeView = mountGame({ deck: DECK.slice(0, 3), onGrade, onExit });
    start(completeView.container);
    for (const card of DECK.slice(0, 3)) {
      match(completeView.container, card.front, card.back);
    }
    click(findButton(completeView.container, 'Volver al tema'));
    expect(onGrade).toHaveBeenCalledTimes(3);
    expect(onExit).toHaveBeenCalledTimes(1);
    completeView.unmount();
  });

  it('never renders card images even when the deck carries them', () => {
    const deck = DECK.slice(0, 3).map((card) => ({
      ...card,
      image: { kind: 'emoji', value: '🦴' },
    }));
    const view = mountGame({ deck });
    const { container } = view;
    start(container);

    expect(container.querySelector('img, canvas')).toBeNull();
    expect(container.querySelector('span[role="img"]')).toBeNull();
    expect(container.textContent).not.toContain('🦴');
    view.unmount();
  });
});
