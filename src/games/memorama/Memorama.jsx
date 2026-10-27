import React, { useEffect, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { getDeckAvailability } from '../availability.js';
import { DIFFICULTIES, createState, pendingGrades, reduce } from './memorama.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const GAME_ID = 'memorama';

function disabledReasonFor(deck) {
  const availability = getDeckAvailability({ id: GAME_ID, minCards: 2 }, deck);
  if (!availability.playable && availability.reason === 'min-cards') return availability.message;
  return '';
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
} = {}) {
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const [selectedDeckId, setSelectedDeckId] = useState(() => (hasDecks ? decks[0].id : null));
  const [gameMode, setGameMode] = useState('normal');
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeEnded, setArcadeEnded] = useState(false);
  const [arcadeResult, setArcadeResult] = useState(null);
  const [cards, setCards] = useState(null);
  const [state, setState] = useState(null);
  const emitted = useRef(0);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks ? decks.find((entry) => entry.id === selectedDeckId) || decks[0] : null;

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

  useEffect(() => {
    const match = state && state.lastMatch;
    if (match && match.seq > emitted.current) {
      emitted.current = match.seq;
      onGrade?.(match.cardId, gameMode === 'arcade' ? (match.grade === 'otra-vez' ? 'otra-vez' : 'facil') : match.grade);
    }
  }, [state, onGrade, gameMode]);

  useEffect(() => {
    if (gameMode !== 'arcade') return;
    if (arcadeEnded) return;
    if (state && state.mismatch && state.mismatch.seq && state.phase === 'mismatch') {
      // mismatch will close via closePair but we can track
    }
  }, [gameMode, arcadeEnded, state]);

  const closePair = () => {
    if (gameMode === 'arcade' && state && state.phase === 'mismatch' && !arcade.over) {
      const miss = arcadeMiss(arcade);
      setArcade(miss);
      if (miss.over) endArcade(miss);
    }
    setState((prev) => {
      const next = reduce(prev, { type: 'close' });
      if (gameMode === 'arcade' && next && next.complete && !arcade.over) {
        endArcade(arcadeFinish(arcade));
      }
      return next;
    });
  };

  const choose = (option = {}) => {
    emitted.current = 0;
    setArcadeEnded(false);
    setArcadeResult(null);
    let requested = [];
    if (hasDecks && selectedDeck) {
      if (gameMode === 'arcade') {
        requested = Array.isArray(selectedDeck.cards) ? selectedDeck.cards.slice(0, 10) : [];
        setArcade(createArcade());
      } else {
        const pairs = Math.min(option.pairs || 10, selectedDeck.cards.length);
        requested = (selectCards ? selectCards(pairs) : selectedDeck.cards.slice(0, pairs)) || [];
      }
    } else {
      requested = (selectCards ? selectCards(option.pairs) : deck.slice(0, option.pairs)) || [];
    }
    setCards(requested);
    setState(createState(requested, { random: Math.random }));
  };

  const flip = (index) => {
    if (!state) return;
    if (gameMode === 'arcade' && arcade.over) return;
    const next = reduce(state, { type: 'flip', index });
    if (next === state) return;
    const tile = state.tiles[index];
    const wasRevealed = state.matched.includes(tile.cardId) || state.open.includes(index);
    setState(next);
    if (!wasRevealed) speak(tile.text);
    if (gameMode === 'arcade' && next.phase === 'match' && next.lastMatch && next.lastMatch.seq !== state.lastMatch?.seq) {
      setArcade((current) => arcadeHit(current));
    }
  };

  const handleExit = () => {
    if (state) {
      for (const entry of pendingGrades(state)) onGrade?.(entry.cardId, gameMode === 'arcade' ? (entry.grade === 'otra-vez' ? 'otra-vez' : 'facil') : entry.grade);
    }
    backToTopic();
  };

  if (deck.length === 0) {
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Memorama</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (!state) {
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

  if (state.complete) {
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Sesión completada</h1>
          <p role="status">{state.matched.length} pares encontrados</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {isSupported() && (
              <button
                className="btn-neon"
                type="button"
                onClick={() => speak(`Sesión completada. ${state.matched.length} pares encontrados.`)}
                aria-label="Escuchar resumen"
              >
                🔊 Resumen
              </button>
            )}
            <button
              className="btn-neon"
              type="button"
              onClick={() => {
                setCards(null);
                setState(null);
              }}
            >
              Jugar de nuevo
            </button>
            <button className="btn-neon" type="button" onClick={handleExit}>Volver al tema</button>
            <SoundToggle />
          </div>
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

  return (
    <main className="sepect-bg memorama-page" style={PAGE}>
      <div className="game-stage">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0 }}>{state.matched.length} / {state.pairs} pares</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>
        <p aria-live="polite" role="status" style={{ minHeight: 20 }}>{announcement}</p>
        <div className="memorama-board">
          {state.tiles.map((tile, index) => {
            const matched = state.matched.includes(tile.cardId);
            const revealed = matched || state.open.includes(index);
            const card = cards.find((entry) => entry.id === tile.cardId) || { id: tile.cardId, front: tile.text };
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
                  <span className="memorama-tile__cover" aria-hidden="true">?</span>
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
                  <span className="memorama-info__label">{tile.face === 'front' ? 'Término' : 'Significado'}</span>
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
