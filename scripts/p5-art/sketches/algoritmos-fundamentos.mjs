// scripts/p5-art/sketches/algoritmos-fundamentos.mjs — secciones 0-4: fundamentos, asíntotas, análisis y recurrencias.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, fnPill, stackFrame, treeNode, varChip } from '../primitives.mjs';

function twoBoxes(p, left, right, { y = 200, h = 130, leftColor = CYAN, rightColor = MAGENTA } = {}) {
  box(p, 55, y, 180, h, { color: leftColor, label: left, size: 20 });
  box(p, 277, y, 180, h, { color: rightColor, label: right, size: 20 });
  p.arrow(243, y + h / 2, 269, y + h / 2, { color: MUTED, head: 8 });
}

export function queEsquemaSigueCadaTemaDeLaGuiaDeAlgoritmos(p) {
  baseBg(p);
  box(p, 45, 170, 130, 110, { color: CYAN, label: 'definir' });
  box(p, 191, 170, 130, 110, { color: CYAN, label: 'costear' });
  box(p, 337, 170, 130, 110, { color: CYAN, label: 'codificar' });
  p.arrow(178, 225, 187, 225, { color: MUTED, head: 8 });
  p.arrow(324, 225, 333, 225, { color: MUTED, head: 8 });
  caption(p, 'mismo esquema', 256, 350, { color: TEXT, size: 26 });
  caption(p, 'uso y trade-offs', 256, 400, { color: MUTED, size: 22 });
}

export function queConvencionDeRangosUsaElCodigoDeLaGuia(p) {
  baseBg(p);
  caption(p, '[', 120, 250, { color: CYAN, size: 90 });
  caption(p, ')', 392, 250, { color: CYAN, size: 90 });
  varChip(p, 190, 250, 'lo', { w: 80, color: MAGENTA });
  varChip(p, 322, 250, 'hi', { w: 80, color: MAGENTA });
  caption(p, 'semiabierto', 256, 360, { color: TEXT, size: 26 });
  caption(p, 'hi no incluido', 256, 408, { color: MUTED, size: 22 });
}

export function queEsUnAlgoritmoSegunLaGuia(p) {
  baseBg(p);
  varChip(p, 100, 240, 'entrada', { w: 130, color: MAGENTA });
  fnPill(p, 256, 240, 'algoritmo', { w: 180, size: 24 });
  p.arrow(172, 240, 160, 240, { color: CYAN });
  box(p, 342, 205, 120, 70, { color: GREEN, label: 'salida' });
  p.arrow(350, 240, 336, 240, { color: CYAN });
  caption(p, 'finito y no ambiguo', 256, 360, { color: TEXT, size: 24 });
  caption(p, 'cumple una especificación', 256, 405, { color: MUTED, size: 21 });
}

export function queDosPropiedadesSeDemuestranPorSeparadoEnUnAlgorit(p) {
  baseBg(p);
  twoBoxes(p, 'parcial', 'termina', { y: 160, h: 150 });
  caption(p, 'si termina, cumple', 145, 255, { color: MUTED, size: 18 });
  caption(p, 'toda entrada válida', 367, 255, { color: MUTED, size: 18 });
  caption(p, 'dos pruebas distintas', 256, 390, { color: TEXT, size: 24 });
}

export function queEsUnaFuncionVariante(p) {
  baseBg(p);
  varChip(p, 150, 160, 'n', { w: 70, color: CYAN });
  varChip(p, 150, 240, 'n − 1', { w: 100, color: CYAN });
  varChip(p, 150, 320, 'n − 2', { w: 100, color: CYAN });
  p.arrow(150, 190, 150, 215, { color: GREEN });
  p.arrow(150, 270, 150, 295, { color: GREEN });
  caption(p, 'decrece, no negativa', 330, 390, { color: TEXT, size: 18 });
  badge(p, 330, 320, 'termina', { color: GREEN, size: 22, w: 120 });
}

export function queTresObligacionesTieneUnInvarianteDeBucle(p) {
  baseBg(p);
  stackFrame(p, 90, 140, 330, 60, 'inicialización', { color: CYAN });
  stackFrame(p, 90, 215, 330, 60, 'mantenimiento', { color: CYAN });
  stackFrame(p, 90, 290, 330, 60, 'terminación', { color: CYAN });
  p.arrow(430, 170, 430, 355, { color: MUTED });
  caption(p, 'postcondición al salir', 256, 410, { color: TEXT, size: 22 });
}

