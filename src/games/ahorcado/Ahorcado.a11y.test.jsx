import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ahorcado from './Ahorcado.jsx';
import { click, fire, keydown, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'a', front: 'SOL', back: 'Estrella del sistema solar', difficulty: 'easy' },
  { id: 'b', front: 'SOL', back: 'Estrella del sistema solar', difficulty: 'easy' },
  { id: 'c', front: 'SOL', back: 'Estrella del sistema solar', difficulty: 'easy' },
];
const ALPHABET = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];
const SIX_WRONG = ['Z', 'X', 'Q', 'W', 'K', 'J'];

const mountGame = (props = {}) =>
  mount(<Ahorcado deck={DECK} onGrade={() => ({})} onExit={() => {}} {...props} />);

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent.trim() === text);

const chooseRounds = (container, rounds) => {
  const select = container.querySelector('#ahorcado-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
};

const startGame = (container, rounds = 3) => {
  chooseRounds(container, rounds);
  click(buttonByText(container, 'Empezar'));
};

const letters = (container) => [...container.querySelectorAll('.ahorcado-key')];
const letter = (container, char) => letters(container).find((button) => button.textContent === char);
const boxes = (container) => [...container.querySelectorAll('.ahorcado-box')];
const status = (container) => container.querySelector('.ahorcado-status');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ahorcado setup + controls (AC-12)', () => {
  it('uses a native labelled select and native buttons only', () => {
    const view = mountGame();
    const select = view.container.querySelector('#ahorcado-rounds');

    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('10');
    expect(view.container.querySelector('label[for="ahorcado-rounds"]').textContent).toContain(
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
    }

    const start = buttonByText(view.container, 'Empezar');
    start.focus();
    expect(document.activeElement).toBe(start);
    view.unmount();
  });

  it('keeps TTS controls hidden without speechSynthesis but fully playable', () => {
    const view = mountGame();
    expect(view.container.querySelector('[aria-label="Escuchar la pista"]')).toBeNull();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeUndefined();
    startGame(view.container);
    expect(letters(view.container)).toHaveLength(27);
    view.unmount();
  });
});

describe('Ahorcado letter keyboard (AC-5, AC-12)', () => {
  it('renders the 27 Spanish letters as labelled native buttons', () => {
    const view = mountGame();
    startGame(view.container);

    expect(letters(view.container).map((button) => button.textContent)).toEqual(ALPHABET);
    for (const button of letters(view.container)) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toBe(`Letra ${button.textContent}, disponible`);
      expect(button.disabled).toBe(false);
    }
    view.unmount();
  });

  it('disables used letters and reports acierto/fallo in the accessible name', () => {
    const view = mountGame();
    startGame(view.container);

    click(letter(view.container, 'Z'));
    expect(letter(view.container, 'Z').disabled).toBe(true);
    expect(letter(view.container, 'Z').getAttribute('aria-label')).toBe(
      'Letra Z, usada (fallo)'
    );

    click(letter(view.container, 'S'));
    const s = letter(view.container, 'S');
    expect(s.disabled).toBe(true);
    expect(s.getAttribute('aria-label')).toBe('Letra S, usada (acierto)');
    expect(boxes(view.container).some((box) => box.getAttribute('aria-label') === 'S')).toBe(true);

    const before = status(view.container).textContent;
    click(s);
    expect(status(view.container).textContent).toBe(before);
    expect(status(view.container).textContent).toContain('1 de 6 fallos');
    view.unmount();
  });

  it('normalizes Ñ to N so both buttons reflect the same used letter', () => {
    const view = mountGame();
    startGame(view.container);

    click(letter(view.container, 'Ñ'));
    expect(letter(view.container, 'N').disabled).toBe(true);
    expect(letter(view.container, 'Ñ').disabled).toBe(true);
    expect(letter(view.container, 'N').getAttribute('aria-label')).toBe(
      'Letra N, usada (fallo)'
    );
    view.unmount();
  });

  it('accepts the physical keyboard and ignores non-letter keys', () => {
    const view = mountGame();
    startGame(view.container);

    keydown(window, 's');
    expect(boxes(view.container).some((box) => box.getAttribute('aria-label') === 'S')).toBe(true);

    keydown(window, 'ñ');
    expect(letter(view.container, 'N').disabled).toBe(true);
    expect(status(view.container).textContent).toContain('1 de 6 fallos');

    keydown(window, 'Enter');
    keydown(window, 'Escape');
    expect(status(view.container).textContent).toContain('1 de 6 fallos');
    view.unmount();
  });
});

