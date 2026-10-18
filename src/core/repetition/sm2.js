// src/core/repetition/sm2.js — simplified SM-2, pure functions (now injectable)
export function scheduleNext(card = {}, grade = 'hard', now = Date.now()) {
  const prev = {
    interval: Math.max(1, Number(card.interval) || 1),
    ease: Math.min(3, Math.max(1.3, Number(card.ease) || 2.5)),
    reps: Math.max(0, Number(card.reps) || 0),
  };
  if (grade === 'fail') {
    return { interval: 1, ease: Math.max(1.3, prev.ease - 0.2), reps: 0, nextReview: now + 86400000 };
  }
  if (grade === 'hard') {
    return {
      interval: Math.max(1, Math.round(prev.interval * 1.2)),
      ease: Math.max(1.3, prev.ease - 0.15),
      reps: prev.reps + 1,
      nextReview: now + 86400000 * Math.max(1, Math.round(prev.interval * 1.2)),
    };
  }
  // easy
  const ease = Math.min(3, prev.ease + 0.15);
  let interval;
  if (prev.reps === 0) interval = 1;
  else if (prev.reps === 1) interval = 6;
  else interval = Math.round(prev.interval * ease);
  return { interval, ease, reps: prev.reps + 1, nextReview: now + 86400000 * interval };
}
