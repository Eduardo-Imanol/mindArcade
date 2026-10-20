import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LluviaMeteoros from './LluviaMeteoros.jsx';
import { click, fire, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'a', front: 'closure', back: 'captura el entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'e', front: 'memoization', back: 'caché de resultados' },
  { id: 'f', front: 'thunk', back: 'cálculo diferido' },
  { id: 'g', front: 'currying', back: 'aplicación parcial' },
  { id: 'h', front: 'polyfill', back: 'relleno de compatibilidad' },
];

const LONG_FRONT =
  'Este enunciado es deliberadamente largo y supera con holgura el umbral del modo radar para comprobar que el texto completo permanece legible sin truncarse en pantalla.';

const RADAR_DECK = [
  { id: 'a', front: 'closure', back: 'captura el entorno' },
  { id: 'b', front: LONG_FRONT, back: 'un significado extenso y completo' },
  { id: 'c', front: 'promise', back: 'valor futuro' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'e', front: 'memoization', back: 'caché de resultados' },
  { id: 'f', front: 'thunk', back: 'cálculo diferido' },
];

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const changeRounds = (container, rounds) => {
  const select = container.querySelector('#lluvia-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
};

const options = (container) => [...container.querySelectorAll('.lluvia-option')];
const optionBack = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const optionFor = (container, back) =>
  options(container).find((button) => optionBack(button) === back);
const wrongOption = (container, card) =>
  options(container).find((button) => optionBack(button) !== card.back);
const currentFront = (container) => {
  const prompt =
    container.querySelector('.lluvia-radar__text') ||
    container.querySelector('.lluvia-capsule__text');
  return prompt ? prompt.textContent : null;
};
const meter = (container) =>
  [...container.querySelectorAll('p')].find((node) => node.textContent.startsWith('Meteoro '));

const mountGame = (props = {}) =>
  mount(
    <LluviaMeteoros
      deck={DECK}
      selectCards={(count) => DECK.slice(0, count)}
      onGrade={() => {}}
      onExit={() => {}}
      {...props}
    />
  );

const startGame = (container, { rounds, difficulty, rhythm } = {}) => {
  if (rounds) changeRounds(container, rounds);
  if (difficulty) click(buttonByText(container, difficulty));
  if (rhythm) click(buttonByText(container, rhythm));
  click(buttonByText(container, 'Empezar'));
};

function rafHarness() {
  let nextId = 0;
  let baseline = null;
  const pending = new Map();

  vi.stubGlobal('requestAnimationFrame', (callback) => {
    nextId += 1;
    pending.set(nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    pending.delete(id);
  });

  return {
    step(ms = 100, times = 1) {
      for (let index = 0; index < times; index += 1) {
        if (baseline == null) baseline = performance.now();
        baseline += ms;
        const callbacks = [...pending.values()];
        pending.clear();
        act(() => {
          for (const callback of callbacks) callback(baseline);
        });
      }
    },
    pendingCount: () => pending.size,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('lluvia-meteoros setup', () => {
  it('defaults to 8 rounds, normal difficulty and manual rhythm', () => {
    const selectCards = vi.fn((count) => DECK.slice(0, count));
    const view = mountGame({ selectCards });
    const select = view.container.querySelector('#lluvia-rounds');

    expect(select.tagName).toBe('SELECT');
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
    expect(buttonByText(view.container, 'Normal').getAttribute('aria-pressed')).toBe('true');
    expect(buttonByText(view.container, 'Manual').getAttribute('aria-pressed')).toBe('true');

    click(buttonByText(view.container, 'Empezar'));
    expect(selectCards).toHaveBeenCalledWith(8);
    expect(view.container.textContent).toContain('Meteoro 1 de 8');
    expect(options(view.container)).toHaveLength(3);
    view.unmount();
  });
});

describe('lluvia-meteoros session flow', () => {
  it('plays a full session, signs every grade once and replays with the last settings', () => {
    const onGrade = vi.fn(() => ({}));
    const selectCards = vi.fn((count) => DECK.slice(0, count));
    const view = mountGame({ onGrade, selectCards });
    startGame(view.container);

    for (const [index, card] of DECK.entries()) {
      expect(currentFront(view.container)).toBe(card.front);
      click(optionFor(view.container, card.back));
      expect(onGrade).toHaveBeenLastCalledWith(card.id, 'facil');
      expect(options(view.container).every((button) => button.disabled)).toBe(true);
      const label = index === DECK.length - 1 ? 'Ver resumen' : 'Siguiente';
      click(buttonByText(view.container, label));
    }

    expect(onGrade).toHaveBeenCalledTimes(8);
    expect(view.container.textContent).toContain('Sesión completada');
    expect(view.container.textContent).toContain('1600 puntos');
    expect(view.container.textContent).toContain('8 aciertos');
    expect(view.container.textContent).toContain('mejor racha 8');
    expect(view.container.textContent).toContain('+80 XP');

    click(buttonByText(view.container, 'Jugar de nuevo'));
    expect(view.container.querySelector('#lluvia-rounds').value).toBe('8');
    expect(buttonByText(view.container, 'Normal').getAttribute('aria-pressed')).toBe('true');
    expect(buttonByText(view.container, 'Manual').getAttribute('aria-pressed')).toBe('true');
    view.unmount();
  });

  it('waits for "Siguiente" in manual rhythm', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 3 });

    vi.useFakeTimers();
    click(optionFor(view.container, DECK[0].back));
    expect(view.container.textContent).toContain('¡Acertaste!');
    expect(buttonByText(view.container, 'Siguiente')).toBeTruthy();

    act(() => vi.advanceTimersByTime(5000));
    expect(meter(view.container).textContent).toBe('Meteoro 1 de 3');
    expect(onGrade).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('auto rhythm advances after 2500 ms and allows an early "Siguiente"', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 3, rhythm: 'Auto' });

    vi.useFakeTimers();
    click(optionFor(view.container, DECK[0].back));
    expect(view.container.textContent).toContain('Siguiente en');
    act(() => vi.advanceTimersByTime(2600));
    expect(meter(view.container).textContent).toBe('Meteoro 2 de 3');
    expect(currentFront(view.container)).toBe(DECK[1].front);

    click(optionFor(view.container, DECK[1].back));
    click(buttonByText(view.container, 'Siguiente'));
    expect(meter(view.container).textContent).toBe('Meteoro 3 de 3');
    expect(onGrade).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it('survival ends after three failures without grading unshown rounds', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 5, rhythm: 'Supervivencia' });

    expect(view.container.querySelector('[aria-label="Vidas: 3 de 3"]')).toBeTruthy();
    click(wrongOption(view.container, DECK[0]));
    expect(view.container.querySelector('[aria-label="Vidas: 2 de 3"]')).toBeTruthy();
    click(buttonByText(view.container, 'Siguiente'));
    click(wrongOption(view.container, DECK[1]));
    expect(view.container.querySelector('[aria-label="Vidas: 1 de 3"]')).toBeTruthy();
    click(buttonByText(view.container, 'Siguiente'));
    click(wrongOption(view.container, DECK[2]));

    expect(view.container.textContent).toContain('Sesión completada');
    expect(view.container.textContent).toContain('0 aciertos');
    expect(view.container.textContent).toContain('3 fallos');
    expect(onGrade.mock.calls.map(([id, grade]) => [id, grade])).toEqual([
      ['a', 'otra-vez'],
      ['b', 'otra-vez'],
      ['c', 'otra-vez'],
    ]);
    view.unmount();
  });

  it('times out exactly once and reveals the correct answer', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 3 });

    harness.step(100, 70);

    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledWith('a', 'otra-vez');
    expect(view.container.textContent).toContain('Se acabó el tiempo.');
    expect(view.container.querySelector('.lluvia-option.is-correct')).not.toBeNull();
    expect(options(view.container).every((button) => button.disabled)).toBe(true);

    harness.step(100, 20);
    expect(onGrade).toHaveBeenCalledTimes(1);

    click(buttonByText(view.container, 'Siguiente'));
    expect(meter(view.container).textContent).toBe('Meteoro 2 de 3');
    view.unmount();
  });

  it('renders short prompts on the meteor and long prompts in the radar panel', () => {
    const view = mountGame({ deck: RADAR_DECK, selectCards: (count) => RADAR_DECK.slice(0, count) });
    startGame(view.container, { rounds: 3 });

    expect(view.container.querySelector('.lluvia-capsule__text').textContent).toBe('closure');
    expect(view.container.querySelector('.lluvia-radar')).toBeNull();
    click(optionFor(view.container, 'captura el entorno'));
    click(buttonByText(view.container, 'Siguiente'));

    const radar = view.container.querySelector('.lluvia-radar__text');
    expect(radar.textContent).toBe(LONG_FRONT);
    expect(view.container.querySelector('.lluvia-capsule__text')).toBeNull();
    expect(view.container.querySelector('.lluvia-rock--compact')).toBeTruthy();
    expect(options(view.container)).toHaveLength(3);
    view.unmount();
  });

  it('pauses manually and on hidden tab, then resumes explicitly', () => {
    const view = mountGame();
    startGame(view.container, { rounds: 3 });

    click(buttonByText(view.container, 'Pausa'));
    expect(view.container.textContent).toContain('Partida en pausa');
    click(buttonByText(view.container, 'Continuar'));
    expect(meter(view.container).textContent).toBe('Meteoro 1 de 3');

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(view.container.textContent).toContain('Partida en pausa');
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    click(buttonByText(view.container, 'Continuar'));
    expect(meter(view.container).textContent).toBe('Meteoro 1 de 3');
    view.unmount();
  });

  it('pausing an answered round keeps the result and resumes into feedback', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 3 });

    click(optionFor(view.container, DECK[0].back));
    click(buttonByText(view.container, 'Pausa'));
    expect(view.container.textContent).toContain('Partida en pausa');
    click(buttonByText(view.container, 'Continuar'));
    expect(view.container.textContent).toContain('¡Acertaste!');
    expect(onGrade).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('exiting mid-meteor grades only the current card once', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    startGame(view.container, { rounds: 3 });

    click(optionFor(view.container, DECK[0].back));
    click(buttonByText(view.container, 'Siguiente'));
    click(buttonByText(view.container, 'Salir'));
    click(buttonByText(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls.map(([id, grade]) => [id, grade])).toEqual([
      ['a', 'facil'],
      ['b', 'otra-vez'],
    ]);
    view.unmount();
  });

  it('exiting after answering the current card does not re-emit it', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    startGame(view.container, { rounds: 3 });

    click(optionFor(view.container, DECK[0].back));
    click(buttonByText(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls.map(([id, grade]) => [id, grade])).toEqual([['a', 'facil']]);
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
});

