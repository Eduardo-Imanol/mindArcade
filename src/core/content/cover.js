// src/core/content/cover.js — portada determinista del tema: primera imagen explícita
function hasExplicitImage(image) {
  if (!image) return false;
  if (typeof image === 'string') return image.trim().length > 0;
  if (typeof image === 'object') {
    return typeof image.value === 'string' && image.value.trim().length > 0;
  }
  return false;
}

export function topicCoverCard(topic = {}) {
  const cards = Array.isArray(topic?.cards) ? topic.cards : [];
  if (cards.length === 0) return null;
  const overrides = topic?.images && typeof topic.images === 'object' ? topic.images : {};
  const withImage = cards.find(
    (card) => card && (hasExplicitImage(card.image) || hasExplicitImage(overrides[card.id]))
  );
  return withImage || cards[0];
}
