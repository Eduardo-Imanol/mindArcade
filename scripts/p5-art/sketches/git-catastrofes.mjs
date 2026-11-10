// scripts/p5-art/sketches/git-catastrofes.mjs — protocolos de rescate y referencias.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, treeNode } from '../primitives.mjs';

export function cualEsElProtocoloGeneralAnteUnDesastreDeGit(p) {
  baseBg(p);
  const steps = [
    ['1 · no tocar', 'ni gc, ni reset', CYAN],
    ['2 · respirar', 'casi nada se pierde', GREEN],
    ['3 · reflog', 'dónde estuvo HEAD', AMBER],
    ['4 · branch nuevo', 'apunta y rescata', MAGENTA],
  ];
  steps.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 100 + i * 78, 210, 48, k, { color, size: 17 });
    caption(p, v, 380, 124 + i * 78, { color: TEXT, size: 15 });
  });
  caption(p, 'la gc tarde 2 semanas en barrer', 256, 450, { color: MUTED, size: 16 });
  caption(p, 'reflog = 90 días de margen', 256, 485, { color: MUTED, size: 15 });
}

export function queEsLoPrimeroAnteUnSecretoFiltradoEnMain(p) {
  baseBg(p);
  badge(p, 256, 105, '0 · rotar la clave', { color: MAGENTA, size: 22, w: 260 });
  p.arrow(256, 127, 256, 170, { color: MAGENTA });
  const rows = [
    ['1 · revocar y reemitir', AMBER],
    ['2 · auditar accesos', CYAN],
    ['3 · avisar al equipo', GREEN],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 200 + i * 66, label, { color, size: 17, w: 260 });
  });
  caption(p, 'el historial se limpia al final', 256, 400, { color: TEXT, size: 18 });
  caption(p, 'filter-repo + force push coordinado', 256, 440, { color: MUTED, size: 16 });
  caption(p, 'con clones y forks avisados', 256, 475, { color: MUTED, size: 15 });
}

export function comoSeRecuperaUnMainSobrescritoPorUnForcePush(p) {
  baseBg(p);
  badge(p, 256, 105, 'force-push ajeno sobre main', { color: MAGENTA, size: 18, w: 330 });
  p.arrow(256, 127, 256, 170, { color: MAGENTA });
  badge(p, 256, 200, 'ORIG_HEAD en el remoto', { color: CYAN, size: 18, w: 290 });
  p.arrow(256, 222, 256, 265, { color: CYAN });
  badge(p, 256, 295, 'reflog del servidor', { color: AMBER, size: 18, w: 240 });
  caption(p, 'quien puede empujar puede deshacer', 256, 380, { color: TEXT, size: 17 });
  caption(p, 'y proteger la rama para que no repita', 256, 465, { color: MUTED, size: 16 });
}

export function queTrampaEscondeRevertirUnMergeCommit(p) {
  baseBg(p);
  treeNode(p, 256, 120, 'M (merge)', { color: CYAN, r: 44, size: 16 });
  p.arrow(256, 166, 256, 215, { color: MAGENTA });
  badge(p, 256, 245, 'revert M deshace TODO el lado', { color: MAGENTA, size: 16, w: 340 });
  caption(p, '-m 1 elige el primer padre', 256, 310, { color: TEXT, size: 18 });
  badge(p, 256, 370, 're-merge: "ya revertido" pega', { color: AMBER, size: 16, w: 330 });
  caption(p, 'hay que revertir el revert primero', 256, 465, { color: MUTED, size: 16 });
}

export function comoSeSaleDeUnRebaseEnredadoOEquivocado(p) {
  baseBg(p);
  badge(p, 256, 105, 'rebase a mitad de lío', { color: AMBER, size: 19, w: 300 });
  const rows = [
    ['--abort', 'vuelve al punto de partida', CYAN],
    ['--quit', 'deja el estado, sigue vivo', AMBER],
    ['--continue', 'resuelve y avanza', GREEN],
  ];
  rows.forEach(([cmd, what, color], i) => {
    stackFrame(p, 60, 170 + i * 78, 170, 48, cmd, { color, size: 18 });
    caption(p, what, 380, 194 + i * 78, { color: TEXT, size: 15 });
  });
  caption(p, 'ORIG_HEAD guarda la vida anterior', 256, 440, { color: TEXT, size: 17 });
  caption(p, 'abort no borra nada tuyo', 256, 475, { color: MUTED, size: 15 });
}

export function comoSeRescatanCommitsHechosEnDetachedHead(p) {
  baseBg(p);
  badge(p, 256, 110, 'HEAD suelto', { color: AMBER, size: 20, w: 190 });
  p.arrow(256, 132, 256, 175, { color: AMBER });
  stackFrame(p, 90, 180, 332, 44, 'commits sin rama', { color: MAGENTA, size: 17 });
  p.arrow(256, 228, 256, 270, { color: GREEN });
  badge(p, 256, 300, 'branch rescate <sha>', { color: GREEN, size: 19, w: 280 });
  caption(p, 'reflog los encuentra por fecha', 256, 380, { color: TEXT, size: 17 });
  caption(p, 'HEAD@{2} suele bastar', 256, 420, { color: MUTED, size: 16 });
  caption(p, 'antes de que expiren (90 días)', 256, 465, { color: MUTED, size: 15 });
}

export function cualEsElTriageRapidoSiElRepositorioEstaCorrupto(p) {
  baseBg(p);
  const rows = [
    ['fsck', 'localiza objetos rotos', CYAN],
    ['reclone', 'y transplantar tu trabajo', GREEN],
    ['recover', 'objects/info/alternates', AMBER],
  ];
  rows.forEach(([cmd, what, color], i) => {
    stackFrame(p, 60, 115 + i * 78, 160, 48, cmd, { color, size: 18 });
    caption(p, what, 360, 139 + i * 78, { color: TEXT, size: 15 });
  });
  caption(p, 'primero copiar .git a salvo', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'y desde el clon sano: fetch del roto', 256, 440, { color: MUTED, size: 16 });
  caption(p, 'todo lo alcanzable vuelve a casa', 256, 475, { color: MUTED, size: 15 });
}

export function queLibroDeReferenciaGratuitaCubreGitYSusInterioridades(p) {
  baseBg(p);
  box(p, 90, 150, 332, 180, { color: CYAN, label: 'Pro Git' });
  caption(p, 'Apress · gratis en PDF/ePub', 256, 240, { color: TEXT, size: 20 });
  caption(p, '2.ª edición, capítulo 10: interioridades', 256, 290, { color: MUTED, size: 17 });
  badge(p, 256, 400, 'git-scm.com/book', { color: GREEN, size: 18, w: 240 });
  caption(p, 'plumbing y porcelana dentro', 256, 465, { color: MUTED, size: 16 });
}

export function queArticuloOriginalDescribeElAlgoritmoDeDiffDeGit(p) {
  baseBg(p);
  badge(p, 256, 120, 'An O(ND) Difference Algorithm', { color: CYAN, size: 17, w: 370 });
  caption(p, 'Eugene W. Myers, 1986', 256, 190, { color: TEXT, size: 22 });
  caption(p, 'Algorithmica', 256, 235, { color: MUTED, size: 18 });
  caption(p, 'la base de diff, y también de RNA', 256, 330, { color: TEXT, size: 18 });
  caption(p, '(alineamiento de secuencias)', 256, 365, { color: MUTED, size: 16 });
  dots(p, 150, 450, 360, { color: CYAN });
}
