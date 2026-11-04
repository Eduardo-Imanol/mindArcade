import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuizSignificado from './QuizSignificado.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, mount, setValue, waitFor } from '../../test/render.jsx';

const PRESERVE = () => 0.999999;

const CARDS = Array.from({ length: 11 }, (_, index) => ({
  id: `c${index + 1}`,
  front: `término ${index + 1}`,
  back: `significado ${index + 1}`,
}));

const DECKS = buildDecks(CARDS.slice(0, 10), {}, { size: 5, now: 1000 });
const OUTSIDE = CARDS[10];

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const optionButtons = (container) => [...container.querySelectorAll('.quiz-option')];

const questionFront = (container) =>
  container.querySelector('.quiz-question__text').textContent;

const cardFor = (front) => CARDS.find((card) => card.front === front);

const optionFor = (container, back) =>
  optionButtons(container).find((button) =>
    button.getAttribute('aria-label').endsWith(back)
  );

const answerCorrectly = (container) => {
  const card = cardFor(questionFront(container));
  click(optionFor(container, card.back));
  return card;
};

const wrongOptions = (container) => {
  const correctBack = cardFor(questionFront(container)).back;
  return optionButtons(container).filter(
    (button) =>
      !button.disabled && !button.getAttribute('aria-label').endsWith(correctBack)
  );
};

const nextButton = (container) =>
  buttonByText(container, 'Siguiente') || buttonByText(container, 'Ver resumen');

const mountGame = (props = {}) =>
  mount(
    <QuizSignificado
      decks={DECKS}
      deck={CARDS}
      best={{ 'deck-1': 250, 'deck-2': 0 }}
      onGrade={() => ({})}
      onExit={() => {}}
      random={PRESERVE}
      {...props}
    />
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Quiz deck setup (spec-18 T7)', () => {
  it('uses mode switches and a deck picker, capping rounds to the deck', () => {
    const view = mountGame();
    const { container } = view;

    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('Mazo 2');
    expect(container.textContent).toContain('No aprendida');

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes.map((button) => button.tagName)).toEqual(['BUTTON', 'BUTTON']);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');

    const picker = container.querySelector('[role="group"][aria-label="Elige tu mazo"]');
    expect(picker).toBeTruthy();
    const firstDeck = container.querySelector('[data-deck-id="deck-1"]');
    expect(firstDeck.getAttribute('aria-pressed')).toBe('true');

    const select = container.querySelector('#quiz-rounds');
    expect([...select.options].map((option) => option.value)).toEqual(['3', '4', '5']);
    expect(select.value).toBe('5');
    expect(container.textContent).toContain('5 de 5 cartas del mazo');
    view.unmount();
  });

  it('plays only the chosen deck, both questions and options', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    click(buttonByText(view.container, 'Empezar'));

    expect(view.container.textContent).toContain('Pregunta 1 de 5');

    const deckBacks = CARDS.slice(0, 5).map((card) => card.back);
    for (let index = 1; index <= 5; index += 1) {
      expect(questionFront(view.container)).toBe(`término ${index}`);
      const labels = optionButtons(view.container).map((button) =>
        button.getAttribute('aria-label')
      );
      expect(labels).toHaveLength(4);
      for (const label of labels) {
        const back = label.split(': ').slice(1).join(': ');
        expect(deckBacks).toContain(back);
        expect(back).not.toBe(OUTSIDE.back);
      }
      answerCorrectly(view.container);
      expect(onGrade).toHaveBeenCalledWith(`c${index}`, 'facil');
      click(nextButton(view.container));
    }

    expect(view.container.textContent).toContain('Sesión completada');
    expect(view.container.textContent).toContain('1 · 1–5');
    expect(onGrade).toHaveBeenCalledTimes(5);
    view.unmount();
  });

  it('switches deck and starts with the selected rounds', () => {
    const view = mountGame();
    click(view.container.querySelector('[data-deck-id="deck-2"]'));
    const select = view.container.querySelector('#quiz-rounds');
    expect([...select.options].map((option) => option.value)).toEqual(['3', '4', '5']);
    setValue(select, '3');
    expect(select.value).toBe('3');

    click(buttonByText(view.container, 'Empezar'));
    expect(view.container.textContent).toContain('Pregunta 1 de 3');
    expect(questionFront(view.container)).toBe('término 6');
    expect(view.container.textContent).toContain('Mazo 2');

    const deckBacks = CARDS.slice(5, 10).map((card) => card.back);
    for (const button of optionButtons(view.container)) {
      const back = button.getAttribute('aria-label').split(': ').slice(1).join(': ');
      expect(deckBacks).toContain(back);
    }
    view.unmount();
  });

  it('disables decks below the quiz minimum of four cards', () => {
    const thirteen = Array.from({ length: 13 }, (_, index) => ({
      id: `s${index + 1}`,
      front: `small ${index + 1}`,
      back: `back ${index + 1}`,
    }));
    const view = mount(
      <QuizSignificado
        decks={buildDecks(thirteen, {}, { size: 5, now: 1000 })}
        deck={thirteen}
        onGrade={() => ({})}
        onExit={() => {}}
        random={PRESERVE}
      />
    );

    const smallDeck = view.container.querySelector('[data-deck-id="deck-3"]');
    expect(smallDeck.disabled).toBe(true);
    expect(smallDeck.getAttribute('aria-label')).toContain(
      'No disponible: Necesitas al menos 4 cartas'
    );
    view.unmount();
  });

  it('exits a deck session grading only the visible card (AC-12)', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    click(buttonByText(view.container, 'Empezar'));
    answerCorrectly(view.container);
    click(buttonByText(view.container, 'Siguiente'));
    click(buttonByText(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      ['c1', 'facil'],
      ['c2', 'otra-vez'],
    ]);
    view.unmount();
  });
});

