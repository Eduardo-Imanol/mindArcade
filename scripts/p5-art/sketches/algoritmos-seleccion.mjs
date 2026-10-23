// scripts/p5-art/sketches/algoritmos-seleccion.mjs — secciones 7-8: quickselect y ordenación lineal.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, treeNode, varChip } from '../primitives.mjs';

export function queComplejidadEsperadaTieneQuickselect(p) {
  baseBg(p);
  box(p, 60, 180, 150, 80, { color: CYAN, label: 'n' });
  p.arrow(220, 220, 282, 220, { color: MUTED });
  box(p, 292, 180, 160, 80, { color: GREEN, label: 'n/2' });
  badge(p, 256, 315, 'O(n)', { color: GREEN, size: 28, w: 130 });
  caption(p, 'solo explora un lado', 256, 400, { color: TEXT, size: 22 });
  caption(p, 'T(n) = T(n/2) + O(n)', 256, 450, { color: MUTED, size: 18 });
}

export function cualEsElPeorCasoDeQuickselect(p) {
  baseBg(p);
  treeNode(p, 256, 95, 'n', { color: AMBER, size: 18 });
  treeNode(p, 256, 170, 'n−1', { color: AMBER, size: 17 });
  treeNode(p, 256, 245, 'n−2', { color: AMBER, size: 17 });
  treeNode(p, 256, 320, '…', { color: AMBER, size: 18 });
  p.line(256, 95, 256, 170, { color: MUTED });
  p.line(256, 170, 256, 245, { color: MUTED });
  p.line(256, 245, 256, 320, { color: MUTED });
  caption(p, 'pivote extremo siempre', 120, 195, { color: TEXT, size: 18, align: 'start' });
  badge(p, 390, 240, 'O(n²)', { color: AMBER, size: 24, w: 120 });
}

export function queLograLaMedianaDeMedianasDeBfprt(p) {
  baseBg(p);
  box(p, 70, 160, 150, 110, { color: CYAN, label: 'grupos de 5' });
  p.arrow(230, 215, 282, 215, { color: GREEN });
  box(p, 292, 160, 150, 110, { color: GREEN, label: 'mediana' });
  badge(p, 256, 320, 'O(n) garantizado', { color: GREEN, size: 23, w: 230 });
  caption(p, 'peor caso, no solo esperado', 256, 405, { color: TEXT, size: 19 });
}

export function porQueLaMedianaDeMedianasGarantizaUnBuenPivote(p) {
  baseBg(p);
  box(p, 70, 150, 372, 80, { color: CYAN, label: 'al menos 3/10 por lado' });
  p.arrow(256, 240, 256, 290, { color: GREEN });
  badge(p, 256, 320, '30 % / 70 %', { color: GREEN, size: 25, w: 220 });
  caption(p, 'la recurrencia sigue siendo lineal', 256, 405, { color: TEXT, size: 20 });
  caption(p, 'constante alta en la práctica', 256, 450, { color: AMBER, size: 18 });
}

export function comoSeObtieneElTopKEnStreaming(p) {
  baseBg(p);
  for (let i = 0; i < 5; i += 1) {
    box(p, 55 + i * 50, 180, 40, 40, { color: CYAN });
  }
  p.arrow(190, 230, 240, 280, { color: GREEN });
  box(p, 250, 270, 190, 70, { color: GREEN, label: 'min-heap de k' });
  badge(p, 256, 380, 'O(n log k)', { color: GREEN, size: 23, w: 180 });
  caption(p, 'una pasada, memoria O(k)', 256, 445, { color: TEXT, size: 19 });
}

export function comoSeMantieneLaMedianaMovil(p) {
  baseBg(p);
  box(p, 55, 150, 180, 140, { color: MAGENTA, label: 'max-heap' });
  caption(p, 'mitad menor', 145, 255, { color: TEXT, size: 18 });
  box(p, 277, 150, 180, 140, { color: CYAN, label: 'min-heap' });
  caption(p, 'mitad mayor', 367, 255, { color: TEXT, size: 18 });
  caption(p, 'la mediana está en el borde', 256, 350, { color: TEXT, size: 19 });
  badge(p, 256, 410, 'O(log n)', { color: GREEN, size: 22, w: 150 });
}

