import React, { useState } from 'react';
import { isSupported } from '../core/audio/tts.js';
import { loadSettings, saveSettings } from '../core/storage/settings.js';

export default function SoundToggle() {
  const [muted, setMuted] = useState(() => loadSettings().muted);

  if (!isSupported()) return null;

  const toggle = () => {
    const next = !muted;
    saveSettings({ muted: next });
    setMuted(next);
  };

  return (
    <button
      className="btn-neon"
      type="button"
      aria-pressed={muted}
      aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
      onClick={toggle}
    >
      {muted ? '🔇 Silencio' : '🔊 Sonido'}
    </button>
  );
}