describe('Quiz arcade (spec-18 T7)', () => {
  const startArcade = (container) => {
    click(container.querySelector('[data-mode="arcade"]'));
    expect(container.querySelector('#quiz-rounds')).toBeNull();
    expect(container.textContent).toContain('Mazo completo: 5 preguntas · 3 vidas');
    click(buttonByText(container, 'Empezar'));
  };

  it('plays the full deck, costs a life per miss and grades any hit as facil', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 200, isRecord: true }));
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    expect(container.textContent).toContain('Mazo 1 · Arcade');
    expect(container.textContent).toContain('Vidas 3 de 3');

    answerCorrectly(container);
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Puntuación 100');
    expect(container.textContent).toContain('Racha 1');
    click(nextButton(container));

    click(wrongOptions(container)[0]);
    expect(onGrade).not.toHaveBeenCalledWith('c2', 'facil');
    expect(container.textContent).toContain('Vidas 2 de 3');
    answerCorrectly(container);
    expect(onGrade).toHaveBeenCalledWith('c2', 'facil');
    expect(container.textContent).toContain('Puntuación 200');
    click(nextButton(container));

    click(wrongOptions(container)[0]);
    click(wrongOptions(container)[0]);

    await waitFor(() => container.textContent.includes('Partida terminada'));
    expect(onGrade).toHaveBeenCalledWith('c3', 'otra-vez');
    expect(onGrade.mock.calls).toEqual([
      ['c1', 'facil'],
      ['c2', 'facil'],
      ['c3', 'otra-vez'],
    ]);
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 200,
      correct: 2,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    expect(container.textContent).toContain('Puntuación');
    expect(container.textContent).toContain('200');
    expect(container.textContent).toContain('Fallos');
    view.unmount();
  });

  it('plays every card, then adds the remaining-lives bonus', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 750, isRecord: true }));
    const view = mountGame({ onGrade, onArcadeEnd });
    const { container } = view;

    startArcade(container);
    for (let index = 1; index <= 5; index += 1) {
      answerCorrectly(container);
      expect(onGrade).toHaveBeenCalledWith(`c${index}`, 'facil');
      click(nextButton(container));
    }

    await waitFor(() => container.textContent.includes('Mazo completado'));
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(container.textContent).toContain('750');
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 750,
      correct: 5,
      wrong: 0,
      lives: 3,
      completed: true,
      deckId: 'deck-1',
    });
    expect(onGrade).toHaveBeenCalledTimes(5);
    view.unmount();
  });
});