export function queOperacionEsUnitariaEnElModeloWordRam(p) {
  baseBg(p);
  box(p, 140, 120, 232, 90, { color: CYAN, label: 'word-RAM' });
  varChip(p, 110, 280, 'suma', { w: 90, color: MAGENTA });
  varChip(p, 226, 280, 'acceso', { w: 100, color: MAGENTA });
  varChip(p, 356, 280, 'comparar', { w: 120, color: MAGENTA });
  caption(p, 'palabras de w ≥ log n bits', 256, 370, { color: TEXT, size: 22 });
  badge(p, 256, 425, 'coste 1', { color: GREEN, size: 22, w: 120 });
}

export function porQueMultiplicarNumerosDeNBitsNoEsO1EnCostoEn(p) {
  baseBg(p);
  twoBoxes(p, 'escolar', 'Karatsuba', { y: 150, h: 120, leftColor: AMBER, rightColor: GREEN });
  badge(p, 145, 315, 'O(n²)', { color: AMBER, size: 24, w: 110 });
  badge(p, 367, 315, 'n^1.585', { color: GREEN, size: 24, w: 130 });
  caption(p, 'el coste crece con los bits', 256, 400, { color: TEXT, size: 22 });
}

export function porQueProbarSiNEsPrimoDividiendoHastaSuRaizEsExp(p) {
  baseBg(p);
  box(p, 90, 130, 150, 100, { color: MAGENTA, label: 'N' });
  p.arrow(168, 182, 232, 182, { color: CYAN });
  box(p, 240, 130, 180, 100, { color: CYAN, label: 'n = log₂ N' });
  badge(p, 256, 300, 'O(2^(n/2))', { color: AMBER, size: 26, w: 210 });
  caption(p, 'exponencial en bits', 256, 390, { color: TEXT, size: 23 });
}

export function queDiferenciaHayEntreComplejidadPolinomialYPseudoPol(p) {
  baseBg(p);
  box(p, 55, 150, 180, 140, { color: CYAN, label: 'polinomial' });
  caption(p, 'n elementos', 145, 250, { color: TEXT, size: 21 });
  box(p, 277, 150, 180, 140, { color: AMBER, label: 'pseudo' });
  caption(p, 'valor W', 367, 250, { color: TEXT, size: 21 });
  caption(p, 'pero log W bits', 367, 290, { color: AMBER, size: 18 });
  caption(p, 'O(n·W) no es polinomial en bits', 256, 380, { color: MUTED, size: 19 });
}

export function queDimensionesDelCostoSeEvaluanAdemasDelTiempo(p) {
  baseBg(p);
  varChip(p, 130, 170, 'espacio', { w: 130, color: CYAN });
  varChip(p, 300, 170, 'caché', { w: 110, color: CYAN });
  varChip(p, 130, 260, 'E/S', { w: 90, color: MAGENTA });
  varChip(p, 300, 260, 'latencia', { w: 120, color: MAGENTA });
  caption(p, 'varias dimensiones', 256, 370, { color: TEXT, size: 25 });
  caption(p, 'no siempre coinciden', 256, 415, { color: MUTED, size: 21 });
}

export function laPilaDeRecursionCuentaComoEspacioAuxiliar(p) {
  baseBg(p);
  stackFrame(p, 140, 120, 230, 55, 'main', { color: CYAN });
  stackFrame(p, 140, 185, 230, 55, 'rec 1', { color: CYAN });
  stackFrame(p, 140, 250, 230, 55, 'rec 2', { color: AMBER });
  p.arrow(390, 150, 390, 280, { color: AMBER });
  caption(p, 'la pila ocupa memoria', 256, 360, { color: TEXT, size: 23 });
  badge(p, 256, 415, 'cuenta', { color: AMBER, size: 22, w: 110 });
}

export function queSignificaFPerteneceAOG(p) {
  baseBg(p);
  fnPill(p, 180, 200, 'f(n)', { w: 130, color: CYAN });
  fnPill(p, 340, 200, 'c·g(n)', { w: 150, color: MAGENTA });
  p.arrow(185, 260, 185, 300, { color: CYAN });
  p.arrow(335, 260, 335, 300, { color: MAGENTA });
  caption(p, 'f ≤ c·g', 256, 340, { color: TEXT, size: 30 });
  caption(p, 'para todo n ≥ n₀', 256, 395, { color: MUTED, size: 22 });
}

