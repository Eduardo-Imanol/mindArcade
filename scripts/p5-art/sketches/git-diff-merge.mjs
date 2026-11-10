// scripts/p5-art/sketches/git-diff-merge.mjs — Myers, tres vías, conflictos y ort.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, treeNode, varChip } from '../primitives.mjs';

export function queProblemaResuelveUnAlgoritmoDeDiff(p) {
  baseBg(p);
  caption(p, 'A: x b c y', 256, 130, { color: CYAN, size: 24 });
  caption(p, 'B: x d c y', 256, 180, { color: MAGENTA, size: 24 });
  badge(p, 256, 260, '- b   + d', { color: AMBER, size: 22, w: 170 });
  caption(p, 'mínimos borra/inserta', 256, 340, { color: TEXT, size: 22 });
  caption(p, 'que convierten A en B', 256, 380, { color: MUTED, size: 18 });
  dots(p, 150, 450, 360, { color: CYAN });
}

export function cualEsLaIdeaDelGrafoDeEdicionDeMyers(p) {
  baseBg(p);
  const n = 6;
  const x0 = 100;
  const y0 = 120;
  const step = 55;
  for (let i = 0; i <= n; i += 1) {
    for (let j = 0; j <= n; j += 1) {
      const diag = i > 0 && j > 0 && i === j;
      p.push();
      p.noStroke();
      p.fill(diag ? 'rgba(57, 255, 20, 0.55)' : 'rgba(138, 127, 181, 0.25)');
      p.circle(x0 + i * step, y0 + j * step, 10);
      p.pop();
    }
  }
  p.push();
  p.stroke(CYAN);
  p.strokeWeight(2.5);
  p.line(x0, y0, x0 + 3 * step, y0 + 3 * step);
  p.line(x0 + 3 * step, y0 + 3 * step, x0 + n * step, y0 + n * step);
  p.pop();
  badge(p, 256, 470, 'la diagonal diagonal es el camino corto', { color: GREEN, size: 16, w: 340 });
}

export function queComplejidadTieneMyersYDeQueDepende(p) {
  baseBg(p);
  badge(p, 256, 130, 'O((N+D)·D)', { color: CYAN, size: 26, w: 220 });
  varChip(p, 140, 250, 'N = tamaño', { w: 160, color: MUTED, size: 18 });
  varChip(p, 372, 250, 'D = distancia', { w: 170, color: MAGENTA, size: 17 });
  p.arrow(256, 300, 256, 360, { color: AMBER });
  caption(p, 'archivos casi iguales: D chico, diff casi lineal', 256, 390, { color: TEXT, size: 18 });
  caption(p, 'la edición manda, no el tamaño', 256, 460, { color: MUTED, size: 18 });
}

export function quePasaConMyersSiLosArchivosSonTotalmenteDistintos(p) {
  baseBg(p);
  box(p, 60, 130, 180, 110, { color: CYAN, label: 'A' });
  box(p, 272, 130, 180, 110, { color: MAGENTA, label: 'B' });
  p.arrow(246, 185, 266, 185, { color: MAGENTA });
  badge(p, 256, 310, 'D ≈ N+M', { color: AMBER, size: 22, w: 150 });
  caption(p, 'el grafo se llena: coste cuadrático', 256, 370, { color: TEXT, size: 18 });
  caption(p, 'Git cae a heurísticas ante lo distinto', 256, 430, { color: MUTED, size: 17 });
}

export function queAnadeGitSobreElMyersPuro(p) {
  baseBg(p);
  badge(p, 256, 105, 'Myers + heurísticas', { color: CYAN, size: 20, w: 260 });
  const rows = [
    ['recorte de prefijo/sufijo', CYAN],
    ['líneas en blanco y anclajes', GREEN],
    ['límite de coste (XDL_MAX_COST)', AMBER],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 180 + i * 80, label, { color, size: 17, w: 310 });
  });
  caption(p, 'la salida sigue siendo mínima', 256, 450, { color: MUTED, size: 18 });
}

