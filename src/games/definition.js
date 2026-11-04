// src/games/definition.js — GameDefinition contract (spec-12 HU-5, AC-27)
// Every registry entry is built with defineGame: validated once, frozen forever.
const STATUSES = new Set(['available', 'soon']);

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`defineGame: "${field}" debe ser un string no vacío`);
  }
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new TypeError(`defineGame: "${field}" debe ser un string cuando se provee`);
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function positiveInt(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1 || Math.floor(number) !== number) {
    throw new TypeError(`defineGame: "${field}" debe ser un entero >= 1`);
  }
  return number;
}

function categoriesList(value) {
  if (value === undefined) return Object.freeze(['*']);
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError('defineGame: "categories" debe ser un array de strings no vacío');
  }
  const seen = new Set();
  const categories = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new TypeError('defineGame: "categories" solo admite strings no vacíos');
    }
    const id = entry.trim();
    if (seen.has(id)) continue;
    seen.add(id);
    categories.push(id);
  }
  return Object.freeze(categories);
}

export function defineGame(spec = {}) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new TypeError('defineGame: la definición debe ser un objeto');
  }
  const game = {
    id: requireString(spec.id, 'id'),
    title: requireString(spec.title, 'title'),
  };
  const description = optionalString(spec.description, 'description');
  if (description) game.description = description;
  const art = optionalString(spec.art, 'art');
  if (art) game.art = art;
  game.status = requireString(spec.status, 'status');
  if (!STATUSES.has(game.status)) {
    throw new TypeError(`defineGame: status inválido "${game.status}"`);
  }
  game.minCards = positiveInt(spec.minCards, 'minCards');
  game.categories = categoriesList(spec.categories);
  if (spec.minTopics !== undefined) {
    game.minTopics = positiveInt(spec.minTopics, 'minTopics');
  }
  if (spec.minCardsPerTopic !== undefined) {
    game.minCardsPerTopic = positiveInt(spec.minCardsPerTopic, 'minCardsPerTopic');
  }
  if (spec.needsExercises !== undefined) {
    if (typeof spec.needsExercises !== 'boolean') {
      throw new TypeError('defineGame: "needsExercises" debe ser un booleano');
    }
    game.needsExercises = spec.needsExercises;
  }
  if (spec.minExercises !== undefined) {
    game.minExercises = positiveInt(spec.minExercises, 'minExercises');
  }
  if (typeof spec.load !== 'function') {
    throw new TypeError('defineGame: "load" debe ser una función');
  }
  game.load = spec.load;
  return Object.freeze(game);
}
