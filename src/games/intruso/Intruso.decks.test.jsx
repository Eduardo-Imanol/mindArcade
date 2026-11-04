import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Intruso from './Intruso.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount, waitFor } from '../../test/render.jsx';

const card = (id, front, back) => ({ id, front, back, difficulty: 'easy' });

const FUNCIONES_CARDS = Array.from({ length: 11 }, (_, index) =>
  card(`f${index + 1}`, `entrada ${index + 1}`, `significado ${index + 1}`)
);

const FUNCIONES = { id: 'funciones', title: 'Funciones', cards: FUNCIONES_CARDS };

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
const ALGORITHM_BACKS = ALGORITMOS.cards.map((entry) => entry.back);
const FUNCTION_BACKS = FUNCIONES_CARDS.map((entry) => entry.back);

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
const options = (container) => [...container.querySelectorAll('.intruso-option')];
const backOf = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const intruderOption = (container) =>
  options(container).find((button) => ALGORITHM_BACKS.includes(backOf(button)));
const baseOption = (container) =>
  options(container).find((button) => FUNCTION_BACKS.includes(backOf(button)));
const intruderCard = (button) =>
  ALGORITMOS.cards.find((entry) => entry.back === backOf(button));

const mountGame = (props = {}) =>
  mount(
    <Intruso
      decks={buildDecks(FUNCIONES_CARDS, {}, { size: 5, now: 1000 })}
      deck={FUNCIONES_CARDS}
      best={{ 'deck-1': 300 }}
      groups={GROUPS}
      allGroups={GROUPS}
      anchorTopicId="funciones"
      onGrade={() => ({})}
      onExit={() => {}}
      {...props}
    />
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Intruso deck setup (spec-18 T11)', () => {
  it('offers mode, deck picker, mastery, best record and capped rounds', () => {
    const view = mountGame();
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('No aprendida');
    expect(container.textContent).toContain('Mejor marca: 300 puntos');

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes).toHaveLength(2);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');
    expect(
      container.querySelector('[data-deck-id="deck-1"]').getAttribute('aria-pressed')
    ).toBe('true');

    const select = container.querySelector('#intruso-rounds');
    expect([...select.options].map((option) => option.value)).toEqual(['3', '4', '5']);
    expect(select.value).toBe('5');
    expect(container.textContent).toContain('5 de 5 rondas');
    view.unmount();
  });

  it('hides the rounds selector in arcade and announces the full deck', () => {
    const view = mountGame();
    click(view.container.querySelector('[data-mode="arcade"]'));

    expect(view.container.querySelector('#intruso-rounds')).toBeNull();
    expect(view.container.textContent).toContain('mazo completo: 5 rondas · 3 vidas');
    view.unmount();
  });

  it('disables decks below the three-card minimum', () => {
    const view = mount(
      <Intruso
        decks={buildDecks(FUNCIONES_CARDS, {}, { size: 10, now: 1000 })}
        deck={FUNCIONES_CARDS}
        groups={GROUPS}
        allGroups={GROUPS}
        anchorTopicId="funciones"
        onGrade={() => ({})}
        onExit={() => {}}
      />
    );
    const smallDeck = view.container.querySelector('[data-deck-id="deck-2"]');

    expect(smallDeck.disabled).toBe(true);
    expect(smallDeck.getAttribute('aria-label')).toContain(
      'No disponible: Necesitas al menos 3 cartas'
    );
    view.unmount();
  });

  it('uses only the selected deck as anchor and other topics as intruders', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    const { container } = view;

    click(container.querySelector('[data-deck-id="deck-2"]'));
    click(buttonByText(container, 'Empezar'));

    expect(container.textContent).toContain('Mazo 2');
    expect(container.textContent).toContain('Ronda 1 de 5');

    const deckTwoBacks = FUNCIONES_CARDS.slice(5, 10).map((entry) => entry.back);
    const usedBacks = options(container).map(backOf);
    for (const back of usedBacks) {
      expect(deckTwoBacks.includes(back) || ALGORITHM_BACKS.includes(back)).toBe(true);
    }
    expect(usedBacks.some((back) => FUNCIONES_CARDS[0].back === back)).toBe(false);

    const intruder = intruderOption(container);
    const expected = intruderCard(intruder);
    click(intruder);
    expect(onGrade).toHaveBeenCalledWith(expected.id, 'facil', {
      topicId: 'algoritmos',
    });
    view.unmount();
  });

  it('renders image overrides from other topics as intruder options', () => {
    const withImages = {
      ...ALGORITMOS,
      cards: ALGORITMOS.cards.map((entry) => ({
        ...entry,
        image: { kind: 'emoji', value: '🦴' },
      })),
    };
    const groups = [FUNCIONES, withImages];
    const view = mountGame({ groups, allGroups: groups });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    expect(intruderOption(container).textContent).toContain('🦴');
    view.unmount();
  });

  it('exits mid-round grading only the current intruder', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    const expected = intruderCard(intruderOption(container));
    click(buttonByText(container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      [expected.id, 'otra-vez', { topicId: 'algoritmos' }],
    ]);
    view.unmount();
  });
});