export function cuandoConvienePatienceOHistogramComoAlgoritmoDeD(p) {
  baseBg(p);
  box(p, 55, 120, 190, 210, { color: CYAN, label: 'patience' });
  caption(p, 'anclas únicas', 150, 195, { color: TEXT, size: 19 });
  caption(p, 'entre líneas', 150, 230, { color: TEXT, size: 19 });
  caption(p, 'comunes', 150, 265, { color: TEXT, size: 19 });
  box(p, 267, 120, 190, 210, { color: GREEN, label: 'histogram' });
  caption(p, 'patience +', 362, 195, { color: TEXT, size: 19 });
  caption(p, 'cubetas por', 362, 230, { color: TEXT, size: 19 });
  caption(p, 'frecuencia', 362, 265, { color: TEXT, size: 19 });
  badge(p, 256, 390, 'código movido de bloque', { color: AMBER, size: 17, w: 280 });
  caption(p, '-Xdiff-algorithm=histogram', 256, 460, { color: MUTED, size: 16 });
}

export function queSignificaElEncabezadoDeUnHunkEnFormatoUnific(p) {
  baseBg(p);
  badge(p, 256, 110, '@@ -12,7 +12,9 @@', { color: CYAN, size: 22, w: 290 });
  caption(p, '−: desde archivo A, línea 12, 7 líneas', 256, 190, { color: TEXT, size: 17 });
  caption(p, '+: desde archivo B, línea 12, 9 líneas', 256, 230, { color: TEXT, size: 17 });
  stackFrame(p, 100, 280, 312, 40, 'contexto 3 líneas arriba', { color: MUTED, size: 16 });
  stackFrame(p, 100, 328, 312, 40, 'cambio', { color: AMBER, size: 17 });
  stackFrame(p, 100, 376, 312, 40, 'contexto 3 líneas abajo', { color: MUTED, size: 16 });
  caption(p, 'bastante contexto para aplicar a mano', 256, 470, { color: MUTED, size: 16 });
}

export function comoDetectaGitLosRenombres(p) {
  baseBg(p);
  stackFrame(p, 60, 130, 190, 60, 'a.txt', { color: CYAN, size: 20 });
  p.arrow(256, 160, 256, 220, { color: GREEN });
  stackFrame(p, 262, 195, 190, 60, 'b.txt', { color: GREEN, size: 20 });
  badge(p, 256, 310, 'blob igual ⇒ 100% rename', { color: AMBER, size: 17, w: 270 });
  caption(p, '-M90% con ediciones pequeñas', 256, 370, { color: TEXT, size: 18 });
  caption(p, 'heurística: mismo contenido + límite', 256, 430, { color: MUTED, size: 17 });
  caption(p, 'follow detecta un solo camino', 256, 465, { color: MUTED, size: 16 });
}

export function porQueElMergeDeTresViasNecesitaElAncestroComun(p) {
  baseBg(p);
  treeNode(p, 256, 120, 'base', { color: AMBER, r: 34 });
  treeNode(p, 150, 260, 'A', { color: CYAN, r: 30 });
  treeNode(p, 362, 260, 'B', { color: MAGENTA, r: 30 });
  p.arrow(230, 146, 170, 232, { color: MUTED });
  p.arrow(282, 146, 342, 232, { color: MUTED });
  p.arrow(180, 260, 322, 260, { color: GREEN, dashed: true });
  caption(p, 'sin base no se sabe', 256, 330, { color: TEXT, size: 21 });
  caption(p, 'qué lado cambió cada línea', 256, 370, { color: TEXT, size: 19 });
  caption(p, 'diff(base→A) + diff(base→B) fusionados', 256, 450, { color: MUTED, size: 17 });
}

export function queReglaDecideCadaRegionEnUnMergeDeTresVias(p) {
  baseBg(p);
  const rows = [
    ['A cambió, B no', 'gana A', CYAN],
    ['ambos iguales', 'queda igual', MUTED],
    ['ambos, igual texto', 'queda', GREEN],
    ['ambos, distinto texto', 'conflicto', MAGENTA],
  ];
  rows.forEach(([cond, res, color], i) => {
    caption(p, cond, 150, 120 + i * 70, { color: TEXT, size: 17 });
    badge(p, 350, 120 + i * 70, res, { color, size: 16, w: 130 });
  });
  caption(p, 'por región, no por archivo', 256, 440, { color: MUTED, size: 18 });
}

