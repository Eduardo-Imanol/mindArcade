import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import ArcadeSummary from '../../components/ArcadeSummary.jsx';
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
  DECK_BATCH_SIZE,
  DEFAULT_PAIRS,
  MAX_PAIRS,
  MIN_PAIRS,
  buildDeckBatches,
  buildSession,
  createState,
  pendingGrades,
  reduce,
  summarize,
} from './conecta-pares.logic.js';

const GAME_ID = 'conecta-pares';
const MODE_OPTIONS = [
  { id: 'normal', label: 'Normal', hint: 'Tandas a tu ritmo' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · mazo completo' },
];
const PAIR_COLORS = [
  '#00ffcc',
  '#ff007f',
  '#39ff14',
  '#ffd166',
  '#b388ff',
  '#ff6b35',
  '#00b3ff',
  '#ff4d6d',
  '#b8ff2e',
  '#c77dff',
];

function pairColor(order) {
  return PAIR_COLORS[(Math.max(1, order) - 1) % PAIR_COLORS.length];
}

function sameLines(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (
      a.cardId !== b.cardId ||
      a.order !== b.order ||
      a.x1 !== b.x1 ||
      a.y1 !== b.y1 ||
      a.x2 !== b.x2 ||
      a.y2 !== b.y2
    ) {
      return false;
    }
  }
  return true;
}

function cardLabel(side, index, total, card, order) {
  const prefix = side === 'question' ? 'Pregunta' : 'Significado';
  const text = side === 'question' ? card.front : card.back;
  const connected = order ? `. Conectada con el par ${order}` : '';
  return `${prefix} ${index + 1} de ${total}: ${text}${connected}`;
}

function disabledReasonFor(deck) {
  const availability = getDeckAvailability(
    { id: GAME_ID, status: 'available', minCards: MIN_PAIRS },
    deck
  );
  if (!availability.playable && availability.reason === 'min-cards') {
    return availabilityMessage(availability);
  }
  return '';
}

function setupNoteFor(deck, mode, batchSize, best) {
  if (!deck) return 'Elige un mazo para empezar.';
  const status = DECK_MASTERY_LABELS[deck.mastery] || DECK_MASTERY_LABELS.vacia;
  const total = Number(deck.total ?? deck.cards?.length) || 0;
  if (mode === 'arcade') {
    return `${status} · ${total} pares · 3 vidas · Mejor marca ${best}`;
  }
  return `${status} · tandas de hasta ${batchSize} pares · Mejor marca ${best}`;
}

