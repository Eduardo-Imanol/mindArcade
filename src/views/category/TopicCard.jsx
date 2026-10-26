import React from 'react';
import { formatDays } from './categoryModel.js';

export default function TopicCard({ topic, metrics }) {
  const learned = metrics ? metrics.learned : 0;
  const days = metrics ? metrics.daysStudied : 0;
  return (
    <li>
      <a className="card-neon topic-card" href={`#/tema/${topic.id}`}>
        <div className="topic-card__header">
          <h3 className="topic-card__title">{topic.title}</h3>
          {topic.description ? <p className="topic-card__desc">{topic.description}</p> : null}
        </div>
        <div className="topic-card__meta">
          <span>
            {topic.cards.length} {topic.cards.length === 1 ? 'carta' : 'cartas'}
          </span>
          <span>
            Aprendidas {learned}/{topic.cards.length}
          </span>
          {days > 0 ? <span>{formatDays(days)}</span> : <span>Sin estudiar</span>}
        </div>
      </a>
    </li>
  );
}
