// src/games/registry.js — stable game catalog; load() resolves { default: Component }
const GAMES = [
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Voltea la carta y autoevalúa tu memoria.',
    status: 'available',
    minCards: 1,
    load: () => import('./flashcards/index.jsx'),
  },
  {
    id: 'memorama',
    title: 'Memorama',
    description: 'Empareja cada término con su significado.',
    status: 'available',
    minCards: 4,
    load: () => import('./memorama/index.jsx'),
  },
  {
    id: 'ahorcado',
    title: 'Ahorcado',
    description: 'Adivina el término letra a letra usando el significado como pista.',
    status: 'available',
    minCards: 3,
    load: () => import('./ahorcado/index.jsx'),
  },
  {
    id: 'quiz-significado',
    title: 'Elige el significado',
    description: 'Elige la opción correcta entre cuatro significados.',
    status: 'available',
    minCards: 4,
    load: () => import('./quiz-significado/index.jsx'),
  },
  {
    id: 'intruso',
    title: 'El intruso',
    description: 'Encuentra el significado que no pertenece al set.',
    status: 'available',
    minCards: 3,
    minTopics: 2,
    minCardsPerTopic: 3,
    load: () => import('./intruso/index.jsx'),
  },
  {
    id: 'lluvia-meteoros',
    title: 'Lluvia de meteoros',
    description: 'Responde antes de que el meteoro caiga.',
    status: 'available',
    minCards: 6,
    load: () => import('./lluvia-meteoros/index.jsx'),
  },
  {
    id: 'conecta-pares',
    title: 'Conecta pregunta–significado',
    description: 'Une cada pregunta con su significado tocando ambas columnas.',
    status: 'available',
    minCards: 3,
    load: () => import('./conecta-pares/index.jsx'),
  },
  {
    id: 'serpiente-significados',
    title: 'Serpiente de significados',
    description: 'La serpiente come la fruta con el significado correcto.',
    status: 'available',
    minCards: 4,
    load: () => import('./serpiente-significados/index.jsx'),
  },
];

export function listGames() {
  return GAMES.map((game) => ({ ...game }));
}

export function getGame(id) {
  const game = GAMES.find((entry) => entry.id === id);
  return game ? { ...game } : null;
}
