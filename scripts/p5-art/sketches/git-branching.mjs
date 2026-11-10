// scripts/p5-art/sketches/git-branching.mjs — estrategias de branching, flags y PRs.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, treeNode } from '../primitives.mjs';

export function quePrincipioGobiernaTodaEstrategiaDeBranching(p) {
  baseBg(p);
  badge(p, 256, 110, 'integrar pronto y en piezas pequeñas', { color: AMBER, size: 18, w: 380 });
  p.arrow(256, 132, 256, 180, { color: AMBER });
  const rows = [
    ['menos divergencia', CYAN],
    ['menos conflictos', GREEN],
    ['menos WIP perdido', MAGENTA],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 220 + i * 70, label, { color, size: 18, w: 240 });
  });
  caption(p, 'todo lo demás es estilo', 256, 440, { color: TEXT, size: 20 });
  caption(p, 'el modelo sirve al flujo, no al revés', 256, 475, { color: MUTED, size: 16 });
}

export function queRamasUsaGitflowYParaQueSoftwareAplica(p) {
  baseBg(p);
  const rows = [
    ['main', 'producción', GREEN],
    ['develop', 'integración', CYAN],
    ['feature/*', '→ develop', MAGENTA],
    ['release/*', '→ main', AMBER],
    ['hotfix/*', '→ main', MAGENTA],
  ];
  rows.forEach(([name, what, color], i) => {
    stackFrame(p, 50, 105 + i * 66, 190, 44, name, { color, size: 17 });
    caption(p, what, 340, 127 + i * 66, { color: TEXT, size: 17 });
  });
  caption(p, 'versionado con calendario', 256, 445, { color: MUTED, size: 16 });
  caption(p, 'instalable fuera de línea (apps)', 256, 480, { color: MUTED, size: 15 });
}

export function queCaracterizaAGithubFlowYCualesSonSusLimites(p) {
  baseBg(p);
  treeNode(p, 256, 120, 'main', { color: GREEN, r: 40, size: 18 });
  treeNode(p, 140, 280, 'rama', { color: CYAN, r: 32, size: 18 });
  treeNode(p, 372, 280, 'rama', { color: CYAN, r: 32, size: 18 });
  p.arrow(286, 145, 165, 252, { color: MUTED });
  p.arrow(226, 145, 347, 252, { color: MUTED });
  badge(p, 256, 360, 'branch → PR → review → deploy', { color: CYAN, size: 17, w: 330 });
  caption(p, 'límite: main siempre desplegable', 256, 420, { color: TEXT, size: 17 });
  caption(p, 'sin flags, requiere feature completa', 256, 460, { color: MUTED, size: 16 });
}

export function enQueConsisteTrunkBasedDevelopment(p) {
  baseBg(p);
  p.push();
  p.stroke(GREEN);
  p.strokeWeight(5);
  p.line(80, 200, 432, 200);
  p.pop();
  [150, 240, 330, 400].forEach((x, i) => {
    const up = i % 2 === 0;
    p.push();
    p.stroke(CYAN);
    p.strokeWeight(3);
    p.noFill();
    p.dash('6 5');
    p.line(x, 200, x + 22, up ? 130 : 270);
    p.line(x + 22, up ? 130 : 270, x + 50, 200);
    p.dash(null);
    p.pop();
  });
  caption(p, 'main (trunk)', 256, 240, { color: GREEN, size: 19 });
  badge(p, 256, 330, 'ramas de vida < 1 día', { color: CYAN, size: 18, w: 280 });
  caption(p, 'small batches en serie hacia el trunk', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'con flags para lo que no acaba', 256, 440, { color: MUTED, size: 17 });
}

export function comoSeLiberanVersionesEnTrunkBasedDevelopment(p) {
  baseBg(p);
  const marks = [110, 200, 290, 380];
  marks.forEach((x, i) => {
    p.push();
    p.stroke(GREEN);
    p.strokeWeight(5);
    p.line(80, 200, 432, 200);
    p.pop();
    p.push();
    p.noStroke();
    p.fill(i === marks.length - 1 ? AMBER : MUTED);
    p.circle(x, 200, 18);
    p.pop();
  });
  badge(p, 160, 300, 'tag v1.4', { color: AMBER, size: 18, w: 140 });
  p.arrow(160, 280, 110, 215, { color: AMBER });
  caption(p, 'release-from-trunk', 256, 360, { color: TEXT, size: 19 });
  caption(p, 'cherry-pick de fixes a la rama de release', 256, 430, { color: MUTED, size: 17 });
  caption(p, 'si hace falta sostener versiones', 256, 465, { color: MUTED, size: 15 });
}

