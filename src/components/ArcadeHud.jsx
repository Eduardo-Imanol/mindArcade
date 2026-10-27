import React from 'react';
import { ARCADE_LIVES } from '../core/engine/arcade.js';

function asCount(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

export default function ArcadeHud({
  lives = ARCADE_LIVES,
  score = 0,
  streak = 0,
  best = 0,
  maxLives = ARCADE_LIVES,
  mode = 'arcade',
  label = 'Marcador arcade',
  className = '',
} = {}) {
  if (mode !== 'arcade') return null;

  const max = Math.max(1, asCount(maxLives, ARCADE_LIVES));
  const currentLives = Math.min(max, asCount(lives, max));
  const currentScore = asCount(score);
  const currentStreak = asCount(streak);
  const currentBest = asCount(best);
  const summary = `Vidas ${currentLives} de ${max}. Puntuación ${currentScore}. Racha ${currentStreak}. Mejor marca ${currentBest}.`;

  return (
    <section className={`arcade-hud ${className}`.trim()} aria-label={label}>
      <div className="arcade-hud__lives" aria-hidden="true">
        {Array.from({ length: max }, (_, index) => (
          <span
            key={index}
            className={`arcade-hud__life${index < currentLives ? ' is-on' : ''}`}
          />
        ))}
      </div>
      <dl className="arcade-hud__stats" aria-hidden="true">
        <div className="arcade-hud__stat">
          <dt>Vidas</dt>
          <dd>
            {currentLives}/{max}
          </dd>
        </div>
        <div className="arcade-hud__stat">
          <dt>Puntuación</dt>
          <dd>{currentScore}</dd>
        </div>
        <div className="arcade-hud__stat">
          <dt>Racha</dt>
          <dd>{currentStreak}</dd>
        </div>
        <div className="arcade-hud__stat">
          <dt>Mejor</dt>
          <dd>{currentBest}</dd>
        </div>
      </dl>
      <p className="arcade-hud__live" role="status" aria-live="polite">
        {summary}
      </p>
    </section>
  );
}
