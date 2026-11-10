// scripts/p5-art/sketches/git-objetos.mjs — blob, tree, commit, tag, índice y reset.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, stackFrame, varChip } from '../primitives.mjs';

export function queGuardaUnBlobDeGit(p) {
  baseBg(p);
  box(p, 90, 130, 332, 150, { color: CYAN, label: 'blob' });
  caption(p, 'solo bytes del archivo', 256, 210, { color: TEXT, size: 22 });
  caption(p, 'sin nombre, sin ruta, sin hora', 256, 250, { color: MUTED, size: 18 });
  varChip(p, 256, 350, 'contenido puro', { w: 200, color: GREEN });
  caption(p, 'la ruta vive en el tree', 256, 440, { color: MUTED, size: 20 });
}

export function queGuardaUnTreeYComoOrdenaSusEntradas(p) {
  baseBg(p);
  box(p, 80, 110, 352, 250, { color: CYAN, label: 'tree' });
  varChip(p, 190, 190, 'src', { w: 110, color: MAGENTA });
  varChip(p, 320, 190, 'README', { w: 120, color: MAGENTA });
  varChip(p, 190, 260, '.gitignore', { w: 150, color: MAGENTA });
  varChip(p, 320, 260, 'util.go', { w: 120, color: MAGENTA });
  caption(p, 'modo + hash + nombre', 256, 400, { color: TEXT, size: 20 });
  caption(p, 'orden de bytes crudo, no alfabético', 256, 450, { color: MUTED, size: 18 });
}

export function queGuardaUnCommitDeGit(p) {
  baseBg(p);
  box(p, 70, 110, 372, 260, { color: GREEN, label: 'commit' });
  varChip(p, 180, 175, 'tree', { w: 110, color: CYAN });
  varChip(p, 320, 175, 'padres', { w: 110, color: CYAN });
  varChip(p, 180, 245, 'author', { w: 110, color: MAGENTA });
  varChip(p, 320, 245, 'committer', { w: 130, color: MAGENTA });
  varChip(p, 256, 315, 'mensaje', { w: 130, color: AMBER });
  caption(p, 'una instantánea completa + metadatos', 256, 430, { color: MUTED, size: 18 });
}

export function queDiferenciaHayEntreUnTagAnotadoYUnTagLigero(p) {
  baseBg(p);
  box(p, 55, 120, 190, 240, { color: GREEN, label: 'anotado' });
  caption(p, 'objeto propio', 150, 195, { color: TEXT, size: 20 });
  caption(p, 'mensaje, firma,', 150, 235, { color: MUTED, size: 18 });
  caption(p, 'autor, fecha', 150, 265, { color: MUTED, size: 18 });
  badge(p, 150, 320, 'tag -a', { color: GREEN, size: 18, w: 110 });
  box(p, 267, 120, 190, 240, { color: MUTED, label: 'ligero' });
  caption(p, 'solo un puntero', 362, 195, { color: TEXT, size: 20 });
  caption(p, 'a un commit', 362, 235, { color: MUTED, size: 18 });
  caption(p, 'sin metadatos', 362, 265, { color: MUTED, size: 18 });
  badge(p, 362, 320, 'ref suelta', { color: MUTED, size: 18, w: 110 });
  caption(p, 'los releases piden anotado', 256, 430, { color: MUTED, size: 18 });
}

export function cualEsElFormatoFisicoDeUnObjetoDeGit(p) {
  baseBg(p);
  fnPill(p, 256, 130, '"blob 14\\0hola mundo"', { w: 300, h: 56, color: CYAN, size: 20 });
  p.arrow(256, 160, 256, 215, { color: CYAN });
  varChip(p, 256, 240, 'zlib', { w: 110, color: MAGENTA });
  p.arrow(256, 265, 256, 320, { color: MAGENTA });
  box(p, 116, 325, 280, 80, { color: GREEN, label: '.git/objects/ab/cdef...' });
  caption(p, 'tipo + tamaño + \\0 + contenido', 256, 450, { color: TEXT, size: 20 });
  caption(p, 'carpetas = 2 primeros hex', 256, 480, { color: MUTED, size: 16 });
}

export function queDiferenciaHayEntreAuthorYCommitter(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: CYAN, label: 'author' });
  caption(p, 'escribió el', 150, 190, { color: TEXT, size: 20 });
  caption(p, 'cambio', 150, 225, { color: TEXT, size: 20 });
  badge(p, 150, 280, '¿quién?', { color: CYAN, size: 18, w: 120 });
  box(p, 267, 120, 190, 200, { color: AMBER, label: 'committer' });
  caption(p, 'lo puso en la', 362, 190, { color: TEXT, size: 20 });
  caption(p, 'historia', 362, 225, { color: TEXT, size: 20 });
  badge(p, 362, 280, 'rebase/cherry-pick', { color: AMBER, size: 15, w: 170 });
  caption(p, 'rebase conserva author, cambia committer', 256, 400, { color: MUTED, size: 17 });
  dots(p, 150, 450, 360, { color: CYAN });
}

