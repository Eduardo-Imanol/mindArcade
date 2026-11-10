// scripts/p5-art/sketches/atraccion-fundamentos.mjs — base psicológica: deseo, apego y activación.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, stackFrame } from '../primitives.mjs';

export function queEsLoQueRealmenteControlasSegunEstaGuiaSobreLa(p) {
  baseBg(p);
  badge(p, 256, 105, 'no controlas gustarte', { color: MAGENTA, size: 18, w: 300 });
  p.arrow(256, 127, 256, 175, { color: GREEN });
  badge(p, 256, 205, 'controlas tu conducta', { color: GREEN, size: 20, w: 280 });
  caption(p, 'exponerte, regular tu activación,', 256, 300, { color: TEXT, size: 17 });
  caption(p, 'leer señales, sostener tensión sana', 256, 340, { color: TEXT, size: 17 });
  caption(p, 'la respuesta del otro es suya', 256, 440, { color: MUTED, size: 17 });
}

export function queSignificanLasEtiquetasSolidoPlausibleYPopular(p) {
  baseBg(p);
  const rows = [
    ['Sólido', 'replicado en varios estudios', GREEN],
    ['Plausible', 'mechanismo creíble, evidencia parcial', AMBER],
    ['Popular', 'creencia difundida, sin respaldo', MAGENTA],
  ];
  rows.forEach(([name, what, color], i) => {
    stackFrame(p, 60, 110 + i * 80, 170, 48, name, { color, size: 18 });
    caption(p, what, 350, 134 + i * 80, { color: TEXT, size: 15 });
  });
  caption(p, 'cada afirmación llega etiquetada', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'tú decides cuánto apostar', 256, 440, { color: MUTED, size: 16 });
}

export function queSeparoKentBerridgeEntreQuererYGustar(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: MAGENTA, label: 'querer' });
  caption(p, 'dopamina', 150, 190, { color: TEXT, size: 19 });
  caption(p, 'la búsqueda,', 150, 230, { color: TEXT, size: 17 });
  caption(p, 'el tirón', 150, 265, { color: TEXT, size: 17 });
  caption(p,('incentive salience'), 150, 310, { color: MUTED, size: 14 });
  box(p, 267, 120, 190, 220, { color: CYAN, label: 'gustar' });
  caption(p, 'opioides', 362, 190, { color: TEXT, size: 19 });
  caption(p, 'el placer de', 362, 230, { color: TEXT, size: 17 });
  caption(p, 'lo consumido', 362, 265, { color: TEXT, size: 17 });
  caption(p, 'sistemas distintos', 362, 310, { color: MUTED, size: 14 });
  caption(p, 'se puede querer sin gustar', 256, 410, { color: TEXT, size: 17 });
  caption(p, 'la anticipación no es el premio', 256, 450, { color: MUTED, size: 16 });
}

export function porQueLaFasePreviaAUnEncuentroPuedeSentirseMasEle(p) {
  baseBg(p);
  const t = [60, 190, 320, 430];
  const v = [150, 320, 240, 160];
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(4);
  p.noFill();
  p.dash(null);
  p.poly(t.map((x, i) => [x, v[i]]), { close: false });
  p.pop();
  [60, 190, 320, 430].forEach((x, i) => {
    p.push();
    p.noStroke();
    p.fill(i === 1 ? MAGENTA : MUTED);
    p.circle(x, v[i], 16);
    p.pop();
  });
  caption(p, 'citas', 60, 380, { color: MUTED, size: 16 });
  caption(p, 'mensajes', 430, 380, { color: MUTED, size: 16 });
  badge(p, 256, 430, 'pico de anticipación', { color: MAGENTA, size: 16, w: 250 });
  caption(p, 'querer > gustar antes del premio', 256, 475, { color: MUTED, size: 15 });
}

export function cuandoEsMaximaLaActivacionDopaminergicaSostenidaY(p) {
  baseBg(p);
  badge(p, 256, 105, '50 % de probabilidad', { color: MAGENTA, size: 19, w: 280 });
  caption(p, 'la incertidumbre máxima sostiene el tirón', 256, 175, { color: TEXT, size: 16 });
  caption(p, 'y refuerza la aproximación', 256, 215, { color: TEXT, size: 16 });
  badge(p, 256, 300, 'refuerzo intermitente', { color: AMBER, size: 18, w: 260 });
  caption(p, 'sirve para explicar, no para jugar', 256, 430, { color: MUTED, size: 15 });
  caption(p, 'con la cabeza de otro', 256, 465, { color: MUTED, size: 15 });
}

