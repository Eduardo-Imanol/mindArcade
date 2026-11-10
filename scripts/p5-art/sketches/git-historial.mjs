// scripts/p5-art/sketches/git-historial.mjs — rebase, bisect, reflog, gc y secretos.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, treeNode } from '../primitives.mjs';

export function queHaceRealmenteGitRebaseConLosCommits(p) {
  baseBg(p);
  [130, 175, 220].forEach((y) => stackFrame(p, 60, y, 160, 38, 'c' + ((y - 85) / 45), { color: CYAN, size: 18 }));
  p.arrow(110, 260, 110, 300, { color: AMBER });
  [320, 365, 410].forEach((y) => stackFrame(p, 60, y, 160, 38, "c'", { color: AMBER, size: 18 }));
  badge(p, 370, 175, 'copia + re-aplica', { color: AMBER, size: 18, w: 230 });
  p.arrow(226, 175, 286, 330, { color: GREEN });
  stackFrame(p, 292, 310, 160, 38, 'main', { color: GREEN, size: 18 });
  caption(p, 'commits nuevos, no movidos', 256, 470, { color: MUTED, size: 17 });
}

export function queConservaYQueCambiaElRebaseEnCadaCommit(p) {
  baseBg(p);
  box(p, 55, 120, 190, 210, { color: GREEN, label: 'conserva' });
  caption(p, 'autor', 150, 190, { color: TEXT, size: 20 });
  caption(p, 'fecha autora', 150, 230, { color: TEXT, size: 20 });
  caption(p, 'mensaje', 150, 270, { color: TEXT, size: 20 });
  caption(p, 'diff', 150, 310, { color: TEXT, size: 20 });
  box(p, 267, 120, 190, 210, { color: MAGENTA, label: 'cambia' });
  caption(p, 'committer', 362, 190, { color: TEXT, size: 20 });
  caption(p, 'fecha commit', 362, 230, { color: TEXT, size: 20 });
  caption(p, 'hash', 362, 270, { color: TEXT, size: 20 });
  caption(p, 'padres', 362, 310, { color: TEXT, size: 20 });
  caption(p, 'identidad ≠ contenido', 256, 420, { color: MUTED, size: 18 });
}

export function comoEvitaElRebaseReaplicarUnCambioYaPresenteEnElD(p) {
  baseBg(p);
  stackFrame(p, 60, 120, 160, 44, 'X', { color: CYAN, size: 20 });
  stackFrame(p, 292, 120, 160, 44, 'X (equiv)', { color: GREEN, size: 16 });
  p.arrow(226, 142, 286, 142, { color: AMBER });
  badge(p, 256, 240, 'diff-de-diff (patch-id)', { color: AMBER, size: 17, w: 260 });
  caption(p, 'mismo parche ya integrado', 256, 300, { color: TEXT, size: 18 });
  caption(p, '⇒ se salta sin duplicar', 256, 340, { color: TEXT, size: 18 });
  caption(p, '--no-reapply-cherry-picks al gusto', 256, 460, { color: MUTED, size: 15 });
}

export function comoSeLeeGitRebaseOntoMainFeature1Feature2(p) {
  baseBg(p);
  treeNode(p, 256, 110, 'main', { color: GREEN, r: 40, size: 18 });
  treeNode(p, 110, 260, 'f1', { color: CYAN, r: 34, size: 19 });
  treeNode(p, 256, 260, 'f2', { color: MAGENTA, r: 34, size: 19 });
  treeNode(p, 400, 260, 'nuevo', { color: AMBER, r: 36, size: 17 });
  p.arrow(256, 150, 140, 232, { color: MUTED });
  p.arrow(256, 150, 256, 232, { color: MUTED });
  p.arrow(256, 150, 380, 232, { color: AMBER });
  caption(p, 'nuevo = f2 sin f1, sobre main', 256, 350, { color: TEXT, size: 18 });
  caption(p, 'abandonar el tronco viejo', 256, 390, { color: TEXT, size: 18 });
  caption(p, 'nuevo', 400, 320, { color: AMBER, size: 16 });
  caption(p, 'f2', 256, 320, { color: MAGENTA, size: 16 });
  caption(p, 'f1', 110, 320, { color: CYAN, size: 16 });
  caption(p, 'transplante de una serie a otra base', 256, 465, { color: MUTED, size: 16 });
}

