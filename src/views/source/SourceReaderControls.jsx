import React from 'react';

const STATUS_COPY = {
  idle: 'Listo para leer',
  speaking: 'Leyendo en voz alta',
  paused: 'Lectura en pausa',
};

const SELECTION_COPY = {
  speaking: 'Leyendo la selección',
  paused: 'Selección en pausa',
};

export default function SourceReaderControls({
  supported,
  muted,
  status,
  mode = 'document',
  selection = '',
  onPlay,
  onPause,
  onResume,
  onStop,
  onPlaySelection,
}) {
  if (!supported) {
    return (
      <p className="source-reader__notice" role="status">
        Este navegador no permite lectura en voz alta. El documento sigue disponible para leer.
      </p>
    );
  }

  const state = muted ? 'muted' : status;
  const statusText = muted
    ? 'Sonido silenciado'
    : (mode === 'selection' && SELECTION_COPY[status]) || STATUS_COPY[status] || STATUS_COPY.idle;

  return (
    <section className="source-reader__tts card-neon" aria-label="Lectura en voz alta">
      <div className="source-reader__tts-copy">
        <p className="source-reader__tts-title">Escuchar documento</p>
        <p className="source-reader__tts-status" data-state={state} role="status" aria-live="polite">
          {statusText}
        </p>
        <p className="source-reader__tts-hint">
          También puedes seleccionar un fragmento para escucharlo.
        </p>
      </div>
      <div className="source-reader__tts-actions">
        <button
          className="btn-neon source-reader__btn"
          type="button"
          onClick={onPlay}
          disabled={muted || status === 'speaking'}
          aria-label="Leer documento en voz alta"
          aria-pressed={status === 'speaking' && mode === 'document'}
        >
          Leer
        </button>
        <button
          className="btn-neon source-reader__btn"
          type="button"
          onClick={onPause}
          disabled={muted || status !== 'speaking'}
          aria-label="Pausar lectura"
        >
          Pausar
        </button>
        <button
          className="btn-neon source-reader__btn"
          type="button"
          onClick={onResume}
          disabled={muted || status !== 'paused'}
          aria-label="Reanudar lectura"
        >
          Reanudar
        </button>
        <button
          className="btn-neon source-reader__btn"
          type="button"
          onClick={onStop}
          disabled={status === 'idle'}
          aria-label="Detener lectura"
        >
          Detener
        </button>
      </div>
      {selection ? (
        <div className="source-reader__selection">
          <p className="source-reader__selection-copy">
            <span className="source-reader__selection-label">Selección</span>
            <span>
              {selection.length} {selection.length === 1 ? 'carácter' : 'caracteres'}
            </span>
          </p>
          <button
            className="btn-neon source-reader__btn"
            type="button"
            onClick={onPlaySelection}
            onMouseDown={(event) => event.preventDefault()}
            disabled={muted}
            aria-label="Leer texto seleccionado"
            aria-pressed={status === 'speaking' && mode === 'selection'}
          >
            Leer selección
          </button>
        </div>
      ) : null}
    </section>
  );
}
