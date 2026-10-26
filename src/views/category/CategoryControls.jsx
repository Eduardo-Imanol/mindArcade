import React from 'react';

function SearchField({ categoryTitle, value, onChange, onClear, inputRef }) {
  return (
    <div className="hub-search">
      <span className="hub-search__icon" aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        id="category-search"
        type="search"
        className="hub-field"
        aria-label={`Buscar temas en ${categoryTitle}`}
        placeholder="Buscar por título o descripción"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value !== '' ? (
        <button
          className="btn-neon hub-search__clear"
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={onClear}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, ariaLabel, value, options, onChange }) {
  return (
    <label className="hub-control">
      <span>{label}</span>
      <select
        className="hub-select"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function CategoryControls({
  categoryTitle,
  query,
  onQueryChange,
  onClearQuery,
  sort,
  onSortChange,
  sortOptions,
  status,
  onStatusChange,
  statusOptions,
  searchRef,
}) {
  return (
    <div className="hub-controls category-controls">
      <SearchField
        categoryTitle={categoryTitle}
        value={query}
        onChange={onQueryChange}
        onClear={onClearQuery}
        inputRef={searchRef}
      />
      <FilterSelect
        label="Ordenar"
        ariaLabel="Ordenar temas"
        value={sort}
        options={sortOptions}
        onChange={onSortChange}
      />
      <FilterSelect
        label="Estado"
        ariaLabel="Filtrar por estado"
        value={status}
        options={statusOptions}
        onChange={onStatusChange}
      />
    </div>
  );
}
