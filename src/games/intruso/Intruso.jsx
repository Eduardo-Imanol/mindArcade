import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  currentRound,
  pendingCurrent,
  reduce,
  summarize,
} from './intruso.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const ROUND_OPTIONS = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, index) => MIN_ROUNDS + index);
const XP_BY_GRADE = { facil: 10, 'otra-vez': 0 };
const GAME_ID = 'intruso';

function disabledReasonFor(deck) {
  const availability = getDeckAvailability({ id: GAME_ID, minCards: 3 }, deck);
  if (!availability.playable && availability.reason === 'min-cards') return availability.message;
  return '';
}

function promptFor(anchor) {
  return `¿Cuál no pertenece al tema «${anchor?.title || 'actual'}»?`;
}

export default function Intruso({
  deck = [],
  decks,
  best,
  groups = [],
  allGroups = [],
  anchorTopicId,
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

  const selectedDeck = hasDecks ? decks.find((entry) => entry.id === selectedDeckId) || decks[0] : null;

  const anchorFromGroups = useMemo(
    () => (Array.isArray(groups) ? groups.find((group) => group.id === anchorTopicId) : null),
    [groups, anchorTopicId]
  );
  const anchorCards = hasDecks && selectedDeck ? selectedDeck.cards : deck;
  const anchor = useMemo(
    () => {
      if (anchorFromGroups) {
        return { ...anchorFromGroups, cards: anchorCards };
      }
      if (anchorTopicId) {
        return { id: anchorTopicId, title: anchorTopicId, cards: anchorCards };
      }
      return null;
    },
    [anchorFromGroups, anchorTopicId, anchorCards]
  );
  const othersSource = Array.isArray(allGroups) && allGroups.length > 0 ? allGroups : groups;
  const others = useMemo(
    () =>
      (Array.isArray(othersSource) ? othersSource : []).filter(
        (group) => group.id !== anchorTopicId && Array.isArray(group.cards) && group.cards.length > 0
      ),
    [othersSource, anchorTopicId]
  );
  const canPlay = !!anchor && Array.isArray(anchor.cards) && anchor.cards.length >= MIN_ROUNDS && others.length > 0;

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, gameMode === 'arcade' ? (grade.grade === 'otra-vez' ? 'otra-vez' : 'facil') : grade.grade, { topicId: grade.topicId });
    }
  }, [state, onGrade, gameMode]);

  const handleStart = () => {
    emitted.current = 0;
    exiting.current = false;
    setArcadeEnded(false);
    setArcadeResult(null);
    const startGroups = hasDecks && selectedDeck
      ? [{ id: anchorTopicId || selectedDeck.id, title: anchor?.title || anchorTopicId || '', cards: selectedDeck.cards }, ...others]
      : groups;
    const next = reduce(createState(), {
      type: 'start',
      groups: startGroups,
      anchorTopicId: anchorTopicId || (hasDecks && selectedDeck ? selectedDeck.id : undefined),
      rounds: gameMode === 'arcade' ? Math.min(rounds, selectedDeck?.cards?.length || rounds) : rounds,
      random: Math.random,
    });
    if (gameMode === 'arcade') {
      setArcade(createArcade());
    }
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
    if (gameMode === 'arcade' && arcade.over) return;
    const round = currentRound(state);
    const option = round ? round.options.find((entry) => entry.key === optionKey) : null;
    if (!option) return;
    const next = reduce(state, { type: 'choose', optionKey });
    if (next === state) return;
    if (gameMode === 'arcade') {
      if (option.correct) {
        setArcade((current) => arcadeHit(current));
      } else {
        const miss = arcadeMiss(arcade);
        setArcade(miss);
        if (miss.over) {
          // will finish after state updates
        }
      }
    }
    setState(next);
    speak(option.card.back);
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

  const handleNext = () => {
    if (gameMode === 'arcade') {
      if (arcade.over && !arcadeEnded) {
        endArcade(arcade);
      }
    }
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    if (gameMode === 'arcade' && next.phase === 'complete' && !arcade.over && !arcadeEnded) {
      endArcade(arcade);
    }
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
          <h1 className="neon game-app-title">El intruso</h1>
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
      <GameSetup
        pageClassName="intruso-page"
        title="El intruso"
        lead="Tres significados son del tema actual; uno es de otro tema. Toca el que no pertenece. Tienes un solo intento por ronda."
        note={
          <>
            Tema ancla: <strong>{anchor?.title || anchorTopicId}</strong> · {others.length} tema
            {others.length === 1 ? '' : 's'} disponible{others.length === 1 ? '' : 's'} como intruso.
            {hasDecks && selectedDeck ? <> · Mazo {selectedDeck.number} ({selectedDeck.label})</> : null}
          </>
        }
        start={
          <button className="btn-neon" type="button" onClick={handleStart}>
            Empezar
          </button>
        }
        actions={
          <>
            <SoundToggle />
            <button className="btn-neon game-setup__exit" type="button" onClick={onBackToTopic || onExit}>
              Salir
            </button>
          </>
        }
      >
        {hasDecks && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>Modo</span>
              <button type="button" className={`btn-neon${gameMode === 'normal' ? ' is-active' : ''}`} onClick={() => setGameMode('normal')}>Normal</button>
              <button type="button" className={`btn-neon${gameMode === 'arcade' ? ' is-active' : ''}`} onClick={() => setGameMode('arcade')}>Arcade</button>
            </div>
            {gameMode === 'arcade' && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <ArcadeHud arcade={arcade} best={best && selectedDeck ? best[selectedDeck.id] : best} compact />
              </div>
            )}
            <DeckPicker
              decks={decks}
              selectedDeckId={selectedDeck?.id}
              onSelect={(id) => setSelectedDeckId(id)}
              best={best}
              disabledReason={(deckEntry) => disabledReasonFor(deckEntry)}
              gameId={GAME_ID}
              label="Elige tu mazo"
            />
          </>
        )}
        {gameMode === 'normal' && (
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
          </div>
        )}
      </GameSetup>
    );
  }

  if (state.phase === 'complete') {
    if (gameMode === 'arcade' && arcadeEnded && arcadeResult) {
      return (
        <main className="sepect-bg intruso-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Arcade</h1>
            <p role="status">
              Puntuación {arcadeResult.best ?? arcade.score} {arcadeResult.isRecord ? '· ¡Nuevo récord!' : ''}<br />
              Vidas restantes {arcade.lives} · Aciertos {arcade.correct} · Fallos {arcade.wrong}
              {selectedDeck ? <> · Mazo {selectedDeck.number} ({selectedDeck.label})</> : null}
            </p>
            <div className="intruso-actions">
              <button className="btn-neon" type="button" onClick={() => { setState(createState()); setArcadeEnded(false); setArcadeResult(null); setArcade(createArcade()); }}>Repetir</button>
              <button className="btn-neon" type="button" onClick={() => { setState(createState()); }}>Elegir mazo</button>
              <button className="btn-neon" type="button" onClick={onBackToTopic || onExit}>Volver al tema</button>
              <SoundToggle />
            </div>
          </div>
        </main>
      );
    }

    if (state.total === 0) {
      return (
        <main className="sepect-bg intruso-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Sin rondas disponibles</h1>
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
          <h1 className="neon game-app-title">Sesión completada</h1>
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
          <h1 className="neon game-app-title">El intruso</h1>
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
          <p style={{ margin: 0 }}>Ronda {round.index + 1} de {round.total}{hasDecks && selectedDeck ? ` · Mazo ${selectedDeck.number}` : ''}</p>
          <div className="intruso-actions" style={{ marginTop: 0 }}>
            {gameMode === 'arcade' && <ArcadeHud arcade={arcade} best={best && selectedDeck ? best[selectedDeck.id] : best} compact />}
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
        {gameMode === 'arcade' && <p className="intruso-status" aria-live="polite">Vidas: {arcade.lives} · Puntuación: {arcade.score}</p>}

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