describe('Intruso arcade (spec-18 T11)', () => {
  const startArcade = (container) => {
    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));
  };

  it('ends at zero lives, charging one life per wrong intruder', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 0, isRecord: false }));
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    expect(container.textContent).toContain('Vidas 3 de 3');
    expect(container.textContent).toContain('Ronda 1 de 5');

    for (let round = 1; round <= 3; round += 1) {
      const expected = intruderCard(intruderOption(container));
      click(baseOption(container));
      expect(onGrade).toHaveBeenCalledWith(expected.id, 'otra-vez', {
        topicId: 'algoritmos',
      });
      if (round < 3) click(buttonByText(container, 'Siguiente'));
    }

    await waitFor(() => container.textContent.includes('Partida terminada'));
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 0,
      correct: 0,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    expect(onGrade).toHaveBeenCalledTimes(3);
    expect(container.textContent).toContain('Fallos');
    view.unmount();
  });

  it('plays the full deck and adds the remaining-lives bonus', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 750, isRecord: true }));
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    for (let round = 1; round <= 5; round += 1) {
      const expected = intruderCard(intruderOption(container));
      click(intruderOption(container));
      expect(onGrade).toHaveBeenCalledWith(expected.id, 'facil', {
        topicId: 'algoritmos',
      });
      click(
        buttonByText(
          container,
          round === 5 ? 'Ver resumen' : 'Siguiente'
        )
      );
    }

    await waitFor(() => container.textContent.includes('Mazo completado'));
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 750,
      correct: 5,
      wrong: 0,
      lives: 3,
      completed: true,
      deckId: 'deck-1',
    });
    expect(onGrade.mock.calls).toHaveLength(4);
    expect(new Set(onGrade.mock.calls.map(([id]) => id)).size).toBe(4);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'facil')).toBe(true);
    expect(container.textContent).toContain('750');
    expect(container.textContent).toContain('¡Nuevo récord!');
    view.unmount();
  });

  it('shows the arcade summary without leaving the deck', async () => {
    const onArcadeEnd = vi.fn(() => ({ best: 0, isRecord: false }));
    const view = mountGame({ onArcadeEnd });
    const { container } = view;

    startArcade(container);
    for (let round = 1; round <= 3; round += 1) {
      click(baseOption(container));
      if (round < 3) click(buttonByText(container, 'Siguiente'));
    }
    await waitFor(() => container.textContent.includes('Partida terminada'));

    expect(container.textContent).toContain('Mazo 1 (1–5)');
    click(buttonByText(container, 'Repetir'));
    expect(container.textContent).toContain('Vidas 3 de 3');
    expect(container.textContent).toContain('Ronda 1 de 5');
    view.unmount();
  });
});

describe('Intruso deck availability (spec-18 T11)', () => {
  it('blocks the game when no other topic can provide intruders', () => {
    const view = mountGame({ groups: [FUNCIONES], allGroups: [FUNCIONES] });

    expect(view.container.textContent).toContain(
      'Este juego necesita al menos dos temas con 3 cartas cada uno.'
    );
    view.unmount();
  });
});
