// src/games/ahorcado/hangman-art.mjs — hangman doll rendered with the p5-art SVG engine.
import { hashSeed, renderSketch } from '../../../scripts/p5-art/engine.mjs';
import { AMBER, CYAN, TEXT } from '../../../scripts/p5-art/palette.mjs';

export const BASE_SIZE = 250;
export const PART_COUNT = 6;
export const ALARM_MISTAKES = 5;

const BASE_WEIGHT = 6;
const BODY_WEIGHT = 5;

function clampMistakes(mistakes) {
  const value = Number(mistakes);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(PART_COUNT, Math.floor(value)));
}

function drawBase(p, s) {
  p.line(18 * s, 232 * s, 150 * s, 232 * s, { color: CYAN, weight: BASE_WEIGHT * s });
  p.line(55 * s, 232 * s, 55 * s, 28 * s, { color: CYAN, weight: BASE_WEIGHT * s });
  p.line(55 * s, 28 * s, 150 * s, 28 * s, { color: CYAN, weight: BASE_WEIGHT * s });
  p.line(150 * s, 28 * s, 150 * s, 56 * s, { color: CYAN, weight: BASE_WEIGHT * s });
}

const PART_DRAWERS = [
  (p, s, color) => {
    p.noFill();
    p.stroke(color);
    p.strokeWeight(BODY_WEIGHT * s);
    p.circle(150 * s, 79 * s, 46 * s);
  },
  (p, s, color) => p.line(150 * s, 102 * s, 150 * s, 162 * s, { color, weight: BODY_WEIGHT * s }),
  (p, s, color) => p.line(150 * s, 116 * s, 118 * s, 142 * s, { color, weight: BODY_WEIGHT * s }),
  (p, s, color) => p.line(150 * s, 116 * s, 182 * s, 142 * s, { color, weight: BODY_WEIGHT * s }),
  (p, s, color) => p.line(150 * s, 162 * s, 120 * s, 198 * s, { color, weight: BODY_WEIGHT * s }),
  (p, s, color) => p.line(150 * s, 162 * s, 180 * s, 198 * s, { color, weight: BODY_WEIGHT * s }),
];

export function hangmanSketch(mistakes = 0) {
  const count = clampMistakes(mistakes);
  const color = count >= ALARM_MISTAKES ? AMBER : TEXT;
  return (p) => {
    const s = p.w / BASE_SIZE;
    drawBase(p, s);
    for (let index = 0; index < count; index += 1) PART_DRAWERS[index](p, s, color);
  };
}

function defaultLabel(mistakes) {
  return `Muñeco del ahorcado: ${clampMistakes(mistakes)} de ${PART_COUNT} fallos`;
}

export function renderHangman({ mistakes = 0, cardId = '', size = BASE_SIZE, label } = {}) {
  return renderSketch(hangmanSketch(mistakes), {
    label: label ?? defaultLabel(mistakes),
    seed: hashSeed(cardId),
    size,
  });
}
