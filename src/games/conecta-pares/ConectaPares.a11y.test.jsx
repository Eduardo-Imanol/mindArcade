import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConectaPares from './ConectaPares.jsx';
import { click, keydown, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'perro', front: 'perro', back: 'dog' },
  { id: 'gato', front: 'gato', back: 'cat' },
  { id: 'sol', front: 'sol', back: 'sun' },
  { id: 'luna', front: 'luna', back: 'moon' },
];

const findButton = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);
const byText = (container, text) =>
  [...container.querySelectorAll('.conecta-card')].find(
    (button) => button.querySelector('.conecta-card__text')?.textContent === text
  );
const questions = (container) => [
  ...container.querySelectorAll('section[aria-label="Preguntas"] .conecta-card'),
];
const meanings = (container) => [
  ...container.querySelectorAll('section[aria-label="Significados"] .conecta-card'),
];
const status = (container) => container.querySelector('.conecta-status');
const start = (container) => click(findButton(container, 'Empezar'));
const match = (container, front, back) => {
  click(byText(container, front));
  click(byText(container, back));
};

const mountGame = (props = {}) =>
  mount(
    <ConectaPares
      deck={DECK}
      selectCards={(count) => DECK.slice(0, count)}
      onGrade={() => {}}
      onExit={() => {}}
      {...props}
    />
  );

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

function enableTts() {
  const synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ name: 'Monica', lang: 'es-ES' }]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: FakeUtterance,
    configurable: true,
  });
  return synth;
}

