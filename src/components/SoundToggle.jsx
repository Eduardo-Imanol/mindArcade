import React, { useSyncExternalStore } from 'react';
import { isSupported } from '../core/audio/tts.js';
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
    saveSettings({ muted: !muted });
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
