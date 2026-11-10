// scripts/p5-art/sketches/atraccion-no-verbal.mjs — cuerpo, mirada, tacto y conversación.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, stackFrame } from '../primitives.mjs';

export function queCaracterizaUnaPosturaDeAltaConfianza(p) {
  baseBg(p);
  const rows = [
    ['abierta: sin brazos cruzados', CYAN],
    ['asimétrica, no rígida', GREEN],
    ['lenta y sin sacudidas', AMBER],
    ['ocupar el espacio propio', MAGENTA],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 115 + i * 76, label, { color, size: 16, w: 330 });
  });
  caption(p, 'relajado ≠ despatarrado', 256, 440, { color: TEXT, size: 17 });
  caption(p, 'cómodo en el propio cuerpo', 256, 475, { color: MUTED, size: 15 });
}

export function queQuedoDelPowerPosingTrasLasReplicaciones(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: MAGENTA, label: 'no replicó' });
  caption(p, 'hormonal', 150, 190, { color: TEXT, size: 17 });
  caption(p, '(testosterona,', 150, 225, { color: MUTED, size: 15 });
  caption(p, 'cortisol)', 150, 255, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 200, { color: GREEN, label: 'sí quedó' });
  caption(p, 'sentirse más', 362, 190, { color: TEXT, size: 17 });
  caption(p, 'seguro al', 362, 225, { color: TEXT, size: 17 });
  caption(p, 'expandirte', 362, 255, { color: TEXT, size: 17 });
  caption(p, 'etiqueta: Plausible', 256, 380, { color: AMBER, size: 16 });
  caption(p, 'posar 2 minutos no te cambia; sí ayuda a arrancar', 256, 440, { color: MUTED, size: 14 });
}

export function cuantoMiraLaGenteMientrasEscuchaYMientrasHablaYCo(p) {
  baseBg(p);
  box(p, 60, 130, 170, 150, { color: CYAN, label: 'escuchando' });
  caption(p, '~70-80 %', 145, 215, { color: CYAN, size: 22 });
  caption(p, 'del tiempo', 145, 255, { color: MUTED, size: 15 });
  box(p, 282, 130, 170, 150, { color: MAGENTA, label: 'hablando' });
  caption(p, '~40-50 %', 367, 215, { color: MAGENTA, size: 22 });
  caption(p, 'del tiempo', 367, 255, { color: MUTED, size: 15 });
  caption(p, '2-3 s por mirada; más mirando que fijando', 256, 340, { color: TEXT, size: 15 });
  caption(p, 'romper y volver: respirar', 256, 380, { color: TEXT, size: 15 });
  caption(p, 'conversación ≠ duelo de miradas', 256, 460, { color: MUTED, size: 15 });
}

export function queDistingueCalidezDeTensionSexualEnLaMirada(p) {
  baseBg(p);
  box(p, 55, 120, 190, 210, { color: CYAN, label: 'calidez' });
  caption(p, 'ojos y sonrisa', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'boca incluida', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'amable, abierta', 150, 265, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 210, { color: MAGENTA, label: 'tensión' });
  caption(p, 'fijamente,', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'labios y cuello', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'con pausa larga', 362, 265, { color: MUTED, size: 15 });
  caption(p, 'espectro, no interruptor', 256, 380, { color: TEXT, size: 16 });
  caption(p, 'la mirada lo dice; el contexto lo autoriza', 256, 460, { color: MUTED, size: 14 });
}

export function queZonasDescribioEdwardHallYComoUsarlasEnUnaCita(p) {
  baseBg(p);
  p.push();
  p.noFill();
  p.stroke(CYAN);
  p.strokeWeight(3);
  p.circle(256, 250, 360);
  p.stroke(GREEN);
  p.circle(256, 250, 250);
  p.stroke(MAGENTA);
  p.circle(256, 250, 150);
  p.pop();
  caption(p, 'social ~2 m', 256, 85, { color: CYAN, size: 16 });
  caption(p, 'personal ~80 cm', 256, 140, { color: GREEN, size: 16 });
  caption(p, 'íntimo ~45 cm', 256, 195, { color: MAGENTA, size: 16 });
  caption(p, 'acercarse se negocia con señales', 256, 450, { color: TEXT, size: 16 });
  caption(p, 'no se invade: se invita', 256, 480, { color: MUTED, size: 15 });
}

