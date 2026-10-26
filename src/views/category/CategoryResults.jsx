import React from 'react';
import Card from '../../components/Card.jsx';
import TopicCard from './TopicCard.jsx';

function ResultsHead({ count, hasFilters, onClear }) {
  return (
    <div className="category__results-head">
      <div>
        <h2 className="category__results-title">{hasFilters ? 'Resultados' : 'Temas'}</h2>
        <p className="category__results-count" role="status">
          {count} {count === 1 ? 'tema' : 'temas'}
        </p>
      </div>
      {hasFilters && count > 0 ? (
        <button className="btn-neon" type="button" onClick={onClear}>
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}

function EmptyResults({ onClear }) {
  return (
    <Card className="library__empty" title="Sin resultados">
      <p>No hay temas que coincidan con tu búsqueda o filtros.</p>
      <button className="btn-neon" type="button" onClick={onClear}>
        Limpiar filtros
      </button>
    </Card>
  );
}

export default function CategoryResults({ categoryTitle, topics, metrics, hasFilters, onClear }) {
  return (
    <section className="category__results" aria-label={`Temas de ${categoryTitle}`}>
      <ResultsHead count={topics.length} hasFilters={hasFilters} onClear={onClear} />
      {topics.length === 0 ? (
        <EmptyResults onClear={onClear} />
      ) : (
        <ul className="module__grid">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} metrics={metrics[topic.id]} />
          ))}
        </ul>
      )}
    </section>
  );
}
