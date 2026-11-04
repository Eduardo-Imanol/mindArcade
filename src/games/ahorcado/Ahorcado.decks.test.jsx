import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ahorcado from './Ahorcado.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount, waitFor } from '../../test/render.jsx';

const PRESERVE = () => 0.999999;

const CARDS = [
  { id: 'c1', front: 'SOL', back: 'Estrella del sistema solar' },
  { id: 'c2', front: 'LUNA', back: 'Satélite natural' },
  { id: 'c3', front: 'MAR', back: 'Océano o masa de agua' },
  { id: 'c4', front: 'RIO', back: 'Corriente de agua' },
  { id: 'c5', front: 'PAN', back: 'Alimento de harina' },
  { id: 'c6', front: 'FLOR', back: 'Parte de la planta' },
  { id: 'c7', front: 'TREN', back: 'Vehículo ferroviario' },
  { id: 'c8', front: 'LUZ', back: 'Energía luminosa' },
  { id: 'c9', front: 'AIRE', back: 'Mezcla de gases' },
  { id: 'c10', front: 'SAL', back: 'Condimento' },
  { id: 'c11', front: 'TE', back: 'Bebida caliente' },
];

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );

const letters = (container) => [...container.querySelectorAll('.ahorcado-key')];
const letter = (container, char) => letters(container).find((button) => button.textContent === char);
const nextButton = (container) =>
  buttonByText(container, 'Siguiente ronda') || buttonByText(container, 'Ver resumen');

const solveWord = (container, word) => {
  for (const char of new Set([...word.toUpperCase()])) {
    if (char === ' ') continue;
    const button = letter(container, char);
    if (button && !button.disabled) click(button);
  }
};

const mountGame = (props = {}) =>
  mount(
    <Ahorcado
      decks={buildDecks(CARDS.slice(0, 10), {}, { size: 5, now: 1000 })}
      deck={CARDS}
      best={{ 'deck-1': 250 }}
      onGrade={() => ({})}
      onExit={() => {}}
      random={PRESERVE}
      {...props}
    />
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ahorcado deck setup (spec-18 T8)', () => {
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

    const picker = container.querySelector('[role="group"][aria-label="Elige tu mazo"]');
    expect(picker).toBeTruthy();
    expect(container.querySelector('[data-deck-id="deck-1"]').getAttribute('aria-pressed')).toBe(
      'true'
    );

    const select = container.querySelector('#ahorcado-rounds');
    expect([...select.options].map((option) => option.value)).toEqual(['3', '4', '5']);
    expect(select.value).toBe('5');
    expect(container.textContent).toContain('5 de 5 palabras del mazo');
    view.unmount();
  });

  it('disables decks below the three-card minimum', () => {
    const view = mount(
      <Ahorcado
        decks={buildDecks(CARDS.slice(0, 9), {}, { size: 4, now: 1000 })}
        deck={CARDS}
        onGrade={() => ({})}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    const lastDeck = view.container.querySelector('[data-deck-id="deck-3"]');
    expect(lastDeck.disabled).toBe(true);
    expect(lastDeck.getAttribute('aria-label')).toContain(
      'No disponible: Necesitas al menos 3 cartas'
    );
    view.unmount();
  });

  it('plays only the selected deck in normal mode', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    expect(container.textContent).toContain('Ronda 1 de 5');

    const deckWords = ['SOL', 'LUNA', 'MAR', 'RIO', 'PAN'];
    for (const word of deckWords) {
      solveWord(container, word);
      click(nextButton(container));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(onGrade.mock.calls.map(([id]) => id)).toEqual([
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
    ]);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'facil')).toBe(true);
    view.unmount();
  });

  it('exits a round grading only the visible card (AC-12)', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    solveWord(container, 'SOL');
    click(buttonByText(container, 'Siguiente ronda'));
    click(buttonByText(container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      ['c1', 'facil'],
      ['c2', 'otra-vez'],
    ]);
    view.unmount();
  });
});

describe('Ahorcado arcade (spec-18 T8)', () => {
  const ARCADE_CARDS = CARDS.slice(0, 3);
  const arcadeDecks = () => buildDecks(ARCADE_CARDS, {}, { size: 10, now: 1000 });

  const mountArcade = (props = {}) =>
    mount(
      <Ahorcado
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
    expect(container.querySelector('#ahorcado-rounds')).toBeNull();
    click(buttonByText(container, 'Empezar'));
  };

  it('subtracts a life per wrong letter, grades failed words and ends at zero', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 100, isRecord: true }));
    const view = mountArcade({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    expect(container.textContent).toContain('Mazo 1 · Arcade');
    expect(container.textContent).toContain('Vidas 3 de 3');

    solveWord(container, 'SOL');
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Puntuación 100');
    expect(container.textContent).toContain('Racha 1');
    click(nextButton(container));

    click(letter(container, 'X'));
    expect(container.textContent).toContain('Vidas 2 de 3');
    solveWord(container, 'LUNA');
    expect(onGrade).toHaveBeenCalledWith('c2', 'otra-vez');
    click(nextButton(container));

    click(letter(container, 'Y'));
    expect(container.textContent).toContain('Vidas 1 de 3');
    click(letter(container, 'Z'));

    await waitFor(() => container.textContent.includes('Partida terminada'));
    expect(onGrade).toHaveBeenCalledWith('c3', 'otra-vez');
    expect(onGrade.mock.calls).toEqual([
      ['c1', 'facil'],
      ['c2', 'otra-vez'],
      ['c3', 'otra-vez'],
    ]);
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 100,
      correct: 1,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    expect(container.textContent).toContain('Puntuación');
    expect(container.textContent).toContain('Fallos');
    view.unmount();
  });

  it('announces lives once through the arcade HUD (spec-18 T15)', () => {
    const view = mountArcade();
    const { container } = view;

    startArcade(container);
    click(letter(container, 'X'));

    const live = [...container.querySelectorAll('[aria-live]')].map((node) => node.textContent);
    expect(live.filter((text) => text.includes('Vidas'))).toEqual([
      expect.stringContaining('Vidas 2 de 3'),
    ]);
    expect(container.querySelector('.arcade-hud__live').getAttribute('aria-atomic')).toBe('true');
    view.unmount();
  });

  it('completes the deck without mistakes and adds the lives bonus', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 480, isRecord: true }));
    const view = mountArcade({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    for (const word of ['SOL', 'LUNA', 'MAR']) {
      solveWord(container, word);
      click(nextButton(container));
    }

    await waitFor(() => container.textContent.includes('Mazo completado'));
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(container.textContent).toContain('480');
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 480,
      correct: 3,
      wrong: 0,
      lives: 3,
      completed: true,
      deckId: 'deck-1',
    });
    expect(onGrade).toHaveBeenCalledTimes(3);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'facil')).toBe(true);
    view.unmount();
  });
});
