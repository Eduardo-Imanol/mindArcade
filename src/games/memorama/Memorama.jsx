import React, { useEffect, useRef, useState } from 'react';
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
import {
  DIFFICULTIES,
  createState,
  pairOptionsFor,
  pendingGrades,
  reduce,
  sessionCardsFor,
} from './memorama.logic.js';

const PAGE = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  padding: '16px clamp(16px, 4vw, 32px)',
};
const GAME_ID = 'memorama';
const MIN_CARDS = 4;
const MODE_OPTIONS = [
  { id: 'normal', label: 'Normal', hint: 'Elige parejas' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · mazo completo' },
];

function disabledReasonFor(deck) {
  const availability = getDeckAvailability(
    { id: GAME_ID, status: 'available', minCards: MIN_CARDS },
    deck
  );
  if (!availability.playable && availability.reason === 'min-cards') {
    return availabilityMessage(availability);
  }
  return '';
}

function setupNoteFor(deck, mode, pairs, best) {
  if (!deck) return 'Elige un mazo para empezar.';
  const status = DECK_MASTERY_LABELS[deck.mastery] || DECK_MASTERY_LABELS.empty;
  const total = Array.isArray(deck.cards) ? deck.cards.length : 0;
  if (mode === 'arcade') return `${status} · ${total} parejas · 3 vidas · Mejor marca ${best}`;
  return `${status} · ${pairs} de ${total} parejas · Mejor marca ${best}`;
}

export default function Memorama({
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
  const [pairs, setPairs] = useState(10);
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeEnded, setArcadeEnded] = useState(false);
  const [arcadeResult, setArcadeResult] = useState(null);
  const [cards, setCards] = useState(null);
  const [state, setState] = useState(null);
  const graded = useRef(new Set());
  const ended = useRef(false);
  const exited = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;
  const selectedDeckCards = Array.isArray(selectedDeck?.cards) ? selectedDeck.cards : [];
  const pairOptions = hasDecks ? pairOptionsFor(selectedDeckCards.length) : [];
  const maxPairs = pairOptions.length
    ? pairOptions[pairOptions.length - 1].pairs
    : selectedDeckCards.length;
  const effectivePairs = hasDecks ? Math.max(1, Math.min(pairs, maxPairs)) : pairs;
  const bestForDeck = bestScoreFor(best, selectedDeck?.id);
  const deckReason = hasDecks && selectedDeck ? disabledReasonFor(selectedDeck) : '';

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const gradeCard = (cardId, grade) => {
    if (cardId === undefined || cardId === null) return;
    const key = String(cardId);
    if (graded.current.has(key)) return;
    graded.current.add(key);
    const mapped = gameMode === 'arcade' && grade !== 'otra-vez' ? 'facil' : grade;
    onGrade?.(cardId, mapped);
  };

  const gradePending = (snapshot) => {
    for (const entry of pendingGrades(snapshot)) gradeCard(entry.cardId, entry.grade);
  };

  useEffect(() => {
    const match = state && state.lastMatch;
    if (!match) return;
    gradeCard(match.cardId, match.grade);
  }, [state, gameMode, onGrade]);

  const resetSession = () => {
    graded.current = new Set();
    ended.current = false;
    exited.current = false;
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
  };

  const endArcade = (finalArcade, snapshot) => {
    if (ended.current) return;
    ended.current = true;
    const finished = arcadeFinish(finalArcade);
    setArcade(finished);
    setArcadeEnded(true);
    gradePending(snapshot);
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
    if (!selectedDeck) return;
    const requested = sessionCardsFor(selectedDeckCards, {
      mode: gameMode,
      pairs: effectivePairs,
    });
    if (requested.length === 0) return;
    resetSession();
    setCards(requested);
    setState(createState(requested, { random }));
  };

  const choose = (option = {}) => {
    resetSession();
    const requested = (selectCards ? selectCards(option.pairs) : deck.slice(0, option.pairs)) || [];
    setCards(requested);
    setState(createState(requested, { random }));
  };

  const flip = (index) => {
    if (!state) return;
    if (gameMode === 'arcade' && (arcade.over || ended.current)) return;
    const next = reduce(state, { type: 'flip', index });
    if (next === state) return;
    const tile = state.tiles[index];
    const wasRevealed = state.matched.includes(tile.cardId) || state.open.includes(index);
    setState(next);
    if (!wasRevealed) speak(tile.text);
    if (gameMode !== 'arcade') return;
    if (!next.lastMatch || next.lastMatch.seq === state.lastMatch?.seq) return;
    const nextArcade = arcadeHit(arcade);
    setArcade(nextArcade);
    if (next.complete) endArcade(arcadeFinish(nextArcade), next);
  };

  const closePair = () => {
    if (!state || !state.locked) return;
    let nextArcade = arcade;
    if (gameMode === 'arcade') {
      nextArcade = arcadeMiss(arcade);
      setArcade(nextArcade);
    }
    const next = reduce(state, { type: 'close' });
    setState(next);
    if (gameMode === 'arcade' && nextArcade.over) endArcade(nextArcade, next);
  };

  const handleExit = () => {
    if (exited.current) return;
    exited.current = true;
    if (state) gradePending(state);
    backToTopic();
  };

  const handleReplay = () => {
    resetSession();
    setCards(null);
    setState(null);
  };

  if (hasDecks ? !selectedDeck || selectedDeckCards.length === 0 : deck.length === 0) {
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Memorama</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>
            Volver al tema
          </button>
        </div>
      </main>
    );
  }

  if (!state) {
    if (hasDecks) {
      const startDisabled =
        !selectedDeck || Boolean(deckReason) || selectedDeckCards.length < MIN_CARDS;
      return (
        <GameSetup
          pageClassName="memorama-page"
          title="Memorama"
          eyebrow="Configura tu partida"
          lead="Empareja cada término con su significado. Arcade usa el mazo completo y tres vidas."
          note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · cada pareja fallida resta una vida en arcade.`}
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
            <div className="memorama-pairs">
              <label htmlFor="memorama-pairs">Parejas</label>
              <select
                id="memorama-pairs"
                value={effectivePairs}
                onChange={(event) => setPairs(Number(event.target.value))}
              >
                {pairOptions.map((option) => (
                  <option key={option.id} value={option.pairs}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <p className="memorama-note" role="status">
            {setupNoteFor(selectedDeck, gameMode, effectivePairs, bestForDeck)}
          </p>
        </GameSetup>
      );
    }

    return (
      <GameSetup
        pageClassName="memorama-page"
        title="Memorama"
        lead="Elige la dificultad: empareja cada término con su significado."
        note="Cada dificultad ajusta cuántas parejas se reparten en el tablero."
        actions={
          <>
            <SoundToggle />
            <button className="btn-neon game-setup__exit" type="button" onClick={onExit}>
              Salir
            </button>
          </>
        }
      >
        <div className="memorama-setup">
          {DIFFICULTIES.map((option) => (
            <button key={option.id} className="btn-neon" type="button" onClick={() => choose(option)}>
              {`${option.label} · ${Math.min(option.pairs, deck.length)} parejas`}
            </button>
          ))}
        </div>
      </GameSetup>
    );
  }

  if (gameMode === 'arcade' && arcadeEnded) {
    const resultBest = Number(arcadeResult?.best ?? Math.max(bestForDeck, arcade.score));
    const isRecord = Boolean(arcadeResult?.isRecord ?? arcade.score > bestForDeck);
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
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
                    setCards(null);
                    setState(null);
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

  if (state.complete) {
    const totalPairs = state.matched.length;
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <section className="result-panel" aria-labelledby="memorama-summary-title">
            <p className="result-panel__eyebrow">Sesión completada</p>
            <h1 id="memorama-summary-title" className="neon game-app-title">
              Sesión completada
            </h1>
            <p className="result-panel__live" role="status">
              {totalPairs} pares encontrados
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Parejas</dt>
                <dd>
                  {totalPairs}/{state.pairs}
                </dd>
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
              {isSupported() && (
                <button
                  className="btn-neon"
                  type="button"
                  onClick={() => speak(`Sesión completada. ${totalPairs} pares encontrados.`)}
                  aria-label="Escuchar resumen"
                >
                  🔊 Resumen
                </button>
              )}
              <button className="btn-neon" type="button" onClick={handleReplay}>
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

  const announcement = state.locked
    ? 'Las cartas no coinciden'
    : state.lastMatch
      ? '¡Par encontrado!'
      : '';

  const openTiles = state.open.map((index) => state.tiles[index]);
  const infoKey = openTiles.length ? openTiles.map((tile) => tile.key).join('|') : 'empty';
  const progress = state.pairs > 0 ? state.matched.length / state.pairs : 0;

  return (
    <main className="sepect-bg memorama-page" style={PAGE}>
      <div className="game-stage memorama-session">
        <header className="game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {hasDecks ? `Mazo ${selectedDeck.number}` : 'Memorama'} ·{' '}
              {gameMode === 'arcade' ? 'Arcade' : 'Normal'}
            </p>
            <p className="game-session-progress__text">
              {state.matched.length} / {state.pairs} parejas
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

        <div className="game-session-progress">
          <ProgressBar
            value={progress}
            label={`Parejas encontradas: ${state.matched.length} de ${state.pairs}`}
          />
        </div>

        <p aria-live="polite" role="status" style={{ minHeight: 20 }}>
          {announcement}
        </p>

        <div className="memorama-board">
          {state.tiles.map((tile, index) => {
            const matched = state.matched.includes(tile.cardId);
            const revealed = matched || state.open.includes(index);
            const card =
              cards.find((entry) => entry.id === tile.cardId) || {
                id: tile.cardId,
                front: tile.text,
              };
            const faceLabel = tile.face === 'front' ? 'Término' : 'Significado';
            const label = matched
              ? `${faceLabel}: ${tile.text}. Emparejada`
              : revealed
                ? `${faceLabel}: ${tile.text}`
                : 'Carta boca abajo';
            return (
              <div className="memorama-cell" key={tile.key}>
                <button
                  type="button"
                  className={`memorama-tile${revealed ? ' is-open' : ''}${matched ? ' is-matched' : ''}`}
                  data-card-id={tile.cardId}
                  data-face={tile.face}
                  data-open={revealed ? 'true' : 'false'}
                  data-matched={matched ? 'true' : 'false'}
                  data-text={tile.text}
                  aria-label={label}
                  aria-pressed={revealed}
                  onClick={() => flip(index)}
                >
                  <span className="memorama-tile__front" aria-hidden={!revealed}>
                    <span className="memorama-tile__img">
                      <CardImage card={card} size={56} />
                    </span>
                  </span>
                  <span className="memorama-tile__cover" aria-hidden="true">
                    ?
                  </span>
                </button>
                {revealed && isSupported() && (
                  <button
                    type="button"
                    className="memorama-speak"
                    aria-label={`Escuchar ${tile.text}`}
                    onClick={() => speak(tile.text)}
                  >
                    🔊
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="memorama-info" role="region" aria-label="Texto de la carta seleccionada">
          {openTiles.length === 0 ? (
            <p className="memorama-info__hint">Toca una carta para leer su texto</p>
          ) : (
            <div className="memorama-info__inner" key={infoKey}>
              {openTiles.map((tile) => (
                <div className="memorama-info__entry" key={tile.key}>
                  <span className="memorama-info__label">
                    {tile.face === 'front' ? 'Término' : 'Significado'}
                  </span>
                  <p className="memorama-info__text">{tile.text}</p>
                </div>
              ))}
            </div>
          )}
          {state.locked && (
            <button
              type="button"
              className="btn-neon memorama-info__flip"
              onClick={closePair}
              aria-label="Voltear de nuevo las cartas"
            >
              🔄 Voltear de nuevo
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
