import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ahorcado from './Ahorcado.jsx';
import { buildDecks } from '../../core/repetition/decks.js';
import { click, keydown, mount, setValue, waitFor } from '../../test/render.jsx';

const PRESERVE = () => 0.999999;
const CARDS = [
  { id: 'c1', front: 'SOL', back: 'Estrella del sistema solar', difficulty: 'easy' },
  { id: 'c2', front: 'LUNA', back: 'Satélite natural', difficulty: 'easy' },
  { id: 'c3', front: 'MAR', back: 'Océano o masa de agua', difficulty: 'easy' },
];

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

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent.trim() === text);

const letters = (container) => [...container.querySelectorAll('.ahorcado-key')];
const letter = (container, char) => letters(container).find((button) => button.textContent === char);
const boxes = (container) => [...container.querySelectorAll('.ahorcado-box')];

const solveWord = (container, word) => {
  for (const char of new Set([...word])) {
    const button = letter(container, char);
    if (button && !button.disabled) click(button);
  }
};

const startNormal = (container, rounds = 3) => {
  setValue(container.querySelector('#ahorcado-rounds'), String(rounds));
  click(buttonByText(container, 'Empezar'));
};

const mountGame = (props = {}) =>
  mount(
    <Ahorcado
      deck={CARDS}
      onGrade={() => ({})}
      onExit={() => {}}
      random={PRESERVE}
      {...props}
    />
  );

afterEach(() => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('Ahorcado layout order (AC-1, AC-3, AC-6)', () => {
  it('keeps word before hint, then progress and keyboard in the DOM', () => {
    const view = mountGame();
    const { container } = view;
    startNormal(container);

    const word = container.querySelector('[data-testid="ahorcado-word"]');
    const hint = container.querySelector('[data-testid="ahorcado-hint"]');
    const status = container.querySelector('.ahorcado-status');
    const keyboard = container.querySelector('.ahorcado-keyboard');

    expect(word).toBeTruthy();
    expect(hint).toBeTruthy();
    expect(word.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(word.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(status.compareDocumentPosition(keyboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(boxes(container)).toHaveLength(3);
    view.unmount();
  });

  it('labels the hint and keeps the word group free of duplicate announcements', () => {
    const view = mountGame();
    const { container } = view;
    startNormal(container);

    const hint = container.querySelector('[data-testid="ahorcado-hint"]');
    const word = container.querySelector('[data-testid="ahorcado-word"]');
    const label = hint.querySelector('.ahorcado-hint__label');
    const image = hint.querySelector('img, canvas, [role="img"]');
    const imageName = image.getAttribute('alt') ?? image.getAttribute('aria-label');

    expect(hint.getAttribute('role')).toBe('group');
    expect(hint.getAttribute('aria-label')).toBe('Pista');
    expect(hint.textContent).toContain('Estrella del sistema solar');
    expect(label.textContent).toBe('Pista');
    expect(label.getAttribute('aria-hidden')).toBe('true');
    expect(imageName).toBe('Pista visual');
    expect(imageName).not.toContain('SOL');
    expect(word.getAttribute('aria-live')).toBeNull();
    expect(word.getAttribute('role')).toBe('group');
    expect(word.getAttribute('aria-label')).toContain('Palabra de 3 letras');
    view.unmount();
  });

  it('exposes a single polite live region for round progress', () => {
    const view = mountGame();
    const { container } = view;
    startNormal(container);

    const live = [...container.querySelectorAll('[aria-live]')];
    expect(live).toHaveLength(1);
    expect(live[0].getAttribute('role')).toBe('status');
    expect(live[0].getAttribute('aria-live')).toBe('polite');
    expect(live[0].textContent).toContain('0 de 6 fallos');
    expect(live[0].textContent).toContain('6 intentos restantes');
    view.unmount();
  });
});

describe('Ahorcado input and scoring regression (AC-4, AC-5)', () => {
  it('keeps letter buttons, physical keyboard and XP scoring intact', () => {
    const view = mountGame();
    const { container } = view;
    startNormal(container);

    expect(letters(container)).toHaveLength(27);
    click(letter(container, 'Z'));
    expect(letter(container, 'Z').disabled).toBe(true);
    expect(container.querySelector('.ahorcado-status').textContent).toContain('1 de 6 fallos');

    keydown(window, 's');
    expect(boxes(container).some((box) => box.getAttribute('aria-label') === 'S')).toBe(true);

    keydown(window, 'Enter');
    keydown(window, 'Escape');
    expect(container.querySelector('.ahorcado-status').textContent).toContain('1 de 6 fallos');

    solveWord(container, 'SOL');
    expect(container.querySelector('.ahorcado-status').textContent).toContain('¡Ronda ganada!');
    expect(container.querySelector('.ahorcado-status').textContent).toContain('+10 XP');
    expect(buttonByText(container, 'Siguiente ronda')).toBeTruthy();
    view.unmount();
  });

  it('reads the hint with TTS and respects the global mute toggle', () => {
    const synth = enableTts();
    const view = mountGame();
    const { container } = view;
    startNormal(container);

    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe('Estrella del sistema solar');

    const hintButton = container.querySelector('[aria-label="Escuchar la pista"]');
    expect(hintButton).toBeTruthy();
    click(hintButton);
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toBe('Estrella del sistema solar');

    const sound = container.querySelector('[aria-label="Sonido"]');
    expect(sound).toBeTruthy();
    click(sound);
    expect(sound.getAttribute('aria-pressed')).toBe('true');
    expect(sound.textContent).toContain('Silencio');

    click(container.querySelector('[aria-label="Escuchar la pista"]'));
    expect(synth.speak).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
});

describe('Ahorcado arcade regression (AC-4)', () => {
  it('keeps lives, score and grading unchanged in arcade mode', async () => {
    const onGrade = vi.fn(() => ({}));
    const onArcadeEnd = vi.fn(() => ({ best: 100, isRecord: false }));
    const view = mount(
      <Ahorcado
        decks={buildDecks(CARDS, {}, { size: 10, now: 1000 })}
        deck={CARDS}
        best={{}}
        onGrade={onGrade}
        onArcadeEnd={onArcadeEnd}
        onExit={() => {}}
        random={PRESERVE}
      />
    );
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    expect(container.querySelector('#ahorcado-rounds')).toBeNull();
    click(buttonByText(container, 'Empezar'));
    expect(container.textContent).toContain('Vidas 3 de 3');

    solveWord(container, 'SOL');
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Puntuación 100');
    expect(container.textContent).toContain('Racha 1');
    click(buttonByText(container, 'Siguiente ronda'));

    click(letter(container, 'X'));
    expect(container.textContent).toContain('Vidas 2 de 3');
    solveWord(container, 'LUNA');
    expect(onGrade).toHaveBeenCalledWith('c2', 'otra-vez');
    click(buttonByText(container, 'Siguiente ronda'));

    click(letter(container, 'Y'));
    expect(container.textContent).toContain('Vidas 1 de 3');
    click(letter(container, 'Z'));

    await waitFor(() => container.textContent.includes('Partida terminada'));
    expect(onGrade.mock.calls).toEqual([
      ['c1', 'facil'],
      ['c2', 'otra-vez'],
      ['c3', 'otra-vez'],
    ]);
    expect(onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(onArcadeEnd).toHaveBeenCalledWith({
      score: 100,
      correct: 1,
      wrong: 3,
      lives: 0,
      completed: false,
      deckId: 'deck-1',
    });
    expect(container.textContent).toContain('100');
    view.unmount();
  });
});
