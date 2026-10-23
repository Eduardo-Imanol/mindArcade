// scripts/p5-art/sketches/algoritmos-ordenacion.mjs — secciones 6-8: ordenación, quickselect y cotas.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, stackFrame, treeNode, varChip } from '../primitives.mjs';

function row(p, y, labels, { x = 60, w = 46, gap = 7, colors = null } = {}) {
  labels.forEach((label, i) => {
    box(p, x + i * (w + gap), y, w, 44, { color: colors?.[i] ?? CYAN, size: 17 });
    caption(p, label, x + i * (w + gap) + w / 2, y + 23, { color: TEXT, size: 17 });
  });
}

export function queSignificaQueUnaOrdenacionSeaEstable(p) {
  baseBg(p);
  varChip(p, 130, 180, 'A·1', { w: 80, color: MAGENTA });
  varChip(p, 230, 180, 'B·2', { w: 80, color: CYAN });
  varChip(p, 330, 180, 'A·3', { w: 80, color: MAGENTA });
  p.arrow(256, 230, 256, 285, { color: GREEN });
  varChip(p, 130, 320, 'A·1', { w: 80, color: MAGENTA });
  varChip(p, 230, 320, 'A·3', { w: 80, color: MAGENTA });
  varChip(p, 330, 320, 'B·2', { w: 80, color: CYAN });
  caption(p, 'las A conservan su orden', 256, 415, { color: TEXT, size: 21 });
}

export function comoSeOrdenaPorVariosCriteriosConUnSoloAlgoritmoEst(p) {
  baseBg(p);
  box(p, 60, 150, 160, 110, { color: CYAN, label: 'clave compuesta' });
  caption(p, 'depto, luego nombre', 140, 250, { color: TEXT, size: 18 });
  p.arrow(230, 205, 285, 205, { color: GREEN });
  box(p, 295, 150, 160, 110, { color: GREEN, label: 'orden estable' });
  caption(p, 'resultado correcto', 375, 250, { color: TEXT, size: 19 });
  caption(p, 'un solo paso', 256, 340, { color: MUTED, size: 21 });
}

export function comoSePuedeVolverEstableUnAlgoritmoInestable(p) {
  baseBg(p);
  row(p, 170, ['3·a', '1·b', '3·c', '2·d'], { x: 80, w: 68, colors: [MAGENTA, CYAN, MAGENTA, CYAN] });
  p.arrow(256, 230, 256, 280, { color: GREEN });
  badge(p, 256, 310, 'añadir índice', { color: GREEN, size: 23, w: 190 });
  caption(p, 'la clave pasa a ser (valor, índice)', 256, 395, { color: TEXT, size: 19 });
}

export function queEsUnaInversionEnUnArreglo(p) {
  baseBg(p);
  row(p, 180, ['3', '1', '2', '5'], { x: 90, w: 64, colors: [AMBER, CYAN, CYAN, MUTED] });
  p.arrow(130, 240, 235, 240, { color: MAGENTA, dashed: true });
  caption(p, 'i < j pero a[i] > a[j]', 256, 300, { color: TEXT, size: 22 });
  badge(p, 256, 365, '2 inversiones', { color: AMBER, size: 23, w: 190 });
  caption(p, 'miden el desorden', 256, 425, { color: MUTED, size: 19 });
}

export function queDemuestraLaCotaNLogNDeLaOrdenacionPorComparaci(p) {
  baseBg(p);
  treeNode(p, 256, 110, '?', { color: CYAN });
  treeNode(p, 160, 200, '≤', { color: MAGENTA });
  treeNode(p, 352, 200, '>', { color: MAGENTA });
  p.line(256, 110, 160, 200, { color: MUTED });
  p.line(256, 110, 352, 200, { color: MUTED });
  caption(p, 'n! hojas posibles', 256, 285, { color: TEXT, size: 22 });
  badge(p, 256, 345, 'Ω(n log n)', { color: GREEN, size: 24, w: 170 });
  caption(p, 'altura mínima del árbol', 256, 415, { color: MUTED, size: 20 });
}

