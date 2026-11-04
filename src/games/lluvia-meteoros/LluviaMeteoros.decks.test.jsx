import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LluviaMeteoros from './LluviaMeteoros.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount } from '../../test/render.jsx';

const CARDS = [
  { id: 'c1', front: 'closure', back: 'captura el entorno' },
  { id: 'c2', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c3', front: 'promise', back: 'valor futuro' },
  { id: 'c4', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'c5', front: 'memoization', back: 'caché de resultados' },
  { id: 'c6', front: 'thunk', back: 'cálculo diferido' },
  { id: 'c7', front: 'currying', back: 'aplicación parcial' },
  { id: 'c8', front: 'polyfill', back: 'relleno de compatibilidad' },
  { id: 'c9', front: 'debounce', back: 'retrasa ejecuciones' },
  { id: 'c10', front: 'throttle', back: 'limita la frecuencia' },
  { id: 'c11', front: 'proxy', back: 'intercepta operaciones' },
  { id: 'c12', front: 'reflect', back: 'metaprogramación' },
];

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );

const options = (container) => [...container.querySelectorAll('.lluvia-option')];
const optionBack = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const optionFor = (container, back) =>
  options(container).find((button) => optionBack(button) === back);
const wrongOption = (container, card) =>
  options(container).find((button) => optionBack(button) !== card.back);
const currentFront = (container) =>
  (container.querySelector('.lluvia-radar__text') || container.querySelector('.lluvia-capsule__text'))
    ?.textContent;

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
  };
}

const mountGame = (props = {}) =>
  mount(
    <LluviaMeteoros
      decks={buildDecks(CARDS, {}, { size: 6, now: 1000 })}
      deck={CARDS}
      best={{ 'deck-1': 250 }}
      onGrade={() => ({})}
      onExit={() => {}}
      {...props}
    />
  );

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('Lluvia deck setup (spec-18 T12)', () => {
  it('offers mode, picker, mastery, best record and rounds capped to the deck', () => {
    const view = mountGame();
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('Mazo 2');
    expect(container.textContent).toContain('No aprendida');
    expect(container.textContent).toContain('Mejor marca: 250 puntos');

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes).toHaveLength(2);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');

    expect(
      container.querySelector('[role="group"][aria-label="Elige tu mazo"]')
    ).toBeTruthy();
    expect(container.querySelector('[data-deck-id="deck-1"]').getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(buttonByText(container, 'Supervivencia')).toBeTruthy();

    const select = container.querySelector('#lluvia-rounds');
    expect([...select.options].map((option) => option.value)).toEqual(['3', '4', '5', '6']);
    expect(select.value).toBe('6');
    expect(container.textContent).toContain('6 de 6 cartas');
    view.unmount();
  });

  it('disables decks below the six-card minimum', () => {
    const view = mount(
      <LluviaMeteoros
        decks={buildDecks(CARDS, {}, { size: 5, now: 1000 })}
        deck={CARDS}
        onGrade={() => ({})}
        onExit={() => {}}
      />
    );

    const lastDeck = view.container.querySelector('[data-deck-id="deck-3"]');
    expect(lastDeck.disabled).toBe(true);
    expect(lastDeck.getAttribute('aria-label')).toContain(
      'No disponible: Necesitas al menos 6 cartas'
    );
    expect(buttonByText(view.container, 'Empezar').disabled).toBe(true);
    view.unmount();
  });

  it('plays only the selected deck in normal mode', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    const { container } = view;
    const deckCards = CARDS.slice(6, 12);

    click(container.querySelector('[data-deck-id="deck-2"]'));
    click(buttonByText(container, 'Empezar'));

    for (const [index, card] of deckCards.entries()) {
      expect(currentFront(container)).toBe(card.front);
      click(optionFor(container, card.back));
      expect(onGrade).toHaveBeenLastCalledWith(card.id, 'facil');
      const label = index === deckCards.length - 1 ? 'Ver resumen' : 'Siguiente';
      click(buttonByText(container, label));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(onGrade.mock.calls.map(([id]) => id)).toEqual(deckCards.map((card) => card.id));
    view.unmount();
  });
});

describe('Lluvia arcade (spec-18 T12)', () => {
  it('subtracts a life per wrong answer and timeout, then ends at zero', () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 100, isRecord: true }));
    const harness = rafHarness();
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    expect(container.querySelector('#lluvia-rounds')).toBeNull();
    expect(buttonByText(container, 'Supervivencia')).toBeUndefined();
    click(buttonByText(container, 'Empezar'));

    expect(container.textContent).toContain('Vidas 3 de 3');
    expect(container.textContent).toContain('Racha 0');

    click(wrongOption(container, CARDS[0]));
    expect(onGrade).toHaveBeenCalledWith('c1', 'otra-vez');
    expect(container.textContent).toContain('Vidas 2 de 3');
    click(buttonByText(container, 'Siguiente'));

    harness.step(100, 70);
    expect(onGrade).toHaveBeenLastCalledWith('c2', 'otra-vez');
    expect(container.textContent).toContain('Vidas 1 de 3');
    expect(container.textContent).toContain('Se acabó el tiempo.');
    click(buttonByText(container, 'Siguiente'));

    click(wrongOption(container, CARDS[2]));
    expect(container.textContent).toContain('Partida terminada');
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 0,
      correct: 0,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    view.unmount();
  });

  it('completes the deck without mistakes and adds the lives bonus', () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 900, isRecord: true }));
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;
    const deckCards = CARDS.slice(0, 6);

    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));

    for (const [index, card] of deckCards.entries()) {
      expect(currentFront(container)).toBe(card.front);
      click(optionFor(container, card.back));
      expect(onGrade).toHaveBeenLastCalledWith(card.id, 'facil');
      const label = index === deckCards.length - 1 ? 'Ver resumen' : 'Siguiente';
      click(buttonByText(container, label));
    }

    expect(container.textContent).toContain('Mazo completado');
    expect(container.textContent).toContain('Puntuación');
    expect(container.textContent).toContain('900');
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(onGrade).toHaveBeenCalledTimes(6);
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 900,
      correct: 6,
      wrong: 0,
      lives: 3,
      completed: true,
      deckId: 'deck-1',
    });
    view.unmount();
  });
});
