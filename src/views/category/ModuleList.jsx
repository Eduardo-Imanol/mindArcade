import React from 'react';
import TopicCard from './TopicCard.jsx';

function ModuleSection({ module, isOpen, onToggle, metrics }) {
  const panelId = `module-${module.id}-panel`;
  return (
    <section className="module" aria-labelledby={`module-${module.id}`}>
      <header className="module__header">
        <h2 className="module__heading">
          <button
            id={`module-${module.id}`}
            className="module__toggle"
            type="button"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={onToggle}
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
}

export default function ModuleList({ modules, openModules, onToggle, metrics }) {
  return modules.map((module) => (
    <ModuleSection
      key={module.id}
      module={module}
      isOpen={openModules.has(module.id)}
      onToggle={() => onToggle(module.id)}
      metrics={metrics}
    />
  ));
}
