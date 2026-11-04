import React, { useEffect, useMemo, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import ArcadeSummary from '../../components/ArcadeSummary.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameModeSwitch from '../../components/GameModeSwitch.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { DECK_MASTERY_LABELS } from '../../core/repetition/decks.js';
import { availabilityMessage, getDeckAvailability } from '../availability.js';
import { bestScoreFor } from '../best.js';
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

const PAGE = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  padding: '16px clamp(16px, 4vw, 32px)',
};
const GAME_ID = 'intruso';
const ROUND_OPTIONS = Array.from(
  { length: MAX_ROUNDS - MIN_ROUNDS + 1 },
  (_, index) => MIN_ROUNDS + index
);
const MODE_OPTIONS = [
  { id: 'normal', label: 'Normal', hint: 'Rondas a tu ritmo' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · mazo completo' },
];
const XP_BY_GRADE = { facil: 10, 'otra-vez': 0 };

function disabledReasonFor(deck) {
  const availability = getDeckAvailability(
    { id: GAME_ID, status: 'available', minCards: MIN_ROUNDS },
    deck
  );
  if (!availability.playable && availability.reason === 'min-cards') {
    return availabilityMessage(availability);
  }
  return '';
}

function promptFor(anchor) {
  return `¿Cuál no pertenece al tema «${anchor?.title || 'actual'}»?`;
}

function setupNoteFor(deck, mode, rounds, best, others) {
  if (!deck) return 'Elige un mazo para empezar.';
  const status = DECK_MASTERY_LABELS[deck.mastery] || DECK_MASTERY_LABELS.vacia;
  const total = Number(deck.total ?? deck.cards?.length) || 0;
  const topics = `${others} ${others === 1 ? 'tema' : 'temas'} como intruso`;
  if (mode === 'arcade') {
    return `${status} · mazo completo: ${total} rondas · 3 vidas · ${topics} · Mejor marca ${best}`;
  }
  return `${status} · ${rounds} de ${total} rondas · ${topics} · Mejor marca ${best}`;
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
  random = Math.random,
} = {}) {
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const [selectedDeckId, setSelectedDeckId] = useState(() =>
    hasDecks ? decks[0].id : null
  );
  const [gameMode, setGameMode] = useState('normal');
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeEnded, setArcadeEnded] = useState(false);
  const [arcadeResult, setArcadeResult] = useState(null);
  const [state, setState] = useState(() => createState());
  const emitted = useRef(new Set());
  const exiting = useRef(false);
  const endedRef = useRef(false);
  const summaryHeadingRef = useRef(null);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;
  const selectedDeckCards = Array.isArray(selectedDeck?.cards) ? selectedDeck.cards : [];
  const maxDeckRounds = Math.min(MAX_ROUNDS, selectedDeckCards.length);
  const roundOptions = hasDecks
    ? Array.from(
        { length: Math.max(0, maxDeckRounds - MIN_ROUNDS + 1) },
        (_, index) => MIN_ROUNDS + index
      )
    : ROUND_OPTIONS;
  const effectiveRounds = hasDecks
    ? Math.max(MIN_ROUNDS, Math.min(rounds, maxDeckRounds || MIN_ROUNDS))
    : rounds;
  const bestForDeck = bestScoreFor(best, selectedDeck?.id);
  const deckReason = hasDecks && selectedDeck ? disabledReasonFor(selectedDeck) : '';

  const anchorFromGroups = useMemo(() => {
    const sources = [groups, allGroups];
    for (const source of sources) {
      if (!Array.isArray(source)) continue;
      const found = source.find((group) => group && group.id === anchorTopicId);
      if (found) return found;
    }
    return null;
  }, [groups, allGroups, anchorTopicId]);
  const anchorCards =
    hasDecks && selectedDeck ? selectedDeckCards : anchorFromGroups?.cards || deck;
  const anchor = useMemo(() => {
    if (anchorFromGroups) {
      return { ...anchorFromGroups, cards: anchorCards };
    }
    if (anchorTopicId) {
      return { id: anchorTopicId, title: anchorTopicId, cards: anchorCards };
    }
    return null;
  }, [anchorFromGroups, anchorTopicId, anchorCards]);
  const othersSource =
    Array.isArray(allGroups) && allGroups.length > 0 ? allGroups : groups;
  const others = useMemo(
    () =>
      (Array.isArray(othersSource) ? othersSource : []).filter(
        (group) =>
          group &&
          group.id !== anchorTopicId &&
          Array.isArray(group.cards) &&
          group.cards.length > 0
      ),
    [othersSource, anchorTopicId]
  );
  const canPlay =
    !!anchor &&
    others.length > 0 &&
    (hasDecks || (Array.isArray(anchor.cards) && anchor.cards.length >= MIN_ROUNDS));

  useEffect(() => () => stopSpeech(), []);

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const gradeCard = (cardId, grade, topicId) => {
    if (cardId === undefined || cardId === null) return;
    const key = `${topicId ?? ''}:${cardId}`;
    if (emitted.current.has(key)) return;
    emitted.current.add(key);
    const mapped =
      gameMode === 'arcade' && grade !== 'otra-vez' ? 'facil' : grade;
    onGrade?.(cardId, mapped, { topicId });
  };

  useEffect(() => {
    const grade = state.lastGrade;
    if (!grade) return;
    gradeCard(grade.cardId, grade.grade, grade.topicId);
  }, [state.lastGrade, gameMode, onGrade]);

  const resetSession = () => {
    emitted.current = new Set();
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
    const result = onArcadeEnd?.({
      score: finished.score,
      correct: finished.correct,
      wrong: finished.wrong,
      lives: finished.lives,
      completed: finished.completed,
      deckId: selectedDeck?.id,
    });
    setArcadeResult(result || { best: finished.score, isRecord: false });
  };

  const handleStart = () => {
    resetSession();
    if (hasDecks && selectedDeck) {
      if (deckReason || selectedDeckCards.length < MIN_ROUNDS || !canPlay) return;
      const anchorId = anchorTopicId || selectedDeck.id;
      const startGroups = [
        {
          id: anchorId,
          title: anchor?.title || selectedDeck.label,
          cards: selectedDeckCards,
        },
        ...others,
      ];
      const requested =
        gameMode === 'arcade' ? selectedDeckCards.length : effectiveRounds;
      const next = reduce(createState(), {
        type: 'start',
        groups: startGroups,
        anchorTopicId: anchorId,
        rounds: requested,
        random,
      });
      setState(next);
      if (next.phase === 'playing') speak(promptFor(anchor));
      return;
    }
    const next = reduce(createState(), {
      type: 'start',
      groups,
      anchorTopicId,
      rounds,
      random,
    });
    setState(next);
    if (next.phase === 'playing') speak(promptFor(anchor));
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

  const handleChoose = (optionKey) => {
    if (state.phase !== 'playing') return;
    if (gameMode === 'arcade' && (arcade.over || arcadeEnded)) return;
    const round = currentRound(state);
    const option = round
      ? round.options.find((entry) => entry.key === optionKey)
      : null;
    if (!option) return;
    const next = reduce(state, { type: 'choose', optionKey });
    if (next === state) return;
    setState(next);
    speak(option.card.back);
    if (gameMode !== 'arcade') return;
    if (option.correct) {
      setArcade(arcadeHit(arcade));
      return;
    }
    const nextArcade = arcadeMiss(arcade);
    setArcade(nextArcade);
    if (nextArcade.over) endArcade(nextArcade);
  };

  const handleNext = () => {
    if (gameMode === 'arcade' && arcadeEnded) return;
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    setState(next);
    if (gameMode === 'arcade' && next.phase === 'complete') {
      endArcade(arcadeFinish(arcade));
    }
    if (next.phase === 'playing') speak(promptFor(anchor));
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    stopSpeech();
    for (const entry of pendingCurrent(state)) {
      gradeCard(entry.cardId, entry.grade, entry.topicId);
    }
    backToTopic();
  };

  if (!canPlay) {
    return (
      <main className="sepect-bg intruso-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">El intruso</h1>
          <p>Este juego necesita al menos dos temas con 3 cartas cada uno.</p>
          <div className="intruso-actions">
            <button className="btn-neon" type="button" onClick={backToTopic}>
              Volver al tema
            </button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    if (hasDecks) {
      const startDisabled =
        !selectedDeck ||
        Boolean(deckReason) ||
        selectedDeckCards.length < MIN_ROUNDS;
      return (
        <GameSetup
          pageClassName="intruso-page"
          title="El intruso"
          eyebrow="Configura tu partida"
          lead="Tres significados son del tema actual; uno es de otro tema. Toca el que no pertenece. En arcade cada fallo resta una vida."
          note={
            <>
              Tema ancla: <strong>{anchor?.title || anchorTopicId}</strong> · {others.length}{' '}
              tema{others.length === 1 ? '' : 's'} disponible
              {others.length === 1 ? '' : 's'} como intruso.
              {selectedDeck ? <> · Mazo {selectedDeck.number} ({selectedDeck.label})</> : null}
            </>
          }
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
              <button className="btn-neon game-setup__exit" type="button" onClick={handleExit}>
                Salir
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
            <div className="intruso-setup">
              <label htmlFor="intruso-rounds">Rondas</label>
              <select
                id="intruso-rounds"
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
          <p className="intruso-note" role="status">
            {setupNoteFor(selectedDeck, gameMode, effectiveRounds, bestForDeck, others.length)}
          </p>
        </GameSetup>
      );
    }

    return (
      <GameSetup
        pageClassName="intruso-page"
        title="El intruso"
        lead="Tres significados son del tema actual; uno es de otro tema. Toca el que no pertenece. Tienes un solo intento por ronda."
        note={
          <>
            Tema ancla: <strong>{anchor?.title || anchorTopicId}</strong> · {others.length} tema
            {others.length === 1 ? '' : 's'} disponible{others.length === 1 ? '' : 's'} como intruso.
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
            <button className="btn-neon game-setup__exit" type="button" onClick={handleExit}>
              Salir
            </button>
          </>
        }
      >
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
      </GameSetup>
    );
  }

  if (gameMode === 'arcade' && arcadeEnded) {
    const resultBest = Number(arcadeResult?.best ?? Math.max(bestForDeck, arcade.score));
    const isRecord = Boolean(arcadeResult?.isRecord ?? arcade.score > bestForDeck);
    return (
      <main className="sepect-bg intruso-page" style={PAGE}>
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
              selectedDeck ? `Mazo ${selectedDeck.number} (${selectedDeck.label})` : undefined
            }
            actions={
              <>
                <button className="btn-neon" type="button" onClick={handleStart} autoFocus>
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
        <main className="sepect-bg intruso-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Sin rondas disponibles</h1>
            <p>No hay suficientes significados únicos para armar el set. Agrega cartas o temas.</p>
            <div className="intruso-actions">
              <button className="btn-neon" type="button" onClick={hasDecks ? handleChooseDeck : handleReplay}>
                {hasDecks ? 'Elegir mazo' : 'Elegir rondas'}
              </button>
              <button className="btn-neon" type="button" onClick={handleExit}>
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
      <main className="sepect-bg intruso-page" style={PAGE}>
        <div className="game-stage">
          <section className="result-panel" aria-labelledby="intruso-summary-title">
            <p className="result-panel__eyebrow">Sesión completada</p>
            <h1
              id="intruso-summary-title"
              className="neon game-app-title"
              ref={summaryHeadingRef}
              tabIndex={-1}
            >
              Sesión completada
            </h1>
            <p className="result-panel__live" role="status">
              {stats.correct} de {stats.total} aciertos · {stats.fails} fallos · +{gained} XP
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Aciertos</dt>
                <dd>
                  {stats.correct}/{stats.total}
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
        <header className="intruso-header game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {hasDecks && selectedDeck ? `Mazo ${selectedDeck.number}` : 'Intruso'} ·{' '}
              {gameMode === 'arcade' ? 'Arcade' : 'Normal'}
            </p>
            <p style={{ margin: 0 }}>
              Ronda {round.index + 1} de {round.total}
            </p>
          </div>
          <div className="intruso-actions game-session-header__actions" style={{ marginTop: 0 }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
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