export function queSignificaFPerteneceAG(p) {
  baseBg(p);
  fnPill(p, 180, 200, 'f(n)', { w: 130, color: CYAN });
  fnPill(p, 340, 200, 'c·g(n)', { w: 150, color: MAGENTA });
  p.arrow(185, 300, 185, 260, { color: CYAN });
  p.arrow(335, 300, 335, 260, { color: MAGENTA });
  caption(p, 'f ≥ c·g', 256, 340, { color: TEXT, size: 30 });
  caption(p, 'cota inferior', 256, 395, { color: MUTED, size: 22 });
}

export function queSignificaFPerteneceAG2(p) {
  baseBg(p);
  badge(p, 256, 130, 'c₁·g ≤ f ≤ c₂·g', { color: CYAN, size: 24, w: 250 });
  box(p, 90, 200, 332, 80, { color: GREEN, label: 'Θ(g)' });
  caption(p, 'cota ajustada', 256, 240, { color: TEXT, size: 24 });
  caption(p, 'para todo n ≥ n₀', 256, 350, { color: MUTED, size: 22 });
}

export function queDistingueOGDeOG(p) {
  baseBg(p);
  twoBoxes(p, 'O(g)', 'o(g)', { y: 160, h: 130 });
  caption(p, 'existe una c', 145, 250, { color: TEXT, size: 21 });
  caption(p, 'toda c', 367, 250, { color: TEXT, size: 21 });
  caption(p, 'estricta', 367, 290, { color: AMBER, size: 20 });
  caption(p, 'el cuantificador cambia', 256, 390, { color: MUTED, size: 22 });
}

export function queConclusionDaElLimiteDeFNGNIgualACero(p) {
  baseBg(p);
  caption(p, 'lim f(n)/g(n)', 256, 180, { color: TEXT, size: 26 });
  p.arrow(256, 220, 256, 285, { color: CYAN });
  badge(p, 256, 315, '0', { color: GREEN, size: 34, w: 90 });
  caption(p, 'f pertenece a o(g)', 256, 395, { color: TEXT, size: 26 });
  caption(p, 'y también a O(g)', 256, 440, { color: MUTED, size: 20 });
}

export function porQueSeEscribeFNOGNAunqueSeaUnAbuso(p) {
  baseBg(p);
  box(p, 70, 150, 372, 110, { color: CYAN, label: 'O(g) = conjunto' });
  fnPill(p, 190, 320, 'f(n)', { w: 120, size: 24 });
  caption(p, '=', 256, 320, { color: TEXT, size: 30 });
  fnPill(p, 322, 320, 'O(g)', { w: 120, size: 24, color: MAGENTA });
  caption(p, 'pertenencia o función anónima', 256, 415, { color: MUTED, size: 20 });
}

export function porQue3n5n7PerteneceAN(p) {
  baseBg(p);
  varChip(p, 100, 190, '3n²', { w: 100, color: CYAN });
  varChip(p, 210, 190, '5n', { w: 90, color: MAGENTA });
  varChip(p, 310, 190, '7', { w: 80, color: AMBER });
  p.arrow(256, 230, 256, 285, { color: CYAN });
  badge(p, 256, 315, 'Θ(n²)', { color: GREEN, size: 28, w: 140 });
  caption(p, 'entre 3n² y 15n²', 256, 400, { color: TEXT, size: 23 });
}

export function cualEsLaFormaExactaDeLogNSegunStirling(p) {
  baseBg(p);
  badge(p, 256, 150, 'n log₂ n', { color: CYAN, size: 26, w: 200 });
  badge(p, 256, 225, '− 1.443 n', { color: MAGENTA, size: 24, w: 190 });
  badge(p, 256, 300, '+ O(log n)', { color: MUTED, size: 24, w: 190 });
  caption(p, 'log₂(n!) es Θ(n log n)', 256, 400, { color: TEXT, size: 23 });
}

export function porQueLaBaseDelLogaritmoNoAlteraLaClaseAsintotica(p) {
  baseBg(p);
  varChip(p, 130, 210, 'log₂ n', { w: 130, color: CYAN });
  varChip(p, 382, 210, 'log₁₀ n', { w: 130, color: MAGENTA });
  p.arrow(200, 210, 310, 210, { color: MUTED, dashed: true });
  badge(p, 256, 320, 'Θ(log n)', { color: GREEN, size: 26, w: 170 });
  caption(p, 'solo cambia una constante', 256, 400, { color: TEXT, size: 21 });
}

