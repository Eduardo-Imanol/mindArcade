// src/core/repetition/selectDueCards.js — SRS-driven card selection (pure)
export const LEARNED_REPS = 3;

function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

function repsOf(state) {
  const reps = Number(state && state.reps);
  return Number.isFinite(reps) ? reps : 0;
}

function nextReviewOf(entry) {
  return Number.isFinite(entry.nextReview) ? entry.nextReview : Number.POSITIVE_INFINITY;
}

export function selectDueCards(cards = [], srs = {}, options = {}) {
  const list = Array.isArray(cards) ? cards : [];
  const { count, random = Math.random } = options;
  const limit = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : list.length;
  if (limit <= 0 || list.length === 0) return [];

  const unlearned = [];
  const learned = [];
  for (const card of list) {
    const state = srs ? srs[card.id] : null;
    if (state && repsOf(state) >= LEARNED_REPS) {
      learned.push({ card, nextReview: Number(state.nextReview) });
    } else {
      unlearned.push(card);
    }
  }

  const selected = shuffle(unlearned, random).slice(0, limit);
  if (selected.length < limit) {
    learned.sort(
      (a, b) => nextReviewOf(a) - nextReviewOf(b) || a.card.id.localeCompare(b.card.id)
    );
    for (const entry of learned) {
      if (selected.length >= limit) break;
      selected.push(entry.card);
    }
  }
  return selected;
}
