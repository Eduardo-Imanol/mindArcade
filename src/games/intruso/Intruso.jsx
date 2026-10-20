import React, { useEffect, useMemo, useRef, useState } from 'react';
import CardImage from '../../components/CardImage.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import {
  DEFAULT_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  createState,
  currentRound,
  pendingCurrent,
  reduce,
  summarize,
} from './intruso.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const ROUND_OPTIONS = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, index) => MIN_ROUNDS + index);
const XP_BY_GRADE = { facil: 10, 'otra-vez': 0 };

function promptFor(anchor) {
  return `¿Cuál no pertenece al tema «${anchor?.title || 'actual'}»?`;
}

export default function Intruso({ groups = [], anchorTopicId, onGrade, onExit } = {}) {
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [state, setState] = useState(() => createState());
  const emitted = useRef(0);
  const exiting = useRef(false);

  const anchor = useMemo(
    () => (Array.isArray(groups) ? groups.find((group) => group.id === anchorTopicId) : null),
    [groups, anchorTopicId]
  );
  const others = useMemo(
    () =>
      (Array.isArray(groups) ? groups : []).filter(
        (group) => group.id !== anchorTopicId && Array.isArray(group.cards) && group.cards.length > 0
      ),
    [groups, anchorTopicId]
  );
  const canPlay = !!anchor && Array.isArray(anchor.cards) && anchor.cards.length >= MIN_ROUNDS && others.length > 0;

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, grade.grade, { topicId: grade.topicId });
    }
  }, [state, onGrade]);

  const handleStart = () => {
    emitted.current = 0;
    exiting.current = false;
    const next = reduce(createState(), {
      type: 'start',
      groups,
      anchorTopicId,
      rounds,
      random: Math.random,
    });
    setState(next);
    if (next.phase === 'playing') speak(promptFor(anchor));
  };

  const handleReplay = () => {
    emitted.current = 0;
    exiting.current = false;
    setState(createState());
  };

  const handleChoose = (optionKey) => {
    if (state.phase !== 'playing') return;
    const round = currentRound(state);
    const option = round ? round.options.find((entry) => entry.key === optionKey) : null;
    if (!option) return;
    const next = reduce(state, { type: 'choose', optionKey });
    if (next === state) return;
    setState(next);
    speak(option.card.back);
  };

  const handleNext = () => {
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    setState(next);
    if (next.phase === 'playing') speak(promptFor(anchor));
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, grade.grade, { topicId: grade.topicId });
    }
    for (const entry of pendingCurrent(state)) {
      onGrade?.(entry.cardId, entry.grade, { topicId: entry.topicId });
    }
    onExit?.();
  };

  if (!canPlay) {
    return (
      <main className="sepect-bg intruso-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>El intruso</h1>
          <p>Este juego necesita al menos dos temas con 3 cartas cada uno.</p>
          <div className="intruso-actions">
            <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    return (
      <main className="sepect-bg intruso-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>El intruso</h1>
          <p>
            Tres significados son del tema actual; uno es de otro tema. Toca el que no
            pertenece. Tienes un solo intento por ronda.
          </p>
          <div className="intruso-setup">
            <label htmlFor="intruso-rounds">Rondas</label>
            <select
              id="intruso-rounds"
              value={rounds}
              onChange={(event) => setRounds(Number(event.target.value))}
            >
              {ROUND_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button className="btn-neon" type="button" onClick={handleStart}>Empezar</button>
          </div>
          <p className="intruso-note">
            Tema ancla: <strong>{anchor.title}</strong> · {others.length} tema
            {others.length === 1 ? '' : 's'} disponible{others.length === 1 ? '' : 's'} como intruso.
          </p>
          <div className="intruso-actions">
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={onExit}>Salir</button>
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'complete') {
    if (state.total === 0) {
      return (
        <main className="sepect-bg intruso-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon" style={{ fontSize: 24 }}>Sin rondas disponibles</h1>
            <p>No hay suficientes significados únicos para armar el set. Agrega cartas o temas.</p>
            <div className="intruso-actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>Elegir rondas</button>
              <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
              <SoundToggle />
            </div>
          </div>
        </main>
      );
    }

    const stats = summarize(state);
    const gained = state.results.reduce((sum, result) => sum + (XP_BY_GRADE[result.grade] || 0), 0);
    return (
      <main className="sepect-bg intruso-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Sesión completada</h1>
          <p role="status">
            {stats.correct} de {stats.total} aciertos · {stats.fails} fallos · +{gained} XP
          </p>
          <div className="intruso-actions">
            <button className="btn-neon" type="button" onClick={handleReplay}>Jugar de nuevo</button>
            <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  const round = currentRound(state);
  if (!round) {
    return (
      <main className="sepect-bg intruso-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>El intruso</h1>
          <p>No hay una ronda disponible.</p>
          <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  const answered = state.phase === 'answered';
  const intruderBack = round.intruder.card.back;
  let announcement = `Ronda ${round.index + 1} de ${round.total}. Elige el significado que no pertenece a «${anchor.title}».`;
  if (answered) {
    announcement = round.won
      ? `¡Correcto! «${intruderBack}» era del tema «${round.intruder.topicTitle}».`
      : `Incorrecto. El intruso era «${intruderBack}», del tema «${round.intruder.topicTitle}».`;
  }

  return (
    <main className="sepect-bg intruso-page" style={PAGE}>
      <div className="game-stage">
        <header className="intruso-header">
          <p style={{ margin: 0 }}>Ronda {round.index + 1} de {round.total}</p>
          <div className="intruso-actions" style={{ marginTop: 0 }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>

        <div className="card-neon intruso-prompt">
          <span className="intruso-prompt__label">Encuentra el intruso</span>
          <h1 className="neon intruso-prompt__text">{promptFor(anchor)}</h1>
          {isSupported() && (
            <button
              className="btn-neon"
              type="button"
              aria-label="Escuchar la pregunta"
              onClick={() => speak(promptFor(anchor))}
            >
              🔊 Pregunta
            </button>
          )}
        </div>

        <div className="intruso-options" role="group" aria-label="Significados: elige el intruso">
          {round.options.map((option, index) => {
            const wrong = answered && option.key === round.chosenKey && !option.correct;
            const correct = answered && option.correct;
            const statusClass = correct ? ' is-correct' : wrong ? ' is-wrong' : '';
            return (
              <button
                key={option.key}
                type="button"
                className={`intruso-option${statusClass}`}
                disabled={answered}
                aria-label={`Opción ${index + 1}: ${option.card.back}`}
                onClick={() => handleChoose(option.key)}
              >
                <span className="intruso-option__img" aria-hidden="true">
                  <CardImage card={option.card} size={64} alt="" />
                </span>
                <span className="intruso-option__text">{option.card.back}</span>
              </button>
            );
          })}
        </div>

        <p className="intruso-status" role="status" aria-live="polite">{announcement}</p>

        {answered && (
          <div className="card-neon intruso-feedback">
            <p style={{ margin: 0 }}>
              {round.won ? '¡Acertaste!' : 'La intrusa era:'} <strong>{intruderBack}</strong>
              {' '}· tema «{round.intruder.topicTitle}»
            </p>
            {isSupported() && (
              <button
                className="btn-neon"
                type="button"
                aria-label="Escuchar el intruso"
                onClick={() => speak(intruderBack)}
              >
                🔊 Intruso
              </button>
            )}
            <button className="btn-neon" type="button" onClick={handleNext}>
              {round.index + 1 >= round.total ? 'Ver resumen' : 'Siguiente'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