export function quePropiedadTienenLaSumaYElProductoDeCotas(p) {
  baseBg(p);
  box(p, 55, 150, 180, 140, { color: CYAN, label: 'suma' });
  caption(p, 'O(max(f, g))', 145, 255, { color: TEXT, size: 22 });
  box(p, 277, 150, 180, 140, { color: GREEN, label: 'producto' });
  caption(p, 'O(f·g)', 367, 255, { color: TEXT, size: 24 });
  caption(p, 'fases y bucles anidados', 256, 380, { color: MUTED, size: 22 });
}

export function esElOrdenAsintoticoUnOrdenTotal(p) {
  baseBg(p);
  varChip(p, 256, 170, 'f(n)', { w: 100, color: CYAN });
  varChip(p, 150, 300, 'g(n)', { w: 100, color: MAGENTA });
  varChip(p, 362, 300, 'h(n)', { w: 100, color: MAGENTA });
  p.arrow(240, 195, 170, 280, { color: MUTED, dashed: true });
  p.arrow(272, 195, 342, 280, { color: MUTED, dashed: true });
  caption(p, 'hay funciones incomparables', 256, 400, { color: AMBER, size: 20 });
}

export function cualEsElOrdenCrecienteDesdeLogNHastaNFactorial(p) {
  baseBg(p);
  const rows = ['log n', 'n', 'n log n', 'n²', '2ⁿ', 'n!'];
  rows.forEach((label, i) => {
    box(p, 80 + i * 40, 140 + i * 38, 320 - i * 40, 30, { color: i < 3 ? CYAN : AMBER, size: 18 });
    caption(p, label, 240, 155 + i * 38, { color: TEXT, size: 18 });
  });
  caption(p, 'cada uno es o() del siguiente', 256, 415, { color: MUTED, size: 19 });
}

export function cuantosElementosCabenEnONLogNCon10Operaciones(p) {
  baseBg(p);
  badge(p, 160, 200, '10⁸ ops', { color: CYAN, size: 26, w: 170 });
  p.arrow(250, 200, 300, 200, { color: GREEN });
  badge(p, 390, 200, 'n log n', { color: GREEN, size: 24, w: 150 });
  caption(p, '≈ 4 a 5 millones', 256, 330, { color: TEXT, size: 30 });
  caption(p, 'n² solo admitiría 10⁴', 256, 400, { color: MUTED, size: 21 });
}

export function queValorTieneLaSumaArmonicaH(p) {
  baseBg(p);
  box(p, 90, 150, 332, 110, { color: CYAN, label: 'Hₙ = Σ 1/i' });
  badge(p, 256, 310, 'ln n + γ', { color: GREEN, size: 26, w: 190 });
  caption(p, 'γ ≈ 0.5772', 256, 370, { color: MUTED, size: 22 });
  caption(p, 'es Θ(log n)', 256, 420, { color: TEXT, size: 23 });
}

export function queOcultaLaNotacionO(p) {
  baseBg(p);
  fnPill(p, 256, 200, 'Õ(f)', { w: 150, size: 30 });
  p.arrow(256, 240, 256, 290, { color: CYAN });
  badge(p, 256, 320, 'O(f·logᵏ f)', { color: MAGENTA, size: 24, w: 220 });
  caption(p, 'oculta factores polilogarítmicos', 256, 405, { color: TEXT, size: 20 });
}

export function queDiferenciaHayEntreLaCotaDeUnProblemaYLaDeUnA(p) {
  baseBg(p);
  box(p, 55, 150, 180, 150, { color: CYAN, label: 'algoritmo' });
  caption(p, 'cota superior', 145, 260, { color: TEXT, size: 21 });
  box(p, 277, 150, 180, 150, { color: MAGENTA, label: 'problema' });
  caption(p, 'cota inferior', 367, 260, { color: TEXT, size: 21 });
  badge(p, 256, 370, 'óptimo', { color: GREEN, size: 24, w: 140 });
  caption(p, 'cuando coinciden', 256, 425, { color: MUTED, size: 20 });
}

export function queRelacionHayEntrePNpYNpCompleto(p) {
  baseBg(p);
  box(p, 50, 160, 130, 130, { color: CYAN, label: 'P' });
  box(p, 195, 160, 150, 130, { color: MAGENTA, label: 'NP' });
  box(p, 360, 160, 110, 130, { color: AMBER, label: 'NP-C' });
  caption(p, 'decidir', 115, 320, { color: TEXT, size: 20 });
  caption(p, 'verificar', 270, 320, { color: TEXT, size: 20 });
  caption(p, 'más difíciles', 415, 320, { color: TEXT, size: 18 });
  caption(p, 'si uno cae en P, todos', 256, 400, { color: MUTED, size: 20 });
}

