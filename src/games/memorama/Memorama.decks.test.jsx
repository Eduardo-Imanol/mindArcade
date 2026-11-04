import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Memorama from './Memorama.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount, waitFor } from '../../test/render.jsx';

const PRESERVE = () => 0.999999;

const CARDS = [
  { id: 'c1', front: 'perro', back: 'dog' },
  { id: 'c2', front: 'gato', back: 'cat' },
  { id: 'c3', front: 'sol', back: 'sun' },
  { id: 'c4', front: 'luna', back: 'moon' },
  { id: 'c5', front: 'mar', back: 'sea' },
  { id: 'c6', front: 'flor', back: 'flower' },
  { id: 'c7', front: 'tren', back: 'train' },
  { id: 'c8', front: 'luz', back: 'light' },
  { id: 'c9', front: 'aire', back: 'air' },
  { id: 'c10', front: 'sal', back: 'salt' },
  { id: 'c11', front: 'te', back: 'tea' },
];

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
const tiles = (container) => [...container.querySelectorAll('.memorama-tile')];
const tile = (container, cardId, face) =>
  tiles(container).find((el) => el.dataset.cardId === cardId && el.dataset.face === face);

const matchPair = (container, cardId) => {
  click(tile(container, cardId, 'front'));
  click(tile(container, cardId, 'back'));
};

const mismatch = (container, firstCardId, secondCardId) => {
  click(tile(container, firstCardId, 'front'));
  click(tile(container, secondCardId, 'front'));
  click(buttonByText(container, '🔄 Voltear de nuevo'));
};

const mountGame = (decks, props = {}) =>
  mount(
    <Memorama
      decks={decks}
      deck={CARDS}
      best={{ 'deck-1': 300 }}
      onGrade={() => ({})}
      onExit={() => {}}
      random={PRESERVE}
      {...props}
    />
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Memorama deck setup (spec-18 T9)', () => {
  const DECKS = buildDecks(CARDS.slice(0, 10), {}, { size: 5, now: 1000 });

  it('offers mode, picker, mastery, best record and pair options capped to the deck', () => {
    const view = mountGame(DECKS);
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('No aprendida');
    expect(container.textContent).toContain('Mejor marca: 300 puntos');

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes).toHaveLength(2);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[data-deck-id="deck-1"]').getAttribute('aria-pressed')).toBe(
      'true'
    );

    const select = container.querySelector('#memorama-pairs');
    expect([...select.options].map((option) => option.value)).toEqual(['4', '5']);
    expect(select.value).toBe('5');
    expect(container.textContent).toContain('5 de 5 parejas');
    view.unmount();
  });

  it('hides the pair selector in arcade and announces the full deck', () => {
    const view = mountGame(DECKS);
    click(view.container.querySelector('[data-mode="arcade"]'));

    expect(view.container.querySelector('#memorama-pairs')).toBeNull();
    expect(view.container.textContent).toContain('5 parejas · 3 vidas');
    view.unmount();
  });

  it('disables decks below the four-card minimum', () => {
    const view = mountGame(buildDecks(CARDS.slice(0, 9), {}, { size: 4, now: 1000 }));
    const lastDeck = view.container.querySelector('[data-deck-id="deck-3"]');

    expect(lastDeck.disabled).toBe(true);
    expect(lastDeck.getAttribute('aria-label')).toContain(
      'No disponible: Necesitas al menos 4 cartas'
    );
    view.unmount();
  });

  it('plays only the selected deck and completes its pairs', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame(DECKS, { onGrade });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    const deckIds = ['c1', 'c2', 'c3', 'c4', 'c5'];
    expect(tiles(container)).toHaveLength(10);
    expect(new Set(tiles(container).map((el) => el.dataset.cardId))).toEqual(new Set(deckIds));

    for (const cardId of deckIds) matchPair(container, cardId);

    expect(container.textContent).toContain('Sesión completada');
    expect(onGrade).toHaveBeenCalledTimes(5);
    expect(onGrade.mock.calls.map(([cardId]) => cardId).sort()).toEqual(deckIds);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'facil')).toBe(true);
    view.unmount();
  });

  it('exits grading only the card already shown (AC-12)', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame(DECKS, { onGrade, onExit });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    click(tile(container, 'c1', 'front'));
    click(buttonByText(container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([['c1', 'otra-vez']]);
    view.unmount();
  });
});

describe('Memorama arcade (spec-18 T9)', () => {
  const ARCADE_CARDS = CARDS.slice(0, 4);
  const arcadeDecks = () => buildDecks(ARCADE_CARDS, {}, { size: 10, now: 1000 });

  const mountArcade = (props = {}) =>
    mount(
      <Memorama
        decks={arcadeDecks()}
        deck={ARCADE_CARDS}
        best={{}}
        onGrade={() => ({})}
        onExit={() => {}}
        random={PRESERVE}
        {...props}
      />
    );

  const startArcade = (container) => {
    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));
  };

  it('scores pairs, subtracts a life per failed pair and ends at zero', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 100, isRecord: true }));
    const view = mountArcade({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    expect(container.textContent).toContain('Mazo 1 · Arcade');
    expect(container.textContent).toContain('Vidas 3 de 3');

    matchPair(container, 'c1');
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Puntuación 100');

    mismatch(container, 'c2', 'c3');
    expect(container.textContent).toContain('Vidas 2 de 3');
    mismatch(container, 'c2', 'c4');
    expect(container.textContent).toContain('Vidas 1 de 3');
    mismatch(container, 'c3', 'c4');

    await waitFor(() => container.textContent.includes('Partida terminada'));
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(
      onGrade.mock.calls
        .filter(([, grade]) => grade === 'otra-vez')
        .map(([cardId]) => cardId)
        .sort()
    ).toEqual(['c2', 'c3', 'c4']);
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 100,
      correct: 1,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    expect(container.textContent).toContain('Fallos');
    view.unmount();
  });

  it('completes the deck and adds the remaining-lives bonus', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 610, isRecord: true }));
    const view = mountArcade({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    for (const cardId of ['c1', 'c2', 'c3', 'c4']) matchPair(container, cardId);

    await waitFor(() => container.textContent.includes('Mazo completado'));
    expect(container.textContent).toContain('610');
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 610,
      correct: 4,
      wrong: 0,
      lives: 3,
      completed: true,
      deckId: 'deck-1',
    });
    expect(onGrade).toHaveBeenCalledTimes(4);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'facil')).toBe(true);
    view.unmount();
  });

  it('renders ten pairs (20 tiles) without dropping deck cards (AC-24)', () => {
    const ten = CARDS.slice(0, 10);
    const view = mount(
      <Memorama
        decks={buildDecks(ten, {}, { size: 10, now: 1000 })}
        deck={ten}
        best={{}}
        onGrade={() => ({})}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    click(view.container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(view.container, 'Empezar'));

    expect(tiles(view.container)).toHaveLength(20);
    expect(new Set(tiles(view.container).map((el) => el.dataset.cardId)).size).toBe(10);
    expect(view.container.querySelector('.memorama-board')).toBeTruthy();
    view.unmount();
  });
});
