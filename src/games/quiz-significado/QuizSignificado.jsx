import React, { useEffect, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { getDeckAvailability } from '../availability.js';
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
const GAME_ID = 'quiz-significado';

function disabledReasonFor(deck) {
  const availability = getDeckAvailability({ id: GAME_ID, minCards: 4 }, deck);
  if (!availability.playable && availability.reason === 'min-cards') return availability.message;
  return '';
}

export default function QuizSignificado({
  deck = [],
  decks,
  best,
  selectCards,
  onGrade,
  onArcadeEnd,
  onExit,
  onBackToTopic,
} = {}) {
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const [selectedDeckId, setSelectedDeckId] = useState(() => (hasDecks ? decks[0].id : null));
  const [gameMode, setGameMode] = useState('normal');
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeEnded, setArcadeEnded] = useState(false);
  const [arcadeResult, setArcadeResult] = useState(null);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [state, setState] = useState(() => createState());
  const emitted = useRef(0);
  const exiting = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks ? decks.find((entry) => entry.id === selectedDeckId) || decks[0] : null;

  useEffect(() => {
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, grade.grade);
    }
  }, [state, onGrade]);

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const endArcade = (finalArcade) => {
    if (arcadeEnded) return;
    const finished = arcadeFinish(finalArcade);
    setArcadeEnded(true);
    const run = {
      score: finished.score,
      correct: finished.correct,
      wrong: finished.wrong,
      lives: finished.lives,
      completed: finished.completed,
      deckId: selectedDeck?.id,
    };
    const result = onArcadeEnd?.(run);
    setArcadeResult(result || { best: finished.score, isRecord: false });
    setArcade(finished);
  };

  const handleStart = () => {
    emitted.current = 0;
    exiting.current = false;
    setArcadeEnded(false);
    setArcadeResult(null);
    let requested = [];
    if (hasDecks && selectedDeck) {
      if (gameMode === 'arcade') {
        requested = Array.isArray(selectedDeck.cards) ? selectedDeck.cards : [];
        setArcade(createArcade());
      } else {
        const count = Math.min(rounds, selectedDeck.cards.length);
        requested = (selectCards ? selectCards(count) : selectedDeck.cards.slice(0, count)) || [];
      }
    } else {
      requested = (selectCards ? selectCards(rounds) : deck.slice(0, rounds)) || [];
    }
    const next = reduce(createState(), {
      type: 'start',
      rounds: gameMode === 'arcade' ? requested.length : rounds,
      cards: requested,
      deck: hasDecks && selectedDeck ? selectedDeck.cards : deck,
      random: Math.random,
    });
    setState(next);
    if (next.phase === 'playing' && next.questions[0]) speak(next.questions[0].card.front);
  };

  const handleReplay = () => {
    emitted.current = 0;
    exiting.current = false;
    setArcadeEnded(false);
    setArcadeResult(null);
    if (gameMode === 'arcade' && hasDecks && selectedDeck) {
      setGameMode('arcade');
      setArcade(createArcade());
      handleStart();
      return;
    }
    setState(createState());
  };

  const handleChooseDeck = () => {
    emitted.current = 0;
    exiting.current = false;
    setGameMode('normal');
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
    setState(createState());
  };

  const handleChoose = (optionId) => {
    if (state.phase !== 'playing') return;
    if (gameMode === 'arcade' && arcade.over) return;
    const round = currentQuestion(state);
    const option = round ? round.options.find((entry) => entry.card.id === optionId) : null;
    if (!option) return;
    const wasCorrect = Boolean(option.correct);
    let nextArcade = arcade;
    if (gameMode === 'arcade') {
      if (wasCorrect) nextArcade = arcadeHit(arcade);
      else nextArcade = arcadeMiss(arcade);
      setArcade(nextArcade);
    }
    const next = reduce(state, { type: 'choose', optionId });
    if (next === state) return;
    setState(next);
    speak(option.card.back);
    if (gameMode === 'arcade' && !wasCorrect && arcadeMiss(arcade).over) {
      endArcade(arcadeMiss(arcade));
    }
  };

  const handleNext = () => {
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    setState(next);
    if (next.phase === 'playing' && next.questions[next.roundIndex]) speak(next.questions[next.roundIndex].card.front);
    if (gameMode === 'arcade' && next.phase === 'complete' && !arcade.over) {
      endArcade(arcadeFinish(arcade));
    }
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, gameMode === 'arcade' ? 'facil' : grade.grade);
    }
    for (const entry of pendingGrades(state)) {
      if (emitted.current >= entry.seq) continue;
      emitted.current = entry.seq;
      onGrade?.(entry.cardId, gameMode === 'arcade' ? (entry.grade === 'otra-vez' ? 'otra-vez' : 'facil') : entry.grade);
    }
    onExit?.();
  };

  if (hasDecks ? decks.length === 0 : deck.length === 0) {
    return (
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Elige el significado</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    const bestForDeck = typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id];
    if (hasDecks) {
      return (
        <GameSetup
          pageClassName="quiz-page"
          title="Elige el significado"
          lead="Lee el término y elige su significado entre cuatro opciones. Usa mazos de 10 cartas."
          note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema.`}
          start={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-neon" type="button" onClick={() => { setGameMode('normal'); handleStart(); }}>
                Normal
              </button>
              <button className="btn-neon" type="button" onClick={() => { setGameMode('arcade'); handleStart(); }}>
                Arcade · 3 vidas
              </button>
            </div>
          }
          actions={
            <>
              <SoundToggle />
              <button className="btn-neon game-setup__exit" type="button" onClick={backToTopic}>
                Volver al tema
              </button>
            </>
          }
        >
          <DeckPicker
            decks={decks}
            selectedDeckId={selectedDeck?.id}
            onSelect={(id) => setSelectedDeckId(id)}
            best={best}
            disabledReason={(deck) => disabledReasonFor(deck)}
            gameId={GAME_ID}
            label="Elige tu mazo"
          />
          {!gameMode || gameMode === 'normal' ? (
            <div className="quiz-setup">
              <label htmlFor="quiz-rounds">Rondas</label>
              <select id="quiz-rounds" value={rounds} onChange={(event) => setRounds(Number(event.target.value))}>
                {ROUND_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ) : (
            <p role="status">Arcade usa el mazo completo. Mejor marca: {bestForDeck || 0}</p>
          )}
        </GameSetup>
      );
    }

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
            <button className="btn-neon game-setup__exit" type="button" onClick={backToTopic}>
              Salir
            </button>
          </>
        }
      >
        <div className="quiz-setup">
          <label htmlFor="quiz-rounds">Rondas</label>
          <select id="quiz-rounds" value={rounds} onChange={(event) => setRounds(Number(event.target.value))}>
            {ROUND_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </GameSetup>
    );
  }

  if (state.phase === 'complete') {
    if (gameMode === 'arcade' && !arcadeEnded && state.total > 0) {
      endArcade(arcadeFinish(arcade));
    }
    if (gameMode === 'arcade' && arcadeEnded) {
      const bestForDeck = typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id] || 0;
      const isRecord = arcadeResult?.isRecord || arcade.score > bestForDeck;
      return (
        <main className="sepect-bg quiz-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Arcade terminado</h1>
            <p role="status">
              Puntuación {arcade.score} · Aciertos {arcade.correct} · Fallos {arcade.wrong} · Vidas restantes {arcade.lives}
            </p>
            <p role="status">{isRecord ? '¡Nuevo récord!' : `Mejor marca: ${Math.max(bestForDeck, arcade.score)}`}</p>
            {hasDecks && selectedDeck ? <p>Mazo {selectedDeck.number} ({selectedDeck.label})</p> : null}
            <div className="quiz-actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>Repetir</button>
              <button className="btn-neon" type="button" onClick={handleChooseDeck}>Elegir mazo</button>
              <button className="btn-neon" type="button" onClick={backToTopic}>Volver al tema</button>
              <SoundToggle />
            </div>
          </div>
        </main>
      );
    }
    if (state.total === 0) {
      return (
        <main className="sepect-bg quiz-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Sin preguntas disponibles</h1>
            <p>No hay cartas disponibles para esta sesión.</p>
            <div className="quiz-actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>Elegir rondas</button>
              <button className="btn-neon" type="button" onClick={backToTopic}>Volver al tema</button>
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
          {hasDecks && selectedDeck ? <p>Mazo {selectedDeck.number} ({selectedDeck.label})</p> : null}
          <div className="quiz-actions">
            <button className="btn-neon" type="button" onClick={handleReplay}>Jugar de nuevo</button>
            {hasDecks ? <button className="btn-neon" type="button" onClick={handleChooseDeck}>Elegir mazo</button> : null}
            <button className="btn-neon" type="button" onClick={backToTopic}>Volver al tema</button>
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

  if (gameMode === 'arcade' && arcade.over && !arcadeEnded) {
    endArcade(arcade);
  }

  return (
    <main className="sepect-bg quiz-page" style={PAGE}>
      <div className="game-stage">
        <header className="quiz-header">
          <p style={{ margin: 0 }}>
            {hasDecks ? `Mazo ${selectedDeck.number} · ` : ''}
            {gameMode === 'arcade' ? 'Arcade' : 'Normal'} · Pregunta {round.index + 1} de {state.total}
            {gameMode !== 'arcade' ? ` · ${round.attempts} fallos` : ''}
          </p>
          <div className="quiz-actions" style={{ marginTop: 0 }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>
        {gameMode === 'arcade' ? <ArcadeHud lives={arcade.lives} score={arcade.score} streak={arcade.streak} best={typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id]} /> : null}

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