export function queEsElPeorCasoDeUnAlgoritmo(p) {
  baseBg(p);
  const bars = [70, 110, 150, 230];
  bars.forEach((h, i) => box(p, 90 + i * 82, 330 - h, 60, h, { color: i === 3 ? AMBER : CYAN }));
  caption(p, 'máximo sobre |x| = n', 256, 380, { color: TEXT, size: 23 });
  badge(p, 256, 435, 'garantía', { color: AMBER, size: 21, w: 130 });
}

export function queDistingueElCasoPromedioDelCasoEsperado(p) {
  baseBg(p);
  twoBoxes(p, 'promedio', 'esperado', { y: 160, h: 140, leftColor: CYAN, rightColor: GREEN });
  caption(p, 'distribución de datos', 145, 255, { color: TEXT, size: 18 });
  caption(p, 'azar del algoritmo', 367, 255, { color: TEXT, size: 18 });
  caption(p, 'uno supone, el otro no', 256, 385, { color: MUTED, size: 21 });
}

export function porQueNoHayQueConfundirCotaConCaso(p) {
  baseBg(p);
  box(p, 65, 150, 165, 120, { color: CYAN, label: 'O, Ω, Θ' });
  caption(p, 'funciones', 147, 235, { color: TEXT, size: 21 });
  box(p, 282, 150, 165, 120, { color: MAGENTA, label: 'casos' });
  caption(p, 'cuál función', 364, 235, { color: TEXT, size: 19 });
  caption(p, 'insertion: Θ(n) y Θ(n²)', 256, 360, { color: MUTED, size: 20 });
}

export function cuantasComparacionesEsperaUnaBusquedaLinealExitosa(p) {
  baseBg(p);
  for (let i = 0; i < 7; i += 1) {
    box(p, 70 + i * 52, 190, 44, 44, { color: i === 4 ? GREEN : CYAN, size: 18 });
  }
  p.arrow(70, 280, 430, 280, { color: MUTED });
  badge(p, 256, 340, '(n + 1)/2', { color: GREEN, size: 26, w: 180 });
  caption(p, 'Θ(n) si la posición es uniforme', 256, 410, { color: TEXT, size: 20 });
}

export function cuantasComparacionesEsperaQuicksortAleatorizado(p) {
  baseBg(p);
  badge(p, 256, 170, '2n ln n', { color: CYAN, size: 30, w: 190 });
  p.arrow(256, 210, 256, 270, { color: GREEN });
  badge(p, 256, 300, '≈ 1.39 n log₂ n', { color: GREEN, size: 24, w: 280 });
  caption(p, '+39 % que el mínimo teórico', 256, 400, { color: MUTED, size: 21 });
}

export function queGarantizaElAnalisisAmortizado(p) {
  baseBg(p);
  for (let i = 0; i < 5; i += 1) {
    box(p, 60 + i * 76, 190, 62, 60, { color: i === 3 ? AMBER : CYAN });
    p.arrow(60 + i * 76 + 62, 220, 60 + i * 76 + 74, 220, { color: MUTED, head: 6 });
  }
  caption(p, 'secuencia completa', 256, 310, { color: TEXT, size: 23 });
  badge(p, 256, 375, 'peor caso total', { color: AMBER, size: 22, w: 210 });
}

export function queTresMetodosExistenParaElAnalisisAmortizado(p) {
  baseBg(p);
  varChip(p, 120, 180, 'agregado', { w: 130, color: CYAN });
  varChip(p, 300, 180, 'créditos', { w: 130, color: MAGENTA });
  varChip(p, 210, 290, 'potencial', { w: 130, color: GREEN });
  p.arrow(210, 215, 190, 265, { color: MUTED, dashed: true });
  p.arrow(330, 215, 240, 265, { color: MUTED, dashed: true });
  caption(p, 'tres caminos equivalentes', 256, 390, { color: TEXT, size: 22 });
}

export function cualEsElCostoAmortizadoDeUnIncrementoEnUnContador(p) {
  baseBg(p);
  ['1', '0', '1', '1'].forEach((b, i) => {
    box(p, 90 + i * 58, 180, 48, 60, { color: b === '1' ? GREEN : MUTED, size: 24 });
    caption(p, b, 114 + i * 58, 210, { color: TEXT, size: 26 });
  });
  p.arrow(256, 250, 256, 300, { color: CYAN });
  badge(p, 256, 330, 'amortizado 2', { color: GREEN, size: 24, w: 200 });
  caption(p, 'total menor que 2n', 256, 410, { color: MUTED, size: 21 });
}

