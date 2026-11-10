// scripts/p5-art/sketches/git-escala.mjs — repos gigantes: clones parciales y sparse.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, stackFrame } from '../primitives.mjs';

export function queDimensionesDeCostoAparecenAlEscalarUnRepositorio(p) {
  baseBg(p);
  const rows = [
    ['CPU', 'repack y diff', CYAN],
    ['RAM', 'índices y mapas', MAGENTA],
    ['I/O', 'objetos sueltos', AMBER],
    ['red', 'fetch de todo', GREEN],
  ];
  rows.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 105 + i * 66, 140, 44, k, { color, size: 18 });
    caption(p, v, 340, 127 + i * 66, { color: TEXT, size: 17 });
  });
  caption(p, 'escalar = recortar trabajo, no comprar músculo', 256, 445, { color: MUTED, size: 15 });
}

export function queEsUnPartialCloneYQueFiltroEsElPuntoDeEquilibr(p) {
  baseBg(p);
  badge(p, 256, 105, '--filter=blob:none', { color: CYAN, size: 19, w: 310 });
  caption(p, 'trae trees + commits', 256, 165, { color: TEXT, size: 18 });
  caption(p, 'y blobs solo al checkout', 256, 205, { color: TEXT, size: 18 });
  badge(p, 256, 300, 'blob:limit=1m como plan B', { color: AMBER, size: 17, w: 300 });
  caption(p, 'monorepo navegable, bytes a demanda', 256, 370, { color: TEXT, size: 17 });
  caption(p, 'promisor remote: la red paga la visita', 256, 465, { color: MUTED, size: 15 });
}

export function queEsUnShallowCloneYCualEsSuLimitacion(p) {
  baseBg(p);
  p.push();
  p.stroke(GREEN);
  p.strokeWeight(5);
  p.line(80, 250, 432, 250);
  p.pop();
  p.push();
  p.stroke(MUTED);
  p.strokeWeight(3);
  p.dash('7 6');
  p.line(80, 320, 432, 320);
  p.dash(null);
  p.pop();
  badge(p, 256, 200, '--depth 1', { color: GREEN, size: 20, w: 170 });
  caption(p, 'profundidad de historia', 256, 285, { color: TEXT, size: 17 });
  caption(p, 'arriba: visible · abajo: ausente', 256, 350, { color: MUTED, size: 16 });
  caption(p, 'CI y docs lo aman', 256, 420, { color: TEXT, size: 18 });
  caption(p, 'blame/bisect/log requieren unfull', 256, 465, { color: MUTED, size: 15 });
}

export function queHacenElSparseCheckoutEnModoConeYElSparseIndex(p) {
  baseBg(p);
  box(p, 60, 120, 180, 200, { color: CYAN, label: 'cone' });
  caption(p, 'patrones por', 150, 190, { color: TEXT, size: 17 });
  caption(p, 'directorio', 150, 225, { color: TEXT, size: 17 });
  caption(p, 'rápido y simple', 150, 275, { color: MUTED, size: 15 });
  box(p, 272, 120, 180, 200, { color: GREEN, label: 'sparse-index' });
  caption(p, 'el index también', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'se queda corto:', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'O(tu carpeta)', 362, 275, { color: GREEN, size: 17 });
  caption(p, 'status en milisegundos', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'monorepo con 100k rutas', 256, 465, { color: MUTED, size: 16 });
}

export function queAceleranFsmonitorYUntrackedCache(p) {
  baseBg(p);
  badge(p, 256, 110, 'git status en repos gigantes', { color: AMBER, size: 19, w: 330 });
  const rows = [
    ['fsmonitor', ' eventos del SO sobre el worktree', CYAN],
    ['untrackedCache', ' memoiza lo no versionado', GREEN],
  ];
  rows.forEach(([name, what], i) => {
    stackFrame(p, 50, 190 + i * 80, 190, 44, name, { color: i === 0 ? CYAN : GREEN, size: 16 });
    caption(p, what, 350, 212 + i * 80, { color: TEXT, size: 15 });
  });
  caption(p, 'de barrido total a diferencial', 256, 400, { color: TEXT, size: 18 });
  caption(p, 'multiplicados si el disco es lento', 256, 465, { color: MUTED, size: 16 });
}

export function queActivaScalarDeUnaSolaVez(p) {
  baseBg(p);
  badge(p, 256, 110, 'scalar clone / register', { color: CYAN, size: 20, w: 330 });
  const rows = [
    'partial clone blob:none',
    'sparse cone + sparse-index',
    'fsmonitor + untrackedCache',
    'commit-graph + prefetch',
  ];
  rows.forEach((label, i) => {
    badge(p, 256, 185 + i * 66, label, { color: i % 2 ? GREEN : AMBER, size: 16, w: 320 });
  });
  caption(p, 'todo lo bueno, encendido por defecto', 256, 470, { color: MUTED, size: 16 });
}

export function queDiferenciaHayEntreSubmoduloYSubtree(p) {
  baseBg(p);
  box(p, 55, 120, 190, 230, { color: CYAN, label: 'submódulo' });
  caption(p, 'puntero a commit', 150, 190, { color: TEXT, size: 17 });
  caption(p, 'repo aparte, refs propias', 150, 230, { color: MUTED, size: 15 });
  caption(p, 'clone recursivo', 150, 270, { color: MUTED, size: 15 });
  badge(p, 150, 320, 'acoplado', { color: CYAN, size: 16, w: 130 });
  box(p, 267, 120, 190, 230, { color: GREEN, label: 'subtree' });
  caption(p, 'carpeta del mismo repo', 362, 190, { color: TEXT, size: 15 });
  caption(p, 'un solo historial', 362, 230, { color: MUTED, size: 15 });
  caption(p, 'sin pasos extra', 362, 270, { color: MUTED, size: 15 });
  badge(p, 362, 320, 'fusionable', { color: GREEN, size: 16, w: 140 });
  caption(p, 'vendor de código ajeno en tu árbol', 256, 430, { color: MUTED, size: 16 });
}

export function queEsGitWorktreeYParaQueSirve(p) {
  baseBg(p);
  box(p, 70, 120, 372, 80, { color: CYAN, label: '.git (compartido)' });
  p.arrow(150, 205, 150, 245, { color: CYAN });
  p.arrow(256, 205, 256, 245, { color: CYAN });
  p.arrow(362, 205, 362, 245, { color: CYAN });
  box(p, 60, 250, 170, 80, { color: GREEN, label: 'worktree main' });
  box(p, 250, 250, 170, 80, { color: GREEN, label: 'worktree feat' });
  badge(p, 440, 290, 'sin stash', { color: AMBER, size: 15, w: 110 });
  caption(p, 'dos ramas vivas en carpetas distintas', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'cero clon extra, cero copia de objetos', 256, 460, { color: MUTED, size: 15 });
}
