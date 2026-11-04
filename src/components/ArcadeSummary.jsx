import React from 'react';

function asCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

export default function ArcadeSummary({
  score = 0,
  best = 0,
  isRecord = false,
  lives = 0,
  correct = 0,
  wrong = 0,
  completed = false,
  deckLabel,
  actions,
} = {}) {
  const total = asCount(score);
  const currentBest = asCount(best);
  const livesLeft = asCount(lives);
  const hits = asCount(correct);
  const misses = asCount(wrong);
  const status = [
    `Puntuación ${total}.`,
    isRecord ? 'Nuevo récord.' : `Mejor marca ${Math.max(currentBest, total)}.`,
    `Vidas restantes ${livesLeft}.`,
    `Aciertos ${hits}.`,
    `Fallos ${misses}.`,
    deckLabel ? `${deckLabel}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="result-panel arcade-summary" aria-labelledby="arcade-summary-title">
      <p className="result-panel__eyebrow">Modo arcade</p>
      <h1 id="arcade-summary-title" className="neon game-app-title">
        {completed ? 'Mazo completado' : 'Partida terminada'}
      </h1>
      <p className="result-panel__live" role="status" aria-atomic="true">
        {status}
      </p>
      <div className="arcade-summary__score">
        <span className="arcade-summary__score-label">Puntuación</span>
        <strong className="arcade-summary__score-value">{total}</strong>
        <span className={`arcade-summary__badge${isRecord ? ' is-record' : ''}`}>
          {isRecord ? '¡Nuevo récord!' : `Mejor: ${Math.max(currentBest, total)}`}
        </span>
      </div>
      <dl className="result-panel__stats">
        <div className="result-panel__stat">
          <dt>Vidas</dt>
          <dd>{livesLeft}</dd>
        </div>
        <div className="result-panel__stat">
          <dt>Aciertos</dt>
          <dd>{hits}</dd>
        </div>
        <div className="result-panel__stat">
          <dt>Fallos</dt>
          <dd>{misses}</dd>
        </div>
        {deckLabel ? (
          <div className="result-panel__stat result-panel__stat--wide">
            <dt>Mazo</dt>
            <dd>{deckLabel}</dd>
          </div>
        ) : null}
      </dl>
      {actions ? <div className="result-panel__actions">{actions}</div> : null}
    </section>
  );
}
