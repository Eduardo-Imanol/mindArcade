const BLANK_MARKER = /\{\{\s*([^{}]+?)\s*\}\}/g;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeAnswer(value) {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function parseTemplate(template, blanks) {
  const source = typeof template === 'string' ? template : '';
  const errors = [];
  const definitions = new Map();

  if (!source.trim()) errors.push('La plantilla está vacía.');

  asArray(blanks).forEach((blank, index) => {
    if (!isObject(blank)) {
      errors.push(`Espacio ${index + 1} inválido.`);
      return;
    }
    const id = normalizeAnswer(blank.id);
    if (!id) {
      errors.push(`Espacio ${index + 1} sin identificador.`);
      return;
    }
    if (definitions.has(id)) {
      errors.push(`Espacio duplicado: ${id}.`);
      return;
    }
    const answer = normalizeAnswer(blank.answer);
    if (!answer) {
      errors.push(`Espacio ${id} sin respuesta.`);
      return;
    }
    definitions.set(id, {
      id,
      answer,
      alternatives: asArray(blank.alternatives)
        .map(normalizeAnswer)
        .filter(Boolean),
    });
  });

  const segments = [];
  const markers = new Set();
  let lastIndex = 0;

  for (const match of source.matchAll(BLANK_MARKER)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: 'text', value: source.slice(lastIndex, start) });
    }
    const id = normalizeAnswer(match[1]);
    if (!id) {
      errors.push('Marcador sin identificador en la plantilla.');
    } else {
      if (!definitions.has(id)) {
        errors.push(`El marcador {{${id}}} no tiene respuesta.`);
      }
      markers.add(id);
      segments.push({ type: 'blank', id, slot: 0 });
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < source.length) {
    segments.push({ type: 'text', value: source.slice(lastIndex) });
  }

  if (segments.length === 0 || !segments.some((segment) => segment.type === 'blank')) {
    errors.push('La plantilla no tiene espacios para completar.');
  }

  for (const id of definitions.keys()) {
    if (!markers.has(id)) {
      errors.push(`El espacio ${id} no aparece en la plantilla.`);
    }
  }

  let slot = 0;
  const orderedIds = [];
  for (const segment of segments) {
    if (segment.type !== 'blank') continue;
    segment.slot = slot;
    slot += 1;
    if (!orderedIds.includes(segment.id)) orderedIds.push(segment.id);
  }

  return {
    ok: errors.length === 0,
    segments,
    blanks: orderedIds.map((id) => definitions.get(id)).filter(Boolean),
    slotCount: slot,
    errors,
  };
}

export function blankMatches(blank, value) {
  const given = normalizeAnswer(value);
  if (!given) return false;
  const expected = normalizeAnswer(blank?.answer);
  if (given === expected) return true;
  return asArray(blank?.alternatives).some(
    (alternative) => normalizeAnswer(alternative) === given
  );
}

export function evaluateBlanks(blanks, answers) {
  const values = isObject(answers) ? answers : {};
  const results = asArray(blanks).map((blank) => {
    const id = normalizeAnswer(blank?.id);
    const given = normalizeAnswer(values[id]);
    return {
      id,
      ok: blankMatches(blank, given),
      given,
      expected: normalizeAnswer(blank?.answer),
    };
  });
  return {
    ok: results.length > 0 && results.every((result) => result.ok),
    results,
  };
}