export function queDiferenciaHayEntreIncertidumbreNaturalEIncertidum(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: GREEN, label: 'natural' });
  caption(p, 'dos vidas que', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'se van conociendo', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'a su ritmo', 150, 260, { color: TEXT, size: 16 });
  box(p, 267, 120, 190, 220, { color: MAGENTA, label: 'fabricada' });
  caption(p, 'silencios y', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'retiradas', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'calculados', 362, 260, { color: TEXT, size: 16 });
  caption(p, 'una emerge, la otra se administra', 256, 380, { color: TEXT, size: 16 });
  caption(p, 'la fabricada fabrica daño', 256, 460, { color: MUTED, size: 16 });
}

export function porQueLaOxitocinaNoEsLaMoleculaDelAmor(p) {
  baseBg(p);
  badge(p, 256, 105, 'oxitocina', { color: CYAN, size: 24, w: 200 });
  caption(p, 'afina la lectura social del contexto', 256, 175, { color: TEXT, size: 16 });
  caption(p, 'refuerza la confianza en los tuyos', 256, 215, { color: TEXT, size: 16 });
  caption(p, 'y la defensiva con los extraños', 256, 255, { color: TEXT, size: 16 });
  badge(p, 256, 340, 'contexto-dependiente', { color: AMBER, size: 18, w: 260 });
  caption(p, 'no hay poción: hay situación', 256, 440, { color: MUTED, size: 16 });
}

export function queSincroniaConductualAumentaLaAfiliacionYComoSeLog(p) {
  baseBg(p);
  badge(p, 256, 105, 'sincronía conductual', { color: CYAN, size: 19, w: 300 });
  const rows = [
    ['ritmo de la conversación', CYAN],
    ['coordinar actividades', GREEN],
    ['habitar juntos un rato', AMBER],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 190 + i * 70, label, { color, size: 16, w: 310 });
  });
  caption(p, 'no es imitar posturas a propósito', 256, 400, { color: TEXT, size: 16 });
  caption(p, 'es compartir tiempo real', 256, 440, { color: MUTED, size: 16 });
}

export function queEsLaComposturaYQueLaSabotea(p) {
  baseBg(p);
  box(p, 60, 120, 160, 200, { color: GREEN, label: 'compostura' });
  caption(p, 'estado calmado y', 140, 190, { color: TEXT, size: 15 });
  caption(p, 'presente bajo', 140, 222, { color: TEXT, size: 15 });
  caption(p, 'presión', 140, 255, { color: TEXT, size: 15 });
  box(p, 292, 120, 160, 200, { color: MAGENTA, label: 'la sabotea' });
  caption(p, 'ansia de resultado', 372, 190, { color: TEXT, size: 15 });
  caption(p, 'vigilar cada', 372, 222, { color: TEXT, size: 15 });
  caption(p, 'reacción ajena', 372, 255, { color: TEXT, size: 15 });
  caption(p, 'se nota en voz y manos', 256, 380, { color: TEXT, size: 16 });
  caption(p, 'respirar y soltar la meta', 256, 460, { color: MUTED, size: 15 });
}

export function queEstrategiasRegulanLaActivacionAntesYDuranteUna(p) {
  baseBg(p);
  const rows = [
    ['antes', 'ejercicio, respiración lenta, dormir', CYAN],
    ['durante', 'habla más lento, ancla en el entorno', AMBER],
  ];
  rows.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 130 + i * 100, 120, 48, k, { color, size: 18 });
    caption(p, v, 300, 154 + i * 100, { color: TEXT, size: 15 });
  });
  caption(p, 'activación alta ≠ más atractivo', 256, 350, { color: TEXT, size: 17 });
  caption(p, 'regular el propio motor primero', 256, 440, { color: MUTED, size: 16 });
}

export function deQueSeComponeLaTensionEmocionalPositiva(p) {
  baseBg(p);
  const rows = [
    ['incertidumbre', '¿qué será?', CYAN],
    ['sensación de seguridad', 'puedo ser yo', GREEN],
    ['emoción compartida', 'reír juntos', AMBER],
  ];
  rows.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 110 + i * 90, 220, 48, k, { color, size: 16 });
    caption(p, v, 390, 134 + i * 90, { color: TEXT, size: 15 });
  });
  caption(p, 'chispa = tensión + seguridad', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'sin tensión: amigos; sin seguridad: huida', 256, 445, { color: MUTED, size: 14 });
}