describe('lluvia-meteoros safe states', () => {
  it('blocks play with fewer than 6 cards', () => {
    const onExit = vi.fn();
    const view = mountGame({ deck: DECK.slice(0, 5), onExit });

    expect(view.container.textContent).toContain(
      'Necesitas al menos 6 cartas y 3 significados distintos'
    );
    expect(view.container.querySelector('#lluvia-rounds')).toBeNull();
    click(buttonByText(view.container, 'Volver al tema'));
    expect(onExit).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('blocks play with fewer than 3 unique meanings', () => {
    const repeated = DECK.slice(0, 6).map((card, index) => ({
      ...card,
      back: index < 3 ? 'mismo significado' : 'otro significado',
    }));
    const view = mountGame({ deck: repeated });

    expect(view.container.textContent).toContain(
      'Necesitas al menos 6 cartas y 3 significados distintos'
    );
    view.unmount();
  });

  it('shows a safe empty session when selection yields no cards', () => {
    const view = mountGame({ selectCards: () => [] });
    startGame(view.container, { rounds: 3 });

    expect(view.container.textContent).toContain('Sin meteoros disponibles');
    click(buttonByText(view.container, 'Elegir ajustes'));
    expect(view.container.querySelector('#lluvia-rounds')).toBeTruthy();
    view.unmount();
  });
});