export function queEsUnConflictoParaGit(p) {
  baseBg(p);
  stackFrame(p, 90, 110, 332, 44, '<<<<<<< ours', { color: CYAN, size: 18 });
  stackFrame(p, 90, 162, 332, 44, '=======', { color: AMBER, size: 18 });
  stackFrame(p, 90, 214, 332, 44, '>>>>>>> theirs', { color: MAGENTA, size: 18 });
  caption(p, 'la región tiene dos dueños', 256, 330, { color: TEXT, size: 22 });
  caption(p, 'no es un error de Git: es un empate', 256, 420, { color: MUTED, size: 18 });
  caption(p, 'la decisión es humana', 256, 460, { color: MUTED, size: 18 });
}

export function queDiferenciaHayEntreLosEstilosDeConflictoMergeDiff(p) {
  baseBg(p);
  box(p, 55, 110, 130, 90, { color: CYAN, label: 'merge' });
  caption(p, '2 lados', 120, 175, { color: TEXT, size: 17 });
  box(p, 191, 110, 130, 90, { color: AMBER, label: 'diff3' });
  caption(p, '+ base', 256, 175, { color: TEXT, size: 17 });
  box(p, 327, 110, 130, 90, { color: GREEN, label: 'zdiff3' });
  caption(p, 'base no', 392, 160, { color: TEXT, size: 16 });
  caption(p, 'se come', 392, 190, { color: TEXT, size: 16 });
  badge(p, 256, 300, 'ver la base aclara la intención', { color: AMBER, size: 17, w: 310 });
  caption(p, 'merge.conflictStyle = zdiff3', 256, 370, { color: TEXT, size: 18 });
  caption(p, 'el contexto expuesto decanta el empate', 256, 460, { color: MUTED, size: 16 });
}

export function queEsUnConflictoSemantico(p) {
  baseBg(p);
  box(p, 60, 130, 180, 100, { color: CYAN, label: 'A renombra' });
  caption(p, 'llama()', 150, 205, { color: TEXT, size: 17 });
  box(p, 272, 130, 180, 100, { color: MAGENTA, label: 'B borra' });
  caption(p, 'llama()', 362, 205, { color: TEXT, size: 17 });
  badge(p, 256, 310, 'merge limpio, build rota', { color: AMBER, size: 18, w: 290 });
  caption(p, 'los textos casan, el código no compila', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'solo lo detectan tests y compilación', 256, 460, { color: MUTED, size: 17 });
}

export function queEsUnMergeCrissCrossYPorQueImporta(p) {
  baseBg(p);
  treeNode(p, 150, 130, 'base', { color: AMBER, r: 32 });
  treeNode(p, 362, 130, 'm1', { color: CYAN, r: 30, size: 19 });
  treeNode(p, 150, 290, 'm2', { color: CYAN, r: 30, size: 19 });
  treeNode(p, 362, 290, 'X', { color: MAGENTA, r: 32 });
  p.arrow(170, 160, 340, 200, { color: MUTED });
  p.arrow(342, 160, 172, 258, { color: MUTED });
  p.arrow(362, 160, 362, 258, { color: MUTED });
  p.arrow(150, 160, 150, 258, { color: MUTED });
  badge(p, 256, 400, 'dos bases comunes posibles', { color: AMBER, size: 18, w: 300 });
  caption(p, 'elegir mal la base fabrica conflictos', 256, 455, { color: MUTED, size: 17 });
}

export function queEstrategiaDeMergeEsLaPredeterminadaDesdeGit2_34(p) {
  baseBg(p);
  badge(p, 256, 110, 'ort', { color: GREEN, size: 34, w: 130 });
  caption(p, 'sustituye a recursive', 256, 170, { color: MUTED, size: 19 });
  const rows = [
    ['bases múltiples', 'fusión de bases', CYAN],
    ['renombres', 'mejor detección', MAGENTA],
    ['rendimiento', 'menos memoria y I/O', AMBER],
  ];
  rows.forEach(([k, v, color], i) => {
    caption(p, k, 130, 240 + i * 70, { color: TEXT, size: 18 });
    badge(p, 340, 240 + i * 70, v, { color, size: 16, w: 190 });
  });
  caption(p, 'mismo resultado, menos trabajo', 256, 460, { color: MUTED, size: 17 });
}

