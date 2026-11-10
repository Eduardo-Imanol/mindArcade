// scripts/p5-art/sketches/git-modelo.mjs — modelo de objetos: DAG, alcance y hashes.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, treeNode, varChip } from '../primitives.mjs';

export function queEsUnDagYPorQueElHistorialDeGitEsUno(p) {
  baseBg(p);
  treeNode(p, 120, 400, 'raíz', { color: GREEN, r: 34 });
  treeNode(p, 220, 300, 'a', { color: CYAN, r: 30 });
  treeNode(p, 320, 300, 'b', { color: CYAN, r: 30 });
  treeNode(p, 300, 180, 'c', { color: MAGENTA, r: 30 });
  p.arrow(220, 328, 150, 372, { color: MUTED });
  p.arrow(320, 328, 250, 372, { color: MUTED });
  p.arrow(300, 208, 235, 272, { color: MUTED });
  p.arrow(300, 208, 320, 272, { color: MUTED });
  badge(p, 256, 90, 'dirigido · acíclico', { color: CYAN, size: 22, w: 250 });
  caption(p, 'cada commit apunta a sus padres', 256, 465, { color: MUTED, size: 20 });
}

export function porQueElGrafoDeCommitsDeGitNoPuedeTenerCiclos(p) {
  baseBg(p);
  const cx = 256;
  const cy = 250;
  const r = 90;
  const pts = [0, 1, 2].map((i) => {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 3;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % 3];
    p.arrow(x, y, nx, ny, { color: MAGENTA });
  });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(6);
  p.line(cx - 20, cy - 20, cx + 20, cy + 20);
  p.line(cx + 20, cy - 20, cx - 20, cy + 2 * 20);
  p.pop();
  caption(p, 'el tiempo no da vueltas', 256, 400, { color: TEXT, size: 24 });
  caption(p, 'hash de hijo → hash de padre', 256, 450, { color: MUTED, size: 20 });
}

export function queEsLaPuntaOTipDeUnaRama(p) {
  baseBg(p);
  [180, 250, 320].forEach((y, i) => {
    stackFrame(p, 90, y - 19, 150, 38, `c${3 - i}`, { color: CYAN, size: 20 });
    if (i < 2) p.arrow(240, y, 270, y + 70, { color: MUTED });
  });
  p.arrow(240, 320, 240, 370, { color: CYAN });
  badge(p, 330, 390, 'tip ← refs/cabeza', { color: GREEN, size: 18, w: 190 });
  caption(p, 'una rama es un puntero móvil', 256, 460, { color: MUTED, size: 20 });
}

export function queEsUnMergeCommitYQueEsElPrimerPadre(p) {
  baseBg(p);
  treeNode(p, 150, 160, 'main', { color: CYAN, r: 34 });
  treeNode(p, 362, 160, 'feat', { color: MAGENTA, r: 34 });
  treeNode(p, 256, 320, 'merge', { color: GREEN, r: 40, size: 18 });
  p.arrow(170, 190, 230, 290, { color: CYAN });
  p.arrow(342, 190, 282, 290, { color: MAGENTA });
  badge(p, 165, 260, '1.er padre', { color: CYAN, size: 17, w: 130 });
  badge(p, 348, 260, '2.º padre', { color: MAGENTA, size: 17, w: 130 });
  caption(p, 'HEAD^1', 150, 95, { color: CYAN, size: 20 });
  caption(p, 'HEAD^2', 362, 95, { color: MAGENTA, size: 20 });
  caption(p, 'dos o más padres', 256, 440, { color: MUTED, size: 20 });
}

export function cuandoPuedeUnHistorialTenerVariasRaices(p) {
  baseBg(p);
  treeNode(p, 130, 400, 'r1', { color: GREEN, r: 32 });
  treeNode(p, 382, 400, 'r2', { color: GREEN, r: 32 });
  treeNode(p, 130, 280, 'a', { color: CYAN, r: 28 });
  treeNode(p, 382, 280, 'b', { color: CYAN, r: 28 });
  treeNode(p, 256, 170, 'merge', { color: MAGENTA, r: 38, size: 18 });
  p.arrow(130, 368, 130, 310, { color: MUTED });
  p.arrow(382, 368, 382, 310, { color: MUTED });
  p.arrow(148, 255, 228, 195, { color: MUTED });
  p.arrow(364, 255, 284, 195, { color: MUTED });
  badge(p, 256, 90, 'raíces múltiples', { color: AMBER, size: 20, w: 210 });
  caption(p, 'merge de historias sin padre común', 256, 465, { color: MUTED, size: 18 });
}

