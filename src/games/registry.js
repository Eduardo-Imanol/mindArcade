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
    id: 'sopa-de-letras',
    title: 'Sopa de letras',
    description: 'Encuentra los términos ocultos en la cuadrícula.',
    status: 'soon',
    minCards: 4,
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
    id: 'caza-significados',
    title: 'Caza de significados',
    description: 'Arcade cronometrado: atrapa la opción correcta antes de que escape.',
    status: 'soon',
    minCards: 4,
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
    status: 'soon',
    minCards: 6,
  },
  {
    id: 'conecta-pares',
    title: 'Conecta palabra–significado',
    description: 'Une término y significado tocando ambas columnas.',
    status: 'soon',
    minCards: 3,
  },
  {
    id: 'serpiente-significados',
    title: 'Serpiente de significados',
    description: 'La serpiente come la fruta con el significado correcto.',
    status: 'soon',
    minCards: 4,
  },
];

export function listGames() {
  return GAMES.map((game) => ({ ...game }));
}

export function getGame(id) {
  const game = GAMES.find((entry) => entry.id === id);
  return game ? { ...game } : null;
}
