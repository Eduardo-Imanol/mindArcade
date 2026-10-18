// src/games/flashcards/flashcards.logic.js — pure session reducer (no core imports)
export const GRADES = ['otra-vez', 'dificil', 'facil'];

const GAIN = { 'otra-vez': 0, dificil: 25, facil: 10 };

export function createState(deck = []) {
  return {
    index: 0,
    flipped: false,
    correct: 0,
    wrong: 0,
    gained: 0,
    complete: deck.length === 0,
  };
}

export function reduce(state, action = {}, deck = []) {
  const size = deck.length;
  const current = state || createState(deck);
  if (size === 0) return { ...current, complete: true };
  switch (action.type) {
    case 'flip':
      return current.complete ? current : { ...current, flipped: !current.flipped };
    case 'next':
      return { ...current, index: Math.min(size - 1, current.index + 1), flipped: false };
    case 'prev':
      return { ...current, index: Math.max(0, current.index - 1), flipped: false };
    case 'reset':
      return createState(deck);
    case 'grade': {
      const grade = GRADES.includes(action.grade) ? action.grade : 'otra-vez';
      const passed = grade !== 'otra-vez';
      const fallbackGain = GAIN[grade] || 0;
      const gained = Number.isFinite(action.gained) ? action.gained : fallbackGain;
      const atEnd = current.index >= size - 1;
      return {
        ...current,
        flipped: false,
        correct: current.correct + (passed ? 1 : 0),
        wrong: current.wrong + (passed ? 0 : 1),
        gained: current.gained + gained,
        index: atEnd ? current.index : current.index + 1,
        complete: atEnd ? true : current.complete,
      };
    }
    default:
      return current;
  }
}
