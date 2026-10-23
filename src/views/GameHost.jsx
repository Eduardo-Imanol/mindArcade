import React, { useEffect, useMemo, useRef, useState } from 'react';
import NotFound from '../components/NotFound.jsx';
import { getGame } from '../games/registry.js';
import { AVAILABILITY_REASONS, availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';
import { applyGrade, loadSrs, saveSrs } from '../core/repetition/srs.js';
import { buildFlashcardDecks } from '../core/repetition/flashcardDecks.js';
import { selectStudyCards } from '../core/repetition/selectStudyCards.js';
import { GRADE_XP } from '../core/metrics/metrics.js';
import { awardXP, recordStreak } from '../core/storage/xp.js';
import { createStore } from '../core/storage/store.js';
import { navigate } from '../app/router.js';
import { useStudyCardCounts } from './useStudyCardCounts.js';

const GRADE_DIFFICULTY = { 'otra-vez': 'easy', dificil: 'hard', facil: 'easy' };

function cardsWithOverrides(entry) {
  const overrides = entry.images || {};
  return entry.cards.map((card) =>
    overrides[card.id] ? { ...card, image: overrides[card.id] } : card
  );
}

export default function GameHost({ topicId, gameId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const topic = topics.find((entry) => entry.id === topicId);
  const game = useMemo(() => getGame(gameId), [gameId]);
  const [now] = useState(() => Date.now());
  const srs = useMemo(() => loadSrs(), []);
  const srsRef = useRef(srs);
  const profileRef = useRef(null);
  const [Component, setComponent] = useState(null);
  const [deck, setDeck] = useState(null);
  const [decks, setDecks] = useState(null);
  const [groups, setGroups] = useState(null);
  const [selectCards, setSelectCards] = useState(null);

  const studyCardCounts = useStudyCardCounts(topics, srs);

  const availability = useMemo(
    () => getGameAvailability(game, { topic, topics, studyCardCounts }),
    [game, topic, topics, studyCardCounts]
  );

  useEffect(() => {
    if (!topic || !game || !availability.playable || typeof game.load !== 'function') {
      return undefined;
    }
    let active = true;
    game.load().then((module) => {
      if (!active) return;
      profileRef.current = createStore().load();
      const liveSrs = srsRef.current || {};
      const cards = cardsWithOverrides(topic);
      const minPerTopic = game.minCardsPerTopic || game.minCards || 1;
      const eligibleFor = (entry) => {
        const entryCards = cardsWithOverrides(entry);
        return selectStudyCards(entryCards, liveSrs[entry.id] || {}, {
          count: entryCards.length,
          now,
        });
      };
      const nextGroups = topics
        .filter((entry) => entry.id === topic.id || eligibleFor(entry).length >= minPerTopic)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          cards: eligibleFor(entry),
        }));
      const topicSrs = liveSrs && typeof liveSrs === 'object' ? liveSrs[topic.id] : null;
      setDeck(
        selectStudyCards(cards, topicSrs || {}, { count: cards.length, now })
      );
      setDecks(buildFlashcardDecks(cards, topicSrs || {}));
      setGroups(nextGroups);
      setSelectCards(() => (count) =>
        selectStudyCards(cards, (srsRef.current || {})[topic.id] || {}, { count, now })
      );
      setComponent(() => module.default);
    });
    return () => {
      active = false;
    };
  }, [topic, game, topics, availability.playable, now]);

  if (!topic) return <NotFound message={`Tema "${topicId}" no encontrado`} />;

  if (!game || game.status !== 'available') {
    return (
      <main className="sepect-bg topic-page error-page">
        <h1 className="neon game-app-title">Juego no disponible</h1>
        <p>El juego «{gameId}» aún no existe o llegará próximamente.</p>
        <a className="btn-neon" href="#/">
          Volver al inicio
        </a>
      </main>
    );
  }

  if (!availability.playable) {
    if (availability.reason === AVAILABILITY_REASONS.allCaughtUp) {
      return (
        <main className="sepect-bg topic-page error-page">
          <h1 className="neon game-app-title">Todo al día</h1>
          <p>No tienes cartas por aprender o repasar en este tema ahora mismo.</p>
          <p>Repasarás automáticamente cuando cada carta venza.</p>
          <a
            className="btn-neon"
            href={`#/tema/${topic.id}`}
          >
            Volver al tema
          </a>
        </main>
      );
    }
    return (
      <main className="sepect-bg topic-page error-page">
        <h1 className="neon game-app-title">Juego no disponible</h1>
        <p>{availabilityMessage(availability)}</p>
        <a
          className="btn-neon"
          href={`#/tema/${topic.id}`}
        >
          Volver al tema
        </a>
      </main>
    );
  }

  if (!Component || deck === null || decks === null || groups === null || !selectCards) {
    return (
      <main className="sepect-bg topic-page game-loading-page">
        <div className="game-loading" role="status" aria-live="polite">
          <div className="game-loading__orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="game-loading__eyebrow">Un momento</p>
          <h1 className="neon game-app-title">Preparando partida</h1>
          <p className="game-loading__topic">{topic.title}</p>
          <p className="game-loading__text">Cargando juego…</p>
          <div className="game-loading__bar" aria-hidden="true">
            <span />
          </div>
        </div>
      </main>
    );
  }

  const onGrade = (cardId, grade, context) => {
    const correct = grade !== 'otra-vez';
    const targetTopicId =
      context &&
      typeof context.topicId === 'string' &&
      topics.some((entry) => entry.id === context.topicId)
        ? context.topicId
        : topic.id;

    const nextSrs = applyGrade(srsRef.current || {}, targetTopicId, cardId, grade, now);
    srsRef.current = nextSrs;
    saveSrs(nextSrs);

    const xp = awardXP(profileRef.current || {}, {
      correct,
      difficulty: GRADE_DIFFICULTY[grade] || 'easy',
    });
    let nextProfile = { ...(profileRef.current || {}), xp: xp.total };
    nextProfile = recordStreak(nextProfile);

    const store = createStore();
    profileRef.current = store.addAttempt(nextProfile, {
      topicId: targetTopicId,
      cardId,
      grade,
      xp: GRADE_XP[grade] ?? 0,
      at: new Date().toISOString(),
    });

    return { gained: xp.gained, total: xp.total };
  };

  return (
    <Component
      deck={deck}
      decks={decks}
      groups={groups}
      anchorTopicId={topic.id}
      selectCards={selectCards}
      onGrade={onGrade}
      onExit={() => navigate(`#/tema/${topic.id}`)}
    />
  );
}
