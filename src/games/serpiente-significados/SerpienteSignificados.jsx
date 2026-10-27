import React, { useEffect, useMemo, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { createEngine } from '../../core/engine/engine.js';
import { arcadeHit, createArcade } from '../../core/engine/arcade.js';
import { getDeckAvailability } from '../availability.js';

function disabledReasonForSerpiente(deck) {
  const availability = getDeckAvailability({ id: 'serpiente-significados', minCards: 6 }, deck);
  if (!availability.playable && availability.reason === 'min-cards') return availability.message;
  return '';
}
import {
  DEFAULT_ROUNDS,
  DIFFICULTIES,
  FEEDBACK_MS,
  INITIAL_LIVES,
  MAX_ROUNDS,
  MAX_SURVIVAL_CARDS,
  MIN_ROUNDS,
  MODES,
  STEP_MS,
  boardSizeFor,
  createState,
  currentCard,
  normalizeBack,
  pendingCurrent,
  reduce,
  summarize,
} from './serpiente-significados.logic.js';

const PAGE = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  padding: '16px clamp(16px, 4vw, 32px) 40px',
};
const ROUND_OPTIONS = Array.from(
  { length: MAX_ROUNDS - MIN_ROUNDS + 1 },
  (_, index) => MIN_ROUNDS + index
);
const MIN_CARDS = 4;
const APPLE_COLORS = ['#00ffcc', '#ff007f', '#ffd166'];
const MODE_LABELS = { rounds: 'Rondas', survival: 'Supervivencia', arcade: 'Arcade' };
const MODE_HELP = {
  rounds: 'Ocho rondas por defecto. Cada acierto suma 100 puntos.',
  survival: `Come todo el mazo, hasta ${MAX_SURVIVAL_CARDS} cartas. Tu puntuación es la longitud final.`,
  arcade: 'Mazo completo, 3 vidas. Manzana incorrecta o choque resta vida.',
};
const GAME_ID = 'serpiente-significados';
const DIFFICULTY_LABELS = {
  tranquilo: 'Tranquilo',
  normal: 'Normal',
  arcade: 'Arcade',
};
const DIFFICULTY_HELP = {
  tranquilo: `${STEP_MS.tranquilo} ms por paso.`,
  normal: `${STEP_MS.normal} ms por paso.`,
  arcade: `${STEP_MS.arcade} ms por paso.`,
};

function detectViewport() {
  if (typeof window === 'undefined') return 'desktop';
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
  }
  return (window.innerWidth || 1024) < 768 ? 'mobile' : 'desktop';
}

function uniqueBackCount(deck) {
  const backs = new Set();
  for (const card of Array.isArray(deck) ? deck : []) {
    if (!card || card.id == null || String(card.id).trim() === '') continue;
    const back = normalizeBack(card.back);
    if (back) backs.add(back);
  }
  return backs.size;
}

function announcementFor(state, card) {
  const feedback = state.feedback;
  if (feedback) {
    if (feedback.type === 'correct') {
      const points = state.mode === 'rounds' ? ` +${feedback.points} puntos.` : '';
      return `¡Correcto! La manzana ${feedback.number} era «${feedback.back}».${points}`;
    }
    if (feedback.type === 'wrong') {
      return `Incorrecto. La manzana ${feedback.number} era «${feedback.back}». Pierdes una vida. Vidas: ${state.lives} de ${INITIAL_LIVES}.`;
    }
    if (feedback.type === 'collision') {
      return `¡Choque! Pierdes una vida. Vidas: ${state.lives} de ${INITIAL_LIVES}.`;
    }
  }
  if (state.phase === 'paused') return 'Partida en pausa.';
  if (!card) return '';
  const label =
    state.mode === 'rounds'
      ? `Ronda ${state.roundIndex + 1} de ${state.total}`
      : `Carta ${state.roundIndex + 1} de ${state.total}`;
  return `${label}: ${card.front}`;
}

