import React, { useSyncExternalStore } from 'react';
import { isSupported, stopSpeech } from '../core/audio/tts.js';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  subscribeSettings,
} from '../core/storage/settings.js';

export default function SoundToggle() {
  const muted = useSyncExternalStore(
    subscribeSettings,
    () => loadSettings().muted,
    () => DEFAULT_SETTINGS.muted
  );

  if (!isSupported()) return null;

  const toggle = () => {
    const next = !muted;
    saveSettings({ muted: next });
    if (next) stopSpeech();
  };

  return (
    <button
      className="btn-neon"
      type="button"
      aria-pressed={muted}
      aria-label="Sonido"
      onClick={toggle}
    >
      {muted ? '🔇 Silencio' : '🔊 Sonido'}
    </button>
  );
}