export function comoSeDemuestraLaCotaNLogN(p) {
  baseBg(p);
  badge(p, 256, 140, 'n! permutaciones', { color: CYAN, size: 24, w: 240 });
  p.arrow(256, 180, 256, 230, { color: MUTED });
  badge(p, 256, 260, 'altura ≥ log₂(n!)', { color: MAGENTA, size: 23, w: 250 });
  p.arrow(256, 300, 256, 345, { color: GREEN });
  badge(p, 256, 375, 'Ω(n log n)', { color: GREEN, size: 26, w: 180 });
  caption(p, 'Stirling cierra la cuenta', 256, 445, { color: MUTED, size: 19 });
}

export function queAlgoritmoLograElMinimoDeComparacionesParaN5(p) {
  baseBg(p);
  [1, 2, 3, 4, 5].forEach((v, i) => varChip(p, 110 + i * 66, 180, String(v), { w: 54, color: i === 2 ? GREEN : CYAN }));
  p.arrow(256, 225, 256, 275, { color: GREEN });
  badge(p, 256, 305, '7 comparaciones', { color: GREEN, size: 24, w: 230 });
  caption(p, 'Ford-Johnson / merge-insertion', 256, 390, { color: TEXT, size: 19 });
  caption(p, 'mínimo teórico para n = 5', 256, 440, { color: MUTED, size: 18 });
}

export function queHaceBubbleSortEnCadaPasada(p) {
  baseBg(p);
  row(p, 170, ['3', '1', '4', '2'], { x: 90, w: 64, colors: [AMBER, CYAN, CYAN, CYAN] });
  p.arrow(190, 225, 360, 225, { color: GREEN });
  caption(p, 'el máximo sube al final', 256, 275, { color: TEXT, size: 21 });
  row(p, 320, ['1', '3', '2', '4'], { x: 90, w: 64, colors: [MUTED, CYAN, CYAN, GREEN] });
  caption(p, 'cada pasada fija uno', 256, 410, { color: MUTED, size: 20 });
}

export function porQueBubbleSortEsLentoConTortugas(p) {
  baseBg(p);
  row(p, 170, ['2', '3', '4', '5', '1'], { x: 60, w: 66, colors: [CYAN, CYAN, CYAN, CYAN, AMBER] });
  p.arrow(410, 225, 130, 285, { color: AMBER, dashed: true });
  caption(p, 'la tortuga avanza un paso', 256, 315, { color: TEXT, size: 21 });
  badge(p, 256, 375, 'O(n²)', { color: AMBER, size: 25, w: 130 });
  caption(p, 'una pasada no basta', 256, 435, { color: MUTED, size: 19 });
}

export function queVentajaTieneInsertionSortConPocasInversiones(p) {
  baseBg(p);
  row(p, 170, ['1', '2', '3', '5', '4', '6'], { x: 60, w: 60, colors: [MUTED, MUTED, MUTED, CYAN, AMBER, MUTED] });
  p.arrow(310, 225, 370, 285, { color: GREEN });
  badge(p, 256, 315, '1 inversión', { color: GREEN, size: 22, w: 180 });
  caption(p, 'costo O(n + I)', 256, 390, { color: TEXT, size: 24 });
}

export function porQueInsertionSortEsLaBaseDeLosHibridos(p) {
  baseBg(p);
  box(p, 55, 170, 120, 90, { color: CYAN, label: 'bloque' });
  box(p, 195, 170, 120, 90, { color: CYAN, label: 'bloque' });
  box(p, 335, 170, 120, 90, { color: CYAN, label: 'bloque' });
  p.arrow(256, 270, 256, 310, { color: GREEN });
  badge(p, 256, 340, 'ordenar y fusionar', { color: GREEN, size: 21, w: 230 });
  caption(p, 'bloques pequeños', 256, 415, { color: MUTED, size: 20 });
}

export function queHaceLaInsercionBinariaYQueNoMejora(p) {
  baseBg(p);
  badge(p, 256, 150, 'busca posición', { color: CYAN, size: 22, w: 210 });
  caption(p, 'log i comparaciones', 256, 200, { color: TEXT, size: 20 });
  p.arrow(256, 230, 256, 280, { color: AMBER });
  badge(p, 256, 310, 'desplazar cuesta i', { color: AMBER, size: 22, w: 230 });
  caption(p, 'sigue O(n²) por los movimientos', 256, 400, { color: MUTED, size: 19 });
}

