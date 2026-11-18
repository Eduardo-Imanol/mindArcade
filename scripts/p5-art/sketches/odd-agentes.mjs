// scripts/p5-art/sketches/odd-agentes.mjs — ODD: sketches conceptuales por carta.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT, VIOLET } from '../palette.mjs';
import { badge, box, caption, fnPill, stackFrame, treeNode } from '../primitives.mjs';

const COLORS = [CYAN, VIOLET, GREEN, MAGENTA];

function flow(p, labels) {
  const ys = [120, 256, 392];
  labels.slice(0, 3).forEach((label, i) => {
    fnPill(p, 256, ys[i], label, { w: 320, h: 72, color: COLORS[i], size: 22 });
    if (i < 2) p.arrow(256, ys[i] + 38, 256, ys[i + 1] - 38, { color: COLORS[i + 1] });
  });
}

function split(p, labels) {
  box(p, 48, 150, 190, 190, { color: CYAN, label: labels[0] || '', size: 17 });
  box(p, 274, 150, 190, 190, { color: MAGENTA, label: labels[1] || '', size: 17 });
  p.arrow(240, 245, 272, 245, { color: GREEN });
  if (labels[2]) caption(p, labels[2], 256, 410, { color: TEXT, size: 19 });
}

function gate(p, labels) {
  p.push();
  p.fill('rgba(255, 204, 0, 0.1)');
  p.stroke(AMBER);
  p.strokeWeight(2.5);
  p.poly([[256, 95], [398, 180], [256, 265], [114, 180]]);
  p.noStroke();
  p.fill(TEXT);
  p.text(labels[0] || '', 256, 180, { size: 20 });
  p.pop();
  p.arrow(190, 258, 145, 330, { color: CYAN });
  p.arrow(322, 258, 367, 330, { color: MAGENTA });
  badge(p, 145, 370, labels[1] || '', { color: CYAN, size: 15, w: 160 });
  badge(p, 367, 370, labels[2] || '', { color: MAGENTA, size: 15, w: 160 });
}

function layers(p, labels) {
  [110, 205, 300, 395].forEach((y, i) => {
    stackFrame(p, 76, y, 360, 68, labels[i] || '', { color: COLORS[i], size: 19 });
    if (i < 3) p.arrow(256, y + 70, 256, y + 93, { color: COLORS[i + 1] });
  });
}

function cycle(p, labels) {
  const points = [[256, 116], [396, 256], [256, 396], [116, 256]];
  points.forEach(([x, y], i) => {
    treeNode(p, x, y, String(i + 1), { color: COLORS[i], r: 28, size: 18 });
    const [nx, ny] = points[(i + 1) % 4];
    p.arrow(x + (nx - x) * 0.28, y + (ny - y) * 0.28, x + (nx - x) * 0.68, y + (ny - y) * 0.68, { color: COLORS[(i + 1) % 4] });
  });
  if (labels[0]) caption(p, labels.slice(0, 4).join(' · '), 256, 470, { color: TEXT, size: 14 });
}

function timeline(p, labels) {
  p.line(70, 256, 442, 256, { color: MUTED, weight: 3 });
  [92, 200, 308, 420].forEach((x, i) => {
    treeNode(p, x, 256, String(i + 1), { color: COLORS[i], r: 26, size: 17 });
    if (labels[i]) caption(p, labels[i], x, 330, { color: TEXT, size: 13 });
  });
}

function check(p, labels) {
  [125, 220, 315, 410].forEach((y, i) => {
    p.push();
    p.noStroke();
    p.fill(COLORS[i]);
    p.circle(110, y, 22);
    p.pop();
    if (labels[i]) caption(p, labels[i], 140, y, { color: TEXT, size: 19, align: 'start' });
  });
}

function compare(p, labels) {
  box(p, 55, 140, 180, 200, { color: CYAN, label: labels[0] || '', size: 17 });
  box(p, 277, 140, 180, 200, { color: MAGENTA, label: labels[1] || '', size: 17 });
  p.line(256, 150, 256, 330, { color: MUTED, weight: 2 });
  if (labels[2]) caption(p, labels[2], 256, 410, { color: TEXT, size: 19 });
}

function gauge(p, labels) {
  [140, 256, 372].forEach((y, i) => {
    p.line(90, y, 422, y, { color: MUTED, weight: 12 });
    p.line(90, y, 200 + i * 75, y, { color: COLORS[i], weight: 12 });
    if (labels[i]) caption(p, labels[i], 256, y - 34, { color: TEXT, size: 17 });
  });
}

