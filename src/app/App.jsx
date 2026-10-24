import React, { useEffect } from 'react';
import { useRoute } from './router.js';
import TopicsHub from '../views/TopicsHub.jsx';
import TopicView from '../views/TopicView.jsx';
import GameHost from '../views/GameHost.jsx';
import Dashboard from '../views/Dashboard.jsx';
import NotFound from '../components/NotFound.jsx';
import CategoryView from '../views/CategoryView.jsx';
import { loadCatalog } from '../core/content/catalog.js';
import { getGame } from '../games/registry.js';
import { findCategory } from '../core/content/library.js';

export function titleForRoute(route) {
  if (route.view === 'progress') return 'Sepect — Progreso';
  if (route.view === 'notFound') return 'Sepect — 404';
  if (route.view === 'category') {
    const cat = findCategory(route.categoryId);
    return cat ? `Sepect — ${cat.title}` : 'Sepect — Categoría no encontrada';
  }
  if (route.view === 'topic') {
    const topic = loadCatalog().find((entry) => entry.id === route.topicId);
    return topic ? `Sepect — ${topic.title}` : 'Sepect — Tema no encontrado';
  }
  if (route.view === 'game') {
    const game = getGame(route.gameId);
    if (game) return `Sepect — ${game.title}`;
    const topic = loadCatalog().find((entry) => entry.id === route.topicId);
    return topic ? `Sepect — ${topic.title}` : 'Sepect — Juego';
  }
  return 'Sepect — Biblioteca';
}

export default function App() {
  const route = useRoute();

  useEffect(() => {
    document.title = titleForRoute(route);
  }, [route]);

  if (route.view === 'progress') return <Dashboard />;
  if (route.view === 'category') return <CategoryView categoryId={route.categoryId} />;
  if (route.view === 'topic') return <TopicView topicId={route.topicId} />;
  if (route.view === 'game') return <GameHost topicId={route.topicId} gameId={route.gameId} />;
  if (route.view === 'notFound') return <NotFound />;
  return <TopicsHub />;
}