export function porQueEditarElMensajeDeUnCommitCambiaLosHashesDe(p) {
  baseBg(p);
  stackFrame(p, 90, 110, 140, 40, 'A', { color: GREEN, size: 20 });
  stackFrame(p, 90, 158, 140, 40, 'B editado', { color: MAGENTA, size: 17 });
  stackFrame(p, 90, 206, 140, 40, 'C', { color: AMBER, size: 20 });
  stackFrame(p, 90, 254, 140, 40, 'D', { color: AMBER, size: 20 });
  p.arrow(160, 130, 175, 176, { color: MUTED });
  p.arrow(160, 178, 175, 224, { color: MUTED });
  p.arrow(160, 226, 175, 272, { color: MUTED });
  badge(p, 330, 175, 'hash(B) cambia', { color: MAGENTA, size: 17, w: 190 });
  p.arrow(240, 175, 280, 175, { color: MAGENTA });
  caption(p, 'los hijos apuntan al padre nuevo', 256, 350, { color: TEXT, size: 20 });
  caption(p, 'todo el linaje re-hashea', 256, 440, { color: MUTED, size: 20 });
}

export function queModosPuedeTenerUnaEntradaDeUnTree(p) {
  baseBg(p);
  varChip(p, 130, 140, '100644', { w: 150, color: CYAN, size: 20 });
  caption(p, 'archivo', 130, 200, { color: MUTED, size: 18 });
  varChip(p, 370, 140, '100755', { w: 150, color: GREEN, size: 20 });
  caption(p, 'ejecutable', 370, 200, { color: MUTED, size: 18 });
  varChip(p, 130, 280, '120000', { w: 150, color: MAGENTA, size: 20 });
  caption(p, 'symlink', 130, 340, { color: MUTED, size: 18 });
  varChip(p, 370, 280, '040000', { w: 150, color: AMBER, size: 20 });
  caption(p, 'subdirectorio', 370, 340, { color: MUTED, size: 18 });
  caption(p, 'sin permisos por usuario', 256, 430, { color: TEXT, size: 18 });
  caption(p, 'solo estos cuatro', 256, 465, { color: MUTED, size: 18 });
}

export function porQueGitNoVersionaDirectoriosVacios(p) {
  baseBg(p);
  box(p, 60, 130, 180, 150, { color: GREEN, label: 'tree' });
  varChip(p, 150, 210, 'util.go', { w: 110, color: CYAN, size: 18 });
  varChip(p, 150, 270, 'main.go', { w: 110, color: CYAN, size: 18 });
  box(p, 272, 130, 180, 150, { color: MAGENTA, label: 'vacío/', dashed: true });
  caption(p, 'no hay nada', 362, 210, { color: MUTED, size: 18 });
  caption(p, 'que guardar', 362, 250, { color: MUTED, size: 18 });
  caption(p, 'los tree solo listan contenido', 256, 360, { color: TEXT, size: 20 });
  badge(p, 256, 420, 'truco: .gitkeep', { color: AMBER, size: 18, w: 190 });
}

export function queGuardaGitDiffsOInstantaneas(p) {
  baseBg(p);
  box(p, 55, 120, 190, 230, { color: MAGENTA, label: 'diffs' });
  caption(p, 'cadena de parches', 150, 195, { color: TEXT, size: 18 });
  caption(p, 'para reconstruir', 150, 235, { color: MUTED, size: 18 });
  caption(p, 'hay que sumar', 150, 270, { color: MUTED, size: 18 });
  badge(p, 150, 320, 'O(n)', { color: MAGENTA, size: 18, w: 90 });
  box(p, 267, 120, 190, 230, { color: GREEN, label: 'instantáneas' });
  caption(p, 'cada commit', 362, 195, { color: TEXT, size: 18 });
  caption(p, 'apunta a un tree', 362, 235, { color: MUTED, size: 18 });
  caption(p, 'completo', 362, 270, { color: MUTED, size: 18 });
  badge(p, 362, 320, 'O(1)', { color: GREEN, size: 18, w: 90 });
  caption(p, 'los diffs se calculan al vuelo', 256, 430, { color: MUTED, size: 18 });
}

