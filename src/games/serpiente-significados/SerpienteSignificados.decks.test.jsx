import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SerpienteSignificados from './SerpienteSignificados.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount } from '../../test/render.jsx';
import {
  advanceFeedback,
  buttonByText,
  eatBack,
  lives,
  rafHarness,
  startGame,
} from '../../test/serpiente.js';

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
];

const legendBacks = (container) =>
  [...container.querySelectorAll('.serpiente-legend__text')].map((node) => node.textContent);

const wrongBackFor = (container, card) =>
  legendBacks(container).find((back) => back !== card.back);

const mountGame = (props = {}) =>
  mount(
    <SerpienteSignificados
      decks={buildDecks(CARDS, {}, { size: 5, now: 1000 })}
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

describe('Serpiente deck setup (spec-18 T13)', () => {
  it('offers mode, picker, mastery, best record and rounds capped to the deck', () => {
    const view = mountGame();
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('Mazo 2');
    expect(container.textContent).toContain('No aprendida');
    expect(container.textContent).toContain('Mejor marca: 250 puntos');
    expect(container.textContent).toContain('Rápido');

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

    const select = container.querySelector('#serpiente-rounds');
    expect([...select.options].map((option) => option.value)).toEqual(['4', '5']);
    expect(select.value).toBe('5');
    expect(container.textContent).toContain('5 de 5 cartas');

    click(container.querySelector('[data-mode="arcade"]'));
    expect(container.querySelector('#serpiente-rounds')).toBeNull();
    expect(buttonByText(container, 'Supervivencia')).toBeUndefined();
    view.unmount();
  });

  it('disables decks below four cards and decks without three meanings', () => {
    const small = mount(
      <SerpienteSignificados
        decks={buildDecks(CARDS.slice(0, 10), {}, { size: 4, now: 1000 })}
        deck={CARDS}
        onGrade={() => ({})}
        onExit={() => {}}
      />
    );
    const smallDeck = small.container.querySelector('[data-deck-id="deck-3"]');
    expect(smallDeck.disabled).toBe(true);
    expect(smallDeck.getAttribute('aria-label')).toContain(
      'No disponible: Necesitas al menos 4 cartas'
    );
    small.unmount();

    const repeated = [
      ...CARDS.slice(0, 4),
      { id: 'r1', front: 'uno', back: 'mismo' },
      { id: 'r2', front: 'dos', back: 'mismo' },
      { id: 'r3', front: 'tres', back: 'otro' },
      { id: 'r4', front: 'cuatro', back: 'otro' },
    ];
    const duplicate = mount(
      <SerpienteSignificados
        decks={buildDecks(repeated, {}, { size: 4, now: 1000 })}
        deck={repeated}
        onGrade={() => ({})}
        onExit={() => {}}
      />
    );
    const duplicateDeck = duplicate.container.querySelector('[data-deck-id="deck-2"]');
    expect(duplicateDeck.disabled).toBe(true);
    expect(duplicateDeck.getAttribute('aria-label')).toContain(
      'Necesitas al menos 3 significados distintos'
    );
    duplicate.unmount();
  });

  it('plays only the selected deck in normal mode', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    const { container } = view;
    const deckCards = CARDS.slice(5, 10);

    click(container.querySelector('[data-deck-id="deck-2"]'));
    startGame(container);

    expect(container.textContent).toContain('Ronda 1 de 5');
    for (const card of deckCards) {
      eatBack(container, harness, card.back);
      expect(onGrade).toHaveBeenLastCalledWith(card.id, 'facil');
      advanceFeedback(harness);
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(onGrade.mock.calls.map(([id]) => id)).toEqual(deckCards.map((card) => card.id));
    view.unmount();
  });
});

describe('Serpiente arcade (spec-18 T13)', () => {
  it('uses three lives and ends when wrong apples empty them', () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 300, isRecord: true }));
    const harness = rafHarness();
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));
    expect(lives(container)).toBe(3);

    eatBack(container, harness, CARDS[0].back);
    expect(onGrade).toHaveBeenLastCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Puntuación 100');
    advanceFeedback(harness);

    eatBack(container, harness, wrongBackFor(container, CARDS[1]));
    expect(lives(container)).toBe(2);
    eatBack(container, harness, CARDS[1].back);
    expect(onGrade).toHaveBeenLastCalledWith('c2', 'facil');
    advanceFeedback(harness);

    eatBack(container, harness, wrongBackFor(container, CARDS[2]));
    expect(lives(container)).toBe(1);
    eatBack(container, harness, CARDS[2].back);
    expect(onGrade).toHaveBeenLastCalledWith('c3', 'facil');
    advanceFeedback(harness);

    eatBack(container, harness, wrongBackFor(container, CARDS[3]));

    expect(container.textContent).toContain('Partida terminada');
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 300,
      correct: 3,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    view.unmount();
  });

  it('completes the deck without mistakes and adds the lives bonus', () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 610, isRecord: true }));
    const harness = rafHarness();
    const view = mount(
      <SerpienteSignificados
        decks={buildDecks(CARDS.slice(0, 8), {}, { size: 4, now: 1000 })}
        deck={CARDS}
        best={{}}
        onGrade={onGrade}
        onArcadeEnd={onArcadeEnd}
        onExit={() => {}}
      />
    );
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));

    for (const card of CARDS.slice(0, 4)) {
      eatBack(container, harness, card.back);
      expect(onGrade).toHaveBeenLastCalledWith(card.id, 'facil');
      advanceFeedback(harness);
    }

    expect(container.textContent).toContain('Mazo completado');
    expect(container.textContent).toContain('610');
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(onGrade).toHaveBeenCalledTimes(4);
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 610,
      correct: 4,
      wrong: 0,
      lives: 3,
      completed: true,
      deckId: 'deck-1',
    });
    view.unmount();
  });
});
