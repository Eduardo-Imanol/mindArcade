import React from 'react';

const PAGE = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  padding: '16px clamp(16px, 4vw, 32px)',
};

export default function GameSetup({
  pageClassName = '',
  stageClassName = '',
  title,
  titleClassName = 'game-app-title',
  eyebrow = 'Configura tu partida',
  lead,
  children,
  note,
  start,
  actions,
} = {}) {
  return (
    <main className={`sepect-bg game-setup-page ${pageClassName}`.trim()} style={PAGE}>
      <div className={`game-stage game-setup ${stageClassName}`.trim()}>
        <header className="game-setup__header">
          <p className="game-setup__eyebrow">{eyebrow}</p>
          <h1 className={`neon ${titleClassName}`}>{title}</h1>
          <p className="game-setup__lead">{lead}</p>
        </header>
        <section className="game-setup__panel" aria-label="Ajustes de la partida">
          <div className="game-setup__controls">{children}</div>
          {note ? <p className="game-setup__note">{note}</p> : null}
          {start ? <div className="game-setup__start">{start}</div> : null}
        </section>
        {actions ? <div className="game-setup__footer">{actions}</div> : null}
      </div>
    </main>
  );
}
