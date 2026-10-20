import React, { useMemo } from 'react';
import NotFound from '../components/NotFound.jsx';
import { listGames } from '../games/registry.js';
import { availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };

export default function TopicView({ topicId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const topic = topics.find((entry) => entry.id === topicId);

  if (!topic) {
    return <NotFound message={`Tema "${topicId}" no encontrado`} />;
  }

  return (
    <main className="sepect-bg" style={PAGE}>
      <a href="#/" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>← Volver a temas</a>
      <h1 className="neon" style={{ fontSize: 28, margin: '8px 0 0' }}>{topic.title}</h1>
      {topic.description && <p style={{ margin: '4px 0 0', opacity: 0.85 }}>{topic.description}</p>}
      <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 14 }}>{topic.cards.length} cartas</p>

      <h2 className="neon" style={{ fontSize: 18, marginTop: 20 }}>Elige un juego</h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {listGames().map((game) => {
          const availability = getGameAvailability(game, { topic, topics });
          return (
            <li key={game.id}>
              {availability.playable ? (
                <a
                  className="card-neon"
                  href={`#/tema/${topic.id}/juego/${game.id}`}
                  style={{
                    display: 'block',
                    padding: 16,
                    minHeight: 44,
                    textDecoration: 'none',
                    color: 'var(--text)',
                  }}
                >
                  <h3 className="neon" style={{ fontSize: 16, margin: 0 }}>{game.title}</h3>
                  <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>{game.description}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--neon-green)' }}>Jugar ahora</p>
                </a>
              ) : (
                <button
                  className="card-neon"
                  type="button"
                  disabled
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 16,
                    minHeight: 44,
                    textAlign: 'left',
                    color: 'var(--text)',
                    opacity: 0.55,
                    cursor: 'not-allowed',
                    background: 'var(--bg2)',
                  }}
                >
                  <h3 style={{ fontSize: 16, margin: 0 }}>{game.title}</h3>
                  <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>{game.description}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--neon-magenta)' }}>
                    {availabilityMessage(availability)}
                  </p>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
