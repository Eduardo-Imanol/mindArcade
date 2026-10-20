import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SerpienteSignificados from './SerpienteSignificados.jsx';
import { click, keydown, mount } from '../../test/render.jsx';
import {
  FRAME,
  advanceFeedback,
  advanceOneCell,
  appleNumberFor,
  buttonByLabel,
  buttonByText,
  eatBack,
  forceSelfCollision,
  headCell,
  lives,
  rafHarness,
  setRounds,
  snakeLength,
  startGame,
  status,
} from '../../test/serpiente.js';

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('serpiente-significados setup', () => {
  it('defaults to 8 rounds, normal difficulty and desktop 20x20', () => {
    const selectCards = vi.fn((count) => DECK.slice(0, count));
    const view = mountGame({ selectCards });
    const select = view.container.querySelector('#serpiente-rounds');

    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('8');
    expect([...select.options].map((option) => option.value)).toEqual([
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    expect(buttonByText(view.container, 'Rondas').getAttribute('aria-pressed')).toBe('true');
    expect(buttonByText(view.container, 'Normal').getAttribute('aria-pressed')).toBe('true');
    expect(view.container.textContent).toContain('20×20');
    expect(view.container.textContent).toContain('250 ms por paso');

    click(buttonByText(view.container, 'Empezar'));
    expect(selectCards).toHaveBeenCalledWith(8);
    expect(view.container.textContent).toContain('Ronda 1 de 8');
    expect(view.container.querySelectorAll('.serpiente-legend__row')).toHaveLength(3);
    expect(view.container.querySelectorAll('.serpiente-apple')).toHaveLength(3);
    expect(view.container.querySelector('[aria-label="Vidas: 5 de 5"]')).toBeTruthy();
    expect(snakeLength(view.container)).toBe(2);
    view.unmount();
  });

  it('hides the rounds selector in survival and calls selectCards with the capped deck', () => {
    const bigDeck = Array.from({ length: 24 }, (_, index) => ({
      id: `c${index}`,
      front: `frente ${index}`,
      back: `reverso ${index}`,
    }));
    const selectCards = vi.fn((count) => bigDeck.slice(0, count));
    const view = mountGame({ deck: bigDeck, selectCards });

    click(buttonByText(view.container, 'Supervivencia'));
    expect(view.container.querySelector('#serpiente-rounds')).toBeNull();
    expect(view.container.textContent).toContain('hasta comer todo el mazo');
    click(buttonByText(view.container, 'Empezar'));
    expect(selectCards).toHaveBeenCalledWith(20);
    expect(view.container.textContent).toContain('Carta 1 de 20');
    view.unmount();
  });

  it('falls back to deck.slice when selectCards is absent', () => {
    const view = mountGame({ selectCards: undefined });
    startGame(view.container, { rounds: 4 });
    expect(view.container.textContent).toContain('Ronda 1 de 4');
    expect(view.container.querySelector('.serpiente-legend__row')).toBeTruthy();
    view.unmount();
  });

  it('previews and applies difficulty-specific boards and speeds', () => {
    const desktop = mountGame();
    click(buttonByText(desktop.container, 'Tranquilo'));
    expect(desktop.container.textContent).toContain('15×15');
    expect(desktop.container.textContent).toContain('350 ms por paso');
    click(buttonByText(desktop.container, 'Arcade'));
    expect(desktop.container.textContent).toContain('20×20');
    expect(desktop.container.textContent).toContain('180 ms por paso');
    startGame(desktop.container, { rounds: 4 });
    expect(
      desktop.container.querySelector('.serpiente-board').getAttribute('aria-label')
    ).toContain('de 20 por 20');
    desktop.unmount();

    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    const mobile = mountGame();
    click(buttonByText(mobile.container, 'Arcade'));
    expect(mobile.container.textContent).toContain('17×17');
    startGame(mobile.container, { rounds: 4 });
    expect(
      mobile.container.querySelector('.serpiente-board').getAttribute('aria-label')
    ).toContain('de 17 por 17');
    mobile.unmount();
  });

  it('dispatches at most one step per animation tick', () => {
    const harness = rafHarness();
    const view = mountGame();
    startGame(view.container, { rounds: 4 });

    const start = headCell(view.container);
    harness.step(100, 3);
    expect(headCell(view.container)).toEqual({ x: start.x + 1, y: start.y });
    harness.step(100, 2);
    expect(headCell(view.container)).toEqual({ x: start.x + 2, y: start.y });
    view.unmount();
  });

  it('uses a 15x15 board and the D-pad on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    const harness = rafHarness();
    const view = mountGame();
    startGame(view.container);

    const board = view.container.querySelector('.serpiente-board');
    expect(board.getAttribute('aria-label')).toContain('de 15 por 15');
    const head = headCell(view.container);
    click(buttonByLabel(view.container, 'Mover abajo'));
    advanceOneCell(harness, view.container);
    expect(headCell(view.container)).toEqual({ x: head.x, y: head.y + 1 });
    view.unmount();
  });
});

describe('serpiente-significados session flow', () => {
  it('eats the correct apple, grades facil, scores and advances after feedback', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 4 });

    eatBack(view.container, harness, DECK[0].back);
    expect(onGrade).toHaveBeenCalledWith('a', 'facil');
    expect(status(view.container).textContent).toContain('¡Correcto!');
    expect(status(view.container).textContent).toContain(DECK[0].back);
    expect(view.container.querySelector('.serpiente-hud').textContent).toContain('100 puntos');
    expect(view.container.querySelector('.serpiente-legend__row.is-correct').textContent).toContain(
      'Correcta'
    );

    harness.step(FRAME, 5);
    expect(view.container.textContent).toContain('Ronda 1 de 4');
    advanceFeedback(harness);
    expect(view.container.textContent).toContain('Ronda 2 de 4');
    expect(view.container.querySelector('.serpiente-prompt__text').textContent).toBe(
      DECK[1].front
    );
    view.unmount();
  });

  it('eats a wrong apple: loses a life, grows and grades dificil after recovery', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 4 });

    const wrongBack = [...view.container.querySelectorAll('.serpiente-legend__text')]
      .map((node) => node.textContent)
      .find((back) => back !== DECK[0].back);
    eatBack(view.container, harness, wrongBack);
    expect(lives(view.container)).toBe(4);
    expect(snakeLength(view.container)).toBe(5);
    expect(status(view.container).textContent).toContain('Incorrecto');
    expect(
      [...view.container.querySelectorAll('.serpiente-legend__row.is-eaten')].map(
        (row) => row.textContent
      )
    ).toHaveLength(1);
    expect(onGrade).not.toHaveBeenCalled();

    eatBack(view.container, harness, DECK[0].back);
    expect(onGrade).toHaveBeenCalledWith('a', 'dificil');
    expect(view.container.querySelector('.serpiente-hud').textContent).toContain('0 puntos');
    view.unmount();
  });

  it('collides with itself, respawns with length 2 and keeps the round ungraded', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 4 });

    const wrongBack = [...view.container.querySelectorAll('.serpiente-legend__text')]
      .map((node) => node.textContent)
      .find((back) => back !== DECK[0].back);
    eatBack(view.container, harness, wrongBack);
    eatBack(view.container, harness, DECK[0].back);
    expect(onGrade).toHaveBeenCalledWith('a', 'dificil');
    advanceFeedback(harness);
    expect(view.container.textContent).toContain('Ronda 2 de 4');
    expect(snakeLength(view.container)).toBe(6);

    forceSelfCollision(view.container, harness);
    expect(lives(view.container)).toBe(3);
    expect(snakeLength(view.container)).toBe(2);
    expect(view.container.textContent).toContain('Ronda 2 de 4');
    expect(status(view.container).textContent).toContain('¡Choque!');
    expect(onGrade).toHaveBeenCalledTimes(1);

    eatBack(view.container, harness, DECK[1].back);
    expect(onGrade).toHaveBeenLastCalledWith('b', 'facil');
    view.unmount();
  });

  it('survival scores by snake length and shows the card meter', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    startGame(view.container, { mode: 'Supervivencia', rounds: 4 });

    expect(view.container.textContent).toContain('Carta 1 de 8');
    eatBack(view.container, harness, DECK[0].back);
    expect(view.container.querySelector('.serpiente-hud').textContent).toContain('3 de largo');
    expect(onGrade).toHaveBeenCalledWith('a', 'facil');

    advanceFeedback(harness);
    expect(view.container.textContent).toContain('Carta 2 de 8');
    view.unmount();
  });

  it('replays a 4-round session with the same settings', () => {
    const onGrade = vi.fn(() => ({}));
    const harness = rafHarness();
    const view = mountGame({ onGrade });
    startGame(view.container, { rounds: 4, difficulty: 'Arcade' });

    for (const [index, card] of DECK.slice(0, 4).entries()) {
      expect(view.container.textContent).toContain(`Ronda ${index + 1} de 4`);
      eatBack(view.container, harness, card.back);
      expect(onGrade).toHaveBeenLastCalledWith(card.id, 'facil');
      advanceFeedback(harness);
    }

    expect(view.container.textContent).toContain('Sesión completada');
    expect(view.container.textContent).toContain('400 puntos');
    expect(view.container.textContent).toContain('4 aciertos');
    expect(view.container.textContent).toContain('+40 XP');
    expect(document.activeElement).toBe(view.container.querySelector('h1'));

    click(buttonByText(view.container, 'Jugar de nuevo'));
    expect(view.container.querySelector('#serpiente-rounds').value).toBe('4');
    expect(buttonByText(view.container, 'Arcade').getAttribute('aria-pressed')).toBe('true');
    expect(buttonByText(view.container, 'Rondas').getAttribute('aria-pressed')).toBe('true');
    view.unmount();
  });

  it('pauses manually and on hidden tab, freezes the snake and resumes explicitly', () => {
    const harness = rafHarness();
    const view = mountGame();
    startGame(view.container, { rounds: 4 });

    const before = headCell(view.container);
    const synth = enableTts();
    click(buttonByText(view.container, 'Pausa'));
    expect(view.container.textContent).toContain('Partida en pausa');
    expect(synth.cancel).toHaveBeenCalled();
    expect(document.activeElement).toBe(buttonByText(view.container, 'Continuar'));
    expect(harness.pendingCount()).toBe(0);
    harness.step(FRAME, 5);
    expect(headCell(view.container)).toEqual(before);

    click(buttonByText(view.container, 'Continuar'));
    advanceOneCell(harness, view.container);
    expect(headCell(view.container)).not.toEqual(before);

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(view.container.textContent).toContain('Partida en pausa');

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    click(buttonByText(view.container, 'Continuar'));
    expect(view.container.textContent).toContain('Ronda 1 de 4');
    view.unmount();
  });
});