export function queFactorDeCrecimientoDebeTenerUnArregloDinamico(p) {
  baseBg(p);
  [1, 2, 4, 8].forEach((n, i) => {
    box(p, 70 + i * 92, 190, 40 + n * 10, 60, { color: CYAN });
    caption(p, String(n), 90 + i * 92 + (40 + n * 10) / 2, 220, { color: TEXT, size: 18 });
  });
  badge(p, 256, 330, 'factor ×2', { color: GREEN, size: 24, w: 170 });
  caption(p, 'copias totales ≤ 2n', 256, 400, { color: MUTED, size: 22 });
}

export function cuandoDebeEncogerseUnArregloDinamico(p) {
  baseBg(p);
  box(p, 90, 160, 332, 70, { color: CYAN });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(4);
  p.line(180, 150, 180, 240);
  p.pop();
  caption(p, '1/4', 180, 275, { color: AMBER, size: 24 });
  caption(p, 'no a la mitad', 320, 275, { color: TEXT, size: 22 });
  p.arrow(256, 310, 256, 350, { color: GREEN });
  badge(p, 256, 380, 'evita oscilar', { color: GREEN, size: 22, w: 180 });
}

export function queCostoAmortizadoTieneUnaColaImplementadaConDosPil(p) {
  baseBg(p);
  stackFrame(p, 80, 170, 140, 55, 'entrada', { color: MAGENTA });
  stackFrame(p, 280, 170, 140, 55, 'salida', { color: CYAN });
  p.arrow(225, 197, 275, 197, { color: MUTED });
  caption(p, 'volcar k cuesta k', 256, 285, { color: TEXT, size: 21 });
  badge(p, 256, 355, 'amortizado 0', { color: GREEN, size: 24, w: 200 });
  caption(p, 'O(1) por operación', 256, 420, { color: MUTED, size: 21 });
}

export function porQueElAnalisisAmortizadoNoBastaEnTiempoReal(p) {
  baseBg(p);
  const hs = [40, 50, 45, 180, 42, 48];
  hs.forEach((h, i) => box(p, 80 + i * 60, 320 - h, 44, h, { color: h > 100 ? AMBER : CYAN }));
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(2);
  p.dash('7 6');
  p.line(70, 120, 440, 120);
  p.pop();
  caption(p, 'p99', 420, 100, { color: MAGENTA, size: 20 });
  caption(p, 'una operación cara domina la latencia', 256, 380, { color: TEXT, size: 18 });
}

export function queDiferenciaHayEntreUnAlgoritmoLasVegasYUnoMonte(p) {
  baseBg(p);
  twoBoxes(p, 'Las Vegas', 'Monte Carlo', { y: 150, h: 150, leftColor: GREEN, rightColor: AMBER });
  caption(p, 'siempre acierta', 145, 250, { color: TEXT, size: 19 });
  caption(p, 'tiempo aleatorio', 145, 285, { color: MUTED, size: 18 });
  caption(p, 'tiempo fijo', 367, 250, { color: TEXT, size: 19 });
  caption(p, 'alta probabilidad', 367, 285, { color: MUTED, size: 18 });
  caption(p, 'quicksort y quickselect', 180, 390, { color: MUTED, size: 18 });
}

export function queSignificaQueUnEventoOcurraConAltaProbabilidad(p) {
  baseBg(p);
  badge(p, 256, 190, '1 − 1/n^c', { color: CYAN, size: 30, w: 210 });
  caption(p, 'con c constante', 256, 270, { color: TEXT, size: 24 });
  p.arrow(256, 300, 256, 350, { color: GREEN });
  caption(p, 'riesgo despreciable', 256, 390, { color: GREEN, size: 24 });
}

export function queDosSignificadosTieneInPlace(p) {
  baseBg(p);
  twoBoxes(p, 'estricto', 'liberal', { y: 160, h: 140, leftColor: GREEN, rightColor: CYAN });
  badge(p, 145, 265, 'O(1)', { color: GREEN, size: 22, w: 110 });
  badge(p, 367, 265, 'O(log n)', { color: CYAN, size: 22, w: 140 });
  caption(p, 'la pila cuenta', 256, 390, { color: MUTED, size: 21 });
}

