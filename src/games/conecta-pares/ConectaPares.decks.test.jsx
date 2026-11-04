import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConectaPares from './ConectaPares.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount, waitFor } from '../../test/render.jsx';

const CARDS = Array.from({ length: 11 }, (_, index) => ({
  id: `c${index + 1}`,
  front: `término ${index + 1}`,
  back: `significado ${index + 1}`,
}));

const TEN = CARDS.slice(0, 10);
const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
const byText = (container, text) =>
  [...container.querySelectorAll('.conecta-card')].find(
    (button) => button.querySelector('.conecta-card__text')?.textContent === text
  );
const questions = (container) => [
  ...container.querySelectorAll('section[aria-label="Preguntas"] .conecta-card'),
];
const match = (container, card) => {
  click(byText(container, card.front));
  click(byText(container, card.back));
};
const mountGame = (props = {}) =>
  mount(
    <ConectaPares
      decks={buildDecks(TEN, {}, { size: 10, now: 1000 })}
      deck={TEN}
      best={{ 'deck-1': 250 }}
      onGrade={() => ({})}
      onExit={() => {}}
      {...props}
    />
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Conecta deck setup (spec-18 T10)', () => {
  it('offers mode, deck picker, mastery, best record and batch options', () => {
    const view = mountGame();
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('No aprendida');
    expect(container.textContent).toContain('Mejor marca: 250 puntos');

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes).toHaveLength(2);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');
    expect(
      container.querySelector('[data-deck-id="deck-1"]').getAttribute('aria-pressed')
    ).toBe('true');

    const select = container.querySelector('#conecta-batch');
    expect([...select.options].map((option) => option.value)).toEqual([
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
    ]);
    expect(select.value).toBe('8');
    expect(container.textContent).toContain('tandas de hasta 8 pares');
    view.unmount();
  });

  it('hides the batch selector in arcade and announces the full deck', () => {
    const view = mountGame();
    click(view.container.querySelector('[data-mode="arcade"]'));

    expect(view.container.querySelector('#conecta-batch')).toBeNull();
    expect(view.container.textContent).toContain('10 pares · 3 vidas');
    view.unmount();
  });

  it('disables decks below the three-pair minimum', () => {
    const view = mount(
      <ConectaPares
        decks={buildDecks(CARDS, {}, { size: 10, now: 1000 })}
        deck={CARDS}
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

  it('plays only the selected deck and never mixes another deck card', () => {
    const decks = buildDecks(TEN, {}, { size: 5, now: 1000 });
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ decks, onGrade });

    click(view.container.querySelector('[data-deck-id="deck-2"]'));
    click(buttonByText(view.container, 'Empezar'));

    expect(questions(view.container)).toHaveLength(5);
    const deckCards = TEN.slice(5);
    for (const card of deckCards) match(view.container, card);

    expect(onGrade).toHaveBeenCalledTimes(5);
    expect(onGrade.mock.calls.map(([id]) => id).sort()).toEqual(
      deckCards.map((card) => card.id).sort()
    );
    expect(view.container.textContent).toContain('Pares emparejados: 5 de 5');
    view.unmount();
  });
});

describe('Conecta full deck in batches (spec-18 T10)', () => {
  it('plays 10 cards as 8 + 2 without discarding any card', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    expect(questions(container)).toHaveLength(8);
    for (const card of TEN.slice(0, 8)) match(container, card);

    expect(container.textContent).toContain('Tanda completada');
    expect(container.textContent).toContain('Tanda 1 de 2');
    expect(onGrade).toHaveBeenCalledTimes(8);

    click(buttonByText(container, 'Siguiente tanda'));
    expect(questions(container)).toHaveLength(2);
    expect(
      new Set(
        questions(container).map(
          (button) => button.querySelector('.conecta-card__text').textContent
        )
      )
    ).toEqual(new Set(['término 9', 'término 10']));

    for (const card of TEN.slice(8)) match(container, card);

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('Pares emparejados: 10 de 10');
    expect(onGrade).toHaveBeenCalledTimes(10);
    expect(new Set(onGrade.mock.calls.map(([id]) => id)).size).toBe(10);
    view.unmount();
  });

  it('exits mid-batch grading only the cards of the visible batch', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    const { container } = view;

    click(buttonByText(container, 'Empezar'));
    match(container, TEN[0]);
    click(buttonByText(container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledTimes(8);
    expect(new Set(onGrade.mock.calls.map(([id]) => id)).size).toBe(8);
    expect(onGrade.mock.calls.map(([id]) => id)).not.toContain('c9');
    expect(onGrade.mock.calls.map(([id]) => id)).not.toContain('c10');
    view.unmount();
  });
});

