import React, { useMemo, useRef, useState } from 'react';
import { findCategory } from '../core/content/library.js';
import { loadCatalog } from '../core/content/catalog.js';
import { ensureTopicMeta } from '../core/content/topicMeta.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import NotFound from '../components/NotFound.jsx';
import { filterAndSortTopics, STATUS_OPTIONS } from './topics.js';
import CategoryControls from './category/CategoryControls.jsx';
import CategoryEmpty from './category/CategoryEmpty.jsx';
import CategoryHeader from './category/CategoryHeader.jsx';
import CategoryResults from './category/CategoryResults.jsx';
import GroupedModules from './category/GroupedModules.jsx';
import {
  buildVisibleModules,
  categoryTopics,
  defaultSortFor,
  sortOptionsFor,
} from './category/categoryModel.js';

function CategoryContent({ category }) {
  const catalog = useMemo(() => ensureTopicMeta(loadCatalog()), []);
  const srs = useMemo(() => loadSrs(), []);
  const history = useMemo(() => createStore().load().history || [], []);
  const allTopics = useMemo(() => categoryTopics(catalog, category.id), [catalog, category.id]);
  const topicsById = useMemo(
    () => new Map(allTopics.map((topic) => [topic.id, topic])),
    [allTopics]
  );
  const visibleModules = useMemo(
    () => buildVisibleModules(category, topicsById),
    [category, topicsById]
  );

  const hasModules = visibleModules.length > 0;
  const defaultSort = defaultSortFor(hasModules);
  const sortOptions = sortOptionsFor(hasModules);

  const searchRef = useRef(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [status, setStatus] = useState('all');
  const [openModules, setOpenModules] = useState(() => new Set());

  const { topics: visibleTopics, metrics } = useMemo(
    () => filterAndSortTopics(allTopics, { query, sort, status, srs, history, now: Date.now() }),
    [allTopics, query, sort, status, srs, history]
  );

  const hasFilters = query.trim() !== '' || status !== 'all' || sort !== defaultSort;
  const groupedMode = hasModules && !hasFilters;
  const allOpen =
    hasModules && visibleModules.every((module) => openModules.has(module.id));

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
    setSort(defaultSort);
    searchRef.current?.focus();
  };

  if (allTopics.length === 0) return <CategoryEmpty category={category} />;

  return (
    <main className="sepect-bg topic-page">
      <div className="topic-page__inner">
        <CategoryHeader category={category} />
        <CategoryControls
          categoryTitle={category.title}
          query={query}
          onQueryChange={setQuery}
          onClearQuery={() => setQuery('')}
          sort={sort}
          onSortChange={setSort}
          sortOptions={sortOptions}
          status={status}
          onStatusChange={setStatus}
          statusOptions={STATUS_OPTIONS}
          searchRef={searchRef}
        />
        {groupedMode ? (
          <GroupedModules
            categoryTitle={category.title}
            modules={visibleModules}
            openModules={openModules}
            allOpen={allOpen}
            onToggle={toggleModule}
            onToggleAll={toggleAll}
            metrics={metrics}
          />
        ) : (
          <CategoryResults
            categoryTitle={category.title}
            topics={visibleTopics}
            metrics={metrics}
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        )}
      </div>
    </main>
  );
}

export default function CategoryView({ categoryId }) {
  const category = findCategory(categoryId);
  if (!category) return <NotFound />;
  return <CategoryContent key={category.id} category={category} />;
}
