// scripts/p5-art/sketches/algoritmos-ingenieria.mjs — secciones 10-13: hardware, elección, errores y referencias.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, varChip } from '../primitives.mjs';

export function queLatenciasAproximadasTienenL1RamYUnSaltoMalPredi(p) {
  baseBg(p);
  box(p, 55, 150, 120, 100, { color: GREEN, label: 'L1' });
  caption(p, '≈ 1 ns', 115, 230, { color: TEXT, size: 18 });
  box(p, 196, 150, 120, 100, { color: CYAN, label: 'RAM' });
  caption(p, '≈ 100 ns', 256, 230, { color: TEXT, size: 18 });
  box(p, 337, 150, 120, 100, { color: AMBER, label: 'branch' });
  caption(p, '≈ 15 ciclos', 397, 230, { color: TEXT, size: 17 });
  caption(p, 'órdenes de magnitud distintos', 256, 330, { color: TEXT, size: 21 });
  badge(p, 256, 390, 'la memoria manda', { color: AMBER, size: 20, w: 220 });
}

export function porQueElPatronDeAccesoImportaMasQueElConteoDeOpe(p) {
  baseBg(p);
  box(p, 60, 170, 180, 130, { color: GREEN, label: 'secuencial' });
  caption(p, 'una línea de caché', 150, 265, { color: TEXT, size: 18 });
  box(p, 277, 170, 180, 130, { color: AMBER, label: 'aleatorio' });
  caption(p, 'un fallo por salto', 367, 265, { color: TEXT, size: 18 });
  caption(p, 'mismo número de operaciones', 256, 365, { color: MUTED, size: 18 });
  badge(p, 256, 425, 'distinto tiempo', { color: CYAN, size: 20, w: 190 });
}

export function queVentajaTienenInt32listYFloat64listEnDart(p) {
  baseBg(p);
  box(p, 55, 170, 180, 130, { color: AMBER, label: 'List dynamic' });
  caption(p, 'valores boxed', 145, 265, { color: TEXT, size: 18 });
  box(p, 277, 170, 180, 130, { color: GREEN, label: 'TypedData' });
  caption(p, 'bits contiguos', 367, 265, { color: TEXT, size: 18 });
  caption(p, 'menos memoria y mejores accesos', 256, 370, { color: TEXT, size: 18 });
  badge(p, 256, 425, 'sin boxing', { color: GREEN, size: 20, w: 170 });
}

export function queCosteTieneOrdenarEnElModeloDeMemoriaExterna(p) {
  baseBg(p);
  box(p, 60, 150, 160, 100, { color: CYAN, label: 'RAM' });
  p.arrow(228, 200, 282, 200, { color: AMBER });
  box(p, 292, 150, 160, 100, { color: AMBER, label: 'disco' });
  badge(p, 256, 295, 'E/S por bloque', { color: AMBER, size: 21, w: 200 });
  caption(p, 'se cuenta mover B elementos', 256, 380, { color: TEXT, size: 20 });
  caption(p, 'no cada comparación', 256, 430, { color: MUTED, size: 19 });
}

export function queEsUnAlgoritmoCacheOblivious(p) {
  baseBg(p);
  box(p, 70, 160, 150, 100, { color: CYAN, label: 'recursivo' });
  p.arrow(228, 210, 282, 210, { color: GREEN });
  box(p, 292, 160, 150, 100, { color: GREEN, label: 'óptimo' });
  caption(p, 'sin conocer tamaños de caché', 256, 300, { color: TEXT, size: 20 });
  badge(p, 256, 360, 'funnel sort', { color: GREEN, size: 21, w: 170 });
  caption(p, 'funciona en toda la jerarquía', 256, 430, { color: MUTED, size: 19 });
}

export function queSeDescartaAntesDeMedirUnBenchmarkEnDart(p) {
  baseBg(p);
  box(p, 55, 160, 120, 110, { color: MAGENTA, label: 'warm-up' });
  box(p, 190, 160, 130, 110, { color: AMBER, label: 'GC' });
  box(p, 335, 160, 120, 110, { color: CYAN, label: 'no usado' });
  caption(p, 'JIT y recolección contaminan', 256, 320, { color: TEXT, size: 20 });
  badge(p, 256, 380, 'medir estable', { color: GREEN, size: 21, w: 180 });
}

export function queDistribucionesDeDatosHayQueProbarEnUnBenchmark(p) {
  baseBg(p);
  varChip(p, 120, 165, 'ordenado', { w: 130, color: GREEN });
  varChip(p, 330, 165, 'inverso', { w: 120, color: AMBER });
  varChip(p, 120, 255, 'aleatorio', { w: 130, color: CYAN });
  varChip(p, 330, 255, 'duplicados', { w: 140, color: MAGENTA });
  caption(p, 'casi ordenado y adversario también', 256, 350, { color: TEXT, size: 18 });
  badge(p, 256, 410, 'varias entradas', { color: GREEN, size: 20, w: 200 });
}

