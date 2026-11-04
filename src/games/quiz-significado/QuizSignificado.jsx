import React, { useEffect, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import ArcadeSummary from '../../components/ArcadeSummary.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameModeSwitch from '../../components/GameModeSwitch.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { availabilityMessage, getDeckAvailability } from '../availability.js';
import { bestScoreFor } from '../best.js';
import {
  DEFAULT_ROUNDS,
  MAX_ROUNDS,
  MIN_ROUNDS,
  createState,
  currentQuestion,
  reduce,
  roundsForDeck,
  sessionCardsFor,
  summarize,
  unresolvedCurrent,
} from './quiz-significado.logic.js';

const PAGE = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  padding: '16px clamp(16px, 4vw, 32px)',
};
const LEGACY_ROUNDS = Array.from(
  { length: MAX_ROUNDS - MIN_ROUNDS + 1 },
  (_, index) => MIN_ROUNDS + index
);
const MODE_OPTIONS = [
  { id: 'normal', label: 'Normal', hint: 'Rondas a tu ritmo' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · mazo completo' },
];
const XP_BY_GRADE = { facil: 10, dificil: 25, 'otra-vez': 0 };
const GAME_ID = 'quiz-significado';

function disabledReasonFor(deck) {
  const availability = getDeckAvailability(
    { id: GAME_ID, status: 'available', minCards: 4 },
    deck
  );
  if (!availability.playable && availability.reason === 'min-cards') {
    return availabilityMessage(availability);
  }
  return '';
}

function deckRoundsNote(deck, mode, rounds, best) {
  if (!deck) return 'Elige un mazo para empezar.';
  const total = Number(deck.counts?.total ?? deck.total) || 0;
  const bestText = `Mejor marca ${best}`;
  if (mode === 'arcade') return `Mazo completo: ${total} preguntas · 3 vidas · ${bestText}`;
  return `${rounds} de ${total} cartas del mazo · ${bestText}`;
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
  random = Math.random,
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
  const endedRef = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;
  const selectedDeckCards = Array.isArray(selectedDeck?.cards) ? selectedDeck.cards : [];
  const maxDeckRounds = Math.min(MAX_ROUNDS, selectedDeckCards.length);
  const roundOptions = hasDecks ? roundsForDeck(selectedDeckCards.length) : LEGACY_ROUNDS;
  const effectiveRounds = hasDecks
    ? Math.max(MIN_ROUNDS, Math.min(rounds, maxDeckRounds))
    : rounds;
  const bestForDeck = bestScoreFor(best, selectedDeck?.id);
  const deckReason = hasDecks ? disabledReasonFor(selectedDeck) : '';

  useEffect(() => {
    const grade = state.lastGrade;
    if (!grade || grade.seq <= emitted.current) return;
    emitted.current = grade.seq;
    const mapped =
      gameMode === 'arcade' && grade.grade !== 'otra-vez' ? 'facil' : grade.grade;
    onGrade?.(grade.cardId, mapped);
  }, [state.lastGrade, gameMode, onGrade]);

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const resetSession = () => {
    emitted.current = 0;
    exiting.current = false;
    endedRef.current = false;
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
  };

  const endArcade = (finalArcade) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const finished = arcadeFinish(finalArcade);
    setArcade(finished);
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
  };

  const handleStart = () => {
    resetSession();
    let requested = [];
    let questionDeck = deck;
    if (hasDecks && selectedDeck) {
      requested = sessionCardsFor(selectedDeckCards, {
        mode: gameMode,
        rounds: effectiveRounds,
        random,
      });
      questionDeck = selectedDeckCards;
    } else {
      requested = (selectCards ? selectCards(rounds) : deck.slice(0, rounds)) || [];
    }
    const next = reduce(createState(), {
      type: 'start',
      mode: gameMode,
      rounds: gameMode === 'arcade' ? requested.length : hasDecks ? effectiveRounds : rounds,
      cards: requested,
      deck: questionDeck,
      random,
    });
    setState(next);
    if (next.phase === 'playing' && next.questions[0]) speak(next.questions[0].card.front);
  };

  const handleReplay = () => {
    if (gameMode === 'arcade') {
      handleStart();
      return;
    }
    resetSession();
    setState(createState());
  };

  const handleChooseDeck = () => {
    resetSession();
    setState(createState());
  };

  const handleChoose = (optionId) => {
    if (state.phase !== 'playing') return;
    if (gameMode === 'arcade' && arcade.over) return;
    const round = currentQuestion(state);
    const option = round ? round.options.find((entry) => entry.card.id === optionId) : null;
    if (!option) return;
    const wasCorrect = Boolean(option.correct);
    let next = reduce(state, { type: 'choose', optionId });
    if (next === state) return;

    let nextArcade = arcade;
    if (gameMode === 'arcade') {
      nextArcade = wasCorrect ? arcadeHit(arcade) : arcadeMiss(arcade);
      if (!wasCorrect && nextArcade.over) next = reduce(next, { type: 'fail' });
      setArcade(nextArcade);
    }

    setState(next);
    speak(option.card.back);
    if (gameMode === 'arcade' && nextArcade.over) endArcade(nextArcade);
  };

  const handleNext = () => {
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    setState(next);
    if (next.phase === 'playing' && next.questions[next.roundIndex]) {
      speak(next.questions[next.roundIndex].card.front);
    }
    if (gameMode === 'arcade' && next.phase === 'complete') {
      endArcade(arcadeFinish(arcade));
    }
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const current = unresolvedCurrent(state);
    if (current && current.seq > emitted.current) {
      emitted.current = current.seq;
      onGrade?.(current.cardId, 'otra-vez');
    }
    backToTopic();
  };

  if (hasDecks ? decks.length === 0 : deck.length === 0) {
    return (
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Elige el significado</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>
            Volver al tema
          </button>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    if (hasDecks) {
      const startDisabled =
        !selectedDeck || Boolean(deckReason) || selectedDeckCards.length < MIN_ROUNDS;
      return (
        <GameSetup
          pageClassName="quiz-page"
          title="Elige el significado"
          eyebrow="Configura tu partida"
          lead="Lee el término y elige su significado entre cuatro opciones. Cada mazo es un bloque de 10 cartas."
          note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · las opciones salen siempre del mazo elegido.`}
          start={
            <button
              className="btn-neon"
              type="button"
              onClick={handleStart}
              disabled={startDisabled}
            >
              Empezar
            </button>
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
          <GameModeSwitch mode={gameMode} onChange={setGameMode} options={MODE_OPTIONS} />
          <DeckPicker
            decks={decks}
            selectedDeckId={selectedDeck?.id}
            onSelect={(id) => setSelectedDeckId(id)}
            best={best}
            disabledReason={(entry) => disabledReasonFor(entry)}
            gameId={GAME_ID}
            label="Elige tu mazo"
          />
          {gameMode === 'normal' ? (
            <div className="quiz-setup">
              <label htmlFor="quiz-rounds">Rondas</label>
              <select
                id="quiz-rounds"
                value={effectiveRounds}
                onChange={(event) => setRounds(Number(event.target.value))}
              >
                {roundOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <p className="quiz-note" role="status">
            {deckRoundsNote(selectedDeck, gameMode, effectiveRounds, bestForDeck)}
          </p>
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
          <select
            id="quiz-rounds"
            value={rounds}
            onChange={(event) => setRounds(Number(event.target.value))}
          >
            {LEGACY_ROUNDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </GameSetup>
    );
  }

  if (gameMode === 'arcade' && arcadeEnded) {
    const resultBest = Number(arcadeResult?.best ?? Math.max(bestForDeck, arcade.score));
    const isRecord = Boolean(arcadeResult?.isRecord ?? arcade.score > bestForDeck);
    return (
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <ArcadeSummary
            score={arcade.score}
            best={resultBest}
            isRecord={isRecord}
            lives={arcade.lives}
            correct={arcade.correct}
            wrong={arcade.wrong}
            completed={arcade.completed}
            deckLabel={
              hasDecks && selectedDeck
                ? `Mazo ${selectedDeck.number} (${selectedDeck.label})`
                : undefined
            }
            actions={
              <>
                <button className="btn-neon" type="button" onClick={handleReplay} autoFocus>
                  Repetir
                </button>
                <button className="btn-neon" type="button" onClick={handleChooseDeck}>
                  Elegir mazo
                </button>
                <button className="btn-neon" type="button" onClick={backToTopic}>
                  Volver al tema
                </button>
                <SoundToggle />
              </>
            }
          />
        </div>
      </main>
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
              <button className="btn-neon" type="button" onClick={handleReplay}>
                Elegir rondas
              </button>
              <button className="btn-neon" type="button" onClick={backToTopic}>
                Volver al tema
              </button>
              <SoundToggle />
            </div>
          </div>
        </main>
      );
    }

    const stats = summarize(state);
    const gained = state.results.reduce(
      (sum, result) => sum + (XP_BY_GRADE[result.grade] || 0),
      0
    );
    return (
      <main className="sepect-bg quiz-page" style={PAGE}>
        <div className="game-stage">
          <section className="result-panel" aria-labelledby="quiz-summary-title">
            <p className="result-panel__eyebrow">Sesión completada</p>
            <h1 id="quiz-summary-title" className="neon game-app-title">
              Sesión completada
            </h1>
            <p className="result-panel__live" role="status">
              {stats.firstTry} de {stats.total} aciertos al primer intento · {stats.fails} fallos ·
              +{gained} XP
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Primer intento</dt>
                <dd>
                  {stats.firstTry}/{stats.total}
                </dd>
              </div>
              <div className="result-panel__stat">
                <dt>Fallos</dt>
                <dd>{stats.fails}</dd>
              </div>
              <div className="result-panel__stat">
                <dt>XP</dt>
                <dd>+{gained}</dd>
              </div>
              {hasDecks && selectedDeck ? (
                <div className="result-panel__stat result-panel__stat--wide">
                  <dt>Mazo</dt>
                  <dd>
                    {selectedDeck.number} · {selectedDeck.label}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="result-panel__actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>
                Jugar de nuevo
              </button>
              {hasDecks ? (
                <button className="btn-neon" type="button" onClick={handleChooseDeck}>
                  Elegir mazo
                </button>
              ) : null}
              <button className="btn-neon" type="button" onClick={backToTopic}>
                Volver al tema
              </button>
              <SoundToggle />
            </div>
          </section>
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
          <button className="btn-neon" type="button" onClick={handleExit}>
            Volver al tema
          </button>
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
        <header className="game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {hasDecks ? `Mazo ${selectedDeck.number}` : 'Quiz'} ·{' '}
              {gameMode === 'arcade' ? 'Arcade' : 'Normal'}
            </p>
            <p className="game-session-progress__text">
              Pregunta {round.index + 1} de {state.total}
              {gameMode !== 'arcade' ? ` · ${round.attempts} fallos` : ''}
            </p>
          </div>
          <div className="game-session-header__actions">
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>
              Salir
            </button>
          </div>
        </header>

        {gameMode === 'arcade' ? (
          <ArcadeHud
            lives={arcade.lives}
            score={arcade.score}
            streak={arcade.streak}
            best={bestForDeck}
          />
        ) : null}

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

        <p className="quiz-status" role="status" aria-live="polite">
          {announcement}
        </p>

        {answered && (
          <div className="card-neon quiz-feedback">
            <p style={{ margin: 0 }}>
              {round.won ? '¡Acertaste!' : 'La respuesta correcta es:'}{' '}
              <strong>{round.card.back}</strong>
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
