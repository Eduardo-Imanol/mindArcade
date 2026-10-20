import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LluviaMeteoros from './LluviaMeteoros.jsx';
import { click, fire, keydown, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'a', front: 'closure', back: 'captura el entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'e', front: 'memoization', back: 'caché de resultados' },
  { id: 'f', front: 'thunk', back: 'cálculo diferido' },
  { id: 'g', front: 'currying', back: 'aplicación parcial' },
  { id: 'h', front: 'polyfill', back: 'relleno de compatibilidad' },
];

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);
const options = (container) => [...container.querySelectorAll('.lluvia-option')];
const optionBack = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const optionFor = (container, back) =>
  options(container).find((button) => optionBack(button) === back);
const status = (container) => container.querySelector('.lluvia-status');

const mountGame = (props = {}) =>
  mount(
    <LluviaMeteoros
      deck={DECK}
      selectCards={(count) => DECK.slice(0, count)}
      onGrade={() => {}}
      onExit={() => {}}
      {...props}
    />
  );

const startGame = (container, rounds = 3) => {
  const select = container.querySelector('#lluvia-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  click(buttonByText(container, 'Empezar'));
};

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

function installReducedMotion(matches = true) {
  const query = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn(() => query),
    configurable: true,
  });
  return query;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  delete window.matchMedia;
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('lluvia-meteoros setup + keyboard (AC-16, AC-17)', () => {
  it('uses a native labelled select, native buttons and pressed states', () => {
    const view = mountGame();
    const select = view.container.querySelector('#lluvia-rounds');

    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('8');
    expect(view.container.querySelector('label[for="lluvia-rounds"]').textContent).toContain(
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

    for (const label of ['Tranquilo', 'Normal', 'Arcade']) {
      expect(buttonByText(view.container, label).getAttribute('aria-pressed')).toMatch(
        /^(true|false)$/
      );
    }
    for (const label of ['Manual', 'Auto', 'Supervivencia']) {
      expect(buttonByText(view.container, label).getAttribute('aria-pressed')).toMatch(
        /^(true|false)$/
      );
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
    expect(options(view.container)).toHaveLength(3);

    click(optionFor(view.container, DECK[0].back));
    expect(view.container.querySelector('[aria-label="Escuchar la respuesta correcta"]')).toBeNull();
    expect(buttonByText(view.container, 'Siguiente')).toBeTruthy();
    view.unmount();
  });

  it('labels the three option buttons and answers with keys 1/2/3', () => {
    const onGrade = vi.fn(() => ({}));
    const view = mountGame({ onGrade });
    startGame(view.container);

    const group = view.container.querySelector('[role="group"][aria-label="Opciones de significado"]');
    expect(group).toBeTruthy();
    for (const [index, button] of options(view.container).entries()) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('aria-label')).toMatch(new RegExp(`^Opción ${index + 1}: .+`));
    }

    const correctIndex = options(view.container).findIndex(
      (button) => optionBack(button) === DECK[0].back
    );
    keydown(window, String(correctIndex + 1));
    expect(onGrade).toHaveBeenCalledWith('a', 'facil');
    expect(options(view.container).every((button) => button.disabled)).toBe(true);

    keydown(window, '1');
    expect(onGrade).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('moves focus predictably through start, feedback, next and pause', () => {
    const view = mountGame();
    startGame(view.container);
    expect(document.activeElement).toBe(options(view.container)[0]);

    click(optionFor(view.container, DECK[0].back));
    expect(document.activeElement).toBe(buttonByText(view.container, 'Siguiente'));

    click(buttonByText(view.container, 'Siguiente'));
    expect(document.activeElement).toBe(options(view.container)[0]);

    click(buttonByText(view.container, 'Pausa'));
    expect(document.activeElement).toBe(buttonByText(view.container, 'Continuar'));
    view.unmount();
  });

  it('focuses the summary heading when the session completes', () => {
    const view = mountGame();
    startGame(view.container);

    for (const [index, card] of DECK.slice(0, 3).entries()) {
      click(optionFor(view.container, card.back));
      click(buttonByText(view.container, index === 2 ? 'Ver resumen' : 'Siguiente'));
    }

    const heading = view.container.querySelector('h1');
    expect(heading.textContent).toBe('Sesión completada');
    expect(document.activeElement).toBe(heading);
    view.unmount();
  });
});

describe('lluvia-meteoros announcements + TTS (AC-16, AC-17)', () => {
  it('announces the meteor and the result without stale text', () => {
    const view = mountGame();
    startGame(view.container);

    const live = status(view.container);
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Meteoro 1 de 3: closure');

    const wrong = options(view.container).find(
      (button) => optionBack(button) !== DECK[0].back
    );
    click(wrong);
    expect(live.textContent).toContain('Incorrecto. La respuesta correcta es');
    expect(live.textContent).toContain(DECK[0].back);
    expect(live.textContent).not.toContain('Meteoro 1 de 3');
    expect(options(view.container).every((button) => button.disabled)).toBe(true);

    click(buttonByText(view.container, 'Siguiente'));
    expect(live.textContent).toBe('Meteoro 2 de 3: hoisting');
    expect(live.textContent).not.toContain('Incorrecto');
    expect(options(view.container).every((button) => !button.disabled)).toBe(true);
    view.unmount();
  });

  it('reads the prompt, the chosen meaning and the correct answer via TTS', () => {
    const synth = enableTts();
    const view = mountGame();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeTruthy();

    startGame(view.container);
    const spoken = () => synth.speak.mock.calls.map(([utterance]) => utterance.text);
    expect(spoken()[0]).toBe('closure');

    click(buttonByText(view.container, '🔊 Pregunta'));
    expect(spoken().at(-1)).toBe('closure');

    const wrong = options(view.container).find(
      (button) => optionBack(button) !== DECK[0].back
    );
    const wrongBack = optionBack(wrong);
    click(wrong);
    expect(spoken().at(-1)).toBe(wrongBack);
    expect(spoken()).not.toContain(DECK[0].back);

    const chosenUtterance = synth.speak.mock.calls.at(-1)[0];
    chosenUtterance.onend();
    expect(spoken().at(-1)).toBe(DECK[0].back);

    click(buttonByText(view.container, '🔊 Respuesta'));
    expect(spoken().at(-1)).toBe(DECK[0].back);

    view.unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
});

describe('lluvia-meteoros reduced motion + responsive contract (AC-6, AC-15, AC-17)', () => {
  it('freezes the meteor transform and marks the field as reduced', () => {
    installReducedMotion(true);
    const view = mountGame();
    startGame(view.container);

    const field = view.container.querySelector('.lluvia-field');
    const meteor = view.container.querySelector('.lluvia-meteor');
    expect(field.className).toContain('is-reduced');
    expect(meteor.style.transform).toBe('translate3d(-50%, 0px, 0)');
    view.unmount();
  });

  it('contracts wrap, >=44px targets, focus ring, columns and reduced motion CSS', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'src/games/lluvia-meteoros/LluviaMeteoros.jsx'),
      'utf8'
    );

    const optionsGrid = tokens.match(/\.lluvia-options\s*{([^}]*)}/s)[1];
    expect(optionsGrid).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(tokens).toMatch(
      /@media \(min-width: 768px\)\s*{\s*\.lluvia-options\s*{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/
    );

    const option = tokens.match(/\.lluvia-option\s*{([^}]*)}/s)[1];
    expect(Number(option.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(option).toMatch(/min-width:\s*0/);
    expect(tokens).toMatch(
      /\.lluvia-option:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );

    const select = tokens.match(/\.lluvia-setup-row select\s*{([^}]*)}/s)[1];
    expect(Number(select.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(tokens).toMatch(
      /\.lluvia-setup-row select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(/\.lluvia-choice\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-width:\s*44px/s);

    const page = tokens.match(/\.lluvia-page\s*{([^}]*)}/s)[1];
    expect(page).toMatch(/width:\s*100%/);
    expect(page).toMatch(/max-width:\s*100%/);

    expect(tokens).toMatch(/\.lluvia-capsule__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.lluvia-capsule__text\s*{[^}]*hyphens:\s*auto/s);
    expect(tokens).toMatch(/\.lluvia-radar__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.lluvia-radar__text\s*{[^}]*hyphens:\s*auto/s);
    expect(tokens).toMatch(/\.lluvia-option__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.lluvia-status\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.lluvia-feedback p\s*{[^}]*overflow-wrap:\s*anywhere/s);

    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lluvia-meteor\s*{\s*will-change:\s*auto/
    );
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lluvia-rock::after\s*{\s*display:\s*none/
    );
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lluvia-option\s*{\s*transition:\s*none/
    );

    expect(code).toMatch(/maxWidth:\s*'100%'/);
    expect(code).toMatch(/game-stage/);
    expect(code).not.toMatch(/ellipsis|textOverflow|line-clamp/);
    expect(code).not.toMatch(/width:\s*['"]?\d{4,}/);
  });
});
