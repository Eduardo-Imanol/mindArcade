// src/core/storage/settings.js — global settings (muted), quota-safe
const KEY = 'sepect.settings.v1';

export const DEFAULT_SETTINGS = { muted: false };

let memory = null;

function readRaw() {
  if (memory !== null) return memory;
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  } catch {
    return null;
  }
}

export function loadSettings() {
  try {
    const raw = readRaw();
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, muted: Boolean(parsed.muted) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings = {}) {
  const next = { ...DEFAULT_SETTINGS, muted: Boolean(settings.muted) };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(next));
      memory = null;
    } else {
      memory = JSON.stringify(next);
    }
    return { ok: true, settings: next };
  } catch {
    memory = JSON.stringify(next);
    console.warn('Sepect: no se pudo guardar la configuración, fallback en memoria');
    return { ok: false, settings: next };
  }
}

export function isMuted() {
  return loadSettings().muted;
}
