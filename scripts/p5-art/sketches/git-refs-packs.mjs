// scripts/p5-art/sketches/git-refs-packs.mjs — referencias, packs y aceleradores.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, treeNode, varChip } from '../primitives.mjs';

export function queEsUnaReferenciaEnGitYPorQueCrearRamasEsO1(p) {
  baseBg(p);
  varChip(p, 256, 130, 'refs/heads/feat', { w: 200, color: MAGENTA });
  p.arrow(256, 155, 256, 210, { color: CYAN });
  treeNode(p, 256, 250, 'commit', { color: CYAN, r: 40, size: 18 });
  caption(p, 'un archivo de 41 bytes', 256, 350, { color: TEXT, size: 22 });
  badge(p, 256, 410, 'crear rama = escribir puntero', { color: GREEN, size: 17, w: 320 });
  caption(p, 'sin copiar historial', 256, 465, { color: MUTED, size: 18 });
}

export function queEsElDetachedHeadYCualEsSuRiesgo(p) {
  baseBg(p);
  badge(p, 256, 110, 'HEAD', { color: AMBER, size: 26, w: 130 });
  p.arrow(256, 132, 256, 175, { color: AMBER });
  p.arrow(256, 175, 170, 235, { color: AMBER });
  varChip(p, 130, 250, 'main', { w: 110, color: MAGENTA });
  treeNode(p, 256, 250, 'commit', { color: AMBER, r: 40, size: 17 });
  caption(p, 'HEAD suelto', 256, 320, { color: AMBER, size: 22 });
  caption(p, 'los commits sin rama los barre la gc', 256, 380, { color: TEXT, size: 19 });
  badge(p, 256, 440, 'rescata con branch/switch', { color: GREEN, size: 16, w: 260 });
}

export function queSignificanHead3YHead2ComoRevisiones(p) {
  baseBg(p);
  treeNode(p, 256, 140, 'HEAD', { color: AMBER, r: 38, size: 18 });
  treeNode(p, 150, 260, 'p', { color: CYAN, r: 30 });
  treeNode(p, 256, 260, 'pp', { color: CYAN, r: 30 });
  treeNode(p, 362, 260, 'm', { color: MAGENTA, r: 30 });
  p.arrow(232, 162, 165, 233, { color: CYAN });
  p.arrow(256, 178, 256, 230, { color: CYAN });
  p.arrow(280, 162, 345, 233, { color: MAGENTA });
  badge(p, 110, 370, 'HEAD^2', { color: MAGENTA, size: 20, w: 130 });
  badge(p, 280, 370, 'HEAD~3', { color: CYAN, size: 20, w: 130 });
  caption(p, '^ recorre padres, ~ el primer padre', 256, 450, { color: MUTED, size: 18 });
}

export function queSignificanABYABComoRangosDeRevisiones(p) {
  baseBg(p);
  box(p, 60, 150, 100, 70, { color: CYAN, label: 'A' });
  box(p, 352, 150, 100, 70, { color: CYAN, label: 'B' });
  dots(p, 180, 185, 330, { color: MUTED });
  badge(p, 256, 280, 'A..B  = en B, no en A', { color: AMBER, size: 19, w: 280 });
  badge(p, 256, 350, 'A...B = simétrica', { color: GREEN, size: 19, w: 250 });
  caption(p, 'diferencia vs diferencia simétrica', 256, 430, { color: MUTED, size: 18 });
  caption(p, 'tres puntos: cada lado menos la base', 256, 465, { color: MUTED, size: 16 });
}

export function queReferenciasTemporalesCreaGitEnOperacionesPeligro(p) {
  baseBg(p);
  badge(p, 256, 110, 'rebase · merge · cherry-pick', { color: AMBER, size: 19, w: 310 });
  p.arrow(256, 132, 256, 180, { color: AMBER });
  box(p, 80, 185, 352, 90, { color: CYAN, label: 'refs/original, REBASE_HEAD, MERGE_HEAD' });
  caption(p, 'chekpoints para abortar y deshacer', 256, 330, { color: TEXT, size: 20 });
  badge(p, 256, 400, '--abort te devuelve a casa', { color: GREEN, size: 18, w: 280 });
  caption(p, 'viven lo justo para la operación', 256, 465, { color: MUTED, size: 18 });
}