export function queDiferenciaHayEntreIntegrarUnPRConMergeSquashO(p) {
  baseBg(p);
  const cols = [
    ['merge', 'mantiene todos los commits', GREEN],
    ['squash', '1 commit por PR', CYAN],
    ['rebase', 'series sin nodo de unión', AMBER],
  ];
  cols.forEach(([name, what, color], i) => {
    const x = 60 + i * 132;
    stackFrame(p, x, 120, 120, 60, name, { color, size: 18 });
    caption(p, what, x + 60, 230, { color: TEXT, size: 14 });
    dots(p, x + 20, 280, x + 100, { color });
  });
  caption(p, 'mismo contenido final', 256, 380, { color: TEXT, size: 20 });
  caption(p, 'distinto historial para leer y bisectar', 256, 420, { color: MUTED, size: 17 });
  caption(p, 'elige una política de equipo', 256, 465, { color: MUTED, size: 16 });
}

export function queProblemaResuelveUnaColaDeMerge(p) {
  baseBg(p);
  const rows = ['PR-7 ok', 'PR-8 falla', 'PR-9 espera', 'PR-10 espera'];
  rows.forEach((label, i) => {
    stackFrame(p, 60, 105 + i * 60, 200, 44, label, { color: i === 1 ? MAGENTA : CYAN, size: 17 });
  });
  p.arrow(266, 200, 316, 200, { color: AMBER });
  badge(p, 390, 150, 're-test sobre el', { color: AMBER, size: 15, w: 130 });
  badge(p, 390, 210, 'trunk unido', { color: AMBER, size: 15, w: 120 });
  caption(p, 'merge serial: verde de verdad', 256, 400, { color: TEXT, size: 18 });
  caption(p, 'sin carriles paralelos que chocan', 256, 460, { color: MUTED, size: 16 });
}

export function queDesacoplanLosFeatureFlags(p) {
  baseBg(p);
  box(p, 80, 120, 160, 90, { color: GREEN, label: 'deploy' });
  box(p, 272, 120, 160, 90, { color: AMBER, label: 'release' });
  p.arrow(246, 165, 266, 165, { color: CYAN });
  badge(p, 256, 280, 'desplegar ≠ liberar', { color: CYAN, size: 20, w: 260 });
  caption(p, 'el código llega apagado', 256, 340, { color: TEXT, size: 18 });
  caption(p, 'y se enciende sin rehacer main', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'merge sin esperar al 100 %', 256, 465, { color: MUTED, size: 16 });
}

export function queTiposDeFeatureFlagsExisten(p) {
  baseBg(p);
  const rows = [
    ['release', 'encender una feature', GREEN],
    ['ops', 'matar switches', CYAN],
    ['experimento', 'A/B estadístico', AMBER],
    ['permiso', 'acceso por plan', MAGENTA],
  ];
  rows.forEach(([name, what, color], i) => {
    stackFrame(p, 50, 105 + i * 66, 170, 44, name, { color, size: 17 });
    caption(p, what, 360, 127 + i * 66, { color: TEXT, size: 16 });
  });
  caption(p, 'experimento: corta vida obligatoria', 256, 445, { color: MUTED, size: 15 });
  caption(p, 'permiso: puede vivir siempre', 256, 480, { color: MUTED, size: 15 });
}

export function quePracticasSanasExigeElUsoDeFeatureFlags(p) {
  baseBg(p);
  const rows = [
    ['flag nuevo ⇒ borrar el viejo', MAGENTA],
    ['naming por intención, no fecha', CYAN],
    ['pocas variantes por combinación', AMBER],
    ['defaults: off en prod, on en dev', GREEN],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 120 + i * 80, label, { color, size: 16, w: 340 });
  });
  caption(p, 'los flags son deuda con fecha', 256, 465, { color: MUTED, size: 17 });
}
