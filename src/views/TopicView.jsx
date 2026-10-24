import React, { useMemo } from 'react';
import NotFound from '../components/NotFound.jsx';
import CardImage from '../components/CardImage.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { listGames } from '../games/registry.js';
import { availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';
import { topicCoverCard } from '../core/content/cover.js';
import { loadSrs } from '../core/repetition/srs.js';
import { getTopicMetrics } from '../core/metrics/metrics.js';
import { createStore } from '../core/storage/store.js';
import { useStudyCardCounts } from './useStudyCardCounts.js';
import { findCategory, findModule } from '../core/content/library.js';

export default function TopicView({ topicId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const games = useMemo(() => listGames(), []);
  const srs = useMemo(() => loadSrs(), []);
  const history = useMemo(() => createStore().load().history || [], []);
  const now = useMemo(() => Date.now(), []);
  const studyCardCounts = useStudyCardCounts(topics, srs);
  const gameArt = useMemo(
    () =>
      Object.fromEntries(
        games.map((game) => [
          game.id,
          game.art ? { kind: 'url', value: game.art } : null,
        ])
      ),
    [games]
  );
  const topic = topics.find((entry) => entry.id === topicId);

  if (!topic) {
    return <NotFound message={`Tema "${topicId}" no encontrado`} />;
  }

  const availability = games.map((game) => ({
    game,
    ...getGameAvailability(game, { topic, topics, studyCardCounts }),
  }));
  const playableCount = availability.filter((entry) => entry.playable).length;
  const metrics = getTopicMetrics(topic, srs, history, now);
  const cover = topicCoverCard(topic) || { id: topic.id, front: topic.title };
  const category = topic.categoryId ? findCategory(topic.categoryId) : null;
  const module = topic.moduleId ? findModule(topic.moduleId) : null;
  const backHref = category ? `#/categoria/${category.id}` : '#/';

  return (
    <main className="sepect-bg topic-page">
      <div className="topic-page__inner">
        <nav className="topic-breadcrumb" aria-label="Ruta de navegación">
          <a className="topic-back" href={backHref}>← {category ? `Volver a ${category.title}` : 'Volver a biblioteca'}</a>
          {category && module ? (
            <p className="topic-breadcrumb__path">
              {category.title} / {module.title} / <strong>{topic.title}</strong>
            </p>
          ) : category ? (
            <p className="topic-breadcrumb__path">
              {category.title} / <strong>{topic.title}</strong>
            </p>
          ) : null}
        </nav>

        <header className="topic-header">
          <div className="topic-header__text">
            <h1 className="neon topic-title">{topic.title}</h1>
            {topic.description && <p className="topic-description">{topic.description}</p>}
          </div>
          <div className="topic-header__side">
            <span className="topic-cards">{topic.cards.length} cartas</span>
            <a className="btn-neon topic-progress-link" href="#/progreso">Progreso</a>
          </div>
        </header>

        <section className="topic-metrics" aria-label="Progreso del tema">
          <ProgressBar value={metrics.progress} label={`Progreso de ${topic.title}`} />
          <p className="topic-metrics__stats">
            {metrics.learned} aprendidas · {metrics.notLearned} por aprender ·{' '}
            {metrics.dueNow} para repasar
          </p>
          <p className="topic-metrics__days">
            {metrics.daysStudied === 0
              ? 'Sin sesiones todavía'
              : `${metrics.daysStudied} día${metrics.daysStudied === 1 ? '' : 's'} de estudio`}
          </p>
        </section>

        <div className="topic-games__head">
          <h2 className="neon topic-games__title">Elige un juego</h2>
          <span className="topic-games__count">
            {playableCount} de {games.length} disponibles
          </span>
        </div>

        <ul className="game-grid">
          {availability.map(({ game, playable, ...state }) => {
            const content = (
              <>
                <div className="game-tile__media">
                  <CardImage
                    image={gameArt[game.id]}
                    card={cover}
                    alt=""
                    fill
                    className="game-tile__img"
                  />
                </div>
                <div className="game-tile__body">
                  <h3 className="game-tile__title">{game.title}</h3>
                  <p className="game-tile__cta" id={`game-availability-${game.id}`}>
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
                    aria-describedby={`game-availability-${game.id}`}
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
