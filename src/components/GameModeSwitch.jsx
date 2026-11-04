import React from 'react';

const DEFAULT_OPTIONS = [
  { id: 'normal', label: 'Normal', hint: 'A tu ritmo' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · mazo completo' },
];

export default function GameModeSwitch({
  mode = 'normal',
  onChange,
  options = DEFAULT_OPTIONS,
  legend = 'Modo de juego',
  disabled = false,
} = {}) {
  const list = Array.isArray(options) ? options.filter(Boolean) : [];

  return (
    <fieldset className="game-mode">
      <legend className="game-mode__legend">{legend}</legend>
      <div className="game-mode__options">
        {list.map((option) => {
          const selected = option.id === mode;
          const hintId = option.hint ? `game-mode-${option.id}-hint` : undefined;
          return (
            <button
              key={option.id}
              type="button"
              className={`game-mode__option${selected ? ' is-selected' : ''}`}
              data-mode={option.id}
              aria-pressed={selected}
              aria-describedby={hintId}
              disabled={disabled}
              onClick={() => onChange?.(option.id)}
            >
              <span className="game-mode__label">{option.label}</span>
              {option.hint ? (
                <span className="game-mode__hint" id={hintId}>
                  {option.hint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
