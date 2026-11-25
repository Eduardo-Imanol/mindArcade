// scripts/p5-art/sketches/ingles-fase1.mjs — Inglés Fase 1: vocabulario, phrasal verbs, gramática y falsos amigos.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dashRect, dots, fnPill, treeNode, varChip } from '../primitives.mjs';

function getOutOfDoingSomething(p) {
  baseBg(p);
  box(p, 70, 180, 150, 110, { color: MAGENTA, label: 'tarea' });
  caption(p, 'dishes', 145, 255, { color: TEXT, size: 22 });
  fnPill(p, 360, 235, 'yo', { w: 100, h: 56, color: CYAN, size: 24 });
  p.arrow(305, 235, 230, 235, { color: GREEN, dashed: true });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(250, 200, 290, 240);
  p.line(290, 200, 250, 240);
  p.pop();
  badge(p, 256, 110, 'get out of', { color: GREEN, size: 24, w: 220 });
  caption(p, 'librarse de hacer algo', 256, 430, { color: MUTED, size: 20 });
}

function toBeInTheSameBoat(p) {
  baseBg(p);
  p.line(90, 300, 150, 360, { color: CYAN, weight: 4 });
  p.line(150, 360, 362, 360, { color: CYAN, weight: 4 });
  p.line(362, 360, 422, 300, { color: CYAN, weight: 4 });
  treeNode(p, 210, 270, 'A', { r: 28, color: GREEN });
  treeNode(p, 302, 270, 'B', { r: 28, color: MAGENTA });
  p.line(80, 370, 432, 370, { color: MUTED, weight: 3 });
  badge(p, 256, 110, 'same boat', { color: AMBER, size: 24, w: 200 });
  caption(p, 'misma situación difícil', 256, 440, { color: MUTED, size: 20 });
}

function overwhelming(p) {
  baseBg(p);
  box(p, 156, 300, 200, 70, { color: MUTED, label: 'mente' });
  for (let i = 0; i < 5; i += 1) {
    const x = 110 + i * 72;
    const y = 120 + (i % 2) * 35;
    varChip(p, x, y, 'info', { w: 58, h: 34, color: i % 2 ? CYAN : MAGENTA, size: 16 });
    p.arrow(x, y + 20, 256, 295, { color: AMBER });
  }
  badge(p, 256, 430, 'overwhelming', { color: AMBER, size: 22, w: 230 });
}

function presentPerfectContinuous(p) {
  baseBg(p);
  p.line(70, 300, 442, 300, { color: MUTED, weight: 3 });
  p.line(170, 285, 170, 315, { color: CYAN, weight: 3 });
  p.line(360, 285, 360, 315, { color: GREEN, weight: 3 });
  p.arrow(170, 250, 360, 250, { color: GREEN });
  p.line(360, 250, 430, 250, { color: GREEN, weight: 3, dashed: true });
  caption(p, 'pasado', 170, 340, { color: CYAN, size: 20 });
  caption(p, 'ahora', 360, 340, { color: GREEN, size: 20 });
  badge(p, 256, 120, 'have been + -ing', { color: CYAN, size: 20, w: 260 });
  caption(p, 'empezó y continúa', 256, 430, { color: MUTED, size: 20 });
}

function runOutOf(p) {
  baseBg(p);
  box(p, 176, 150, 160, 220, { color: CYAN, label: 'coffee' });
  box(p, 186, 290, 140, 70, { color: AMBER });
  caption(p, 'vacío', 256, 325, { color: TEXT, size: 22 });
  dashRect(p, 186, 170, 140, 120, { color: MUTED });
  p.arrow(256, 120, 256, 150, { color: MAGENTA, dashed: true });
  badge(p, 256, 430, 'run out of', { color: MAGENTA, size: 24, w: 200 });
}

function cutCorners(p) {
  baseBg(p);
  box(p, 70, 170, 372, 220, { color: MUTED, dashed: true });
  p.line(100, 340, 412, 340, { color: GREEN, weight: 4 });
  p.line(100, 340, 256, 220, { color: MAGENTA, weight: 4 });
  p.line(256, 220, 412, 340, { color: MAGENTA, weight: 4 });
  badge(p, 256, 120, 'cut corners', { color: MAGENTA, size: 24, w: 220 });
  caption(p, 'camino completo', 256, 370, { color: GREEN, size: 18 });
  caption(p, 'atajo arriesgado', 256, 250, { color: MAGENTA, size: 18 });
  caption(p, 'escatimar calidad', 256, 440, { color: MUTED, size: 20 });
}