export function queSignificaQueUnArregloEsteHOrdenado(p) {
  baseBg(p);
  for (let k = 0; k < 3; k += 1) {
    dotLine(p, k);
  }
  caption(p, 'a[i] ≤ a[i + h]', 256, 280, { color: TEXT, size: 24 });
  badge(p, 256, 345, 'h-ordenado', { color: GREEN, size: 23, w: 180 });
  caption(p, 'cada subsecuencia está ordenada', 256, 420, { color: MUTED, size: 18 });
}

function dotLine(p, k) {
  for (let i = 0; i < 6; i += 1) {
    const x = 100 + i * 58;
    p.push();
    p.noStroke();
    p.fill(k === 0 ? CYAN : k === 1 ? MAGENTA : GREEN);
    p.circle(x, 150 + k * 36, 14);
    p.pop();
    if (i < 5) p.line(x + 8, 150 + k * 36, x + 50, 150 + k * 36, { color: MUTED, weight: 1.5 });
  }
}

export function queComplejidadTieneShellSortConLaSecuenciaDeCiura(p) {
  baseBg(p);
  [1, 4, 10, 23, 57].forEach((v, i) => varChip(p, 80 + i * 96, 180, String(v), { w: 76, color: i === 4 ? GREEN : CYAN }));
  p.arrow(256, 225, 256, 275, { color: MUTED });
  badge(p, 256, 305, '×2.25', { color: GREEN, size: 24, w: 140 });
  caption(p, 'empírico n^1.2 a n^1.3', 256, 385, { color: TEXT, size: 21 });
  caption(p, 'in-place e inestable', 256, 435, { color: MUTED, size: 19 });
}

export function queVirtudTieneSelectionSort(p) {
  baseBg(p);
  row(p, 180, ['3', '1', '4', '2'], { x: 90, w: 66, colors: [MUTED, MUTED, MUTED, MUTED] });
  badge(p, 256, 280, 'n − 1 intercambios', { color: GREEN, size: 24, w: 250 });
  caption(p, 'mínimo de escrituras', 256, 360, { color: TEXT, size: 22 });
  caption(p, 'útil con escritura costosa', 256, 415, { color: MUTED, size: 19 });
}

export function porQueSelectionSortNoEsAdaptativo(p) {
  baseBg(p);
  box(p, 55, 160, 180, 140, { color: CYAN, label: 'ya ordenado' });
  box(p, 277, 160, 180, 140, { color: AMBER, label: 'invertido' });
  caption(p, 'n(n − 1)/2', 145, 265, { color: TEXT, size: 20 });
  caption(p, 'n(n − 1)/2', 367, 265, { color: TEXT, size: 20 });
  caption(p, 'mismas comparaciones', 256, 360, { color: TEXT, size: 22 });
  badge(p, 256, 420, 'no adaptativo', { color: AMBER, size: 21, w: 190 });
}

export function porQueMergeSortEsElAlgoritmoDeReferencia(p) {
  baseBg(p);
  treeNode(p, 256, 110, 'n', { color: CYAN });
  treeNode(p, 150, 200, 'n/2', { color: MAGENTA });
  treeNode(p, 362, 200, 'n/2', { color: MAGENTA });
  p.line(256, 110, 150, 200, { color: MUTED });
  p.line(256, 110, 362, 200, { color: MUTED });
  badge(p, 256, 290, 'Θ(n log n)', { color: GREEN, size: 26, w: 190 });
  caption(p, 'estable y predecible', 256, 370, { color: TEXT, size: 22 });
  caption(p, 'necesita O(n) memoria', 256, 420, { color: MUTED, size: 19 });
}

export function cuandoSePuedeOmitirLaFusionEnMergeSort(p) {
  baseBg(p);
  box(p, 60, 170, 180, 80, { color: CYAN, label: 'izquierda', size: 18 });
  caption(p, '≤ derecha', 150, 232, { color: TEXT, size: 17 });
  p.arrow(248, 210, 288, 210, { color: GREEN });
  badge(p, 370, 210, 'omitir', { color: GREEN, size: 22, w: 120 });
  caption(p, 'el arreglo ya está en orden', 256, 310, { color: TEXT, size: 22 });
  caption(p, 'ahorra la fusión', 256, 365, { color: MUTED, size: 20 });
}

