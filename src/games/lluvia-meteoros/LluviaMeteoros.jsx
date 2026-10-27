import React, { useEffect, useMemo, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { createEngine } from '../../core/engine/engine.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js'; // eslint-disable-line no-unused-vars
import { getDeckAvailability } from '../availability.js';
import {
  DEFAULT_ROUNDS,
  DIFFICULTIES,
  FEEDBACK_MS,
  GRACE_MS,
  LIVES,
  MAX_ROUNDS,
  MIN_ROUNDS,
  RHYTHMS,
  createState,
  currentRound,
  normalizeBack,
  pendingCurrent,
  reduce,
  summarize,
} from './lluvia-meteoros.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const ROUND_OPTIONS = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, index) => MIN_ROUNDS + index);
const MIN_CARDS = 6;
const DIFFICULTY_LABELS = { tranquilo: 'Tranquilo', normal: 'Normal', arcade: 'Arcade' };
const DIFFICULTY_HELP = {
  tranquilo: 'El meteoro cae un 25 % más lento.',
  normal: 'Velocidad equilibrada.',
  arcade: 'El meteoro cae un 20 % más rápido.',
};
const RHYTHM_LABELS = { manual: 'Manual', auto: 'Auto', survival: 'Supervivencia' };
const RHYTHM_HELP = {
  manual: 'Tú decides cuándo pasar al siguiente meteoro.',
  auto: 'Avanza solo 2,5 s después del resultado.',
  survival: 'Tres vidas: cada fallo o tiempo agotado resta una.',
};
const SIZE_CLASS = { lg: 'lluvia-size-lg', md: 'lluvia-size-md', sm: 'lluvia-size-sm' };
const GAME_ID = 'lluvia-meteoros';

function disabledReasonFor(deck) {
  const availability = getDeckAvailability({ id: GAME_ID, minCards: 4 }, deck);
  if (!availability.playable && availability.reason === 'min-cards') return availability.message;
  return '';
}

function reduceMotionPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

export default function LluviaMeteoros({ deck = [], decks, best, selectCards, onGrade, onArcadeEnd, onExit, onBackToTopic } = {}) {
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const [selectedDeckId, setSelectedDeckId] = useState(() => (hasDecks ? decks[0].id : null));
  const [gameMode, setGameMode] = useState('normal');
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeEnded, setArcadeEnded] = useState(false);
  const [arcadeResult, setArcadeResult] = useState(null);
  const selectedDeck = hasDecks ? decks.find((entry) => entry.id === selectedDeckId) || decks[0] : null;
  const deckSource = hasDecks && selectedDeck ? selectedDeck.cards : deck;
  const deckList = useMemo(() => (Array.isArray(deckSource) ? deckSource : []), [deckSource]);
  const backs = useMemo(() => uniqueBackCount(deckList), [deckList]);
  const canPlay = deckList.length >= MIN_CARDS && backs >= 3;

  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [difficulty, setDifficulty] = useState('normal');
  const [rhythm, setRhythm] = useState('manual');
  const [state, setState] = useState(() => createState());
  const [feedbackLeft, setFeedbackLeft] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => reduceMotionPreference());

  const stateRef = useRef(state);
  stateRef.current = state;
  const emitted = useRef(0);
  const exiting = useRef(false);

  const engineRef = useRef(null);
  const onTickRef = useRef(null);
  const elapsedRef = useRef(0);
  const progressRef = useRef(0);
  const distanceRef = useRef(0);
  const timeoutFiredRef = useRef(false);
  const roundKeyRef = useRef(null);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const fieldRef = useRef(null);
  const meteorRef = useRef(null);
  const progressBarRef = useRef(null);
  const firstOptionRef = useRef(null);
  const nextButtonRef = useRef(null);
  const resumeButtonRef = useRef(null);
  const summaryRef = useRef(null);

  const feedbackSeqRef = useRef(-1);
  const feedbackRemainingRef = useRef(0);
  const feedbackSpokenRef = useRef(-1);
  const followUpSpeechRef = useRef(0);

  const cancelFollowUpSpeech = () => {
    followUpSpeechRef.current += 1;
  };

  const speakSequence = (first, second) => {
    cancelFollowUpSpeech();
    const token = followUpSpeechRef.current;
    const utterance = speak(first);
    if (!utterance || !second) return;
    utterance.onend = () => {
      if (followUpSpeechRef.current !== token) return;
      cancelFollowUpSpeech();
      speak(second);
    };
  };

  const applyProgress = (progress) => {
    progressRef.current = progress;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${Math.round(progress * 100)}%`;
    }
    if (meteorRef.current) {
      const offset = reducedMotionRef.current ? 0 : Math.round(progress * distanceRef.current);
      meteorRef.current.style.transform = `translate3d(-50%, ${offset}px, 0)`;
    }
  };

  const measureDistance = () => {
    const field = fieldRef.current;
    const meteor = meteorRef.current;
    if (!field || !meteor) return;
    distanceRef.current = Math.max(0, field.clientHeight - meteor.offsetHeight);
    applyProgress(progressRef.current);
  };

  onTickRef.current = (dt) => {
    const current = stateRef.current;
    if (!current || current.phase !== 'playing') return;
    const round = current.rounds[current.roundIndex];
    if (!round) return;

    elapsedRef.current += dt * 1000;
    const progress = Math.min(
      1,
      Math.max(0, (elapsedRef.current - GRACE_MS) / round.durationMs)
    );
    applyProgress(progress);

    if (!timeoutFiredRef.current && elapsedRef.current >= GRACE_MS + round.durationMs) {
      timeoutFiredRef.current = true;
      engineRef.current?.pause();
      setState((previous) => reduce(previous, { type: 'timeout' }));
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

  useEffect(
    () => () => {
      cancelFollowUpSpeech();
      stopSpeech();
    },
    []
  );

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (state.phase === 'playing') {
      if (roundKeyRef.current !== state.roundIndex) {
        roundKeyRef.current = state.roundIndex;
        elapsedRef.current = 0;
        progressRef.current = 0;
        timeoutFiredRef.current = false;
        applyProgress(0);
        measureDistance();
      }
      engine.start();
      return;
    }

    if (state.phase === 'paused') {
      engine.pause();
      return;
    }

    engine.stop();
  }, [state.phase, state.roundIndex]);

  useEffect(() => {
    measureDistance();
  }, [state.phase, state.roundIndex, reducedMotion]);

  useEffect(() => {
    const onResize = () => measureDistance();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotionRef.current = query.matches;
      setReducedMotion(query.matches);
      applyProgress(progressRef.current);
    };
    update();
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    if (typeof query.addListener === 'function') {
      query.addListener(update);
      return () => query.removeListener(update);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const grade = state.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, gameMode === 'arcade' ? (grade.grade === 'otra-vez' ? 'otra-vez' : 'facil') : grade.grade);
    }
  }, [state, onGrade, gameMode]);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    firstOptionRef.current?.focus();
  }, [state.phase, state.roundIndex]);

  useEffect(() => {
    if (state.phase === 'paused') resumeButtonRef.current?.focus();
    else if (state.phase === 'answered') nextButtonRef.current?.focus();
    else if (state.phase === 'complete' && state.total > 0) summaryRef.current?.focus();
  }, [state.phase, state.roundIndex, state.total]);

  useEffect(() => {
    const grade = state.lastGrade;
    if (!grade || grade.grade === 'facil') return;
    if (feedbackSpokenRef.current === grade.seq) return;
    feedbackSpokenRef.current = grade.seq;
    if (state.chosenOptionId != null) return;
    const round = state.rounds[state.roundIndex];
    const correct = round ? round.options.find((option) => option.correct) : null;
    if (correct) speak(correct.back);
  }, [state.lastGrade, state.chosenOptionId, state.rounds, state.roundIndex]);

  useEffect(() => {
    if (state.phase !== 'answered' || state.rhythm === 'manual') {
      setFeedbackLeft(0);
      return undefined;
    }

    const seq = state.results.length;
    if (feedbackSeqRef.current !== seq) {
      feedbackSeqRef.current = seq;
      feedbackRemainingRef.current = FEEDBACK_MS;
      setFeedbackLeft(FEEDBACK_MS);
    }

    const interval = setInterval(() => {
      feedbackRemainingRef.current -= 100;
      if (feedbackRemainingRef.current <= 0) {
        feedbackRemainingRef.current = 0;
        setFeedbackLeft(0);
        clearInterval(interval);
        goNext();
      } else {
        setFeedbackLeft(feedbackRemainingRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state.phase, state.roundIndex, state.rhythm, state.results.length]);

  const beginRoundSpeech = (nextState) => {
    cancelFollowUpSpeech();
    if (nextState.phase !== 'playing') return;
    const round = nextState.rounds[nextState.roundIndex];
    if (round) speak(round.card.front);
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
    roundKeyRef.current = null;
    feedbackSeqRef.current = -1;
    feedbackRemainingRef.current = 0;
    feedbackSpokenRef.current = -1;
    cancelFollowUpSpeech();
    stopSpeech();
    setArcadeEnded(false);
    setArcadeResult(null);
    if (gameMode === 'arcade') {
      setArcade(createArcade());
      setRhythm('survival');
    }
    let selected = [];
    if (hasDecks && selectedDeck) {
      if (gameMode === 'arcade') {
        selected = Array.isArray(selectedDeck.cards) ? selectedDeck.cards.slice() : [];
      } else {
        const count = Math.min(rounds, selectedDeck.cards.length);
        selected = (selectCards ? selectCards(count) : selectedDeck.cards.slice(0, count)) || [];
      }
    } else {
      selected = (selectCards ? selectCards(gameMode === 'arcade' ? deckList.length : rounds) : deckList.slice(0, gameMode === 'arcade' ? deckList.length : rounds)) || [];
    }
    const next = reduce(createState(), {
      type: 'start',
      cards: selected,
      deck: hasDecks && selectedDeck ? selectedDeck.cards : deckList,
      rounds: gameMode === 'arcade' ? selected.length : rounds,
      difficulty,
      rhythm: gameMode === 'arcade' ? 'survival' : rhythm,
      random: Math.random,
    });
    setState(next);
    beginRoundSpeech(next);
  };

  const handleReplay = () => {
    emitted.current = 0;
    exiting.current = false;
    roundKeyRef.current = null;
    feedbackSeqRef.current = -1;
    feedbackRemainingRef.current = 0;
    feedbackSpokenRef.current = -1;
    elapsedRef.current = 0;
    progressRef.current = 0;
    timeoutFiredRef.current = false;
    cancelFollowUpSpeech();
    stopSpeech();
    setArcadeEnded(false);
    setArcadeResult(null);
    if (gameMode === 'arcade') {
      setArcade(createArcade());
      setRhythm('survival');
    }
    setState(createState());
    if (hasDecks || gameMode === 'arcade') {
      handleStart();
      return;
    }
  };

  const handleChoose = (optionId) => {
    const current = stateRef.current;
    if (!current || current.phase !== 'playing') return;
    const round = currentRound(current);
    const option = round ? round.options.find((entry) => entry.id === optionId) : null;
    if (!option) return;

    const ratio = Math.min(1, Math.max(0, 1 - progressRef.current));
    const next = reduce(current, {
      type: 'answer',
      optionId,
      remainingRatio: ratio,
    });
    if (next === current) return;

    engineRef.current?.pause();
    setState(next);
    const correct = round.options.find((entry) => entry.correct);
    if (next.lastGrade?.grade === 'otra-vez' && correct) {
      speakSequence(option.back, correct.back);
    } else {
      cancelFollowUpSpeech();
      speak(option.back);
    }
  };

  const goNext = () => {
    const current = stateRef.current;
    const next = reduce(current, { type: 'next' });
    if (next === current) return;
    cancelFollowUpSpeech();
    setState(next);
    if (next.phase === 'playing') beginRoundSpeech(next);
    else stopSpeech();
  };

  const handlePause = () => {
    const current = stateRef.current;
    if (!current || (current.phase !== 'playing' && current.phase !== 'answered')) return;
    cancelFollowUpSpeech();
    stopSpeech();
    setState((previous) => reduce(previous, { type: 'pause' }));
  };

  const handleResume = () => {
    const current = stateRef.current;
    if (!current || current.phase !== 'paused') return;
    setState((previous) => reduce(previous, { type: 'resume' }));
  };

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    engineRef.current?.stop();
    cancelFollowUpSpeech();
    stopSpeech();
    const current = stateRef.current;
    const grade = current.lastGrade;
    if (grade && grade.seq > emitted.current) {
      emitted.current = grade.seq;
      onGrade?.(grade.cardId, gameMode === 'arcade' ? (grade.grade === 'otra-vez' ? 'otra-vez' : 'facil') : grade.grade);
    }
    for (const entry of pendingCurrent(current)) {
      if (emitted.current >= entry.seq) continue;
      emitted.current = entry.seq;
      onGrade?.(entry.cardId, gameMode === 'arcade' ? (entry.grade === 'otra-vez' ? 'otra-vez' : 'facil') : entry.grade);
    }
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      const current = stateRef.current;
      if (!current || (current.phase !== 'playing' && current.phase !== 'answered')) return;
      cancelFollowUpSpeech();
      stopSpeech();
      setState((previous) => reduce(previous, { type: 'pause' }));
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (gameMode !== 'arcade') return;
    if (arcadeEnded) return;
    if (arcade.over) {
      endArcade(arcade);
    }
  }, [gameMode, arcade, arcadeEnded]);

  useEffect(() => {
    if (state.phase !== 'playing') return undefined;
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target && event.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const index = ['1', '2', '3'].indexOf(event.key);
      if (index === -1) return;
      const round = currentRound(stateRef.current);
      const option = round ? round.options[index] : null;
      if (!option) return;
      event.preventDefault();
      handleChoose(option.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.phase]);

  if (!canPlay && !hasDecks) {
    return (
      <main className="sepect-bg lluvia-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Lluvia de meteoros</h1>
          <p>
            Necesitas al menos 6 cartas y 3 significados distintos para jugar. Agrega
            contenido al tema y vuelve a intentarlo.
          </p>
          <div className="lluvia-actions">
            <button className="btn-neon" type="button" onClick={onBackToTopic || onExit}>Volver al tema</button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'setup') {
    if (hasDecks) {
      const bestForDeck = typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id];
      return (
        <GameSetup
          pageClassName="lluvia-page"
          title="Lluvia de meteoros"
          lead="Elige el significado correcto antes de que el meteoro caiga. En arcade, falla o tiempo agotado resta vida."
          note={<>{decks.length} {decks.length === 1 ? 'mazo' : 'mazos'} de este tema.{selectedDeck ? <> · Mazo {selectedDeck.number} ({selectedDeck.label})</> : null}</>}
          start={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-neon" type="button" onClick={() => { setGameMode('normal'); handleStart(); }}>Normal</button>
              <button className="btn-neon" type="button" onClick={() => { setGameMode('arcade'); setRhythm('survival'); handleStart(); }}>Arcade · 3 vidas</button>
            </div>
          }
          actions={
            <>
              <SoundToggle />
              <button className="btn-neon game-setup__exit" type="button" onClick={onBackToTopic || onExit}>
                Volver al tema
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <ArcadeHud arcade={arcade} best={bestForDeck} compact />
          </div>
          <DeckPicker decks={decks} selectedDeckId={selectedDeck?.id} onSelect={(id) => setSelectedDeckId(id)} best={best} disabledReason={(deckEntry) => disabledReasonFor(deckEntry)} gameId={GAME_ID} label="Elige tu mazo" />
        </GameSetup>
      );
    }
    return (
      <GameSetup
        pageClassName="lluvia-page"
        title="Lluvia de meteoros"
        lead="Cada meteoro trae el concepto de una carta. Elige su significado antes de que impacte. Un solo intento por meteoro."
        note={
          <>
            {Math.min(rounds, deckList.length)} meteoros disponibles · mínimo 6 cartas y 3
            significados distintos.
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
        <div className="lluvia-setup">
          <fieldset className="lluvia-setup-fieldset">
            <legend>Dificultad</legend>
            <div className="lluvia-choice-row" role="group" aria-label="Dificultad">
              {DIFFICULTIES.map((value) => (
                <button
                  key={value}
                  className={`lluvia-choice${difficulty === value ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={difficulty === value}
                  onClick={() => setDifficulty(value)}
                >
                  {DIFFICULTY_LABELS[value]}
                </button>
              ))}
            </div>
            <p className="lluvia-note">{DIFFICULTY_HELP[difficulty]}</p>
          </fieldset>

          <fieldset className="lluvia-setup-fieldset">
            <legend>Ritmo</legend>
            <div className="lluvia-choice-row" role="group" aria-label="Ritmo">
              {RHYTHMS.map((value) => (
                <button
                  key={value}
                  className={`lluvia-choice${rhythm === value ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={rhythm === value}
                  onClick={() => setRhythm(value)}
                >
                  {RHYTHM_LABELS[value]}
                </button>
              ))}
            </div>
            <p className="lluvia-note">{RHYTHM_HELP[rhythm]}</p>
          </fieldset>

          <div className="lluvia-setup-row">
            <label htmlFor="lluvia-rounds">Rondas</label>
            <select
              id="lluvia-rounds"
              value={rounds}
              onChange={(event) => setRounds(Number(event.target.value))}
            >
              {ROUND_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </GameSetup>
    );
  }

  if (state.phase === 'complete') {
    if (gameMode === 'arcade' && (arcadeEnded || arcade.over)) {
      return (
        <main className="sepect-bg lluvia-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Arcade</h1>
            <p role="status">
              Puntuación {arcadeResult?.best ?? arcade.score} {arcadeResult?.isRecord ? '· ¡Nuevo récord!' : ''}
              <br />
              Vidas restantes {arcade.lives} · Aciertos {arcade.correct} · Fallos {arcade.wrong}
              {selectedDeck ? <> · Mazo {selectedDeck.number} ({selectedDeck.label})</> : null}
            </p>
            <div className="lluvia-actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>Repetir</button>
              <button className="btn-neon" type="button" onClick={() => { setState(createState()); setGameMode('normal'); }}>Elegir mazo</button>
              <button className="btn-neon" type="button" onClick={onBackToTopic || onExit}>Volver al tema</button>
              <SoundToggle />
            </div>
          </div>
        </main>
      );
    }

    if (state.total === 0) {
      return (
        <main className="sepect-bg lluvia-page" style={PAGE}>
          <div className="game-stage">
            <h1 className="neon game-app-title">Sin meteoros disponibles</h1>
            <p>
              Este tema no tiene suficientes significados distintos para armar la sesión.
              Necesitas al menos 6 cartas y 3 respuestas únicas.
            </p>
            <div className="lluvia-actions">
              <button className="btn-neon" type="button" onClick={handleReplay}>Elegir ajustes</button>
              <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
              <SoundToggle />
            </div>
          </div>
        </main>
      );
    }

    const stats = summarize(state);
    return (
      <main className="sepect-bg lluvia-page" style={PAGE}>
        <div className="game-stage">
          <h1 ref={summaryRef} className="neon game-app-title" tabIndex={-1}>
            Sesión completada
          </h1>
          <div className="card-neon lluvia-summary">
            <p role="status">
              {stats.score} puntos · {stats.hits} aciertos · {stats.fails} fallos · mejor
              racha {stats.bestStreak}
            </p>
            <p className="lluvia-summary__xp">+{stats.xp} XP</p>
          </div>
          <div className="lluvia-actions">
            <button className="btn-neon" type="button" onClick={handleReplay}>Jugar de nuevo</button>
            <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
            <SoundToggle />
          </div>
        </div>
      </main>
    );
  }

  if (state.phase === 'paused') {
    return (
      <main className="sepect-bg lluvia-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Partida en pausa</h1>
          <div className="card-neon lluvia-pause">
            <p style={{ margin: 0 }}>
              Meteoro {state.roundIndex + 1} de {state.total} · {state.score} puntos
            </p>
            <p style={{ margin: 0 }}>El tiempo y el meteoro están detenidos.</p>
            <div className="lluvia-actions" style={{ marginTop: 0 }}>
              <button
                ref={resumeButtonRef}
                className="btn-neon"
                type="button"
                onClick={handleResume}
              >
                Continuar
              </button>
              <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
              <SoundToggle />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const round = currentRound(state);
  if (!round) {
    return (
      <main className="sepect-bg lluvia-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Lluvia de meteoros</h1>
          <p>No hay un meteoro disponible.</p>
          <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  const answered = state.phase === 'answered';
  const radar = round.profile.mode === 'radar';
  const sizeClass = SIZE_CLASS[round.profile.size] || SIZE_CLASS.md;
  const correctOption = round.options.find((option) => option.correct) || null;
  const result = state.results[round.index] || null;
  const timeout = answered && state.chosenOptionId == null;
  const nextLabel = round.index + 1 >= round.total ? 'Ver resumen' : 'Siguiente';

  let announcement = `Meteoro ${round.index + 1} de ${round.total}: ${round.card.front}`;
  if (answered) {
    if (round.won) {
      announcement = `¡Correcto! «${round.card.back}»`;
    } else if (timeout) {
      announcement = `Se acabó el tiempo. La respuesta correcta es «${round.card.back}»`;
    } else {
      announcement = `Incorrecto. La respuesta correcta es «${round.card.back}»`;
    }
  }

  return (
    <main className="sepect-bg lluvia-page" style={PAGE}>
      <div className="game-stage">
        <header className="lluvia-header">
          <p style={{ margin: 0 }}>Meteoro {round.index + 1} de {round.total}</p>
          <div className="lluvia-hud">
            <span><strong>{state.score}</strong> puntos</span>
            <span>Racha <strong>{state.streak}</strong></span>
            {state.rhythm === 'survival' && (
              <span aria-label={`Vidas: ${state.lives} de ${LIVES}`}>
                <span aria-hidden="true">{'♥'.repeat(state.lives) || '—'}</span> {state.lives}/{LIVES}
              </span>
            )}
          </div>
          <div className="lluvia-actions" style={{ marginTop: 0 }}>
            <SoundToggle />
            <button
              className="btn-neon"
              type="button"
              aria-label="Pausar partida"
              onClick={handlePause}
            >
              Pausa
            </button>
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>

        {radar && (
          <div className="card-neon lluvia-radar">
            <span className="lluvia-radar__label">Mensaje largo</span>
            <p className={`lluvia-radar__text ${sizeClass}`}>{round.card.front}</p>
          </div>
        )}

        <div className={`lluvia-field${reducedMotion ? ' is-reduced' : ''}`} ref={fieldRef}>
          <div className="lluvia-meteor" ref={meteorRef}>
            <div className={`lluvia-rock${radar ? ' lluvia-rock--compact' : ''}`} aria-hidden="true">
              <CardImage card={round.card} size={radar ? 34 : 52} alt="" />
            </div>
            {!radar && (
              <div className="lluvia-capsule">
                <p className={`lluvia-capsule__text ${sizeClass}`}>{round.card.front}</p>
              </div>
            )}
          </div>
          <div className="lluvia-progress" aria-hidden="true">
            <div className="lluvia-progress__bar" ref={progressBarRef} />
          </div>
        </div>

        {isSupported() && (
          <div className="lluvia-prompt-tools">
            <button
              className="btn-neon"
              type="button"
              aria-label="Escuchar la pregunta"
              onClick={() => {
                cancelFollowUpSpeech();
                speak(round.card.front);
              }}
            >
              🔊 Pregunta
            </button>
          </div>
        )}

        <div className="lluvia-options" role="group" aria-label="Opciones de significado">
          {round.options.map((option, index) => {
            const chosenWrong = answered && option.id === state.chosenOptionId && !option.correct;
            const statusClass = option.correct && answered
              ? ' is-correct'
              : chosenWrong
                ? ' is-wrong'
                : '';
            return (
              <button
                key={option.id}
                ref={index === 0 ? firstOptionRef : undefined}
                className={`lluvia-option${statusClass}`}
                type="button"
                disabled={answered}
                aria-label={`Opción ${index + 1}: ${option.back}`}
                onClick={() => handleChoose(option.id)}
              >
                <span className="lluvia-option__img" aria-hidden="true">
                  <CardImage card={option.card} size={40} alt="" />
                </span>
                <span className="lluvia-option__body">
                  <span className="lluvia-option__text">{option.back}</span>
                  {answered && option.correct && (
                    <span className="lluvia-option__badge">✓ Correcta</span>
                  )}
                  {chosenWrong && <span className="lluvia-option__badge">✗ Tu elección</span>}
                </span>
              </button>
            );
          })}
        </div>

        <p className="lluvia-status" role="status" aria-live="polite">{announcement}</p>

        {answered && (
          <div
            className={`card-neon lluvia-feedback${round.won ? ' is-correct' : ' is-wrong'}`}
          >
            <p style={{ margin: 0 }}>
              <span className="lluvia-feedback__icon" aria-hidden="true">
                {round.won ? '✓' : '✗'}
              </span>{' '}
              {round.won ? '¡Acertaste!' : timeout ? 'Se acabó el tiempo.' : 'Fallaste.'}{' '}
              {round.won
                ? `+${result ? result.points : 0} puntos`
                : `La respuesta correcta era «${correctOption ? correctOption.back : round.card.back}».`}
            </p>
            {isSupported() && (
              <button
                className="btn-neon"
                type="button"
                aria-label="Escuchar la respuesta correcta"
                onClick={() => {
                  cancelFollowUpSpeech();
                  speak(correctOption ? correctOption.back : round.card.back);
                }}
              >
                🔊 Respuesta
              </button>
            )}
            {state.rhythm !== 'manual' && (
              <span className="lluvia-countdown">
                Siguiente en {Math.max(1, Math.ceil((feedbackLeft || FEEDBACK_MS) / 1000))} s
              </span>
            )}
            <button
              ref={nextButtonRef}
              className="btn-neon"
              type="button"
              onClick={goNext}
            >
              {nextLabel}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