describe('Ahorcado live announcements + round results (AC-12)', () => {
  it('announces mistakes, remaining attempts and a won round', () => {
    const view = mountGame();
    startGame(view.container);

    const live = status(view.container);
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toContain('0 de 6 fallos');
    expect(live.textContent).toContain('6 intentos restantes');

    click(letter(view.container, 'Z'));
    expect(live.textContent).toContain('1 de 6 fallos');
    expect(live.textContent).toContain('5 intentos restantes');

    click(letter(view.container, 'S'));
    click(letter(view.container, 'O'));
    click(letter(view.container, 'L'));
    expect(live.textContent).toContain('¡Ronda ganada!');
    expect(live.textContent).toContain('+10 XP');
    expect(buttonByText(view.container, 'Siguiente ronda')).toBeTruthy();
    view.unmount();
  });

  it('reveals the word on six mistakes and announces the loss', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    startGame(view.container);

    for (const char of SIX_WRONG) click(letter(view.container, char));

    const live = status(view.container);
    expect(live.textContent).toContain('Ronda perdida');
    expect(live.textContent).toContain('La palabra era SOL');
    expect(boxes(view.container).map((box) => box.textContent).join('')).toBe('SOL');
    expect(view.container.querySelector('.ahorcado-result').textContent).toContain('«SOL»');
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledWith(expect.any(String), 'otra-vez');
    view.unmount();
  });

  it('starts the next round with a fresh live status and enabled keyboard', () => {
    const view = mountGame();
    startGame(view.container);

    click(letter(view.container, 'S'));
    click(letter(view.container, 'O'));
    click(letter(view.container, 'L'));
    click(buttonByText(view.container, 'Siguiente ronda'));

    expect(status(view.container).textContent).toContain('0 de 6 fallos');
    expect(letters(view.container)).toHaveLength(27);
    expect(letters(view.container).every((button) => !button.disabled)).toBe(true);
    view.unmount();
  });
});

describe('Ahorcado hint privacy + word display (AC-4, AC-6)', () => {
  it('keeps the answer out of the hint image accessible name (emoji, img and fallback)', () => {
    const cases = [
      { card: { id: 'sol', front: 'SOL', back: 'pista', difficulty: 'easy' }, selector: 'span[role="img"]' },
      {
        card: {
          id: 'url',
          front: 'URL',
          back: 'pista',
          difficulty: 'easy',
          image: { kind: 'url', value: 'https://example.com/pista.png' },
        },
        selector: 'img',
      },
      { card: { id: 'mar', front: 'MAR', back: 'pista', difficulty: 'easy' }, selector: 'canvas' },
    ];

    for (const { card, selector } of cases) {
      const view = mount(<Ahorcado deck={[card]} onGrade={() => ({})} onExit={() => {}} />);
      startGame(view.container, 3);

      const image = view.container.querySelector(`.ahorcado-hint ${selector}`);
      const name =
        selector === 'img' ? image.getAttribute('alt') : image.getAttribute('aria-label');
      expect(name, `${selector} hint label`).toBe('Pista visual');
      expect(name).not.toContain(card.front);
      view.unmount();
    }
  });

  it('keeps original accented characters and visible spaces in the word boxes', () => {
    const deck = [
      { id: 'camion-sol', front: 'CAMIÓN SOL', back: 'Vehículo de carga solar', difficulty: 'easy' },
    ];
    const view = mount(<Ahorcado deck={deck} onGrade={() => ({})} onExit={() => {}} />);
    startGame(view.container, 3);

    for (const char of ['C', 'A', 'M', 'I', 'O', 'N', 'S', 'L']) click(letter(view.container, char));

    expect(boxes(view.container).map((box) => box.getAttribute('aria-label'))).toEqual([
      'C',
      'A',
      'M',
      'I',
      'Ó',
      'N',
      'S',
      'O',
      'L',
    ]);
    expect(view.container.querySelectorAll('.ahorcado-gap')).toHaveLength(1);
    expect(buttonByText(view.container, 'Ver resumen')).toBeTruthy();
    view.unmount();
  });
});

