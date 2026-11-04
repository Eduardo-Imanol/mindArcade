import React from 'react';
import { DECK_MASTERY_LABELS } from '../core/repetition/decks.js';
import { MASTERY_ORDER, summarizeDecks } from '../views/topicDecks.js';

function deckCards(decks) {
  return decks.reduce((total, deck) => total + (Number(deck.total) || 0), 0);
}

export default function DeckOverview({ decks = [], bestRecords = [], topicId } = {}) {
  const list = (Array.isArray(decks) ? decks : []).filter(Boolean);
  const summary = summarizeDecks(list);
  const records = (Array.isArray(bestRecords) ? bestRecords : []).filter(
    (entry) => entry && entry.best > 0
  );

  return (
    <section className="deck-overview" aria-labelledby="topic-decks-title">
      <div className="deck-overview__head">
        <h2 id="topic-decks-title" className="neon topic-games__title">
          Mazos del tema
        </h2>
        <span className="deck-overview__count">
          {list.length} {list.length === 1 ? 'mazo' : 'mazos'} · {deckCards(list)} cartas
        </span>
      </div>

      {list.length === 0 ? (
        <p className="deck-overview__empty">
          Este tema todavía no tiene mazos. Añade cartas para empezar a jugar.
        </p>
      ) : (
        <>
          <ul className="deck-overview__mastery" aria-label="Resumen de dominio de los mazos">
            {MASTERY_ORDER.map((status) => (
              <li
                key={status}
                className={`deck-overview__chip is-${status}`}
                data-status={status}
              >
                <span className="deck-overview__chip-label">
                  {DECK_MASTERY_LABELS[status]}
                </span>
                <strong className="deck-overview__chip-value">{summary[status]}</strong>
              </li>
            ))}
          </ul>

          <details className="deck-overview__details">
            <summary className="deck-overview__summary">
              {list.length === 1
                ? 'Ver detalle del mazo'
                : `Ver detalle de los ${list.length} mazos`}
            </summary>
            <ol className="deck-overview__list">
              {list.map((deck) => {
                const mastery = DECK_MASTERY_LABELS[deck.mastery] || DECK_MASTERY_LABELS.vacia;
                return (
                  <li key={deck.id} className="deck-overview__deck">
                    <span className="deck-overview__deck-title">Mazo {deck.number}</span>
                    <span className="deck-overview__deck-range">{deck.label}</span>
                    <span className={`deck-overview__status is-${deck.mastery || 'vacia'}`}>
                      {mastery}
                    </span>
                    <span className="deck-overview__deck-progress">
                      {deck.studied ?? 0} de {deck.total} estudiadas
                    </span>
                  </li>
                );
              })}
            </ol>
          </details>
        </>
      )}

      <div className="deck-overview__records">
        <h3 className="deck-overview__records-title">Mejor marca por juego</h3>
        {records.length > 0 ? (
          <ul className="deck-overview__record-list">
            {records.map(({ game, best, deck }) => (
              <li key={game.id}>
                <a className="deck-overview__record" href={`#/tema/${topicId}/juego/${game.id}`}>
                  <span className="deck-overview__record-game">{game.title}</span>
                  <span className="deck-overview__record-score">{best} puntos</span>
                  <span className="deck-overview__record-deck">
                    {deck ? `Mazo ${deck.number}` : ''}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="deck-overview__empty">
            Todavía no hay récords arcade. Juega en modo Arcade para registrar tu mejor marca.
          </p>
        )}
      </div>
    </section>
  );
}
