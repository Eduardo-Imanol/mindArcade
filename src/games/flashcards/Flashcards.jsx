import React, { useEffect, useReducer, useRef, useState } from 'react';
import CardImage from '../../components/CardImage.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { createState, reduce } from './flashcards.logic.js';

const GRADES = [
  { id: 'otra-vez', label: 'Otra vez' },
  { id: 'dificil', label: 'Difícil' },
  { id: 'facil', label: 'Fácil' },
];

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };

function shuffleCards(cards, random) {
  const list = [...cards];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

function studiedSet(deckEntry) {
  return new Set((deckEntry?.studiedIds || []).map((id) => String(id)));
}

function pendingCards(deckEntry) {
  const studied = studiedSet(deckEntry);
  return (deckEntry?.cards || []).filter((card, index) =>
    !studied.has(String(card?.id ?? `index:${index}`))
  );
}

function deckStatus(deckEntry) {
  if (!deckEntry) return { label: 'Sin mazos', cta: 'Elegir mazo', tone: 'empty' };
  if (deckEntry.complete) return { label: 'Completado', cta: 'Repasar mazo', tone: 'complete' };
  if (deckEntry.studied > 0) return { label: 'En curso', cta: 'Reanudar mazo', tone: 'progress' };
  return { label: 'Sin empezar', cta: 'Empezar mazo', tone: 'new' };
}

export default function Flashcards({ deck = [], decks, onGrade, onExit, onBackToTopic, random = Math.random } = {}) {
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const [selectedDeckId, setSelectedDeckId] = useState(() => (hasDecks ? decks[0].id : null));
  const [state, dispatch] = useReducer(
    (current, action) => reduce(current, action, deck),
    undefined,
    () => (hasDecks ? createState([], { phase: 'setup' }) : createState(deck))
  );
  const emittedRef = useRef(new Set());
  const exitingRef = useRef(false);

  useEffect(() => () => stopSpeech(), []);

  const selectedDeck = hasDecks
    ? decks.find((entry) => entry.id === selectedDeckId) || decks[0]
    : null;

  useEffect(() => {
    if (state.phase === 'setup' || state.complete) return undefined;
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
  }, [state.complete, state.phase]);

  const beginDeck = (deckEntry, { review = false } = {}) => {
    if (!deckEntry) return;
    const pending = pendingCards(deckEntry);
    const source = review || pending.length === 0 ? deckEntry.cards : pending;
    emittedRef.current = new Set();
    exitingRef.current = false;
    setSelectedDeckId(deckEntry.id);
    dispatch({
      type: 'start',
      deck: shuffleCards(source, random),
      phase: 'playing',
      mode: review || pending.length === 0 ? 'review' : 'resume',
    });
  };

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const handleReset = () => {
    emittedRef.current = new Set();
    exitingRef.current = false;
    if (hasDecks) beginDeck(selectedDeck, { review: true });
    else dispatch({ type: 'reset' });
  };

  const handleChooseDeck = () => {
    emittedRef.current = new Set();
    dispatch({ type: 'start', deck: [], phase: 'setup' });
  };

  const handleExit = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    backToTopic();
  };

  const activeDeck = hasDecks ? state.sessionDeck : deck;
  const card = activeDeck[state.index];

  const handleGrade = (grade) => {
    if (!card) return;
    const key = String(card.id);
    if (emittedRef.current.has(key)) return;
    emittedRef.current.add(key);
    const result = onGrade?.(card.id, grade);
    dispatch({ type: 'grade', grade, cardId: card.id, gained: result?.gained });
  };

  if (hasDecks && state.phase === 'setup') {
    const status = deckStatus(selectedDeck);
    // const percent = selectedDeck?.total
    //   ? Math.round((selectedDeck.done / selectedDeck.total) * 100)
    //   : 0;
    return (
      <GameSetup
        pageClassName="flashcards-page"
        title="Flashcards"
        eyebrow="Elige tu mazo"
        lead="Estudia las cartas en bloques de 10. Tu progreso se guarda con la repetición espaciada."
        note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · las cartas pendientes se barajan dentro del mazo.`}
        start={
          <button className="btn-neon" type="button" onClick={() => beginDeck(selectedDeck)}>
            {status.cta}
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
        <div className="flashcards-setup" role="group" aria-label="Mazos de flashcards">
          {decks.map((entry) => {
            const entryStatus = deckStatus(entry);
            const entryPercent = entry.total ? Math.round((entry.studied / entry.total) * 100) : 0;
            const selected = entry.id === selectedDeck?.id;
            return (
              <button
                key={entry.id}
                type="button"
                className={`flashcards-deck${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                aria-label={`Mazo ${entry.number}, cartas ${entry.label}, ${entry.studied} de ${entry.total} estudiadas, ${entryStatus.label}`}
                onClick={() => setSelectedDeckId(entry.id)}
              >
                <span className="flashcards-deck__head">
                  <span className="flashcards-deck__title">Mazo {entry.number}</span>
                  <span className={`flashcards-deck__status is-${entryStatus.tone}`}>
                    {entryStatus.label}
                  </span>
                </span>
                <span className="flashcards-deck__meta">
                  Cartas {entry.label} · {entry.studied}/{entry.total} estudiadas · {entry.pending}{' '}
                  {entry.pending === 1 ? 'pendiente' : 'pendientes'}
                </span>
                <span className="flashcards-deck__bar" aria-hidden="true">
                  <span style={{ width: `${entryPercent}%` }} />
                </span>
              </button>
            );
          })}
        </div>
        <p className="flashcards-setup__hint" role="status">
          {selectedDeck
            ? `Mazo ${selectedDeck.number} seleccionado: ${status.label.toLowerCase()}.`
            : 'Elige un mazo para empezar.'}
        </p>
      </GameSetup>
    );
  }

  if (hasDecks && !selectedDeck) {
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Flashcards</h1>
          <p>Este tema no tiene cartas todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (activeDeck.length === 0) {
    return (
      <main className="sepect-bg" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Flashcards</h1>
          <p>Este tema no tiene cartas todavía.</p>
          <button className="btn-neon" type="button" onClick={backToTopic}>Volver al tema</button>
        </div>
      </main>
    );
  }

  if (state.complete) {
    const nextDeck = hasDecks
      ? decks.find((entry) => entry.number === selectedDeck.number + 1)
      : null;
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Sesión completada</h1>
          {hasDecks ? (
            <p role="status">
              Mazo {selectedDeck.number} ({selectedDeck.label}) completado · {state.correct} correctas ·{' '}
              {state.wrong} fallos · +{state.gained} XP
            </p>
          ) : (
            <p role="status">
              {state.correct} correctas · {state.wrong} fallos · +{state.gained} XP
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {hasDecks && nextDeck ? (
              <button className="btn-neon" type="button" onClick={() => beginDeck(nextDeck)}>
                Siguiente mazo
              </button>
            ) : null}
            <button className="btn-neon" type="button" onClick={handleReset}>
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
        </div>
      </main>
    );
  }

  return (
    <main className="sepect-bg flashcards-page" style={PAGE}>
      <div className="game-stage">
        <h1 className="neon game-app-title" style={{ margin: '0 0 8px' }}>Flashcards</h1>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0 }}>
            {hasDecks ? `Mazo ${selectedDeck.number} · ` : ''}Carta {state.index + 1} de {activeDeck.length}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>Salir</button>
          </div>
        </header>
        <button
          type="button"
          className="card-neon"
          onClick={() => dispatch({ type: 'flip' })}
          aria-label={`Carta ${state.index + 1} de ${activeDeck.length}: ${card.front}. ${state.flipped ? 'Mostrando significado' : 'Pulsa para voltear'}`}
          style={{
            width: '100%',
            marginTop: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          <CardImage card={card} size={128} fill />
          <span style={{ fontSize: 20, fontWeight: 700 }}>{card.front}</span>
          {state.flipped && <span aria-live="polite">{card.back}</span>}
        </button>
        {isSupported() && (
          <button
            className="btn-neon"
            type="button"
            style={{ marginTop: 8 }}
            aria-label="Escuchar la carta"
            onClick={() => speak(state.flipped ? `${card.front}. ${card.back}` : card.front)}
          >
            🔊 Escuchar
          </button>
        )}
        <p style={{ opacity: 0.75, fontSize: 13 }}>
          Toca la carta o pulsa Espacio/Enter para voltear · dificultad: {card.difficulty}
        </p>
        {state.flipped && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GRADES.map((grade) => (
              <button key={grade.id} className="btn-neon" type="button" onClick={() => handleGrade(grade.id)}>
                {grade.label}
              </button>
            ))}
          </div>
        )}
        <nav style={{ display: 'flex', gap: 8, marginTop: 12 }} aria-label="Navegación de cartas">
          <button className="btn-neon" type="button" onClick={() => dispatch({ type: 'prev' })} disabled={state.index === 0}>
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
      </div>
    </main>
  );
}
