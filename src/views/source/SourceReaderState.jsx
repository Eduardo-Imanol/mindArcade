import React from 'react';

export default function SourceReaderState({ state, topic, onRetry }) {
  if (state.status === 'loading') {
    return (
      <div className="source-reader__state card-neon" role="status" aria-live="polite">
        <p className="source-reader__state-title">Abriendo el documento…</p>
        <div className="source-reader__skeleton" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      </div>
    );
  }
  if (state.status === 'empty') {
    return (
      <section className="source-reader__state card-neon" role="status">
        <h2 className="source-reader__state-title">Documento no disponible</h2>
        <p>{state.message}</p>
        <a className="btn-neon" href={`#/tema/${topic.id}`}>Volver al tema</a>
      </section>
    );
  }
  return (
    <section className="source-reader__state card-neon" role="alert">
      <h2 className="source-reader__state-title">No se pudo abrir el documento</h2>
      <p>{state.message}</p>
      <div className="source-reader__state-actions">
        <button className="btn-neon" type="button" onClick={onRetry}>Reintentar</button>
        <a className="btn-neon" href={`#/tema/${topic.id}`}>Volver al tema</a>
      </div>
    </section>
  );
}
