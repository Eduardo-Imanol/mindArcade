import React, { useEffect, useRef, useState } from 'react';
import CardImage from '../../components/CardImage.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak } from '../../core/audio/tts.js';
import { DIFFICULTIES, createState, pendingGrades, reduce } from './memorama.logic.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const CLOSE_DELAY_MS = 1000;

export default function Memorama({ deck = [], selectCards, onGrade, onExit } = {}) {
  const [cards, setCards] = useState(null);
  const [state, setState] = useState(null);
  const emitted = useRef(0);

  useEffect(() => {
    const match = state && state.lastMatch;
    if (match && match.seq > emitted.current) {
      emitted.current = match.seq;
      onGrade?.(match.cardId, match.grade);
    }
  }, [state, onGrade]);

  useEffect(() => {
    if (!state || !state.locked) return undefined;
    const id = setTimeout(() => setState((prev) => reduce(prev, { type: 'close' })), CLOSE_DELAY_MS);
    return () => clearTimeout(id);
  }, [state]);

  const choose = (option) => {
    const requested = (selectCards ? selectCards(option.pairs) : deck.slice(0, option.pairs)) || [];
    emitted.current = 0;
    setCards(requested);
    setState(createState(requested, { random: Math.random }));
  };

  const flip = (index) => {
    if (!state) return;
    const next = reduce(state, { type: 'flip', index });
    if (next === state) return;
    const tile = state.tiles[index];
    const wasRevealed = state.matched.includes(tile.cardId) || state.open.includes(index);
    setState(next);
    if (!wasRevealed) speak(tile.text);
  };

  const handleExit = () => {
    if (state) {
      for (const entry of pendingGrades(state)) onGrade?.(entry.cardId, entry.grade);
    }
    onExit?.();
  };

  if (deck.length === 0) {
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Memorama</h1>
          <p>Este tema no tiene cartas suficientes todavía.</p>
          <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Memorama</h1>
          <p>Elige la dificultad: empareja cada término con su significado.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DIFFICULTIES.map((option) => (
              <button key={option.id} className="btn-neon" type="button" onClick={() => choose(option)}>
                {option.label} · {Math.min(option.pairs, deck.length)} parejas
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={onExit}>
              Salir
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (state.complete) {
    return (
      <main className="sepect-bg memorama-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon" style={{ fontSize: 24 }}>Sesión completada</h1>
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
                  aria-label={label}
                  aria-pressed={revealed}
                  onClick={() => flip(index)}
                >
                  <span className="memorama-tile__front" aria-hidden={!revealed}>
                    <CardImage card={card} size={56} />
                    <span className="memorama-tile__text">{tile.text}</span>
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
      </div>
    </main>
  );
}
