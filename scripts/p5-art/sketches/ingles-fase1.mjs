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
};
