import React, { useEffect, useReducer } from 'react';
import CardImage from '../../components/CardImage.jsx';
import { createState, reduce } from './flashcards.logic.js';

const GRADES = [
  { id: 'otra-vez', label: 'Otra vez' },
  { id: 'dificil', label: 'Difícil' },
  { id: 'facil', label: 'Fácil' },
];

const PAGE = { minHeight: '100vh', padding: 16, maxWidth: 720, margin: '0 auto' };

export default function Flashcards({ deck = [], onGrade, onExit } = {}) {
  const [state, dispatch] = useReducer((s, a) => reduce(s, a, deck), deck, createState);

  useEffect(() => {
    if (state.complete) return undefined;
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
  }, [state.complete]);

  const card = deck[state.index];

  const handleGrade = (grade) => {
    const result = onGrade?.(card?.id, grade);
    dispatch({ type: 'grade', grade, gained: result?.gained });
  };

  if (deck.length === 0) {
    return (
      <main className="sepect-bg" style={PAGE}>
        <h1 className="neon" style={{ fontSize: 24 }}>Flashcards</h1>
        <p>Este tema no tiene cartas todavía.</p>
        <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
      </main>
    );
  }

  if (state.complete) {
    return (
      <main className="sepect-bg" style={PAGE}>
        <h1 className="neon" style={{ fontSize: 24 }}>Sesión completada</h1>
        <p role="status">
          {state.correct} correctas · {state.wrong} fallos · +{state.gained} XP
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn-neon" type="button" onClick={() => dispatch({ type: 'reset' })}>Repasar de nuevo</button>
          <button className="btn-neon" type="button" onClick={onExit}>Volver al tema</button>
        </div>
      </main>
    );
  }

  return (
    <main className="sepect-bg" style={PAGE}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <p style={{ margin: 0 }}>Carta {state.index + 1} de {deck.length}</p>
        <button className="btn-neon" type="button" onClick={onExit}>Salir</button>
      </header>
      <button
        type="button"
        className="card-neon"
        onClick={() => dispatch({ type: 'flip' })}
        aria-label={`Carta ${state.index + 1} de ${deck.length}: ${card.front}. ${state.flipped ? 'Mostrando significado' : 'Pulsa para voltear'}`}
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
        <CardImage card={card} size={128} />
        <span style={{ fontSize: 20, fontWeight: 700 }}>{card.front}</span>
        {state.flipped && <span aria-live="polite">{card.back}</span>}
      </button>
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
          disabled={state.index >= deck.length - 1}
        >
          Siguiente
        </button>
      </nav>
    </main>
  );
}
