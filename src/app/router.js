// src/app/router.js — in-house hash mini-router (frozen routes)
import { useEffect, useState } from 'react';

export function parseHash(hash = '') {
  try {
    const raw = String(hash ?? '').replace(/^#/, '');
    const path = raw.split('?')[0];
    const parts = path
      .split('/')
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));
    if (parts.length === 0) return { view: 'hub' };
    if (parts.length === 1 && parts[0] === 'progreso') return { view: 'progress' };
    if (parts.length === 2 && parts[0] === 'categoria') {
      return { view: 'category', categoryId: parts[1] };
    }
    if (parts[0] !== 'tema') return { view: 'notFound' };
    if (parts.length === 2) return { view: 'topic', topicId: parts[1] };
    if (parts.length === 4 && parts[2] === 'juego') {
      return { view: 'game', topicId: parts[1], gameId: parts[3] };
    }
    return { view: 'notFound' };
  } catch {
    return { view: 'notFound' };
  }
}

export function navigate(to = '#/') {
  if (typeof window === 'undefined') return;
  const target = String(to);
  window.location.hash = target.startsWith('#') ? target : `#${target}`;
}

export function useRoute() {
  const [route, setRoute] = useState(() =>
    typeof window === 'undefined' ? { view: 'hub' } : parseHash(window.location.hash)
  );
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    onChange();
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
