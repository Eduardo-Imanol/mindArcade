import React, { useMemo } from 'react';
import NotFound from '../components/NotFound.jsx';
import { listGames } from '../games/registry.js';
import { gameArtUrl } from '../games/art.js';
import { availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';

export default function TopicView({ topicId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const games = useMemo(() => listGames(), []);
  const topic = topics.find((entry) => entry.id === topicId);

  if (!topic) {
    return <NotFound message={`Tema "${topicId}" no encontrado`} />;
  }

  const availability = games.map((game) => ({
    game,
    ...getGameAvailability(game, { topic, topics }),
  }));
  const playableCount = availability.filter((entry) => entry.playable).length;

  return (
    <main className="sepect-bg topic-page">
      <div className="topic-page__inner">
        <a className="topic-back" href="#/">← Volver a temas</a>

        <header className="topic-header">
          <div className="topic-header__text">
            <h1 className="neon topic-title">{topic.title}</h1>
            {topic.description && <p className="topic-description">{topic.description}</p>}
          </div>
          <span className="topic-cards">{topic.cards.length} cartas</span>
        </header>

        <div className="topic-games__head">
          <h2 className="neon topic-games__title">Elige un juego</h2>
          <span className="topic-games__count">
            {playableCount} de {games.length} disponibles
          </span>
        </div>

        <ul className="game-grid">
          {availability.map(({ game, playable, ...state }) => {
            const art = gameArtUrl(game.id);
            const content = (
              <>
                <div className="game-tile__media">
                  {art && (
                    <img
                      className="game-tile__img"
                      src={art}
                      alt=""
                      loading="lazy"
                      width="512"
                      height="320"
                    />
                  )}
                </div>
                <div className="game-tile__body">
                  <h3 className="game-tile__title">{game.title}</h3>
                  <p className="game-tile__desc">{game.description}</p>
                  <p className="game-tile__cta">
                    {playable ? 'Jugar ahora →' : availabilityMessage(state)}
                  </p>
                </div>
              </>
            );

            return (
              <li key={game.id} className="game-grid__item">
                {playable ? (
                  <a
                    className="card-neon game-tile"
                    href={`#/tema/${topic.id}/juego/${game.id}`}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    className="card-neon game-tile game-tile--disabled"
                    type="button"
                    disabled
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