export default function ConectaPares({
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
  const legacyAvailable = useMemo(
    () => buildSession({ cards: deck, count: MAX_PAIRS, random: () => 0 }).total,
    [deck]
  );
  const [selectedDeckId, setSelectedDeckId] = useState(() =>
    hasDecks ? decks[0].id : null
  );
  const [gameMode, setGameMode] = useState('normal');
  const [requested, setRequested] = useState(() =>
    Math.min(DEFAULT_PAIRS, Math.max(MIN_PAIRS, legacyAvailable))
  );
  const [batchSize, setBatchSize] = useState(DECK_BATCH_SIZE);
  const [state, setState] = useState(() => createState());
  const [startFailed, setStartFailed] = useState(false);
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeEnded, setArcadeEnded] = useState(false);
  const [arcadeResult, setArcadeResult] = useState(null);
  const [lines, setLines] = useState([]);
  const emitted = useRef(new Set());
  const exiting = useRef(false);
  const endedRef = useRef(false);
  const boardRef = useRef(null);
  const cardRefs = useRef(new Map());
  const matchedRef = useRef(state.matched);
  const previousMatched = useRef(0);
  const previousBatch = useRef(0);
  const summaryHeadingRef = useRef(null);
  const batchHeadingRef = useRef(null);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;
  const selectedDeckCards = Array.isArray(selectedDeck?.cards) ? selectedDeck.cards : [];
  const deckAvailable = useMemo(
    () => buildSession({ cards: selectedDeckCards, count: MAX_PAIRS, random: () => 0 }).total,
    [selectedDeckCards]
  );
  const maxBatch = Math.min(DECK_BATCH_SIZE, deckAvailable);
  const batchOptions = Array.from(
    { length: Math.max(0, maxBatch - MIN_PAIRS + 1) },
    (_, index) => MIN_PAIRS + index
  );
  const effectiveBatchSize = Math.max(
    MIN_PAIRS,
    Math.min(batchSize, maxBatch || MIN_PAIRS)
  );
  const bestForDeck = bestScoreFor(best, selectedDeck?.id);
  const deckReason = hasDecks && selectedDeck ? disabledReasonFor(selectedDeck) : '';

  matchedRef.current = state.matched;

  const cardById = useMemo(
    () => new Map(state.cards.map((card) => [card.id, card])),
    [state.cards]
  );
  const matchedByCard = useMemo(
    () => new Map(state.matched.map((entry) => [entry.cardId, entry.order])),
    [state.matched]
  );

  useEffect(() => () => stopSpeech(), []);

  const backToTopic = useCallback(() => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  }, [onBackToTopic, onExit]);

  const gradeCard = useCallback(
    (cardId, grade) => {
      if (cardId === undefined || cardId === null) return;
      const key = String(cardId);
      if (emitted.current.has(key)) return;
      emitted.current.add(key);
      const mapped =
        gameMode === 'arcade' && grade !== 'otra-vez' ? 'facil' : grade;
      onGrade?.(cardId, mapped);
    },
    [gameMode, onGrade]
  );

  const gradePending = useCallback(
    (snapshot) => {
      for (const entry of pendingGrades(snapshot)) {
        gradeCard(entry.cardId, entry.grade);
      }
    },
    [gradeCard]
  );

  useEffect(() => {
    const grade = state.lastGrade;
    if (grade) gradeCard(grade.cardId, grade.grade);
  }, [state.lastGrade, gradeCard]);

  useEffect(() => {
    const miss = state.lastMiss;
    if (gameMode === 'arcade' && miss) gradeCard(miss.cardId, miss.grade);
  }, [state.lastMiss, gameMode, gradeCard]);

  useLayoutEffect(() => {
    if (state.phase === 'complete') {
      summaryHeadingRef.current?.focus();
      previousMatched.current = state.matched.length;
      previousBatch.current = state.batchIndex;
      return;
    }
    if (state.phase === 'batch-complete') {
      batchHeadingRef.current?.focus();
      previousMatched.current = state.matched.length;
      previousBatch.current = state.batchIndex;
      return;
    }
    if (state.phase !== 'playing') {
      previousMatched.current = state.matched.length;
      previousBatch.current = state.batchIndex;
      return;
    }
    if (state.batchIndex !== previousBatch.current) {
      previousBatch.current = state.batchIndex;
      previousMatched.current = state.matched.length;
      const first = state.left.find(
        (card) => !state.matched.some((entry) => entry.cardId === card.id)
      );
      if (first) cardRefs.current.get(`question:${first.id}`)?.focus();
      return;
    }
    if (state.matched.length > previousMatched.current) {
      const last = state.matched[state.matched.length - 1];
      const lastIndex = state.left.findIndex((card) => card.id === last.cardId);
      const matchedIds = new Set(state.matched.map((entry) => entry.cardId));
      for (let offset = 1; offset <= state.left.length; offset += 1) {
        const card = state.left[(lastIndex + offset) % state.left.length];
        if (!matchedIds.has(card.id)) {
          cardRefs.current.get(`question:${card.id}`)?.focus();
          break;
        }
      }
    }
    previousMatched.current = state.matched.length;
  }, [state.phase, state.matched, state.left, state.batchIndex]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setState((current) => reduce(current, { type: 'clear' }));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const recalculate = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const next = [];
    for (const entry of matchedRef.current) {
      const question = cardRefs.current.get(`question:${entry.cardId}`);
      const meaning = cardRefs.current.get(`meaning:${entry.cardId}`);
      if (!question || !meaning) continue;
      const questionRect = question.getBoundingClientRect();
      const meaningRect = meaning.getBoundingClientRect();
      next.push({
        cardId: entry.cardId,
        order: entry.order,
        color: pairColor(entry.order),
        x1: questionRect.right - boardRect.left,
        y1: questionRect.top + questionRect.height / 2 - boardRect.top,
        x2: meaningRect.left - boardRect.left,
        y2: meaningRect.top + meaningRect.height / 2 - boardRect.top,
      });
    }
    setLines((previous) => (sameLines(previous, next) ? previous : next));
  }, []);

  useLayoutEffect(() => {
    recalculate();
  }, [recalculate, state.matched]);

  useEffect(() => {
    if (state.phase !== 'playing') return undefined;
    let active = true;
    let cancelled = false;
    const refresh = () => {
      if (active) recalculate();
    };
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && boardRef.current) {
      observer = new ResizeObserver(refresh);
      observer.observe(boardRef.current);
    }
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      Promise.resolve(document.fonts.ready)
        .then(() => {
          if (!cancelled) refresh();
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      cancelled = true;
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
      if (observer) observer.disconnect();
    };
  }, [recalculate, state.phase]);

  const resetSession = () => {
    emitted.current = new Set();
    exiting.current = false;
    endedRef.current = false;
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
    setLines([]);
  };

  const endArcade = (finalArcade, snapshot) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const finished = arcadeFinish(finalArcade);
    setArcade(finished);
    setArcadeEnded(true);
    if (snapshot) gradePending(snapshot);
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

  const startSession = () => {
    resetSession();
    setStartFailed(false);
    if (hasDecks && selectedDeck) {
      if (deckReason || selectedDeckCards.length < MIN_PAIRS) {
        setStartFailed(true);
        return;
      }
      const size = gameMode === 'arcade' ? DECK_BATCH_SIZE : effectiveBatchSize;
      const next = reduce(createState(), {
        type: 'start',
        batches: buildDeckBatches(selectedDeckCards, { size }),
        random,
      });
      setState(next);
      setStartFailed(next.phase !== 'playing');
      return;
    }
    const pool = (selectCards ? selectCards(requested) : deck.slice(0, requested)) || [];
    const next = reduce(createState(), {
      type: 'start',
      count: requested,
      cards: pool,
      random,
    });
    setState(next);
    setStartFailed(next.phase !== 'playing');
  };

  const handleReplay = () => {
    if (gameMode === 'arcade') {
      startSession();
      return;
    }
    resetSession();
    setStartFailed(false);
    setState(createState());
  };

  const handleChooseDeck = () => {
    resetSession();
    setStartFailed(false);
    setState(createState());
  };

  const handleNextBatch = () => {
    const next = reduce(state, { type: 'nextBatch', random });
    if (next === state) return;
    setLines([]);
    setState(next);
  };

  const handleSelect = (side, cardId) => {
    if (gameMode === 'arcade' && (arcade.over || arcadeEnded)) return;
    const next = reduce(state, { type: 'select', side, cardId });
    if (next === state) return;
    const matched = next.matched.length > state.matched.length;
    const missed = next.errors > state.errors;
    setState(next);
    const card = cardById.get(cardId);
    if (card) {
      if (next.feedback?.type === 'correct') {
        const matchedCard = cardById.get(next.feedback.cardId);
        if (matchedCard) speak(`${matchedCard.front}. ${matchedCard.back}`);
      } else if (next.selection || next.feedback?.type === 'wrong') {
        speak(side === 'question' ? card.front : card.back);
      }
    }
    if (gameMode !== 'arcade') return;
    if (matched) {
      const nextArcade = arcadeHit(arcade);
      setArcade(nextArcade);
      if (next.phase === 'complete') {
        endArcade(arcadeFinish(nextArcade), next);
      }
    } else if (missed) {
      const nextArcade = arcadeMiss(arcade);
      setArcade(nextArcade);
      if (nextArcade.over) endArcade(nextArcade, next);
    }
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    stopSpeech();
    if (state.phase === 'playing') gradePending(state);
    backToTopic();
  };

  if (!hasDecks && (legacyAvailable < MIN_PAIRS || startFailed)) {
    return (
      <main className="sepect-bg conecta-page topic-page">
        <div className="game-stage">
          <h1 className="neon game-app-title">Conecta pregunta–significado</h1>
          <p>
            Necesitas al menos 3 pares únicos de pregunta y significado para jugar este tema.
          </p>
          <div className="conecta-actions">
            {startFailed && legacyAvailable >= MIN_PAIRS && (
              <button className="btn-neon" type="button" onClick={handleReplay}>
                Elegir pares
              </button>
            )}
            <button className="btn-neon" type="button" onClick={handleExit}>
              Volver al tema
            </button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  if (startFailed) {
    return (
      <main className="sepect-bg conecta-page topic-page">
        <div className="game-stage">
          <h1 className="neon game-app-title">Conecta pregunta–significado</h1>
          <p>El mazo elegido no tiene pares suficientes para jugar.</p>
          <div className="conecta-actions">
            <button className="btn-neon" type="button" onClick={handleChooseDeck}>
              Elegir mazo
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

  if (state.phase === 'setup') {
    if (hasDecks) {
      const startDisabled =
        !selectedDeck ||
        Boolean(deckReason) ||
        selectedDeckCards.length < MIN_PAIRS;
      return (
        <GameSetup
          pageClassName="conecta-page topic-page"
          title="Conecta pregunta–significado"
          eyebrow="Configura tu partida"
          lead="Une cada pregunta con su significado tocando ambas columnas. En arcade el mazo completo se juega con tres vidas."
          note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · las tandas nunca descartan cartas.`}
          start={
            <button
              className="btn-neon"
              type="button"
              onClick={startSession}
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
          {gameMode === 'normal' && batchOptions.length > 0 ? (
            <div className="conecta-setup">
              <label htmlFor="conecta-batch">Parejas por tanda</label>
              <select
                id="conecta-batch"
                value={effectiveBatchSize}
                onChange={(event) => setBatchSize(Number(event.target.value))}
              >
                {batchOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <p className="conecta-note" role="status">
            {setupNoteFor(selectedDeck, gameMode, effectiveBatchSize, bestForDeck)}
          </p>
        </GameSetup>
      );
    }

    const pairOptions = Array.from(
      { length: Math.min(MAX_PAIRS, legacyAvailable) - MIN_PAIRS + 1 },
      (_, index) => MIN_PAIRS + index
    );
    return (
      <GameSetup
        pageClassName="conecta-page topic-page"
        title="Conecta pregunta–significado"
        lead="Une cada pregunta con su significado tocando ambas columnas."
        note={`${legacyAvailable} pares únicos disponibles en este tema.`}
        start={
          <button className="btn-neon" type="button" onClick={startSession}>
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
        <div className="conecta-setup">
          <label htmlFor="conecta-pairs">Pares</label>
          <select
            id="conecta-pairs"
            value={Math.min(requested, Math.min(MAX_PAIRS, legacyAvailable))}
            onChange={(event) => setRequested(Number(event.target.value))}
          >
            {pairOptions.map((option) => (
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
      <main className="sepect-bg conecta-page topic-page">
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
                <button className="btn-neon" type="button" onClick={startSession} autoFocus>
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

  if (state.phase === 'batch-complete') {
    return (
      <main className="sepect-bg conecta-page topic-page">
        <div className="game-stage">
          <section className="result-panel" aria-labelledby="conecta-batch-title">
            <p className="result-panel__eyebrow">Mazo {selectedDeck?.number}</p>
            <h1
              id="conecta-batch-title"
              className="neon game-app-title"
              ref={batchHeadingRef}
              tabIndex={-1}
            >
              Tanda completada
            </h1>
            <p className="result-panel__live" role="status">
              Tanda {state.batchIndex + 1} de {state.batchCount} completada. Quedan{' '}
              {Math.max(0, state.batchCount - state.batchIndex - 1)} tandas.
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Pares de la tanda</dt>
                <dd>{state.matched.length}</dd>
              </div>
              <div className="result-panel__stat">
                <dt>Errores</dt>
                <dd>{state.errors}</dd>
              </div>
            </dl>
            <div className="result-panel__actions">
              <button className="btn-neon" type="button" onClick={handleNextBatch} autoFocus>
                Siguiente tanda
              </button>
              <button className="btn-neon" type="button" onClick={handleExit}>
                Salir
              </button>
              <SoundToggle />
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (state.phase === 'complete') {
    const stats = summarize(state);
    return (
      <main className="sepect-bg conecta-page topic-page">
        <div className="game-stage">
          <h1
            className="neon conecta-summary__title game-app-title"
            ref={summaryHeadingRef}
            tabIndex={-1}
          >
            Sesión completada
          </h1>
          <p className="conecta-status" role="status" aria-live="polite">
            Sesión completada: {stats.matched} de {stats.total} pares, {stats.errors}{' '}
            {stats.errors === 1 ? 'error' : 'errores'}, +{stats.xp} XP.
          </p>
          <div className="card-neon conecta-summary">
            <p>Pares emparejados: {stats.matched} de {stats.total}</p>
            <p>Errores: {stats.errors}</p>
            <p>Aciertos al primer intento: {stats.firstTry} de {stats.matched}</p>
            <p className="conecta-summary__xp">+{stats.xp} XP</p>
          </div>
          <div className="conecta-actions">
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
        </div>
      </main>
    );
  }

  const selectedCard = state.selection ? cardById.get(state.selection.cardId) : null;
  const selectedText = selectedCard
    ? state.selection.side === 'question'
      ? selectedCard.front
      : selectedCard.back
    : '';
  const feedbackCard =
    state.feedback?.type === 'correct' ? cardById.get(state.feedback.cardId) : null;
  let announcement = `Pares ${state.matched.length} de ${state.total}.`;
  if (state.selection && selectedText) {
    announcement = `Seleccionado: «${selectedText}».`;
  } else if (feedbackCard) {
    announcement = `¡Par correcto! «${feedbackCard.front}» con «${feedbackCard.back}».`;
  } else if (state.feedback?.type === 'wrong') {
    announcement = 'No coincide. Intenta de nuevo.';
  }

  const renderCard = (side, card, index) => {
    const order = matchedByCard.get(card.id);
    const selected = Boolean(
      state.selection &&
        state.selection.side === side &&
        state.selection.cardId === card.id
    );
    const wrong =
      state.feedback?.type === 'wrong' &&
      (state.feedback.questionCardId === card.id ||
        state.feedback.meaningCardId === card.id);
    const classes = [
      'conecta-card',
      selected ? 'is-selected' : '',
      order ? 'is-matched' : '',
      wrong ? 'is-wrong' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        key={`${side}-${card.id}`}
        ref={(node) => {
          const key = `${side}:${card.id}`;
          if (node) cardRefs.current.set(key, node);
          else cardRefs.current.delete(key);
        }}
        type="button"
        className={classes}
        style={order ? { '--conecta-pair': pairColor(order) } : undefined}
        aria-pressed={selected}
        aria-label={cardLabel(side, index, state.total, card, order)}
        disabled={Boolean(order)}
        onClick={() => handleSelect(side, card.id)}
      >
        <span className="conecta-card__text">
          {side === 'question' ? card.front : card.back}
        </span>
        {order ? (
          <span className="conecta-card__match" aria-hidden="true">
            <span className="conecta-badge">{order}</span> Par {order}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <main className="sepect-bg conecta-page topic-page">
      <div className="game-stage">
        <header className="conecta-header game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {hasDecks && selectedDeck
                ? `Mazo ${selectedDeck.number} · Tanda ${state.batchIndex + 1} de ${state.batchCount}`
                : 'Conecta'}{' '}
              · {gameMode === 'arcade' ? 'Arcade' : 'Normal'}
            </p>
            <p className="conecta-progress">
              Pares {state.matched.length} de {state.total} · {state.errors}{' '}
              {state.errors === 1 ? 'error' : 'errores'}
            </p>
          </div>
          <div className="conecta-actions game-session-header__actions" style={{ marginTop: 0 }}>
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

        <p className="conecta-status" role="status" aria-live="polite">
          {announcement}
        </p>

        {state.selection && selectedText && (
          <div className="conecta-selection">
            <span>
              Seleccionado: <strong>{selectedText}</strong>
            </span>
            {isSupported() && (
              <button
                className="btn-neon"
                type="button"
                aria-label="Escuchar el elemento seleccionado"
                onClick={() => speak(selectedText)}
              >
                🔊 Repetir
              </button>
            )}
          </div>
        )}

        {feedbackCard && (
          <p className="conecta-feedback is-correct">
            ¡Par correcto! «{feedbackCard.front}» con «{feedbackCard.back}».
          </p>
        )}
        {state.feedback?.type === 'wrong' && (
          <p className="conecta-feedback is-wrong">
            No coincide. Intenta de nuevo.
          </p>
        )}

        <div className="conecta-board" ref={boardRef}>
          <svg
            className="conecta-lines"
            aria-hidden="true"
            focusable="false"
            width="100%"
            height="100%"
          >
            {lines.map((line) => (
              <g key={line.cardId} className="conecta-line-group">
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle
                  cx={(line.x1 + line.x2) / 2}
                  cy={(line.y1 + line.y2) / 2}
                  r="11"
                  fill="#0f051d"
                  stroke={line.color}
                  strokeWidth="2"
                />
                <text
                  x={(line.x1 + line.x2) / 2}
                  y={(line.y1 + line.y2) / 2}
                  fill={line.color}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {line.order}
                </text>
              </g>
            ))}
          </svg>

          <section className="conecta-column" aria-label="Preguntas">
            <h2 className="conecta-column__title">Preguntas</h2>
            <div className="conecta-cards">
              {state.left.map((card, index) => renderCard('question', card, index))}
            </div>
          </section>

          <section className="conecta-column" aria-label="Significados">
            <h2 className="conecta-column__title">Significados</h2>
            <div className="conecta-cards">
              {state.right.map((card, index) => renderCard('meaning', card, index))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
