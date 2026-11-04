import React, { useEffect, useId, useRef, useState } from 'react';
import CodeEditor from '../../components/CodeEditor.jsx';
import { runCode as defaultRunCode } from '../../core/code/sandbox.js';

function showValue(value) {
  try {
    const text = JSON.stringify(value);
    return text === undefined ? String(value) : text;
  } catch {
    return String(value);
  }
}

function errorMessage(error, functionName) {
  if (error === 'timeout') {
    return 'La ejecución superó el límite de 2 segundos. Revisa si hay bucles infinitos.';
  }
  if (error === 'syntax-error') {
    return 'El código tiene un error de sintaxis. Corrige el editor y vuelve a ejecutar.';
  }
  if (error === 'function-not-found') {
    return `No se encontró la función ${functionName || 'indicada'}.`;
  }
  if (error === 'sandbox-unavailable') {
    return 'No se pudo iniciar el sandbox de código en este navegador. Puedes reintentar.';
  }
  return `No se pudo ejecutar el código: ${error || 'error desconocido'}.`;
}

function isInfrastructureError(error) {
  return error === 'sandbox-unavailable';
}

export default function EscribeCodigo({
  exercise,
  result,
  onResult,
  runCode = defaultRunCode,
  timeoutMs,
} = {}) {
  const exerciseId = exercise?.id ?? '';
  const starter = typeof exercise?.starter === 'string' ? exercise.starter : '';
  const [code, setCode] = useState(starter);
  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const submitted = useRef(false);
  const mounted = useRef(true);
  const resultsRef = useRef(null);
  const rawId = useId();
  const idPrefix = `escribe-${rawId.replace(/[^A-Za-z0-9_-]/g, '')}`;
  const hintId = `${idPrefix}-hint`;
  const resultsTitleId = `${idPrefix}-results-title`;
  const answered = Boolean(result) || submitted.current;
  const running = status === 'running';
  const results = Array.isArray(response?.results) ? response.results : [];
  const passed = results.filter((entry) => entry.ok).length;
  const total = results.length;
  const correct = total > 0 && passed === total;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setCode(starter);
    setStatus('idle');
    setResponse(null);
    setError('');
    submitted.current = false;
  }, [exerciseId, starter]);

  useEffect(() => {
    if (status !== 'done') return;
    resultsRef.current?.focus();
  }, [status]);

  let announcement = '';
  if (running) announcement = 'Ejecutando el código…';
  else if (error) announcement = error;
  else if (status === 'done') {
    announcement = correct
      ? `Correcto. Pasan los ${total} casos.`
      : `Incorrecto. ${passed} de ${total} casos correctos.`;
  }

  const execute = async () => {
    if (running || answered || !exercise) return;
    setStatus('running');
    setError('');
    setResponse(null);
    try {
      const outcome = await runCode({
        code,
        functionName: exercise.functionName,
        cases: Array.isArray(exercise.cases) ? exercise.cases : [],
        ...(timeoutMs ? { timeoutMs } : {}),
      });
      if (!mounted.current) return;
      if (!outcome || outcome.ok !== true) {
        const nextError =
          outcome && typeof outcome.error === 'string' ? outcome.error : 'sandbox-unavailable';
        setStatus('error');
        setError(errorMessage(nextError, exercise.functionName));
        if (!isInfrastructureError(nextError)) {
          submitted.current = true;
          onResult?.(false);
        }
        return;
      }
      setResponse(outcome);
      setStatus('done');
      submitted.current = true;
      const allPassed =
        outcome.results.length > 0 && outcome.results.every((entry) => entry.ok === true);
      onResult?.(allPassed);
    } catch {
      if (!mounted.current) return;
      setStatus('error');
      setError(errorMessage('sandbox-unavailable', exercise.functionName));
    }
  };

  const restore = () => {
    if (running || answered) return;
    setCode(starter);
    setStatus('idle');
    setResponse(null);
    setError('');
  };

  const retrySandbox = () => {
    setStatus('idle');
    setError('');
    setResponse(null);
  };

  return (
    <div className="escribe">
      <CodeEditor
        value={code}
        onChange={(value) => {
          if (answered) return;
          setCode(value);
        }}
        onRun={execute}
        label="Código de la función"
        describedBy={hintId}
        readOnly={answered}
      />

      <p className="escribe-hint" id={hintId}>
        Escribe la función completa. Usa Ctrl/Cmd + Intro para ejecutar; Tab inserta dos
        espacios.
      </p>

      <div className="escribe-actions">
        <button
          className="btn-neon"
          type="button"
          onClick={execute}
          disabled={running || answered}
        >
          {running ? 'Ejecutando…' : 'Ejecutar'}
        </button>
        <button
          className="btn-neon"
          type="button"
          onClick={restore}
          disabled={running || answered || code === starter}
        >
          Restaurar
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {error ? (
        <div className="escribe-error" role="alert">
          <p>{error}</p>
          {status === 'error' && !submitted.current ? (
            <button className="btn-neon" type="button" onClick={retrySandbox}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {status === 'done' ? (
        <section
          className={`escribe-results${correct ? ' is-correct' : ' is-wrong'}`}
          ref={resultsRef}
          tabIndex={-1}
          aria-labelledby={resultsTitleId}
        >
          <p className="escribe-results__title" id={resultsTitleId}>
            {correct ? 'Todos los casos pasan' : `${passed} de ${total} casos correctos`}
          </p>
          <ul className="escribe-results__list">
            {results.map((entry, index) => (
              <li
                className={`escribe-case${entry.ok ? ' is-correct' : ' is-wrong'}`}
                key={`case-${index + 1}`}
              >
                <span className="escribe-case__name">Caso {index + 1}</span>
                {entry.ok ? (
                  <span className="escribe-case__ok">Correcto</span>
                ) : entry.error ? (
                  <span className="escribe-case__detail">
                    Error: <code>{entry.error}</code>
                  </span>
                ) : (
                  <span className="escribe-case__detail">
                    Esperado <code>{showValue(entry.expected)}</code> · Obtenido{' '}
                    <code>{showValue(entry.actual)}</code>
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
