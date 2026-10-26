import React from 'react';

export default function CategoryHeader({ category }) {
  return (
    <header className="hub-header">
      <div>
        <a className="topic-back" href="#/">← Biblioteca</a>
        <h1 className="neon hub-title">{category.title}</h1>
        <p className="hub-subtitle">{category.description || ''}</p>
      </div>
    </header>
  );
}