export default function SerpienteSignificados({
  deck = [],
  decks,
  best,
  selectCards,
  onGrade,
  onArcadeEnd: _onArcadeEnd,
  onExit,
  onBackToTopic,
} = {}) {
  const onArcadeEnd = _onArcadeEnd;
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const [selectedDeckId, setSelectedDeckId] = useState(() => (hasDecks ? decks[0].id : null));
  const [gameMode, setGameMode] = useState('normal');  
  const [arcade, setArcade] = useState(() => createArcade());
  const [_arcadeEnded, setArcadeEnded] = useState(false);
  const [_arcadeResult, setArcadeResult] = useState(null);
  const selectedDeck = hasDecks ? decks.find((entry) => entry.id === selectedDeckId) || decks[0] : null;
  const deckSource = hasDecks && selectedDeck ? selectedDeck.cards : deck;
  const deckList = useMemo(() => (Array.isArray(deckSource) ? deckSource : []), [deckSource]);
  const canPlay = deckList.length >= MIN_CARDS;

  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [mode, setMode] = useState(MODES.rounds);
  const [difficulty, setDifficulty] = useState('normal');
  const [state, setState] = useState(() => createState());

  const stateRef = useRef(state);
  stateRef.current = state;
  const emitted = useRef(0);
  const exiting = useRef(false);

  const engineRef = useRef(null);
  const onTickRef = useRef(null);
  const stepAccumulatorRef = useRef(0);
  const feedbackAccumulatorRef = useRef(0);
  const roundKeyRef = useRef(-1);
  const resolvedKeyRef = useRef(-1);
  const spokenRoundRef = useRef(-1);
  const feedbackSpokenRef = useRef(-1);

  const resumeButtonRef = useRef(null);
  const summaryRef = useRef(null);

  const viewport = detectViewport();
  const previewSize = boardSizeFor({ difficulty, viewport });
  const previewStep = STEP_MS[difficulty];
  const available = deckList.length;
  const speech = isSupported();

  onTickRef.current = (dt) => {
    const current = stateRef.current;
    if (!current) return;

    if (current.phase === 'playing') {
      if (roundKeyRef.current !== current.roundIndex) {
        roundKeyRef.current = current.roundIndex;
        stepAccumulatorRef.current = 0;
      }
      stepAccumulatorRef.current += dt * 1000;
      if (stepAccumulatorRef.current >= current.stepMs) {
        stepAccumulatorRef.current -= current.stepMs;
        setState((prev) =>
          prev.phase === 'playing'
            ? reduce(prev, { type: 'step', random: Math.random })
            : prev
        );
      }
      return;
    }

    if (current.phase === 'resolved') {
      if (resolvedKeyRef.current !== current.roundIndex) {
        resolvedKeyRef.current = current.roundIndex;
        feedbackAccumulatorRef.current = 0;
      }
      feedbackAccumulatorRef.current += dt * 1000;
      if (feedbackAccumulatorRef.current >= FEEDBACK_MS) {
        feedbackAccumulatorRef.current = 0;
        setState((prev) =>
          prev.phase === 'resolved'
            ? reduce(prev, { type: 'next', random: Math.random })
            : prev
        );
      }
    }
  };

  useEffect(() => {
    const engine = createEngine({ onTick: (dt) => onTickRef.current?.(dt) });
    engineRef.current = engine;
    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (state.phase === 'playing' || state.phase === 'resolved') {
      engine.start();
      return;
    }
    if (state.phase === 'paused') {
      engine.pause();
      return;
    }
    engine.stop();
  }, [state.phase]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      const current = stateRef.current;
      if (!current) return;
      if (current.phase !== 'playing' && current.phase !== 'resolved') return;
      stopSpeech();
      setState((prev) => reduce(prev, { type: 'pause' }));
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') {
        const current = stateRef.current;
        if (!current) return;
        if (current.phase === 'playing' || current.phase === 'resolved') {
          event.preventDefault();
          stopSpeech();
          setState((prev) => reduce(prev, { type: 'pause' }));
        } else if (current.phase === 'paused') {
          event.preventDefault();
          setState((prev) => reduce(prev, { type: 'resume' }));
        }
        return;
      }
      const tag = event.target && event.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const direction = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        W: 'UP',
        s: 'DOWN',
        S: 'DOWN',
        a: 'LEFT',
        A: 'LEFT',
        d: 'RIGHT',
        D: 'RIGHT',
      }[event.key];
      if (!direction) return;
      event.preventDefault();
      setState((prev) =>
        prev.phase === 'playing' ? reduce(prev, { type: 'direction', direction }) : prev
      );
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (state.phase === 'paused') resumeButtonRef.current?.focus();
  }, [state.phase]);

  useEffect(() => {
    if ((state.phase === 'complete' || state.phase === 'gameover') && state.total > 0) {
      summaryRef.current?.focus();
    }
  }, [state.phase, state.total]);

  useEffect(() => {
    const grade = state.lastGrade;
    if (!grade || grade.seq <= emitted.current) return;
    emitted.current = grade.seq;
    onGrade?.(grade.cardId, grade.grade);
  }, [state.lastGrade, onGrade]);

  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'resolved') return;
    if (spokenRoundRef.current === state.roundIndex) return;
    spokenRoundRef.current = state.roundIndex;
    const card = currentCard(state);
    if (card) speak(card.front);
  }, [state.phase, state.roundIndex, state.cards]);

  useEffect(() => {
    const feedback = state.feedback;
    if (!feedback) return;
    if (feedbackSpokenRef.current === feedback.seq) return;
    feedbackSpokenRef.current = feedback.seq;
    if (feedback.type === 'correct' || feedback.type === 'wrong') {
      if (feedback.back) speak(feedback.back);
    } else if (feedback.type === 'gameover') {
      speak(feedback.back || 'Fin de la partida.');
    } else if (feedback.type === 'collision') {
      speak('¡Choque! Pierdes una vida.');
    }
  }, [state.feedback]);

  useEffect(() => {
    if (state.phase !== 'complete' || state.total === 0) return;
    speak('Sesión completada.');
  }, [state.phase, state.total]);

  useEffect(() => () => stopSpeech(), []);

  const resetRuntime = () => {
    emitted.current = 0;
    exiting.current = false;
    roundKeyRef.current = -1;
    resolvedKeyRef.current = -1;
    stepAccumulatorRef.current = 0;
    feedbackAccumulatorRef.current = 0;
    spokenRoundRef.current = -1;
    feedbackSpokenRef.current = -1;
    stopSpeech();
  };

  const handleStart = () => {
    resetRuntime();
    setArcadeEnded(false);
    if (setArcadeResult) setArcadeResult(null);
    if (gameMode === 'arcade') {
      setArcade(createArcade());
      setMode(MODES.survival);
    }
    const source = gameMode === 'arcade' && hasDecks && selectedDeck ? selectedDeck.cards : deckList;
    const count =
      gameMode === 'arcade' || mode === 'survival' ? Math.min(source.length, MAX_SURVIVAL_CARDS) : rounds;
    const pool = (selectCards ? selectCards(count) : source.slice(0, count)) || [];
    const next = reduce(createState(), {
      type: 'start',
      cards: pool,
      deck: source,
      mode: gameMode === 'arcade' ? MODES.survival : mode,
      rounds: gameMode === 'arcade' ? pool.length : rounds,
      difficulty: gameMode === 'arcade' ? 'normal' : difficulty,
      viewport: detectViewport(),
      random: Math.random,
    });
    setState(next);
    if (next.phase === 'playing') {
      const card = currentCard(next);
      if (card) {
        spokenRoundRef.current = next.roundIndex;
        speak(card.front);
      }
    }
  };

  const handleReplay = () => {
    resetRuntime();
    setState(createState());
  };

  const handlePause = () => {
    const current = stateRef.current;
    if (!current) return;
    if (current.phase !== 'playing' && current.phase !== 'resolved') return;
    stopSpeech();
    setState((prev) => reduce(prev, { type: 'pause' }));
  };

  const handleResume = () => {
    setState((prev) => reduce(prev, { type: 'resume' }));
  };

  const handleDirection = (direction) => {
    setState((prev) =>
      prev.phase === 'playing' ? reduce(prev, { type: 'direction', direction }) : prev
    );
  };

  const trapPauseFocus = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll('button:not([disabled])')];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    engineRef.current?.stop();
    stopSpeech();
    const current = stateRef.current;
    const grade = current.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, gameMode === 'arcade' ? (grade.grade === 'otra-vez' ? 'otra-vez' : 'facil') : grade.grade);
    }
    for (const entry of pendingCurrent(current)) {
      onGrade?.(entry.cardId, gameMode === 'arcade' ? (entry.grade === 'otra-vez' ? 'otra-vez' : 'facil') : entry.grade);
    }
    onExit?.();
  };

  if (!canPlay) {
    return (
      <main className="sepect-bg serpiente-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon serpiente-title">Serpiente de significados</h1>
          <p>
            Este tema no tiene suficientes significados distintos. Necesitas al menos{' '}
            {MIN_CARDS} cartas y 3 significados distintos para jugar. Agrega contenido al
            tema y vuelve a intentarlo.
          </p>
          <div className="serpiente-actions">
            <button className="btn-neon" type="button" onClick={onExit}>
              Volver al tema
            </button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    const bestForDeck = typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id];
    return (
      <GameSetup
        pageClassName="serpiente-page"
        title="Serpiente de significados"
        titleClassName="serpiente-title"
        lead="Dirige la serpiente y come la manzana con el significado de la pregunta. Cada manzana numerada tiene su significado en la leyenda."
        note={
          <>
            {gameMode === 'arcade' ? 'Arcade · 3 vidas' : MODE_LABELS[mode]} · {hasDecks && selectedDeck ? `Mazo ${selectedDeck.number} (${selectedDeck.label})` : `${available} cartas disponibles`} · tablero {previewSize}×{previewSize} · {previewStep} ms por paso.
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
        <div className="serpiente-setup">
          {hasDecks && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span>Modo</span>
                <button type="button" className={`btn-neon${gameMode === 'normal' ? ' is-active' : ''}`} onClick={() => { setGameMode('normal'); setMode(MODES.rounds); }}>Normal</button>
                <button type="button" className={`btn-neon${gameMode === 'arcade' ? ' is-active' : ''}`} onClick={() => { setGameMode('arcade'); setMode(MODES.survival); }}>Arcade</button>
              </div>
              {gameMode === 'arcade' && <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><ArcadeHud arcade={arcade} best={bestForDeck} compact /></div>}
              <DeckPicker decks={decks} selectedDeckId={selectedDeck?.id} onSelect={(id) => setSelectedDeckId(id)} best={best} disabledReason={(deckEntry) => disabledReasonForSerpiente(deckEntry)} gameId={GAME_ID} label="Elige tu mazo" />
            </>
          )}
          {gameMode !== 'arcade' && (
          <fieldset className="serpiente-setup-fieldset">
            <legend>Modo</legend>
            <div className="serpiente-choice-row" role="group" aria-label="Modo">
              {MODES.map((value) => (
                <button
                  key={value}
                  className={`serpiente-choice${mode === value ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {MODE_LABELS[value]}
                </button>
              ))}
            </div>
            <p className="serpiente-note">{MODE_HELP[mode]}</p>
          </fieldset>
          )}

          {gameMode !== 'arcade' && (
          <fieldset className="serpiente-setup-fieldset">
            <legend>Dificultad</legend>
            <div className="serpiente-choice-row" role="group" aria-label="Dificultad">
              {DIFFICULTIES.map((value) => (
                <button
                  key={value}
                  className={`serpiente-choice${difficulty === value ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={difficulty === value}
                  onClick={() => setDifficulty(value)}
                >
                  {DIFFICULTY_LABELS[value]}
                </button>
              ))}
            </div>
            <p className="serpiente-note">{DIFFICULTY_HELP[difficulty]}</p>
          </fieldset>
          )}

          {mode === 'rounds' ? (
            <div className="serpiente-setup-row">
              <label htmlFor="serpiente-rounds">Rondas</label>
              <select
                id="serpiente-rounds"
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
              >
                {ROUND_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="serpiente-note">
              La partida sigue hasta comer todo el mazo o perder las 5 vidas.
            </p>
          )}
        </div>
      </GameSetup>
    );
  }

  if (state.phase === 'complete' || state.phase === 'gameover') {
    if (state.total === 0) {
      return (
        <main className="sepect-bg serpiente-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon serpiente-title">Sin cartas disponibles</h1>
            <p>
              Este tema no tiene suficientes significados distintos para armar la sesión.
              Necesitas al menos {MIN_CARDS} cartas y 3 respuestas únicas.
            </p>
            <div className="serpiente-actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>
                Elegir ajustes
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
    const title = state.phase === 'gameover' ? 'Partida terminada' : 'Sesión completada';
    return (
      <main className="sepect-bg serpiente-page" style={PAGE}>
        <div className="game-stage">
          <h1
            ref={summaryRef}
            className="neon serpiente-title"
            tabIndex={-1}
          >
            {title}
          </h1>
          <div className="card-neon serpiente-summary">
            <p role="status">
              {stats.score} {state.mode === 'rounds' ? 'puntos' : 'de longitud'} ·{' '}
              {stats.hits} aciertos · {stats.fails} fallos · mejor racha {stats.bestStreak}
            </p>
            <p>
              Primer intento: {stats.firstTry} · Longitud final: {stats.length} · Vidas:{' '}
              {stats.lives}/{INITIAL_LIVES}
            </p>
            {state.endReason === 'no-space' && (
              <p>No quedaban celdas libres para colocar la siguiente ronda.</p>
            )}
            <p className="serpiente-summary__xp">+{stats.xp} XP</p>
          </div>
          <div className="serpiente-actions">
            <button className="btn-neon" type="button" onClick={handleReplay}>
              Jugar de nuevo
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

  const card = currentCard(state);
  if (!card) {
    return (
      <main className="sepect-bg serpiente-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon serpiente-title">Serpiente de significados</h1>
          <p>No hay una ronda disponible.</p>
          <button className="btn-neon" type="button" onClick={handleExit}>
            Volver al tema
          </button>
        </div>
      </main>
    );
  }

  const paused = state.phase === 'paused';
  const answered = state.phase === 'resolved';
  const cell = 100 / state.boardSize;
  const cellStyle = (position) => ({
    left: `${position.x * cell}%`,
    top: `${position.y * cell}%`,
    width: `${cell}%`,
    height: `${cell}%`,
  });
  const roundLabel =
    state.mode === 'rounds'
      ? `Ronda ${state.roundIndex + 1} de ${state.total}`
      : `Carta ${state.roundIndex + 1} de ${state.total}`;
  const scoreLabel = state.mode === 'rounds' ? state.score : state.snake.length;
  const announcement = announcementFor(state, card);
  const feedbackClass = state.feedback
    ? ` is-${state.feedback.type === 'gameover' ? 'wrong' : state.feedback.type}`
    : '';

  return (
    <main className="sepect-bg serpiente-page" style={PAGE}>
      <div className="game-stage">
        <header className="serpiente-header">
          <p className="serpiente-round">{roundLabel}</p>
          <div className="serpiente-hud">
            <span className="serpiente-mode">{MODE_LABELS[state.mode]}</span>
            <span>
              <strong>{scoreLabel}</strong> {state.mode === 'rounds' ? 'puntos' : 'de largo'}
            </span>
            <span>
              Racha <strong>{state.streak}</strong>
            </span>
            <span aria-label={`Vidas: ${state.lives} de ${INITIAL_LIVES}`}>
              <span aria-hidden="true">{'♥'.repeat(state.lives) || '—'}</span>{' '}
              <span aria-hidden="true">
                Vidas: {state.lives}/{INITIAL_LIVES}
              </span>
            </span>
          </div>
          <div className="serpiente-actions serpiente-actions--header">
            <SoundToggle />
            <button
              className="btn-neon"
              type="button"
              aria-label="Pausar partida"
              onClick={handlePause}
              disabled={paused}
            >
              Pausa
            </button>
            <button className="btn-neon" type="button" onClick={handleExit}>
              Salir
            </button>
          </div>
        </header>

        <section className="card-neon serpiente-prompt" data-card-id={card.id}>
          <div className="serpiente-prompt__media">
            <CardImage card={card} size={88} />
          </div>
          <div className="serpiente-prompt__body">
            <span className="serpiente-prompt__label">
              Come la manzana con el significado de
            </span>
            <h1 className="neon serpiente-prompt__text">{card.front}</h1>
            {speech && (
              <button
                className="serpiente-speak"
                type="button"
                aria-label="Escuchar la pregunta"
                onClick={() => speak(card.front)}
              >
                🔊 Pregunta
              </button>
            )}
          </div>
        </section>

        <div className="serpiente-board-wrap">
          <div
            className="serpiente-board"
            role="img"
            aria-label={`Tablero de la serpiente de ${state.boardSize} por ${state.boardSize}`}
            style={{ '--serpiente-cells': state.boardSize }}
          >
            {state.apples
              .filter((apple) => !apple.eaten)
              .map((apple) => (
                <div
                  key={`apple-${apple.number}`}
                  className={`serpiente-apple${answered && apple.correct ? ' is-correct' : ''}`}
                  style={{
                    ...cellStyle(apple),
                    '--apple-color': APPLE_COLORS[(apple.number - 1) % APPLE_COLORS.length],
                  }}
                  aria-hidden="true"
                >
                  <span className="serpiente-apple__number">{apple.number}</span>
                </div>
              ))}
            {state.snake.map((segment, index) => (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className={`serpiente-segment${index === 0 ? ' is-head' : ''}`}
                style={cellStyle(segment)}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div
          className="serpiente-dpad"
          role="group"
          aria-label="Controles de movimiento"
        >
          <button
            className="serpiente-dpad__btn serpiente-dpad__up"
            type="button"
            aria-label="Mover arriba"
            disabled={state.phase !== 'playing'}
            onClick={() => handleDirection('UP')}
          >
            ▲
          </button>
          <button
            className="serpiente-dpad__btn serpiente-dpad__left"
            type="button"
            aria-label="Mover a la izquierda"
            disabled={state.phase !== 'playing'}
            onClick={() => handleDirection('LEFT')}
          >
            ◀
          </button>
          <button
            className="serpiente-dpad__btn serpiente-dpad__down"
            type="button"
            aria-label="Mover abajo"
            disabled={state.phase !== 'playing'}
            onClick={() => handleDirection('DOWN')}
          >
            ▼
          </button>
          <button
            className="serpiente-dpad__btn serpiente-dpad__right"
            type="button"
            aria-label="Mover a la derecha"
            disabled={state.phase !== 'playing'}
            onClick={() => handleDirection('RIGHT')}
          >
            ▶
          </button>
        </div>

        <ol className="serpiente-legend" aria-label="Manzanas y significados">
          {state.apples.map((apple) => {
            const correct = answered && apple.correct;
            return (
              <li
                key={`legend-${apple.number}`}
                className={`serpiente-legend__row${apple.eaten ? ' is-eaten' : ''}${
                  correct ? ' is-correct' : ''
                }`}
              >
                <span
                  className="serpiente-legend__badge"
                  style={{
                    '--apple-color': APPLE_COLORS[(apple.number - 1) % APPLE_COLORS.length],
                  }}
                  aria-hidden="true"
                >
                  {apple.number}
                </span>
                <span className="serpiente-legend__text">{apple.back}</span>
                {apple.eaten && (
                  <span className="serpiente-legend__state">
                    <span aria-hidden="true">✕</span> Comida
                  </span>
                )}
                {correct && (
                  <span className="serpiente-legend__state">
                    <span aria-hidden="true">✓</span> Correcta
                  </span>
                )}
                {speech && (
                  <button
                    className="serpiente-speak serpiente-speak--legend"
                    type="button"
                    aria-label={`Escuchar el significado ${apple.number}: ${apple.back}`}
                    onClick={() => speak(apple.back)}
                  >
                    🔊
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <div
          className={`serpiente-status${feedbackClass}`}
          role="status"
          aria-live="polite"
        >
          {announcement}
        </div>

        <p className="serpiente-help">
          Flechas o WASD en teclado. En móvil usa el D-pad. La manzana incorrecta cuesta
          una vida y alarga la serpiente; chocar también cuesta una vida.
        </p>

        {paused && (
          <div className="serpiente-pause-overlay" onKeyDown={trapPauseFocus}>
            <div
              className="card-neon serpiente-pause"
              role="dialog"
              aria-modal="true"
              aria-labelledby="serpiente-pause-title"
            >
              <h2 id="serpiente-pause-title" className="neon">
                Partida en pausa
              </h2>
              <p>
                {roundLabel} · {scoreLabel}{' '}
                {state.mode === 'rounds' ? 'puntos' : 'de largo'}
              </p>
              <p>El movimiento y la serpiente están detenidos.</p>
              <div className="serpiente-actions">
                <button
                  ref={resumeButtonRef}
                  className="btn-neon"
                  type="button"
                  onClick={handleResume}
                >
                  Continuar
                </button>
                <button className="btn-neon" type="button" onClick={handleExit}>
                  Salir
                </button>
                <SoundToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
