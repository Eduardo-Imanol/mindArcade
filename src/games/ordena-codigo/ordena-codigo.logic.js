function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

export function pieceValidation(exercise) {
  const raw = Array.isArray(exercise?.pieces) ? exercise.pieces : [];
  if (!raw.length) {
    return { ok: false, error: 'Este ejercicio no tiene piezas para ordenar.', pieces: [] };
  }
  const ids = new Set();
  const pieces = [];
  for (const piece of raw) {
    if (!isObject(piece)) {
      return { ok: false, error: 'Hay una pieza inválida en el ejercicio.', pieces: [] };
    }
    const id = normalizeId(piece.id);
    if (!id) {
      return { ok: false, error: 'Todas las piezas necesitan un id.', pieces: [] };
    }
    if (ids.has(id)) {
      return { ok: false, error: `El id de pieza "${id}" está duplicado.`, pieces: [] };
    }
    if (typeof piece.code !== 'string' || !piece.code.length) {
      return { ok: false, error: `La pieza "${id}" no tiene código.`, pieces: [] };
    }
    ids.add(id);
    pieces.push({ id, code: piece.code });
  }
  return { ok: true, error: '', pieces };
}

export function pieceList(exercise) {
  return pieceValidation(exercise).pieces;
}

export function solutionIds(exercise) {
  return pieceList(exercise).map((piece) => piece.id);
}

export function sameOrder(order, expected) {
  const left = Array.isArray(order) ? order : [];
  const right = Array.isArray(expected) ? expected : [];
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

export function isCorrectOrder(exercise, order) {
  const expected = solutionIds(exercise);
  if (!expected.length) return false;
  const current = Array.isArray(order) ? order : [];
  if (new Set(current).size !== current.length) return false;
  return sameOrder(current, expected);
}

export function canCheck(exercise, order) {
  const expected = solutionIds(exercise);
  if (!expected.length) return false;
  const current = Array.isArray(order) ? order : [];
  if (current.length !== expected.length) return false;
  return new Set(current).size === current.length;
}

export function addPiece(exercise, order, pieceId) {
  const current = Array.isArray(order) ? order.slice() : [];
  const id = normalizeId(pieceId);
  if (!id) return { order: current, added: false };
  const pieces = pieceList(exercise);
  if (!pieces.some((piece) => piece.id === id)) return { order: current, added: false };
  if (current.includes(id)) return { order: current, added: false };
  return { order: [...current, id], added: true };
}

export function removePiece(order, index) {
  const current = Array.isArray(order) ? order.slice() : [];
  if (!Number.isInteger(index) || index < 0 || index >= current.length) {
    return { order: current, removed: false };
  }
  current.splice(index, 1);
  return { order: current, removed: true };
}

export function movePiece(order, index, delta) {
  const current = Array.isArray(order) ? order.slice() : [];
  const step = Number(delta);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= current.length ||
    !Number.isInteger(step) ||
    step === 0
  ) {
    return { order: current, moved: false };
  }
  const target = index + step;
  if (target < 0 || target >= current.length) return { order: current, moved: false };
  const [piece] = current.splice(index, 1);
  current.splice(target, 0, piece);
  return { order: current, moved: true };
}
