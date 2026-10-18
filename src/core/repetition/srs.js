// src/core/repetition/srs.js — deck ordering + grading persistence (sepect.srs.v1)
import { scheduleNext } from './sm2.js';

const KEY = 'sepect.srs.v1';
const GRADE_MAP = { 'otra-vez': 'fail', dificil: 'hard', facil: 'easy' };

export function orderDeck(cards = [], srs = {}, _now = Date.now()) {
  const unseen = [];
  const seen = [];
  for (const card of cards) {
    const state = srs ? srs[card.id] : null;
    if (state && Number.isFinite(Number(state.nextReview))) {
      seen.push({ card, nextReview: Number(state.nextReview) });
    } else {
      unseen.push(card);
    }
  }
  seen.sort((a, b) => a.nextReview - b.nextReview || a.card.id.localeCompare(b.card.id));
  return [...unseen, ...seen.map((entry) => entry.card)];
}

export function applyGrade(srs = {}, topicId, cardId, grade = 'otra-vez', now = Date.now()) {
  const mapped = GRADE_MAP[grade] || (['fail', 'hard', 'easy'].includes(grade) ? grade : 'fail');
  const topic = { ...(srs[topicId] || {}) };
  const prev = topic[cardId] || { interval: 1, ease: 2.5, reps: 0 };
  topic[cardId] = scheduleNext(prev, mapped, now);
  return { ...srs, [topicId]: topic };
}

export function loadSrs() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSrs(srs = {}) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(srs));
    return { ok: true };
  } catch {
    console.warn('Sepect: storage quota exceeded for SRS, keeping session in memory');
    return { ok: false };
  }
}
