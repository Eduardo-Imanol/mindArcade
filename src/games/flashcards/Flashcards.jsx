import React, { useEffect, useReducer, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import ArcadeSummary from '../../components/ArcadeSummary.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameModeSwitch from '../../components/GameModeSwitch.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { DECK_MASTERY_LABELS } from '../../core/repetition/decks.js';
import { availabilityMessage, getDeckAvailability } from '../availability.js';
import { bestScoreFor } from '../best.js';
import { createState, reduce, sessionCardsFor } from './flashcards.logic.js';

const GRADES = [
  { id: 'otra-vez', label: 'Otra vez' },
  { id: 'dificil', label: 'Difícil' },
  { id: 'facil', label: 'Fácil' },
];

const MODE_OPTIONS = [
  { id: 'normal', label: 'Normal', hint: 'Pendientes o repaso' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · mazo completo' },
];

const PAGE = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  padding: '16px clamp(16px, 4vw, 32px)',
};
const GAME_ID = 'flashcards';

function disabledReasonFor(deck) {
  const availability = getDeckAvailability(
    { id: GAME_ID, status: 'available', minCards: 1 },
    deck
  );
  if (!availability.playable && availability.reason === 'min-cards') {
    return availabilityMessage(availability);
  }
  return '';
}

function startLabelFor(deck, mode) {
  if (!deck) return 'Elegir mazo';
  if (mode === 'arcade') return 'Jugar arcade';
  if (deck.pending > 0) return deck.studied > 0 ? 'Reanudar mazo' : 'Empezar mazo';
  return 'Repasar mazo';
}

function setupHintFor(deck, mode, best) {
  if (!deck) return 'Elige un mazo para empezar.';
  const status = DECK_MASTERY_LABELS[deck.mastery] || DECK_MASTERY_LABELS.empty;
  const total = Number(deck.counts?.total ?? deck.total) || 0;
  const learned = Number(deck.counts?.learned) || 0;
  const due = Number(deck.counts?.due) || 0;
  const pending = Number(deck.pending) || 0;
  const session =
    mode === 'arcade'
      ? `${total} ${total === 1 ? 'carta' : 'cartas'} · 3 vidas`
      : pending > 0
        ? `${pending} ${pending === 1 ? 'carta pendiente' : 'cartas pendientes'}`
        : `repaso completo de ${total} ${total === 1 ? 'carta' : 'cartas'}`;
  return `${status} · ${learned}/${total} aprendidas · ${due} vencidas · ${session} · Mejor marca ${best}`;
}

export default function Flashcards({
  deck = [],
  decks,
  best,
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
  const [state, dispatch] = useReducer(
    (current, action) => reduce(current, action, hasDecks ? [] : deck),
    undefined,
    () => (hasDecks ? createState([], { phase: 'setup' }) : createState(deck))
  );
  const emittedRef = useRef(new Set());
  const exitingRef = useRef(false);
  const endedRef = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;
  const bestForDeck = bestScoreFor(best, selectedDeck?.id);
  const disabledReason = disabledReasonFor(selectedDeck);

  useEffect(() => {
    if (state.phase === 'setup' || state.complete || arcade.over) return undefined;
    const onKey = (event) => {
      const tag = event.target && event.target.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
        event.preventDefault();
        dispatch({ type: 'flip' });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.complete, state.phase, arcade.over]);

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const resetSession = () => {
    emittedRef.current = new Set();
    exitingRef.current = false;
    endedRef.current = false;
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
  };

  const startDeck = (deckEntry, { review = false } = {}) => {
    if (!deckEntry) return;
    const cards = sessionCardsFor(deckEntry, { mode: gameMode, review, random });
    if (cards.length === 0) return;
    resetSession();
    setSelectedDeckId(deckEntry.id);
    dispatch({
      type: 'start',
      deck: cards,
      phase: 'playing',
      mode: gameMode === 'arcade' ? 'arcade' : review ? 'review' : 'resume',
    });
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

  useEffect(() => {
    if (gameMode !== 'arcade' || !hasDecks) return;
    if (state.phase === 'setup' || endedRef.current) return;
    if (arcade.over) {
      endArcade(arcade);
      return;
    }
    if (state.complete) endArcade(arcadeFinish(arcade));
  }, [arcade, gameMode, hasDecks, state.complete, state.phase]);

  const handleReplay = () => {
    if (hasDecks && selectedDeck) {
      startDeck(selectedDeck, { review: true });
      return;
    }
    resetSession();
    dispatch({ type: 'reset' });
  };

  const handleChooseDeck = () => {
    resetSession();
    dispatch({ type: 'start', deck: [], phase: 'setup' });
  };

  const handleExit = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    backToTopic();
  };

  const activeDeck = hasDecks ? state.sessionDeck : deck;
  const card = activeDeck[state.index];
  const modeLabel = gameMode === 'arcade' ? 'Arcade' : 'Normal';

  const handleGrade = (grade) => {
    if (!card) return;
    if (gameMode === 'arcade' && arcade.over) return;
    const key = String(card.id ?? state.index);
    if (emittedRef.current.has(key)) return;
    emittedRef.current.add(key);

    let nextArcade = arcade;
    if (gameMode === 'arcade') {
      nextArcade = grade === 'otra-vez' ? arcadeMiss(arcade) : arcadeHit(arcade);
      setArcade(nextArcade);
    }

    const gradeToEmit =
      gameMode === 'arcade' ? (grade === 'otra-vez' ? 'otra-vez' : 'facil') : grade;
    const result = onGrade?.(card.id, gradeToEmit);
    dispatch({
      type: 'grade',
      grade: gradeToEmit,
      cardId: card.id,
      gained: result?.gained,
    });
  };

  if (hasDecks && state.phase === 'setup') {
    const reason = disabledReason;
    const startDisabled = !selectedDeck || Boolean(reason);
    return (
      <GameSetup
        pageClassName="flashcards-page"
        title="Flashcards"
        eyebrow="Elige tu mazo"
        lead="Estudia un bloque de 10 cartas. Tu progreso viaja con el SRS y se comparte con todos los juegos."
        note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · el mazo se juega completo en arcade.`}
        start={
          <button
            className="btn-neon"
            type="button"
            onClick={() => startDeck(selectedDeck)}
            disabled={startDisabled}
          >
            {startLabelFor(selectedDeck, gameMode)}
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
        <p className="flashcards-setup__hint" role="status">
          {setupHintFor(selectedDeck, gameMode, bestForDeck)}
        </p>
      </GameSetup>
    );
  }

  if (!hasDecks && activeDeck.length === 0) {
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Flashcards</h1>
          <p>Este tema no tiene cartas todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>
            Volver al tema
          </button>
        </div>
      </main>
    );
  }

  if (hasDecks && (!selectedDeck || activeDeck.length === 0)) {
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Flashcards</h1>
          <p>Este tema no tiene cartas todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>
            Volver al tema
          </button>
        </div>
      </main>
    );
  }

  if (gameMode === 'arcade' && arcadeEnded) {
    const resultBest = Number(arcadeResult?.best ?? Math.max(bestForDeck, arcade.score));
    const isRecord = Boolean(arcadeResult?.isRecord ?? arcade.score > bestForDeck);
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <ArcadeSummary
            score={arcade.score}
            best={resultBest}
            isRecord={isRecord}
            lives={arcade.lives}
            correct={arcade.correct}
            wrong={arcade.wrong}
            completed={arcade.completed}
            deckLabel={hasDecks ? `Mazo ${selectedDeck.number} (${selectedDeck.label})` : undefined}
            actions={
              <>
                <button className="btn-neon" type="button" onClick={handleReplay} autoFocus>
                  Repetir
                </button>
                <button className="btn-neon" type="button" onClick={handleChooseDeck}>
                  Elegir mazo
                </button>
                <button className="btn-neon" type="button" onClick={handleExit}>
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

  if (state.complete && gameMode !== 'arcade') {
    const nextDeck = hasDecks
      ? decks.find((entry) => entry.number === selectedDeck.number + 1)
      : null;
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <section className="result-panel" aria-labelledby="flashcards-summary-title">
            <p className="result-panel__eyebrow">Sesión completada</p>
            <h1 id="flashcards-summary-title" className="neon game-app-title">
              {hasDecks ? `Mazo ${selectedDeck.number} completado` : 'Sesión completada'}
            </h1>
            <p className="result-panel__live" role="status">
              {hasDecks ? `Mazo ${selectedDeck.number} (${selectedDeck.label}) · ` : ''}
              {state.correct} correctas · {state.wrong} fallos · +{state.gained} XP
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Aciertos</dt>
                <dd>{state.correct}</dd>
              </div>
              <div className="result-panel__stat">
                <dt>Fallos</dt>
                <dd>{state.wrong}</dd>
              </div>
              <div className="result-panel__stat">
                <dt>XP</dt>
                <dd>+{state.gained}</dd>
              </div>
              {hasDecks ? (
                <div className="result-panel__stat result-panel__stat--wide">
                  <dt>Mazo</dt>
                  <dd>
                    {selectedDeck.number} · {selectedDeck.label}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="result-panel__actions">
              {hasDecks && nextDeck ? (
                <button className="btn-neon" type="button" onClick={() => startDeck(nextDeck)}>
                  Siguiente mazo
                </button>
              ) : null}
              <button className="btn-neon" type="button" onClick={handleReplay}>
                {hasDecks ? 'Repetir mazo' : 'Repasar de nuevo'}
              </button>
              {hasDecks ? (
                <button className="btn-neon" type="button" onClick={handleChooseDeck}>
                  Elegir mazo
                </button>
              ) : null}
              <button className="btn-neon" type="button" onClick={handleExit}>
                Volver al tema
              </button>
              <SoundToggle />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="sepect-bg flashcards-page" style={PAGE}>
      <div className="game-stage flashcards-session">
        <header className="game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {hasDecks ? `Mazo ${selectedDeck.number}` : 'Flashcards'} · {modeLabel}
            </p>
            <h1 className="neon game-app-title">Flashcards</h1>
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

        <div className="game-session-progress">
          <ProgressBar
            value={(state.index + 1) / activeDeck.length}
            label={`Progreso del mazo: carta ${state.index + 1} de ${activeDeck.length}`}
          />
          <p className="game-session-progress__text">
            Carta {state.index + 1} de {activeDeck.length}
          </p>
        </div>

        <button
          type="button"
          className="card-neon flashcards-card"
          onClick={() => dispatch({ type: 'flip' })}
          aria-label={`Carta ${state.index + 1} de ${activeDeck.length}: ${card.front}. ${
            state.flipped ? 'Mostrando significado' : 'Pulsa para voltear'
          }`}
        >
          <CardImage card={card} size={128} fill />
          <span className="flashcards-card__front">{card.front}</span>
          {state.flipped ? (
            <span className="flashcards-card__back" aria-live="polite">
              {card.back}
            </span>
          ) : (
            <span className="flashcards-card__hint">Pulsa para ver el significado</span>
          )}
        </button>

        <div className="flashcards-tools">
          {isSupported() ? (
            <button
              className="btn-neon"
              type="button"
              aria-label="Escuchar la carta"
              onClick={() => speak(state.flipped ? `${card.front}. ${card.back}` : card.front)}
            >
              🔊 Escuchar
            </button>
          ) : null}
        </div>

        <p className="flashcards-help">
          Toca la carta o pulsa Espacio/Enter para voltear · dificultad: {card.difficulty}
        </p>

        {state.flipped ? (
          <div className="flashcards-grades" role="group" aria-label="Califica la carta">
            {GRADES.map((grade) => (
              <button
                key={grade.id}
                className="btn-neon"
                type="button"
                onClick={() => handleGrade(grade.id)}
              >
                {grade.label}
              </button>
            ))}
          </div>
        ) : null}

        {gameMode !== 'arcade' ? (
          <nav className="flashcards-nav" aria-label="Navegación de cartas">
            <button
              className="btn-neon"
              type="button"
              onClick={() => dispatch({ type: 'prev' })}
              disabled={state.index === 0}
            >
              Anterior
            </button>
            <button
              className="btn-neon"
              type="button"
              onClick={() => dispatch({ type: 'next' })}
              disabled={state.index >= activeDeck.length - 1}
            >
              Siguiente
            </button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
