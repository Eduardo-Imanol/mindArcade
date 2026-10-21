// src/core/repetition/selectStudyCards.js — eligible study selection (pure, spec-12)
// Unlearned first (shuffled), then learned cards with nextReview <= now.
// Supersedes the spec-03 AC-3 backfill: not-due learned cards are never offered.
import { getCardLearningState } from './learning.js';

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

function isDue(state, now) {
  const nextReview = Number(state ? state.nextReview : NaN);
  return Number.isFinite(nextReview) && nextReview <= now;
}

export function selectStudyCards(cards = [], srs = {}, options = {}) {
  const list = Array.isArray(cards) ? cards : [];
  const deck = srs && typeof srs === 'object' ? srs : {};
  const opts = options && typeof options === 'object' ? options : {};
  const { count, random = Math.random } = opts;
  const now = Number.isFinite(Number(opts.now)) ? Number(opts.now) : Date.now();
  const limit = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : list.length;
  if (limit <= 0 || list.length === 0) return [];

  const unlearned = [];
  const due = [];
  for (const card of list) {
    if (!card || typeof card !== 'object') continue;
    const state = deck[card.id];
    if (getCardLearningState(state) !== 'learned') {
      unlearned.push(card);
    } else if (isDue(state, now)) {
      due.push({ card, nextReview: Number(state.nextReview) });
    }
  }

  const selected = shuffle(unlearned, random).slice(0, limit);
  if (selected.length < limit) {
    due.sort(
      (a, b) => a.nextReview - b.nextReview || String(a.card.id).localeCompare(String(b.card.id))
    );
    for (const entry of due) {
      if (selected.length >= limit) break;
      selected.push(entry.card);
    }
  }
  return selected;
}