describe('serpiente-significados keyboard, announcements and TTS', () => {
  it('moves with arrow keys and WASD', () => {
    const harness = rafHarness();
    const view = mountGame();
    startGame(view.container, { rounds: 4 });

    const start = headCell(view.container);
    keydown(window, 'ArrowDown');
    advanceOneCell(harness, view.container);
    expect(headCell(view.container)).toEqual({ x: start.x, y: start.y + 1 });

    keydown(window, 'd');
    advanceOneCell(harness, view.container);
    expect(headCell(view.container)).toEqual({ x: start.x + 1, y: start.y + 1 });
    view.unmount();
  });

  it('announces the round and results without stale text', () => {
    const harness = rafHarness();
    const view = mountGame();
    startGame(view.container, { rounds: 4 });

    const live = status(view.container);
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Ronda 1 de 4: closure');

    const wrongBack = [...view.container.querySelectorAll('.serpiente-legend__text')]
      .map((node) => node.textContent)
      .find((back) => back !== DECK[0].back);
    eatBack(view.container, harness, wrongBack);
    expect(live.textContent).toContain('Incorrecto');
    expect(live.textContent).toContain(wrongBack);
    expect(live.textContent).not.toContain('Ronda 1 de 4');
    expect(live.className).toContain('is-wrong');

    eatBack(view.container, harness, DECK[0].back);
    expect(live.textContent).toContain('¡Correcto!');
    expect(live.textContent).toContain(DECK[0].back);
    expect(live.textContent).not.toContain('Incorrecto');
    expect(live.className).toContain('is-correct');
    view.unmount();
  });

  it('reads the prompt and every eaten meaning via TTS', () => {
    const synth = enableTts();
    const harness = rafHarness();
    const view = mountGame();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeTruthy();

    startGame(view.container, { rounds: 4 });
    const spoken = () => synth.speak.mock.calls.map(([utterance]) => utterance.text);
    expect(spoken()[0]).toBe(DECK[0].front);

    click(buttonByLabel(view.container, 'Escuchar la pregunta'));
    expect(spoken().at(-1)).toBe(DECK[0].front);

    const wrongBack = [...view.container.querySelectorAll('.serpiente-legend__text')]
      .map((node) => node.textContent)
      .find((back) => back !== DECK[0].back);
    const wrongNumber = appleNumberFor(view.container, wrongBack);
    click(buttonByLabel(view.container, `Escuchar el significado ${wrongNumber}: ${wrongBack}`));
    expect(spoken().at(-1)).toBe(wrongBack);

    eatBack(view.container, harness, wrongBack);
    expect(spoken().at(-1)).toBe(wrongBack);

    eatBack(view.container, harness, DECK[0].back);
    expect(spoken().at(-1)).toBe(DECK[0].back);

    advanceFeedback(harness);
    forceSelfCollision(view.container, harness);
    expect(spoken().at(-1)).toBe('¡Choque! Pierdes una vida.');

    view.unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('hides every sound control without speechSynthesis but stays playable', () => {
    const harness = rafHarness();
    const view = mountGame();
    expect(buttonByText(view.container, '🔊 Sonido')).toBeUndefined();
    expect(buttonByText(view.container, '🔇 Silencio')).toBeUndefined();

    startGame(view.container, { rounds: 4 });
    expect(buttonByLabel(view.container, 'Escuchar la pregunta')).toBeUndefined();
    expect(
      [...view.container.querySelectorAll('.serpiente-legend button')]
    ).toHaveLength(0);

    eatBack(view.container, harness, DECK[0].back);
    expect(view.container.textContent).toContain('¡Correcto!');
    view.unmount();
  });
});

describe('serpiente-significados exit + safe states', () => {
  it('exiting mid-round grades only the current card once', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    startGame(view.container, { rounds: 4 });

    click(buttonByText(view.container, 'Salir'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls.map(([id, grade]) => [id, grade])).toEqual([['a', 'otra-vez']]);
    view.unmount();
  });

  it('exiting after answering does not re-emit the current card', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const harness = rafHarness();
    const view = mountGame({ onGrade, onExit });
    startGame(view.container, { rounds: 4 });

    eatBack(view.container, harness, DECK[0].back);
    click(buttonByText(view.container, 'Salir'));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls.map(([id, grade]) => [id, grade])).toEqual([['a', 'facil']]);
    view.unmount();
  });

  it('exiting from setup does not emit grades', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mountGame({ onGrade, onExit });
    click(buttonByText(view.container, 'Salir'));

    expect(onGrade).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('blocks play with fewer than 4 cards and falls back when selection is empty', () => {
    const onExit = vi.fn();
    const small = mountGame({ deck: DECK.slice(0, 3), onExit });
    expect(small.container.textContent).toContain('al menos 4 cartas');
    expect(buttonByText(small.container, 'Empezar')).toBeUndefined();
    click(buttonByText(small.container, 'Volver al tema'));
    expect(onExit).toHaveBeenCalledTimes(1);
    small.unmount();

    const empty = mountGame({ selectCards: () => [] });
    setRounds(empty.container, 4);
    click(buttonByText(empty.container, 'Empezar'));
    expect(empty.container.textContent).toContain('Sin cartas disponibles');
    click(buttonByText(empty.container, 'Elegir ajustes'));
    expect(buttonByText(empty.container, 'Empezar')).toBeTruthy();
    empty.unmount();
  });

  it('blocks play when there are fewer than 3 distinct meanings', () => {
    const duplicateDeck = [
      { id: 'a', front: 'uno', back: 'mismo' },
      { id: 'b', front: 'dos', back: 'mismo' },
      { id: 'c', front: 'tres', back: 'otro' },
      { id: 'd', front: 'cuatro', back: 'otro' },
    ];
    const view = mountGame({ deck: duplicateDeck });
    expect(view.container.textContent).toContain('3 significados distintos');
    expect(buttonByText(view.container, 'Empezar')).toBeUndefined();
    view.unmount();
  });
});
