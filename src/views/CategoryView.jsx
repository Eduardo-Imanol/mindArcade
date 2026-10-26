import React, { useMemo, useState } from 'react';
import { findCategory } from '../core/content/library.js';
import { loadCatalog } from '../core/content/catalog.js';
import { ensureTopicMeta } from '../core/content/topicMeta.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import Card from '../components/Card.jsx';
import NotFound from '../components/NotFound.jsx';
import { filterAndSortTopics, SORT_OPTIONS, STATUS_OPTIONS } from './topics.js';

const CATEGORY_SORT_OPTIONS = [{ id: 'modules', label: 'Por módulos' }, ...SORT_OPTIONS];

function formatDays(days) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

function categoryTopics(catalog, categoryId) {
  return catalog.filter((topic) => topic.categoryId === categoryId);
}

function TopicCard({ topic, metrics }) {
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

function CategoryContent({ category }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('modules');
  const [status, setStatus] = useState('all');
  const [openModules, setOpenModules] = useState(() => new Set());

  const catalog = useMemo(() => ensureTopicMeta(loadCatalog()), []);
  const srs = useMemo(() => loadSrs(), []);
  const history = useMemo(() => createStore().load().history || [], []);
  const allTopics = useMemo(() => categoryTopics(catalog, category.id), [catalog, category.id]);

  const { topics: visibleTopics, metrics } = useMemo(
    () => filterAndSortTopics(allTopics, { query, sort, status, srs, history, now: Date.now() }),
    [allTopics, query, sort, status, srs, history]
  );

  const topicsById = useMemo(() => new Map(allTopics.map((topic) => [topic.id, topic])), [allTopics]);
  const visibleModules = useMemo(
    () =>
      [...(category.modules || [])]
        .sort((a, b) => a.order - b.order)
        .map((module) => ({
          ...module,
          topics: (module.topicIds || []).map((id) => topicsById.get(id)).filter(Boolean),
        }))
        .filter((module) => module.topics.length > 0),
    [category.modules, topicsById]
  );

  const hasFilters = query.trim() !== '' || status !== 'all' || sort !== 'modules';
  const groupedMode = visibleModules.length > 0 && !hasFilters;
  const allOpen = visibleModules.length > 0 && visibleModules.every((module) => openModules.has(module.id));

  const toggleModule = (id) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setOpenModules(allOpen ? new Set() : new Set(visibleModules.map((module) => module.id)));
  };

  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setSort('modules');
  };

  if (allTopics.length === 0) {
    const isPersonal = category.id === 'personalizados';
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
          <Card className="library__empty" title={isPersonal ? 'Aún no tienes temas' : 'Próximamente'}>
            <p>
              {isPersonal
                ? 'Crea tu primer tema desde la biblioteca y aparecerá aquí.'
                : 'Aún no hay contenido en esta categoría.'}
            </p>
            {isPersonal ? (
              <a className="btn-neon" href="#/">Ir a la biblioteca</a>
            ) : null}
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

        <div className="hub-controls category-controls">
          <div className="hub-search">
            <span className="hub-search__icon" aria-hidden="true">🔍</span>
            <input
              id="category-search"
              type="search"
              className="hub-field"
              aria-label={`Buscar temas en ${category.title}`}
              placeholder="Buscar por título o descripción"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query !== '' ? (
              <button
                className="btn-neon hub-search__clear"
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQuery('')}
              >
                ✕
              </button>
            ) : null}
          </div>
          <label className="hub-control">
            <span>Ordenar</span>
            <select
              className="hub-select"
              aria-label="Ordenar temas"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {CATEGORY_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="hub-control">
            <span>Estado</span>
            <select
              className="hub-select"
              aria-label="Filtrar por estado"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {groupedMode ? (
          <>
            <div className="category__actions">
              <button className="btn-neon" type="button" onClick={toggleAll}>
                {allOpen ? 'Cerrar módulos' : 'Abrir módulos'}
              </button>
            </div>
            <section className="category" aria-label={`Módulos de ${category.title}`}>
              {visibleModules.map((module) => {
                const isOpen = openModules.has(module.id);
                const panelId = `module-${module.id}-panel`;
                return (
                  <section key={module.id} className="module" aria-labelledby={`module-${module.id}`}>
                    <header className="module__header">
                      <h2 className="module__heading">
                        <button
                          id={`module-${module.id}`}
                          className="module__toggle"
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleModule(module.id)}
                        >
                          <span className="module__title">{module.title}</span>
                          <span className="module__count">
                            {module.topics.length} {module.topics.length === 1 ? 'tema' : 'temas'}
                          </span>
                          <span className="module__chevron" aria-hidden="true">▾</span>
                        </button>
                      </h2>
                      {module.description ? <p className="module__subtitle">{module.description}</p> : null}
                    </header>
                    <div id={panelId} className="module__panel" hidden={!isOpen}>
                      <ul className="module__grid">
                        {module.topics.map((topic) => (
                          <TopicCard key={topic.id} topic={topic} metrics={metrics[topic.id]} />
                        ))}
                      </ul>
                    </div>
                  </section>
                );
              })}
            </section>
          </>
        ) : (
          <section className="category__results" aria-label={`Temas de ${category.title}`}>
            <div className="category__results-head">
              <div>
                <h2 className="category__results-title">{hasFilters ? 'Resultados' : 'Temas'}</h2>
                <p className="category__results-count">
                  {visibleTopics.length} {visibleTopics.length === 1 ? 'tema' : 'temas'}
                </p>
              </div>
              {hasFilters && visibleTopics.length > 0 ? (
                <button className="btn-neon" type="button" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              ) : null}
            </div>
            {visibleTopics.length === 0 ? (
              <Card title="Sin resultados">
                <p>No hay temas que coincidan con tu búsqueda o filtros.</p>
                <button className="btn-neon" type="button" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              </Card>
            ) : (
              <ul className="module__grid">
                {visibleTopics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} metrics={metrics[topic.id]} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function CategoryView({ categoryId }) {
  const category = findCategory(categoryId);
  if (!category) return <NotFound />;
  return <CategoryContent category={category} />;
}