export function queTresPropiedadesVerificanUnaOrdenacionConPruebasAl(p) {
  baseBg(p);
  box(p, 55, 170, 120, 120, { color: CYAN, label: 'permutación', size: 16 });
  box(p, 190, 170, 130, 120, { color: GREEN, label: 'ordenado', size: 16 });
  box(p, 335, 170, 120, 120, { color: MAGENTA, label: 'estable', size: 16 });
  caption(p, 'mismos elementos, en orden', 256, 330, { color: TEXT, size: 20 });
  caption(p, 'y empates conservados', 256, 385, { color: MUTED, size: 19 });
  badge(p, 256, 440, '3 asserts', { color: GREEN, size: 20, w: 140 });
}

export function queDiferenciaHayEntreAotYJitEnDart(p) {
  baseBg(p);
  box(p, 55, 160, 180, 140, { color: CYAN, label: 'AOT' });
  caption(p, 'compila antes', 145, 255, { color: TEXT, size: 19 });
  caption(p, 'arranque estable', 145, 295, { color: MUTED, size: 18 });
  box(p, 277, 160, 180, 140, { color: GREEN, label: 'JIT' });
  caption(p, 'perfila en caliente', 367, 255, { color: TEXT, size: 19 });
  caption(p, 'warm-up necesario', 367, 295, { color: MUTED, size: 18 });
  caption(p, 'los benchmarks cambian', 256, 380, { color: MUTED, size: 19 });
}

export function queOrdenacionConvieneParaNMenorOIgualA32(p) {
  baseBg(p);
  badge(p, 256, 150, 'n ≤ 32', { color: GREEN, size: 26, w: 150 });
  p.arrow(256, 190, 256, 240, { color: GREEN });
  badge(p, 256, 270, 'insertion sort', { color: GREEN, size: 23, w: 230 });
  caption(p, 'bajo overhead y buena localidad', 256, 365, { color: TEXT, size: 19 });
  caption(p, 'base de los híbridos', 256, 415, { color: MUTED, size: 19 });
}

export function queOrdenacionConvieneParaObjetosConEstabilidad(p) {
  baseBg(p);
  box(p, 70, 170, 150, 100, { color: GREEN, label: 'Timsort' });
  p.arrow(238, 220, 282, 220, { color: MUTED });
  box(p, 292, 170, 150, 100, { color: CYAN, label: 'merge sort' });
  caption(p, 'estable y adaptativo', 256, 315, { color: TEXT, size: 22 });
  badge(p, 256, 375, 'O(n log n)', { color: GREEN, size: 22, w: 170 });
  caption(p, 'memoria auxiliar O(n)', 256, 440, { color: MUTED, size: 19 });
}

export function queOrdenacionConvieneParaPrimitivosSinEstabilidad(p) {
  baseBg(p);
  box(p, 60, 170, 150, 100, { color: CYAN, label: 'pdqsort' });
  box(p, 292, 170, 150, 100, { color: CYAN, label: 'introsort' });
  caption(p, 'no necesitas conservar empates', 256, 310, { color: TEXT, size: 20 });
  badge(p, 256, 370, 'in-place', { color: GREEN, size: 22, w: 150 });
  caption(p, 'rápido en la práctica', 256, 435, { color: MUTED, size: 19 });
}

export function queOrdenacionGarantizaPeorCasoYO1DeMemoria(p) {
  baseBg(p);
  badge(p, 256, 160, 'peor caso', { color: AMBER, size: 23, w: 180 });
  p.arrow(256, 200, 256, 250, { color: GREEN });
  badge(p, 256, 280, 'heapsort', { color: GREEN, size: 25, w: 170 });
  caption(p, 'O(n log n) y O(1) auxiliar', 256, 370, { color: TEXT, size: 21 });
  caption(p, 'introsort también lo garantiza', 256, 425, { color: MUTED, size: 18 });
}

export function queOrdenacionConvieneParaEnterosDeAnchoFijoYNGrand(p) {
  baseBg(p);
  box(p, 70, 170, 150, 100, { color: CYAN, label: '32 bits' });
  p.arrow(238, 220, 282, 220, { color: GREEN });
  box(p, 292, 170, 150, 100, { color: GREEN, label: 'radix' });
  badge(p, 256, 315, 'O(d(n + b))', { color: GREEN, size: 22, w: 210 });
  caption(p, 'lineal si d es constante', 256, 400, { color: TEXT, size: 21 });
  caption(p, 'claves enteras, no objetos', 256, 450, { color: MUTED, size: 18 });
}