export function queSonLosPackfilesYSuCompresionDelta(p) {
  baseBg(p);
  box(p, 60, 120, 160, 120, { color: CYAN, label: 'sueltos' });
  caption(p, 'zlib por objeto', 140, 200, { color: MUTED, size: 17 });
  p.arrow(232, 180, 280, 180, { color: GREEN });
  box(p, 286, 120, 166, 120, { color: GREEN, label: 'pack' });
  caption(p, 'deltas + base', 369, 200, { color: MUTED, size: 17 });
  badge(p, 256, 310, 'objetos similares → deltas', { color: AMBER, size: 18, w: 270 });
  caption(p, 'repack en push/fetch y gc', 256, 370, { color: TEXT, size: 20 });
  caption(p, 'decenas de versiones, pocos bytes', 256, 465, { color: MUTED, size: 18 });
}

export function comoSeBuscaUnObjetoDentroDeUnPack(p) {
  baseBg(p);
  box(p, 70, 110, 372, 110, { color: CYAN, label: 'pack .idx' });
  caption(p, 'offsets ordenados por hash', 256, 190, { color: TEXT, size: 19 });
  p.arrow(256, 225, 256, 270, { color: CYAN });
  box(p, 70, 275, 372, 110, { color: GREEN, label: 'pack .pack' });
  caption(p, 'busca binaria en el índice', 256, 355, { color: TEXT, size: 19 });
  badge(p, 256, 430, 'objeto → delta → base', { color: AMBER, size: 18, w: 240 });
}

export function queAceleranElCommitGraphYLosBitmapsDeAlcanzabil(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: CYAN, label: 'commit-graph' });
  caption(p, 'generaciones', 150, 195, { color: TEXT, size: 19 });
  caption(p, 'y padres sin', 150, 230, { color: TEXT, size: 19 });
  caption(p, 'descomprimir', 150, 265, { color: TEXT, size: 19 });
  badge(p, 150, 305, 'log veloz', { color: CYAN, size: 17, w: 140 });
  box(p, 267, 120, 190, 200, { color: GREEN, label: 'bitmaps' });
  caption(p, '¿alcanzable?', 362, 195, { color: TEXT, size: 19 });
  caption(p, 'un OR de bits', 362, 230, { color: TEXT, size: 19 });
  caption(p, 'por commit', 362, 265, { color: TEXT, size: 19 });
  badge(p, 362, 305, 'push veloz', { color: GREEN, size: 17, w: 140 });
  caption(p, 'count-objects de repente es gratis', 256, 400, { color: MUTED, size: 18 });
}

export function comoSeListanLosBlobsMasGrandesDeTodaLaHistoria(p) {
  baseBg(p);
  badge(p, 256, 110, 'rev-list --objects --all', { color: CYAN, size: 17, w: 330 });
  p.arrow(256, 132, 256, 175, { color: CYAN });
  badge(p, 256, 200, '| cat-file --batch-check', { color: MAGENTA, size: 16, w: 320 });
  p.arrow(256, 222, 256, 265, { color: MAGENTA });
  badge(p, 256, 290, '| sort -k3 -n', { color: AMBER, size: 17, w: 250 });
  stackFrame(p, 100, 340, 312, 40, 'video.mp4 · 420 MiB', { color: MAGENTA, size: 17 });
  stackFrame(p, 100, 388, 312, 40, 'dataset.csv · 96 MiB', { color: AMBER, size: 17 });
  caption(p, 'quién infla el repo', 256, 470, { color: MUTED, size: 18 });
}
