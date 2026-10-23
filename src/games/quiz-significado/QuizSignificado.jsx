import React, { useEffect, useRef, useState } from 'react';
import CardImage from '../../components/CardImage.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import {
  DEFAULT_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  createState,
  currentQuestion,
  pendingGrades,
  reduce,
  summarize,
} from './quiz-significado.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const ROUND_OPTIONS = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, index) => MIN_ROUNDS + index);
const XP_BY_GRADE = { facil: 10, dificil: 25, 'otra-vez': 0 };

export default function QuizSignificado({ deck = [], selectCards, onGrade, onExit } = {}) {
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [state, setState] = useState(() => createState());
  const emitted = useRef(0);
  const exiting = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, grade.grade);
    }
  }, [state, onGrade]);

  const handleStart = () => {
    const requested = (selectCards ? selectCards(rounds) : deck.slice(0, rounds)) || [];
    emitted.current = 0;
    exiting.current = false;
    const next = reduce(createState(), {
      type: 'start',
      rounds,
      cards: requested,
      deck,
      random: Math.random,
    });
    setState(next);
    if (next.phase === 'playing') speak(next.questions[0].card.front);
  };

  const handleReplay = () => {
    emitted.current = 0;
    exiting.current = false;
    setState(createState());
  };

  const handleChoose = (optionId) => {
    if (state.phase !== 'playing') return;
    const round = currentQuestion(state);
    const option = round ? round.options.find((entry) => entry.card.id === optionId) : null;
    if (!option) return;
    const next = reduce(state, { type: 'choose', optionId });
    if (next === state) return;
    setState(next);
    speak(option.card.back);
  };

  const handleNext = () => {
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    setState(next);
    if (next.phase === 'playing') speak(next.questions[next.roundIndex].card.front);
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, grade.grade);
    }
    for (const entry of pendingGrades(state)) onGrade?.(entry.cardId, entry.grade);
    onExit?.();
  };

  if (deck.length === 0) {
    return (
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Elige el significado</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    return (
      <GameSetup
        pageClassName="quiz-page"
        title="Elige el significado"
        lead="Lee el término y elige su significado entre cuatro opciones. Tienes dos intentos."
        note={`${Math.min(rounds, deck.length)} preguntas disponibles con las cartas de este tema.`}
        start={
          <button className="btn-neon" type="button" onClick={handleStart}>
            Empezar
          </button>
        }
        actions={
          <>
            <SoundToggle />
            <button className="btn-neon game-setup__exit" type="button" onClick={onExit}>
              Salir
            </button>
          </>
        }
      >
        <div className="quiz-setup">
          <label htmlFor="quiz-rounds">Rondas</label>
          <select
            id="quiz-rounds"
            value={rounds}
            onChange={(event) => setRounds(Number(event.target.value))}
          >
            {ROUND_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </GameSetup>
    );
  }

  if (state.phase === 'complete') {
    if (state.total === 0) {
      return (
        <main className="sepect-bg quiz-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Sin preguntas disponibles</h1>
            <p>No hay cartas disponibles para esta sesión.</p>
            <div className="quiz-actions">
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
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Sesión completada</h1>
          <p role="status">
            {stats.firstTry} de {stats.total} aciertos al primer intento · {stats.fails} fallos · +{gained} XP
          </p>
          <div className="quiz-actions">
            <button className="btn-neon" type="button" onClick={handleReplay}>Jugar de nuevo</button>
            <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  const round = currentQuestion(state);
  if (!round) {
    return (
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Elige el significado</h1>
          <p>No hay preguntas disponibles.</p>
          <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  const answered = state.phase === 'answered';
  const remaining = round.remaining;
  let announcement = `Pregunta ${round.index + 1} de ${state.total}`;
  if (!answered && round.attempts > 0) {
    announcement = `Fallo. ${remaining === 1 ? 'Te queda 1 intento' : `Te quedan ${remaining} intentos`}.`;
  } else if (answered) {
    announcement = round.won
      ? `¡Correcto! La respuesta es «${round.card.back}»`
      : `Incorrecto. La respuesta correcta es «${round.card.back}»`;
  }

  return (
    <main className="sepect-bg quiz-page" style={PAGE}>
      <div className="game-stage">
        <header className="quiz-header">
          <p style={{ margin: 0 }}>
            Pregunta {round.index + 1} de {state.total} · {round.attempts} fallos
          </p>
          <div className="quiz-actions" style={{ marginTop: 0 }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>

        <div className="card-neon quiz-question">
          <span className="quiz-question__label">Elige el significado de</span>
          <h1 className="neon quiz-question__text">{round.card.front}</h1>
          {isSupported() && (
            <button
              className="btn-neon"
              type="button"
              aria-label="Escuchar la pregunta"
              onClick={() => speak(round.card.front)}
            >
              🔊 Pregunta
            </button>
          )}
        </div>

        <div className="quiz-options" role="group" aria-label="Opciones de significado">
          {round.options.map((option, index) => {
            const wrong = round.wrongOptionIds.includes(option.card.id);
            const correct = answered && option.correct;
            const disabled = answered || wrong;
            const statusClass = correct ? ' is-correct' : wrong ? ' is-wrong' : '';
            return (
              <button
                key={option.card.id}
                type="button"
                className={`quiz-option${statusClass}`}
                disabled={disabled}
                aria-label={`Opción ${index + 1}: ${option.card.back}`}
                onClick={() => handleChoose(option.card.id)}
              >
                <span className="quiz-option__img" aria-hidden="true">
                  <CardImage card={option.card} size={64} alt="" />
                </span>
                <span className="quiz-option__text">{option.card.back}</span>
              </button>
            );
          })}
        </div>

        <p className="quiz-status" role="status" aria-live="polite">{announcement}</p>

        {answered && (
          <div className="card-neon quiz-feedback">
            <p style={{ margin: 0 }}>
              {round.won ? '¡Acertaste!' : 'La respuesta correcta es:'} <strong>{round.card.back}</strong>
            </p>
            {isSupported() && (
              <button
                className="btn-neon"
                type="button"
                aria-label="Escuchar la respuesta correcta"
                onClick={() => speak(round.card.back)}
              >
                🔊 Respuesta
              </button>
            )}
            <button className="btn-neon" type="button" onClick={handleNext}>
              {round.index + 1 >= state.total ? 'Ver resumen' : 'Siguiente'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