export function queHacerSiSoloSeNecesitaElKEsimoElemento(p) {
  baseBg(p);
  box(p, 70, 170, 150, 100, { color: CYAN, label: 'arreglo' });
  p.arrow(238, 220, 282, 220, { color: GREEN });
  box(p, 292, 170, 150, 100, { color: GREEN, label: 'quickselect' });
  badge(p, 256, 315, 'O(n) esperado', { color: GREEN, size: 22, w: 200 });
  caption(p, 'no ordenes todo', 256, 395, { color: TEXT, size: 23 });
  caption(p, 'peor caso O(n²) o BFPRT', 256, 450, { color: AMBER, size: 18 });
}

export function queSeEligeParaDatosHostilesControladosPorUnAtacante(p) {
  baseBg(p);
  box(p, 55, 160, 180, 140, { color: AMBER, label: 'entrada hostil' });
  caption(p, 'pivotes predecibles', 145, 255, { color: TEXT, size: 18 });
  box(p, 277, 160, 180, 140, { color: GREEN, label: 'aleatorizar' });
  caption(p, 'pivote aleatorio', 367, 255, { color: TEXT, size: 18 });
  caption(p, 'o introsort con límite', 256, 370, { color: MUTED, size: 20 });
  badge(p, 256, 425, 'sin Θ(n²) fijo', { color: GREEN, size: 20, w: 210 });
}

export function queEjeDeTradeOffEnfrentaEstabilidadYMemoria(p) {
  baseBg(p);
  box(p, 70, 190, 150, 60, { color: GREEN, label: 'estable' });
  p.arrow(232, 220, 280, 220, { color: MAGENTA });
  box(p, 292, 190, 150, 60, { color: AMBER, label: 'memoria' });
  p.arrow(280, 280, 232, 280, { color: CYAN });
  caption(p, 'merge O(n) vs heap O(1)', 256, 330, { color: TEXT, size: 20 });
  caption(p, 'elige según el contrato', 256, 390, { color: MUTED, size: 19 });
}

export function queEjeDeTradeOffEnfrentaComparacionesYMovimientos(p) {
  baseBg(p);
  box(p, 55, 170, 180, 130, { color: CYAN, label: 'comparaciones' });
  caption(p, 'selection n²', 145, 265, { color: TEXT, size: 18 });
  box(p, 277, 170, 180, 130, { color: AMBER, label: 'movimientos' });
  caption(p, 'insertion mueve mucho', 367, 265, { color: TEXT, size: 17 });
  caption(p, 'escritura cara → selection', 256, 370, { color: TEXT, size: 20 });
  badge(p, 256, 425, 'n − 1 swaps', { color: GREEN, size: 20, w: 180 });
}

