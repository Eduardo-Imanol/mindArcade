import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Intruso from './Intruso.jsx';
import { click, fire, mount } from '../../test/render.jsx';

const card = (id, front, back) => ({ id, front, back, difficulty: 'easy' });

const FUNCIONES = {
  id: 'funciones',
  title: 'Funciones',
  cards: [
    card('f1', 'encerrar lógica', 'bloque reutilizable'),
    card('f2', 'recibir datos', 'variable de entrada'),
    card('f3', 'devolver valor', 'resultado devuelto'),
    card('f4', 'capturar contexto', 'captura el entorno'),
  ],
};

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
const FUNCTION_BACKS = FUNCIONES.cards.map((entry) => entry.back);
const ALGORITHM_BACKS = ALGORITMOS.cards.map((entry) => entry.back);

const mountGame = (props = {}) =>
  mount(
    <Intruso
      groups={GROUPS}
      anchorTopicId="funciones"
      onGrade={() => ({})}
      onExit={() => {}}
      {...props}
    />
  );

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const chooseRounds = (container, rounds) => {
  const select = container.querySelector('#intruso-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
};

const startGame = (container, rounds = 3) => {
  chooseRounds(container, rounds);
  click(buttonByText(container, 'Empezar'));
};

const options = (container) => [...container.querySelectorAll('.intruso-option')];
const backOf = (button) => (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const intruderOption = (container) =>
  options(container).find((button) => ALGORITHM_BACKS.includes(backOf(button)));
const baseOption = (container) =>
  options(container).find((button) => FUNCTION_BACKS.includes(backOf(button)));
const status = (container) => container.querySelector('.intruso-status');
const promptText = (container) => container.querySelector('.intruso-prompt__text').textContent;

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

describe('Intruso setup + controls (AC-11)', () => {
  it('uses a native labelled select and native buttons only', () => {
    const view = mountGame();
    const select = view.container.querySelector('#intruso-rounds');

    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('10');
    expect(view.container.querySelector('label[for="intruso-rounds"]').textContent).toContain(
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

    click(baseOption(view.container));
    expect(view.container.querySelector('[aria-label="Escuchar el intruso"]')).toBeNull();
    expect(buttonByText(view.container, 'Siguiente')).toBeTruthy();
    view.unmount();
  });
});

describe('Intruso round semantics (AC-4, AC-5, AC-9, AC-11)', () => {
  it('renders four labelled native options in a named group', () => {
    const view = mountGame();
    startGame(view.container);

    const group = view.container.querySelector('[role="group"]');
    expect(group.getAttribute('aria-label')).toBe('Significados: elige el intruso');
    expect(promptText(view.container)).toContain('¿Cuál no pertenece al tema «Funciones»?');
    expect(options(view.container)).toHaveLength(4);
    for (const [index, button] of options(view.container).entries()) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toMatch(new RegExp(`^Opción ${index + 1}: .+`));
      expect(button.disabled).toBe(false);
    }
    view.unmount();
  });

  it('announces rounds and results without stale text', () => {
    const view = mountGame();
    startGame(view.container);

    const live = status(view.container);
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toContain('Ronda 1 de 3');

    const wrong = baseOption(view.container);
    click(wrong);
    expect(wrong.className).toContain('is-wrong');
    expect(intruderOption(view.container).className).toContain('is-correct');
    expect(live.textContent).toContain('Incorrecto. El intruso era');
    expect(live.textContent).toContain('tema «Algoritmos»');
    expect(options(view.container).every((button) => button.disabled)).toBe(true);

    click(buttonByText(view.container, 'Siguiente'));
    expect(live.textContent).toContain('Ronda 2 de 3');
    expect(live.textContent).not.toContain('Incorrecto');
    expect(options(view.container).every((button) => !button.disabled)).toBe(true);

    click(intruderOption(view.container));
    expect(live.textContent).toContain('¡Correcto!');
    view.unmount();
  });

  it('reads the prompt, the selected meaning and the intruder via TTS', () => {
    const synth = enableTts();
    const view = mountGame();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeTruthy();

    startGame(view.container);
    const spoken = () => synth.speak.mock.calls.map(([utterance]) => utterance.text);
    const prompt = '¿Cuál no pertenece al tema «Funciones»?';
    expect(spoken()[0]).toBe(prompt);

    click(buttonByText(view.container, '🔊 Pregunta'));
    expect(spoken().at(-1)).toBe(prompt);

    const intruder = intruderOption(view.container);
    const intruderBack = backOf(intruder);
    click(intruder);
    expect(spoken().at(-1)).toBe(intruderBack);

    click(buttonByText(view.container, '🔊 Intruso'));
    expect(spoken().at(-1)).toBe(intruderBack);

    view.unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
});

describe('Intruso responsive + motion contract (AC-11)', () => {
  it('contracts a 2x2 wrapping grid, >=44px targets, focus ring and reduced motion', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'src/games/intruso/Intruso.jsx'),
      'utf8'
    );

    const grid = tokens.match(/\.intruso-options\s*{([^}]*)}/s)[1];
    expect(grid).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(grid).toMatch(/gap:\s*10px/);

    const option = tokens.match(/\.intruso-option\s*{([^}]*)}/s)[1];
    expect(Number(option.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(option).toMatch(/min-width:\s*0/);
    expect(tokens).toMatch(
      /\.intruso-option:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );

    const select = tokens.match(/\.intruso-setup select\s*{([^}]*)}/s)[1];
    expect(Number(select.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
    expect(tokens).toMatch(
      /\.intruso-setup select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-width:\s*44px/s);

    const page = tokens.match(/\.intruso-page\s*{([^}]*)}/s)[1];
    expect(page).toMatch(/width:\s*100%/);
    expect(page).toMatch(/max-width:\s*100%/);

    expect(tokens).toMatch(/\.intruso-prompt__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.intruso-option__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.intruso-option\s*{\s*transition:\s*none/
    );

    expect(code).toMatch(/maxWidth:\s*'100%'/);
    expect(code).toMatch(/game-stage/);
    expect(code).not.toMatch(/width:\s*['"]?\d{4,}/);
  });
});
