import React, { useEffect, useMemo, useState } from 'react';
import {
  addPiece,
  canCheck,
  isCorrectOrder,
  movePiece,
  pieceValidation,
  removePiece,
} from './ordena-codigo.logic.js';

function codeLabel(piece) {
  return piece.code.replace(/\s+/g, ' ').trim();
}

export default function OrdenaCodigo({ exercise, result, onResult } = {}) {
  const validation = useMemo(() => pieceValidation(exercise), [exercise]);
  const pieces = validation.pieces;
  const [order, setOrder] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const exerciseId = exercise?.id ?? '';

  useEffect(() => {
    setOrder([]);
    setAnnouncement('');
  }, [exerciseId]);

  if (!validation.ok) {
    return (
      <p className="ordena-empty" role="alert">
        {validation.error}
      </p>
    );
  }

  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  const placed = new Set(order);
  const bank = pieces.filter((piece) => !placed.has(piece.id));
  const answered = Boolean(result);
  const ready = canCheck(exercise, order);
  const showSolution = answered && !result.correct;

  const add = (pieceId) => {
    if (answered) return;
    const next = addPiece(exercise, order, pieceId);
    if (!next.added) return;
    setOrder(next.order);
    setAnnouncement('Pieza añadida al final. Usa las flechas para reordenar.');
  };

  const remove = (index) => {
    if (answered) return;
    const next = removePiece(order, index);
    if (!next.removed) return;
    setOrder(next.order);
    setAnnouncement('Pieza devuelta al banco.');
  };

  const move = (index, delta) => {
    if (answered) return;
    const next = movePiece(order, index, delta);
    if (!next.moved) return;
    setOrder(next.order);
    setAnnouncement(delta < 0 ? 'Pieza movida hacia arriba.' : 'Pieza movida hacia abajo.');
  };

  const reset = () => {
    if (answered) return;
    setOrder([]);
    setAnnouncement('Orden vacío. Elige piezas del banco.');
  };

  const check = () => {
    if (answered || !ready) return;
    const correct = isCorrectOrder(exercise, order);
    setAnnouncement(correct ? 'Orden correcto.' : 'Orden incorrecto. Revisa la solución.');
    onResult?.(correct);
  };

  return (
    <div className="ordena">
      <div className="ordena-layout">
        <section className="ordena-bank" aria-labelledby="ordena-bank-title">
          <p className="ordena-title" id="ordena-bank-title">
            Banco de piezas
          </p>
          {bank.length ? (
            <div className="ordena-bank__list">
              {bank.map((piece) => (
                <button
                  key={piece.id}
                  type="button"
                  className="ordena-piece"
                  data-piece-id={piece.id}
                  disabled={answered}
                  aria-label={`Añadir pieza: ${codeLabel(piece)}`}
                  onClick={() => add(piece.id)}
                >
                  <code className="ordena-piece__code">{piece.code}</code>
                </button>
              ))}
            </div>
          ) : (
            <p className="ordena-empty">No quedan piezas en el banco.</p>
          )}
        </section>

        <section className="ordena-answer" aria-labelledby="ordena-answer-title">
          <p className="ordena-title" id="ordena-answer-title">
            Tu orden
          </p>
          {order.length ? (
            <ol className="ordena-answer__list">
              {order.map((id, index) => {
                const piece = byId.get(id);
                if (!piece) return null;
                return (
                  <li className="ordena-answer__item" key={id}>
                    <span className="ordena-answer__index" aria-hidden="true">
                      {index + 1}
                    </span>
                    <code className="ordena-answer__code">{piece.code}</code>
                    <div className="ordena-answer__actions">
                      <button
                        type="button"
                        className="btn-neon"
                        aria-label={`Subir pieza ${index + 1}: ${codeLabel(piece)}`}
                        disabled={answered || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-neon"
                        aria-label={`Bajar pieza ${index + 1}: ${codeLabel(piece)}`}
                        disabled={answered || index === order.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn-neon"
                        aria-label={`Quitar pieza ${index + 1}: ${codeLabel(piece)}`}
                        disabled={answered}
                        onClick={() => remove(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="ordena-empty">Añade piezas desde el banco.</p>
          )}
          <div className="ordena-actions">
            <button
              type="button"
              className="btn-neon"
              onClick={check}
              disabled={answered || !ready}
            >
              Comprobar
            </button>
            <button
              type="button"
              className="btn-neon"
              onClick={reset}
              disabled={answered || order.length === 0}
            >
              Reiniciar
            </button>
          </div>
          <p className="ordena-help">
            Toca una pieza para añadirla. Usa ↑ y ↓ para cambiar el orden.
          </p>
        </section>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {showSolution ? (
        <div className="ordena-solution" role="group" aria-labelledby="ordena-solution-title">
          <p className="ordena-solution__title" id="ordena-solution-title">
            Orden correcto
          </p>
          <ol className="ordena-solution__list">
            {pieces.map((piece) => (
              <li key={piece.id}>
                <code className="ordena-solution__code">{piece.code}</code>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
