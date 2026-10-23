// scripts/p5-art/sketches/algoritmos-dataset.mjs — sección 9: datos ordenados, externa, streaming, paralela y comparadores.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, varChip } from '../primitives.mjs';

export function comoSeMideElDesordenConInversiones(p) {
  baseBg(p);
  [3, 1, 4, 2].forEach((v, i) => {
    box(p, 85 + i * 70, 180, 58, 50, { color: i === 0 ? AMBER : CYAN });
    caption(p, String(v), 114 + i * 70, 205, { color: TEXT, size: 20 });
  });
  p.arrow(110, 250, 330, 250, { color: MAGENTA, dashed: true });
  badge(p, 256, 310, 'pares invertidos', { color: AMBER, size: 22, w: 210 });
  caption(p, 'Kendall tau, O(n log n)', 256, 395, { color: TEXT, size: 20 });
  caption(p, 'también mide adaptabilidad', 256, 445, { color: MUTED, size: 18 });
}

export function queSonLosRunsDeUnArreglo(p) {
  baseBg(p);
  box(p, 60, 180, 140, 60, { color: GREEN, label: 'ascendente' });
  box(p, 210, 180, 90, 60, { color: AMBER, label: 'baja' });
  box(p, 310, 180, 145, 60, { color: GREEN, label: 'ascendente' });
  caption(p, 'tramos ya ordenados', 256, 290, { color: TEXT, size: 23 });
  badge(p, 256, 350, 'se fusionan', { color: CYAN, size: 22, w: 160 });
  caption(p, 'Timsort los detecta', 256, 420, { color: MUTED, size: 20 });
}

export function queConvieneHacerConDatosOrdenadosMasUnBloqueNuevoA(p) {
  baseBg(p);
  box(p, 60, 170, 230, 70, { color: GREEN, label: 'ya ordenado' });
  box(p, 300, 170, 150, 70, { color: AMBER, label: 'bloque nuevo' });
  p.arrow(256, 260, 256, 305, { color: CYAN });
  badge(p, 256, 335, 'insertar o fusionar', { color: CYAN, size: 21, w: 240 });
  caption(p, 'no reordenar todo', 256, 415, { color: TEXT, size: 21 });
}

export function queParticionConvieneConDuplicadosMasivos(p) {
  baseBg(p);
  box(p, 55, 190, 120, 60, { color: MAGENTA, label: '<' });
  box(p, 191, 190, 140, 60, { color: GREEN, label: '=' });
  box(p, 347, 190, 120, 60, { color: AMBER, label: '>' });
  caption(p, 'partición de tres vías', 256, 295, { color: TEXT, size: 23 });
  badge(p, 256, 355, 'O(n) con iguales', { color: GREEN, size: 21, w: 210 });
  caption(p, 'Dutch national flag', 256, 425, { color: MUTED, size: 19 });
}

export function comoSeOrdenanDatosConPocasClavesDistintasYNoEntera(p) {
  baseBg(p);
  ['A', 'B', 'C'].forEach((k, i) => {
    box(p, 80 + i * 130, 160, 110, 70, { color: i === 1 ? GREEN : CYAN, label: 'clave ' + k, size: 17 });
    p.arrow(135 + i * 130, 238, 256, 280, { color: MUTED });
  });
  badge(p, 256, 310, 'agrupar por clave', { color: CYAN, size: 21, w: 220 });
  caption(p, 'buckets o hash, no comparar', 256, 400, { color: TEXT, size: 19 });
  caption(p, 'cada grupo conserva el orden', 256, 450, { color: MUTED, size: 18 });
}

export function queEsSampleSort(p) {
  baseBg(p);
  box(p, 50, 160, 110, 70, { color: CYAN, label: 'muestra' });
  p.arrow(168, 195, 214, 195, { color: GREEN });
  box(p, 222, 160, 120, 70, { color: GREEN, label: 'splitters' });
  p.arrow(350, 195, 390, 195, { color: GREEN });
  box(p, 398, 160, 60, 70, { color: AMBER, label: 'cubos', size: 14 });
  caption(p, 'cubos balanceados', 256, 290, { color: TEXT, size: 23 });
  badge(p, 256, 350, 'paralelo / GPU', { color: CYAN, size: 21, w: 190 });
  caption(p, 'pocos pasos de comunicación', 256, 420, { color: MUTED, size: 19 });
}

