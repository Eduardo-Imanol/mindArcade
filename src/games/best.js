// src/games/best.js — shared best-score accessor for deck-based arcade modes
export function bestScoreFor(best, deckId) {
  const value =
    typeof best === 'function'
      ? best(deckId)
      : best && typeof best === 'object'
        ? best[deckId]
        : best;
  const score = Number(value);
  return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
}
