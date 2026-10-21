import React, { act } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SerpienteSignificados from './SerpienteSignificados.jsx';
import { click, keydown, mount } from '../../test/render.jsx';

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
const buttonByLabel = (container, label) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.getAttribute('aria-label') === label
  );

const mountGame = (props = {}) =>
  mount(
    <SerpienteSignificados
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

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('serpiente-significados setup semantics (AC-3, AC-17)', () => {
  it('uses native labelled controls with pressed states and no hidden sound controls', () => {
    const view = mountGame();
    const select = view.container.querySelector('#serpiente-rounds');

    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('8');
    expect(
      view.container.querySelector('label[for="serpiente-rounds"]').textContent
    ).toContain('Rondas');
    expect([...select.options].map((option) => option.value)).toEqual([
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
    for (const label of ['Rondas', 'Supervivencia', 'Tranquilo', 'Normal', 'Arcade']) {
      expect(buttonByText(view.container, label).getAttribute('aria-pressed')).toMatch(
        /^(true|false)$/
      );
    }

    const start = buttonByText(view.container, 'Empezar');
    start.focus();
    expect(document.activeElement).toBe(start);
    expect(buttonByText(view.container, '🔊 Sonido')).toBeUndefined();
    expect(buttonByText(view.container, '🔇 Silencio')).toBeUndefined();
    view.unmount();
  });
});

describe('serpiente-significados game semantics (AC-14, AC-17)', () => {
  it('exposes the board, lives, legend, live region and D-pad labels', () => {
    const view = mountGame();
    click(buttonByText(view.container, 'Empezar'));

    const board = view.container.querySelector('.serpiente-board');
    expect(board.getAttribute('role')).toBe('img');
    expect(board.getAttribute('aria-label')).toContain('Tablero de la serpiente');
    expect(board.hasAttribute('tabindex')).toBe(false);

    expect(view.container.querySelector('[aria-label="Vidas: 5 de 5"]')).toBeTruthy();
    expect(view.container.querySelector('.serpiente-mode').textContent).toBe('Rondas');
    expect(
      view.container.querySelector('[aria-label="Vidas: 5 de 5"] [aria-hidden="true"]')
    ).toBeTruthy();

    const legend = view.container.querySelector('.serpiente-legend');
    expect(legend.tagName).toBe('OL');
    expect(legend.getAttribute('aria-label')).toBe('Manzanas y significados');
    const rows = [...legend.querySelectorAll('.serpiente-legend__row')];
    expect(rows).toHaveLength(3);
    for (const [index, row] of rows.entries()) {
      expect(row.querySelector('.serpiente-legend__badge').textContent).toBe(String(index + 1));
      expect(DECK.map((card) => card.back)).toContain(
        row.querySelector('.serpiente-legend__text').textContent
      );
    }

    const apples = [...view.container.querySelectorAll('.serpiente-apple')];
    expect(apples).toHaveLength(3);
    for (const apple of apples) expect(apple.textContent.trim()).toMatch(/^[1-3]$/);

    const live = view.container.querySelector('.serpiente-status');
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Ronda 1 de 8: closure');

    const dpad = view.container.querySelector('[role="group"][aria-label="Controles de movimiento"]');
    expect(dpad).toBeTruthy();
    for (const label of [
      'Mover arriba',
      'Mover abajo',
      'Mover a la izquierda',
      'Mover a la derecha',
    ]) {
      const button = buttonByLabel(view.container, label);
      expect(button).toBeTruthy();
      expect(button.tagName).toBe('BUTTON');
      expect(button.disabled).toBe(false);
    }
    expect(buttonByLabel(view.container, 'Pausar partida')).toBeTruthy();
    expect(buttonByText(view.container, 'Salir')).toBeTruthy();
    expect(view.container.querySelector('[aria-label="Escuchar la pregunta"]')).toBeNull();
    view.unmount();
  });

  it('pauses with Escape into a labelled dialog, traps Tab and resumes with Escape', () => {
    const view = mountGame();
    click(buttonByText(view.container, 'Empezar'));

    keydown(window, 'Escape');
    const dialog = view.container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = view.container.querySelector('#serpiente-pause-title');
    expect(title.textContent).toBe('Partida en pausa');
    expect(dialog.getAttribute('aria-labelledby')).toBe('serpiente-pause-title');
    expect(document.activeElement).toBe(buttonByText(view.container, 'Continuar'));

    const resume = buttonByText(view.container, 'Continuar');
    const exit = [...dialog.querySelectorAll('button')].find(
      (button) => button.textContent === 'Salir'
    );
    act(() => {
      resume.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
      );
    });
    expect(document.activeElement).toBe(exit);
    act(() => {
      exit.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    });
    expect(document.activeElement).toBe(resume);

    keydown(window, 'Escape');
    expect(view.container.querySelector('[role="dialog"]')).toBeNull();
    expect(view.container.textContent).toContain('Ronda 1 de 8');
    view.unmount();
  });
});

describe('serpiente-significados TTS controls (AC-16)', () => {
  it('shows and labels every sound control when speech is supported', () => {
    const synth = enableTts();
    const view = mountGame();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeTruthy();

    click(buttonByText(view.container, 'Empezar'));
    const question = buttonByLabel(view.container, 'Escuchar la pregunta');
    expect(question).toBeTruthy();
    click(question);
    expect(synth.speak).toHaveBeenCalled();
    expect(synth.speak.mock.calls.at(-1)[0].text).toBe(DECK[0].front);

    const legendButtons = [...view.container.querySelectorAll('.serpiente-legend button')];
    expect(legendButtons).toHaveLength(3);
    for (const [index, button] of legendButtons.entries()) {
      expect(button.getAttribute('aria-label')).toMatch(
        new RegExp(`^Escuchar el significado ${index + 1}: .+`)
      );
    }
    const firstBack = legendButtons[0].getAttribute('aria-label').replace(
      /^Escuchar el significado \d: /,
      ''
    );
    click(legendButtons[0]);
    expect(synth.speak.mock.calls.at(-1)[0].text).toBe(firstBack);
    view.unmount();
  });
});

describe('serpiente-significados mobile D-pad placement (AC-17, AC-18)', () => {
  it('renders the arrow controls directly under the board on mobile', () => {
    const view = mountGame();
    click(buttonByText(view.container, 'Empezar'));

    const boardWrap = view.container.querySelector('.serpiente-board-wrap');
    const dpad = view.container.querySelector('.serpiente-dpad');
    expect(boardWrap).toBeTruthy();
    expect(dpad).toBeTruthy();
    expect(boardWrap.nextElementSibling).toBe(dpad);
    expect(dpad.getAttribute('role')).toBe('group');
    expect(dpad.getAttribute('aria-label')).toBe('Controles de movimiento');
    expect(dpad.nextElementSibling.classList.contains('serpiente-legend')).toBe(true);
    view.unmount();
  });
});

describe('serpiente-significados responsive + a11y CSS contract (AC-17, AC-18)', () => {
  it('keeps targets, wrap, focus, reduced motion and a 480px board', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const component = fs.readFileSync(
      path.join(process.cwd(), 'src/games/serpiente-significados/SerpienteSignificados.jsx'),
      'utf8'
    );

    expect(tokens).toMatch(/\.serpiente-page\s*{[^}]*width:\s*100%/s);
    expect(tokens).toMatch(/\.serpiente-page\s*{[^}]*max-width:\s*100%/s);
    expect(tokens).toMatch(
      /\.serpiente-board-wrap\s*{[^}]*max-width:\s*min\(480px,\s*92vw\)/s
    );
    expect(tokens).toMatch(
      /\.serpiente-dpad\s*{[^}]*max-width:\s*min\(480px,\s*92vw\)/s
    );
    expect(tokens).toMatch(/\.serpiente-board\s*{[^}]*aspect-ratio:\s*1\s*\/\s*1/s);
    expect(tokens).toMatch(/\.serpiente-board\s*{[^}]*overflow:\s*hidden/s);

    const dpad = tokens.match(/\.serpiente-dpad__btn\s*{([^}]*)}/s)[1];
    expect(Number(dpad.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(48);
    expect(Number(dpad.match(/min-width:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(48);
    expect(tokens).toMatch(/\.serpiente-choice\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.serpiente-speak\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.serpiente-setup-row select\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-width:\s*44px/s);

    expect(tokens).toMatch(
      /@media \(min-width: 768px\)\s*{\s*\.serpiente-dpad\s*{\s*display:\s*none;/
    );
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.serpiente-apple__number\s*{\s*animation:\s*none;/
    );
    expect(tokens).toMatch(
      /\.serpiente-board:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(
      /\.serpiente-title:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/
    );
    expect(tokens).toMatch(/\.serpiente-prompt__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.serpiente-prompt__text\s*{[^}]*hyphens:\s*auto/s);
    expect(tokens).toMatch(/\.serpiente-legend__text\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.serpiente-status\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.serpiente-summary p\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.serpiente-pause-overlay\s*{[^}]*position:\s*fixed/s);
    expect(tokens).toMatch(/\.serpiente-pause-overlay\s*{[^}]*inset:\s*0/s);

    expect(component).toContain('aria-live="polite"');
    expect(component).toContain('role="status"');
    expect(component).toContain('role="dialog"');
    expect(component).toContain('aria-modal="true"');
    expect(component).toContain('aria-label={`Vidas:');
    expect(component).toContain('role="img"');
    expect(component).toContain('aria-label="Controles de movimiento"');

    const imports = [...component.matchAll(/from '([^']+)'/g)].map((match) => match[1]);
    expect(imports.some((entry) => /storage|parser|content|router/.test(entry))).toBe(false);
    expect(component).not.toMatch(/localStorage|indexedDB|fetch\(/);

    const logic = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/games/serpiente-significados/serpiente-significados.logic.js'
      ),
      'utf8'
    );
    expect(logic).not.toMatch(/^import /m);
    expect(logic).not.toMatch(/\bDate\b/);
  });
});
