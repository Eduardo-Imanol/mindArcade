import React from 'react';

export default function ProgressBar({ value, label }) {
  const pct = Math.round(Math.max(0, Math.min(1, value || 0)) * 100);
  return (
    <div
      className="topic-progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="topic-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
