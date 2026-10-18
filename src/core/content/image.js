// src/core/content/image.js — pure image resolution with precedence + emoji dictionary
export const EMOJI_DICT = {
  perro: '🐶',
  dog: '🐶',
  gato: '🐱',
  cat: '🐱',
  casa: '🏠',
  house: '🏠',
  manzana: '🍎',
  apple: '🍎',
  libro: '📚',
  book: '📚',
  sol: '☀️',
  sun: '☀️',
  agua: '💧',
  water: '💧',
  fuego: '🔥',
  fire: '🔥',
  coche: '🚗',
  car: '🚗',
  arbol: '🌳',
  tree: '🌳',
  luna: '🌙',
  moon: '🌙',
  estrella: '⭐',
  star: '⭐',
  corazon: '❤️',
  heart: '❤️',
  funcion: '🧩',
  function: '🧩',
  variable: '📦',
  parametro: '🎛️',
  parameter: '🎛️',
  closure: '🔒',
  recursion: '🔁',
  bucle: '🔁',
  loop: '🔁',
  futuro: '⏳',
  future: '⏳',
  async: '⏳',
  stream: '🌊',
  clase: '🏛️',
  class: '🏛️',
  algebra: '➗',
  fisica: '🧲',
  historia: '🏺',
  quimica: '🧪',
  verbo: '📝',
  noun: '📝',
};

export function normalizeText(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findEmoji(front = '', dict = EMOJI_DICT) {
  const norm = normalizeText(front);
  if (!norm) return null;
  if (dict[norm]) return dict[norm];
  for (const word of norm.split(' ')) {
    if (word.length > 2 && dict[word]) return dict[word];
  }
  return null;
}

function normalizeImage(image) {
  if (!image) return null;
  if (typeof image === 'string') {
    const value = image.trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return { kind: 'url', value };
    if (/^asset:/i.test(value)) return { kind: 'asset', value: value.slice(6).trim() };
    return { kind: 'emoji', value };
  }
  if (typeof image === 'object' && typeof image.value === 'string' && image.value.trim()) {
    const kinds = ['emoji', 'url', 'asset', 'upload'];
    if (kinds.includes(image.kind)) return { kind: image.kind, value: image.value };
    return { kind: 'emoji', value: image.value };
  }
  return null;
}

export function resolveCardImage(card = {}, overrides = {}, emojiDict = EMOJI_DICT) {
  const override = overrides ? overrides[card.id] : null;
  const fromOverride = normalizeImage(override);
  if (fromOverride) return fromOverride;
  const own = normalizeImage(card.image);
  if (own) return own;
  const emoji = findEmoji(card.front, emojiDict);
  if (emoji) return { kind: 'emoji', value: emoji };
  return { kind: 'fallback', value: card.id || 'carta' };
}
