// scripts/p5-art/sketches/algoritmos-busqueda.mjs — sección 5: búsqueda lineal, binaria y variantes.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, treeNode, varChip } from '../primitives.mjs';

function cells(p, y, states, { x = 60, w = 48, gap = 6 } = {}) {
  states.forEach((state, i) => {
    const color = state === 'hit' ? GREEN : state === 'mark' ? AMBER : CYAN;
    box(p, x + i * (w + gap), y, w, 46, { color, dashed: state === 'empty' });
  });
}

export function cualEsLaCotaInferiorDeLaBusquedaEnUnArregloSinOr(p) {
  baseBg(p);
  cells(p, 190, ['empty', 'empty', 'hit', 'empty', 'empty', 'empty'], { x: 90 });
  p.arrow(258, 160, 258, 182, { color: AMBER });
  badge(p, 256, 300, 'Ω(n)', { color: AMBER, size: 30, w: 120 });
  caption(p, 'el adversario oculta el objetivo', 256, 380, { color: TEXT, size: 20 });
  caption(p, 'la búsqueda lineal es óptima', 256, 425, { color: MUTED, size: 19 });
}

export function porQueLaBusquedaBinariaEsOptimaEnElModeloDeCompar(p) {
  baseBg(p);
  treeNode(p, 256, 110, '?', { color: CYAN });
  treeNode(p, 160, 200, '≤', { color: MAGENTA });
  treeNode(p, 352, 200, '>', { color: MAGENTA });
  treeNode(p, 110, 290, '', { color: MUTED, empty: true });
  treeNode(p, 210, 290, '', { color: MUTED, empty: true });
  treeNode(p, 302, 290, '', { color: MUTED, empty: true });
  treeNode(p, 402, 290, '', { color: MUTED, empty: true });
  p.line(256, 110, 160, 200, { color: MUTED });
  p.line(256, 110, 352, 200, { color: MUTED });
  caption(p, 'n + 1 respuestas posibles', 256, 365, { color: TEXT, size: 21 });
  badge(p, 256, 425, 'Ω(log n)', { color: GREEN, size: 24, w: 150 });
}

export function queVentajaTieneElCentinelaEnLaBusquedaLineal(p) {
  baseBg(p);
  cells(p, 190, ['empty', 'empty', 'empty', 'empty', 'mark'], { x: 70 });
  p.arrow(330, 160, 330, 182, { color: AMBER });
  caption(p, 'objetivo al final', 330, 140, { color: TEXT, size: 19 });
  badge(p, 256, 300, '1 comparación', { color: GREEN, size: 23, w: 220 });
  caption(p, 'se elimina el chequeo de límite', 256, 390, { color: MUTED, size: 19 });
}

export function cuandoGanaLaBusquedaLinealALaBinaria(p) {
  baseBg(p);
  box(p, 55, 160, 180, 140, { color: GREEN, label: 'lineal' });
  caption(p, 'SIMD y caché', 145, 255, { color: TEXT, size: 20 });
  box(p, 277, 160, 180, 140, { color: CYAN, label: 'binaria' });
  caption(p, 'saltos largos', 367, 255, { color: TEXT, size: 20 });
  badge(p, 256, 355, '16 a 64 elementos', { color: AMBER, size: 22, w: 240 });
}

export function queEsUnaListaAutoOrganizadaMoveToFront(p) {
  baseBg(p);
  varChip(p, 110, 180, 'A', { w: 70, color: MUTED });
  varChip(p, 200, 180, 'B', { w: 70, color: MUTED });
  varChip(p, 290, 180, 'C', { w: 70, color: MUTED });
  varChip(p, 380, 180, 'D', { w: 70, color: GREEN });
  p.arrow(380, 220, 110, 260, { color: GREEN, dashed: true });
  caption(p, 'D se mueve al frente', 256, 310, { color: TEXT, size: 23 });
  badge(p, 256, 375, '2-competitiva', { color: CYAN, size: 22, w: 190 });
}

export function cualEsElErrorClasicoAlCalcularElPuntoMedio(p) {
  baseBg(p);
  varChip(p, 90, 180, 'lo', { w: 70, color: MAGENTA });
  varChip(p, 422, 180, 'hi', { w: 70, color: MAGENTA });
  badge(p, 256, 260, '(lo + hi) / 2', { color: AMBER, size: 25, w: 250 });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(170, 290, 342, 290);
  p.pop();
  caption(p, 'desborda', 256, 325, { color: MAGENTA, size: 21 });
  badge(p, 256, 390, 'lo + (hi − lo) / 2', { color: GREEN, size: 22, w: 280 });
}

