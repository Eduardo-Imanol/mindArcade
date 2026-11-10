// scripts/p5-art/sketches/git-hooks.mjs — ciclo de vida de los hooks y ConvCommits.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dots, stackFrame, varChip } from '../primitives.mjs';

export function queEsUnHookDeGitYDondeVive(p) {
  baseBg(p);
  box(p, 70, 110, 372, 150, { color: CYAN, label: '.git/hooks/' });
  varChip(p, 170, 210, 'pre-commit', { w: 150, color: MAGENTA, size: 17 });
  varChip(p, 340, 210, 'commit-msg', { w: 150, color: MAGENTA, size: 17 });
  caption(p, 'ejecutables que Git lanza solos', 256, 330, { color: TEXT, size: 20 });
  caption(p, 'el output decides tú, el momento decide Git', 256, 430, { color: MUTED, size: 17 });
}

export function queEfectoTieneUnCodigoDeSalidaDistintoDeCeroEnUn(p) {
  baseBg(p);
  badge(p, 256, 110, 'pre-commit → exit 1', { color: MAGENTA, size: 19, w: 290 });
  p.arrow(256, 132, 256, 180, { color: MAGENTA });
  badge(p, 256, 210, 'commit cancelado', { color: AMBER, size: 20, w: 240 });
  p.arrow(256, 232, 256, 280, { color: AMBER });
  caption(p, 'pre-receive → push rechazado', 256, 320, { color: TEXT, size: 19 });
  caption(p, 'el código de salida es la interfaz', 256, 430, { color: MUTED, size: 18 });
  caption(p, 'stdin/stdout completan el contrato', 256, 465, { color: MUTED, size: 16 });
}

export function porQueLosHooksNoSeClonanYComoSeDistribuyen(p) {
  baseBg(p);
  box(p, 60, 120, 150, 100, { color: CYAN, label: '.git/hooks' });
  caption(p, 'no viaja', 135, 195, { color: MAGENTA, size: 18 });
  box(p, 302, 120, 150, 100, { color: GREEN, label: 'repo compartido' });
  caption(p, 'sí viaja', 377, 195, { color: GREEN, size: 18 });
  badge(p, 256, 300, 'core.hooksPath → gestionado', { color: AMBER, size: 17, w: 300 });
  caption(p, 'husky / pre-commit / npx install', 256, 360, { color: TEXT, size: 17 });
  caption(p, 'hooks con dependencias, versionados', 256, 460, { color: MUTED, size: 17 });
}

export function queHooksSeEjecutanDuranteUnGitCommitYEnQueOrden(p) {
  baseBg(p);
  const rows = [
    ['pre-commit', 'lint rápido', CYAN],
    ['prepare-commit-msg', 'plantilla', MAGENTA],
    ['commit-msg', 'valida mensaje', AMBER],
    ['post-commit', 'notifica', GREEN],
  ];
  rows.forEach(([name, what, color], i) => {
    stackFrame(p, 60, 110 + i * 70, 250, 44, name, { color, size: 17 });
    caption(p, what, 420, 132 + i * 70, { color: MUTED, size: 17 });
  });
  caption(p, 'el orden no es negociable', 256, 440, { color: MUTED, size: 18 });
}

export function queDiferenciaHayEntreLosHooksDelClienteYLosDelSer(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: CYAN, label: 'cliente' });
  caption(p, 'tu máquina', 150, 190, { color: TEXT, size: 18 });
  caption(p, '--no-verify los', 150, 225, { color: MAGENTA, size: 17 });
  caption(p, 'saltará todo', 150, 255, { color: MAGENTA, size: 17 });
  badge(p, 150, 305, 'opt-in', { color: CYAN, size: 17, w: 110 });
  box(p, 267, 120, 190, 220, { color: GREEN, label: 'servidor' });
  caption(p, 'pre-receive', 362, 190, { color: TEXT, size: 18 });
  caption(p, 'update /', 362, 225, { color: TEXT, size: 18 });
  caption(p, 'post-receive', 362, 255, { color: TEXT, size: 18 });
  badge(p, 362, 305, 'obliga', { color: GREEN, size: 17, w: 110 });
  caption(p, 'política real = servidor', 256, 410, { color: TEXT, size: 18 });
  caption(p, 'el cliente solo educa', 256, 450, { color: MUTED, size: 17 });
}

