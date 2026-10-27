import React from 'react';
import { DECK_MASTERY_LABELS } from '../core/repetition/decks.js';

function bestOf(best, deckId) {
  if (typeof best === 'function') {
    const value = Number(best(deckId));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }
  if (best && typeof best === 'object') {
    const value = Number(best[deckId]);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }
  const value = Number(best);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function reasonFor(disabledReason, deck) {
  if (typeof disabledReason === 'function') return disabledReason(deck) || '';
  if (disabledReason && typeof disabledReason === 'object') return disabledReason[deck?.id] || '';
  return typeof disabledReason === 'string' ? disabledReason : '';
}

function progressOf(deck) {
  const total = Number(deck?.total) || 0;
  const studied = Number(deck?.studied) || 0;
  if (total <= 0) return 0;
  return Math.round((Math.min(studied, total) / total) * 100);
}

export default function DeckPicker({
  decks = [],
  selectedDeckId,
  onSelect,
  best,
  disabledReason,
  gameId,
  label = 'Elige tu mazo',
} = {}) {
  const list = Array.isArray(decks) ? decks.filter(Boolean) : [];

  if (list.length === 0) {
    return (
      <p className="deck-picker deck-picker--empty" role="status">
        Este tema todavía no tiene mazos.
      </p>
    );
  }

  return (
    <div className="deck-picker" role="group" aria-label={label} data-game-id={gameId || undefined}>
      {list.map((deck) => {
        const selected = deck.id === selectedDeckId;
        const reason = reasonFor(disabledReason, deck);
        const disabled = Boolean(reason);
        const mastery = DECK_MASTERY_LABELS[deck.mastery] || 'Sin empezar';
        const bestScore = bestOf(best, deck.id);
        const percent = progressOf(deck);
        const descriptionId = `deck-${gameId || 'game'}-${deck.id}-status`;
        const countText = `${deck.total} cartas · ${deck.studied ?? 0} de ${deck.total} estudiadas · ${deck.pending ?? 0} pendientes`;
        const bestText = bestScore > 0 ? `Mejor marca: ${bestScore} puntos` : 'Sin récord todavía';
        const ariaLabel = `Mazo ${deck.number}, cartas ${deck.label}, ${mastery}, ${countText}, ${bestText}${disabled ? `. No disponible: ${reason}` : ''}`;
        return (
          <button
            key={deck.id}
            type="button"
            className={`deck-picker__deck${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
            data-deck-id={deck.id}
            data-mastery={deck.mastery || ''}
            aria-pressed={selected}
            aria-describedby={descriptionId}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onSelect?.(deck.id, deck);
            }}
          >
            <span className="deck-picker__head">
              <span className="deck-picker__title">Mazo {deck.number}</span>
              <span className={`deck-picker__status is-${deck.mastery || 'empty'}`}>{mastery}</span>
            </span>
            <span className="deck-picker__meta">{countText}</span>
            <span className="deck-picker__bar" aria-hidden="true">
              <span style={{ width: `${percent}%` }} />
            </span>
            <span className="deck-picker__foot" id={descriptionId}>
              <span className="deck-picker__best">{bestText}</span>
              <span className="deck-picker__cta">
                {disabled ? reason : selected ? 'Seleccionado' : 'Elegir'}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
