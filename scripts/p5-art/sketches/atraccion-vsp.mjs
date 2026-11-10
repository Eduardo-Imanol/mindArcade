// scripts/p5-art/sketches/atraccion-vsp.mjs — autoestima relacional, neurodivergencia y comunicación.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, treeNode } from '../primitives.mjs';

export function queDiferenciaAlVspDeLaAutovaloracion(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: CYAN, label: 'autoestima' });
  caption(p, 'juicio global', 150, 190, { color: TEXT, size: 17 });
  caption(p, '"valgo"', 150, 230, { color: TEXT, size: 17 });
  caption(p, 'yo ↔ yo', 150, 280, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 220, { color: GREEN, label: 'VSP' });
  caption(p, 'me aceptan', 362, 190, { color: TEXT, size: 17 });
  caption(p, 'y me valoran', 362, 230, { color: TEXT, size: 17 });
  caption(p, 'yo ↔ grupo', 362, 280, { color: MUTED, size: 15 });
  caption(p, 'sociómetro: se mueve en tiempo real', 256, 400, { color: TEXT, size: 16 });
  caption(p, 'con cada señal social', 256, 440, { color: MUTED, size: 15 });
}

export function queProponeLaTeoriaDelSociometroDeLeary(p) {
  baseBg(p);
  badge(p, 256, 105, 'sociómetro (Leary)', { color: CYAN, size: 19, w: 300 });
  caption(p, 'la autoestima es un medidor interno', 256, 170, { color: TEXT, size: 16 });
  caption(p, 'de inclusión percibida', 256, 210, { color: TEXT, size: 16 });
  p.arrow(256, 250, 256, 300, { color: AMBER });
  badge(p, 256, 330, 'baja ⇒ buscar reconectar', { color: AMBER, size: 17, w: 300 });
  caption(p, 'un gps social, no un veredicto', 256, 440, { color: MUTED, size: 16 });
}

export function queDosEjesDeEvaluacionDescribeElModeloDeFiske(p) {
  baseBg(p);
  p.push();
  p.stroke(MUTED);
  p.strokeWeight(3);
  p.line(120, 256, 392, 256);
  p.line(256, 120, 256, 392);
  p.pop();
  caption(p, 'calidez', 400, 250, { color: MAGENTA, size: 18 });
  caption(p, 'competencia', 262, 115, { color: CYAN, size: 18, align: 'start' });
  badge(p, 350, 180, 'querido + capaz', { color: GREEN, size: 16, w: 190 });
  badge(p, 160, 330, 'frío + inepto', { color: MAGENTA, size: 16, w: 170 });
  caption(p, 'cualquier impresión se lee en estos dos ejes', 256, 440, { color: TEXT, size: 15 });
  caption(p, '(SCM de Fiske)', 256, 475, { color: MUTED, size: 15 });
}

export function dondeSeConstruyeElVspReal(p) {
  baseBg(p);
  badge(p, 256, 105, 'VSP real', { color: GREEN, size: 24, w: 190 });
  caption(p, 'se construye en la relación:', 256, 175, { color: TEXT, size: 17 });
  caption(p, 'pertenecer a alguien/grupo', 256, 215, { color: TEXT, size: 17 });
  caption(p, 'que responde cuando importas', 256, 255, { color: TEXT, size: 17 });
  badge(p, 256, 350, 'afirmaciones frente al espejo: no', { color: MAGENTA, size: 15, w: 360 });
  caption(p, 'evidencia interpersonal > mantra', 256, 440, { color: MUTED, size: 16 });
}

export function queEsLaCongruenciaConductualYQueDiceDeVerdadLaRegl(p) {
  baseBg(p);
  badge(p, 256, 105, '7-38-55', { color: AMBER, size: 30, w: 190 });
  caption(p, 'palabras · voz · cuerpo', 256, 175, { color: TEXT, size: 18 });
  caption(p, 'el número exacto no replicó;', 256, 230, { color: MUTED, size: 16 });
  caption(p, 'lo que sí importa: que todo diga', 256, 268, { color: MUTED, size: 16 });
  caption(p, 'lo mismo', 256, 306, { color: MUTED, size: 16 });
  badge(p, 256, 380, 'congruencia = confianza', { color: GREEN, size: 18, w: 280 });
}

export function cualEsLaVersionSanaDelFrameControl(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: MAGENTA, label: 'manipular' });
  caption(p, 'imponer mi', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'realidad al otro', 150, 225, { color: TEXT, size: 16 });
  caption(p, '"yo decido"', 150, 265, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 220, { color: GREEN, label: 'sostener' });
  caption(p, 'definir qué es', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'esta relación', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'y sostenerla', 362, 265, { color: MUTED, size: 15 });
  caption(p, 'cualidad + vocabulario del vínculo', 256, 380, { color: TEXT, size: 15 });
  caption(p, 'sano: conducta propia, no control ajeno', 256, 460, { color: MUTED, size: 14 });
}

export function comoDifiereLaLecturaDelSubtextoEnMuchasPersonasAut(p) {
  baseBg(p);
  box(p, 60, 130, 160, 120, { color: CYAN, label: 'neurotípico' });
  caption(p, 'código implícito', 140, 210, { color: TEXT, size: 14 });
  box(p, 292, 130, 160, 120, { color: GREEN, label: 'autista' });
  caption(p, 'lectura literal,', 372, 200, { color: TEXT, size: 14 });
  caption(p, 'explícita', 372, 233, { color: TEXT, size: 14 });
  badge(p, 256, 330, 'subtexto = protocolo no documentado', { color: AMBER, size: 14, w: 380 });
  caption(p, 'no es déficit: es dialecto distinto', 256, 400, { color: TEXT, size: 16 });
  caption(p, 'fallar el código ≠ falta de interés', 256, 460, { color: MUTED, size: 15 });
}