export function queDefineLowerBoundDeX(p) {
  baseBg(p);
  cells(p, 190, ['empty', 'empty', 'mark', 'hit', 'empty', 'empty'], { x: 70 });
  p.arrow(190, 160, 190, 182, { color: AMBER });
  caption(p, 'primer a[i] ≥ x', 256, 300, { color: TEXT, size: 24 });
  caption(p, 'posición antes de los iguales', 256, 355, { color: MUTED, size: 20 });
  badge(p, 256, 415, 'lower_bound', { color: CYAN, size: 22, w: 210 });
}

export function queDefineUpperBoundDeX(p) {
  baseBg(p);
  cells(p, 190, ['empty', 'empty', 'hit', 'hit', 'mark', 'empty'], { x: 70 });
  p.arrow(310, 160, 310, 182, { color: AMBER });
  caption(p, 'primer a[i] > x', 256, 300, { color: TEXT, size: 24 });
  caption(p, 'posición después de los iguales', 256, 355, { color: MUTED, size: 20 });
  badge(p, 256, 415, 'upper_bound', { color: CYAN, size: 22, w: 210 });
}

export function comoSeObtieneElNumeroDeCopiasDeX(p) {
  baseBg(p);
  cells(p, 175, ['empty', 'hit', 'hit', 'hit', 'empty', 'empty'], { x: 70 });
  p.push();
  p.stroke(GREEN);
  p.strokeWeight(3);
  p.line(130, 240, 280, 240);
  p.pop();
  caption(p, 'tres copias', 205, 265, { color: GREEN, size: 21 });
  badge(p, 256, 330, 'upper − lower', { color: CYAN, size: 24, w: 220 });
  caption(p, 'en O(log n)', 256, 405, { color: MUTED, size: 21 });
}

export function queGeneralizanLowerBoundYUpperBound(p) {
  baseBg(p);
  for (let i = 0; i < 8; i += 1) {
    const on = i >= 5;
    box(p, 60 + i * 51, 200, 44, 44, { color: on ? GREEN : MUTED });
    caption(p, on ? '1' : '0', 82 + i * 51, 222, { color: on ? GREEN : MUTED, size: 18 });
  }
  p.arrow(220, 170, 220, 192, { color: AMBER });
  caption(p, 'falso hasta el primer verdadero', 256, 295, { color: TEXT, size: 20 });
  badge(p, 256, 355, 'partitionPoint', { color: CYAN, size: 23, w: 210 });
}

export function queCondicionDebeCumplirUnProblemaParaResolversePorB(p) {
  baseBg(p);
  box(p, 60, 170, 180, 120, { color: CYAN, label: 'factible(v)' });
  caption(p, 'monótona', 150, 260, { color: TEXT, size: 21 });
  p.arrow(248, 230, 288, 230, { color: GREEN });
  badge(p, 360, 230, 'O(f · log R)', { color: GREEN, size: 21, w: 160 });
  caption(p, 'decidir en O(f)', 256, 340, { color: MUTED, size: 21 });
  caption(p, 'buscar el mínimo o máximo v', 256, 400, { color: TEXT, size: 21 });
}

export function porQueNoSeComparaConEpsilonAlBisecarSobreReales(p) {
  baseBg(p);
  p.line(70, 230, 442, 230, { color: MUTED, weight: 3 });
  p.push();
  p.noStroke();
  p.fill(MUTED);
  for (let i = 0; i < 7; i += 1) p.circle(85 + i * 58, 230, 10);
  p.pop();
  badge(p, 256, 150, 'iteraciones fijas', { color: GREEN, size: 23, w: 240 });
  caption(p, '60 a 100 pasos', 256, 320, { color: TEXT, size: 24 });
  caption(p, 'el bucle con epsilon puede no terminar', 256, 390, { color: AMBER, size: 19 });
}