export function comoSeCuentanInversionesConMergeSort(p) {
  baseBg(p);
  row(p, 155, ['1', '3', '5'], { x: 100, w: 58, colors: [CYAN, CYAN, CYAN] });
  row(p, 155, ['2', '4', '6'], { x: 300, w: 58, colors: [MAGENTA, MAGENTA, MAGENTA] });
  p.arrow(260, 200, 260, 280, { color: GREEN });
  caption(p, 'cada elemento derecho menor', 256, 310, { color: TEXT, size: 20 });
  badge(p, 256, 370, 'suma al fusionar', { color: CYAN, size: 22, w: 210 });
  caption(p, 'total en O(n log n)', 256, 430, { color: MUTED, size: 19 });
}

export function queVentajaTieneNaturalMergeSort(p) {
  baseBg(p);
  [70, 140, 55, 95].forEach((w, i) => {
    box(p, 60 + i * 100, 180, w, 60, { color: i % 2 === 0 ? CYAN : MAGENTA });
    caption(p, 'run', 60 + i * 100 + w / 2, 212, { color: TEXT, size: 18 });
  });
  caption(p, 'detecta tramos ya ordenados', 256, 290, { color: TEXT, size: 21 });
  badge(p, 256, 355, 'menos fusiones', { color: GREEN, size: 22, w: 200 });
  caption(p, 'aprovecha la entrada', 256, 420, { color: MUTED, size: 20 });
}

export function cualEsElPeorCasoDeQuicksort(p) {
  baseBg(p);
  treeNode(p, 256, 100, '1', { color: AMBER, size: 18 });
  treeNode(p, 256, 180, '2', { color: AMBER, size: 18 });
  treeNode(p, 256, 260, '3', { color: AMBER, size: 18 });
  treeNode(p, 256, 340, '4', { color: AMBER, size: 18 });
  p.line(256, 100, 256, 180, { color: MUTED });
  p.line(256, 180, 256, 260, { color: MUTED });
  p.line(256, 260, 256, 340, { color: MUTED });
  caption(p, 'pivote mínimo siempre', 60, 405, { color: TEXT, size: 16, align: 'start' });
  badge(p, 380, 405, 'O(n²)', { color: AMBER, size: 25, w: 120 });
}

export function comoParticionaLomutoYCuandoEsUtil(p) {
  baseBg(p);
  row(p, 180, ['3', '1', '4', '2'], { x: 90, w: 66, colors: [MAGENTA, CYAN, CYAN, CYAN] });
  p.arrow(110, 245, 390, 245, { color: GREEN });
  caption(p, 'un puntero avanza', 256, 290, { color: TEXT, size: 21 });
  badge(p, 256, 350, 'muchos swaps', { color: AMBER, size: 22, w: 180 });
  caption(p, 'simple y didáctico', 256, 415, { color: MUTED, size: 20 });
}

export function queVentajaTieneElEsquemaDeHoare(p) {
  baseBg(p);
  varChip(p, 110, 190, 'i →', { w: 90, color: CYAN });
  varChip(p, 402, 190, '← j', { w: 90, color: MAGENTA });
  p.arrow(260, 190, 250, 190, { color: MUTED });
  caption(p, 'ambos avanzan hacia el centro', 256, 285, { color: TEXT, size: 21 });
  badge(p, 256, 350, '≈ 3× menos swaps', { color: GREEN, size: 22, w: 220 });
  caption(p, 'más rápido en la práctica', 256, 420, { color: MUTED, size: 20 });
}

export function comoManejaQuicksortLasClavesDuplicadas(p) {
  baseBg(p);
  box(p, 50, 190, 120, 60, { color: MAGENTA, label: '<' });
  box(p, 186, 190, 140, 60, { color: GREEN, label: '=' });
  box(p, 342, 190, 120, 60, { color: AMBER, label: '>' });
  caption(p, 'partición de tres vías', 256, 290, { color: TEXT, size: 23 });
  badge(p, 256, 355, 'O(n) con iguales', { color: GREEN, size: 22, w: 210 });
  caption(p, 'evita el peor caso', 256, 420, { color: MUTED, size: 20 });
}

