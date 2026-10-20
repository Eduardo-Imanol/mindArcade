import React, { useEffect, useRef, useState } from 'react';
import CardImage from '../../components/CardImage.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { ALARM_MISTAKES, renderHangman } from './hangman-art.mjs';
import {
  DEFAULT_ROUNDS,
  LETTERS,
  MAX_MISTAKES,
  MAX_ROUNDS,
  MIN_ROUNDS,
  createState,
  currentRound,
  normalizeWord,
  pendingGrades,
  reduce,
} from './ahorcado.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const ROUND_OPTIONS = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, index) => MIN_ROUNDS + index);
const XP_BY_GRADE = { facil: 10, dificil: 25, 'otra-vez': 0 };

export default function Ahorcado({ deck = [], selectCards, onGrade, onExit } = {}) {
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

  const guess = (letter) => {
    if (state.phase !== 'playing') return;
    const next = reduce(state, { type: 'guess', letter });
    if (next === state) return;
    setState(next);
    if (next.phase === 'round-lost') speak(next.cards[next.roundIndex].front);
  };

  useEffect(() => {
    if (state.phase !== 'playing') return undefined;
    const onKey = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const letter = normalizeWord(event.key);
      if (!LETTERS.includes(letter)) return;
      event.preventDefault();
      guess(letter);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleStart = () => {
    const requested = (selectCards ? selectCards(rounds) : deck.slice(0, rounds)) || [];
    emitted.current = 0;
    exiting.current = false;
    const next = reduce(createState(), { type: 'start', rounds, cards: requested, random: Math.random });
    setState(next);
    if (next.phase === 'playing') speak(next.cards[0].back);
  };

  const handleReplay = () => {
    emitted.current = 0;
    exiting.current = false;
    setState(createState());
  };

  const handleNext = () => {
    const next = reduce(state, { type: 'next' });
    setState(next);
    if (next.phase === 'playing') speak(next.cards[next.roundIndex].back);
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    for (const entry of pendingGrades(state)) onGrade?.(entry.cardId, entry.grade);
    onExit?.();
  };

  if (deck.length === 0) {
    return (
      <main className="sepect-bg ahorcado-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Ahorcado</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    return (
      <main className="sepect-bg ahorcado-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Ahorcado</h1>
          <p>Adivina el término letra a letra usando su significado como pista.</p>
          <div className="ahorcado-setup">
            <label htmlFor="ahorcado-rounds">Rondas</label>
            <select
              id="ahorcado-rounds"
              value={rounds}
              onChange={(event) => setRounds(Number(event.target.value))}
            >
              {ROUND_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button className="btn-neon" type="button" onClick={handleStart}>Empezar</button>
          </div>
          <p className="ahorcado-note">
            {Math.min(rounds, deck.length)} rondas disponibles con las cartas de este tema.
          </p>
          <div className="ahorcado-actions">
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={onExit}>Salir</button>
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'complete') {
    const wins = state.results.filter((result) => result.grade !== 'otra-vez').length;
    const fails = state.results.reduce((sum, result) => sum + result.mistakes, 0);
    const gained = state.results.reduce((sum, result) => sum + (XP_BY_GRADE[result.grade] || 0), 0);
    return (
      <main className="sepect-bg ahorcado-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Sesión completada</h1>
          <p role="status">
            {wins} de {state.total} rondas ganadas · {fails} fallos · +{gained} XP
          </p>
          <div className="ahorcado-actions" style={{ marginTop: 16 }}>
            <button className="btn-neon" type="button" onClick={handleReplay}>
              Jugar de nuevo
            </button>
            <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  const round = currentRound(state);
  const card = round.card;
  const alarm = round.mistakes >= ALARM_MISTAKES;
  const canPlay = state.phase === 'playing';
  const characters = [...round.target];
  const art = renderHangman({ mistakes: round.mistakes, cardId: card.id, size: 250 });

  const lastLetter = round.usedLetters[round.usedLetters.length - 1] || null;
  const lastCorrect = lastLetter ? normalizeWord(round.target).includes(lastLetter) : false;
  const remaining = MAX_MISTAKES - round.mistakes;
  let announcement = `${round.mistakes} de ${MAX_MISTAKES} fallos · ${remaining} intentos restantes`;
  if (canPlay && lastLetter) {
    announcement = `Letra ${lastLetter}: ${lastCorrect ? 'acierto' : 'fallo'}. ${round.mistakes} de ${MAX_MISTAKES} fallos · ${remaining} intentos restantes`;
  } else if (round.won) {
    announcement = `¡Ronda ganada! ${round.mistakes} fallos · +${XP_BY_GRADE[state.lastGrade?.grade] || 0} XP`;
  } else if (round.lost) {
    announcement = `Ronda perdida. La palabra era ${round.target}`;
  }

  return (
    <main className="sepect-bg ahorcado-page" style={PAGE}>
      <div className="game-stage">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ margin: 0 }}>
            Ronda {round.index + 1} de {state.total} · {round.mistakes}/{MAX_MISTAKES} fallos
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>

        <div className="ahorcado-layout">
          <div
            key={`${round.index}-${round.mistakes}`}
            className={`ahorcado-art${alarm ? ' is-alarm' : ''}`}
            dangerouslySetInnerHTML={{ __html: art }}
          />
          <div className="card-neon ahorcado-hint">
            <CardImage card={card} size={160} alt="Pista visual" />
            <span className="ahorcado-hint__label">Pista</span>
            <p className="ahorcado-hint__text">{card.back}</p>
            {isSupported() && (
              <button
                className="btn-neon"
                type="button"
                aria-label="Escuchar la pista"
                onClick={() => speak(card.back)}
              >
                🔊 Pista
              </button>
            )}
          </div>
        </div>

        <div className="ahorcado-word" role="group" aria-label={`Palabra de ${characters.filter((char) => char !== ' ').length} letras`}>
          {characters.map((char, index) =>
            char === ' ' ? (
              <span key={`${index}-gap`} className="ahorcado-gap" aria-hidden="true" />
            ) : (
              <span
                key={`${index}-${char}`}
                className={`ahorcado-box${round.revealed.includes(index) ? ' is-revealed' : ''}`}
                data-revealed={round.revealed.includes(index) ? 'true' : 'false'}
                role="img"
                aria-label={round.revealed.includes(index) ? char : 'letra oculta'}
              >
                {round.revealed.includes(index) ? char : ''}
              </span>
            )
          )}
        </div>

        <p className="ahorcado-status" role="status" aria-live="polite">{announcement}</p>

        {canPlay ? (
          <div className="ahorcado-keyboard" role="group" aria-label="Letras">
            {LETTERS.map((letter) => {
              const normalized = normalizeWord(letter);
              const used = round.usedLetters.includes(normalized);
              const correct = used && normalizeWord(round.target).includes(normalized);
              const stateLabel = used
                ? `, usada (${correct ? 'acierto' : 'fallo'})`
                : ', disponible';
              return (
                <button
                  key={letter}
                  type="button"
                  className={`ahorcado-key${correct ? ' is-correct' : ''}${used && !correct ? ' is-wrong' : ''}`}
                  disabled={used}
                  aria-label={`Letra ${letter}${stateLabel}`}
                  onClick={() => guess(letter)}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card-neon ahorcado-result">
            <h2 className="neon" style={{ fontSize: 20, margin: 0 }}>
              {round.won ? '¡Ronda ganada!' : 'Ronda perdida'}
            </h2>
            <p style={{ margin: 0 }}>
              {round.won
                ? `Fallos: ${round.mistakes} · +${XP_BY_GRADE[state.lastGrade?.grade] || 0} XP`
                : `La palabra era «${round.target}»`}
            </p>
            <button className="btn-neon" type="button" onClick={handleNext}>
              {state.results.length >= state.total ? 'Ver resumen' : 'Siguiente ronda'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
