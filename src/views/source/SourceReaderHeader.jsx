import React from 'react';
import SoundToggle from '../../components/SoundToggle.jsx';

export default function SourceReaderHeader({ topic, category, stats, blocks }) {
  return (
    <>
      <nav className="source-reader__breadcrumb" aria-label="Ruta de navegación">
        <a className="topic-back" href={`#/tema/${topic.id}`}>← Volver a {topic.title}</a>
        {category ? <p className="source-reader__eyebrow">{category.title}</p> : null}
      </nav>

      <header className="source-reader__header card-neon">
        <div className="source-reader__header-text">
          <p className="source-reader__kicker">Documento fuente</p>
          <h1 className="neon source-reader__title">{topic.title}</h1>
          <p className="source-reader__subtitle">
            El material completo del que nacieron las {topic.cards.length} cartas de este tema.
          </p>
          {stats ? (
            <ul className="source-reader__meta" aria-label="Datos del documento">
              <li>{stats.words.toLocaleString('es-ES')} palabras</li>
              <li>{stats.minutes} min de lectura</li>
              <li>{blocks.length} bloques</li>
            </ul>
          ) : null}
        </div>
        <div className="source-reader__header-actions">
          <SoundToggle />
        </div>
      </header>
    </>
  );
}