export function cuandoConvieneRebaseYCualConvendriaMerge(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: CYAN, label: 'rebase' });
  caption(p, 'historial lineal', 150, 190, { color: TEXT, size: 18 });
  caption(p, 'ramas privadas', 150, 230, { color: TEXT, size: 18 });
  caption(p, 'antes de abrir PR', 150, 270, { color: TEXT, size: 17 });
  badge(p, 150, 320, 'reescrito', { color: CYAN, size: 16, w: 140 });
  box(p, 267, 120, 190, 220, { color: GREEN, label: 'merge' });
  caption(p, 'conserva la verdad', 362, 190, { color: TEXT, size: 17 });
  caption(p, 'compartida', 362, 225, { color: TEXT, size: 17 });
  caption(p, 'auditoría', 362, 265, { color: TEXT, size: 18 });
  badge(p, 362, 320, 'inmutable', { color: GREEN, size: 16, w: 140 });
  caption(p, 'público ⇒ merge', 256, 410, { color: TEXT, size: 19 });
  caption(p, 'privado ⇒ rebase', 256, 450, { color: TEXT, size: 19 });
}

export function queRiesgoOcultoTieneUnaSerieDeCommitsRebaseada(p) {
  baseBg(p);
  [110, 155, 200].forEach((y, i) => stackFrame(p, 60, y, 150, 38, `c${i + 1}`, { color: CYAN, size: 18 }));
  [110, 155, 200].forEach((y, i) => stackFrame(p, 300, y, 150, 38, `c${i + 1}'`, { color: AMBER, size: 18 }));
  badge(p, 256, 280, 'hashes distintos, parches iguales', { color: AMBER, size: 16, w: 330 });
  caption(p, 'cherry-pick y revert se confunden', 256, 340, { color: TEXT, size: 18 });
  caption(p, 'el mismo cambio parece dos', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'fixes se pierden: solo parches se duplican', 256, 460, { color: MUTED, size: 15 });
}

export function queHacenSquashYFixupEnRebaseInteractivo(p) {
  baseBg(p);
  const rows = [
    ['pick c1 · login', CYAN],
    ['fixup c2 · typo', MAGENTA],
    ['squash c3 · nit', AMBER],
  ];
  rows.forEach(([label, color], i) => stackFrame(p, 70, 110 + i * 70, 372, 44, label, { color, size: 17 }));
  p.arrow(256, 320, 256, 360, { color: GREEN });
  stackFrame(p, 90, 365, 332, 44, 'pick c1 (mensajes fusionados)', { color: GREEN, size: 17 });
  caption(p, 'fixup tira el mensaje · squash lo suma', 256, 460, { color: MUTED, size: 16 });
}

export function comoSeAutomatizanLosFixupEnRebaseInteractivo(p) {
  baseBg(p);
  badge(p, 256, 110, 'commit --fixup=<sha>', { color: CYAN, size: 19, w: 300 });
  p.arrow(256, 132, 256, 175, { color: CYAN });
  badge(p, 256, 200, 'rebase -i --autosquash', { color: MAGENTA, size: 19, w: 300 });
  p.arrow(256, 222, 256, 265, { color: MAGENTA });
  stackFrame(p, 70, 270, 372, 44, 'fixup! colocado sobre su pick', { color: GREEN, size: 17 });
  caption(p, 'reordenar a mano: nunca más', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'rebase.autoSquash = true', 256, 460, { color: MUTED, size: 17 });
}

export function quePasaCuandoSeReescribeUnaHistoriaYaCompartida(p) {
  baseBg(p);
  box(p, 60, 120, 150, 80, { color: CYAN, label: 'tú' });
  box(p, 302, 120, 150, 80, { color: MAGENTA, label: 'equipo' });
  p.arrow(216, 160, 296, 160, { color: AMBER });
  badge(p, 256, 240, 'reescritura divergente', { color: AMBER, size: 18, w: 240 });
  caption(p, 'cada push rechaza al otro', 256, 300, { color: TEXT, size: 18 });
  caption(p, 'forzar rompe el trabajo ajeno', 256, 340, { color: MAGENTA, size: 18 });
  badge(p, 256, 420, 'protocolo: avisar y coordinar', { color: GREEN, size: 17, w: 300 });
}

