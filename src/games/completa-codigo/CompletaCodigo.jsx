import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { evaluateBlanks, parseTemplate } from './completa-codigo.logic.js';

function isPresent(value) {
  return value !== null && value !== undefined;
}

export default function CompletaCodigo({ exercise, result, onResult } = {}) {
  const parsed = useMemo(
    () => parseTemplate(exercise?.template, exercise?.blanks),
    [exercise?.template, exercise?.blanks]
  );
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(null);
  const inputRefs = useRef([]);
  const feedbackRef = useRef(null);
  const rawId = useId();
  const idPrefix = `completa-${rawId.replace(/[^A-Za-z0-9_-]/g, '')}`;
  const hintId = `${idPrefix}-hint`;
  const exerciseId = exercise?.id ?? '';

  useEffect(() => {
    setAnswers({});
    setChecked(null);
  }, [exerciseId]);

  const blankById = useMemo(
    () => new Map(parsed.blanks.map((blank) => [blank.id, blank])),
    [parsed.blanks]
  );
  const blankIndexById = useMemo(
    () => new Map(parsed.blanks.map((blank, index) => [blank.id, index])),
    [parsed.blanks]
  );
  const answered = isPresent(result);
  const completed = answered || checked !== null;
  const feedback = checked || (answered ? evaluateBlanks(parsed.blanks, answers) : null);
  const feedbackResults = feedback?.results ?? [];
  const resultByBlank = useMemo(
    () => new Map(feedbackResults.map((entry) => [entry.id, entry])),
    [feedbackResults]
  );
  const wrongCount = feedbackResults.filter((entry) => !entry.ok).length;
  const hasAnswers = parsed.blanks.some(
    (blank) => String(answers[blank.id] ?? '').trim().length > 0
  );
  const feedbackMessage = feedback
    ? feedback.ok
      ? `Correcto. ${feedbackResults.length} de ${feedbackResults.length} espacios.`
      : `Incorrecto. ${wrongCount} de ${feedbackResults.length} espacios.`
    : '';
  const feedbackClass = feedback ? (feedback.ok ? ' is-correct' : ' is-wrong') : '';

  const feedbackId = (index) => `${idPrefix}-blank-${index}-feedback`;

  useEffect(() => {
    if (!completed) return;
    feedbackRef.current?.focus();
  }, [completed]);

  if (!parsed.ok) {
    return (
      <p className="completa-empty" role="alert">
        {parsed.errors[0] || 'No se pudo preparar el ejercicio.'}
      </p>
    );
  }

  const focusSlot = (slot) => {
    if (slot < 0 || slot >= parsed.slotCount) return;
    inputRefs.current[slot]?.focus();
  };

  const check = () => {
    if (completed) return;
    const summary = evaluateBlanks(parsed.blanks, answers);
    setChecked(summary);
    onResult?.(summary.ok);
  };

  const reset = () => {
    if (completed) return;
    setAnswers({});
    setChecked(null);
    focusSlot(0);
  };

  const handleKeyDown = (event, slot) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      check();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusSlot(slot + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusSlot(slot - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (slot + 1 < parsed.slotCount) focusSlot(slot + 1);
      else check();
    }
  };

  const updateBlank = (id, value) => {
    if (completed) return;
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  return (
    <div className="completa">
      <div className="completa-code-wrap" role="group" aria-label="Código para completar">
        <pre className="completa-code"><code>{parsed.segments.map((segment, index) => {
          if (segment.type === 'text') {
            return <React.Fragment key={`text-${index}`}>{segment.value}</React.Fragment>;
          }
          const blank = blankById.get(segment.id);
          if (!blank) return null;
          const resultIndex = blankIndexById.get(segment.id);
          const item = resultByBlank.get(segment.id);
          const value = answers[segment.id] ?? '';
          const width = Math.min(20, Math.max(4, value.length + 1));
          const describedBy = [hintId];
          if (item && resultIndex !== undefined) describedBy.push(feedbackId(resultIndex));
          return (
            <span
              key={`blank-${index}`}
              className={`completa-blank${item ? (item.ok ? ' is-correct' : ' is-wrong') : ''}`}
            >
              <input
                ref={(node) => {
                  inputRefs.current[segment.slot] = node;
                }}
                className={`completa-blank__input${
                  item ? (item.ok ? ' is-correct' : ' is-wrong') : ''
                }`}
                type="text"
                value={value}
                style={{ width: `${width}ch` }}
                aria-label={`Espacio ${segment.slot + 1} de ${parsed.slotCount}: ${blank.id}`}
                aria-describedby={describedBy.join(' ')}
                aria-invalid={item && !item.ok ? true : undefined}
                aria-required="true"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint={segment.slot + 1 < parsed.slotCount ? 'next' : 'done'}
                readOnly={completed}
                placeholder="…"
                onChange={(event) => updateBlank(blank.id, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, segment.slot)}
              />
            </span>
          );
        })}</code></pre>
      </div>

      <p className="completa-hint" id={hintId}>
        Completa cada espacio. Usa ↑ y ↓ o Intro para moverte entre espacios; Intro en el
        último comprueba.
      </p>

      <div className="completa-actions">
        <button className="btn-neon" type="button" onClick={check} disabled={completed}>
          Comprobar
        </button>
        <button
          className="btn-neon"
          type="button"
          onClick={reset}
          disabled={completed || !hasAnswers}
        >
          Limpiar
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {feedbackMessage}
      </p>

      {feedback ? (
        <section
          ref={feedbackRef}
          tabIndex={-1}
          className={`completa-feedback${feedbackClass}`}
          aria-labelledby={`${idPrefix}-feedback-title`}
        >
          <p className="completa-feedback__title" id={`${idPrefix}-feedback-title`}>
            {feedback.ok ? '¡Correcto!' : 'Incorrecto. Revisa los espacios marcados'}
          </p>
          <ul className="completa-feedback__list">
            {feedbackResults.map((item, index) => (
              <li
                className={`completa-feedback__item${item.ok ? ' is-correct' : ' is-wrong'}`}
                id={feedbackId(index)}
                key={item.id}
              >
                <span className="completa-feedback__blank">Espacio {index + 1}</span>
                {item.ok ? (
                  <span className="completa-feedback__ok">Correcto</span>
                ) : (
                  <span className="completa-feedback__expected">
                    Esperado: <code>{item.expected}</code>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
