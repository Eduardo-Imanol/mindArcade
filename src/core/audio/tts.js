// src/core/audio/tts.js — Web Speech API wrapper (free, no deps)
import { loadSettings } from '../storage/settings.js';

const DEFAULT_LANG = 'es-ES';

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

export function stopSpeech() {
  if (isSupported() && typeof window.speechSynthesis.cancel === 'function') {
    window.speechSynthesis.cancel();
  }
}

export function speak(text, options = {}) {
  if (!isSupported()) return null;
  const clean = text == null ? '' : String(text).trim();
  if (!clean) return null;
  if (loadSettings().muted) return null;

  const lang = options.lang || DEFAULT_LANG;
  const synth = window.speechSynthesis;
  const Utterance = window.SpeechSynthesisUtterance;
  const utter = new Utterance(clean);
  utter.lang = lang;
  utter.rate = 0.9;
  utter.pitch = 1.1;

  const applyVoice = () => {
    const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
    const voice = pickVoice(voices, lang);
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

  if (typeof synth.cancel === 'function') synth.cancel();
  synth.speak(utter);
  return utter;
}
