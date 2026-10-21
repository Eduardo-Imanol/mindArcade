// src/games/registry.js — stable game catalog built with defineGame; load() resolves { default: Component }
import { defineGame } from './definition.js';
import { gameArtUrl } from './art.js';

const GAMES = [
  defineGame({
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Voltea la carta y autoevalúa tu memoria.',
    art: gameArtUrl('flashcards') || undefined,
    status: 'available',
    minCards: 1,
    load: () => import('./flashcards/index.jsx'),
  }),
  defineGame({
    id: 'memorama',
    title: 'Memorama',
    description: 'Empareja cada término con su significado.',
    art: gameArtUrl('memorama') || undefined,
    status: 'available',
    minCards: 4,
    load: () => import('./memorama/index.jsx'),
  }),
  defineGame({
    id: 'ahorcado',
    title: 'Ahorcado',
    description: 'Adivina el término letra a letra usando el significado como pista.',
    art: gameArtUrl('ahorcado') || undefined,
    status: 'available',
    minCards: 3,
    load: () => import('./ahorcado/index.jsx'),
  }),
  defineGame({
    id: 'quiz-significado',
    title: 'Elige el significado',
    description: 'Elige la opción correcta entre cuatro significados.',
    art: gameArtUrl('quiz-significado') || undefined,
    status: 'available',
    minCards: 4,
    load: () => import('./quiz-significado/index.jsx'),
  }),
  defineGame({
    id: 'intruso',
    title: 'El intruso',
    description: 'Encuentra el significado que no pertenece al set.',
    art: gameArtUrl('intruso') || undefined,
    status: 'available',
    minCards: 3,
    minTopics: 2,
    minCardsPerTopic: 3,
    load: () => import('./intruso/index.jsx'),
  }),
  defineGame({
    id: 'lluvia-meteoros',
    title: 'Lluvia de meteoros',
    description: 'Responde antes de que el meteoro caiga.',
    art: gameArtUrl('lluvia-meteoros') || undefined,
    status: 'available',
    minCards: 6,
    load: () => import('./lluvia-meteoros/index.jsx'),
  }),
  defineGame({
    id: 'conecta-pares',
    title: 'Conecta pregunta–significado',
    description: 'Une cada pregunta con su significado tocando ambas columnas.',
    art: gameArtUrl('conecta-pares') || undefined,
    status: 'available',
    minCards: 3,
    load: () => import('./conecta-pares/index.jsx'),
  }),
  defineGame({
    id: 'serpiente-significados',
    title: 'Serpiente de significados',
    description: 'La serpiente come la fruta con el significado correcto.',
    art: gameArtUrl('serpiente-significados') || undefined,
    status: 'available',
    minCards: 4,
    load: () => import('./serpiente-significados/index.jsx'),
  }),
];

export function listGames() {
  return [...GAMES];
}

export function getGame(id) {
  return GAMES.find((entry) => entry.id === id) || null;
}
