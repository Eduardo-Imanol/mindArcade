import { describe, expect, it } from 'vitest';
import {
  addPiece,
  canCheck,
  isCorrectOrder,
  movePiece,
  pieceValidation,
  removePiece,
  solutionIds,
} from './ordena-codigo.logic.js';
import { makeExercise } from '../../test/exercises.js';

describe('ordena-codigo logic (spec-21 T6)', () => {
  it('derives the canonical piece order and validates it', () => {
    const exercise = makeExercise(1, 1);
    const ids = solutionIds(exercise);

    expect(ids).toEqual(['ex-1-1-p1', 'ex-1-1-p2', 'ex-1-1-p3']);
    expect(isCorrectOrder(exercise, ids)).toBe(true);
    expect(isCorrectOrder(exercise, [...ids].reverse())).toBe(false);
    expect(isCorrectOrder(exercise, ids.slice(0, 2))).toBe(false);
    expect(isCorrectOrder(exercise, [...ids, ids[0]])).toBe(false);
    expect(canCheck(exercise, ids)).toBe(true);
    expect(canCheck(exercise, ids.slice(0, 2))).toBe(false);
  });

  it('adds, removes and moves pieces without duplicating them', () => {
    const exercise = makeExercise(1, 1);

    const first = addPiece(exercise, [], 'ex-1-1-p2');
    expect(first).toEqual({ order: ['ex-1-1-p2'], added: true });
    expect(addPiece(exercise, first.order, 'ex-1-1-p2').added).toBe(false);
    expect(addPiece(exercise, first.order, 'missing').added).toBe(false);

    const second = addPiece(exercise, first.order, 'ex-1-1-p1');
    const moved = movePiece(second.order, 1, -1);
    expect(moved).toEqual({ order: ['ex-1-1-p1', 'ex-1-1-p2'], moved: true });
    expect(movePiece(moved.order, 0, -1).moved).toBe(false);
    expect(movePiece(moved.order, 1, 1).moved).toBe(false);
    expect(movePiece(moved.order, 5, 1).moved).toBe(false);

    const removed = removePiece(moved.order, 0);
    expect(removed).toEqual({ order: ['ex-1-1-p2'], removed: true });
    expect(removePiece(removed.order, 3).removed).toBe(false);
  });

  it('accepts duplicate code lines with unique ids', () => {
    const exercise = makeExercise(1, 1, {
      pieces: [
        { id: 'a', code: 'return x;' },
        { id: 'b', code: 'return x;' },
      ],
    });

    expect(pieceValidation(exercise).ok).toBe(true);
    expect(isCorrectOrder(exercise, ['a', 'b'])).toBe(true);
    expect(isCorrectOrder(exercise, ['b', 'a'])).toBe(false);
  });

  it('rejects duplicate piece ids and invalid pieces', () => {
    const duplicated = makeExercise(1, 1, {
      pieces: [
        { id: 'a', code: 'x' },
        { id: 'a', code: 'y' },
      ],
    });
    const invalid = makeExercise(1, 1, { pieces: [{ code: 'x' }] });
    const emptyCode = makeExercise(1, 1, { pieces: [{ id: 'a', code: '' }] });
    const empty = makeExercise(1, 1, { pieces: [] });

    expect(pieceValidation(duplicated)).toMatchObject({ ok: false });
    expect(pieceValidation(duplicated).error).toContain('duplicado');
    expect(pieceValidation(invalid).ok).toBe(false);
    expect(pieceValidation(emptyCode).ok).toBe(false);
    expect(pieceValidation(empty).ok).toBe(false);
  });
});