export function comoSeEscalaElTactoDeFormaSegura(p) {
  baseBg(p);
  const steps = [
    ['brazo/hombro', 'neutro, breve', CYAN],
    ['espalda media', 'al despedirse', GREEN],
    ['codo → mano', 'ya hay reciprocidad', AMBER],
  ];
  steps.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 110 + i * 90, 190, 48, k, { color, size: 16 });
    caption(p, v, 370, 134 + i * 90, { color: TEXT, size: 15 });
  });
  badge(p, 256, 400, 'leer IOI antes de subir', { color: MAGENTA, size: 17, w: 280 });
  caption(p, 'la mano espera invitación', 256, 465, { color: MUTED, size: 15 });
}

export function queDiferenciaAUnIoiDeUnIodEnCadaCanal(p) {
  baseBg(p);
  const rows = [
    ['se acerca', 'se aleja'],
    ['preguntas', 'respuestas cortas'],
    ['te toca', 'cruza brazos'],
    ['te busca otra vez', 'mirada al móvil'],
  ];
  rows.forEach(([ioi, iod], i) => {
    caption(p, ioi, 140, 120 + i * 70, { color: GREEN, size: 16 });
    caption(p, iod, 380, 120 + i * 70, { color: MAGENTA, size: 16 });
  });
  badge(p, 256, 90, 'interés ✓ · desinterés ✗', { color: AMBER, size: 17, w: 290 });
  caption(p, 'juntos y sostenidos, no sueltos', 256, 440, { color: TEXT, size: 16 });
  caption(p, 'una señal aislada no es patrón', 256, 475, { color: MUTED, size: 15 });
}

export function cualesSonLasCincoReglasParaLeerSenalesNoVerbales(p) {
  baseBg(p);
  const rules = [
    '1 · patrones, no instantáneas',
    '2 · clústeres de señales',
    '3 · cambio respecto a su base',
    '4 · contexto de la situación',
    '5 · confirmar con palabras',
  ];
  rules.forEach((label, i) => {
    badge(p, 256, 105 + i * 68, label, { color: i % 2 ? CYAN : GREEN, size: 16, w: 340 });
  });
  caption(p, 'leer no es adivinar', 256, 465, { color: MUTED, size: 16 });
}

export function cualEsElProtocoloAnteIndicadoresDeDesinteresOIncom(p) {
  baseBg(p);
  badge(p, 256, 105, 'IOD detectado', { color: MAGENTA, size: 20, w: 220 });
  p.arrow(256, 127, 256, 175, { color: AMBER });
  const rows = [
    ['reducir presión', 'bajar intensidad, dar espacio', AMBER],
    ['re-leer', 're-evaluar con más datos', CYAN],
  ];
  rows.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 205 + i * 90, 190, 48, k, { color, size: 16 });
    caption(p, v, 370, 229 + i * 90, { color: TEXT, size: 15 });
  });
  badge(p, 256, 410, 'retirarse con cortesía también cuenta', { color: GREEN, size: 15, w: 370 });
  caption(p, 'insistir: la peor jugada', 256, 470, { color: MUTED, size: 15 });
}

export function quePapelJueganRitmoYPausasEnLaProsodiaSegura(p) {
  baseBg(p);
  const bars = [40, 90, 60, 130, 50, 110, 70];
  bars.forEach((len, i) => {
    p.push();
    p.stroke(i % 3 === 2 ? MUTED : CYAN);
    p.strokeWeight(6);
    p.line(80 + i * 50, 230, 80 + i * 50, 230 - len);
    p.pop();
  });
  caption(p, 'habla', 80, 280, { color: CYAN, size: 16 });
  caption(p, 'pausa', 230, 280, { color: MUTED, size: 16 });
  caption(p, 'habla', 330, 280, { color: CYAN, size: 16 });
  badge(p, 256, 370, 'ritmo lento y tono descendente', { color: GREEN, size: 15, w: 350 });
  caption(p, 'los nervios suben el tono', 256, 430, { color: TEXT, size: 16 });
  caption(p, 'pausas: tiempo para el otro', 256, 470, { color: MUTED, size: 15 });
}

export function queFallaEnLaConversacionFormularioYQueLaReemplaza(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: MAGENTA, label: 'formulario' });
  caption(p, '"¿estudias o', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'trabajas?"', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'encuesta sin', 150, 265, { color: MUTED, size: 15 });
  caption(p, 'escucha', 150, 295, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 200, { color: GREEN, label: 'reemplazo' });
  caption(p, 'curiosidad real', 362, 190, { color: TEXT, size: 17 });
  caption(p, 'por lo que dice', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'anclar y', 362, 265, { color: MUTED, size: 15 });
  caption(p, 'profundizar', 362, 295, { color: MUTED, size: 15 });
  caption(p, 'las respuestas importan por la pregunta', 256, 380, { color: TEXT, size: 15 });
  caption(p, 'que hacen después', 256, 415, { color: MUTED, size: 14 });
  caption(p, 'la diferencia es la intención', 256, 465, { color: MUTED, size: 15 });
}