export function comoFuncionaLaOrdenacionExternaConRuns(p) {
  baseBg(p);
  ['run 1', 'run 2', 'run 3'].forEach((label, i) => {
    box(p, 60 + i * 132, 140, 118, 70, { color: CYAN, label, size: 17 });
    p.arrow(119 + i * 132, 218, 119 + i * 132, 262, { color: MUTED });
  });
  box(p, 90, 270, 332, 60, { color: GREEN, label: 'fusión k vías' });
  caption(p, 'generar runs y fusionar', 256, 375, { color: TEXT, size: 21 });
  badge(p, 256, 430, '≈ 2N de E/S', { color: GREEN, size: 20, w: 180 });
}

export function queEsReplacementSelection(p) {
  baseBg(p);
  box(p, 60, 160, 150, 100, { color: CYAN, label: 'heap' });
  p.arrow(228, 210, 288, 210, { color: GREEN });
  box(p, 300, 160, 150, 100, { color: GREEN, label: 'run' });
  badge(p, 256, 305, 'runs más largos', { color: GREEN, size: 22, w: 200 });
  caption(p, 'aprovecha la memoria disponible', 256, 390, { color: TEXT, size: 19 });
  caption(p, 'reduce pasadas de fusión', 256, 440, { color: MUTED, size: 18 });
}

export function cualEsElCostoOptimoDeLaOrdenacionExterna(p) {
  baseBg(p);
  badge(p, 256, 160, 'M / B bloques', { color: CYAN, size: 23, w: 210 });
  p.arrow(256, 200, 256, 250, { color: GREEN });
  badge(p, 256, 280, 'O(n log_{M/B}(n/B))', { color: GREEN, size: 20, w: 320 });
  caption(p, 'E/S, no comparaciones', 256, 370, { color: TEXT, size: 21 });
  caption(p, 'modelo de memoria externa', 256, 425, { color: MUTED, size: 19 });
}

export function cuantasPasadasNecesitaOrdenar100GbCon4GbDeRam(p) {
  baseBg(p);
  badge(p, 150, 170, '100 GB', { color: CYAN, size: 23, w: 150 });
  badge(p, 362, 170, '4 GB RAM', { color: MAGENTA, size: 23, w: 160 });
  p.arrow(256, 210, 256, 255, { color: MUTED });
  badge(p, 256, 285, '25 runs', { color: GREEN, size: 24, w: 160 });
  caption(p, '1 pasada 25-aria con 26 buffers', 256, 375, { color: TEXT, size: 19 });
  caption(p, 'o 5 pasadas binarias', 256, 430, { color: AMBER, size: 19 });
}

export function comoSeOrdenaUnFlujoQueNoCabeEnMemoria(p) {
  baseBg(p);
  box(p, 60, 170, 130, 80, { color: CYAN, label: 'flujo' });
  box(p, 200, 170, 130, 80, { color: MAGENTA, label: 'buffer' });
  box(p, 340, 170, 120, 80, { color: GREEN, label: 'disco' });
  p.arrow(192, 210, 196, 210, { color: MUTED });
  p.arrow(332, 210, 336, 210, { color: MUTED });
  caption(p, 'ventana acotada de memoria', 256, 300, { color: TEXT, size: 21 });
  badge(p, 256, 360, 'fusión externa', { color: GREEN, size: 21, w: 190 });
  caption(p, 'no se guarda todo el flujo', 256, 430, { color: MUTED, size: 19 });
}

export function queEstructuraMantieneElMaximoDeUnaVentanaDeslizante(p) {
  baseBg(p);
  [5, 3, 4, 1, 2].forEach((v, i) => {
    box(p, 65 + i * 62, 180, 50, 50, { color: i === 0 ? GREEN : MUTED });
    caption(p, String(v), 90 + i * 62, 205, { color: TEXT, size: 19 });
  });
  p.arrow(90, 250, 330, 250, { color: CYAN, dashed: true });
  badge(p, 256, 315, 'deque monótona', { color: GREEN, size: 22, w: 200 });
  caption(p, 'O(n) total, no O(nk)', 256, 400, { color: TEXT, size: 21 });
  caption(p, 'descarta lo que ya no puede ganar', 256, 450, { color: MUTED, size: 17 });
}

export function queEsquemaDeOrdenacionParalelaUsaPocosPasosDeComuni(p) {
  baseBg(p);
  varChip(p, 120, 170, 'muestra', { w: 120, color: CYAN });
  varChip(p, 362, 170, 'splitters', { w: 130, color: MAGENTA });
  varChip(p, 241, 280, 'cubos', { w: 110, color: GREEN });
  caption(p, 'cada procesador ordena su cubo', 256, 370, { color: TEXT, size: 20 });
  badge(p, 256, 425, 'sample sort', { color: GREEN, size: 21, w: 180 });
}

