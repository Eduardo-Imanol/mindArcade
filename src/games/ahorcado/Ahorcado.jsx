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
  reduce,
  roundsForDeck,
  sessionCardsFor,
  unresolvedCurrent,
} from './ahorcado.logic.js';

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
const GAME_ID = 'ahorcado';

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

function setupNoteFor(deck, mode, rounds, best) {
  if (!deck) return 'Elige un mazo para empezar.';
  const total = Array.isArray(deck.cards) ? deck.cards.length : 0;
  if (mode === 'arcade') return `${total} palabras · 3 vidas · Mejor marca ${best}`;
  return `${rounds} de ${total} palabras del mazo · Mejor marca ${best}`;
}

function gradeToEmit(grade, record, gameMode) {
  if (gameMode !== 'arcade') return grade.grade;
  if (!record || record.grade === 'otra-vez') return 'otra-vez';
  return record.mistakes === 0 ? 'facil' : 'otra-vez';
}

export default function Ahorcado({
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
  const ended = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;
  const selectedDeckCards = Array.isArray(selectedDeck?.cards) ? selectedDeck.cards : [];
  const maxDeckRounds = Math.min(MAX_ROUNDS, selectedDeckCards.length);
  const effectiveRounds = hasDecks
    ? Math.max(MIN_ROUNDS, Math.min(rounds, maxDeckRounds))
    : rounds;
  const roundOptions = hasDecks ? roundsForDeck(selectedDeckCards.length) : LEGACY_ROUNDS;
  const bestForDeck = bestScoreFor(best, selectedDeck?.id);
  const deckReason = hasDecks && selectedDeck ? disabledReasonFor(selectedDeck) : '';

  useEffect(() => {
    const grade = state.lastGrade;
    if (!grade || grade.seq <= emitted.current) return;
    emitted.current = grade.seq;
    const record = (state.results || []).find((entry) => entry.seq === grade.seq);
    onGrade?.(grade.cardId, gradeToEmit(grade, record, gameMode));
  }, [state, gameMode, onGrade]);

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const resetSession = () => {
    emitted.current = 0;
    exiting.current = false;
    ended.current = false;
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
  };

  const endArcade = (finalArcade) => {
    if (ended.current) return;
    ended.current = true;
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

  const startGame = () => {
    const requested = hasDecks
      ? sessionCardsFor(selectedDeckCards, { mode: gameMode, rounds: effectiveRounds })
      : (selectCards ? selectCards(rounds) : deck.slice(0, rounds)) || [];
    resetSession();
    const next = reduce(createState(), {
      type: 'start',
      rounds: gameMode === 'arcade' ? requested.length : hasDecks ? effectiveRounds : rounds,
      cards: requested,
      random,
    });
    setState(next);
    if (next.phase === 'playing') speak(next.cards[0].back);
  };

  const guess = (letter) => {
    if (state.phase !== 'playing') return;
    if (gameMode === 'arcade' && (arcade.over || ended.current)) return;
    const round = currentRound(state);
    if (!round) return;
    const before = round.mistakes;
    let next = reduce(state, { type: 'guess', letter });
    if (next === state) return;
    const nextRound = currentRound(next);
    const after = nextRound ? nextRound.mistakes : before;
    const missed = after > before;

    if (gameMode === 'arcade' && missed) {
      const nextArcade = arcadeMiss(arcade);
      setArcade(nextArcade);
      if (nextArcade.over) {
        if (next.phase === 'playing') next = reduce(next, { type: 'fail' });
        setState(next);
        endArcade(nextArcade);
        return;
      }
    }

    setState(next);
    if (next.phase === 'round-lost') speak(next.cards[next.roundIndex].front);
    if (gameMode === 'arcade' && next.phase === 'round-won' && after === 0) {
      setArcade(arcadeHit(arcade));
    }
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

  const handleNext = () => {
    const next = reduce(state, { type: 'next' });
    if (next === state) return;
    setState(next);
    if (next.phase === 'playing') speak(next.cards[next.roundIndex].back);
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

  if (hasDecks ? !selectedDeck || selectedDeckCards.length === 0 : deck.length === 0) {
    return (
      <main className="sepect-bg ahorcado-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Ahorcado</h1>
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
          pageClassName="ahorcado-page"
          title="Ahorcado"
          eyebrow="Configura tu partida"
          lead="Adivina el término letra a letra usando su significado como pista. Cada mazo es un bloque de 10 cartas."
          note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · en arcade cada letra incorrecta resta una vida.`}
          start={
            <button className="btn-neon" type="button" onClick={startGame} disabled={startDisabled}>
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
            <div className="ahorcado-setup">
              <label htmlFor="ahorcado-rounds">Rondas</label>
              <select
                id="ahorcado-rounds"
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
          <p className="ahorcado-note" role="status">
            {setupNoteFor(selectedDeck, gameMode, effectiveRounds, bestForDeck)}
          </p>
        </GameSetup>
      );
    }

    return (
      <GameSetup
        pageClassName="ahorcado-page"
        title="Ahorcado"
        lead="Adivina el término letra a letra usando su significado como pista."
        note={`${Math.min(rounds, deck.length)} rondas disponibles con las cartas de este tema.`}
        start={
          <button className="btn-neon" type="button" onClick={startGame}>
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
        <div className="ahorcado-setup">
          <label htmlFor="ahorcado-rounds">Rondas</label>
          <select
            id="ahorcado-rounds"
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
      <main className="sepect-bg ahorcado-page" style={PAGE}>
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
                <button className="btn-neon" type="button" onClick={startGame} autoFocus>
                  Repetir
                </button>
                <button
                  className="btn-neon"
                  type="button"
                  onClick={() => {
                    resetSession();
                    setState(createState());
                  }}
                >
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
    const wins = state.results.filter((result) => result.grade !== 'otra-vez').length;
    const fails = state.results.reduce((sum, result) => sum + result.mistakes, 0);
    const gained = state.results.reduce((sum, result) => sum + (XP_BY_GRADE[result.grade] || 0), 0);
    return (
      <main className="sepect-bg ahorcado-page" style={PAGE}>
        <div className="game-stage">
          <section className="result-panel" aria-labelledby="ahorcado-summary-title">
            <p className="result-panel__eyebrow">Sesión completada</p>
            <h1 id="ahorcado-summary-title" className="neon game-app-title">
              Sesión completada
            </h1>
            <p className="result-panel__live" role="status">
              {wins} de {state.total} rondas ganadas · {fails} fallos · +{gained} XP
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Rondas ganadas</dt>
                <dd>
                  {wins}/{state.total}
                </dd>
              </div>
              <div className="result-panel__stat">
                <dt>Fallos</dt>
                <dd>{fails}</dd>
              </div>
              <div className="result-panel__stat">
                <dt>XP</dt>
                <dd>+{gained}</dd>
              </div>
              {selectedDeck ? (
                <div className="result-panel__stat result-panel__stat--wide">
                  <dt>Mazo</dt>
                  <dd>
                    {selectedDeck.number} · {selectedDeck.label}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="result-panel__actions">
              <button
                className="btn-neon"
                type="button"
                onClick={() => {
                  resetSession();
                  setState(createState());
                }}
              >
                Jugar de nuevo
              </button>
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

  const round = currentRound(state);
  const card = round.card;
  const alarm = round.mistakes >= ALARM_MISTAKES;
  const canPlay = state.phase === 'playing';
  const characters = [...round.target];
  const art = renderHangman({ mistakes: round.mistakes, cardId: card.id, size: 250 });

  const lastLetter = round.usedLetters[round.usedLetters.length - 1] || null;
  const lastCorrect = lastLetter ? normalizeWord(round.target).includes(lastLetter) : false;
  const remaining = MAX_MISTAKES - round.mistakes;
  let announcement;
  if (gameMode === 'arcade') {
    if (round.won) {
      announcement =
        round.mistakes === 0
          ? '¡Palabra resuelta sin fallos!'
          : `Palabra resuelta con ${round.mistakes} ${round.mistakes === 1 ? 'fallo' : 'fallos'}.`;
    } else if (round.lost) {
      announcement = `Palabra perdida. La palabra era ${round.target}`;
    } else if (lastLetter) {
      announcement = `Letra ${lastLetter}: ${lastCorrect ? 'acierto' : 'fallo'}.`;
    } else {
      announcement = `Ronda ${round.index + 1} de ${state.total}.`;
    }
  } else {
    announcement = `${round.mistakes} de ${MAX_MISTAKES} fallos · ${remaining} intentos restantes`;
    if (canPlay && lastLetter) {
      announcement = `Letra ${lastLetter}: ${lastCorrect ? 'acierto' : 'fallo'}. ${round.mistakes} de ${MAX_MISTAKES} fallos · ${remaining} intentos restantes`;
    } else if (round.won) {
      announcement = `¡Ronda ganada! ${round.mistakes} fallos · +${XP_BY_GRADE[state.lastGrade?.grade] || 0} XP`;
    } else if (round.lost) {
      announcement = `Ronda perdida. La palabra era ${round.target}`;
    }
  }

  return (
    <main className="sepect-bg ahorcado-page" style={PAGE}>
      <div className="game-stage">
        <header className="game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {hasDecks ? `Mazo ${selectedDeck.number}` : 'Ahorcado'} ·{' '}
              {gameMode === 'arcade' ? 'Arcade' : 'Normal'}
            </p>
            <p className="game-session-progress__text">
              Ronda {round.index + 1} de {state.total}
              {gameMode !== 'arcade' ? ` · Errores ${round.mistakes}/${MAX_MISTAKES}` : ''}
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

        <div className="ahorcado-layout">
          <div
            className="ahorcado-word"
            data-testid="ahorcado-word"
            role="group"
            aria-label={`Palabra de ${characters.filter((char) => char !== ' ').length} letras`}
          >
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

          <div
            key={`${round.index}-${round.mistakes}`}
            className={`ahorcado-art${alarm ? ' is-alarm' : ''}`}
            dangerouslySetInnerHTML={{ __html: art }}
          />

          <div
            className="card-neon ahorcado-hint"
            data-testid="ahorcado-hint"
            role="group"
            aria-label="Pista"
          >
            <CardImage card={card} size={160} alt="Pista visual" />
            <span className="ahorcado-hint__label" aria-hidden="true">
              Pista
            </span>
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

        <p className="ahorcado-status" role="status" aria-live="polite">
          {announcement}
        </p>

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
                ? gameMode === 'arcade'
                  ? round.mistakes === 0
                    ? 'Sin fallos en la ronda.'
                    : `${round.mistakes} ${round.mistakes === 1 ? 'fallo' : 'fallos'} en la ronda.`
                  : `Fallos: ${round.mistakes} · +${XP_BY_GRADE[state.lastGrade?.grade] || 0} XP`
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