function meticulous(p) {
  baseBg(p);
  treeNode(p, 256, 230, '', { r: 70, color: CYAN });
  p.line(305, 280, 370, 345, { color: CYAN, weight: 8 });
  box(p, 220, 200, 24, 24, { color: GREEN });
  box(p, 250, 215, 24, 24, { color: GREEN });
  box(p, 235, 245, 24, 24, { color: GREEN });
  badge(p, 256, 110, 'meticulous', { color: GREEN, size: 24, w: 210 });
  caption(p, 'atención al detalle', 256, 430, { color: MUTED, size: 20 });
}

function neverInversion(p) {
  baseBg(p);
  box(p, 60, 170, 392, 80, { color: MUTED, label: 'normal' });
  caption(p, 'I have never seen...', 256, 220, { color: TEXT, size: 22 });
  box(p, 60, 290, 392, 80, { color: CYAN, label: 'inversión' });
  caption(p, 'Never have I seen...', 256, 340, { color: TEXT, size: 22 });
  p.arrow(170, 255, 170, 285, { color: AMBER });
  p.arrow(280, 285, 280, 255, { color: AMBER });
  badge(p, 256, 110, 'Never + aux + sujeto', { color: AMBER, size: 18, w: 300 });
}

function comeAcross(p) {
  baseBg(p);
  box(p, 55, 150, 185, 190, { color: CYAN, label: '1' });
  caption(p, 'toparse con', 147, 230, { color: TEXT, size: 20 });
  caption(p, 'una foto vieja', 147, 270, { color: MUTED, size: 17 });
  box(p, 272, 150, 185, 190, { color: MAGENTA, label: '2' });
  caption(p, 'dar impresión', 364, 230, { color: TEXT, size: 20 });
  caption(p, 'de ser seguro', 364, 270, { color: MUTED, size: 17 });
  badge(p, 256, 110, 'come across', { color: GREEN, size: 22, w: 220 });
  caption(p, 'dos significados', 256, 430, { color: MUTED, size: 20 });
}