export function porQueUnPreCommitDebeLintearSoloLoStaged(p) {
  baseBg(p);
  box(p, 60, 130, 130, 90, { color: GREEN, label: 'staged' });
  box(p, 322, 130, 130, 90, { color: MUTED, label: 'worktree' });
  badge(p, 256, 280, 'lint(staged) · <= 5 s', { color: CYAN, size: 18, w: 280 });
  caption(p, 'si lintea todo, se salta el hook', 256, 340, { color: TEXT, size: 18 });
  caption(p, 'rápido y preciso = confiable', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'los errores ajenos bloquean al inocente', 256, 465, { color: MUTED, size: 16 });
}

export function queFormatoValidanLasHerramientasDeConventionalComm(p) {
  baseBg(p);
  badge(p, 256, 110, 'feat(parser): detecta EOF', { color: CYAN, size: 18, w: 340 });
  caption(p, 'tipo(ámbito): descripción', 256, 180, { color: TEXT, size: 19 });
  caption(p, 'cuerpo y BREAKING CHANGE!', 256, 220, { color: MUTED, size: 17 });
  badge(p, 256, 310, 'commitlint valida el patrón', { color: GREEN, size: 17, w: 290 });
  caption(p, 'feat · fix · docs · refactor · chore', 256, 370, { color: MUTED, size: 17 });
  caption(p, 'commit-msg es el guardián', 256, 460, { color: MUTED, size: 17 });
}

export function comoMapeanLosConventionalCommitsAVersionesSemver(p) {
  baseBg(p);
  varChip(p, 130, 130, 'feat', { w: 110, color: CYAN });
  varChip(p, 130, 220, 'fix', { w: 110, color: GREEN });
  varChip(p, 130, 310, 'BREAKING', { w: 150, color: MAGENTA, size: 17 });
  p.arrow(190, 130, 240, 170, { color: CYAN });
  p.arrow(190, 220, 240, 220, { color: GREEN });
  p.arrow(210, 310, 240, 270, { color: MAGENTA });
  badge(p, 330, 170, 'MINOR', { color: CYAN, size: 22, w: 140 });
  badge(p, 330, 220, 'PATCH', { color: GREEN, size: 22, w: 140 });
  badge(p, 330, 270, 'MAJOR', { color: MAGENTA, size: 22, w: 140 });
  caption(p, 'semver desde el historial', 256, 380, { color: TEXT, size: 19 });
  caption(p, 'release automático sin adivinar', 256, 465, { color: MUTED, size: 17 });
}

export function queResuelveLintStagedAdemasDeFiltrarArchivos(p) {
  baseBg(p);
  badge(p, 256, 110, 'lint-staged', { color: CYAN, size: 24, w: 220 });
  const rows = [
    ['reaplica formato en un solo commit', AMBER],
    ['-a en prettier, sin sorpresas', GREEN],
    ['backups: aborta sin perder staged', MAGENTA],
  ];
  rows.forEach(([label, color], i) => {
    caption(p, label, 256, 200 + i * 55, { color: TEXT, size: 17 });
    dots(p, 100, 200 + i * 55, 130, { color });
  });
  caption(p, 'solo toca los archivos en la zona media', 256, 440, { color: MUTED, size: 16 });
  caption(p, 'staged = zona media', 256, 475, { color: MUTED, size: 15 });
}

export function quePrincipiosDeDisenoEvitanQueElEquipoSeSalteLosH(p) {
  baseBg(p);
  const rows = [
    ['rápido: 100 % bajo 5 s', CYAN],
    ['determinista: nunca falsos +', GREEN],
    ['-X ours autocorrige lo tonto', AMBER],
    ['sin veto por lo no tocado', MAGENTA],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 130 + i * 78, label, { color, size: 16, w: 330 });
  });
  caption(p, 'fricción baja = bypass = nadie', 256, 460, { color: MUTED, size: 17 });
}
