// scripts/p5-art/sketches/estructuras-datos.mjs — arte genérico para las 180 cartas del tema.
// Los IDs se derivan del propio topic para que el registro no se desincronice.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED } from '../palette.mjs';
import { box, dots, treeNode } from '../primitives.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOPIC = path.join(
  HERE,
  '../../../src/content/topics/programacion/estructuras-de-datos.md'
);
const ASSET_RE = /I: asset:estructuras-de-datos\/([a-z0-9-]+)\.svg/g;

function readIds() {
  try {
    const md = fs.readFileSync(TOPIC, 'utf8');
    return [...md.matchAll(ASSET_RE)].map((match) => match[1]);
  } catch {
    return [];
  }
}

export function estructuraGrafo(p) {
  baseBg(p);
  const root = treeNode(p, 256, 120, 'TAD', { r: 34, color: CYAN });
  const children = [150, 256, 362].map((x, i) =>
    treeNode(p, x, 290, `n${i + 1}`, { r: 26, color: i === 1 ? GREEN : MAGENTA })
  );
  p.stroke(MUTED);
  p.strokeWeight(2);
  for (const child of children) p.line(root.x, root.y + root.r, child.x, child.y - child.r);
  dots(p, 150, 400, 362, { color: AMBER, n: 5 });
}

export function estructuraArreglo(p) {
  baseBg(p);
  const total = 5;
  for (let i = 0; i < total; i += 1) {
    box(p, 56 + i * 82, 190, 66, 66, { color: i % 2 ? MAGENTA : CYAN });
  }
  box(p, 56, 300, 66, 66, { color: GREEN, label: '0' });
  p.stroke(AMBER);
  p.strokeWeight(3);
  p.line(89, 256, 89, 300);
}

export function estructuraApilada(p) {
  baseBg(p);
  for (let i = 0; i < 4; i += 1) {
    box(p, 156, 320 - i * 58, 200, 48, { color: i % 2 ? GREEN : CYAN });
  }
  p.stroke(MAGENTA);
  p.strokeWeight(4);
  p.line(120, 380, 392, 380);
  dots(p, 156, 410, 356, { color: AMBER, n: 4 });
}

const SKETCHES = [estructuraGrafo, estructuraArreglo, estructuraApilada];

export const ESTRUCTURAS_DATOS_SKETCHES = Object.freeze(
  Object.fromEntries(readIds().map((id, index) => [id, SKETCHES[index % SKETCHES.length]]))
);