function actuallyVsCurrently(p) {
  baseBg(p);
  box(p, 55, 150, 185, 200, { color: GREEN, label: 'actually' });
  caption(p, 'en realidad', 147, 250, { color: TEXT, size: 22 });
  box(p, 272, 150, 185, 200, { color: MAGENTA, label: 'currently' });
  caption(p, 'actualmente', 364, 250, { color: TEXT, size: 22 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(5);
  p.line(240, 150, 272, 350);
  p.line(272, 150, 240, 350);
  p.pop();
  badge(p, 256, 110, 'falso amigo', { color: AMBER, size: 22, w: 200 });
  caption(p, 'no significan lo mismo', 256, 430, { color: MUTED, size: 19 });
}

function getAwayWith(p) {
  baseBg(p);
  box(p, 70, 190, 140, 120, { color: MAGENTA, label: 'regla' });
  fnPill(p, 350, 250, 'tramposo', { w: 150, h: 56, color: CYAN, size: 22 });
  p.arrow(275, 250, 215, 250, { color: MUTED, dashed: true });
  p.arrow(350, 215, 350, 150, { color: GREEN });
  badge(p, 350, 120, 'escapa', { color: GREEN, size: 20, w: 120 });
  badge(p, 256, 430, 'get away with', { color: AMBER, size: 22, w: 230 });
}

function biteTheBullet(p) {
  baseBg(p);
  treeNode(p, 180, 240, 'yo', { r: 44, color: CYAN, size: 24 });
  box(p, 290, 200, 120, 80, { color: MAGENTA, label: 'difícil' });
  p.arrow(228, 240, 286, 240, { color: GREEN });
  badge(p, 256, 110, 'bite the bullet', { color: AMBER, size: 22, w: 240 });
  caption(p, 'aguantar y hacerlo', 256, 430, { color: MUTED, size: 20 });
}

function resilient(p) {
  baseBg(p);
  p.line(80, 360, 432, 360, { color: MUTED, weight: 3 });
  p.push();
  p.noFill();
  p.stroke(GREEN);
  p.strokeWeight(5);
  p.poly([[100, 200], [170, 360], [240, 240], [310, 360], [380, 280]], { close: false });
  p.pop();
  p.arrow(380, 280, 410, 220, { color: CYAN });
  badge(p, 256, 110, 'resilient', { color: GREEN, size: 24, w: 190 });
  caption(p, 'cae y se recupera', 256, 430, { color: MUTED, size: 20 });
}

function usedToVsBeUsedTo(p) {
  baseBg(p);
  box(p, 55, 140, 185, 210, { color: CYAN, label: 'used to' });
  caption(p, 'hábito pasado', 147, 230, { color: TEXT, size: 19 });
  caption(p, 'ya no ocurre', 147, 270, { color: MUTED, size: 17 });
  box(p, 272, 140, 185, 210, { color: GREEN, label: 'be used to' });
  caption(p, 'acostumbrado', 364, 230, { color: TEXT, size: 19 });
  caption(p, 'ahora es normal', 364, 270, { color: MUTED, size: 17 });
  badge(p, 256, 110, 'pasado vs hábito', { color: AMBER, size: 18, w: 230 });
}

function putOff(p) {
  baseBg(p);
  box(p, 90, 180, 130, 100, { color: MAGENTA, label: 'hoy' });
  caption(p, 'tarea', 155, 245, { color: TEXT, size: 20 });
  box(p, 292, 180, 130, 100, { color: CYAN, label: 'mañana' });
  p.arrow(225, 230, 287, 230, { color: AMBER });
  badge(p, 256, 110, 'put off', { color: AMBER, size: 24, w: 160 });
  caption(p, 'posponer o aplazar', 256, 430, { color: MUTED, size: 20 });
}

function theBallIsInYourCourt(p) {
  baseBg(p);
  box(p, 60, 160, 170, 220, { color: MUTED, label: 'yo' });
  box(p, 282, 160, 170, 220, { color: CYAN, label: 'tú' });
  p.circle(350, 260, 50, 50);
  treeNode(p, 350, 260, 'ball', { r: 26, color: AMBER, size: 16 });
  p.arrow(210, 260, 300, 260, { color: GREEN });
  badge(p, 256, 110, 'your court', { color: GREEN, size: 22, w: 200 });
  caption(p, 'te toca decidir', 256, 440, { color: MUTED, size: 20 });
}

function cumbersome(p) {
  baseBg(p);
  box(p, 120, 160, 272, 180, { color: MAGENTA, label: 'sistema viejo' });
  box(p, 140, 210, 90, 40, { color: MUTED });
  box(p, 250, 210, 120, 40, { color: MUTED });
  box(p, 160, 270, 190, 40, { color: MUTED });
  badge(p, 256, 110, 'cumbersome', { color: MAGENTA, size: 22, w: 220 });
  caption(p, 'pesado y engorroso', 256, 430, { color: MUTED, size: 20 });
}

function wishPastPerfect(p) {
  baseBg(p);
  p.line(70, 320, 442, 320, { color: MUTED, weight: 3 });
  p.line(190, 305, 190, 335, { color: MAGENTA, weight: 3 });
  p.line(350, 305, 350, 335, { color: CYAN, weight: 3 });
  caption(p, 'pasado real', 190, 355, { color: MAGENTA, size: 18 });
  caption(p, 'ahora', 350, 355, { color: CYAN, size: 18 });
  p.arrow(350, 240, 210, 240, { color: AMBER, dashed: true });
  badge(p, 256, 120, 'wish + had + V3', { color: AMBER, size: 20, w: 250 });
  caption(p, 'arrepentimiento del pasado', 256, 430, { color: MUTED, size: 19 });
}

function lookForwardToIng(p) {
  baseBg(p);
  fnPill(p, 170, 250, 'look forward', { w: 190, h: 56, color: CYAN, size: 22 });
  p.arrow(270, 250, 320, 250, { color: GREEN });
  badge(p, 380, 250, 'to + -ing', { color: GREEN, size: 20, w: 130, h: 50 });
  box(p, 330, 290, 120, 50, { color: MUTED, label: 'seeing' });
  badge(p, 256, 120, 'expectativa positiva', { color: AMBER, size: 18, w: 260 });
  caption(p, 'to es preposición aquí', 256, 430, { color: MUTED, size: 20 });
}

function sensibleVsSensitive(p) {
  baseBg(p);
  box(p, 55, 150, 185, 200, { color: GREEN, label: 'sensible' });
  caption(p, 'sensato', 147, 235, { color: TEXT, size: 22 });
  caption(p, 'razonable', 147, 275, { color: MUTED, size: 18 });
  box(p, 272, 150, 185, 200, { color: CYAN, label: 'sensitive' });
  caption(p, 'sensible', 364, 235, { color: TEXT, size: 22 });
  caption(p, 'delicado', 364, 275, { color: MUTED, size: 18 });
  badge(p, 256, 110, 'falso amigo', { color: AMBER, size: 22, w: 200 });
}

function getOver(p) {
  baseBg(p);
  box(p, 100, 280, 120, 70, { color: MAGENTA, label: 'golpe' });
  p.push();
  p.noFill();
  p.stroke(GREEN);
  p.strokeWeight(5);
  p.poly([[160, 280], [256, 160], [360, 260]], { close: false });
  p.pop();
  p.arrow(360, 260, 400, 230, { color: GREEN });
  badge(p, 256, 110, 'get over', { color: GREEN, size: 24, w: 170 });
  caption(p, 'superar y recuperarse', 256, 430, { color: MUTED, size: 20 });
}

function onceInABlueMoon(p) {
  baseBg(p);
  p.push();
  p.noStroke();
  p.fill(CYAN);
  p.circle(256, 230, 108);
  p.fill('#1a0b2e');
  p.circle(286, 210, 92);
  p.pop();
  dots(p, 80, 360, 432, { color: MUTED, n: 7 });
  badge(p, 256, 110, 'once in a blue moon', { color: AMBER, size: 18, w: 290 });
  caption(p, 'muy rara vez', 256, 440, { color: MUTED, size: 20 });
}

function straightforward(p) {
  baseBg(p);
  p.arrow(80, 330, 432, 330, { color: GREEN });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(3);
  p.dash('8 7');
  p.poly([[80, 250], [180, 180], [280, 270], [360, 190], [432, 250]], { close: false });
  p.dash(null);
  p.pop();
  badge(p, 256, 110, 'straightforward', { color: GREEN, size: 22, w: 250 });
  caption(p, 'directo y sencillo', 256, 430, { color: MUTED, size: 20 });
}

function thirdConditional(p) {
  baseBg(p);
  box(p, 55, 170, 185, 120, { color: MAGENTA, label: 'If' });
  caption(p, 'had known', 147, 240, { color: TEXT, size: 20 });
  box(p, 272, 170, 185, 120, { color: CYAN, label: 'would' });
  caption(p, 'have helped', 364, 240, { color: TEXT, size: 20 });
  p.arrow(245, 230, 267, 230, { color: AMBER });
  badge(p, 256, 110, '3rd conditional', { color: AMBER, size: 20, w: 230 });
  caption(p, 'pasado hipotético', 256, 360, { color: MUTED, size: 20 });
  caption(p, 'no ocurrió', 256, 400, { color: MAGENTA, size: 18 });
}

function turnDown(p) {
  baseBg(p);
  box(p, 170, 140, 172, 90, { color: GREEN, label: 'oferta' });
  caption(p, 'job offer', 256, 195, { color: TEXT, size: 20 });
  p.arrow(256, 235, 256, 320, { color: MAGENTA });
  badge(p, 256, 360, 'rechazada', { color: MAGENTA, size: 22, w: 180 });
  badge(p, 256, 430, 'turn down', { color: MAGENTA, size: 22, w: 180 });
}

function underTheWeather(p) {
  baseBg(p);
  treeNode(p, 256, 300, 'me', { r: 42, color: CYAN, size: 24 });
  p.push();
  p.noFill();
  p.stroke(MUTED);
  p.strokeWeight(4);
  p.ellipse(256, 170, 140, 70);
  p.pop();
  for (const x of [220, 245, 270, 295]) p.line(x, 210, x - 8, 240, { color: CYAN, weight: 2 });
  badge(p, 256, 110, 'under the weather', { color: AMBER, size: 18, w: 260 });
  caption(p, 'sentirse mal', 256, 430, { color: MUTED, size: 20 });
}

function daunting(p) {
  baseBg(p);
  box(p, 110, 260, 292, 140, { color: MUTED, label: 'inicio' });
  box(p, 170, 100, 172, 120, { color: MAGENTA, label: 'reto' });
  caption(p, 'parece enorme', 256, 165, { color: TEXT, size: 20 });
  p.arrow(256, 255, 256, 225, { color: AMBER, dashed: true });
  badge(p, 256, 430, 'daunting', { color: AMBER, size: 24, w: 170 });
}

function haveSomethingDone(p) {
  baseBg(p);
  treeNode(p, 120, 250, 'yo', { r: 36, color: CYAN, size: 22 });
  p.arrow(160, 250, 220, 250, { color: GREEN });
  treeNode(p, 256, 250, 'mecánico', { r: 44, color: AMBER, size: 16 });
  p.arrow(304, 250, 360, 250, { color: GREEN });
  box(p, 365, 215, 90, 70, { color: MAGENTA, label: 'coche' });
  badge(p, 256, 120, 'have something done', { color: GREEN, size: 18, w: 290 });
  caption(p, 'mandar que lo hagan', 256, 430, { color: MUTED, size: 20 });
}

function pickUpNatural(p) {
  baseBg(p);
  treeNode(p, 150, 260, 'persona', { r: 42, color: CYAN, size: 18 });
  box(p, 280, 170, 150, 180, { color: GREEN, label: 'México' });
  caption(p, 'español', 355, 260, { color: TEXT, size: 22 });
  p.arrow(196, 260, 275, 260, { color: AMBER, dashed: true });
  badge(p, 256, 120, 'pick up', { color: AMBER, size: 24, w: 160 });
  caption(p, 'aprender de forma natural', 256, 430, { color: MUTED, size: 19 });
}

function embarrassedVsPregnant(p) {
  baseBg(p);
  box(p, 55, 150, 185, 200, { color: MAGENTA, label: 'embarrassed' });
  caption(p, 'avergonzado', 147, 250, { color: TEXT, size: 20 });
  box(p, 272, 150, 185, 200, { color: CYAN, label: 'pregnant' });
  caption(p, 'embarazada', 364, 250, { color: TEXT, size: 20 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(5);
  p.line(240, 150, 272, 350);
  p.line(272, 150, 240, 350);
  p.pop();
  badge(p, 256, 110, 'falso amigo', { color: AMBER, size: 22, w: 200 });
  caption(p, 'embarazada ≠ embarrassed', 256, 430, { color: MUTED, size: 18 });
}

function getAlongWith(p) {
  baseBg(p);
  treeNode(p, 150, 250, 'yo', { r: 38, color: CYAN, size: 20 });
  treeNode(p, 362, 250, 'compañeros', { r: 46, color: GREEN, size: 15 });
  p.arrow(195, 250, 310, 250, { color: GREEN });
  badge(p, 256, 110, 'get along with', { color: GREEN, size: 20, w: 230 });
  caption(p, 'llevarse bien con alguien', 256, 430, { color: MUTED, size: 19 });
}

function hitTheNailOnTheHead(p) {
  baseBg(p);
  p.line(256, 285, 256, 390, { color: MUTED, weight: 10 });
  p.push();
  p.fill('rgba(57, 255, 20, 0.15)');
  p.stroke(GREEN);
  p.strokeWeight(3);
  p.circle(256, 265, 58);
  p.pop();
  p.arrow(110, 150, 228, 245, { color: AMBER, weight: 4 });
  badge(p, 256, 110, 'hit the nail on the head', { color: GREEN, size: 17, w: 300 });
  caption(p, 'dar en el clavo', 256, 440, { color: MUTED, size: 21 });
}

function reluctant(p) {
  baseBg(p);
  treeNode(p, 130, 260, 'él', { r: 36, color: CYAN, size: 20 });
  dashRect(p, 300, 200, 150, 120, { color: MAGENTA });
  caption(p, 'admitir', 375, 260, { color: TEXT, size: 19 });
  p.arrow(175, 260, 290, 260, { color: AMBER, dashed: true });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(205, 170, 235, 200);
  p.line(235, 170, 205, 200);
  p.pop();
  badge(p, 256, 110, 'reluctant', { color: AMBER, size: 24, w: 190 });
  caption(p, 'reacio, poco dispuesto', 256, 430, { color: MUTED, size: 19 });
}

function mixedConditional(p) {
  baseBg(p);
  fnPill(p, 150, 220, 'If + past perfect', { w: 220, h: 62, color: MAGENTA, size: 17 });
  fnPill(p, 362, 320, 'would + infinitivo', { w: 230, h: 62, color: GREEN, size: 16 });
  p.arrow(255, 245, 275, 300, { color: AMBER });
  badge(p, 256, 110, 'mixed conditional', { color: AMBER, size: 19, w: 260 });
  caption(p, 'pasado que afecta al presente', 256, 440, { color: MUTED, size: 18 });
}

function bringUp(p) {
  baseBg(p);
  box(p, 80, 240, 180, 120, { color: MUTED, label: 'charla' });
  varChip(p, 365, 180, 'tema', { w: 110, h: 50, color: CYAN, size: 20 });
  p.arrow(265, 275, 315, 205, { color: GREEN, dashed: true });
  badge(p, 256, 110, 'bring up', { color: GREEN, size: 23, w: 180 });
  caption(p, 'sacar un tema en la conversación', 256, 440, { color: MUTED, size: 18 });
}

function costAnArmAndALeg(p) {
  baseBg(p);
  box(p, 146, 200, 220, 140, { color: MAGENTA, label: 'precio' });
  caption(p, 'carísimo', 256, 275, { color: TEXT, size: 24 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(5);
  p.line(120, 120, 160, 160);
  p.line(160, 120, 120, 160);
  p.pop();
  badge(p, 286, 110, 'cost an arm and a leg', { color: AMBER, size: 17, w: 300 });
  caption(p, 'costar un ojo de la cara', 256, 430, { color: MUTED, size: 19 });
}

function tedious(p) {
  baseBg(p);
  for (let i = 0; i < 3; i += 1) {
    const y = 180 + i * 78;
    box(p, 166, y, 180, 60, { color: MUTED });
    p.line(188, y + 20, 324, y + 20, { color: CYAN, weight: 2 });
    p.line(188, y + 38, 290, y + 38, { color: CYAN, weight: 2 });
  }
  dots(p, 180, 445, 332, { color: AMBER });
  badge(p, 256, 110, 'tedious', { color: AMBER, size: 24, w: 170 });
  caption(p, 'formularios sin fin', 256, 415, { color: MUTED, size: 18 });
}

function sayVsTell(p) {
  baseBg(p);
  box(p, 55, 160, 185, 200, { color: GREEN, label: 'tell' });
  caption(p, 'tell me', 147, 250, { color: TEXT, size: 22 });
  box(p, 272, 160, 185, 200, { color: MAGENTA, label: 'say' });
  caption(p, 'say to me', 364, 250, { color: TEXT, size: 20 });
  badge(p, 256, 110, 'say vs tell', { color: AMBER, size: 21, w: 200 });
  caption(p, 'nunca "say me"', 256, 420, { color: AMBER, size: 19 });
}

function figureOut(p) {
  baseBg(p);
  dashRect(p, 70, 180, 160, 170, { color: MUTED });
  caption(p, '?', 150, 225, { color: AMBER, size: 30 });
  caption(p, 'app', 150, 280, { color: TEXT, size: 24 });
  p.arrow(240, 265, 300, 265, { color: GREEN });
  treeNode(p, 365, 265, '!', { r: 46, color: GREEN, size: 30 });
  badge(p, 256, 110, 'figure out', { color: GREEN, size: 23, w: 190 });
  caption(p, 'descifrar o resolver', 256, 440, { color: MUTED, size: 19 });
}

function exitVsSuccess(p) {
  baseBg(p);
  box(p, 55, 160, 185, 200, { color: CYAN, label: 'exit' });
  caption(p, 'salida', 147, 255, { color: TEXT, size: 22 });
  box(p, 272, 160, 185, 200, { color: MAGENTA, label: 'success' });
  caption(p, 'éxito', 364, 255, { color: TEXT, size: 22 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(5);
  p.line(238, 160, 274, 360);
  p.line(274, 160, 238, 360);
  p.pop();
  badge(p, 256, 110, 'falso amigo', { color: AMBER, size: 22, w: 200 });
  caption(p, 'exit es salida, no éxito', 256, 430, { color: MUTED, size: 18 });
}

function runOutOfMilk(p) {
  baseBg(p);
  box(p, 176, 150, 160, 220, { color: CYAN, label: 'milk' });
  dashRect(p, 186, 240, 140, 120, { color: MAGENTA });
  caption(p, 'sin leche', 256, 300, { color: TEXT, size: 20 });
  p.arrow(256, 110, 256, 145, { color: MAGENTA, dashed: true });
  badge(p, 256, 440, 'run out of', { color: MAGENTA, size: 22, w: 190 });
}

function breakTheIce(p) {
  baseBg(p);
  treeNode(p, 130, 270, 'A', { r: 38, color: CYAN, size: 22 });
  treeNode(p, 382, 270, 'B', { r: 38, color: GREEN, size: 22 });
  p.line(180, 270, 330, 270, { color: MUTED, weight: 3 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(6);
  p.line(238, 242, 274, 298);
  p.line(274, 242, 238, 298);
  p.pop();
  badge(p, 256, 110, 'break the ice', { color: AMBER, size: 21, w: 220 });
  caption(p, 'romper el hielo', 256, 430, { color: MUTED, size: 20 });
}

function overwhelmingWork(p) {
  baseBg(p);
  box(p, 96, 170, 140, 70, { color: MUTED });
  box(p, 276, 170, 140, 70, { color: MUTED });
  box(p, 186, 260, 140, 70, { color: MAGENTA, label: 'work' });
  p.arrow(166, 215, 210, 255, { color: AMBER });
  p.arrow(346, 215, 302, 255, { color: AMBER });
  badge(p, 256, 110, 'overwhelming', { color: AMBER, size: 21, w: 230 });
  caption(p, 'carga abrumadora', 256, 430, { color: MUTED, size: 20 });
}

function presentPerfectVsPastSimple(p) {
  baseBg(p);
  box(p, 55, 160, 185, 190, { color: GREEN, label: 'have done' });
  caption(p, 'sigue vivo', 147, 255, { color: TEXT, size: 18 });
  p.arrow(147, 320, 147, 370, { color: GREEN });
  box(p, 272, 160, 185, 190, { color: MAGENTA, label: 'did' });
  caption(p, 'pasado cerrado', 364, 255, { color: TEXT, size: 17 });
  p.line(315, 355, 413, 355, { color: MAGENTA, weight: 6 });
  badge(p, 256, 105, 'have done vs did', { color: AMBER, size: 18, w: 250 });
  caption(p, 'abierto vs cerrado', 256, 445, { color: MUTED, size: 18 });
}

function cameAcrossPhoto(p) {
  baseBg(p);
  treeNode(p, 130, 265, 'yo', { r: 36, color: CYAN, size: 20 });
  dashRect(p, 300, 195, 150, 140, { color: MAGENTA });
  caption(p, 'foto', 375, 265, { color: TEXT, size: 22 });
  p.arrow(175, 265, 290, 265, { color: GREEN, dashed: true });
  badge(p, 256, 110, 'came across', { color: GREEN, size: 22, w: 210 });
  caption(p, 'encuentro casual', 256, 430, { color: MUTED, size: 19 });
}

function onTheSamePage(p) {
  baseBg(p);
  box(p, 55, 175, 180, 145, { color: CYAN, label: 'A' });
  box(p, 277, 175, 180, 145, { color: CYAN, label: 'B' });
  p.line(115, 355, 397, 355, { color: GREEN, weight: 6 });
  badge(p, 256, 110, 'on the same page', { color: GREEN, size: 18, w: 250 });
  caption(p, 'misma sintonía', 256, 410, { color: MUTED, size: 20 });
}

function insightful(p) {
  baseBg(p);
  treeNode(p, 170, 270, 'idea', { r: 50, color: CYAN, size: 18 });
  p.arrow(230, 245, 315, 190, { color: GREEN });
  p.line(340, 150, 340, 220, { color: AMBER, weight: 4 });
  p.line(305, 185, 375, 185, { color: AMBER, weight: 4 });
  p.line(314, 159, 366, 211, { color: AMBER, weight: 3 });
  p.line(366, 159, 314, 211, { color: AMBER, weight: 3 });
  badge(p, 256, 105, 'insightful', { color: GREEN, size: 23, w: 190 });
  caption(p, 'perspicaz y profundo', 256, 440, { color: MUTED, size: 19 });
}

function theMoreTheMore(p) {
  baseBg(p);
  p.line(80, 400, 432, 400, { color: MUTED, weight: 3 });
  p.arrow(120, 360, 210, 260, { color: GREEN, weight: 4 });
  p.arrow(290, 360, 380, 260, { color: AMBER, weight: 4 });
  treeNode(p, 210, 240, '+', { r: 32, color: GREEN, size: 26 });
  treeNode(p, 380, 240, '+', { r: 32, color: AMBER, size: 26 });
  badge(p, 256, 105, 'the more, the more', { color: AMBER, size: 18, w: 270 });
  caption(p, 'más práctica, mejor resultado', 256, 445, { color: MUTED, size: 17 });
}

function setUp(p) {
  baseBg(p);
  treeNode(p, 130, 270, 'él', { r: 36, color: CYAN, size: 20 });
  p.arrow(175, 270, 240, 270, { color: GREEN });
  box(p, 250, 190, 200, 160, { color: GREEN, label: 'negocio' });
  caption(p, 'abierto', 350, 285, { color: TEXT, size: 20 });
  badge(p, 256, 110, 'set up', { color: GREEN, size: 23, w: 160 });
  caption(p, 'montar o establecer', 256, 440, { color: MUTED, size: 19 });
}

function actuallyNotCurrently(p) {
  baseBg(p);
  box(p, 55, 160, 185, 200, { color: GREEN, label: 'actually' });
  caption(p, 'en realidad', 147, 255, { color: TEXT, size: 19 });
  box(p, 272, 160, 185, 200, { color: MAGENTA, label: 'currently' });
  caption(p, 'actualmente', 364, 255, { color: TEXT, size: 19 });
  p.push();
  p.stroke(AMBER);
  p.strokeWeight(5);
  p.line(238, 160, 274, 360);
  p.line(274, 160, 238, 360);
  p.pop();
  badge(p, 256, 110, 'falso amigo', { color: AMBER, size: 22, w: 200 });
  caption(p, 'actually no es actualmente', 256, 430, { color: MUTED, size: 17 });
}

export const INGLES_FASE1_SKETCHES = {
  'que-significa-el-phrasal-verb-get-out-of-doing-something': getOutOfDoingSomething,
  'que-expresa-la-expresion-to-be-in-the-same-boat': toBeInTheSameBoat,
  'que-significa-la-palabra-overwhelming': overwhelming,
  'para-que-se-usa-el-present-perfect-continuous-en-i-have-been': presentPerfectContinuous,
  'que-significa-el-phrasal-verb-run-out-of': runOutOf,
  'que-significa-la-expresion-cut-corners': cutCorners,
  'que-significa-la-palabra-meticulous': meticulous,
  'como-se-forma-la-inversion-con-never-al-inicio-de-una-oracio': neverInversion,
  'que-dos-significados-puede-tener-el-phrasal-verb-come-across': comeAcross,
  'cual-es-la-diferencia-entre-actually-y-currently-en-ingles': actuallyVsCurrently,
  'que-significa-el-phrasal-verb-get-away-with': getAwayWith,
  'que-significa-la-expresion-bite-the-bullet': biteTheBullet,
  'que-significa-la-palabra-resilient': resilient,
  'cual-es-la-diferencia-entre-used-to-y-be-used-to': usedToVsBeUsedTo,
  'que-significa-el-phrasal-verb-put-off': putOff,
  'que-expresa-la-expresion-the-ball-is-in-your-court': theBallIsInYourCourt,
  'que-significa-la-palabra-cumbersome': cumbersome,
  'para-que-se-usa-la-estructura-wish-past-perfect': wishPastPerfect,
  'que-estructura-sigue-a-look-forward-to-cuando-se-refiere-a-u': lookForwardToIng,
  'cual-es-la-diferencia-entre-sensible-y-sensitive-en-ingles': sensibleVsSensitive,
  'que-significa-el-phrasal-verb-get-over': getOver,
  'que-significa-la-expresion-once-in-a-blue-moon': onceInABlueMoon,
  'que-significa-la-palabra-straightforward': straightforward,
  'como-se-forma-el-third-conditional-y-que-expresa': thirdConditional,
  'que-significa-el-phrasal-verb-turn-down': turnDown,
  'que-significa-la-expresion-under-the-weather': underTheWeather,
  'que-significa-la-palabra-daunting': daunting,
  'que-expresa-la-estructura-have-something-done': haveSomethingDone,
  'que-significa-el-phrasal-verb-pick-up-cuando-se-refiere-a-ap': pickUpNatural,
  'cual-es-la-diferencia-entre-embarrassed-y-pregnant-en-ingles': embarrassedVsPregnant,
  'que-significa-el-phrasal-verb-get-along-with': getAlongWith,
  'que-significa-la-expresion-hit-the-nail-on-the-head': hitTheNailOnTheHead,
  'que-significa-la-palabra-reluctant': reluctant,
  'como-se-forma-el-mixed-conditional-y-que-expresa': mixedConditional,
  'que-significa-el-phrasal-verb-bring-up': bringUp,
  'que-significa-la-expresion-cost-an-arm-and-a-leg': costAnArmAndALeg,
  'que-significa-la-palabra-tedious': tedious,
  'cual-es-la-diferencia-entre-say-y-tell-en-ingles': sayVsTell,
  'que-significa-el-phrasal-verb-figure-out': figureOut,
  'cual-es-la-diferencia-entre-exit-y-success-en-ingles': exitVsSuccess,
  'que-significa-we-ve-run-out-of-milk': runOutOfMilk,
  'que-significa-la-expresion-break-the-ice': breakTheIce,
  'como-se-usa-overwhelming-para-describir-una-carga-de-trabajo': overwhelmingWork,
  'cuando-usar-have-done-y-cuando-did-en-ingles': presentPerfectVsPastSimple,
  'que-significa-i-came-across-an-old-photo-yesterday': cameAcrossPhoto,
  'que-significa-la-expresion-on-the-same-page': onTheSamePage,
  'que-significa-la-palabra-insightful': insightful,
  'como-se-usa-la-estructura-the-more-the-more': theMoreTheMore,
  'que-significa-el-phrasal-verb-set-up': setUp,
  'que-significa-actually-en-actually-i-don-t-like-coffee': actuallyNotCurrently,
};