export function queOcultaBigOQueDominaEnLaPractica(p) {
  baseBg(p);
  varChip(p, 150, 200, 'caché', { w: 120, color: CYAN });
  varChip(p, 356, 200, 'saltos', { w: 120, color: AMBER });
  p.arrow(200, 240, 300, 290, { color: MUTED, dashed: true });
  p.arrow(320, 240, 230, 290, { color: MUTED, dashed: true });
  caption(p, 'constantes y memoria', 256, 340, { color: TEXT, size: 24 });
  caption(p, 'la medición decide', 256, 400, { color: MUTED, size: 21 });
}

export function queFormaTieneLaRecurrenciaDeDivideYVenceras(p) {
  baseBg(p);
  fnPill(p, 256, 150, 'T(n)', { w: 140, size: 26 });
  p.arrow(210, 180, 140, 245, { color: CYAN });
  p.arrow(302, 180, 372, 245, { color: CYAN });
  fnPill(p, 130, 275, 'n/b', { w: 110, size: 24, color: MAGENTA });
  fnPill(p, 382, 275, 'f(n)', { w: 110, size: 24, color: GREEN });
  caption(p, 'a subproblemas más el combinado', 256, 370, { color: TEXT, size: 19 });
}

export function comoFuncionaElMetodoDeSustitucion(p) {
  baseBg(p);
  box(p, 60, 150, 150, 110, { color: MAGENTA, label: 'adivinar' });
  p.arrow(218, 205, 292, 205, { color: CYAN });
  box(p, 300, 150, 150, 110, { color: GREEN, label: 'inducir' });
  caption(p, 'ajusta constantes y n₀', 256, 320, { color: TEXT, size: 22 });
  caption(p, 'no olvides los casos base', 256, 375, { color: MUTED, size: 20 });
}

export function queErrorTieneSuponerTNCNParaTN2tN2N(p) {
  baseBg(p);
  fnPill(p, 256, 160, 'T(n) ≤ cn', { w: 210, size: 24, color: AMBER });
  p.arrow(256, 195, 256, 240, { color: MUTED });
  badge(p, 256, 270, 'cn + n', { color: AMBER, size: 26, w: 150 });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(200, 320, 312, 320);
  p.pop();
  caption(p, 'no llega a cn', 256, 360, { color: MAGENTA, size: 22 });
  caption(p, 'demuestra la forma exacta', 256, 410, { color: MUTED, size: 19 });
}

export function queSeHaceSiLaHipotesisInductivaEsDemasiadoDebil(p) {
  baseBg(p);
  badge(p, 256, 160, 'T(n) ≤ cn', { color: AMBER, size: 25, w: 180 });
  p.arrow(256, 195, 256, 240, { color: MUTED });
  badge(p, 256, 270, 'T(n) ≤ cn − d', { color: GREEN, size: 25, w: 220 });
  caption(p, 'resta un término de menor orden', 256, 370, { color: TEXT, size: 20 });
  caption(p, 'la inducción cierra', 256, 420, { color: MUTED, size: 19 });
}

export function comoSeResuelveTN2tNLogN(p) {
  baseBg(p);
  box(p, 60, 160, 120, 100, { color: MAGENTA, label: '√n' });
  p.arrow(188, 210, 232, 210, { color: CYAN });
  box(p, 240, 160, 140, 100, { color: CYAN, label: 'm = log n' });
  p.arrow(388, 210, 420, 210, { color: CYAN });
  badge(p, 256, 330, 'log n · log log n', { color: GREEN, size: 24, w: 260 });
  caption(p, 'cambio de variable', 256, 405, { color: MUTED, size: 21 });
}

export function paraQueSirveElArbolDeRecursion(p) {
  baseBg(p);
  treeNode(p, 256, 120, 'n', { color: CYAN });
  treeNode(p, 170, 210, 'n/2', { color: MAGENTA });
  treeNode(p, 342, 210, 'n/2', { color: MAGENTA });
  treeNode(p, 110, 300, 'n/4', { color: MUTED, size: 17 });
  treeNode(p, 230, 300, 'n/4', { color: MUTED, size: 17 });
  treeNode(p, 282, 300, 'n/4', { color: MUTED, size: 17 });
  treeNode(p, 402, 300, 'n/4', { color: MUTED, size: 17 });
  p.line(256, 120, 170, 210, { color: MUTED });
  p.line(256, 120, 342, 210, { color: MUTED });
  caption(p, 'suma el costo por nivel', 256, 390, { color: TEXT, size: 22 });
}