describe('Ahorcado session summary (AC-10)', () => {
  it('"Jugar de nuevo" returns to a fresh setup keeping the chosen rounds', () => {
    const view = mountGame();
    startGame(view.container, 3);

    for (let round = 0; round < 3; round += 1) {
      click(letter(view.container, 'S'));
      click(letter(view.container, 'O'));
      click(letter(view.container, 'L'));
      click(buttonByText(view.container, round === 2 ? 'Ver resumen' : 'Siguiente ronda'));
    }

    expect(view.container.textContent).toContain('Sesión completada');
    click(buttonByText(view.container, 'Jugar de nuevo'));
    expect(view.container.querySelector('#ahorcado-rounds').value).toBe('3');
    expect(view.container.textContent).toContain('Adivina el término');
    view.unmount();
  });

  it('can exit again after replaying following a first exit', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade, onExit: () => {} });
    startGame(view.container, 3);

    for (let round = 0; round < 3; round += 1) {
      click(letter(view.container, 'S'));
      click(letter(view.container, 'O'));
      click(letter(view.container, 'L'));
      click(buttonByText(view.container, round === 2 ? 'Ver resumen' : 'Siguiente ronda'));
    }
    click(buttonByText(view.container, 'Volver al tema'));

    click(buttonByText(view.container, 'Jugar de nuevo'));
    startGame(view.container, 3);
    click(buttonByText(view.container, 'Salir'));
    expect(onGrade).toHaveBeenCalledWith(expect.any(String), 'otra-vez');
    view.unmount();
  });
});

describe('Ahorcado responsive + target size at 360px (AC-12)', () => {
  it('contracts >=44px targets, wrapping layout and focus ring without horizontal scroll', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'src/games/ahorcado/Ahorcado.jsx'),
      'utf8'
    );

    const key = tokens.match(/\.ahorcado-key\s*{([^}]*)}/s)[1];
    expect(key).toMatch(/min-height:\s*44px/);
    expect(key).toMatch(/min-width:\s*44px/);
    expect(tokens).toMatch(
      /\.ahorcado-key:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );

    const keyboard = tokens.match(/\.ahorcado-keyboard\s*{([^}]*)}/s)[1];
    expect(keyboard).toMatch(/grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/);

    const select = tokens.match(/\.ahorcado-setup select\s*{([^}]*)}/s)[1];
    expect(select).toMatch(/min-height:\s*44px/);
    expect(tokens).toMatch(
      /\.ahorcado-setup select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-width:\s*44px/s);

    const page = tokens.match(/\.ahorcado-page\s*{([^}]*)}/s)[1];
    expect(page).toMatch(/width:\s*100%/);
    expect(page).toMatch(/max-width:\s*100%/);

    const word = tokens.match(/\.ahorcado-word\s*{([^}]*)}/s)[1];
    expect(word).toMatch(/flex-wrap:\s*wrap/);
    expect(tokens).toMatch(/\.ahorcado-hint__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?ahorcado-art[\s\S]*?animation:\s*none/);

    const alarm = tokens.match(/@keyframes ahorcado-alarm\s*{([\s\S]*?)\n}/)[1];
    expect(alarm).toMatch(/opacity/);
    expect(alarm).not.toMatch(/filter:/);

    expect(code).toMatch(/maxWidth:\s*'100%'/);
    expect(code).toMatch(/game-stage/);
    expect(code).not.toMatch(/width:\s*['"]?\d{4,}/);
  });
});
