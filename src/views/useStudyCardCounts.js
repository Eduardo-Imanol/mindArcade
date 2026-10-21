// src/views/useStudyCardCounts.js — shared study-card counter (TopicView + GameHost)
import { useMemo } from 'react';
import { selectStudyCards } from '../core/repetition/selectStudyCards.js';

export function useStudyCardCounts(topics, srs) {
  const now = useMemo(() => Date.now(), []);
  return useMemo(() => {
    const counts = {};
    for (const entry of topics) {
      counts[entry.id] = selectStudyCards(entry.cards, srs[entry.id] || {}, {
        count: entry.cards.length,
        now,
      }).length;
    }
    return counts;
  }, [topics, srs, now]);
}