export function cualesSonLosTresPeldanosDeProfundidadConversaciona(p) {
  baseBg(p);
  stackFrame(p, 80, 340, 352, 60, '3 · vulnerabilidad', { color: MAGENTA, size: 18 });
  stackFrame(p, 105, 270, 302, 60, '2 · opiniones y gustos', { color: AMBER, size: 17 });
  stackFrame(p, 130, 200, 252, 60, '1 · hechos', { color: CYAN, size: 18 });
  p.arrow(256, 135, 256, 195, { color: GREEN });
  caption(p, 'profundizar al ritmo del otro', 256, 130, { color: GREEN, size: 16 });
  caption(p, 'subir peldaños = invitación', 256, 440, { color: TEXT, size: 16 });
  caption(p, 'no interrogatorio escalonado', 256, 475, { color: MUTED, size: 15 });
}

export function queEvidenciaRespaldaHacerPreguntasEnUnaCita(p) {
  baseBg(p);
  badge(p, 256, 105, 'preguntar > presumir', { color: CYAN, size: 20, w: 300 });
  caption(p, 'estudios de citas rápidas: quien pregunta', 256, 175, { color: TEXT, size: 15 });
  caption(p, 'más, gusta más — y las preguntas', 256, 210, { color: TEXT, size: 15 });
  caption(p, 'de seguimiento pesan doble', 256, 245, { color: TEXT, size: 15 });
  badge(p, 256, 330, 'Huang et al. (Sölto?)', { color: AMBER, size: 15, w: 270 });
  caption(p, '"speed-dating" 2017', 256, 375, { color: MUTED, size: 14 });
  caption(p, 'interés genuino = imán conversacional', 256, 460, { color: MUTED, size: 15 });
}

export function queMostroAronEtAlConLas36Preguntas(p) {
  baseBg(p);
  badge(p, 256, 105, '36 preguntas', { color: CYAN, size: 24, w: 230 });
  caption(p, 'escalada de intimidad mutua,', 256, 175, { color: TEXT, size: 16 });
  caption(p, 'en tandas de vulnerabilidad creciente', 256, 213, { color: TEXT, size: 15 });
  badge(p, 256, 300, 'cercanía acelerada en laboratorio', { color: GREEN, size: 16, w: 340 });
  caption(p, 'no es hechizo: es reciprocity sostenida', 256, 380, { color: TEXT, size: 15 });
  caption(p, 'el sustento: auto-divulgación progresiva', 256, 460, { color: MUTED, size: 14 });
}

export function quePrincipiosRigenLaVulnerabilidadCalibrada(p) {
  baseBg(p);
  const rows = [
    ['proporcional', 'según lo que el otro comparte', CYAN],
    ['funcional', 'explica conducta, no la exhibe', GREEN],
    ['reversible', 'sin herida ni chantaje', AMBER],
  ];
  rows.forEach(([k, v, color], i) => {
    stackFrame(p, 50, 110 + i * 90, 170, 48, k, { color, size: 17 });
    caption(p, v, 350, 134 + i * 90, { color: TEXT, size: 15 });
  });
  caption(p, '"me costó venir" ≠ trauma completo', 256, 400, { color: TEXT, size: 15 });
  caption(p, 'demasiado pronto asusta; nunca, enfría', 256, 465, { color: MUTED, size: 14 });
}

export function cuandoFuncionaElTeasingYPorQueSeDescartaElNegging(p) {
  baseBg(p);
  box(p, 55, 120, 190, 210, { color: GREEN, label: 'teasing' });
  caption(p, 'affiliativo,', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'mutuo y con', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'sonrisa', 150, 260, { color: TEXT, size: 16 });
  caption(p, 'con confianza', 150, 300, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 210, { color: MAGENTA, label: 'negging' });
  caption(p, 'insulto', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'envuelto para', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'que agradezcas', 362, 260, { color: TEXT, size: 16 });
  caption(p, 'el golpe', 362, 300, { color: MUTED, size: 15 });
  caption(p, 'el chiste se ríe contigo;', 256, 380, { color: TEXT, size: 15 });
  caption(p, 'el negging ríe de ti', 256, 415, { color: TEXT, size: 15 });
  caption(p, 'desprecio = ruptura', 256, 465, { color: MUTED, size: 15 });
}
