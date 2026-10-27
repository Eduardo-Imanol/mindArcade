import React, { useEffect, useReducer, useRef, useState } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import CardImage from '../../components/CardImage.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { isSupported, speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { getDeckAvailability } from '../availability.js';
import { createState, reduce } from './flashcards.logic.js';

const GRADES = [
  { id: 'otra-vez', label: 'Otra vez' },
  { id: 'dificil', label: 'Difícil' },
  { id: 'facil', label: 'Fácil' },
];

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const GAME_ID = 'flashcards';

function shuffleCards(cards, random) {
  const list = Array.isArray(cards) ? [...cards] : [];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

function deckSummary(deckEntry) {
  if (!deckEntry) return { label: 'Sin mazos', cta: 'Elegir mazo' };
  const mastered = deckEntry.mastery === 'aprendida';
  const reviewing = deckEntry.mastery === 'repasar';
  const newDeck = deckEntry.mastery === 'no-aprendida';
  if (mastered) return { label: 'Aprendida', cta: 'Repasar mazo' };
  if (reviewing) return { label: 'Repasar', cta: 'Repasar mazo' };
  if (newDeck) return { label: 'No aprendida', cta: 'Empezar mazo' };
  if (deckEntry.complete) return { label: 'Completado', cta: 'Repasar mazo' };
  if (deckEntry.studied > 0 && deckEntry.pending > 0) return { label: 'En curso', cta: 'Reanudar mazo' };
  if (deckEntry.studied > 0) return { label: 'Completado', cta: 'Repasar mazo' };
  return { label: 'Sin empezar', cta: 'Empezar mazo' };
}

function disabledReasonFor(deck) {
  const availability = getDeckAvailability({ id: GAME_ID, minCards: 1 }, deck);
  if (!availability.playable && availability.reason === 'min-cards') return availability.message;
  return '';
}

export default function Flashcards({
  deck = [],
  decks,
  best,
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
  const [state, dispatch] = useReducer(
    (current, action) => reduce(current, action, hasDecks ? [] : deck),
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
    if (state.phase === 'setup' || state.complete || arcade.over) return undefined;
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
  }, [state.complete, state.phase, arcade.over]);

  const beginDeck = (deckEntry, { review = false } = {}) => {
    if (!deckEntry) return;
    const source = Array.isArray(deckEntry.cards) ? deckEntry.cards : [];
    emittedRef.current = new Set();
    exitingRef.current = false;
    setSelectedDeckId(deckEntry.id);
    setArcadeEnded(false);
    setArcadeResult(null);
    if (gameMode === 'arcade') {
      setArcade(createArcade());
    }
    dispatch({
      type: 'start',
      deck: shuffleCards(source, random),
      phase: 'playing',
      mode: gameMode === 'arcade' ? 'arcade' : review ? 'review' : 'resume',
    });
  };

  const backToTopic = () => {
    if (onBackToTopic) onBackToTopic();
    else onExit?.();
  };

  const handleReset = () => {
    emittedRef.current = new Set();
    exitingRef.current = false;
    setArcadeEnded(false);
    setArcadeResult(null);
    if (gameMode === 'arcade') {
      setArcade(createArcade());
      if (hasDecks && selectedDeck) {
        dispatch({
          type: 'start',
          deck: shuffleCards(selectedDeck.cards, random),
          phase: 'playing',
          mode: 'arcade',
        });
        return;
      }
    }
    if (hasDecks && selectedDeck) beginDeck(selectedDeck, { review: true });
    else dispatch({ type: 'reset' });
  };

  const handleChooseDeck = () => {
    emittedRef.current = new Set();
    exitingRef.current = false;
    setGameMode('normal');
    setArcade(createArcade());
    setArcadeEnded(false);
    setArcadeResult(null);
    dispatch({ type: 'start', deck: [], phase: 'setup' });
  };

  const handleExit = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    backToTopic();
  };

  const activeDeck = hasDecks ? state.sessionDeck : deck;
  const card = activeDeck[state.index];

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

  const handleGrade = (grade) => {
    if (!card) return;
    if (gameMode === 'arcade' && arcade.over) return;
    const key = String(card.id);
    if (emittedRef.current.has(key)) return;
    emittedRef.current.add(key);

    let nextArcade = arcade;
    if (gameMode === 'arcade') {
      if (grade === 'otra-vez') {
        nextArcade = arcadeMiss(arcade);
      } else {
        nextArcade = arcadeHit(arcade);
      }
      setArcade(nextArcade);
    }

    const gradeToEmit = gameMode === 'arcade' ? (grade === 'otra-vez' ? 'otra-vez' : 'facil') : grade;
    const result = onGrade?.(card.id, gradeToEmit);
    dispatch({ type: 'grade', grade: gradeToEmit, cardId: card.id, gained: result?.gained });

    if (gameMode === 'arcade' && arcadeMiss(arcade).lives !== arcade.lives && arcadeMiss(arcade).over) {
      // miss just caused over
    }
  };

  useEffect(() => {
    if (gameMode !== 'arcade') return;
    if (arcadeEnded) return;
    if (arcade.over) {
      endArcade(arcade);
      return;
    }
    if (hasDecks && selectedDeck && state.complete) {
      const finished = arcadeFinish(arcade);
      if (!finished.completed) return;
      endArcade(finished);
    }
  }, [gameMode, arcade, arcadeEnded, state.complete, hasDecks, selectedDeck]);

  if (hasDecks && state.phase === 'setup') {
    const summary = deckSummary(selectedDeck);
    const bestForDeck = typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id];
    return (
      <GameSetup
        pageClassName="flashcards-page"
        title="Flashcards"
        eyebrow="Elige tu mazo"
        lead="Estudia las cartas en bloques de 10. Tu progreso se guarda con la repetición espaciada."
        note={`${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'} de este tema · el mazo se usa completo en partida.`}
        start={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-neon" type="button" onClick={() => { setGameMode('normal'); if (selectedDeck) beginDeck(selectedDeck); }}>
              Normal · {summary.cta}
            </button>
            <button className="btn-neon" type="button" onClick={() => { setGameMode('arcade'); if (selectedDeck) beginDeck(selectedDeck); }}>
              Arcade · 3 vidas
            </button>
          </div>
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
        <DeckPicker
          decks={decks}
          selectedDeckId={selectedDeck?.id}
          onSelect={(id) => setSelectedDeckId(id)}
          best={best}
          disabledReason={(deck) => disabledReasonFor(deck)}
          gameId={GAME_ID}
          label="Elige tu mazo"
        />
        <p className="flashcards-setup__hint" role="status">
          {selectedDeck
            ? `Mazo ${selectedDeck.number} seleccionado: ${summary.label.toLowerCase()}. Mejor marca arcade: ${bestForDeck || 0}`
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
          <button className="btn-neon" type="button" onClick={backToTopic}>
            Volver al tema
          </button>
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
          <button className="btn-neon" type="button" onClick={backToTopic}>
            Volver al tema
          </button>
        </div>
      </main>
    );
  }

  if (gameMode === 'arcade' && arcadeEnded) {
    const bestForDeck = typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id] || 0;
    const isRecord = arcadeResult?.isRecord || arcade.score > bestForDeck;
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Arcade terminado</h1>
          <p role="status">
            Puntuación {arcade.score} · Aciertos {arcade.correct} · Fallos {arcade.wrong} · Vidas restantes {arcade.lives}
          </p>
          <p role="status">{isRecord ? '¡Nuevo récord!' : `Mejor marca: ${Math.max(bestForDeck, arcade.score)}`}</p>
          {hasDecks ? <p>Mazo {selectedDeck.number} ({selectedDeck.label})</p> : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn-neon" type="button" onClick={handleReset}>
              Repetir
            </button>
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

  if (state.complete && gameMode !== 'arcade') {
    const nextDeck = hasDecks ? decks.find((entry) => entry.number === selectedDeck.number + 1) : null;
    return (
      <main className="sepect-bg flashcards-page" style={PAGE}>
        <div className="game-stage">
          <h1 className="neon game-app-title">Sesión completada</h1>
          {hasDecks ? (
            <p role="status">
              Mazo {selectedDeck.number} ({selectedDeck.label}) completado · {state.correct} correctas · {state.wrong} fallos · +{state.gained} XP
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
        <h1 className="neon game-app-title" style={{ margin: '0 0 8px' }}>
          Flashcards
        </h1>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ margin: 0 }}>
            {hasDecks ? `Mazo ${selectedDeck.number} · ` : ''}
            {gameMode === 'arcade' ? 'Arcade' : 'Normal'} · Carta {state.index + 1} de {activeDeck.length}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={handleExit}>
              Salir
            </button>
          </div>
        </header>
        {gameMode === 'arcade' ? (
          <ArcadeHud lives={arcade.lives} score={arcade.score} streak={arcade.streak} best={typeof best === 'function' ? best(selectedDeck?.id) : best?.[selectedDeck?.id]} />
        ) : null}
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
          {state.flipped ? <span aria-live="polite">{card.back}</span> : null}
        </button>
        {isSupported() ? (
          <button
            className="btn-neon"
            type="button"
            style={{ marginTop: 8 }}
            aria-label="Escuchar la carta"
            onClick={() => speak(state.flipped ? `${card.front}. ${card.back}` : card.front)}
          >
            Escuchar
          </button>
        ) : null}
        <p style={{ opacity: 0.75, fontSize: 13 }}>
          Toca la carta o pulsa Espacio/Enter para voltear · dificultad: {card.difficulty}
        </p>
        {state.flipped ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GRADES.map((grade) => (
              <button key={grade.id} className="btn-neon" type="button" onClick={() => handleGrade(grade.id)}>
                {grade.id === 'otra-vez' ? 'Otra vez' : grade.id === 'dificil' ? 'Difícil' : 'Fácil'}
              </button>
            ))}
          </div>
        ) : null}
        {gameMode !== 'arcade' ? (
          <nav style={{ display: 'flex', gap: 8, marginTop: 12 }} aria-label="Navegación de cartas">
            <button className="btn-neon" type="button" onClick={() => dispatch({ type: 'prev' })} disabled={state.index === 0}>
              Anterior
            </button>
            <button className="btn-neon" type="button" onClick={() => dispatch({ type: 'next' })} disabled={state.index >= activeDeck.length - 1}>
              Siguiente
            </button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
