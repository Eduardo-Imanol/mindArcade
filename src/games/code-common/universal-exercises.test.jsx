import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrdenaCodigoGame from '../ordena-codigo/index.jsx';
import EscribeCodigoGame from '../escribe-codigo/index.jsx';
import CompletaCodigoGame from '../completa-codigo/index.jsx';
import { click, mount } from '../../test/render.jsx';
import {
  EXERCISE_TOPIC_ID,
  exerciseId,
  learnedProgress,
  makeCardDecks,
  makeExerciseDocument,
} from '../../test/exercises.js';

const GAMES = [
  { id: 'ordena-codigo', title: 'Ordena el código', Component: OrdenaCodigoGame, marker: '.ordena-bank' },
  { id: 'escribe-codigo', title: 'Escribe el código', Component: EscribeCodigoGame, marker: '.code-editor__area' },
  { id: 'completa-codigo', title: 'Completa el código', Component: CompletaCodigoGame, marker: '.completa-code' },
];

const ALL_DECK_ONE = Array.from({ length: 6 }, (_value, index) => exerciseId(1, index + 1));

function mountGame(game, progress = {}) {
  const props = {
    topicId: EXERCISE_TOPIC_ID,
    exercises: makeExerciseDocument(),
    exerciseProgress: progress,
    decks: makeCardDecks(),
    best: {},
    onExerciseResult: vi.fn(),
    onGrade: vi.fn(),
    onArcadeEnd: vi.fn(() => ({ best: 0, isRecord: false })),
    onExit: vi.fn(),
  };
  return mount(<game.Component {...props} />);
}

function buttonByText(container, text) {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
}

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('universal exercises across the three code games (spec-21 T19)', () => {
  it('opens the same exercise document in Ordena, Escribe and Completa', () => {
    for (const game of GAMES) {
      const { container, unmount } = mountGame(game);
      expect(container.textContent, game.id).toContain(game.title);
      expect(container.textContent, game.id).toContain('Ejercicios: 0/6');
      expect(container.querySelector('.deck-picker'), game.id).toBeTruthy();

      click(buttonByText(container, 'Empezar'));
      expect(container.textContent, game.id).toContain('Completa la función suma1.');
      expect(container.querySelector(game.marker), game.id).toBeTruthy();
      unmount();
    }
  });

  it('shows partial and completed exercise levels in all three games', () => {
    const partial = learnedProgress(ALL_DECK_ONE.slice(0, 5));
    const complete = learnedProgress(ALL_DECK_ONE);

    for (const game of GAMES) {
      const partialView = mountGame(game, partial);
      expect(partialView.container.textContent, game.id).toContain('Ejercicios: 5/6');
      expect(partialView.container.textContent, game.id).toContain('Nivel en progreso');
      partialView.unmount();

      const completeView = mountGame(game, complete);
      expect(completeView.container.textContent, game.id).toContain('Ejercicios: 6/6');
      expect(completeView.container.textContent, game.id).toContain(
        'Nivel de ejercicios completado'
      );
      completeView.unmount();
    }
  });
});