export function queSeUsaParaCuantilesEnFlujosEnormes(p) {
  baseBg(p);
  box(p, 70, 160, 150, 100, { color: CYAN, label: 'flujo' });
  p.arrow(228, 210, 290, 210, { color: GREEN });
  box(p, 300, 160, 150, 100, { color: GREEN, label: 'sketch' });
  badge(p, 256, 310, 't-digest / KLL', { color: GREEN, size: 22, w: 210 });
  caption(p, 'error acotado, memoria pequeña', 256, 395, { color: TEXT, size: 19 });
  caption(p, 'no guarda todos los datos', 256, 445, { color: MUTED, size: 18 });
}

export function comoRompenLaBarreraNLogNLosAlgoritmosLineales(p) {
  baseBg(p);
  box(p, 60, 160, 180, 130, { color: AMBER, label: 'comparaciones' });
  caption(p, 'Ω(n log n)', 150, 255, { color: TEXT, size: 20 });
  box(p, 277, 160, 180, 130, { color: GREEN, label: 'claves' });
  caption(p, 'cuenta y reparte', 367, 255, { color: TEXT, size: 18 });
  caption(p, 'no comparan, usan la estructura', 256, 370, { color: MUTED, size: 19 });
}

export function cualesSonLasTresFasesDeCountingSort(p) {
  baseBg(p);
  box(p, 65, 150, 120, 110, { color: CYAN, label: 'contar' });
  box(p, 196, 150, 120, 110, { color: CYAN, label: 'prefijos' });
  box(p, 327, 150, 120, 110, { color: GREEN, label: 'colocar' });
  p.arrow(256, 285, 256, 320, { color: MUTED });
  caption(p, 'cuenta, acumula y escribe', 256, 350, { color: TEXT, size: 21 });
  caption(p, 'estable si se recorre al revés', 256, 410, { color: MUTED, size: 19 });
}

export function cualEsLaComplejidadYLaEstabilidadDeCountingSort(p) {
  baseBg(p);
  badge(p, 256, 160, 'O(n + k)', { color: GREEN, size: 27, w: 170 });
  p.arrow(256, 200, 256, 250, { color: MUTED });
  badge(p, 256, 280, 'estable', { color: GREEN, size: 24, w: 150 });
  caption(p, 'k es el rango de claves', 256, 365, { color: TEXT, size: 21 });
  caption(p, 'memoria O(k)', 256, 420, { color: MUTED, size: 20 });
}

export function cuandoCountingSortEsPeorQueOrdenarPorComparaciones(p) {
  baseBg(p);
  box(p, 60, 160, 170, 130, { color: GREEN, label: 'k ≈ n' });
  caption(p, 'lineal', 145, 255, { color: TEXT, size: 20 });
  box(p, 287, 160, 170, 130, { color: AMBER, label: 'k ≫ n' });
  caption(p, 'desperdicia memoria', 372, 255, { color: TEXT, size: 17 });
  caption(p, 'el rango enorme domina', 256, 365, { color: TEXT, size: 20 });
  badge(p, 256, 425, 'vuelve a n log n', { color: AMBER, size: 19, w: 230 });
}

export function queDiferenciaHayEntreRadixLsdYMsd(p) {
  baseBg(p);
  box(p, 55, 160, 180, 140, { color: CYAN, label: 'LSD' });
  caption(p, 'menos significativo', 145, 250, { color: TEXT, size: 18 });
  caption(p, 'iterativo', 145, 290, { color: MUTED, size: 18 });
  box(p, 277, 160, 180, 140, { color: MAGENTA, label: 'MSD' });
  caption(p, 'más significativo', 367, 250, { color: TEXT, size: 18 });
  caption(p, 'recursivo', 367, 290, { color: MUTED, size: 18 });
  caption(p, 'mismo resultado, distinta estrategia', 256, 380, { color: MUTED, size: 18 });
}

