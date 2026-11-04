// src/core/exercises/schema.js — validación pura del documento de ejercicios (spec-21 T1).
import { EXERCISE_LANGUAGES, normalizeCode } from './parse.js';

export const EXERCISE_DECK_COUNT = 10;
export const EXERCISES_PER_DECK = 6;

const SAFE_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const BLANK_MARKER = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * @typedef {Object} ExerciseCase
 * @property {unknown[]} args
 * @property {unknown} expected
 */

/**
 * @typedef {Object} ExerciseBlank
 * @property {string} id
 * @property {string} answer
 * @property {string[]} [alternatives]
 */

/**
 * @typedef {Object} ExercisePiece
 * @property {string} id
 * @property {string} code
 */

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {number} deckNumber
 * @property {string[]} cardIds
 * @property {string} prompt
 * @property {'javascript'} language
 * @property {string} solution
 * @property {string} starter
 * @property {ExercisePiece[]} pieces
 * @property {string} template
 * @property {ExerciseBlank[]} blanks
 * @property {string} functionName
 * @property {ExerciseCase[]} cases
 * @property {string} [explanation]
 */

/**
 * @typedef {Object} ExerciseDeck
 * @property {number} number
 * @property {Exercise[]} exercises
 */

/**
 * @typedef {Object} ExerciseDocument
 * @property {string} topicId
 * @property {ExerciseDeck[]} decks
 * @property {string[]} errors
 */

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function markBlankIds(template) {
  const ids = [];
  const filled = String(template || '').replace(BLANK_MARKER, (_marker, id) => {
    const clean = String(id).trim();
    ids.push(clean);
    return `__BLANK_${clean}__`;
  });
  return { ids, filled };
}

function fillTemplate(template, blanks) {
  const byId = new Map();
  for (const blank of blanks) byId.set(blank.id, blank.answer);
  return String(template || '').replace(BLANK_MARKER, (_marker, id) => {
    const clean = String(id).trim();
    return byId.has(clean) ? byId.get(clean) : `__MISSING_${clean}__`;
  });
}

function sameCode(left, right) {
  return normalizeCode(left).trim() === normalizeCode(right).trim();
}

function validateCases(exercises, deckNumber, fail) {
  if (!Array.isArray(exercises.cases) || exercises.cases.length === 0) {
    fail(deckNumber, exercises, 'cases debe tener al menos un caso');
    return;
  }
  exercises.cases.forEach((entry, index) => {
    if (!isObject(entry)) {
      fail(deckNumber, exercises, `caso ${index + 1} inválido`);
      return;
    }
    if (!Array.isArray(entry.args)) {
      fail(deckNumber, exercises, `caso ${index + 1}: args debe ser un array`);
    }
    if (!Object.prototype.hasOwnProperty.call(entry, 'expected')) {
      fail(deckNumber, exercises, `caso ${index + 1}: falta expected`);
    }
  });
}

function validateBlanks(exercises, deckNumber, fail) {
  const blanks = asArray(exercises.blanks);
  if (blanks.length === 0) {
    fail(deckNumber, exercises, 'blanks debe tener al menos un blank');
    return;
  }
  const ids = new Set();
  for (const blank of blanks) {
    if (!isObject(blank)) {
      fail(deckNumber, exercises, 'blank inválido');
      continue;
    }
    if (!isNonEmptyString(blank.id)) {
      fail(deckNumber, exercises, 'blank con id vacío');
      continue;
    }
    if (ids.has(blank.id)) {
      fail(deckNumber, exercises, `blank duplicado: ${blank.id}`);
    }
    ids.add(blank.id);
    if (!isNonEmptyString(blank.answer)) {
      fail(deckNumber, exercises, `blank ${blank.id} sin respuesta`);
    }
    if (blank.alternatives !== undefined && !Array.isArray(blank.alternatives)) {
      fail(deckNumber, exercises, `blank ${blank.id}: alternatives debe ser un array`);
    }
    for (const alternative of asArray(blank.alternatives)) {
      if (!isNonEmptyString(alternative)) {
        fail(deckNumber, exercises, `blank ${blank.id}: alternativa vacía`);
      }
    }
  }

  const markers = markBlankIds(exercises.template);
  for (const marker of markers.ids) {
    if (!ids.has(marker)) {
      fail(deckNumber, exercises, `marcador {{${marker}}} sin blank declarado`);
    }
  }
  for (const id of ids) {
    if (!markers.ids.includes(id)) {
      fail(deckNumber, exercises, `blank ${id} sin marcador en template`);
    }
  }
  if (!sameCode(fillTemplate(exercises.template, blanks), exercises.solution)) {
    fail(deckNumber, exercises, 'plantilla + blanks no coincide con la solución');
  }
}

function validatePieces(exercises, deckNumber, fail) {
  const pieces = asArray(exercises.pieces);
  if (pieces.length === 0) {
    fail(deckNumber, exercises, 'pieces no puede estar vacío');
    return;
  }
  const ids = new Set();
  for (const piece of pieces) {
    if (!isObject(piece)) {
      fail(deckNumber, exercises, 'pieza inválida');
      continue;
    }
    if (!isNonEmptyString(piece.id)) {
      fail(deckNumber, exercises, 'pieza con id vacío');
      continue;
    }
    if (ids.has(piece.id)) {
      fail(deckNumber, exercises, `pieza duplicada: ${piece.id}`);
    }
    ids.add(piece.id);
    if (typeof piece.code !== 'string') {
      fail(deckNumber, exercises, `pieza ${piece.id} sin código`);
    }
  }
  const rebuilt = pieces.map((piece) => (isObject(piece) ? String(piece.code || '') : '')).join('\n');
  if (!sameCode(rebuilt, exercises.solution)) {
    fail(deckNumber, exercises, 'las piezas no reconstruyen la solución');
  }
}

