import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuizSignificado from './QuizSignificado.jsx';
import { click, fire, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'a', front: 'closure', back: 'captura el entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
];

const mountGame = (props = {}) =>
  mount(
    <QuizSignificado
      deck={DECK}
      selectCards={(count) => DECK.slice(0, count)}
      onGrade={() => ({})}
      onExit={() => {}}
      {...props}
    />
  );

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const chooseRounds = (container, rounds) => {
  const select = container.querySelector('#quiz-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
};

const startGame = (container, rounds = 3) => {
  chooseRounds(container, rounds);
  click(buttonByText(container, 'Empezar'));
};

const options = (container) => [...container.querySelectorAll('.quiz-option')];
const questionText = (container) => container.querySelector('.quiz-question__text').textContent;
const backFor = (front) => DECK.find((card) => card.front === front).back;
const correctOption = (container) =>
  options(container).find((button) =>
    button.getAttribute('aria-label').endsWith(backFor(questionText(container)))
  );
const wrongOptions = (container) =>
  options(container).filter(
    (button) => !button.getAttribute('aria-label').endsWith(backFor(questionText(container)))
  );
const status = (container) => container.querySelector('.quiz-status');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('quiz-significado setup + keyboard (AC-9)', () => {
  it('uses a native labelled select and native buttons only', () => {
    const view = mountGame();
    const select = view.container.querySelector('#quiz-rounds');

    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('10');
    expect(view.container.querySelector('label[for="quiz-rounds"]').textContent).toContain(
      'Rondas'
    );
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
    expect(view.container.querySelectorAll('[role="button"]:not(button)').length).toBe(0);
    for (const button of view.container.querySelectorAll('button')) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.tabIndex).toBe(0);
    }

    const start = buttonByText(view.container, 'Empezar');
    start.focus();
    expect(document.activeElement).toBe(start);
    view.unmount();
  });

  it('keeps TTS controls hidden without speechSynthesis but fully playable', () => {
    const view = mountGame();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeUndefined();
    expect(buttonByText(view.container, '🔇 Silencio')).toBeUndefined();
    startGame(view.container);

    expect(view.container.querySelector('[aria-label="Escuchar la pregunta"]')).toBeNull();
    expect(options(view.container)).toHaveLength(4);

    click(wrongOptions(view.container)[0]);
    click(correctOption(view.container));
    expect(view.container.querySelector('[aria-label="Escuchar la respuesta correcta"]')).toBeNull();
    expect(view.container.textContent).toContain('Siguiente');
    view.unmount();
  });
});

describe('quiz-significado round semantics (AC-4, AC-5, AC-7, AC-9)', () => {
  it('renders four labelled native option buttons in a named group', () => {
    const view = mountGame();
    startGame(view.container);

    const group = view.container.querySelector('[role="group"]');
    expect(group.getAttribute('aria-label')).toBe('Opciones de significado');
    expect(options(view.container)).toHaveLength(4);
    for (const [index, button] of options(view.container).entries()) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toMatch(new RegExp(`^Opción ${index + 1}: .+`));
      expect(button.disabled).toBe(false);
    }
    view.unmount();
  });

  it('announces failures, remaining attempts and the correct answer without stale text', () => {
    const view = mountGame();
    startGame(view.container);

    const live = status(view.container);
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toContain('Pregunta 1 de 3');

    const [firstWrong] = wrongOptions(view.container);
    click(firstWrong);
    expect(firstWrong.disabled).toBe(true);
    expect(firstWrong.className).toContain('is-wrong');
    expect(live.textContent).toContain('Fallo. Te queda 1 intento');

    click(correctOption(view.container));
    expect(live.textContent).toContain('¡Correcto! La respuesta es');
    expect(live.textContent).toContain(backFor('closure'));
    expect(live.textContent).not.toContain('Fallo');
    expect(options(view.container).every((button) => button.disabled)).toBe(true);

    click(buttonByText(view.container, 'Siguiente'));
    expect(live.textContent).toBe('Pregunta 2 de 3');
    expect(options(view.container).every((button) => !button.disabled)).toBe(true);
    view.unmount();
  });

  it('reveals the correct option after two failures and disables the board', () => {
    const view = mountGame();
    startGame(view.container);

    const [first, second] = wrongOptions(view.container);
    click(first);
    click(second);

    expect(status(view.container).textContent).toContain('Incorrecto. La respuesta correcta es');
    expect(correctOption(view.container).className).toContain('is-correct');
    expect(options(view.container).every((button) => button.disabled)).toBe(true);
    expect(buttonByText(view.container, 'Siguiente')).toBeTruthy();
    view.unmount();
  });

  it('exiting mid-session grades unresolved rounds as otra-vez exactly once', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    startGame(view.container);

    click(correctOption(view.container));
    click(buttonByText(view.container, 'Siguiente'));
    click(buttonByText(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls).toEqual([
      ['a', 'facil'],
      ['b', 'otra-vez'],
      ['c', 'otra-vez'],
    ]);
    view.unmount();
  });
});

describe('quiz-significado responsive + motion contract (AC-9)', () => {
  it('contracts a 2x2 wrapping grid, >=44px targets, focus ring and reduced motion', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'src/games/quiz-significado/QuizSignificado.jsx'),
      'utf8'
    );

    const grid = tokens.match(/\.quiz-options\s*{([^}]*)}/s)[1];
    expect(grid).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(grid).toMatch(/gap:\s*10px/);

    const option = tokens.match(/\.quiz-option\s*{([^}]*)}/s)[1];
    expect(Number(option.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(option).toMatch(/min-width:\s*0/);
    expect(tokens).toMatch(
      /\.quiz-option:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );

    const select = tokens.match(/\.quiz-setup select\s*{([^}]*)}/s)[1];
    expect(Number(select.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(tokens).toMatch(
      /\.quiz-setup select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-width:\s*44px/s);

    const page = tokens.match(/\.quiz-page\s*{([^}]*)}/s)[1];
    expect(page).toMatch(/width:\s*100%/);
    expect(page).toMatch(/max-width:\s*100%/);

    expect(tokens).toMatch(/\.quiz-question__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.quiz-option__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.quiz-option\s*{\s*transition:\s*none/
    );

    expect(code).toMatch(/maxWidth:\s*'100%'/);
    expect(code).toMatch(/game-stage/);
    expect(code).not.toMatch(/width:\s*['"]?\d{4,}/);
  });
});
