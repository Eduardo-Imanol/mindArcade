import React, { useMemo } from 'react';
import DeckOverview from '../components/DeckOverview.jsx';
import NotFound from '../components/NotFound.jsx';
import CardImage from '../components/CardImage.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { listGames } from '../games/registry.js';
import { availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';
import { topicCoverCard } from '../core/content/cover.js';
import { loadSrs } from '../core/repetition/srs.js';
import { getTopicMetrics } from '../core/metrics/metrics.js';
import { loadArcadeRecords } from '../core/storage/arcade.js';
import { createStore } from '../core/storage/store.js';
import { findCategory, findModule } from '../core/content/library.js';
import { hasSource } from '../core/content/sources.js';
import { hasExercises as hasExerciseManifest } from '../content/exercises/index.js';
import { bestRecordsByGame, buildTopicDecks } from './topicDecks.js';

export default function TopicView({ topicId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const topic = topics.find((entry) => entry.id === topicId);
  const categoryId = topic?.categoryId;
  const games = useMemo(() => listGames({ categoryId }), [categoryId]);
  const srs = useMemo(() => loadSrs(), []);
  const records = useMemo(() => loadArcadeRecords(), []);
  const history = useMemo(() => createStore().load().history || [], []);
  const now = useMemo(() => Date.now(), []);
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
  const topicSrs = useMemo(
    () => (srs && typeof srs === 'object' ? srs[topic?.id] || {} : {}),
    [srs, topic?.id]
  );
  const decks = useMemo(
    () => (topic ? buildTopicDecks(topic, topicSrs, now) : []),
    [topic, topicSrs, now]
  );
  const bestRecords = useMemo(
    () => (topic ? bestRecordsByGame(records, topic.id, games, decks) : []),
    [records, topic, games, decks]
  );
  const exerciseManifest = useMemo(
    () => (topic ? hasExerciseManifest(topic.id) : false),
    [topic]
  );

  if (!topic) {
    return <NotFound message={`Tema "${topicId}" no encontrado`} />;
  }

  const availability = games.map((game) => ({
    game,
    ...getGameAvailability(game, {
      topic,
      topics,
      decks,
      hasExercises: exerciseManifest,
    }),
  }));
  const playableCount = availability.filter((entry) => entry.playable).length;
  const metrics = getTopicMetrics(topic, srs, history, now);
  const cover = topicCoverCard(topic) || { id: topic.id, front: topic.title };
  const category = topic.categoryId ? findCategory(topic.categoryId) : null;
  const module = topic.moduleId ? findModule(topic.moduleId) : null;
  const backHref = category ? `#/categoria/${category.id}` : '#/';
  const originalSource = topic.sourcePath && hasSource(topic.sourcePath) ? topic.sourcePath : null;

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
            {originalSource ? (
              <a className="btn-neon topic-source-link" href={`#/tema/${topic.id}/fuente`}>
                Leer documento original
              </a>
            ) : null}
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

        <DeckOverview decks={decks} bestRecords={bestRecords} topicId={topic.id} />

        <div className="topic-games__head">
          <h2 className="neon topic-games__title">Elige un juego</h2>
          {games.length > 0 ? (
            <span className="topic-games__count">
              {playableCount} de {games.length} disponibles
            </span>
          ) : null}
        </div>

        {games.length > 0 ? (
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
        ) : (
          <div className="topic-games__empty" role="status">
            <p>Aún no hay juegos disponibles para esta categoría.</p>
            <a className="btn-neon" href="#/">Explorar la biblioteca</a>
          </div>
        )}
      </div>
    </main>
  );
}
