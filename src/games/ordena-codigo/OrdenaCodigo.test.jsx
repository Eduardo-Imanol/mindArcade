import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeGameShell from '../code-common/CodeGameShell.jsx';
import OrdenaCodigo from './OrdenaCodigo.jsx';
import { click, mount } from '../../test/render.jsx';
import { saveSettings } from '../../core/storage/settings.js';
import {
  EXERCISE_TOPIC_ID,
  makeCardDecks,
  makeExercise,
  makeExerciseDocument,
  pieceId,
} from '../../test/exercises.js';

function buttonByText(container, text) {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
}

function clickPiece(container, id) {
  const button = container.querySelector(`[data-piece-id="${id}"]`);
  if (!button) throw new Error(`piece not found: ${id}`);
  click(button);
}

function answerCodes(container) {
  return [...container.querySelectorAll('.ordena-answer__code')].map((code) => code.textContent);
}

function orderedIds(deckNumber, index) {
  return [pieceId(deckNumber, index, 1), pieceId(deckNumber, index, 2), pieceId(deckNumber, index, 3)];
}

function Harness({ exercise, onResult }) {
  const [result, setResult] = useState(null);
  return (
    <OrdenaCodigo
      exercise={exercise}
      result={result}
      onResult={(correct) => {
        onResult?.(correct);
        setResult({ correct });
      }}
    />
  );
}

beforeEach(() => {
  saveSettings({ muted: false });
});

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('OrdenaCodigo (spec-21 T6)', () => {
  it('accepts any exercise of the deck and resolves the correct order', () => {
    const exercise = makeExercise(1, 4);
    const onResult = vi.fn();
    const { container } = mount(<OrdenaCodigo exercise={exercise} onResult={onResult} />);

    for (const id of orderedIds(1, 4)) clickPiece(container, id);

    expect(answerCodes(container)).toEqual(exercise.pieces.map((piece) => piece.code));
    click(buttonByText(container, 'Comprobar'));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('marks a wrong order and reveals the correct one', () => {
    const exercise = makeExercise(1, 1);
    const onResult = vi.fn();
    const { container } = mount(<Harness exercise={exercise} onResult={onResult} />);

    clickPiece(container, orderedIds(1, 1)[1]);
    clickPiece(container, orderedIds(1, 1)[0]);
    clickPiece(container, orderedIds(1, 1)[2]);
    click(buttonByText(container, 'Comprobar'));

    expect(onResult).toHaveBeenCalledWith(false);
    const solution = container.querySelector('.ordena-solution');
    expect(solution).toBeTruthy();
    expect([...solution.querySelectorAll('.ordena-solution__code')].map((code) => code.textContent)).toEqual(
      exercise.pieces.map((piece) => piece.code)
    );
    expect(buttonByText(container, 'Comprobar').disabled).toBe(true);
    expect(buttonByText(container, 'Reiniciar').disabled).toBe(true);
    for (const button of container.querySelectorAll('.ordena-answer__actions button')) {
      expect(button.disabled).toBe(true);
    }
  });

  it('resets the answer without grading', () => {
    const exercise = makeExercise(1, 1);
    const onResult = vi.fn();
    const { container } = mount(<OrdenaCodigo exercise={exercise} onResult={onResult} />);

    clickPiece(container, orderedIds(1, 1)[0]);
    click(buttonByText(container, 'Reiniciar'));
    expect(container.querySelectorAll('.ordena-answer__item')).toHaveLength(0);
    expect(container.querySelectorAll('.ordena-piece')).toHaveLength(3);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('rejects duplicate piece ids with an accessible error', () => {
    const exercise = makeExercise(1, 1, {
      pieces: [
        { id: 'dup', code: 'primera' },
        { id: 'dup', code: 'segunda' },
      ],
    });
    const { container } = mount(<OrdenaCodigo exercise={exercise} onResult={() => {}} />);

    expect(container.querySelector('[role="alert"]').textContent).toContain('duplicado');
    expect(container.querySelectorAll('.ordena-piece')).toHaveLength(0);
  });

  it('keeps every mechanic control keyboard reachable and labelled', () => {
    const { container } = mount(
      <OrdenaCodigo exercise={makeExercise(1, 1)} onResult={() => {}} />
    );

    const controls = [...container.querySelectorAll('button')];
    expect(controls.length).toBeGreaterThan(0);
    for (const button of controls) {
      expect(button.type).toBe('button');
      expect(button.tabIndex).toBe(0);
      expect((button.getAttribute('aria-label') || button.textContent).trim()).not.toBe('');
    }
    const bank = container.querySelector('.ordena-bank');
    expect(bank.getAttribute('aria-labelledby')).toBe('ordena-bank-title');
    expect(container.querySelector('#ordena-bank-title')).toBeTruthy();
    expect(container.querySelector('.ordena-answer').getAttribute('aria-labelledby')).toBe(
      'ordena-answer-title'
    );
    expect(container.querySelector('[role="status"]')).toBeTruthy();

    const first = container.querySelector('[data-piece-id="ex-1-1-p1"]');
    first.focus();
    expect(document.activeElement).toBe(first);
    click(first);
    expect(container.querySelector('.ordena-answer__item')).toBeTruthy();
    expect([...container.querySelectorAll('.ordena-answer__actions button')].map((button) =>
      button.getAttribute('aria-label')
    )).toEqual([
      expect.stringContaining('Subir pieza 1'),
      expect.stringContaining('Bajar pieza 1'),
      expect.stringContaining('Quitar pieza 1'),
    ]);
  });

  it('runs inside the shared shell in arcade mode and loses a life on a wrong order', () => {
    const view = mount(
      <CodeGameShell
        gameId="ordena-codigo"
        title="Ordena el código"
        topicId={EXERCISE_TOPIC_ID}
        exercises={makeExerciseDocument()}
        exerciseProgress={{}}
        decks={makeCardDecks()}
        onExerciseResult={vi.fn()}
        onGrade={vi.fn()}
        onArcadeEnd={vi.fn(() => ({ best: 0, isRecord: false }))}
        onExit={vi.fn()}
        renderExercise={({ exercise, result, onResult }) => (
          <OrdenaCodigo exercise={exercise} result={result} onResult={onResult} />
        )}
      />
    );
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));
    expect(container.textContent).toContain('Vidas 3 de 3');

    clickPiece(container, pieceId(1, 1, 2));
    clickPiece(container, pieceId(1, 1, 1));
    clickPiece(container, pieceId(1, 1, 3));
    click(buttonByText(container, 'Comprobar'));

    expect(container.textContent).toContain('Incorrecto');
    expect(container.textContent).toContain('Vidas 2 de 3');
    expect(container.querySelector('.ordena-solution')).toBeTruthy();
    expect(buttonByText(container, 'Siguiente')).toBeTruthy();
    view.unmount();
  });
});