export function queErrorSeCometeAlUsarLoHi2(p) {
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

export function queErrorSeCometeAlMezclarIntervalosEnBusquedaBinari(p) {
  baseBg(p);
  box(p, 60, 150, 392, 60, { color: CYAN, label: '[lo, hi)' });
  box(p, 60, 230, 392, 60, { color: AMBER, label: '[lo, hi]' });
  caption(p, 'elegir una convención y mantenerla', 256, 330, { color: TEXT, size: 19 });
  badge(p, 256, 390, 'sin off-by-one', { color: GREEN, size: 21, w: 210 });
  caption(p, 'actualiza ambos extremos igual', 256, 445, { color: MUTED, size: 18 });
}

export function dosN1PerteneceAO2(p) {
  baseBg(p);
  badge(p, 256, 160, '2^(n+1) − 1', { color: CYAN, size: 24, w: 240 });
  p.arrow(256, 200, 256, 250, { color: GREEN });
  badge(p, 256, 280, 'O(2ⁿ)', { color: GREEN, size: 28, w: 160 });
  caption(p, 'el factor 2 es una constante', 256, 370, { color: TEXT, size: 21 });
  caption(p, 'misma clase asintótica', 256, 420, { color: MUTED, size: 19 });
}

export function queSolucionTieneTN4tN2NLogN(p) {
  baseBg(p);
  box(p, 70, 150, 372, 80, { color: CYAN, label: 'T(n) = 4T(n/2) + n² log n' });
  badge(p, 150, 270, 'a = 4, b = 2', { color: MAGENTA, size: 21, w: 180 });
  badge(p, 356, 270, 'p = 2', { color: MAGENTA, size: 21, w: 110 });
  p.arrow(256, 300, 256, 340, { color: GREEN });
  badge(p, 256, 370, 'Θ(n² log² n)', { color: GREEN, size: 24, w: 220 });
  caption(p, 'caso 2 extendido con k = 1', 256, 445, { color: MUTED, size: 18 });
}

export function queSolucionTieneTN2tN4N(p) {
  baseBg(p);
  box(p, 70, 150, 372, 80, { color: CYAN, label: 'T(n) = 2T(n/4) + n' });
  badge(p, 150, 270, 'p = 1/2', { color: MAGENTA, size: 21, w: 140 });
  badge(p, 356, 270, 'f = n¹', { color: AMBER, size: 21, w: 130 });
  p.arrow(256, 300, 256, 340, { color: GREEN });
  badge(p, 256, 370, 'Θ(n)', { color: GREEN, size: 27, w: 140 });
  caption(p, 'la raíz domina', 256, 445, { color: MUTED, size: 19 });
}

export function queCostoTotalTieneUnaOperacionQueCuestaISoloEnPot(p) {
  baseBg(p);
  [1, 2, 4, 8].forEach((v, i) => {
    varChip(p, 110 + i * 82, 190, 'i=' + v, { w: 70, color: i === 3 ? AMBER : CYAN });
  });
  p.arrow(256, 235, 256, 280, { color: GREEN });
  badge(p, 256, 310, 'Σ 2ʲ < 2n', { color: GREEN, size: 23, w: 200 });
  caption(p, 'total ≤ 3n', 256, 390, { color: TEXT, size: 24 });
  caption(p, 'O(1) amortizado', 256, 440, { color: MUTED, size: 20 });
}

export function comoSeOrdenanCerosUnosYDosesEnUnSoloRecorrido(p) {
  baseBg(p);
  box(p, 55, 190, 120, 60, { color: CYAN, label: '0' });
  box(p, 191, 190, 140, 60, { color: GREEN, label: '1' });
  box(p, 347, 190, 120, 60, { color: MAGENTA, label: '2' });
  p.arrow(100, 270, 400, 270, { color: GREEN });
  caption(p, 'un solo recorrido', 256, 310, { color: TEXT, size: 23 });
  badge(p, 256, 370, 'Θ(n), O(1)', { color: GREEN, size: 22, w: 190 });
  caption(p, 'bandera holandesa', 256, 435, { color: MUTED, size: 19 });
}

export function comoSeOrdenanNEnterosEn0NEnN(p) {
  baseBg(p);
  box(p, 60, 160, 170, 90, { color: CYAN, label: 'rango [0, n)' });
  p.arrow(238, 205, 282, 205, { color: GREEN });
  box(p, 292, 160, 150, 90, { color: GREEN, label: 'counting' });
  badge(p, 256, 295, 'Θ(n + n)', { color: GREEN, size: 23, w: 190 });
  caption(p, 'k = n, no n²', 256, 375, { color: TEXT, size: 22 });
  caption(p, 'una pasada de conteo y otra de escritura', 256, 430, { color: MUTED, size: 17 });
}

export function cuantasComparacionesExigeHallarElMaximoDeNElementos(p) {
  baseBg(p);
  for (let i = 0; i < 5; i += 1) {
    box(p, 80 + i * 70, 180, 56, 50, { color: i === 4 ? GREEN : CYAN });
  }
  p.arrow(100, 250, 380, 250, { color: MUTED });
  badge(p, 256, 310, 'n − 1', { color: GREEN, size: 28, w: 140 });
  caption(p, 'cada elemento pierde una vez', 256, 395, { color: TEXT, size: 20 });
  caption(p, 'cota inferior ajustada', 256, 445, { color: MUTED, size: 19 });
}

export function queLibroEsLaReferenciaSobreOrdenacionYBusqueda(p) {
  baseBg(p);
  box(p, 110, 110, 290, 210, { color: CYAN, label: 'CLRS' });
  caption(p, 'Introduction to Algorithms', 256, 245, { color: TEXT, size: 18 });
  caption(p, 'ordenación y búsqueda', 256, 355, { color: TEXT, size: 22 });
  badge(p, 256, 410, 'referencia', { color: GREEN, size: 21, w: 160 });
  caption(p, 'también Knuth, vol. 3', 256, 460, { color: MUTED, size: 17 });
}

export function queArticuloIntrodujoPatternDefeatingQuicksort(p) {
  baseBg(p);
  box(p, 70, 150, 372, 100, { color: CYAN, label: 'Pattern-Defeating Quicksort' });
  caption(p, 'Orson Peters', 256, 290, { color: TEXT, size: 24 });
  caption(p, 'pdqsort', 256, 345, { color: GREEN, size: 26 });
  caption(p, 'detecta patrones y evita el peor caso', 256, 415, { color: MUTED, size: 18 });
}
