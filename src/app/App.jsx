import React from 'react';
import { useRoute } from './router.js';
import TopicsHub from '../views/TopicsHub.jsx';
import TopicView from '../views/TopicView.jsx';
import GameHost from '../views/GameHost.jsx';
import NotFound from '../components/NotFound.jsx';

export default function App() {
  const route = useRoute();
  if (route.view === 'topic') return <TopicView topicId={route.topicId} />;
  if (route.view === 'game') return <GameHost topicId={route.topicId} gameId={route.gameId} />;
  if (route.view === 'notFound') return <NotFound />;
  return <TopicsHub />;
}
