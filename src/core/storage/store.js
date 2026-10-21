// src/core/storage/store.js — localStorage profile + capped history, quota-safe
const KEY = 'sepect.profile.v1';
const MAX_HISTORY = 5000;

export function createStore(backend) {
  const mem = { data: null };
  const b = backend || (typeof localStorage !== 'undefined' ? localStorage : null);
  let quotaWarning = false;
  function read() {
    try {
      const raw = b ? b.getItem(KEY) : mem.data;
      if (!raw) return { xp: 0, streak: 0, lastDay: null, history: [] };
      const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return { xp: 0, streak: 0, lastDay: null, history: [], ...p };
    } catch {
      return { xp: 0, streak: 0, lastDay: null, history: [] };
    }
  }
  function write(profile) {
    try {
      const capped = { ...profile, history: (profile.history || []).slice(-MAX_HISTORY) };
      if (b) b.setItem(KEY, JSON.stringify(capped));
      else mem.data = JSON.stringify(capped);
      return { ok: true, quotaWarning: false };
    } catch {
      quotaWarning = true;
      mem.data = JSON.stringify({ ...profile, history: (profile.history || []).slice(-MAX_HISTORY) });
      console.warn('Sepect: storage quota exceeded, in-memory fallback');
      return { ok: false, quotaWarning: true };
    }
  }
  return {
    load: read,
    save: write,
    addAttempt(profile, attempt) {
      const next = { ...read(), ...profile, history: [...(read().history || []), attempt].slice(-MAX_HISTORY) };
      write(next);
      return next;
    },
    wasQuotaWarning: () => quotaWarning,
  };
}