export function queDescribeElEstiloDeApegoSeguro(p) {
  baseBg(p);
  badge(p, 256, 110, 'apego seguro', { color: GREEN, size: 24, w: 240 });
  caption(p, 'cercanía sin miedo', 256, 180, { color: TEXT, size: 19 });
  caption(p, 'confía: "si me alejo, no se rompe"', 256, 225, { color: TEXT, size: 16 });
  caption(p, 'pide ayuda sin vergüenza', 256, 270, { color: TEXT, size: 16 });
  caption(p, 'discute sin amenazar el vínculo', 256, 315, { color: TEXT, size: 16 });
  caption(p, '~la mitad de la población', 256, 440, { color: MUTED, size: 16 });
}

export function queDescribeElEstiloDeApegoAnsioso(p) {
  baseBg(p);
  badge(p, 256, 110, 'apego ansioso', { color: MAGENTA, size: 24, w: 250 });
  caption(p, 'hiperactivación: radar del otro', 256, 180, { color: TEXT, size: 17 });
  caption(p, 'interpreta pausas como rechazo', 256, 225, { color: TEXT, size: 16 });
  caption(p, 'necesita confirmación constante', 256, 270, { color: TEXT, size: 16 });
  caption(p, 'protesta para reconectar', 256, 315, { color: TEXT, size: 16 });
  caption(p, 'se regula con comunicación explícita', 256, 440, { color: MUTED, size: 15 });
}

export function queDescribeElEstiloDeApegoEvitativo(p) {
  baseBg(p);
  badge(p, 256, 110, 'apego evitativo', { color: CYAN, size: 24, w: 250 });
  caption(p, 'desactivación: distancia como calma', 256, 180, { color: TEXT, size: 17 });
  caption(p, 'la intimidad siente invasión', 256, 225, { color: TEXT, size: 16 });
  caption(p, 'valora autosuficiencia', 256, 270, { color: TEXT, size: 16 });
  caption(p, 'se retira cuando hay conflicto', 256, 315, { color: TEXT, size: 16 });
  caption(p, 'acercarse en pasos pequeños', 256, 440, { color: MUTED, size: 15 });
}

export function comoFuncionaElCicloPersecucionDistanciamiento(p) {
  baseBg(p);
  badge(p, 150, 130, 'persecución', { color: MAGENTA, size: 18, w: 170 });
  badge(p, 362, 130, 'distancia', { color: CYAN, size: 18, w: 150 });
  p.arrow(150, 152, 150, 260, { color: MUTED });
  p.arrow(150, 260, 330, 260, { color: MUTED });
  p.arrow(362, 152, 362, 260, { color: MUTED });
  p.arrow(362, 260, 182, 260, { color: MUTED });
  caption(p, 'uno persigue → el otro huye', 256, 320, { color: TEXT, size: 17 });
  caption(p, '→ el primero persigue más', 256, 360, { color: TEXT, size: 17 });
  badge(p, 256, 425, 'romper el ciclo: nombrarlo', { color: GREEN, size: 16, w: 300 });
}

export function queCuatroConductasDelataLaEscasezEmocional(p) {
  baseBg(p);
  const rows = [
    ['vigilar el teléfono', MAGENTA],
    ['revisar cada "visto"', MAGENTA],
    ['planear la vida tras 2 citas', MAGENTA],
    ['traer regalos que compran tiempo', MAGENTA],
  ];
  rows.forEach(([label], i) => {
    badge(p, 256, 110 + i * 78, label, { color: MAGENTA, size: 16, w: 350 });
  });
  caption(p, 'señalan vacío, no interés', 256, 440, { color: TEXT, size: 17 });
  caption(p, 'la abundancia no apunta al otro', 256, 478, { color: MUTED, size: 15 });
}

export function quePasosConstruyenLaSeguridadGanada(p) {
  baseBg(p);
  const rows = [
    ['1 · presencia estable', 'llegar y quedarse', GREEN],
    ['2 · coherencia', 'decir y hacer lo mismo', CYAN],
    ['3 · apertura gradual', 'mostrar sin inundar', AMBER],
  ];
  rows.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 110 + i * 90, 200, 48, k, { color, size: 16 });
    caption(p, v, 370, 134 + i * 90, { color: TEXT, size: 15 });
  });
  caption(p, 'seguridad ganada ≠ declarada', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'el tiempo la prueba, no las palabras', 256, 445, { color: MUTED, size: 14 });
}