export function comoSeEligeUnPivoteConMedianaDeTres(p) {
  baseBg(p);
  varChip(p, 130, 190, 'a', { w: 80, color: MUTED });
  varChip(p, 256, 190, 'b', { w: 80, color: GREEN });
  varChip(p, 382, 190, 'c', { w: 80, color: MUTED });
  p.arrow(300, 230, 270, 275, { color: GREEN });
  badge(p, 256, 305, 'mediana', { color: GREEN, size: 23, w: 160 });
  caption(p, 'mejor pivote esperado', 256, 385, { color: TEXT, size: 22 });
  caption(p, 'sigue siendo vulnerable', 256, 435, { color: AMBER, size: 19 });
}

export function queEsElAsesinoDeMcIlroy(p) {
  baseBg(p);
  [3, 2, 5, 1, 4].forEach((v, i) => varChip(p, 80 + i * 84, 180, String(v), { w: 70, color: i === 2 ? AMBER : CYAN }));
  p.arrow(430, 220, 80, 280, { color: MAGENTA, dashed: true });
  caption(p, 'secuencia adversaria', 256, 310, { color: TEXT, size: 23 });
  badge(p, 256, 370, 'fuerza Θ(n²)', { color: AMBER, size: 23, w: 190 });
  caption(p, 'contra una implementación concreta', 256, 430, { color: MUTED, size: 18 });
}

export function porQueSeAcotaLaPilaDeRecursionEnQuicksort(p) {
  baseBg(p);
  stackFrame(p, 90, 150, 150, 50, 'grande', { color: AMBER });
  stackFrame(p, 90, 210, 150, 50, 'pequeña', { color: GREEN });
  p.arrow(260, 235, 320, 235, { color: GREEN });
  stackFrame(p, 330, 210, 150, 50, 'tail', { color: CYAN });
  caption(p, 'recursión en la mitad menor', 256, 320, { color: TEXT, size: 19 });
  badge(p, 256, 380, 'profundidad log n', { color: GREEN, size: 21, w: 210 });
}

export function porQueConstruirUnHeapEsOn(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  for (let level = 0; level < 4; level += 1) {
    const count = 2 ** level;
    p.fill(level === 0 ? GREEN : CYAN);
    for (let i = 0; i < count; i += 1) {
      const x = 256 + (i - (count - 1) / 2) * (110 / count);
      p.circle(x, 130 + level * 55, 16);
    }
  }
  p.pop();
  caption(p, 'Σ n / 2ʰ converge', 256, 350, { color: TEXT, size: 23 });
  badge(p, 256, 405, 'O(n)', { color: GREEN, size: 26, w: 120 });
}

export function comoFuncionaHeapSortYPorQueNoEsEstable(p) {
  baseBg(p);
  treeNode(p, 256, 110, 'max', { color: GREEN, size: 18 });
  treeNode(p, 170, 200, '9', { color: CYAN, size: 18 });
  treeNode(p, 342, 200, '7', { color: CYAN, size: 18 });
  p.line(256, 110, 170, 200, { color: MUTED });
  p.line(256, 110, 342, 200, { color: MUTED });
  p.arrow(342, 230, 430, 290, { color: AMBER });
  caption(p, 'extrae el máximo', 256, 310, { color: TEXT, size: 21 });
  caption(p, 'los iguales cambian de orden', 256, 375, { color: AMBER, size: 19 });
  badge(p, 256, 430, 'inestable', { color: AMBER, size: 20, w: 160 });
}

export function queMejoraElHeapsortBottomUpDeFloyd(p) {
  baseBg(p);
  treeNode(p, 256, 110, 'max', { color: CYAN, size: 18 });
  treeNode(p, 170, 200, '9', { color: GREEN, size: 18 });
  treeNode(p, 342, 200, '7', { color: MUTED, size: 18 });
  p.line(256, 110, 170, 200, { color: MUTED });
  p.line(256, 110, 342, 200, { color: MUTED });
  p.arrow(170, 235, 170, 285, { color: GREEN });
  caption(p, 'baja sin comparar dos veces', 256, 315, { color: TEXT, size: 21 });
  badge(p, 256, 375, 'menos comparaciones', { color: GREEN, size: 21, w: 240 });
  caption(p, 'mismo O(n log n)', 256, 440, { color: MUTED, size: 19 });
}

