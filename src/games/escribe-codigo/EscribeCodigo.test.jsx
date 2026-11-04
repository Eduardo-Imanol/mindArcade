import React, { useState } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeGameShell from '../code-common/CodeGameShell.jsx';
import EscribeCodigo from './EscribeCodigo.jsx';
import { click, flush, keydown, mount, setValue } from '../../test/render.jsx';
import { saveSettings } from '../../core/storage/settings.js';
import {
  EXERCISE_TOPIC_ID,
  makeCardDecks,
  makeExercise,
  makeExerciseDocument,
} from '../../test/exercises.js';

function buttonByText(container, text) {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text
  );
}

function runnerFor(outcome) {
  return vi.fn(() => Promise.resolve(outcome));
}

function allPass(exercise) {
  return {
    ok: true,
    results: exercise.cases.map((entry) => ({
      ok: true,
      actual: entry.expected,
      expected: entry.expected,
      args: entry.args,
    })),
  };
}

function Harness({ exercise, onResult, runCode }) {
  const [result, setResult] = useState(null);
  return (
    <EscribeCodigo
      exercise={exercise}
      result={result}
      runCode={runCode}
      onResult={(correct) => {
        onResult?.(correct);
        setResult({ correct });
      }}
    />
  );
}

function renderExercise(runCode) {
  return ({ exercise, result, onResult }) => (
    <EscribeCodigo
      exercise={exercise}
      result={result}
      onResult={onResult}
      runCode={runCode}
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

describe('EscribeCodigo (spec-21 T8)', () => {
  it('loads the starter of any exercise and validates all passing cases', async () => {
    const exercise = makeExercise(1, 4);
    const runCode = runnerFor(allPass(exercise));
    const onResult = vi.fn();
    const { container } = mount(
      <Harness exercise={exercise} onResult={onResult} runCode={runCode} />
    );

    const area = container.querySelector('textarea');
    expect(area.value).toBe(exercise.starter);
    expect(area.getAttribute('aria-label')).toBe('Código de la función');
    expect(container.querySelectorAll('.code-editor__line')).toHaveLength(
      exercise.starter.split('\n').length
    );

    click(buttonByText(container, 'Ejecutar'));
    await flush();

    expect(runCode).toHaveBeenCalledWith({
      code: exercise.starter,
      functionName: exercise.functionName,
      cases: exercise.cases,
    });
    expect(onResult).toHaveBeenCalledWith(true);
    expect(container.textContent).toContain('Todos los casos pasan');
    expect(container.querySelectorAll('.escribe-case.is-correct')).toHaveLength(
      exercise.cases.length
    );
    expect(buttonByText(container, 'Ejecutar').disabled).toBe(true);
    expect(container.querySelector('textarea').readOnly).toBe(true);
    expect(document.activeElement).toBe(container.querySelector('.escribe-results'));
  });

  it('shows partial failures with expected and actual values', async () => {
    const exercise = makeExercise(1, 2, {
      cases: [
        { args: [1], expected: 2 },
        { args: [2], expected: 3 },
      ],
    });
    const runCode = runnerFor({
      ok: true,
      results: [
        { ok: true, actual: 2, expected: 2, args: [1] },
        { ok: false, actual: 5, expected: 3, args: [2] },
      ],
    });
    const onResult = vi.fn();
    const { container } = mount(
      <Harness exercise={exercise} onResult={onResult} runCode={runCode} />
    );

    click(buttonByText(container, 'Ejecutar'));
    await flush();

    expect(onResult).toHaveBeenCalledWith(false);
    expect(container.textContent).toContain('1 de 2 casos correctos');
    const items = [...container.querySelectorAll('.escribe-case')];
    expect(items.map((item) => item.classList.contains('is-wrong'))).toEqual([false, true]);
    expect(items[1].textContent).toContain('Esperado 3');
    expect(items[1].textContent).toContain('Obtenido 5');
  });

  it('reports a syntax error as an accessible failure', async () => {
    const exercise = makeExercise(1, 1);
    const runCode = runnerFor({ ok: false, error: 'syntax-error' });
    const onResult = vi.fn();
    const { container } = mount(
      <Harness exercise={exercise} onResult={onResult} runCode={runCode} />
    );

    click(buttonByText(container, 'Ejecutar'));
    await flush();

    expect(container.querySelector('[role="alert"]').textContent).toContain(
      'error de sintaxis'
    );
    expect(onResult).toHaveBeenCalledWith(false);
    expect(buttonByText(container, 'Ejecutar').disabled).toBe(true);
  });

  it('reports a timeout and still records the failed attempt', async () => {
    const exercise = makeExercise(1, 1);
    const runCode = runnerFor({ ok: false, error: 'timeout' });
    const onResult = vi.fn();
    const { container } = mount(
      <Harness exercise={exercise} onResult={onResult} runCode={runCode} />
    );

    click(buttonByText(container, 'Ejecutar'));
    await flush();

    expect(container.querySelector('[role="alert"]').textContent).toContain(
      '2 segundos'
    );
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it('keeps the game playable when the sandbox is unavailable', async () => {
    const exercise = makeExercise(1, 1);
    const runCode = runnerFor({ ok: false, error: 'sandbox-unavailable' });
    const onResult = vi.fn();
    const { container } = mount(
      <Harness exercise={exercise} onResult={onResult} runCode={runCode} />
    );

    click(buttonByText(container, 'Ejecutar'));
    await flush();

    expect(container.querySelector('[role="alert"]').textContent).toContain(
      'sandbox de código'
    );
    expect(onResult).not.toHaveBeenCalled();
    expect(container.querySelector('textarea').readOnly).toBe(false);

    click(buttonByText(container, 'Reintentar'));
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(buttonByText(container, 'Ejecutar').disabled).toBe(false);
  });

  it('runs the current editor content with Ctrl/Cmd+Enter and allows restoring', async () => {
    const exercise = makeExercise(1, 1);
    const runCode = runnerFor(allPass(exercise));
    const onResult = vi.fn();
    const { container } = mount(
      <Harness exercise={exercise} onResult={onResult} runCode={runCode} />
    );
    const area = container.querySelector('textarea');

    setValue(area, 'function suma1(a) {\n  return a + 1;\n}');
    keydown(area, 'Enter', { ctrlKey: true });
    await flush();

    expect(runCode).toHaveBeenCalledWith({
      code: 'function suma1(a) {\n  return a + 1;\n}',
      functionName: exercise.functionName,
      cases: exercise.cases,
    });
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('restores the starter without grading while idle', () => {
    const exercise = makeExercise(1, 1);
    const onResult = vi.fn();
    const { container } = mount(
      <EscribeCodigo exercise={exercise} onResult={onResult} runCode={runnerFor(allPass(exercise))} />
    );

    setValue(container.querySelector('textarea'), 'código temporal');
    click(buttonByText(container, 'Restaurar'));

    expect(container.querySelector('textarea').value).toBe(exercise.starter);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('keeps the editor and results usable at 360px', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const results = css.match(/\.escribe-results\s*{([^}]*)}/s)[1];
    const detail = css.match(/\.escribe-case__detail\s*{([^}]*)}/s)[1];

    expect(results).toMatch(/overflow-wrap:\s*anywhere/);
    expect(detail).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/@media \(max-width: 479px\)[\s\S]*?\.escribe-actions\s*{/);
    expect(css).toMatch(/@media \(max-width: 479px\)[\s\S]*?\.escribe-case\s*{/);
  });

  it('runs inside the shared shell in arcade mode and loses a life on a failing case', async () => {
    const onExerciseResult = vi.fn();
    const onGrade = vi.fn();
    const runCode = runnerFor({
      ok: true,
      results: [{ ok: false, actual: 0, expected: 2, args: [1] }],
    });
    const view = mount(
      <CodeGameShell
        gameId="escribe-codigo"
        title="Escribe el código"
        topicId={EXERCISE_TOPIC_ID}
        exercises={makeExerciseDocument()}
        exerciseProgress={{}}
        decks={makeCardDecks()}
        onExerciseResult={onExerciseResult}
        onGrade={onGrade}
        onArcadeEnd={vi.fn(() => ({ best: 0, isRecord: false }))}
        onExit={vi.fn()}
        renderExercise={renderExercise(runCode)}
      />
    );
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));
    expect(container.textContent).toContain('Vidas 3 de 3');

    click(buttonByText(container, 'Ejecutar'));
    await flush(12);

    expect(container.textContent).toContain('Incorrecto');
    expect(onExerciseResult).toHaveBeenCalledWith({
      topicId: EXERCISE_TOPIC_ID,
      deckNumber: 1,
      exerciseId: 'ex-1-1',
      correct: false,
    });
    expect(onGrade).toHaveBeenCalledWith('card-1', 'otra-vez', {
      topicId: EXERCISE_TOPIC_ID,
      exerciseId: 'ex-1-1',
    });

    click(buttonByText(container, 'Siguiente'));
    expect(container.querySelector('.code-exercise__prompt').textContent).toBe(
      'Completa la función suma2.'
    );
    view.unmount();
  });

  it('exposes an accessible live status while executing', async () => {
    const exercise = makeExercise(1, 1);
    let resolveRun;
    const runCode = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRun = resolve;
        })
    );
    const { container } = mount(
      <EscribeCodigo exercise={exercise} result={null} onResult={vi.fn()} runCode={runCode} />
    );

    click(buttonByText(container, 'Ejecutar'));
    await flush(1);

    expect(container.textContent).toContain('Ejecutando…');
    expect(container.querySelector('[role="status"]').textContent).toContain(
      'Ejecutando el código'
    );

    resolveRun(allPass(exercise));
    await flush();
    expect(container.textContent).toContain('Todos los casos pasan');
  });
});
