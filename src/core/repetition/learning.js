// src/core/repetition/learning.js — explicit learning states (pure, spec-12)
export const LEARNED_REPS = 3;

function repsOf(state) {
  const reps = Number(state ? state.reps : NaN);
  if (!Number.isFinite(reps) || reps <= 0) return 0;
  return Math.floor(reps);
}

export function getCardLearningState(state) {
  const reps = repsOf(state);
  if (reps === 0) return 'new';
  if (reps < LEARNED_REPS) return 'learning';
  return 'learned';
}
