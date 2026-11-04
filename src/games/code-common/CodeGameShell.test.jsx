import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeGameShell from './CodeGameShell.jsx';
import { click, mount } from '../../test/render.jsx';
import { saveSettings } from '../../core/storage/settings.js';
import {
  EXERCISE_TOPIC_ID,
  exerciseId,
  learnedProgress,
  makeCardDecks,
  makeExerciseDocument,
} from '../../test/exercises.js';

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

let synth;

function installSpeech() {
  synth = {
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
}

function buttonByText(container, text) {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
}

function sessionButton(container, text) {
  const button = buttonByText(container, text);
  if (!button) throw new Error(`button not found: ${text}`);
  return button;
}

function Mechanic({ exercise, onResult }) {
  return (
    <div data-exercise-id={exercise.id}>
      <p>{exercise.prompt}</p>
      <button type="button" onClick={() => onResult(true)}>
        Acertar
      </button>
      <button type="button" onClick={() => onResult(false)}>
        Fallar
      </button>
    </div>
  );
}

function mountShell(overrides = {}) {
  const props = {
    gameId: 'test-codigo',
    title: 'Juego de prueba',
    lead: 'Lead de prueba',
    topicId: EXERCISE_TOPIC_ID,
    exercises: makeExerciseDocument(),
    exerciseProgress: {},
    decks: makeCardDecks(),
    best: { 'deck-1': 120 },
    onExerciseResult: vi.fn(),
    onGrade: vi.fn(),
    onArcadeEnd: vi.fn(() => ({ best: 300, isRecord: true })),
    onExit: vi.fn(),
    renderExercise: (props) => <Mechanic {...props} />,
    ...overrides,
  };
  const view = mount(<CodeGameShell {...props} />);
  return { view, props };
}

function startSession(container) {
  click(sessionButton(container, 'Empezar'));
}

function answer(container, correct) {
  click(sessionButton(container, correct ? 'Acertar' : 'Fallar'));
}

function next(container) {
  const button = buttonByText(container, 'Siguiente') || buttonByText(container, 'Ver resumen');
  if (!button) throw new Error('next button not found');
  click(button);
}

beforeEach(() => {
  saveSettings({ muted: false });
});

afterEach(() => {
  document.body.innerHTML = '';
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('CodeGameShell (spec-21 T5)', () => {
  it('shows the deck picker, difficulty 2/4/6 and mode controls in setup', () => {
    const { view } = mountShell();
    const { container } = view;

    expect(container.querySelector('.deck-picker')).toBeTruthy();
    expect(container.querySelectorAll('.deck-picker__deck')).toHaveLength(2);
    expect(container.querySelector('.deck-picker__deck.is-selected')).toBeTruthy();

    const difficulties = [...container.querySelectorAll('.code-difficulty__option')];
    expect(difficulties.map((button) => button.dataset.difficulty)).toEqual([
      'facil',
      'medio',
      'dificil',
    ]);
    expect(difficulties.map((button) => button.textContent)).toEqual([
      expect.stringContaining('2 ejercicios'),
      expect.stringContaining('4 ejercicios'),
      expect.stringContaining('6 ejercicios'),
    ]);
    expect(difficulties[0].getAttribute('aria-pressed')).toBe('true');

    const modes = [...container.querySelectorAll('.game-mode__option')];
    expect(modes.map((button) => button.dataset.mode)).toEqual(['normal', 'arcade']);
    expect(container.textContent).toContain('Ejercicios: 0/6');
    expect(container.textContent).toContain('Nivel sin empezar');

    click(difficulties[1]);
    expect(difficulties[1].getAttribute('aria-pressed')).toBe('true');
    startSession(container);
    expect(container.textContent).toContain('Ejercicio 1 de 4');
    view.unmount();
  });

  it('uses the selected deck and supports a complete normal session with summary', () => {
    const { view, props } = mountShell();
    const { container } = view;

    const deckTwo = container.querySelector('[data-deck-id="deck-2"]');
    click(deckTwo);
    startSession(container);

    expect(container.querySelector('.code-exercise__prompt').textContent).toBe(
      `Completa la función suma7.`
    );
    answer(container, true);
    expect(container.textContent).toContain('¡Correcto!');
    next(container);
    expect(container.querySelector('.code-exercise__prompt').textContent).toBe(
      `Completa la función suma8.`
    );
    answer(container, true);
    next(container);

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('Aciertos 2');
    expect(container.textContent).toContain('Fallos 0');
    expect(container.textContent).toContain('Ejercicios: 2/6');
    expect(props.onExerciseResult).toHaveBeenCalledTimes(2);
    expect(props.onExerciseResult).toHaveBeenNthCalledWith(1, {
      topicId: EXERCISE_TOPIC_ID,
      deckNumber: 2,
      exerciseId: exerciseId(2, 1),
      correct: true,
    });
    expect(props.onGrade).toHaveBeenCalledTimes(2);
    expect(props.onGrade).toHaveBeenNthCalledWith(
      1,
      'card-11',
      'facil',
      { topicId: EXERCISE_TOPIC_ID, exerciseId: exerciseId(2, 1) }
    );
    view.unmount();
  });

  it('grades only the first result of each card and lets Normal retry', () => {
    const { view, props } = mountShell();
    const { container } = view;
    startSession(container);

    answer(container, false);
    expect(props.onGrade).toHaveBeenCalledTimes(1);
    expect(props.onGrade).toHaveBeenLastCalledWith(
      'card-1',
      'otra-vez',
      { topicId: EXERCISE_TOPIC_ID, exerciseId: exerciseId(1, 1) }
    );
    click(sessionButton(container, 'Reintentar'));
    answer(container, true);
    expect(props.onGrade).toHaveBeenCalledTimes(1);
    next(container);

    answer(container, true);
    next(container);
    expect(props.onGrade).toHaveBeenCalledTimes(2);
    expect(props.onGrade.mock.calls.map(([id]) => id)).toEqual(['card-1', 'card-2']);
    expect(props.onExerciseResult).toHaveBeenCalledTimes(3);
    expect(container.textContent).toContain('Sesión completada');
    view.unmount();
  });

  it('disables difficulties the deck cannot fill and disables start for tiny decks', () => {
    const exercises = makeExerciseDocument({ deckCount: 1, perDeck: 3 });
    const { view } = mountShell({ exercises });
    const { container } = view;

    const high = container.querySelector('[data-difficulty="dificil"]');
    const medium = container.querySelector('[data-difficulty="medio"]');
    expect(high.disabled).toBe(true);
    expect(high.textContent).toContain('Necesita 6');
    expect(medium.disabled).toBe(true);
    expect(medium.textContent).toContain('Necesita 4');
    expect(container.querySelector('[data-difficulty="facil"]').disabled).toBe(false);

    const tiny = makeExerciseDocument({ deckCount: 1, perDeck: 1 });
    view.rerender(
      <CodeGameShell
        gameId="test-codigo"
        title="Juego de prueba"
        topicId={EXERCISE_TOPIC_ID}
        exercises={tiny}
        exerciseProgress={{}}
        decks={makeCardDecks()}
        onExerciseResult={vi.fn()}
        onGrade={vi.fn()}
        onArcadeEnd={vi.fn()}
        onExit={vi.fn()}
        renderExercise={(props) => <Mechanic {...props} />}
      />
    );
    expect(sessionButton(container, 'Empezar').disabled).toBe(true);
    expect(container.textContent).toContain('Necesitas al menos 2 ejercicios');
    view.unmount();
  });

  it('shows completed progress from the full progress document', () => {
    const ids = Array.from({ length: 6 }, (_value, index) => exerciseId(1, index + 1));
    const { view } = mountShell({ exerciseProgress: learnedProgress(ids) });
    const { container } = view;

    expect(container.textContent).toContain('Ejercicios: 6/6');
    expect(container.textContent).toContain('Nivel de ejercicios completado');
    expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe(
      '100'
    );
    view.unmount();
  });

  it('reaches the completed level after solving the six exercises of a deck', () => {
    const { view } = mountShell();
    const { container } = view;
    click(container.querySelector('[data-difficulty="dificil"]'));
    startSession(container);
    expect(container.textContent).toContain('Ejercicio 1 de 6');

    for (let index = 0; index < 6; index += 1) {
      answer(container, true);
      next(container);
    }

    expect(container.textContent).toContain('Ejercicios: 6/6');
    expect(container.textContent).toContain('Nivel de ejercicios completado');
    view.unmount();
  });

  it('speaks the prompt, repeats it and respects the global mute', () => {
    installSpeech();
    const { view } = mountShell();
    const { container } = view;
    startSession(container);

    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe('Completa la función suma1.');

    click(container.querySelector('[aria-label="Escuchar el prompt"]'));
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toBe('Completa la función suma1.');

    click(container.querySelector('[aria-label="Sonido"]'));
    answer(container, true);
    expect(synth.speak).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it('runs arcade with 3 lives, the selected 2/4/6 set, record and summary', () => {
    const { view, props } = mountShell();
    const { container } = view;
    click(container.querySelector('[data-mode="arcade"]'));
    startSession(container);

    expect(container.querySelector('.arcade-hud')).toBeTruthy();
    expect(container.textContent).toContain('Vidas 3 de 3');

    answer(container, true);
    expect(container.textContent).toContain('Vidas 3 de 3');
    expect(container.textContent).toContain('Puntuación 100');
    next(container);

    answer(container, true);
    expect(container.textContent).toContain('Puntuación 210');
    next(container);

    expect(props.onArcadeEnd).toHaveBeenCalledTimes(1);
    expect(props.onArcadeEnd).toHaveBeenCalledWith({
      topicId: EXERCISE_TOPIC_ID,
      deckId: 'deck-1',
      deckNumber: 1,
      score: 360,
      correct: 2,
      wrong: 0,
      lives: 3,
      completed: true,
    });
    expect(container.textContent).toContain('Mazo completado');
    expect(container.textContent).toContain('¡Nuevo récord!');
    expect(container.textContent).toContain('Puntuación');
    view.unmount();
  });

  it('ends arcade when the last life is lost', () => {
    const { view, props } = mountShell();
    const { container } = view;
    click(container.querySelector('[data-mode="arcade"]'));
    click(container.querySelector('[data-difficulty="medio"]'));
    startSession(container);

    answer(container, false);
    expect(container.textContent).toContain('Vidas 2 de 3');
    next(container);
    answer(container, false);
    expect(container.textContent).toContain('Vidas 1 de 3');
    next(container);
    answer(container, false);
    expect(container.textContent).toContain('Vidas 0 de 3');
    next(container);

    expect(props.onArcadeEnd).toHaveBeenCalledWith({
      topicId: EXERCISE_TOPIC_ID,
      deckId: 'deck-1',
      deckNumber: 1,
      score: 0,
      correct: 0,
      wrong: 3,
      lives: 0,
      completed: false,
    });
    expect(container.textContent).toContain('Partida terminada');
    view.unmount();
  });

  it('renders loading, error, empty and invalid states without crashing', () => {
    const loading = mount(
      <CodeGameShell
        title="Cargando"
        exercises={null}
        renderExercise={(props) => <Mechanic {...props} />}
      />
    );
    expect(loading.container.textContent).toContain('Cargando ejercicios');
    loading.unmount();

    const error = mount(
      <CodeGameShell
        title="Error"
        exercises={{ decks: [], errors: ['Mazo duplicado'] }}
        renderExercise={(props) => <Mechanic {...props} />}
      />
    );
    expect(error.container.querySelector('[role="alert"]').textContent).toContain(
      'Mazo duplicado'
    );
    error.unmount();

    const empty = mount(
      <CodeGameShell title="Vacío" exercises={{ decks: [], errors: [] }} />
    );
    expect(empty.container.textContent).toContain('todavía no tiene ejercicios');
    empty.unmount();

    const fallback = mount(
      <CodeGameShell title="Sin mecánica" exercises={makeExerciseDocument()} />
    );
    expect(fallback.container.querySelector('[role="alert"]').textContent).toContain(
      'no está configurado'
    );
    fallback.unmount();
  });

  it('keeps ids unique and controls labelled for keyboard and screen readers', () => {
    const { view } = mountShell();
    const { container } = view;

    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const button of container.querySelectorAll('button')) {
      expect(button.type).toBe('button');
      expect((button.getAttribute('aria-label') || button.textContent).trim()).not.toBe('');
    }
    expect(container.querySelector('.game-setup__panel').getAttribute('aria-label')).toBe(
      'Ajustes de la partida'
    );
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    view.unmount();
  });
});
