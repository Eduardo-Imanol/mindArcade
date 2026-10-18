import React, { useEffect, useMemo, useRef, useState } from 'react';
import NotFound from '../components/NotFound.jsx';
import { getGame } from '../games/registry.js';
import { loadCatalog } from '../core/content/catalog.js';
import { applyGrade, loadSrs, orderDeck, saveSrs } from '../core/repetition/srs.js';
import { awardXP, recordStreak } from '../core/storage/xp.js';
import { createStore } from '../core/storage/store.js';
import { navigate } from '../app/router.js';

const PAGE = { minHeight: '100vh', padding: 16, maxWidth: 720, margin: '0 auto' };
const GRADE_DIFFICULTY = { 'otra-vez': 'easy', dificil: 'hard', facil: 'easy' };

export default function GameHost({ topicId, gameId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const topic = topics.find((entry) => entry.id === topicId);
  const game = useMemo(() => getGame(gameId), [gameId]);
  const [Component, setComponent] = useState(null);
  const [deck, setDeck] = useState(null);
  const srsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!topic || !game || game.status !== 'available' || typeof game.load !== 'function') {
      return undefined;
    }
    let active = true;
    game.load().then((module) => {
      if (!active) return;
      const srs = loadSrs();
      srsRef.current = srs;
      profileRef.current = createStore().load();
      const overrides = topic.images || {};
      const cards = topic.cards.map((card) =>
        overrides[card.id] ? { ...card, image: overrides[card.id] } : card
      );
      setDeck(orderDeck(cards, srs[topic.id] || {}, Date.now()));
      setComponent(() => module.default);
    });
    return () => {
      active = false;
    };
  }, [topic, game]);

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

  if (!Component || deck === null) {
    return (
      <main className="sepect-bg" style={PAGE}>
        <p role="status">Cargando juego…</p>
      </main>
    );
  }

  const onGrade = (cardId, grade) => {
    const correct = grade !== 'otra-vez';
    const now = Date.now();

    const nextSrs = applyGrade(srsRef.current || {}, topic.id, cardId, grade, now);
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
      topicId: topic.id,
      cardId,
      grade,
      at: new Date(now).toISOString(),
    });

    return { gained: xp.gained, total: xp.total };
  };

  return (
    <Component
      deck={deck}
      onGrade={onGrade}
      onExit={() => navigate(`#/tema/${topic.id}`)}
    />
  );
}