export function queCostoTieneRadixSortLsdConDPasadasDeBaseB(p) {
  baseBg(p);
  badge(p, 256, 150, 'd = ⌈w / r⌉', { color: CYAN, size: 25, w: 200 });
  p.arrow(256, 190, 256, 240, { color: GREEN });
  badge(p, 256, 270, 'O(d(n + b))', { color: GREEN, size: 24, w: 210 });
  caption(p, 'b = 2ʳ cubos por pasada', 256, 360, { color: TEXT, size: 21 });
  caption(p, 'w es el ancho de la clave', 256, 415, { color: MUTED, size: 19 });
}

export function queTamanoDeDigitoSeUsaHabitualmenteEnRadixDe32Bit(p) {
  baseBg(p);
  varChip(p, 150, 180, '8 bits', { w: 120, color: CYAN });
  varChip(p, 362, 180, '11 bits', { w: 130, color: MAGENTA });
  varChip(p, 150, 280, '256 cubos', { w: 140, color: MUTED });
  varChip(p, 362, 280, '2048 cubos', { w: 160, color: MUTED });
  caption(p, '4 u 3 pasadas para 32 bits', 256, 370, { color: TEXT, size: 21 });
  caption(p, 'equilibra cubos y pasadas', 256, 420, { color: MUTED, size: 19 });
}

export function comoSeOrdenanEnterosConSignoConRadixSort(p) {
  baseBg(p);
  box(p, 70, 160, 150, 90, { color: CYAN, label: 'int32' });
  p.arrow(230, 205, 290, 205, { color: GREEN });
  box(p, 300, 160, 150, 90, { color: GREEN, label: 'offset' });
  badge(p, 256, 295, 'xor con 2³¹', { color: GREEN, size: 23, w: 200 });
  caption(p, 'los negativos quedan antes', 256, 380, { color: TEXT, size: 21 });
  caption(p, 'se ordena como unsigned', 256, 430, { color: MUTED, size: 19 });
}

export function comoSeOrdenanFlotantesIeee754ConRadixSort(p) {
  baseBg(p);
  box(p, 60, 160, 160, 100, { color: CYAN, label: 'IEEE-754' });
  p.arrow(230, 210, 286, 210, { color: GREEN });
  box(p, 300, 160, 150, 100, { color: GREEN, label: 'bits' });
  caption(p, 'positivos: invertir el signo', 256, 300, { color: TEXT, size: 20 });
  caption(p, 'negativos: invertir todo', 256, 355, { color: TEXT, size: 20 });
  badge(p, 256, 415, 'orden total', { color: GREEN, size: 21, w: 160 });
}

export function cualEsLaComplejidadEsperadaDeBucketSort(p) {
  baseBg(p);
  const buckets = [60, 110, 150, 120, 80];
  buckets.forEach((h, i) => box(p, 75 + i * 76, 300 - h, 56, h, { color: i === 2 ? GREEN : CYAN }));
  caption(p, 'distribución uniforme', 256, 270, { color: TEXT, size: 21 });
  badge(p, 256, 350, 'O(n)', { color: GREEN, size: 27, w: 130 });
  caption(p, 'se degrada si los datos se concentran', 256, 425, { color: MUTED, size: 17 });
}

export function queAlgoritmosLinealesSonEstables(p) {
  baseBg(p);
  varChip(p, 120, 170, 'counting', { w: 130, color: GREEN });
  varChip(p, 330, 170, 'radix LSD', { w: 130, color: GREEN });
  varChip(p, 225, 275, 'bucket', { w: 120, color: CYAN });
  caption(p, 'si cada cubo conserva el orden', 256, 370, { color: TEXT, size: 20 });
  caption(p, 'MSD puede requerir cuidado', 256, 425, { color: MUTED, size: 18 });
}
