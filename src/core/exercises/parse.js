// src/core/exercises/parse.js — Markdown estricto de ejercicios universales (spec-21 T1).
// Puro: no conoce React, storage ni DOM. Reutiliza el parser de bloques de spec-19.
import { parseSourceMarkdown } from '../content/markdown.js';

export const EXERCISE_LANGUAGES = Object.freeze(['javascript']);

const DECK_HEADING = /^Mazo\s+(\d+)$/i;
const EXERCISE_HEADING = /^E\s*:\s*(.+)$/i;
const FIELD = /^(Tema|Cartas|Prompt|Lenguaje|Soluci[oó]n|Starter|Plantilla|Blanks|Funci[oó]n|Casos|Piezas)\s*:\s*(.*)$/i;

function normalizeTopicId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeCode(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export function derivePieces(solution) {
  const code = normalizeCode(solution);
  if (!code) return [];
  return code.split('\n').map((line, index) => ({ id: `p${index + 1}`, code: line }));
}

function fieldKey(label) {
  const normalized = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (normalized === 'tema') return 'topicId';
  if (normalized === 'solucion') return 'solution';
  if (normalized === 'funcion') return 'functionName';
  if (normalized === 'cartas') return 'cardIds';
  if (normalized === 'lenguaje') return 'language';
  if (normalized === 'plantilla') return 'template';
  if (normalized === 'casos') return 'cases';
  if (normalized === 'piezas') return 'pieces';
  return normalized;
}

function parseField(text) {
  const match = FIELD.exec(String(text || '').trim());
  if (!match) return null;
  return { key: fieldKey(match[1]), label: match[1], value: match[2].trim() };
}

function parseCardIds(value) {
  return String(value || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseBlanks(items) {
  const blanks = [];
  for (const item of items) {
    const text = String(item || '').trim();
    const separator = text.indexOf('=');
    if (separator < 0) {
      blanks.push({ id: '', answer: '', alternatives: [], error: `blank sin formato "id = respuesta": ${text}` });
      continue;
    }
    const id = text.slice(0, separator).trim();
    const rest = text.slice(separator + 1).trim();
    const [answerPart, alternativesPart] = rest.split('|');
    const answer = (answerPart || '').trim();
    const alternatives = alternativesPart
      ? alternativesPart.split(',').map((value) => value.trim()).filter(Boolean)
      : [];
    blanks.push({ id, answer, alternatives });
  }
  return blanks;
}

function parseJson(value) {
  const text = String(value || '').trim();
  if (!text) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function parseCases(items) {
  const cases = [];
  for (const item of items) {
    const text = String(item || '').trim();
    const arrow = text.includes('→') ? '→' : text.includes('->') ? '->' : null;
    if (!arrow) {
      cases.push({ error: `caso sin flecha →: ${text}` });
      continue;
    }
    const index = text.indexOf(arrow);
    const argsText = text.slice(0, index).trim();
    const expectedText = text.slice(index + arrow.length).trim();
    const args = parseJson(argsText);
    if (!args.ok || !Array.isArray(args.value)) {
      cases.push({ error: `args inválidos en caso: ${argsText}` });
      continue;
    }
    const expected = parseJson(expectedText);
    cases.push({
      args: args.value,
      expected: expected.ok ? expected.value : expectedText,
    });
  }
  return cases;
}

function parsePieces(items) {
  return items.map((item, index) => {
    const text = String(item || '').trim();
    const separator = text.indexOf('=');
    if (separator < 0) return { id: `p${index + 1}`, code: text };
    const id = text.slice(0, separator).trim();
    const code = text.slice(separator + 1).trim();
    return { id: id || `p${index + 1}`, code };
  });
}

function parsePiecesCode(code) {
  return normalizeCode(code)
    .split('\n')
    .map((line, index) => ({ id: `p${index + 1}`, code: line }));
}

function nextBlock(blocks, index) {
  return index + 1 < blocks.length ? blocks[index + 1] : null;
}

function createExercise(id, deckNumber) {
  return {
    id,
    deckNumber,
    cardIds: [],
    prompt: '',
    language: '',
    solution: '',
    starter: '',
    template: '',
    blanks: [],
    functionName: '',
    cases: [],
    pieces: [],
  };
}

export function parseExercisesMarkdown(md, options = {}) {
  const requestedTopicId = normalizeTopicId(options.topicId);
  const errors = [];
  const source = typeof md === 'string' ? md.replace(/\r\n?/g, '\n') : '';
  const decks = [];
  let documentTopicId = '';
  let currentDeck = null;
  let currentExercise = null;

  if (!requestedTopicId) errors.push('Falta topicId para validar el documento');
  if (!source.trim()) {
    return { topicId: requestedTopicId, decks, errors: [...errors, 'Documento vacío'] };
  }

  const blocks = parseSourceMarkdown(source);

  const context = () => {
    if (!currentDeck) return 'documento';
    if (!currentExercise) return `Mazo ${currentDeck.number}`;
    return `Mazo ${currentDeck.number} / ${currentExercise.id || 'sin-id'}`;
  };
  const fail = (message) => errors.push(`${context()}: ${message}`);

  const consumeValue = (index, kind) => {
    const block = nextBlock(blocks, index);
    if (!block) {
      fail(`falta el bloque de ${kind}`);
      return { value: null, next: index };
    }
    if (kind === 'code') {
      if (block.type !== 'code') {
        fail(`${kind} debe ser un bloque de código cercado`);
        return { value: null, next: index };
      }
      return { value: block.code, next: index + 1 };
    }
    if (block.type === 'list') return { value: block.items.map((item) => item.text), next: index + 1 };
    if (block.type === 'code') return { value: block.code, next: index + 1 };
    fail(`${kind} debe ser una lista o un bloque de código`);
    return { value: null, next: index };
  };

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === 'heading') {
      if (block.level === 1) continue;
      if (block.level === 2) {
        const match = DECK_HEADING.exec(block.text.trim());
        if (!match) {
          fail(`encabezado de mazo inválido: ${block.text}`);
          continue;
        }
        const number = Number(match[1]);
        if (!Number.isInteger(number) || number < 1) {
          fail(`número de mazo inválido: ${block.text}`);
          continue;
        }
        if (decks.some((deck) => deck.number === number)) {
          errors.push(`Mazo ${number}: número de mazo duplicado`);
        }
        currentDeck = { number, exercises: [] };
        decks.push(currentDeck);
        currentExercise = null;
        continue;
      }
      if (block.level === 3) {
        const match = EXERCISE_HEADING.exec(block.text.trim());
        if (!match) {
          fail(`encabezado de ejercicio inválido: ${block.text}`);
          continue;
        }
        if (!currentDeck) {
          fail(`ejercicio fuera de un mazo: ${match[1]}`);
          continue;
        }
        currentExercise = createExercise(match[1].trim(), currentDeck.number);
        currentDeck.exercises.push(currentExercise);
        continue;
      }
      fail(`encabezado no permitido (nivel ${block.level}): ${block.text}`);
      continue;
    }

    if (block.type === 'code') {
      fail('bloque de código sin campo Solución/Starter/Plantilla/Piezas');
      continue;
    }

    if (block.type === 'list') {
      const items = (block.items || []).map((item) => parseField(item.text));
      if (items.some((item) => !item)) {
        fail('lista sin campo reconocido');
        continue;
      }
      if (!currentExercise) {
        fail(`campo fuera de un ejercicio: ${items[0].label}`);
        continue;
      }
      const keys = new Set(items.map((item) => item.key));
      if (keys.size > 1) {
        const headerKeys = new Set(['cardIds', 'prompt', 'language']);
        if (![...keys].every((key) => headerKeys.has(key))) {
          fail(`lista con campos mezclados: ${items[0].label}`);
          continue;
        }
        for (const item of items) {
          if (item.key === 'cardIds') currentExercise.cardIds.push(...parseCardIds(item.value));
          else if (item.key === 'prompt') currentExercise.prompt = item.value;
          else currentExercise.language = item.value;
        }
        continue;
      }
      const first = items[0];
      const values = items.map((item) => item.value);
      if (first.key === 'cardIds') {
        for (const value of values) currentExercise.cardIds.push(...parseCardIds(value));
      } else if (first.key === 'prompt') {
        currentExercise.prompt = values.join(' ').trim();
      } else if (first.key === 'language') {
        currentExercise.language = (values[0] || '').trim();
      } else {
        fail(`el campo ${first.label} debe ir seguido de una lista o código, no ser un ítem`);
      }
      continue;
    }

    if (block.type !== 'paragraph') {
      fail(`bloque no permitido: ${block.type}`);
      continue;
    }

    const field = parseField(block.text);
    if (!field) {
      fail(`línea no reconocida: ${block.text}`);
      continue;
    }

    if (field.key === 'topicId') {
      documentTopicId = field.value;
      continue;
    }
    if (!currentExercise) {
      fail(`campo fuera de un ejercicio: ${field.label}`);
      continue;
    }

    if (field.key === 'prompt' || field.key === 'language') {
      if (field.value) {
        currentExercise[field.key] = field.value;
        continue;
      }
      const parsed = consumeValue(index, field.label);
      if (parsed.value === null) continue;
      currentExercise[field.key] =
        field.key === 'prompt' ? parsed.value.join(' ').trim() : String(parsed.value[0] || '').trim();
      index = parsed.next;
      continue;
    }

    if (field.key === 'solution' || field.key === 'starter' || field.key === 'template') {
      const parsed = consumeValue(index, field.label);
      if (parsed.value === null) continue;
      currentExercise[field.key] = normalizeCode(parsed.value);
      index = parsed.next;
      continue;
    }

    if (field.key === 'functionName') {
      currentExercise.functionName = field.value;
      continue;
    }

    if (field.key === 'blanks') {
      const parsed = consumeValue(index, field.label);
      if (parsed.value === null) continue;
      if (!Array.isArray(parsed.value)) {
        fail('Blanks debe ser una lista');
        continue;
      }
      currentExercise.blanks = parseBlanks(parsed.value);
      index = parsed.next;
      continue;
    }

    if (field.key === 'cases') {
      const parsed = consumeValue(index, field.label);
      if (parsed.value === null) continue;
      if (!Array.isArray(parsed.value)) {
        fail('Casos debe ser una lista');
        continue;
      }
      currentExercise.cases = parseCases(parsed.value);
      index = parsed.next;
      continue;
    }

    if (field.key === 'pieces') {
      const parsed = consumeValue(index, 'Piezas');
      if (parsed.value === null) continue;
      currentExercise.pieces = Array.isArray(parsed.value)
        ? parsePieces(parsed.value)
        : parsePiecesCode(parsed.value);
      index = parsed.next;
      continue;
    }

    if (field.key === 'cardIds' && field.value) {
      currentExercise.cardIds.push(...parseCardIds(field.value));
      continue;
    }

    fail(`campo sin procesar: ${field.label}`);
  }

  if (!documentTopicId) errors.push('Falta el campo Tema');
  else if (requestedTopicId && documentTopicId !== requestedTopicId) {
    errors.push(`Tema "${documentTopicId}" no coincide con el topicId solicitado "${requestedTopicId}"`);
  }

  for (const deck of decks) {
    for (const exercise of deck.exercises) {
      if (!exercise.pieces.length && exercise.solution) {
        exercise.pieces = derivePieces(exercise.solution);
      }
    }
  }

  return {
    topicId: documentTopicId || requestedTopicId,
    decks,
    errors,
  };
}