afterEach(() => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('conecta-pares labels and keyboard', () => {
  it('names both columns and every card by column and position', () => {
    const view = mountGame();
    const { container } = view;
    start(container);

    expect(container.querySelector('section[aria-label="Preguntas"]')).toBeTruthy();
    expect(container.querySelector('section[aria-label="Significados"]')).toBeTruthy();
    expect(container.querySelectorAll('.conecta-column__title')[0].textContent).toBe('Preguntas');
    expect(container.querySelectorAll('.conecta-column__title')[1].textContent).toBe(
      'Significados'
    );

    questions(container).forEach((button, index) => {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.tabIndex).toBe(0);
      expect(button.getAttribute('aria-label')).toMatch(
        new RegExp(`^Pregunta ${index + 1} de 4: .+`)
      );
      expect(button.getAttribute('aria-pressed')).toBe('false');
    });
    meanings(container).forEach((button, index) => {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toMatch(
        new RegExp(`^Significado ${index + 1} de 4: .+`)
      );
    });
    view.unmount();
  });

  it('reflects the selection with aria-pressed and clears it with Escape', () => {
    const view = mountGame();
    const { container } = view;
    start(container);

    click(questions(container)[0]);
    expect(questions(container)[0].getAttribute('aria-pressed')).toBe('true');
    click(questions(container)[1]);
    expect(questions(container)[0].getAttribute('aria-pressed')).toBe('false');
    expect(questions(container)[1].getAttribute('aria-pressed')).toBe('true');

    keydown(document, 'Escape');
    expect(questions(container)[1].getAttribute('aria-pressed')).toBe('false');
    view.unmount();
  });

  it('announces selection, errors and matches without stale text', () => {
    const view = mountGame();
    const { container } = view;
    start(container);

    const live = status(container);
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Pares 0 de 4.');

    click(byText(container, 'perro'));
    expect(live.textContent).toBe('Seleccionado: «perro».');
    expect(live.textContent).not.toContain('Pares 0 de 4');

    click(byText(container, 'cat'));
    expect(live.textContent).toBe('No coincide. Intenta de nuevo.');
    expect(live.textContent).not.toContain('Seleccionado');
    expect(container.querySelector('.conecta-feedback.is-wrong')).toBeTruthy();

    click(byText(container, 'perro'));
    click(byText(container, 'dog'));
    expect(live.textContent).toContain('¡Par correcto!');
    expect(live.textContent).toContain('perro');
    expect(live.textContent).toContain('dog');
    expect(live.textContent).not.toContain('No coincide');
    view.unmount();
  });

  it('moves focus to the next unmatched question and to the summary heading', () => {
    const view = mountGame();
    const { container } = view;
    start(container);

    const order = questions(container).map(
      (button) => button.querySelector('.conecta-card__text').textContent
    );
    const first = order[0];
    const firstCard = DECK.find((card) => card.front === first);
    match(container, firstCard.front, firstCard.back);

    const nextQuestion = questions(container).find(
      (button) => !button.disabled
    );
    expect(document.activeElement).toBe(nextQuestion);
    expect(nextQuestion.querySelector('.conecta-card__text').textContent).toBe(order[1]);

    for (const front of order.slice(1)) {
      const card = DECK.find((entry) => entry.front === front);
      match(container, card.front, card.back);
    }

    const heading = container.querySelector('h1');
    expect(heading.textContent).toBe('Sesión completada');
    expect(heading.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(heading);
    view.unmount();
  });
});

describe('conecta-pares TTS', () => {
  it('sticks to the no-speechSynthesis contract while staying fully playable', () => {
    const onGrade = vi.fn();
    const view = mountGame({ onGrade });
    const { container } = view;

    expect(findButton(container, '🔊 Sonido')).toBeUndefined();
    expect(findButton(container, '🔇 Silencio')).toBeUndefined();

    start(container);
    click(byText(container, 'perro'));
    expect(container.querySelector('[aria-label="Escuchar el elemento seleccionado"]')).toBeNull();
    click(byText(container, 'dog'));

    expect(onGrade).toHaveBeenCalledWith('perro', 'facil');
    view.unmount();
  });

  it('reads the active item, the chosen meaning, the matched pair and respects mute', () => {
    const synth = enableTts();
    const view = mountGame();
    const { container } = view;
    const spoken = () => synth.speak.mock.calls.map(([utterance]) => utterance.text);

    expect(findButton(container, '🔊 Sonido')).toBeTruthy();
    start(container);

    click(byText(container, 'perro'));
    expect(spoken()).toEqual(['perro']);

    click(container.querySelector('[aria-label="Escuchar el elemento seleccionado"]'));
    expect(spoken()).toEqual(['perro', 'perro']);

    click(byText(container, 'dog'));
    expect(spoken().at(-1)).toBe('perro. dog');

    click(byText(container, 'cat'));
    expect(spoken().at(-1)).toBe('cat');
    click(byText(container, 'gato'));
    expect(spoken().at(-1)).toBe('gato. cat');

    click(findButton(container, '🔊 Sonido'));
    const before = spoken().length;
    click(byText(container, 'sun'));
    expect(spoken()).toHaveLength(before);

    view.unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
});

describe('conecta-pares responsive and motion contract', () => {
  it('contracts two columns, >=44px targets, wrapping, focus ring and reduced motion', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'src/games/conecta-pares/ConectaPares.jsx'),
      'utf8'
    );

    const board = tokens.match(/\.conecta-board\s*{([^}]*)}/s)[1];
    expect(board).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(board).toMatch(/gap:\s*10px/);

    const card = tokens.match(/\.conecta-card\s*{([^}]*)}/s)[1];
    expect(Number(card.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(card).toMatch(/min-width:\s*0/);
    expect(tokens).toMatch(
      /\.conecta-card:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(
      /\.conecta-summary__title:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );

    const select = tokens.match(/\.conecta-setup select\s*{([^}]*)}/s)[1];
    expect(Number(select.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(tokens).toMatch(
      /\.conecta-setup select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-width:\s*44px/s);

    const page = tokens.match(/\.conecta-page\s*{([^}]*)}/s)[1];
    expect(page).toMatch(/width:\s*100%/);
    expect(page).toMatch(/max-width:\s*100%/);

    expect(tokens).toMatch(/\.conecta-card__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.conecta-card__text\s*{[^}]*hyphens:\s*auto/s);
    expect(tokens).toMatch(/\.conecta-status\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.conecta-status\s*{[^}]*hyphens:\s*auto/s);
    expect(tokens).toMatch(/\.conecta-selection\s*{[^}]*overflow-wrap:\s*anywhere/s);

    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.conecta-card\s*{\s*transition:\s*none/
    );
    expect(tokens).toMatch(/\.conecta-lines\s*{[^}]*pointer-events:\s*none/s);
    expect(tokens).toMatch(/\.conecta-line-group text\s*{[^}]*font-weight:\s*700/s);

    expect(code).toMatch(/maxWidth:\s*'100%'/);
    expect(code).toMatch(/game-stage/);
    expect(code).toMatch(/aria-hidden="true"/);
    expect(code).not.toMatch(/ellipsis|textOverflow|line-clamp/);
    expect(code).not.toMatch(/width:\s*['"]?\d{4,}/);
    expect(code).not.toMatch(/requestAnimationFrame|createEngine|setInterval/);
  });
});
