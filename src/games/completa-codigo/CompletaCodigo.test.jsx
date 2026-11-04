import React, { useState } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeGameShell from '../code-common/CodeGameShell.jsx';
import CompletaCodigo from './CompletaCodigo.jsx';
import { click, keydown, mount, setValue } from '../../test/render.jsx';
import { saveSettings } from '../../core/storage/settings.js';
import {
  EXERCISE_TOPIC_ID,
  exerciseId,
  makeCardDecks,
  makeExercise,
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

function inputsOf(container) {
  return [...container.querySelectorAll('.completa-blank__input')];
}

function multiBlankExercise() {
  return makeExercise(1, 1, {
    solution: 'function suma1(a, b) {\n  return a + b;\n}',
    starter: 'function suma1(a, b) {\n  return;\n}',
    template: 'function suma1({{a}}, {{b}}) {\n  return {{op}};\n}',
    blanks: [
      { id: 'a', answer: 'a' },
      { id: 'b', answer: 'b' },
      { id: 'op', answer: 'a + b', alternatives: ['b + a'] },
    ],
  });
}

function Harness({ exercise, onResult }) {
  const [result, setResult] = useState(null);
  return (
    <CompletaCodigo
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
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('CompletaCodigo (spec-21 T7)', () => {
  it('renders every marker as an input and preserves the rest of the code', () => {
    const exercise = multiBlankExercise();
    const { container } = mount(
      <CompletaCodigo exercise={exercise} onResult={vi.fn()} />
    );

    const code = container.querySelector('.completa-code');
    expect(code.textContent).toBe('function suma1(, ) {\n  return ;\n}');
    expect(code.textContent).not.toContain('{{');

    const inputs = inputsOf(container);
    expect(inputs).toHaveLength(3);
    expect(inputs.map((input) => input.getAttribute('aria-label'))).toEqual([
      'Espacio 1 de 3: a',
      'Espacio 2 de 3: b',
      'Espacio 3 de 3: op',
    ]);
    for (const input of inputs) {
      expect(input.type).toBe('text');
      expect(input.value).toBe('');
      expect(input.getAttribute('aria-required')).toBe('true');
      const describedBy = input.getAttribute('aria-describedby').split(' ');
      for (const id of describedBy) expect(document.getElementById(id)).toBeTruthy();
    }

    const group = container.querySelector('.completa-code-wrap');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Código para completar');
    expect(container.querySelector('[id$="-hint"]')).toBeTruthy();
  });

  it('accepts trimmed answers and alternatives, then shows per-blank feedback', () => {
    const exercise = multiBlankExercise();
    const onResult = vi.fn();
    const { container } = mount(<Harness exercise={exercise} onResult={onResult} />);

    setValue(inputsOf(container)[0], ' a ');
    setValue(inputsOf(container)[1], 'b');
    setValue(inputsOf(container)[2], ' b + a ');
    click(buttonByText(container, 'Comprobar'));

    expect(onResult).toHaveBeenCalledWith(true);
    const feedback = container.querySelector('.completa-feedback.is-correct');
    expect(feedback).toBeTruthy();
    expect(feedback.textContent).toContain('¡Correcto!');
    expect(feedback.textContent).not.toContain('Esperado');
    expect(container.querySelectorAll('.completa-blank.is-correct')).toHaveLength(3);
    expect(buttonByText(container, 'Comprobar').disabled).toBe(true);
    for (const input of inputsOf(container)) expect(input.readOnly).toBe(true);
    expect(document.activeElement).toBe(feedback);
  });

  it('marks wrong blanks, explains the expected answer and keeps correct blanks', () => {
    const exercise = multiBlankExercise();
    const onResult = vi.fn();
    const { container } = mount(<Harness exercise={exercise} onResult={onResult} />);

    setValue(inputsOf(container)[0], 'a');
    setValue(inputsOf(container)[1], 'B');
    setValue(inputsOf(container)[2], 'a + b');
    click(buttonByText(container, 'Comprobar'));

    expect(onResult).toHaveBeenCalledWith(false);
    const feedback = container.querySelector('.completa-feedback.is-wrong');
    expect(feedback).toBeTruthy();
    expect(feedback.textContent).toContain('Esperado: b');

    const items = [...feedback.querySelectorAll('.completa-feedback__item')];
    expect(items.map((item) => item.classList.contains('is-wrong'))).toEqual([
      false,
      true,
      false,
    ]);
    const inputs = inputsOf(container);
    expect(inputs[1].getAttribute('aria-invalid')).toBe('true');
    expect(inputs[0].getAttribute('aria-invalid')).toBeNull();
    expect(inputs[2].getAttribute('aria-invalid')).toBeNull();
  });

  it('navigates blanks with arrows and Enter, and checks from the last blank', () => {
    const exercise = multiBlankExercise();
    const onResult = vi.fn();
    const { container } = mount(
      <CompletaCodigo exercise={exercise} onResult={onResult} />
    );
    const inputs = inputsOf(container);

    inputs[0].focus();
    keydown(inputs[0], 'ArrowDown');
    expect(document.activeElement).toBe(inputs[1]);
    keydown(inputs[1], 'ArrowUp');
    expect(document.activeElement).toBe(inputs[0]);
    keydown(inputs[0], 'Enter');
    expect(document.activeElement).toBe(inputs[1]);

    inputs[2].focus();
    keydown(inputs[2], 'Enter');
    expect(onResult).toHaveBeenCalledWith(false);
    expect(container.querySelector('.completa-feedback')).toBeTruthy();
    expect(document.activeElement).toBe(container.querySelector('.completa-feedback'));

    const shortcut = mount(
      <CompletaCodigo exercise={exercise} onResult={onResult} />
    );
    const shortcutInput = inputsOf(shortcut.container)[0];
    shortcutInput.focus();
    keydown(shortcutInput, 'Enter', { ctrlKey: true });
    expect(shortcut.container.querySelector('.completa-feedback')).toBeTruthy();
    expect(onResult).toHaveBeenCalledTimes(2);
    shortcut.unmount();
  });

  it('clears answers and returns focus to the first blank without grading', () => {
    const exercise = multiBlankExercise();
    const onResult = vi.fn();
    const { container } = mount(
      <CompletaCodigo exercise={exercise} onResult={onResult} />
    );

    setValue(inputsOf(container)[0], 'a');
    click(buttonByText(container, 'Limpiar'));

    expect(inputsOf(container).map((input) => input.value)).toEqual(['', '', '']);
    expect(onResult).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(inputsOf(container)[0]);
  });

  it('rejects a template with an unmatched marker in an accessible alert', () => {
    const exercise = makeExercise(1, 1, {
      template: 'function suma1(a) {\n  return {{missing}};\n}',
      blanks: [{ id: 'op', answer: 'a + 1' }],
    });
    const { container } = mount(
      <CompletaCodigo exercise={exercise} onResult={vi.fn()} />
    );

    expect(container.querySelector('[role="alert"]').textContent).toContain(
      '{{missing}}'
    );
    expect(container.querySelector('.completa-code')).toBeNull();
  });

  it('keeps every mechanic control labelled and keyboard reachable', () => {
    const { container } = mount(
      <CompletaCodigo exercise={multiBlankExercise()} onResult={vi.fn()} />
    );

    const inputs = inputsOf(container);
    for (const input of inputs) {
      expect(input.tabIndex).toBe(0);
      expect((input.getAttribute('aria-label') || '').trim()).not.toBe('');
      expect(input.getAttribute('aria-invalid')).toBeNull();
    }
    for (const button of container.querySelectorAll('button')) {
      expect(button.type).toBe('button');
      expect(button.tabIndex).toBe(0);
      expect((button.getAttribute('aria-label') || button.textContent).trim()).not.toBe('');
    }
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    inputs[0].focus();
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('keeps the code wrapping and touch targets usable at 360px', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = css.match(/\.completa-code\s*{([^}]*)}/s)[1];
    expect(code).toMatch(/white-space:\s*pre-wrap/);
    expect(code).toMatch(/overflow-wrap:\s*anywhere/);

    const input = css.match(/\.completa-blank__input\s*{([^}]*)}/s)[1];
    expect(input).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/@media \(max-width: 479px\)[\s\S]*?\.completa-actions\s*{/);
  });

  it('reads the prompt with TTS but never reads the code automatically', () => {
    installSpeech();
    const view = mount(
      <CodeGameShell
        gameId="completa-codigo"
        title="Completa el código"
        topicId={EXERCISE_TOPIC_ID}
        exercises={makeExerciseDocument()}
        exerciseProgress={{}}
        decks={makeCardDecks()}
        onExerciseResult={vi.fn()}
        onGrade={vi.fn()}
        onArcadeEnd={vi.fn(() => ({ best: 0, isRecord: false }))}
        onExit={vi.fn()}
        renderExercise={({ exercise, result, onResult }) => (
          <CompletaCodigo exercise={exercise} result={result} onResult={onResult} />
        )}
      />
    );
    const { container } = view;
    click(buttonByText(container, 'Empezar'));

    const prompt = 'Completa la función suma1.';
    expect(synth.speak.mock.calls.map(([utterance]) => utterance.text)).toEqual([prompt]);

    click(container.querySelector('[aria-label="Escuchar el prompt"]'));
    expect(synth.speak.mock.calls.map(([utterance]) => utterance.text)).toEqual([
      prompt,
      prompt,
    ]);
    view.unmount();
  });

  it('runs inside the shared shell in arcade mode and loses a life on a wrong answer', () => {
    const onExerciseResult = vi.fn();
    const onGrade = vi.fn();
    const view = mount(
      <CodeGameShell
        gameId="completa-codigo"
        title="Completa el código"
        topicId={EXERCISE_TOPIC_ID}
        exercises={makeExerciseDocument()}
        exerciseProgress={{}}
        decks={makeCardDecks()}
        onExerciseResult={onExerciseResult}
        onGrade={onGrade}
        onArcadeEnd={vi.fn(() => ({ best: 0, isRecord: false }))}
        onExit={vi.fn()}
        renderExercise={({ exercise, result, onResult }) => (
          <CompletaCodigo exercise={exercise} result={result} onResult={onResult} />
        )}
      />
    );
    const { container } = view;

    click(container.querySelector('[data-mode="arcade"]'));
    click(buttonByText(container, 'Empezar'));
    expect(container.textContent).toContain('Vidas 3 de 3');

    setValue(inputsOf(container)[0], 'incorrecto');
    click(buttonByText(container, 'Comprobar'));

    expect(container.textContent).toContain('Incorrecto');
    expect(container.textContent).toContain('Vidas 2 de 3');
    expect(onExerciseResult).toHaveBeenCalledWith({
      topicId: EXERCISE_TOPIC_ID,
      deckNumber: 1,
      exerciseId: exerciseId(1, 1),
      correct: false,
    });
    expect(onGrade).toHaveBeenCalledWith(
      'card-1',
      'otra-vez',
      { topicId: EXERCISE_TOPIC_ID, exerciseId: exerciseId(1, 1) }
    );

    click(buttonByText(container, 'Siguiente'));
    expect(container.querySelector('.code-exercise__prompt').textContent).toBe(
      'Completa la función suma2.'
    );
    expect(inputsOf(container)).toHaveLength(1);
    view.unmount();
  });
});
