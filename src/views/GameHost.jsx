import React, { useEffect, useMemo, useRef, useState } from 'react';
import NotFound from '../components/NotFound.jsx';
import { getGame } from '../games/registry.js';
import { availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';
import { applyGrade, loadSrs, orderDeck, saveSrs } from '../core/repetition/srs.js';
import { selectDueCards } from '../core/repetition/selectDueCards.js';
import { awardXP, recordStreak } from '../core/storage/xp.js';
import { createStore } from '../core/storage/store.js';
import { navigate } from '../app/router.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const GRADE_DIFFICULTY = { 'otra-vez': 'easy', dificil: 'hard', facil: 'easy' };

export default function GameHost({ topicId, gameId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const topic = topics.find((entry) => entry.id === topicId);
  const game = useMemo(() => getGame(gameId), [gameId]);
  const availability = useMemo(
    () => getGameAvailability(game, { topic, topics }),
    [game, topic, topics]
  );
  const [Component, setComponent] = useState(null);
  const [deck, setDeck] = useState(null);
  const [groups, setGroups] = useState(null);
  const [selectCards, setSelectCards] = useState(null);
  const srsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!topic || !game || !availability.playable || typeof game.load !== 'function') {
      return undefined;
    }
    let active = true;
    game.load().then((module) => {
      if (!active) return;
      const srs = loadSrs();
      srsRef.current = srs;
      profileRef.current = createStore().load();
      const cardsWithOverrides = (entry) => {
        const overrides = entry.images || {};
        return entry.cards.map((card) =>
          overrides[card.id] ? { ...card, image: overrides[card.id] } : card
        );
      };
      const cards = cardsWithOverrides(topic);
      const minPerTopic = game.minCardsPerTopic || game.minCards || 1;
      const nextGroups = topics
        .filter((entry) => entry.id === topic.id || entry.cards.length >= minPerTopic)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          cards: cardsWithOverrides(entry),
        }));
      setDeck(orderDeck(cards, srs[topic.id] || {}, Date.now()));
      setGroups(nextGroups);
      setSelectCards(() => (count) =>
        selectDueCards(cards, (srsRef.current || {})[topic.id] || {}, { count })
      );
      setComponent(() => module.default);
    });
    return () => {
      active = false;
    };
  }, [topic, game, topics, availability.playable]);

  if (!topic) return <NotFound message={`Tema "${topicId}" no encontrado`} />;

  if (!game || game.status !== 'available') {
    return (
      <main className="sepect-bg" style={PAGE}>
        <h1 className="neon" style={{ fontSize: 24 }}>Juego no disponible</h1>
        <p>El juego «{gameId}» aún no existe o llegará próximamente.</p>
        <a className="btn-neon" href="#/" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Volver al inicio
        </a>
      </main>
    );
  }

  if (!availability.playable) {
    return (
      <main className="sepect-bg" style={PAGE}>
        <h1 className="neon" style={{ fontSize: 24 }}>Juego no disponible</h1>
        <p>{availabilityMessage(availability)}</p>
        <a
          className="btn-neon"
          href={`#/tema/${topic.id}`}
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          Volver al tema
        </a>
      </main>
    );
  }

  if (!Component || deck === null || groups === null || !selectCards) {
    return (
      <main className="sepect-bg" style={PAGE}>
        <p role="status">Cargando juego…</p>
      </main>
    );
  }

  const onGrade = (cardId, grade, context) => {
    const correct = grade !== 'otra-vez';
    const now = Date.now();
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
      at: new Date(now).toISOString(),
    });

    return { gained: xp.gained, total: xp.total };
  };

  return (
    <Component
      deck={deck}
      groups={groups}
      anchorTopicId={topic.id}
      selectCards={selectCards}
      onGrade={onGrade}
      onExit={() => navigate(`#/tema/${topic.id}`)}
    />
  );
}