function deckCardIds(decks, deckNumber) {
  const deck = asArray(decks).find((entry) => isObject(entry) && Number(entry.number) === deckNumber);
  if (!deck) return null;
  return new Set(asArray(deck.cards).map((card) => card?.id).filter(Boolean));
}

function validateCardIds(exercise, deckNumber, cardDecks, decks, fail) {
  const cardIds = asArray(exercise.cardIds);
  if (cardIds.length === 0) {
    fail(deckNumber, exercise, 'cardIds debe tener al menos una carta');
    return;
  }
  const seen = new Set();
  for (const cardId of cardIds) {
    if (!isNonEmptyString(cardId)) {
      fail(deckNumber, exercise, 'cardIds contiene un id vacío');
      continue;
    }
    if (seen.has(cardId)) {
      fail(deckNumber, exercise, `carta duplicada: ${cardId}`);
      continue;
    }
    seen.add(cardId);
    if (!decks) continue;
    const expected = deckCardIds(decks, deckNumber);
    if (expected && expected.has(cardId)) continue;
    const otherDeck = cardDecks.get(cardId);
    const reason = otherDeck === undefined ? 'carta desconocida' : `carta del mazo ${otherDeck}`;
    fail(deckNumber, exercise, `${reason}: ${cardId}`);
  }
}

function validateExercise(exercise, deckNumber, cardDecks, decks, fail) {
  if (!isNonEmptyString(exercise.id)) {
    fail(deckNumber, exercise, 'id de ejercicio vacío');
    return;
  }
  if (Number(exercise.deckNumber) !== deckNumber) {
    fail(deckNumber, exercise, `deckNumber ${exercise.deckNumber} no coincide con el mazo`);
  }
  if (!isNonEmptyString(exercise.prompt)) {
    fail(deckNumber, exercise, 'prompt vacío');
  }
  if (!EXERCISE_LANGUAGES.includes(exercise.language)) {
    fail(deckNumber, exercise, `lenguaje no permitido: ${exercise.language}`);
  }
  for (const field of ['solution', 'starter', 'template']) {
    if (!isNonEmptyString(exercise[field])) {
      fail(deckNumber, exercise, `${field} vacío`);
    }
  }
  if (!isNonEmptyString(exercise.functionName) || !SAFE_IDENTIFIER.test(exercise.functionName)) {
    fail(deckNumber, exercise, `functionName inválido: ${exercise.functionName}`);
  }
  validateCardIds(exercise, deckNumber, cardDecks, decks, fail);
  validateCases(exercise, deckNumber, fail);
  validateBlanks(exercise, deckNumber, fail);
  validatePieces(exercise, deckNumber, fail);
}

export function validateExercises(topicId, data, options = {}) {
  const errors = [];
  const requestedTopicId = typeof topicId === 'string' ? topicId.trim() : '';
  const decks = options.decks;

  if (!isObject(data)) {
    return { ok: false, errors: ['documento de ejercicios inválido'] };
  }
  if (!requestedTopicId) errors.push('Falta topicId');
  if (typeof data.topicId !== 'string' || !data.topicId.trim()) {
    errors.push('Falta topicId en el documento');
  } else if (requestedTopicId && data.topicId.trim() !== requestedTopicId) {
    errors.push(`Tema "${data.topicId}" no coincide con "${requestedTopicId}"`);
  }
  for (const error of asArray(data.errors)) errors.push(`parse: ${error}`);

  const exerciseDecks = asArray(data.decks);
  if (exerciseDecks.length !== EXERCISE_DECK_COUNT) {
    errors.push(`Se esperaban ${EXERCISE_DECK_COUNT} mazos y hay ${exerciseDecks.length}`);
  }

  const numbers = new Set();
  const exerciseIds = new Set();
  const cardDecks = new Map();
  for (const deck of asArray(decks)) {
    for (const card of asArray(deck?.cards)) {
      if (card?.id) cardDecks.set(card.id, Number(deck.number));
    }
  }

  const fail = (deckNumber, exercise, message) => {
    const id = exercise && isNonEmptyString(exercise.id) ? exercise.id : 'sin-id';
    errors.push(`Mazo ${deckNumber} / ${id}: ${message}`);
  };

  for (const deck of exerciseDecks) {
    if (!isObject(deck) || !Number.isInteger(Number(deck.number)) || Number(deck.number) < 1) {
      errors.push('Mazo inválido');
      continue;
    }
    const deckNumber = Number(deck.number);
    if (numbers.has(deckNumber)) {
      errors.push(`Mazo ${deckNumber}: número duplicado`);
    }
    numbers.add(deckNumber);
    const exercises = asArray(deck.exercises);
    if (exercises.length !== EXERCISES_PER_DECK) {
      errors.push(`Mazo ${deckNumber}: se esperaban ${EXERCISES_PER_DECK} ejercicios y hay ${exercises.length}`);
    }
    for (const exercise of exercises) {
      if (!isObject(exercise)) {
        errors.push(`Mazo ${deckNumber}: ejercicio inválido`);
        continue;
      }
      if (isNonEmptyString(exercise.id)) {
        if (exerciseIds.has(exercise.id)) {
          fail(deckNumber, exercise, 'id de ejercicio duplicado');
        }
        exerciseIds.add(exercise.id);
      }
      validateExercise(exercise, deckNumber, cardDecks, decks, fail);
    }
  }

  return { ok: errors.length === 0, errors };
}