export function queGarantizaForceWithLeaseYComoPuedeFallar(p) {
  baseBg(p);
  badge(p, 256, 110, '--force-with-lease', { color: CYAN, size: 22, w: 300 });
  caption(p, 'solo fuerza si el remoto', 256, 180, { color: TEXT, size: 19 });
  caption(p, 'sigue donde tú lo dejaste', 256, 220, { color: TEXT, size: 19 });
  badge(p, 256, 300, 'cierra la ventana de carrera', { color: GREEN, size: 17, w: 290 });
  caption(p, 'falla si: fetch previo aparte', 256, 370, { color: MAGENTA, size: 17 });
  caption(p, 'o prefijos del gestor de credenciales', 256, 410, { color: MAGENTA, size: 16 });
  caption(p, 'una comprobación, no un candado eterno', 256, 465, { color: MUTED, size: 16 });
}

export function comoSeTransplantanSoloTusCommitsTrasUnaReescrituraA(p) {
  baseBg(p);
  badge(p, 256, 105, 'rebase --onto', { color: CYAN, size: 22, w: 250 });
  caption(p, '1. reposiciona la base nueva', 256, 175, { color: TEXT, size: 18 });
  caption(p, '2. toma solo lo tuyo', 256, 215, { color: TEXT, size: 18 });
  caption(p, '3. salta lo ya integrado', 256, 255, { color: TEXT, size: 18 });
  badge(p, 256, 340, 'sin duplicar trabajo ajeno', { color: GREEN, size: 18, w: 290 });
  caption(p, 'cherry-pick de muchos de golpe', 256, 430, { color: MUTED, size: 18 });
  caption(p, 'upstream nuevo', 256, 465, { color: MUTED, size: 16 });
}

export function sobreQueRangoOperaGitBisectYComoEligeElCommitAPr(p) {
  baseBg(p);
  const xs = [80, 170, 260, 350, 440];
  xs.forEach((x, i) => {
    const bad = i === xs.length - 1;
    const good = i === 0;
    p.push();
    p.noStroke();
    p.fill(good ? GREEN : bad ? MAGENTA : CYAN);
    p.circle(x, 180, 34);
    p.pop();
    p.push();
    p.noStroke();
    p.fill(TEXT);
    p.text(good ? 'g' : bad ? 'b' : '?', x, 180, { size: 18 });
    p.pop();
  });
  p.arrow(256, 230, 256, 275, { color: AMBER });
  badge(p, 256, 305, 'prueba el punto medio', { color: AMBER, size: 18, w: 240 });
  caption(p, 'bisect old..new reduce a la mitad', 256, 390, { color: TEXT, size: 18 });
  caption(p, 'good/bad recortan el rango', 256, 430, { color: MUTED, size: 17 });
}

export function cuantasPruebasNecesitaBisectParaUnMillonDeCommits(p) {
  baseBg(p);
  badge(p, 256, 120, '2²⁰ = 1.048.576', { color: CYAN, size: 24, w: 300 });
  p.arrow(256, 145, 256, 195, { color: CYAN });
  badge(p, 256, 225, '≈ 20 pruebas', { color: GREEN, size: 28, w: 240 });
  caption(p, 'búsqueda binaria sobre commits', 256, 320, { color: TEXT, size: 20 });
  caption(p, 'log₂ del rango', 256, 360, { color: MUTED, size: 18 });
  dots(p, 150, 450, 360, { color: GREEN });
}

export function queCodigosDeSalidaUsaUnScriptDeBisectRun(p) {
  baseBg(p);
  const rows = [
    ['0', 'good: antes del bug', GREEN],
    ['1-124', 'bad: contiene el bug', MAGENTA],
    ['125', 'no compilable: se salta', AMBER],
  ];
  rows.forEach(([code, label, color], i) => {
    badge(p, 110, 130 + i * 90, code, { color, size: 20, w: 120 });
    caption(p, label, 330, 130 + i * 90, { color: TEXT, size: 17 });
  });
  caption(p, 'git bisect run make test', 256, 440, { color: MUTED, size: 18 });
  caption(p, 'bisect desatendido', 256, 475, { color: MUTED, size: 16 });
}

