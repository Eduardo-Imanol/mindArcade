import React from 'react';
import ModuleList from './ModuleList.jsx';

export default function GroupedModules({
  categoryTitle,
  modules,
  openModules,
  allOpen,
  onToggle,
  onToggleAll,
  metrics,
}) {
  return (
    <>
      <div className="category__actions">
        <button className="btn-neon" type="button" onClick={onToggleAll}>
          {allOpen ? 'Cerrar módulos' : 'Abrir módulos'}
        </button>
      </div>
      <section className="category" aria-label={`Módulos de ${categoryTitle}`}>
        <ModuleList
          modules={modules}
          openModules={openModules}
          onToggle={onToggle}
          metrics={metrics}
        />
      </section>
    </>
  );
}