export function queObjetosNuevosCreaUnCommitQueEditaUnSoloArchivo(p) {
  baseBg(p);
  varChip(p, 256, 110, 'edita util.go', { w: 190, color: MAGENTA });
  p.arrow(256, 135, 140, 190, { color: CYAN });
  p.arrow(256, 135, 256, 190, { color: CYAN });
  p.arrow(256, 135, 372, 190, { color: CYAN });
  box(p, 60, 195, 160, 90, { color: CYAN, label: 'blob' });
  caption(p, 'nuevo', 140, 265, { color: MUTED, size: 18 });
  box(p, 176, 195, 160, 90, { color: CYAN, label: 'tree src' });
  caption(p, 'nuevo', 256, 265, { color: MUTED, size: 18 });
  box(p, 292, 195, 160, 90, { color: GREEN, label: 'commit' });
  caption(p, 'nuevo', 372, 265, { color: MUTED, size: 18 });
  caption(p, 'raíz y trees no tocados se reutilizan', 256, 390, { color: TEXT, size: 18 });
  caption(p, '3 objetos nuevos, 0 duplicados', 256, 430, { color: MUTED, size: 18 });
}

export function queEsElIndiceDeGitYQueCachea(p) {
  baseBg(p);
  box(p, 60, 120, 130, 100, { color: CYAN, label: 'worktree' });
  p.arrow(196, 170, 240, 170, { color: GREEN });
  box(p, 246, 120, 130, 100, { color: GREEN, label: 'index' });
  p.arrow(382, 170, 426, 170, { color: AMBER });
  box(p, 332, 120, 130, 100, { color: AMBER, label: 'HEAD' });
  caption(p, 'add', 218, 130, { color: GREEN, size: 18 });
  caption(p, 'commit', 404, 130, { color: AMBER, size: 18 });
  caption(p, 'caché de hash y modo por ruta', 256, 310, { color: TEXT, size: 20 });
  caption(p, 'evita releer todo el árbol', 256, 350, { color: MUTED, size: 18 });
  caption(p, 'construye el próximo tree en RAM', 256, 450, { color: MUTED, size: 18 });
}

export function queComparaGitDiffGitDiffStagedYGitDiffHead(p) {
  baseBg(p);
  box(p, 60, 140, 130, 90, { color: CYAN, label: 'worktree' });
  box(p, 191, 140, 130, 90, { color: GREEN, label: 'index' });
  box(p, 322, 140, 130, 90, { color: AMBER, label: 'HEAD' });
  badge(p, 130, 290, 'diff: WT↔IDX', { color: CYAN, size: 16, w: 150 });
  badge(p, 372, 290, '--staged: IDX↔HEAD', { color: GREEN, size: 15, w: 210 });
  badge(p, 256, 360, 'HEAD: WT↔HEAD', { color: AMBER, size: 16, w: 170 });
  caption(p, 'tres comparadores, dos fronteras', 256, 440, { color: MUTED, size: 18 });
}

export function queDiferenciaHayEntreResetSoftMixedYHard(p) {
  baseBg(p);
  const rows = [
    ['--soft', 'HEAD', CYAN],
    ['--mixed', 'HEAD + index', MAGENTA],
    ['--hard', 'todo', AMBER],
  ];
  rows.forEach(([name, scope, color], i) => {
    badge(p, 110, 130 + i * 90, name, { color, size: 18, w: 120 });
    caption(p, scope, 300, 130 + i * 90, { color: TEXT, size: 20 });
    caption(p, i === 2 ? 'borra cambios' : 'los conserva', 440, 130 + i * 90, { color: MUTED, size: 15 });
  });
  caption(p, 'hasta dónde deshace el reset', 256, 420, { color: MUTED, size: 20 });
  caption(p, 'HEAD → index → worktree', 256, 460, { color: MUTED, size: 18 });
}

export function queEtapasGuardaElIndiceParaUnArchivoEnConflictoDe(p) {
  baseBg(p);
  box(p, 90, 100, 332, 250, { color: MAGENTA, label: 'index en conflicto' });
  stackFrame(p, 115, 150, 282, 44, 'etapa 1 · base', { color: MUTED, size: 17 });
  stackFrame(p, 115, 202, 282, 44, 'etapa 2 · ours', { color: CYAN, size: 17 });
  stackFrame(p, 115, 254, 282, 44, 'etapa 3 · theirs', { color: MAGENTA, size: 17 });
  caption(p, 'tres entradas, misma ruta', 256, 400, { color: TEXT, size: 20 });
  caption(p, 'ls-files -u las lista', 256, 450, { color: MUTED, size: 18 });
}