export function queHaceMergePathEnUnaFusionParalela(p) {
  baseBg(p);
  box(p, 60, 170, 180, 140, { color: CYAN, label: 'A' });
  box(p, 272, 170, 180, 140, { color: MAGENTA, label: 'B' });
  p.arrow(150, 315, 362, 240, { color: GREEN, dashed: true });
  badge(p, 256, 340, 'partición diagonal', { color: GREEN, size: 21, w: 220 });
  caption(p, 'búsqueda binaria del corte', 256, 420, { color: TEXT, size: 19 });
  caption(p, 'fusiona por tramos en paralelo', 256, 465, { color: MUTED, size: 17 });
}

export function queEsDecorateSortUndecorate(p) {
  baseBg(p);
  box(p, 55, 170, 110, 80, { color: CYAN, label: 'objeto' });
  p.arrow(172, 210, 218, 210, { color: GREEN });
  box(p, 225, 170, 130, 80, { color: GREEN, label: 'clave' });
  p.arrow(362, 210, 408, 210, { color: GREEN });
  box(p, 414, 170, 44, 80, { color: AMBER, label: 'sort', size: 14 });
  caption(p, 'calcula la clave una sola vez', 256, 300, { color: TEXT, size: 21 });
  badge(p, 256, 360, 'Schwartzian', { color: CYAN, size: 21, w: 170 });
  caption(p, 'evita repetir el costo', 256, 430, { color: MUTED, size: 19 });
}

export function queContratoDebeCumplirUnComparador(p) {
  baseBg(p);
  box(p, 55, 160, 120, 110, { color: CYAN, label: 'irreflexivo', size: 16 });
  box(p, 196, 160, 120, 110, { color: CYAN, label: 'antisim.', size: 16 });
  box(p, 337, 160, 120, 110, { color: CYAN, label: 'transitivo', size: 16 });
  caption(p, 'orden débil estricto', 256, 320, { color: TEXT, size: 23 });
  badge(p, 256, 380, 'compare(a, b)', { color: GREEN, size: 21, w: 210 });
  caption(p, 'si no, el sort puede fallar', 256, 445, { color: AMBER, size: 18 });
}

export function porQueNuncaSeDebeRestarParaComparar(p) {
  baseBg(p);
  varChip(p, 120, 190, 'a', { w: 70, color: CYAN });
  varChip(p, 256, 190, '−', { w: 70, color: AMBER });
  varChip(p, 392, 190, 'b', { w: 70, color: MAGENTA });
  badge(p, 256, 285, 'puede desbordar', { color: AMBER, size: 22, w: 230 });
  caption(p, 'int de 32 bits', 256, 365, { color: TEXT, size: 21 });
  caption(p, 'devuelve <, = o > explícito', 256, 420, { color: MUTED, size: 19 });
}

export function porQueNanRompeLaOrdenacion(p) {
  baseBg(p);
  box(p, 80, 170, 352, 90, { color: AMBER, label: 'NaN' });
  p.arrow(256, 268, 256, 312, { color: MAGENTA });
  badge(p, 256, 340, 'comparaciones falsas', { color: AMBER, size: 21, w: 250 });
  caption(p, 'rompe la transitividad', 256, 420, { color: TEXT, size: 21 });
  caption(p, 'decide un orden explícito', 256, 465, { color: MUTED, size: 18 });
}

export function porQueElOrdenUtf16NoEsElOrdenAlfabeticoHumano(p) {
  baseBg(p);
  box(p, 55, 160, 180, 130, { color: CYAN, label: 'code units' });
  caption(p, 'A < a < á', 145, 255, { color: TEXT, size: 19 });
  box(p, 277, 160, 180, 130, { color: GREEN, label: 'collation' });
  caption(p, 'reglas del idioma', 367, 255, { color: TEXT, size: 18 });
  caption(p, 'acentos, mayúsculas y locale', 256, 360, { color: TEXT, size: 19 });
  badge(p, 256, 420, 'Intl.Collator', { color: GREEN, size: 21, w: 190 });
}

export function listSortDeDartEsEstable(p) {
  baseBg(p);
  varChip(p, 130, 180, 'A·1', { w: 80, color: MAGENTA });
  varChip(p, 256, 180, 'A·2', { w: 80, color: MAGENTA });
  varChip(p, 382, 180, 'B', { w: 70, color: CYAN });
  p.arrow(256, 225, 256, 275, { color: GREEN });
  varChip(p, 130, 310, 'A·1', { w: 80, color: MAGENTA });
  varChip(p, 256, 310, 'A·2', { w: 80, color: MAGENTA });
  varChip(p, 382, 310, 'B', { w: 70, color: CYAN });
  caption(p, 'conserva el orden de empate', 256, 400, { color: TEXT, size: 20 });
  badge(p, 256, 450, 'estable', { color: GREEN, size: 20, w: 140 });
}