function doc(p, labels) {
  box(p, 100, 90, 312, 332, { color: CYAN, label: labels[0] || '', size: 20 });
  [190, 260, 330].forEach((y, i) => {
    p.line(130, y, 382, y, { color: MUTED, weight: 2 });
    if (labels[i + 1]) caption(p, labels[i + 1], 256, y - 24, { color: TEXT, size: 18 });
  });
}

function pair(p, labels) {
  treeNode(p, 150, 256, 'A', { color: CYAN, r: 44, size: 24 });
  treeNode(p, 362, 256, 'B', { color: MAGENTA, r: 44, size: 24 });
  p.arrow(198, 225, 312, 225, { color: GREEN });
  p.arrow(312, 287, 198, 287, { color: VIOLET });
  if (labels[0]) caption(p, labels[0], 150, 360, { color: TEXT, size: 16 });
  if (labels[1]) caption(p, labels[1], 362, 360, { color: TEXT, size: 16 });
  if (labels[2]) caption(p, labels[2], 256, 440, { color: TEXT, size: 19 });
}

function tree(p, labels) {
  treeNode(p, 256, 130, labels[0] || '1', { color: VIOLET, r: 38, size: 18 });
  [[110, 360], [256, 390], [402, 360]].forEach(([x, y], i) => {
    p.arrow(256, 166, x, y - 36, { color: COLORS[i] });
    treeNode(p, x, y, String(i + 1), { color: COLORS[i], r: 32, size: 18 });
  });
}

function warn(p, labels) {
  badge(p, 256, 140, labels[0] || '', { color: AMBER, size: 20, w: 300 });
  p.arrow(256, 175, 256, 240, { color: AMBER });
  badge(p, 256, 285, labels[1] || '', { color: MAGENTA, size: 19, w: 300 });
  p.arrow(256, 320, 256, 370, { color: MAGENTA });
  if (labels[2]) caption(p, labels[2], 256, 420, { color: TEXT, size: 19 });
}

function bridge(p, labels) {
  box(p, 48, 180, 160, 150, { color: CYAN, label: labels[0] || '', size: 17 });
  p.arrow(212, 255, 300, 255, { color: GREEN });
  box(p, 304, 180, 160, 150, { color: MAGENTA, label: labels[1] || '', size: 17 });
  if (labels[2]) caption(p, labels[2], 256, 400, { color: TEXT, size: 19 });
}

function steps(p, labels) {
  [90, 200, 310, 420].forEach((x, i) => {
    treeNode(p, x, 200, String(i + 1), { color: COLORS[i], r: 28, size: 18 });
    p.line(x, 235, x, 275, { color: MUTED, weight: 2 });
    if (labels[i]) caption(p, labels[i], x, 315, { color: TEXT, size: 13 });
  });
}

const LAYOUTS = { flow, split, gate, layers, cycle, timeline, check, compare, gauge, doc, pair, tree, warn, bridge, steps };