describe('Conecta arcade (spec-18 T10)', () => {
  const FIVE = CARDS.slice(0, 5);
  const fiveDecks = () => buildDecks(FIVE, {}, { size: 10, now: 1000 });
  const startArcade = (container) => {
    click(container.querySelector('[data-mode="arcade"]'));
    expect(container.querySelector('#conecta-batch')).toBeNull();
    click(buttonByText(container, 'Empezar'));
  };

  it('scores connections, charges a life per miss and completes with bonus', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 660, isRecord: true }));
    const view = mount(
      <ConectaPares
        decks={fiveDecks()}
        deck={FIVE}
        best={{}}
        onGrade={onGrade}
        onArcadeEnd={onArcadeEnd}
        onExit={() => {}}
      />
    );
    const { container } = view;

    startArcade(container);
    expect(container.textContent).toContain('Vidas 3 de 3');
    expect(container.textContent).toContain('Puntuación 0');

    match(container, FIVE[0]);
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Puntuación 100');

    click(byText(container, FIVE[1].front));
    click(byText(container, FIVE[2].back));
    expect(onGrade).toHaveBeenCalledWith('c2', 'otra-vez');
    expect(container.textContent).toContain('Vidas 2 de 3');

    match(container, FIVE[1]);
    match(container, FIVE[2]);
    match(container, FIVE[3]);
    match(container, FIVE[4]);

    await waitFor(() => container.textContent.includes('Mazo completado'));
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 660,
      correct: 5,
      wrong: 1,
      lives: 2,
      completed: true,
      deckId: 'deck-1',
    });
    expect(container.textContent).toContain('660');
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(onGrade).toHaveBeenCalledTimes(5);
    expect(onGrade.mock.calls.filter(([id]) => id === 'c2')).toEqual([
      ['c2', 'otra-vez'],
    ]);
    view.unmount();
  });

  it('ends immediately at zero lives, grades the implicated cards and keeps no bonus', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 0, isRecord: false }));
    const view = mount(
      <ConectaPares
        decks={buildDecks(CARDS.slice(0, 4), {}, { size: 10, now: 1000 })}
        deck={CARDS.slice(0, 4)}
        best={{}}
        onGrade={onGrade}
        onArcadeEnd={onArcadeEnd}
        onExit={() => {}}
      />
    );
    const { container } = view;

    startArcade(container);
    click(byText(container, 'término 1'));
    click(byText(container, 'significado 2'));
    click(byText(container, 'término 2'));
    click(byText(container, 'significado 3'));
    click(byText(container, 'término 3'));
    click(byText(container, 'significado 4'));

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
    expect(onGrade.mock.calls).toHaveLength(4);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'otra-vez')).toBe(true);
    expect(new Set(onGrade.mock.calls.map(([id]) => id)).size).toBe(4);
    expect(container.textContent).toContain('Fallos');
    view.unmount();
  });

  it('replays the same deck and exits through the session control', async () => {
    const onExit = vi.fn();
    const onArcadeEnd = vi.fn(() => ({ best: 0, isRecord: false }));
    const view = mount(
      <ConectaPares
        decks={fiveDecks()}
        deck={FIVE}
        best={{}}
        onGrade={() => ({})}
        onArcadeEnd={onArcadeEnd}
        onExit={onExit}
      />
    );
    const { container } = view;

    startArcade(container);
    for (const card of FIVE) match(container, card);
    await waitFor(() => container.textContent.includes('Mazo completado'));

    click(buttonByText(container, 'Repetir'));
    expect(container.textContent).toContain('Vidas 3 de 3');
    expect(questions(container)).toHaveLength(5);

    click(buttonByText(container, 'Salir'));
    expect(onExit).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
