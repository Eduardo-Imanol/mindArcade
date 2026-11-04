import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Flashcards from './Flashcards.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount, waitFor } from '../../test/render.jsx';

const PRESERVE = () => 0.999999;

const makeCards = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `c${index + 1}`,
    front: `front ${index + 1}`,
    back: `back ${index + 1}`,
    difficulty: 'easy',
  }));

const CARDS = makeCards(11);

const studiedState = () => ({ reps: 3, nextReview: 2000 });

const pendingDecks = () =>
  buildDecks(CARDS, { c1: { reps: 1, nextReview: 500 } }, { size: 10, now: 1000 });

const masteredDecks = () => {
  const srs = Object.fromEntries(CARDS.slice(0, 10).map((card) => [card.id, studiedState()]));
  return buildDecks(CARDS, srs, { size: 10, now: 1000 });
};

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const gradeCard = (container, label = 'Fácil') => {
  click(container.querySelector('.flashcards-card'));
  click(buttonByText(container, label));
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Flashcards decks setup (spec-18 T6)', () => {
  it('offers mode and deck controls with pressed states, mastery and best record', () => {
    const view = mount(
      <Flashcards
        decks={pendingDecks()}
        deck={CARDS}
        best={{ 'deck-1': 420 }}
        onGrade={() => ({ gained: 10 })}
        onExit={() => {}}
        random={PRESERVE}
      />
    );
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('Mazo 2');
    expect(container.textContent).toContain('No aprendida');
    expect(container.textContent).toContain('Mejor marca: 420 puntos');
    expect(buttonByText(container, 'Reanudar mazo')).toBeTruthy();

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes.map((button) => button.tagName)).toEqual(['BUTTON', 'BUTTON']);
    expect(modes.every((button) => button.getAttribute('type') === 'button')).toBe(true);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');

    const picker = container.querySelector('[role="group"][aria-label="Elige tu mazo"]');
    expect(picker).toBeTruthy();
    const firstDeck = container.querySelector('[data-deck-id="deck-1"]');
    expect(firstDeck.getAttribute('aria-pressed')).toBe('true');

    click(container.querySelector('[data-deck-id="deck-2"]'));
    expect(buttonByText(container, 'Empezar mazo')).toBeTruthy();

    click(container.querySelector('[data-mode="arcade"]'));
    expect(buttonByText(container, 'Jugar arcade')).toBeTruthy();
    expect(container.textContent).toContain('3 vidas');
    view.unmount();
  });

  it('normal session resumes only the pending cards of the deck', () => {
    const decks = pendingDecks();
    const onGrade = vi.fn(() => ({ gained: 10 }));
    const view = mount(
      <Flashcards
        decks={decks}
        deck={CARDS}
        onGrade={onGrade}
        onExit={() => {}}
        random={PRESERVE}
      />
    );
    click(buttonByText(view.container, 'Reanudar mazo'));

    expect(view.container.textContent).toContain('Carta 1 de 9');
    expect(view.container.textContent).not.toContain('Carta 1 de 10');

    for (let index = 0; index < 9; index += 1) gradeCard(view.container);

    expect(onGrade).toHaveBeenCalledTimes(9);
    expect(onGrade.mock.calls.map(([id]) => id)).not.toContain('c1');
    expect(view.container.textContent).toContain('Mazo 1 completado');
    view.unmount();
  });

  it('reviews the whole deck when every card is already studied', () => {
    const view = mount(
      <Flashcards
        decks={masteredDecks()}
        deck={CARDS}
        onGrade={() => ({ gained: 10 })}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    expect(view.container.textContent).toContain('Aprendida');
    expect(buttonByText(view.container, 'Repasar mazo')).toBeTruthy();
    click(buttonByText(view.container, 'Repasar mazo'));
    expect(view.container.textContent).toContain('Carta 1 de 10');
    view.unmount();
  });

  it('starts the next deck from the normal summary', async () => {
    const srs = Object.fromEntries(
      CARDS.slice(0, 9).map((card) => [card.id, { reps: 3, nextReview: 2000 }])
    );
    const decks = buildDecks(CARDS, srs, { size: 10, now: 1000 });
    const view = mount(
      <Flashcards
        decks={decks}
        deck={CARDS}
        onGrade={() => ({ gained: 10 })}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    click(buttonByText(view.container, 'Reanudar mazo'));
    expect(view.container.textContent).toContain('Carta 1 de 1');
    gradeCard(view.container);

    expect(view.container.textContent).toContain('Mazo 1 completado');
    click(buttonByText(view.container, 'Siguiente mazo'));
    await waitFor(() => view.container.textContent.includes('Mazo 2'));
    expect(view.container.textContent).toContain('Carta 1 de 1');
    view.unmount();
  });
});

describe('Flashcards arcade (spec-18 T6)', () => {
  const ARCADE_CARDS = makeCards(4);
  const arcadeDecks = () => buildDecks(ARCADE_CARDS, {}, { size: 10, now: 1000 });

  const startArcade = (container) => {
    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Jugar arcade'));
  };

  it('loses after three misses, keeps score and reports the run once', async () => {
    const onGrade = vi.fn(() => ({ gained: 0 }));
    const onArcadeEnd = vi.fn(() => ({ best: 100, isRecord: true }));
    const view = mount(
      <Flashcards
        decks={arcadeDecks()}
        deck={ARCADE_CARDS}
        best={{}}
        onGrade={onGrade}
        onArcadeEnd={onArcadeEnd}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    startArcade(view.container);
    expect(view.container.textContent).toContain('Vidas 3 de 3');

    gradeCard(view.container, 'Fácil');
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(view.container.textContent).toContain('Puntuación 100');
    expect(view.container.textContent).toContain('Racha 1');

    gradeCard(view.container, 'Otra vez');
    expect(view.container.textContent).toContain('Vidas 2 de 3');
    gradeCard(view.container, 'Otra vez');
    expect(view.container.textContent).toContain('Vidas 1 de 3');
    gradeCard(view.container, 'Otra vez');

    await waitFor(() => view.container.textContent.includes('Partida terminada'));
    expect(view.container.textContent).toContain('¡Nuevo récord!');
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 100,
      correct: 1,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    view.unmount();
  });

  it('completes the full deck and adds the remaining-lives bonus', async () => {
    const onGrade = vi.fn(() => ({ gained: 0 }));
    const onArcadeEnd = vi.fn(() => ({ best: 610, isRecord: true }));
    const view = mount(
      <Flashcards
        decks={arcadeDecks()}
        deck={ARCADE_CARDS}
        best={{}}
        onGrade={onGrade}
        onArcadeEnd={onArcadeEnd}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    startArcade(view.container);
    for (let index = 0; index < ARCADE_CARDS.length; index += 1) gradeCard(view.container);

    await waitFor(() => view.container.textContent.includes('Mazo completado'));
    expect(view.container.textContent).toContain('Puntuación');
    expect(view.container.textContent).toContain('610');
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
    view.unmount();
  });
});
