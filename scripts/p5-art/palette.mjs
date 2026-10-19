// scripts/p5-art/palette.mjs — neon arcade tokens (src/ui/tokens.css) for generated art.
export const BG = '#0f051d';
export const BG2 = '#1a0b2e';
export const CYAN = '#00ffcc';
export const MAGENTA = '#ff007f';
export const GREEN = '#39ff14';
export const AMBER = '#ffcc00';
export const TEXT = '#f1f1f1';
export const MUTED = '#8a7fb5';

export const HUES = [168, 320, 120, 45, 265];

export function hsl(h, s = 90, l = 60, a = 1) {
  const alpha = a === 1 ? '' : ` / ${a}`;
  return `hsl(${h} ${s}% ${l}%${alpha})`;
}
