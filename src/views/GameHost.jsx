import React, { useEffect, useMemo, useRef, useState } from 'react';
import NotFound from '../components/NotFound.jsx';
import { getGame, isGameForCategory } from '../games/registry.js';
import { availabilityMessage, getGameAvailability } from '../games/availability.js';
import { loadCatalog } from '../core/content/catalog.js';
import { findCategory } from '../core/content/library.js';
import { applyGrade, loadSrs, saveSrs } from '../core/repetition/srs.js';
import { DECK_SIZE, buildDecks } from '../core/repetition/decks.js';
import { selectStudyCards } from '../core/repetition/selectStudyCards.js';
import { GRADE_XP } from '../core/metrics/metrics.js';
import { awardXP, recordStreak } from '../core/storage/xp.js';
import { createStore } from '../core/storage/store.js';
import { bestFor, loadArcadeRecords, recordArcadeRun } from '../core/storage/arcade.js';
import {
  loadExerciseProgress,
  recordExerciseResult,
} from '../core/storage/exercises.js';
import { parseExercisesMarkdown } from '../core/exercises/parse.js';
import { validateExercises } from '../core/exercises/schema.js';
import { hasExercises as hasExerciseManifest, loadExercises } from '../content/exercises/index.js';
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
  const [srs, setSrs] = useState(() => loadSrs());
  const srsRef = useRef(srs);
  const profileRef = useRef(null);
  const [Component, setComponent] = useState(null);
  const [deck, setDeck] = useState(null);
  const [groups, setGroups] = useState(null);
  const [selectCards, setSelectCards] = useState(null);
  const [records, setRecords] = useState(() => loadArcadeRecords());
  const [exerciseDoc, setExerciseDoc] = useState(undefined);
  const [exerciseProgress, setExerciseProgress] = useState(() => loadExerciseProgress());

  const cards = useMemo(() => (topic ? cardsWithOverrides(topic) : []), [topic]);
  const topicSrs = useMemo(
    () => (srs && typeof srs === 'object' ? srs[topic?.id] || {} : {}),
    [srs, topic?.id]
  );
  const decks = useMemo(
    () => (topic ? buildDecks(cards, topicSrs, { size: DECK_SIZE, now }) : []),
    [topic, cards, topicSrs, now]
  );
  const exerciseDecks = useMemo(
    () => (topic ? buildDecks(cards, {}, { size: DECK_SIZE, now }) : []),
    [topic, cards, now]
  );
  const allGroups = useMemo(
    () =>
      topics.map((entry) => ({
        id: entry.id,
        title: entry.title,
        cards: cardsWithOverrides(entry),
      })),
    [topics]
  );
  const best = useMemo(() => {
    if (!topic || !game) return {};
    return Object.fromEntries(
      decks.map((entry) => [entry.id, bestFor(records, topic.id, game.id, entry.id)])
    );
  }, [records, decks, topic, game]);

  const studyCardCounts = useStudyCardCounts(topics, srs);
  const exerciseManifest = useMemo(
    () => (topicId ? hasExerciseManifest(topicId) : false),
    [topicId]
  );

  const availability = useMemo(
    () =>
      getGameAvailability(game, {
        topic,
        topics,
        studyCardCounts,
        decks,
        hasExercises: exerciseManifest,
      }),
    [game, topic, topics, studyCardCounts, decks, exerciseManifest]
  );
  const categoryAllowed = isGameForCategory(game, topic?.categoryId);

  useEffect(() => {
    if (!game?.needsExercises) {
      setExerciseDoc(undefined);
      return undefined;
    }
    if (!topic || !categoryAllowed || !exerciseManifest) {
      setExerciseDoc(null);
      return undefined;
    }
    let active = true;
    setExerciseDoc(undefined);
    loadExercises(topic.id)
      .then((md) => {
        if (!active) return;
        if (typeof md !== 'string') {
          setExerciseDoc({
            topicId: topic.id,
            decks: [],
            errors: ['No se pudieron cargar los ejercicios.'],
          });
          return;
        }
        const parsed = parseExercisesMarkdown(md, { topicId: topic.id });
        const validation = validateExercises(topic.id, parsed, {
          cards,
          decks: exerciseDecks,
        });
        const errors = [...parsed.errors, ...validation.errors];
        const minExercises = Number(game.minExercises) > 0 ? Number(game.minExercises) : 2;
        const playable = parsed.decks.some(
          (deck) =>
            Array.isArray(deck.exercises) && deck.exercises.length >= minExercises
        );
        if (!playable) {
          errors.push(`Cada mazo necesita al menos ${minExercises} ejercicios`);
        }
        setExerciseDoc({ ...parsed, errors });
      })
      .catch(() => {
        if (!active) return;
        setExerciseDoc({
          topicId: topic.id,
          decks: [],
          errors: ['No se pudieron cargar los ejercicios.'],
        });
      });
    return () => {
      active = false;
    };
  }, [game, topic, categoryAllowed, exerciseManifest, cards, exerciseDecks]);

  useEffect(() => {
    if (
      !topic ||
      !game ||
      !categoryAllowed ||
      !availability.playable ||
      typeof game.load !== 'function'
    ) {
      return undefined;
    }
    let active = true;
    game.load().then((module) => {
      if (!active) return;
      profileRef.current = createStore().load();
      const liveSrs = srsRef.current || {};
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
      setGroups(nextGroups);
      setSelectCards(() => (count) =>
        selectStudyCards(cards, (srsRef.current || {})[topic.id] || {}, { count, now })
      );
      setComponent(() => module.default);
    });
    return () => {
      active = false;
    };
  }, [topic, game, topics, categoryAllowed, availability.playable, now, cards, topicSrs]);

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

  if (!categoryAllowed) {
    const gameCategory = game.categories
      .filter((id) => id !== '*')
      .map((id) => findCategory(id)?.title || id)
      .join(', ');
    const topicCategory = topic.categoryId
      ? findCategory(topic.categoryId)?.title || topic.categoryId
      : 'otra categoría';

    return (
      <main className="sepect-bg topic-page error-page">
        <h1 className="neon game-app-title">Juego no disponible para esta categoría</h1>
        <p>
          «{game.title}» solo está disponible en {gameCategory}. Este tema pertenece a{' '}
          {topicCategory}.
        </p>
        <a className="btn-neon" href={`#/tema/${topic.id}`}>
          Volver a {topic.title}
        </a>
      </main>
    );
  }

  if (!availability.playable) {
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

  if (!Component || deck === null || groups === null || !selectCards) {
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
    setSrs(nextSrs);
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

  const onArcadeEnd = (run = {}) => {
    if (!topic || !game) return { best: 0, isRecord: false };
    const result = recordArcadeRun({ ...run, topicId: topic.id, gameId: game.id });
    if (result.ok) setRecords(result.records);
    return { best: result.best, isRecord: Boolean(result.isRecord) };
  };

  const onExerciseResult = (run = {}) => {
    if (!topic) return;
    const result = recordExerciseResult({
      ...run,
      topicId: run.topicId || topic.id,
    });
    setExerciseProgress(result.progress);
  };

  return (
    <Component
      deck={deck}
      decks={decks}
      best={best}
      groups={groups}
      allGroups={allGroups}
      anchorTopicId={topic.id}
      selectCards={selectCards}
      topic={topic}
      exercises={game.needsExercises ? exerciseDoc : undefined}
      exerciseProgress={exerciseProgress}
      onExerciseResult={onExerciseResult}
      onGrade={onGrade}
      onArcadeEnd={onArcadeEnd}
      onExit={() => navigate(`#/tema/${topic.id}`)}
    />
  );
}