export function queCombinaIntrosort(p) {
  baseBg(p);
  box(p, 55, 180, 120, 100, { color: CYAN, label: 'quicksort' });
  box(p, 196, 180, 120, 100, { color: AMBER, label: 'heap' });
  box(p, 337, 180, 120, 100, { color: GREEN, label: 'inserción' });
  p.arrow(256, 290, 256, 330, { color: MUTED });
  caption(p, 'profundidad límite → heap', 256, 360, { color: TEXT, size: 19 });
  caption(p, 'bloques pequeños → inserción', 256, 415, { color: MUTED, size: 18 });
}

export function queAnadePdqsortSobreIntrosort(p) {
  baseBg(p);
  badge(p, 256, 160, 'detecta patrones', { color: CYAN, size: 22, w: 230 });
  p.arrow(256, 200, 256, 250, { color: GREEN });
  badge(p, 256, 280, 'partición branchless', { color: GREEN, size: 21, w: 250 });
  caption(p, 'ordenaciones parciales y duplicados', 256, 375, { color: TEXT, size: 18 });
  caption(p, 'menos ramas mal predichas', 256, 430, { color: MUTED, size: 19 });
}

export function queSonLosRunsEnTimsort(p) {
  baseBg(p);
  box(p, 60, 180, 140, 60, { color: GREEN, label: 'ascendente' });
  box(p, 210, 180, 110, 60, { color: AMBER, label: 'desc.' });
  box(p, 330, 180, 125, 60, { color: GREEN, label: 'ascendente' });
  p.arrow(256, 260, 256, 300, { color: CYAN });
  caption(p, 'tramos naturales de la entrada', 256, 340, { color: TEXT, size: 20 });
  badge(p, 256, 400, 'se fusionan', { color: CYAN, size: 21, w: 160 });
}

export function comoSeEligeElMinrunEnTimsort(p) {
  baseBg(p);
  badge(p, 256, 160, '32 ≤ minrun ≤ 64', { color: CYAN, size: 23, w: 250 });
  p.arrow(256, 200, 256, 250, { color: GREEN });
  box(p, 70, 270, 170, 80, { color: GREEN, label: 'bloques' });
  box(p, 272, 270, 170, 80, { color: GREEN, label: 'inserción' });
  caption(p, 'runs cortos se extienden', 256, 400, { color: TEXT, size: 20 });
}

export function queEsElModoGallopingDeTimsort(p) {
  baseBg(p);
  [1, 2, 4, 8, 16].forEach((v, i) => {
    varChip(p, 80 + i * 88, 190, String(v), { w: 62, color: i === 4 ? GREEN : CYAN });
  });
  caption(p, 'búsqueda exponencial dentro del run', 256, 290, { color: TEXT, size: 20 });
  badge(p, 256, 350, 'salta bloques', { color: GREEN, size: 22, w: 180 });
  caption(p, 'acelera fusiones desiguales', 256, 420, { color: MUTED, size: 19 });
}

export function queAportaPowersortFrenteATimsort(p) {
  baseBg(p);
  [90, 70, 120, 60].forEach((w, i) => {
    box(p, 70 + i * 96, 190, w, 52, { color: i % 2 === 0 ? CYAN : MAGENTA });
    caption(p, 'run', 70 + i * 96 + w / 2, 220, { color: TEXT, size: 17 });
  });
  p.arrow(150, 260, 150, 300, { color: GREEN });
  p.arrow(340, 260, 340, 300, { color: GREEN });
  caption(p, 'árbol de fusiones equilibrado', 256, 330, { color: TEXT, size: 20 });
  badge(p, 256, 390, 'más rápido', { color: GREEN, size: 22, w: 160 });
  caption(p, 'menos comparaciones', 256, 445, { color: MUTED, size: 18 });
}