export function queSignificaQueUnObjetoSeaAlcanzableEnGit(p) {
  baseBg(p);
  box(p, 90, 120, 150, 80, { color: GREEN, label: 'refs' });
  box(p, 272, 120, 150, 80, { color: MUTED, label: 'index' });
  box(p, 90, 280, 150, 80, { color: GREEN, label: 'vivo' });
  box(p, 272, 280, 150, 80, { color: MAGENTA, label: 'huérfano', dashed: true });
  p.arrow(165, 205, 165, 275, { color: GREEN });
  caption(p, 'la gc no lo toca', 165, 400, { color: TEXT, size: 20 });
  caption(p, 'expira y muere', 347, 400, { color: MAGENTA, size: 20 });
  caption(p, 'raíces: refs, HEAD, index, reflog', 256, 460, { color: MUTED, size: 18 });
}

export function queEsElMergeBaseDeDosCommits(p) {
  baseBg(p);
  treeNode(p, 256, 140, 'base', { color: AMBER, r: 36 });
  treeNode(p, 150, 290, 'A', { color: CYAN, r: 32 });
  treeNode(p, 362, 290, 'B', { color: MAGENTA, r: 32 });
  p.arrow(225, 168, 170, 260, { color: MUTED });
  p.arrow(287, 168, 342, 260, { color: MUTED });
  badge(p, 256, 400, 'ancestro común más reciente', { color: AMBER, size: 17, w: 330 });
  caption(p, 'punto de partida del merge de tres vías', 256, 455, { color: MUTED, size: 18 });
}

export function quePropiedadesDaElAlmacenamientoDireccionablePorConte(p) {
  baseBg(p);
  varChip(p, 256, 130, 'sha256(...)', { w: 220, color: CYAN });
  p.arrow(256, 160, 256, 215, { color: CYAN });
  box(p, 106, 220, 300, 110, { color: GREEN, label: 'contenido' });
  caption(p, 'mismo hash ⇒ mismo contenido', 256, 360, { color: TEXT, size: 22 });
  badge(p, 256, 415, 'integridad + deduplicación', { color: GREEN, size: 18, w: 290 });
  caption(p, 'la dirección ES el contenido', 256, 465, { color: MUTED, size: 18 });
}

export function queEsUnMerkleDagYDondeMasApareceLaIdea(p) {
  baseBg(p);
  treeNode(p, 256, 120, 'h3', { color: AMBER, r: 30 });
  treeNode(p, 150, 250, 'h1', { color: CYAN, r: 30 });
  treeNode(p, 362, 250, 'h2', { color: CYAN, r: 30 });
  p.arrow(230, 148, 170, 220, { color: MUTED });
  p.arrow(282, 148, 342, 220, { color: MUTED });
  caption(p, 'h = hash(hijos)', 256, 330, { color: TEXT, size: 22 });
  badge(p, 160, 400, 'Git', { color: GREEN, size: 20, w: 100 });
  badge(p, 300, 400, 'IPFS', { color: GREEN, size: 20, w: 110 });
  badge(p, 420, 400, 'BTC', { color: GREEN, size: 20, w: 100 });
  caption(p, 'cambiar una hoja rompe toda la cadena', 256, 465, { color: MUTED, size: 18 });
}

export function comoPuedenDiffYMergeSaltarDirectoriosEnterosSinL(p) {
  baseBg(p);
  box(p, 70, 130, 160, 90, { color: GREEN, label: 'tree A' });
  caption(p, 'hash 9f2a', 150, 205, { color: TEXT, size: 18 });
  box(p, 282, 130, 160, 90, { color: GREEN, label: 'tree B' });
  caption(p, 'hash 9f2a', 362, 205, { color: TEXT, size: 18 });
  badge(p, 256, 270, 'hash igual ⇒ saltar', { color: CYAN, size: 18, w: 230 });
  caption(p, 'subárbol intacto: cero lecturas', 256, 360, { color: TEXT, size: 22 });
  caption(p, 'diff y merge podan el DAG por contenido', 256, 420, { color: MUTED, size: 18 });
  dots(p, 160, 460, 350, { color: CYAN });
}

export function queHaceGitAnteElAtaqueDeColisionShatteredYQueOfre(p) {
  baseBg(p);
  box(p, 60, 140, 180, 150, { color: MAGENTA, label: 'SHA-1' });
  caption(p, 'SHAttered', 150, 215, { color: MAGENTA, size: 22 });
  caption(p, 'colisión 2017', 150, 255, { color: MUTED, size: 18 });
  box(p, 272, 140, 180, 150, { color: GREEN, label: 'SHA-256' });
  caption(p, 'sin colisiones', 362, 215, { color: GREEN, size: 20 });
  caption(p, 'conocidas', 362, 255, { color: MUTED, size: 18 });
  badge(p, 256, 360, 'detección de colisión + hardening', { color: CYAN, size: 16, w: 330 });
  caption(p, 'sha256 como objeto nuevo del repositorio', 256, 430, { color: MUTED, size: 18 });
}