export function comoFuncionaLaVersionBranchlessDeLowerBound(p) {
  baseBg(p);
  box(p, 60, 160, 170, 130, { color: AMBER, label: 'con rama' });
  caption(p, 'predicción 50 %', 145, 265, { color: TEXT, size: 19 });
  box(p, 282, 160, 170, 130, { color: GREEN, label: 'sin rama' });
  caption(p, 'selección cmov', 367, 265, { color: TEXT, size: 19 });
  caption(p, 'cuerpo de longitud constante', 256, 360, { color: MUTED, size: 21 });
  badge(p, 256, 420, 'sin saltos', { color: GREEN, size: 21, w: 150 });
}

export function queVentajaOfreceLaDistribucionEytzinger(p) {
  baseBg(p);
  [1, 2, 3, 4, 5, 6, 7].forEach((v, i) => {
    box(p, 60 + i * 54, 190, 44, 44, { color: i < 3 ? CYAN : MUTED, size: 18 });
    caption(p, String(v), 82 + i * 54, 212, { color: TEXT, size: 18 });
  });
  caption(p, 'orden por niveles del árbol', 256, 280, { color: TEXT, size: 22 });
  badge(p, 256, 340, 'nodos calientes juntos', { color: GREEN, size: 21, w: 250 });
  caption(p, 'menos fallos de caché', 256, 410, { color: MUTED, size: 20 });
}

export function queComplejidadEsperadaTieneLaBusquedaPorInterpolacion(p) {
  baseBg(p);
  p.line(70, 260, 442, 260, { color: MUTED, weight: 3 });
  varChip(p, 100, 260, 'lo', { w: 70, color: MAGENTA });
  varChip(p, 412, 260, 'hi', { w: 70, color: MAGENTA });
  p.arrow(220, 200, 300, 250, { color: CYAN });
  badge(p, 300, 320, 'estimación', { color: CYAN, size: 21, w: 170 });
  badge(p, 256, 390, 'log log n', { color: GREEN, size: 26, w: 180 });
  caption(p, 'O(n) si la distribución es sesgada', 256, 445, { color: AMBER, size: 18 });
}

export function queComplejidadTieneLaBusquedaExponencialOGalloping(p) {
  baseBg(p);
  [1, 2, 4, 8, 16].forEach((v, i) => {
    varChip(p, 90 + i * 82, 200, String(v), { w: 60, color: i === 4 ? GREEN : CYAN });
  });
  p.arrow(410, 240, 410, 290, { color: GREEN });
  badge(p, 256, 320, 'O(log p)', { color: GREEN, size: 28, w: 160 });
  caption(p, 'p es la posición del objetivo', 256, 400, { color: TEXT, size: 21 });
}

export function cuandoConvieneUsarBusquedaExponencial(p) {
  baseBg(p);
  varChip(p, 130, 170, 'tamaño ?', { w: 130, color: CYAN });
  varChip(p, 360, 170, 'cerca', { w: 110, color: CYAN });
  varChip(p, 245, 280, 'm ≪ n', { w: 120, color: MAGENTA });
  caption(p, 'o fusionar listas desiguales', 256, 370, { color: TEXT, size: 21 });
  badge(p, 256, 425, 'galloping', { color: GREEN, size: 21, w: 160 });
}

export function porQueLaBusquedaTernariaNoMejoraALaBinariaEnArreg(p) {
  baseBg(p);
  box(p, 60, 180, 110, 60, { color: MUTED });
  box(p, 180, 180, 110, 60, { color: MUTED });
  box(p, 300, 180, 110, 60, { color: MUTED });
  caption(p, '2 comparaciones por paso', 256, 290, { color: TEXT, size: 22 });
  badge(p, 256, 350, '1.26 log₂ n', { color: AMBER, size: 24, w: 200 });
  caption(p, 'solo para funciones unimodales', 256, 420, { color: MUTED, size: 20 });
}

export function queComplejidadTieneBuscarEnUnaMatrizOrdenadaPorFila(p) {
  baseBg(p);
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      box(p, 120 + c * 56, 140 + r * 52, 46, 42, { color: r === 0 && c === 3 ? GREEN : MUTED, size: 16 });
    }
  }
  p.arrow(330, 152, 180, 340, { color: CYAN, dashed: true });
  badge(p, 256, 390, 'O(m + n)', { color: GREEN, size: 24, w: 170 });
  caption(p, 'desde la esquina superior derecha', 256, 445, { color: MUTED, size: 18 });
}