export function comoResolviaRecursiveElProblemaDeLasBasesMultiples(p) {
  baseBg(p);
  treeNode(p, 256, 130, 'bases b1+b2', { color: AMBER, r: 46, size: 16 });
  p.arrow(256, 178, 256, 215, { color: AMBER });
  badge(p, 256, 245, 'merge virtual b1×b2', { color: CYAN, size: 17, w: 250 });
  p.arrow(256, 267, 256, 300, { color: CYAN });
  badge(p, 256, 330, 'usa el resultado como base', { color: GREEN, size: 16, w: 280 });
  caption(p, 'crear una base sintética', 256, 400, { color: TEXT, size: 20 });
  caption(p, 'ort lo hace mejor y más barato', 256, 460, { color: MUTED, size: 17 });
}

export function queDiferenciaHayEntreXOursYSOurs(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: CYAN, label: '-X ours' });
  caption(p, 'solo regionas', 150, 185, { color: MUTED, size: 16 });
  caption(p, 'empatadas:', 150, 215, { color: MUTED, size: 16 });
  caption(p, 'gana lo tuyo', 150, 245, { color: TEXT, size: 19 });
  caption(p, 'el resto se', 150, 285, { color: MUTED, size: 16 });
  caption(p, 'fusiona normal', 150, 315, { color: MUTED, size: 16 });
  box(p, 267, 120, 190, 220, { color: MAGENTA, label: '-s ours' });
  caption(p, 'ignora TODO', 362, 185, { color: TEXT, size: 19 });
  caption(p, 'el otro lado:', 362, 225, { color: TEXT, size: 19 });
  caption(p, 'solo conecta', 362, 265, { color: MUTED, size: 16 });
  caption(p, 'la historia', 362, 295, { color: MUTED, size: 16 });
  caption(p, 'estrategia ≠ opción de estrategia', 256, 410, { color: TEXT, size: 18 });
  caption(p, 'cambio de letra, cambio de mundo', 256, 460, { color: MUTED, size: 16 });
}

export function queEsRerereYCuandoAyuda(p) {
  baseBg(p);
  badge(p, 256, 110, 'reuse recorded resolution', { color: CYAN, size: 19, w: 340 });
  stackFrame(p, 90, 180, 332, 44, 'conflicto visto en rebase', { color: MAGENTA, size: 17 });
  p.arrow(256, 226, 256, 265, { color: GREEN });
  stackFrame(p, 90, 270, 332, 44, 'misma resolución repetida', { color: GREEN, size: 17 });
  badge(p, 256, 390, 'merge tras rebase: se auto-resuelve', { color: GREEN, size: 17, w: 330 });
  caption(p, 'rerere.enabled = true', 256, 460, { color: MUTED, size: 18 });
}

export function queControlaGitattributesSobreLosMerges(p) {
  baseBg(p);
  box(p, 70, 110, 372, 110, { color: CYAN, label: '.gitattributes' });
  caption(p, '*.lock merge=nosuchdriver', 256, 190, { color: TEXT, size: 18 });
  caption(p, 'ours · union · custom driver', 256, 240, { color: MUTED, size: 17 });
  badge(p, 256, 320, 'decide por ruta y por extensión', { color: AMBER, size: 17, w: 310 });
  caption(p, 'plock.lock nunca entra en merge', 256, 390, { color: TEXT, size: 17 });
  caption(p, 'viaja con el repo, sin config local', 256, 460, { color: MUTED, size: 17 });
}

export function comoSeReducenLosConflictosEnOrigen(p) {
  baseBg(p);
  const rows = [
    ['series cortas de commits', CYAN],
    ['tocar menos archivos por PR', GREEN],
    ['squash para integrar', AMBER],
    ['auto-merge tras push del destino', MAGENTA],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 130 + i * 80, label, { color, size: 17, w: 320 });
  });
  caption(p, 'el conflicto se evita antes del merge', 256, 470, { color: MUTED, size: 17 });
}
