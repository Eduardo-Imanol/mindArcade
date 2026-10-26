// src/core/audio/tts.js — Web Speech API wrapper (free, no deps)
import { loadSettings } from '../storage/settings.js';

import { chunkSpeechText } from './chunks.js';

export { chunkSpeechText } from './chunks.js';

const DEFAULT_LANG = 'es-ES';

let activeSequence = null;

export function isSupported() {
  return (
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

function langPrefix(lang) {
  return String(lang || '').toLowerCase().split('-')[0];
}

function pickVoice(voices, lang) {
  const prefix = langPrefix(lang);
  if (!prefix) return null;
  return (
    (voices || []).find((voice) => String(voice.lang || '').toLowerCase().startsWith(prefix)) || null
  );
}

function createUtterance(text, lang) {
  const synth = window.speechSynthesis;
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = lang || DEFAULT_LANG;
  utter.rate = 0.9;
  utter.pitch = 1.1;

  const applyVoice = () => {
    const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
    const voice = pickVoice(voices, utter.lang);
    if (voice) utter.voice = voice;
  };
  applyVoice();

  if (!utter.voice) {
    const onVoices = () => {
      applyVoice();
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', onVoices);
      }
      if (synth.onvoiceschanged === onVoices) synth.onvoiceschanged = null;
    };
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', onVoices);
    } else {
      synth.onvoiceschanged = onVoices;
    }
  }
  return utter;
}

function cancelSynth() {
  if (isSupported() && typeof window.speechSynthesis.cancel === 'function') {
    window.speechSynthesis.cancel();
  }
}

function haltActiveSequence() {
  if (!activeSequence) return false;
  activeSequence.cancelled = true;
  activeSequence = null;
  return true;
}

export function stopSpeech() {
  haltActiveSequence();
  cancelSynth();
}

export function pauseSpeech() {
  if (!isSupported() || typeof window.speechSynthesis.pause !== 'function') return false;
  window.speechSynthesis.pause();
  return true;
}

export function resumeSpeech() {
  if (!isSupported() || typeof window.speechSynthesis.resume !== 'function') return false;
  window.speechSynthesis.resume();
  return true;
}

export function isSpeechPaused() {
  return isSupported() && Boolean(window.speechSynthesis.paused);
}

export function speak(text, options = {}) {
  if (!isSupported()) return null;
  const clean = text == null ? '' : String(text).trim();
  if (!clean) return null;
  if (loadSettings().muted) return null;

  haltActiveSequence();
  const utter = createUtterance(clean, options.lang || DEFAULT_LANG);
  cancelSynth();
  window.speechSynthesis.speak(utter);
  return utter;
}

export function speakSequence(parts, { onEnd, onError, lang } = {}) {
  if (!isSupported()) return null;
  const chunks = (Array.isArray(parts) ? parts : [parts]).flatMap((part) => chunkSpeechText(part));
  if (!chunks.length || loadSettings().muted) return null;

  stopSpeech();
  const sequence = { id: Date.now() + Math.random(), cancelled: false, utterance: null };
  activeSequence = sequence;
  let index = 0;
  const synth = window.speechSynthesis;

  const isCurrent = () => activeSequence === sequence && !sequence.cancelled;
  const finish = () => {
    if (!isCurrent()) return;
    activeSequence = null;
    if (typeof onEnd === 'function') onEnd();
  };
  const fail = (error) => {
    if (!isCurrent()) return;
    activeSequence = null;
    sequence.cancelled = true;
    if (typeof onError === 'function') onError(error);
  };
  const next = () => {
    if (!isCurrent()) return;
    if (index >= chunks.length) {
      finish();
      return;
    }
    const utter = createUtterance(chunks[index], lang || DEFAULT_LANG);
    index += 1;
    sequence.utterance = utter;
    utter.onend = () => {
      if (isCurrent()) next();
    };
    utter.onerror = (event) => fail(event);
    synth.speak(utter);
  };

  const stop = () => {
    if (!isCurrent()) return;
    const current = activeSequence;
    activeSequence = null;
    current.cancelled = true;
    cancelSynth();
  };

  const control = {
    pause: () => (isCurrent() ? pauseSpeech() : false),
    resume: () => (isCurrent() ? resumeSpeech() : false),
    stop,
    cancel: stop,
  };
  next();
  return control;
}