export function queAportaElTeoremaMaestroAlAnalisisDeRecurrencias(p) {
  baseBg(p);
  box(p, 70, 150, 372, 100, { color: CYAN, label: 'T(n) = aT(n/b) + f(n)' });
  p.arrow(256, 250, 256, 295, { color: MUTED });
  badge(p, 256, 325, 'p = log_b a', { color: GREEN, size: 26, w: 190 });
  caption(p, 'compara f con el exponente crítico', 256, 405, { color: TEXT, size: 19 });
}

export function cualesSonLosTresCasosDelTeoremaMaestro(p) {
  baseBg(p);
  box(p, 60, 140, 390, 70, { color: CYAN, label: 'f menor que nᵖ' });
  caption(p, 'hojas dominan', 256, 190, { color: TEXT, size: 19 });
  box(p, 60, 225, 390, 70, { color: GREEN, label: 'f ≈ nᵖ logᵏ n' });
  caption(p, 'trabajo balanceado', 256, 275, { color: TEXT, size: 19 });
  box(p, 60, 310, 390, 70, { color: AMBER, label: 'f mayor que nᵖ' });
  caption(p, 'raíz domina', 256, 360, { color: TEXT, size: 19 });
}

export function quePasaEnElCaso2ExtendidoConK1(p) {
  baseBg(p);
  badge(p, 256, 170, 'f = nᵖ / log n', { color: AMBER, size: 24, w: 220 });
  p.arrow(256, 210, 256, 260, { color: CYAN });
  badge(p, 256, 290, 'Θ(nᵖ log log n)', { color: GREEN, size: 24, w: 250 });
  caption(p, 'el caso 2 con k = −1', 256, 390, { color: TEXT, size: 22 });
}

export function cuandoNoAplicaElTeoremaMaestro(p) {
  baseBg(p);
  varChip(p, 140, 170, 'a < 1', { w: 100, color: AMBER });
  varChip(p, 310, 170, 'tamaños', { w: 110, color: AMBER });
  varChip(p, 140, 270, 'hueco', { w: 100, color: MAGENTA });
  varChip(p, 310, 270, 'resta', { w: 100, color: MAGENTA });
  caption(p, 'usa árbol, Akra-Bazzi o telescopio', 256, 380, { color: TEXT, size: 20 });
}

export function queHaceElTeoremaDeAkraBazzi(p) {
  baseBg(p);
  badge(p, 256, 170, 'Σ aᵢbᵢᵖ = 1', { color: CYAN, size: 26, w: 210 });
  p.arrow(256, 210, 256, 260, { color: GREEN });
  box(p, 100, 280, 312, 80, { color: GREEN, label: 'T(x) = Θ(xᵖ · …)' });
  caption(p, 'subproblemas de tamaños distintos', 256, 405, { color: MUTED, size: 19 });
}

export function porQueLaMedianaDeMedianasUsaGruposDe5(p) {
  baseBg(p);
  [0, 1, 2, 3, 4].forEach((i) => treeNode(p, 130 + i * 63, 180, String(i + 1), { r: 24, color: i === 2 ? GREEN : MUTED, size: 18 }));
  p.arrow(256, 215, 256, 270, { color: CYAN });
  badge(p, 256, 300, '7n/10 por lado', { color: GREEN, size: 23, w: 230 });
  caption(p, '1/5 + 7/10 < 1, lineal', 256, 390, { color: TEXT, size: 21 });
}

export function queComplejidadTieneElFibonacciIngenuo(p) {
  baseBg(p);
  treeNode(p, 256, 120, 'n', { color: CYAN });
  treeNode(p, 160, 215, 'n−1', { color: MAGENTA, size: 18 });
  treeNode(p, 352, 215, 'n−2', { color: MAGENTA, size: 18 });
  p.line(256, 120, 160, 215, { color: MUTED });
  p.line(256, 120, 352, 215, { color: MUTED });
  caption(p, 'x² = x + 1', 256, 310, { color: TEXT, size: 24 });
  badge(p, 256, 375, 'Θ(φⁿ)', { color: AMBER, size: 26, w: 130 });
}

export function queOrdenConvieneSeguirParaResolverUnaRecurrencia(p) {
  baseBg(p);
  varChip(p, 130, 160, '1 maestro', { w: 140, color: CYAN });
  varChip(p, 360, 160, '2 Akra', { w: 120, color: CYAN });
  varChip(p, 130, 255, '3 telescopio', { w: 150, color: MAGENTA });
  varChip(p, 360, 255, '4 cambio', { w: 130, color: MAGENTA });
  caption(p, 'de lo mecánico a lo artesanal', 256, 370, { color: TEXT, size: 21 });
  dots(p, 150, 410, 362, { color: MUTED });
}