const DATA = [
  ['que-es-odd-segun-gentle-ai', 'flow', ['Gentle-AI', 'ODD', 'sin estándar']],
  ['que-historia-tuvo-odd-frente-a-sdd-en-gentle-ai', 'timeline', ['OpenSpec', 'serie 3.x', 'v4.0.0', '1 oct 2026']],
  ['que-otras-siglas-odd-no-deben-confundirse-con-organic-driven', 'split', ['ODD orgánico', 'otras ODD', 'no confundir']],
  ['como-se-reparte-la-guia-entre-contenido-canonico-y-extension', 'split', ['canónico', 'extensiones', 'tres capas']],
  ['cual-es-el-problema-central-que-intenta-resolver-odd', 'pair', ['veloz', 'contexto finito']],
  ['que-fallo-del-vibe-coding-explica-la-intencion-no-externaliz', 'doc', ['solo en el chat', 'sin criterio', 'parece bien']],
  ['que-son-los-huecos-rellenados-en-silencio-por-un-agente', 'warn', ['ambigüedad', 'supuesto oculto', 'producción']],
  ['que-mide-el-estudio-de-metr-de-2025-citado-en-la-guia', 'compare', ['19 % más lento', 'sensación de veloz', 'medir']],
  ['que-problema-resuelve-sdd-y-cuando-falla', 'split', ['resuelve', 'falla', 'ceremonia fija']],
  ['que-detalle-ilustra-el-coste-de-las-parafrasis-entre-agentes', 'flow', ['spec de 73', 'resumen 13/26', 'referencia 23/26']],
  ['que-distincion-de-bockeler-matiza-la-critica-del-sdd-como-ca', 'split', ['spec-first', 'spec-as-source', 'fases fijas']],
  ['que-tres-variables-fijan-la-ceremonia-segun-el-principio-org', 'steps', ['riesgo', 'incertidumbre', 'coste de retomar', 'no líneas']],
  ['que-decision-ilustra-que-el-numero-de-lineas-no-decide-la-ce', 'compare', ['80 archivos', '1 línea de factura', 'no decide']],
  ['cuales-son-los-seis-invariantes-que-odd-nunca-encoge', 'check', ['pregunta', 'explorar', 'literal', 'evidencia']],
  ['que-lectura-recomienda-la-guia-de-los-benchmarks-de-gentle-a', 'compare', ['bajo riesgo', 'alto riesgo', 'una ejecución']],
  ['que-hace-el-paso-1-de-odd-autorizar', 'gate', ['¿cambio?', 'consulta', 'cambio']],
  ['que-antipatron-previene-el-paso-1', 'warn', ['¿por qué falla?', 'diff no pedido', 'cuatro archivos']],
  ['que-hacen-los-hallazgos-de-la-exploracion-sobre-la-autorizac', 'split', ['hallazgo', 'reportar', 'no arreglar']],
  ['que-hace-el-paso-2-explorar-en-proporcion', 'flow', ['leer', 'tests', 'línea base']],
  ['como-se-regula-el-presupuesto-de-lectura-en-el-paso-2', 'gauge', ['proporción', 'contexto', 'delegar']],
  ['cual-es-la-respuesta-por-defecto-ante-una-duda-concreta-en-o', 'flow', ['duda', 'leer o ejecutar', 'responder']],
  ['cuando-permite-odd-hacer-una-pregunta-al-usuario', 'gate', ['¿decisión real?', 'pregunta', 'supuesto']],
  ['que-formato-tiene-la-pregunta-autorizada-por-odd', 'steps', ['contexto', 'opciones', 'defecto', 'coste']],
  ['que-es-un-desafio-en-el-paso-3', 'gate', ['premisa', 'desafiar', 'máximo uno']],
  ['que-hace-el-registro-de-supuestos-del-paso-3', 'split', ['reversible', 'anotar', 'caro: preguntar']],
  ['por-que-odd-raciona-las-preguntas', 'compare', ['diez preguntas', 'dueño del supuesto', 'atención']],
  ['que-es-la-prueba-del-diff-del-paso-4', 'gate', ['petición + diff', 'pequeña', 'documento']],
  ['que-decide-el-eje-de-retomabilidad-frente-al-eje-de-riesgo', 'split', ['retomabilidad', 'riesgo', 'documento o verificación']],
  ['que-hace-el-paso-5-plan-first', 'flow', ['tarea grande', 'documento', 'anuncio']],
  ['que-ocurre-en-el-paso-6-al-marcar-una-tarea', 'flow', ['RED', 'GREEN', 'commit']],
  ['que-contiene-el-cierre-del-paso-7', 'check', ['resultado', 'evidencia', 'pendiente', 'siguiente paso']],
  ['donde-vive-el-documento-de-feature-de-una-tarea-grande', 'doc', ['odd/tasks', 'un archivo', 'antes de cambiar']],
  ['que-secciones-minimas-tiene-el-documento-de-feature', 'doc', ['Specs', 'Tasks', 'Log L1']],
  ['que-regla-protege-la-entrada-l1-del-log', 'warn', ['L1', 'intocable', 'literal']],
  ['que-pasa-con-una-tarea-invalidada-en-el-documento', 'cycle', ['invalidar', 'reabrir', 'motivo', 'ID estable']],
  ['que-hay-que-hacer-si-aparece-un-cambio-de-alcance-aceptado', 'flow', ['alcance', 'specs y tareas', 'reabrir']],
  ['como-se-entrega-el-documento-a-un-subagente', 'bridge', ['documento', 'ruta + IDs', 'subagente']],
  ['que-funcion-cumple-el-espejo-en-memoria-de-engram', 'pair', ['archivo local', 'Engram', 'reconciliar']],
  ['que-es-la-prueba-de-arranque-en-frio', 'steps', ['qué pidió', 'qué probado', 'qué falta', 'siguiente comando']],
  ['a-quien-se-atribuye-el-fallo-de-la-prueba-de-arranque-en-fri', 'pair', ['fallo', 'documento', 'no agente']],
  ['como-se-retoma-una-sesion-cortada-a-mitad-de-tarea', 'check', ['git status', 'git diff', 'Siguiente paso']],
  ['cuando-se-aplica-test-primero-en-odd', 'gate', ['test útil', 'RED', 'comprobación']],
  ['que-regla-anti-inflacion-limita-los-tests', 'check', ['por regla', 'por comando', 'sin extras']],
  ['que-comprueba-el-navigator-en-la-fase-red', 'flow', ['Navigator', 'test RED', 'intención']],
  ['cual-es-la-trampa-del-red-falso', 'compare', ['RED falso', 'ImportError', 'aserción real']],
  ['que-defensas-evitan-que-un-agente-apruebe-sin-cumplir', 'check', ['solo lectura', 'RED real', 'mutación', 'suite']],
  ['que-exige-un-commit-atomico-en-odd', 'steps', ['una tarea', 'un commit', 'verde', 'T# y S#']],
  ['que-es-una-rebanada-vertical', 'bridge', ['usuario', 'rebanada', 'capas mínimas']],
  ['que-problema-resuelve-trabajar-por-rebanadas-con-agentes', 'compare', ['por capas', 'por rebanadas', 'integración']],
  ['como-se-ordenan-las-rebanadas', 'flow', ['esqueleto', 'riesgo', 'cosmético']],
  ['que-regla-evita-la-sobreingenieria-en-las-rebanadas', 'gate', ['segundo uso', 'tercero', 'extraer']],
  ['cuando-esta-justificado-trabajar-por-capas-horizontales', 'split', ['plataforma', 'expandir', 'un consumidor']],
  ['quien-hace-de-navigator-y-quien-de-driver-en-el-pair-con-age', 'pair', ['humano', 'Navigator', 'Driver LLM']],
  ['donde-interviene-el-humano-en-el-punto-de-control-red', 'flow', ['RED', 'Navigator', 'aceptar']],
  ['que-es-el-presupuesto-de-intentos', 'steps', ['dos intentos', 'hipótesis', 'reintentar', 'parada']],
  ['que-senala-una-oscilacion-en-un-bucle-de-agente', 'cycle', ['editar', 'mismo error', 'oscilación', 'commit verde']],
  ['como-se-comprueba-una-alucinacion-de-codigo', 'check', ['compilar', 'tipar', 'símbolos', 'salida']],
  ['cuales-son-las-cuatro-capas-de-empaquetado-de-odd', 'steps', ['AGENTS.md', 'skills', 'plantillas', 'CI']],
  ['que-principio-rige-la-ceremonia-al-empaquetarla', 'compare', ['encogerse', 'apilarse', 'harness']],
  ['que-hace-el-skill-odd-refine', 'doc', ['odd-refine', 'specs literales', 'sin código']],
  ['que-hace-el-skill-odd-backlog', 'doc', ['odd-backlog', 'rebanadas', 'documento']],
  ['que-hace-el-skill-odd-pair', 'doc', ['odd-pair', 'test primero', 'commit']],
  ['que-caracteriza-un-buen-prompt-de-protocolo', 'check', ['positivo', 'formato', 'parada', 'referencias']],
  ['como-se-resuelve-en-el-caso-a-el-cupon-mayor-que-el-subtotal', 'steps', ['pregunta', 'clasificar', 'RED', 'regresión']],
  ['por-que-el-caso-b-empieza-con-tests-de-caracterizacion', 'flow', ['caracterización', 'costura', 'modo sombra']],
  ['que-estrategia-permite-refactorizar-el-calculo-de-comisiones', 'flow', ['branch by abstraction', 'parallel change', 'retiro']],
  ['que-problema-resuelve-el-patron-referencia-no-resumen', 'bridge', ['ruta e IDs', 'sin resumen', 'traspaso']],
  ['como-funciona-el-patron-verificador-independiente', 'pair', ['spec literal', 'candidato', 'verificador']],
  ['que-es-un-trinquete-en-este-contexto', 'gauge', ['cobertura', 'lint', 'commit', 'trinquete']],
  ['cual-es-el-riesgo-principal-de-odd-y-como-se-mitiga', 'gate', ['pequeño con trampa', 'palabras riesgo', 'veto']],
  ['cuando-manda-sdd-frente-a-odd', 'split', ['auditoría', 'SDD manda', 'ODD enlaza']],
  ['que-indica-la-guia-sobre-los-benchmarks-de-gentle-ai', 'compare', ['una ejecución', 'propio proyecto', '3x más lento']],
  ['que-pasa-si-conviven-sdd-y-odd-sin-declarar-cual-manda', 'split', ['SDD', 'ODD', 'precedencia']],
  ['que-se-hace-el-dia-1-de-la-ruta-de-adopcion', 'steps', ['día 1', 'día 4', 'día 7', 'ajustar reglas']],
  ['que-se-revisa-el-dia-7-de-la-adopcion', 'check', ['clasificación', 'pregunta sobró', 'quitar una', 'añadir una']],
];

export const ODD_AGENTES_SKETCHES = Object.fromEntries(
  DATA.map(([id, kind, labels]) => [id, (p) => {
    baseBg(p, { hue: 265 });
    LAYOUTS[kind](p, labels);
  }])
);