export function enQueConsisteElProblemaDeLaDobleEmpatia(p) {
  baseBg(p);
  treeNode(p, 150, 200, 'A', { color: CYAN, r: 36 });
  treeNode(p, 362, 200, 'B', { color: GREEN, r: 36 });
  p.arrow(190, 200, 322, 200, { color: MAGENTA, dashed: true });
  badge(p, 256, 120, 'empatía rota en ambos sentidos', { color: MAGENTA, size: 15, w: 370 });
  caption(p, 'ni A entiende a B ni B a A', 256, 280, { color: TEXT, size: 17 });
  caption(p, 'el puente se construye desde los dos lados', 256, 330, { color: TEXT, size: 16 });
  caption(p, 'compartir experiencia ≥ teorizar', 256, 460, { color: MUTED, size: 15 });
}

export function comoDebeTratarseElSubtexto(p) {
  baseBg(p);
  badge(p, 256, 105, 'subtexto', { color: CYAN, size: 26, w: 180 });
  p.arrow(256, 127, 256, 175, { color: GREEN });
  badge(p, 256, 205, 'traducirlo a explícito', { color: GREEN, size: 18, w: 270 });
  caption(p, 'preguntar en vez de adivinar', 256, 270, { color: TEXT, size: 17 });
  caption(p, '"¿qué quieres decir con…?"', 256, 310, { color: TEXT, size: 17 });
  caption(p, 'los malentendidos se previenen preguntando', 256, 440, { color: MUTED, size: 15 });
}

export function comoSeGestionaLaSobrecargaSensorialEnLasCitas(p) {
  baseBg(p);
  badge(p, 256, 105, 'ambiente sensorial', { color: MAGENTA, size: 18, w: 280 });
  const rows = [
    ['sitio tranquilo, luz suave', CYAN],
    ['pasear en vez de ruido', GREEN],
    ['avisar y pausar sin culpa', AMBER],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 195 + i * 70, label, { color, size: 16, w: 310 });
  });
  caption(p, 'regular el ambiente regula la interacción', 256, 430, { color: TEXT, size: 15 });
  caption(p, 'batería social finita', 256, 470, { color: MUTED, size: 15 });
}

export function queCostoTieneElEnmascaramientoYEnQueSeDistingueDe(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: MAGENTA, label: 'enmascarar' });
  caption(p, 'esconderse por', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'miedo al rechazo', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'agota y', 150, 265, { color: TEXT, size: 16 });
  caption(p, 'no sostiene', 150, 300, { color: TEXT, size: 16 });
  box(p, 267, 120, 190, 220, { color: GREEN, label: 'adaptarse' });
  caption(p, 'elegir el registro', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'como cualquiera', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'sin negar lo', 362, 265, { color: TEXT, size: 16 });
  caption(p, 'esencial', 362, 300, { color: TEXT, size: 16 });
  caption(p, 'máscara: costo creciente, intimidad cero', 256, 400, { color: TEXT, size: 15 });
  caption(p, 'la diferencia es el miedo', 256, 460, { color: MUTED, size: 15 });
}

export function queTecnicasConviertenElHiperfocoEnConversacion(p) {
  baseBg(p);
  badge(p, 256, 105, 'hiperfoco', { color: CYAN, size: 24, w: 190 });
  caption(p, 'monólogo apasionado', 256, 165, { color: MUTED, size: 16 });
  p.arrow(256, 195, 256, 240, { color: GREEN });
  const rows = [
    ['invitar: "¿te interesa esto?"', GREEN],
    ['pivotes temáticos por preguntas', AMBER],
    ['ciclos habla-escucha visibles', CYAN],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 275 + i * 62, label, { color, size: 15, w: 330 });
  });
  caption(p, 'pasión compartida ≠ dar una charla', 256, 465, { color: MUTED, size: 15 });
}

export function comoSueleVerseElTDAHEnLoRomantico(p) {
  baseBg(p);
  const rows = [
    ['citas más cortas y activas', CYAN],
    ['evitar bares con bombardeo', AMBER],
    ['agenda explícita, no adivinada', GREEN],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 130 + i * 78, label, { color, size: 16, w: 330 });
  });
  caption(p, 'pedir y ofrecer recordatorios sin drama', 256, 400, { color: TEXT, size: 15 });
  caption(p, 'la atención no es el cariño', 256, 440, { color: TEXT, size: 16 });
  caption(p, 'olvido ≠ desinterés', 256, 472, { color: MUTED, size: 15 });
}

export function queAnclajesFisiologicosFrenanLaImpulsividadDelTDAHE(p) {
  baseBg(p);
  const rows = [
    ['respirar antes de hablar', CYAN],
    ['objetos en las manos', AMBER],
    ['pausas activas: caminar', GREEN],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 130 + i * 78, label, { color, size: 16, w: 310 });
  });
  caption(p, 'el cuerpo frena antes que la voluntad', 256, 400, { color: TEXT, size: 16 });
  caption(p, 'interrupciones externas sí, con aviso', 256, 460, { color: MUTED, size: 14 });
}

export function queVentajasTieneLaMenteAtipicaEnLaConexion(p) {
  baseBg(p);
  const rows = [
    ['honestidad directa', GREEN],
    ['curiosidad enciclopédica', CYAN],
    ['lealtad en lo elegido', AMBER],
    ['cero juego de adivinanzas', MAGENTA],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 115 + i * 76, label, { color, size: 17, w: 300 });
  });
  caption(p, 'con quien sí quiere conectarse,', 256, 430, { color: TEXT, size: 16 });
  caption(p, 'la conexión es profunda y sin humo', 256, 465, { color: TEXT, size: 15 });
}