export function queEsElReflogYQueContiene(p) {
  baseBg(p);
  box(p, 70, 110, 372, 240, { color: CYAN, label: 'reflog (local y privado)' });
  stackFrame(p, 95, 165, 322, 40, 'checkout: main→feat', { color: TEXT, size: 16 });
  stackFrame(p, 95, 213, 322, 40, 'commit: abc1234', { color: TEXT, size: 16 });
  stackFrame(p, 95, 261, 322, 40, 'reset: HEAD@{2}', { color: TEXT, size: 16 });
  caption(p, 'dónde estuvo cada ref', 256, 400, { color: TEXT, size: 21 });
  caption(p, 'la red de seguridad del desastre', 256, 460, { color: MUTED, size: 18 });
}

export function cuantoVivenLasEntradasDelReflog(p) {
  baseBg(p);
  badge(p, 256, 110, '90 días · HEAD', { color: CYAN, size: 22, w: 300 });
  badge(p, 256, 190, '30 días · ramas remotas', { color: MAGENTA, size: 20, w: 300 });
  badge(p, 256, 270, 'reflogExpire', { color: AMBER, size: 18, w: 240 });
  caption(p, 'tras expirar, la gc puede borrar', 256, 350, { color: TEXT, size: 19 });
  caption(p, 'lo huérfano para siempre', 256, 390, { color: TEXT, size: 19 });
  caption(p, 'recuperar = antes de que expire', 256, 465, { color: MUTED, size: 17 });
}

export function comoSeRecuperanCambiosQueSoloEstuvieronEnElIndice(p) {
  baseBg(p);
  badge(p, 256, 110, 'git add . (nunca commit)', { color: AMBER, size: 19, w: 310 });
  p.arrow(256, 132, 256, 175, { color: AMBER });
  box(p, 106, 180, 300, 80, { color: CYAN, label: 'git fsck --lost-found' });
  p.arrow(256, 265, 256, 305, { color: CYAN });
  badge(p, 256, 335, 'dangling blob → rescata', { color: GREEN, size: 18, w: 280 });
  caption(p, 'el add ya calculó el hash', 256, 420, { color: TEXT, size: 18 });
  caption(p, 'el objeto existe aunque nadie lo cite', 256, 465, { color: MUTED, size: 16 });
}

export function queModeloDeRecoleccionDeBasuraUsaGitYCualesSonLas(p) {
  baseBg(p);
  const roots = [
    ['refs', CYAN],
    ['HEAD', GREEN],
    ['index', AMBER],
    ['reflog', MAGENTA],
  ];
  roots.forEach(([label, color], i) => {
    badge(p, 256, 120 + i * 70, label, { color, size: 18, w: 130 });
  });
  p.arrow(256, 400, 256, 350, { color: MUTED });
  badge(p, 256, 425, 'alcance desde las raíces', { color: MUTED, size: 17, w: 270 });
  caption(p, 'lo inalcanzable es basura potencial', 256, 480, { color: MUTED, size: 16 });
}

export function queTareasEjecutaGitGc(p) {
  baseBg(p);
  const rows = [
    ['repack → packfiles', CYAN],
    ['poda reflog y sueltos', MAGENTA],
    ['commit-graph + bitmaps', AMBER],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 130 + i * 80, label, { color, size: 17, w: 290 });
  });
  caption(p, 'cuidado con gc.pruneExpire', 256, 440, { color: TEXT, size: 18 });
  caption(p, '2 semanas por defecto', 256, 480, { color: MUTED, size: 16 });
}

export function porQueUnSecretoFiltradoSeConsideraComprometidoAunq(p) {
  baseBg(p);
  badge(p, 256, 110, 'push con clave', { color: MAGENTA, size: 22, w: 260 });
  p.arrow(256, 132, 256, 175, { color: MAGENTA });
  box(p, 106, 180, 300, 80, { color: AMBER, label: 'clones, forks, CI, caches' });
  p.arrow(256, 265, 256, 305, { color: AMBER });
  badge(p, 256, 335, 'borrar no deshace la copia', { color: MAGENTA, size: 16, w: 300 });
  caption(p, 'rota la clave: es lo único real', 256, 420, { color: TEXT, size: 19 });
  caption(p, 'git filter-repo solo limpia el futuro', 256, 465, { color: MUTED, size: 16 });
}
