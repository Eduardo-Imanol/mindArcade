import React from 'react';
import { findCategory } from '../core/content/library.js';
import { loadCatalog } from '../core/content/catalog.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { getTopicMetrics } from '../core/metrics/metrics.js';
import Card from '../components/Card.jsx';
import NotFound from '../components/NotFound.jsx';

function formatDays(days) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export default function CategoryView({ categoryId }) {
  const category = findCategory(categoryId);
  if (!category) return <NotFound />;

  const catalog = loadCatalog();
  const topicsById = new Map(catalog.map((t) => [t.id, t]));
  const srs = loadSrs();
  const history = createStore().load().history || [];
  const now = Date.now();
  const modules = [...(category.modules || [])].sort((a, b) => a.order - b.order);
  const visibleModules = modules.filter((mod) => (mod.topicIds || []).some((id) => topicsById.has(id)));

  if (visibleModules.length === 0) {
    return (
      <main className="sepect-bg topic-page">
        <div className="topic-page__inner">
          <header className="hub-header">
            <div>
              <a className="topic-back" href="#/">← Biblioteca</a>
              <h1 className="neon hub-title">{category.title}</h1>
              <p className="hub-subtitle">{category.description || ''}</p>
            </div>
          </header>
          <Card className="library__empty" title="Próximamente">
            <p>Aún no hay contenido en esta categoría.</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="sepect-bg topic-page">
      <div className="topic-page__inner">
        <header className="hub-header">
          <div>
            <a className="topic-back" href="#/">← Biblioteca</a>
            <h1 className="neon hub-title">{category.title}</h1>
            <p className="hub-subtitle">{category.description || ''}</p>
          </div>
        </header>
        <section className="category" aria-label={`Módulos de ${category.title}`}>
          {visibleModules.map((mod) => (
            <section key={mod.id} className="module" aria-labelledby={`module-${mod.id}`}>
              <header className="module__header">
                <h2 id={`module-${mod.id}`} className="module__title">{mod.title}</h2>
                {mod.description ? <p className="module__subtitle">{mod.description}</p> : null}
              </header>
              <ul className="module__grid">
                {(mod.topicIds || []).map((tid) => {
                  const topic = topicsById.get(tid);
                  if (!topic) return null;
                  const metrics = getTopicMetrics(topic, srs, history, now);
                  return (
                    <li key={topic.id}>
                      <a className="card-neon topic-card" href={`#/tema/${topic.id}`}>
                        <div className="topic-card__header">
                          <h3 className="topic-card__title">{topic.title}</h3>
                          {topic.description ? (
                            <p className="topic-card__desc">{topic.description}</p>
                          ) : null}
                        </div>
                        <div className="topic-card__meta">
                          <span>
                            {topic.cards.length} {topic.cards.length === 1 ? 'carta' : 'cartas'}
                          </span>
                          <span>
                            Aprendidas {metrics.learned}/{topic.cards.length}
                          </span>
                          {metrics.daysStudied > 0 ? (
                            <span>{formatDays(metrics.daysStudied)}</span>
                          ) : (
                            <span>Sin estudiar</span>
                          )}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
