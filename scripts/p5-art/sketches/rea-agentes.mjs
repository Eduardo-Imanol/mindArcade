// scripts/p5-art/sketches/rea-agentes.mjs — REA: ingeniería inversa evidence-first + MCP.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT, VIOLET } from '../palette.mjs';
import { badge, box, caption, fnPill, stackFrame, varChip } from '../primitives.mjs';

export function queEsReaYComoSeDistribuye(p) {
  baseBg(p);
  badge(p, 256, 105, 'REA', { color: VIOLET, size: 34, w: 130 });
  caption(p, 'ingeniería inversa con agentes', 256, 165, { color: TEXT, size: 20 });
  badge(p, 150, 260, 'npm', { color: CYAN, size: 20, w: 100 });
  badge(p, 256, 260, 'npx', { color: CYAN, size: 20, w: 100 });
  badge(p, 362, 260, 'GitHub', { color: CYAN, size: 20, w: 130 });
  caption(p, 'JS puro · sin binarios propios', 256, 360, { color: TEXT, size: 18 });
  caption(p, 'los motores los aporta cada host', 256, 460, { color: MUTED, size: 17 });
}

export function queSignificaQueReaSeaUnaPlataformaEvidenceFirstDeS(p) {
  baseBg(p);
  badge(p, 256, 105, 'evidence-first', { color: VIOLET, size: 24, w: 250 });
  caption(p, 'cada afirmación nace de una observación', 256, 175, { color: TEXT, size: 17 });
  box(p, 60, 220, 180, 110, { color: MAGENTA, label: 'no escribe' });
  caption(p, 'el binario', 150, 310, { color: MAGENTA, size: 16 });
  box(p, 272, 220, 180, 110, { color: GREEN, label: 'solo lee' });
  caption(p, 'y reporta', 362, 310, { color: GREEN, size: 16 });
  badge(p, 256, 400, 'solo lectura sobre el artefacto', { color: AMBER, size: 16, w: 310 });
}

export function cualEsLaUnicaEscrituraQueReaAplicaSobreUnBinario(p) {
  baseBg(p);
  box(p, 70, 120, 372, 120, { color: CYAN, label: 'binario del proyecto' });
  badge(p, 256, 310, 'única excepción: flags de seguimiento', { color: MAGENTA, size: 16, w: 340 });
  caption(p, 'bytes del análisis: intactos', 256, 380, { color: TEXT, size: 18 });
  caption(p, 'el hash lo demuestra', 256, 460, { color: MUTED, size: 17 });
}

export function queUsosAutorizaElDisclaimerDeReaYCualesProhibe(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: GREEN, label: 'autoriza' });
  caption(p, 'tu propio software', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'malware en sandbox', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'educación', 150, 260, { color: TEXT, size: 16 });
  caption(p, 'CTF', 150, 295, { color: TEXT, size: 16 });
  box(p, 267, 120, 190, 220, { color: MAGENTA, label: 'prohíbe' });
  caption(p, 'piratería', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'romper licencias', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'uso en producción', 362, 260, { color: TEXT, size: 16 });
  caption(p, 'ajeno', 362, 295, { color: TEXT, size: 16 });
  caption(p, 'la herramienta no elude la ley', 256, 410, { color: MUTED, size: 16 });
}

export function queEsOpencodeYComoSeConfigura(p) {
  baseBg(p);
  badge(p, 256, 105, 'OpenCode', { color: VIOLET, size: 26, w: 200 });
  caption(p, 'agente de código en la terminal', 256, 165, { color: TEXT, size: 17 });
  box(p, 60, 220, 180, 90, { color: CYAN, label: 'opencode.json' });
  caption(p, 'o .jsonc', 150, 300, { color: MUTED, size: 15 });
  box(p, 272, 220, 180, 90, { color: GREEN, label: '~/.config' });
  caption(p, 'ámbito global', 362, 300, { color: MUTED, size: 15 });
  caption(p, 'skills, agentes y permisos', 256, 380, { color: TEXT, size: 17 });
  caption(p, 'REA vive aquí como skill de MCP', 256, 460, { color: MUTED, size: 16 });
}

export function queGarantizaLaParidadEntreElCliReaYElServidorMcp(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: CYAN, label: 'CLI rea' });
  caption(p, 'analyze --json', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'misma salida', 150, 230, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 200, { color: VIOLET, label: 'servidor MCP' });
  caption(p, 'tools → json', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'idéntica', 362, 230, { color: MUTED, size: 15 });
  p.arrow(248, 220, 264, 220, { color: GREEN });
  badge(p, 256, 380, 'un contrato, dos fachadas', { color: GREEN, size: 17, w: 290 });
  caption(p, 'los scripts no mienten al agente', 256, 460, { color: MUTED, size: 16 });
}

export function queHaceNpxReaAgentsSetup(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'npx rea-agents setup', { w: 320, h: 56, size: 24 });
  p.arrow(256, 140, 256, 185, { color: VIOLET });
  const rows = [
    ['detecta el host', CYAN],
    ['instala skill + agente', VIOLET],
    ['deja todo wired a MCP', GREEN],
  ];
  rows.forEach(([label, color], i) => {
    badge(p, 256, 215 + i * 70, label, { color, size: 17, w: 290 });
  });
  caption(p, 'OpenCode, Claude y amigos', 256, 460, { color: MUTED, size: 17 });
}

export function queTransportesExponeElServidorMcpDeRea(p) {
  baseBg(p);
  box(p, 70, 110, 372, 100, { color: VIOLET, label: 'servidor MCP de REA' });
  p.arrow(180, 215, 180, 265, { color: CYAN });
  p.arrow(332, 215, 332, 265, { color: MAGENTA });
  box(p, 60, 270, 240, 100, { color: CYAN, label: 'stdio' });
  caption(p, 'proceso hijo', 180, 355, { color: MUTED, size: 16 });
  box(p, 320, 270, 132, 100, { color: MAGENTA, label: 'HTTP' });
  caption(p, 'remoto', 386, 355, { color: MUTED, size: 16 });
  caption(p, 'streamable http / SSE heredado', 256, 430, { color: TEXT, size: 17 });
}

export function queDiferenciaDeCicloDeVidaHayEntreElTransporteStd(p) {
  baseBg(p);
  box(p, 55, 120, 190, 220, { color: CYAN, label: 'stdio' });
  caption(p, 'nace con el host', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'muere con el host', 150, 225, { color: TEXT, size: 16 });
  badge(p, 150, 290, 'sesión = proceso', { color: CYAN, size: 14, w: 170 });
  box(p, 267, 120, 190, 220, { color: MAGENTA, label: 'HTTP' });
  caption(p, 'arranca aparte', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'vive solo', 362, 225, { color: TEXT, size: 16 });
  badge(p, 362, 290, 'sesión = URL', { color: MAGENTA, size: 14, w: 150 });
  caption(p, 'estado y reinicio dependen de esto', 256, 400, { color: TEXT, size: 16 });
  caption(p, 'los archivos de sesión lo notan', 256, 460, { color: MUTED, size: 15 });
}

export function queControlaLaVariableReaMcpInputSchemaProfile(p) {
  baseBg(p);
  varChip(p, 256, 120, 'REA_MCP_INPUT_SCHEMA_PROFILE', { w: 350, color: VIOLET, size: 15 });
  p.arrow(256, 145, 256, 190, { color: VIOLET });
  badge(p, 256, 220, 'qué espera el servidor', { color: CYAN, size: 18, w: 260 });
  const rows = ['estrito · esquema cerrado', 'relajado · esquema abierto'];
  rows.forEach((label, i) => {
    badge(p, 256, 290 + i * 70, label, { color: i ? AMBER : GREEN, size: 16, w: 280 });
  });
  caption(p, 'valida argumentos de cada tool', 256, 460, { color: MUTED, size: 16 });
}

export function porQueExisteReaMcpOutputSchemaProfileYQuePreservan(p) {
  baseBg(p);
  varChip(p, 256, 110, 'REA_MCP_OUTPUT_SCHEMA_PROFILE', { w: 350, color: VIOLET, size: 15 });
  caption(p, 'moldea la respuesta', 256, 170, { color: TEXT, size: 18 });
  badge(p, 256, 250, 'resumen para el modelo', { color: CYAN, size: 17, w: 280 });
  badge(p, 256, 320, 'detalle para scripts', { color: GREEN, size: 17, w: 260 });
  caption(p, 'ambos preservan la semántica del JSON', 256, 400, { color: TEXT, size: 17 });
  caption(p, 'la forma cambia, el sentido no', 256, 460, { color: MUTED, size: 16 });
}

export function queEsReaFrenteALosMotoresQuePilota(p) {
  baseBg(p);
  box(p, 60, 120, 150, 110, { color: VIOLET, label: 'REA' });
  caption(p, 'coordina', 135, 195, { color: TEXT, size: 16 });
  box(p, 302, 105, 150, 60, { color: CYAN, label: 'Ghidra' });
  box(p, 302, 175, 150, 60, { color: CYAN, label: 'IDA' });
  box(p, 302, 245, 150, 60, { color: CYAN, label: 'LLDB' });
  box(p, 302, 315, 150, 60, { color: CYAN, label: 'radare2' });
  p.arrow(214, 175, 296, 135, { color: MUTED });
  p.arrow(214, 175, 296, 205, { color: MUTED });
  p.arrow(214, 175, 296, 275, { color: MUTED });
  p.arrow(214, 175, 296, 345, { color: MUTED });
  caption(p, 'director de orquesta, no motor', 256, 430, { color: TEXT, size: 17 });
  caption(p, 'contrato uniforme sobre engines distintos', 256, 470, { color: MUTED, size: 15 });
}

export function comoIntegraReaAGhidra(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: VIOLET, label: 'REA' });
  caption(p, 'client JS', 150, 185, { color: TEXT, size: 17 });
  caption(p, 'analyzeHeadless', 150, 225, { color: MUTED, size: 14 });
  box(p, 267, 120, 190, 200, { color: CYAN, label: 'Ghidra' });
  caption(p, 'puertoBridge', 362, 185, { color: TEXT, size: 16 });
  caption(p, 'plugin server', 362, 230, { color: MUTED, size: 14 });
  p.arrow(248, 200, 264, 200, { color: GREEN });
  badge(p, 256, 380, 'JVM ya levantada', { color: GREEN, size: 17, w: 220 });
  caption(p, 'headless reutiliza la sesión del bridge', 256, 460, { color: MUTED, size: 15 });
}

export function queVerificaReaConElHashSha256DelArtefacto(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'sha256', { w: 180, h: 60, size: 26 });
  p.arrow(256, 152, 256, 200, { color: CYAN });
  badge(p, 256, 230, 'no hay binario alternativo', { color: GREEN, size: 16, w: 310 });
  caption(p, 'cada sesión recuerda el hash', 256, 300, { color: TEXT, size: 18 });
  caption(p, 'y re-verifica al reabrir', 256, 340, { color: TEXT, size: 18 });
  caption(p, 'evidencia ligada al artefacto exacto', 256, 460, { color: MUTED, size: 16 });
}

export function queModeloUsaReaConHopperYQueCuidadoExige(p) {
  baseBg(p);
  box(p, 60, 120, 150, 110, { color: CYAN, label: 'Hopper' });
  caption(p, 'en tu Mac', 135, 195, { color: MUTED, size: 15 });
  box(p, 302, 120, 150, 110, { color: MAGENTA, label: 'macOS 14+' });
  caption(p, 'SDK actual', 377, 195, { color: MUTED, size: 15 });
  p.arrow(214, 175, 296, 175, { color: AMBER });
  badge(p, 256, 300, 'importa y exporta XML', { color: AMBER, size: 17, w: 270 });
  caption(p, 'rename dentro, REA lee desde fuera', 256, 360, { color: TEXT, size: 16 });
  caption(p, 'no pidas rendimiento de puentes', 256, 460, { color: MUTED, size: 15 });
}

export function comoSeInviertenLosPapelesConIdaYJeb(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: MAGENTA, label: 'IDA / JEB' });
  caption(p, 'el motor manda', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'carga REA como', 150, 225, { color: TEXT, size: 16 });
  caption(p, 'plugin', 150, 260, { color: TEXT, size: 16 });
  box(p, 267, 120, 190, 200, { color: GREEN, label: 'el resto' });
  caption(p, 'REA manda', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'y el motor', 362, 225, { color: TEXT, size: 16 });
  caption(p, 'obedece', 362, 260, { color: TEXT, size: 16 });
  badge(p, 256, 380, 'la inversión importa al pensar', { color: AMBER, size: 16, w: 320 });
  caption(p, 'quién vive a quién', 256, 460, { color: MUTED, size: 16 });
}

export function comoObservaReaProcesosConLldbEnMacos(p) {
  baseBg(p);
  badge(p, 256, 105, 'LLDB attach', { color: CYAN, size: 22, w: 220 });
  caption(p, 'procesos en vivo, no binarios quietos', 256, 165, { color: TEXT, size: 17 });
  badge(p, 256, 250, 'macOS pide permiso', { color: MAGENTA, size: 18, w: 250 });
  caption(p, 'modo desarrollador o Ajustes', 256, 310, { color: MUTED, size: 16 });
  caption(p, 'SysPrefs → Privacidad', 256, 350, { color: MUTED, size: 16 });
  caption(p, 'el registro cambia por observación', 256, 430, { color: TEXT, size: 16 });
  caption(p, 'heap y JIT cuentan otra historia', 256, 465, { color: MUTED, size: 15 });
}

export function cualEsElCicloTipicoDeUnaSesionDeAnalisisEnRea(p) {
  baseBg(p);
  const steps = ['cargar', 'nombrar', 'anotar', 'reportar'];
  steps.forEach((label, i) => {
    badge(p, 90 + i * 110, 160, label, { color: i === 3 ? GREEN : CYAN, size: 17, w: 100 });
    if (i < 3) p.arrow(144 + i * 110, 160, 176 + i * 110, 160, { color: MUTED });
  });
  caption(p, 'abrir binario → función → notas', 256, 260, { color: TEXT, size: 17 });
  badge(p, 256, 340, 'evidencia encadenada', { color: VIOLET, size: 18, w: 240 });
  caption(p, 'cada respuesta cita de dónde salió', 256, 400, { color: MUTED, size: 16 });
  caption(p, 'markdown exportable al final', 256, 465, { color: MUTED, size: 15 });
}

export function comoIdentificaReaUnaSesionYQueGanaAlReabrirUnBina(p) {
  baseBg(p);
  varChip(p, 256, 115, 'sha256(artefacto)', { w: 260, color: CYAN });
  p.arrow(256, 140, 256, 185, { color: CYAN });
  box(p, 106, 190, 300, 80, { color: VIOLET, label: '.rea/sesiones/<hash>' });
  caption(p, 'reabrir = continuar donde ibas', 256, 330, { color: TEXT, size: 17 });
  caption(p, 'nombres, notas y marcas persisten', 256, 370, { color: TEXT, size: 16 });
  caption(p, 'nada se pierde entre corridas', 256, 460, { color: MUTED, size: 15 });
}

export function comoDecideReaSiUnArgumentoDenotaUnaDireccionOUnSi(p) {
  baseBg(p);
  badge(p, 256, 110, 'arg: "0x1000f8"', { color: CYAN, size: 20, w: 260 });
  p.arrow(256, 132, 256, 180, { color: AMBER });
  badge(p, 256, 210, '¿hex completo ⇒ dirección?', { color: AMBER, size: 17, w: 300 });
  caption(p, 'si un símbolo casa: gana el símbolo', 256, 280, { color: TEXT, size: 17 });
  caption(p, '_main mejor que 0x1000040', 256, 320, { color: MUTED, size: 16 });
  caption(p, 'REA resuelve por contexto', 256, 460, { color: MUTED, size: 15 });
}

export function queFormatoAceptaYDevuelveReaParaDirecciones(p) {
  baseBg(p);
  badge(p, 256, 110, '0xdeadbeef', { color: CYAN, size: 24, w: 250 });
  caption(p, 'también decimal "3735928559"', 256, 170, { color: TEXT, size: 17 });
  p.arrow(256, 200, 256, 250, { color: GREEN });
  badge(p, 256, 280, 'devuelve hex sin 0x', { color: GREEN, size: 18, w: 260 });
  caption(p, 'big-endian, minúsculas, sin ceros de más', 256, 340, { color: TEXT, size: 15 });
  caption(p, 'un solo dialecto para todo', 256, 460, { color: MUTED, size: 15 });
}

export function queLimitesAplicanALasBusquedasRegexDeRea(p) {
  baseBg(p);
  badge(p, 256, 105, 'regex sobre bytes', { color: CYAN, size: 22, w: 280 });
  badge(p, 256, 190, 'tope de resultados', { color: AMBER, size: 17, w: 230 });
  badge(p, 256, 260, 'tope de contexto', { color: AMBER, size: 17, w: 230 });
  badge(p, 256, 330, 'timeout de cómputo', { color: MAGENTA, size: 17, w: 230 });
  caption(p, 'límites explícitos, nunca cuelgues', 256, 410, { color: TEXT, size: 17 });
  caption(p, 'paginar es la respuesta', 256, 460, { color: MUTED, size: 16 });
}

export function paraQueSirveElParametroDetailSummary(p) {
  baseBg(p);
  box(p, 55, 120, 190, 200, { color: CYAN, label: 'detail' });
  caption(p, 'todo el contexto', 150, 190, { color: TEXT, size: 16 });
  caption(p, 'bytes alrededor', 150, 225, { color: MUTED, size: 15 });
  caption(p, 'para el script', 150, 265, { color: MUTED, size: 15 });
  box(p, 267, 120, 190, 200, { color: GREEN, label: 'summary' });
  caption(p, 'lo esencial', 362, 190, { color: TEXT, size: 16 });
  caption(p, 'para el modelo', 362, 225, { color: MUTED, size: 15 });
  caption(p, 'tokens baratos', 362, 265, { color: MUTED, size: 15 });
  caption(p, 'mismo hallazgo, dos profundidades', 256, 400, { color: TEXT, size: 16 });
}

export function comoSePaginaUnaObservacionGrandeEnRea(p) {
  baseBg(p);
  stackFrame(p, 70, 120, 372, 60, 'observación de 40 KB', { color: CYAN, size: 17 });
  p.arrow(256, 185, 256, 230, { color: AMBER });
  stackFrame(p, 70, 235, 170, 50, 'página 1', { color: GREEN, size: 17 });
  stackFrame(p, 272, 235, 170, 50, 'página 2', { color: GREEN, size: 17 });
  stackFrame(p, 70, 295, 170, 50, 'página 3', { color: GREEN, size: 17 });
  stackFrame(p, 272, 295, 170, 50, '...', { color: MUTED, size: 17 });
  badge(p, 256, 420, 'cursor.nextPage', { color: AMBER, size: 17, w: 220 });
  caption(p, 'ventana de contexto intacta', 256, 470, { color: MUTED, size: 15 });
}

export function quePresupuestosDurosTieneTraceNativeValues(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'trace_native_values', { w: 330, h: 56, size: 19 });
  badge(p, 256, 220, 'límite de saltos', { color: AMBER, size: 17, w: 220 });
  badge(p, 256, 290, 'límite de tiempo', { color: AMBER, size: 17, w: 220 });
  badge(p, 256, 360, 'límite de nodos', { color: AMBER, size: 17, w: 220 });
  caption(p, 'el grafo de datos no explota el agente', 256, 440, { color: TEXT, size: 16 });
  caption(p, 'aborta y reporta lo alcanzado', 256, 475, { color: MUTED, size: 15 });
}

export function comoExportaReaUnBinarioEnteroSinReventarLaVentanaD(p) {
  baseBg(p);
  badge(p, 256, 105, 'exportar 500 MB', { color: MAGENTA, size: 20, w: 250 });
  p.arrow(256, 127, 256, 175, { color: GREEN });
  badge(p, 256, 205, 'trozos + cursor + reanudar', { color: GREEN, size: 17, w: 300 });
  caption(p, 'decompile_all en tandas', 256, 270, { color: TEXT, size: 17 });
  caption(p, 'cada tanda es una página', 256, 310, { color: TEXT, size: 16 });
  caption(p, 'la ventana de contexto respira', 256, 430, { color: TEXT, size: 16 });
  caption(p, 'no hay stdout monstruoso', 256, 465, { color: MUTED, size: 15 });
}

export function comoReanudaDecompileAllTrasUnFallo(p) {
  baseBg(p);
  const rows = ['100 ok', '101 falla', '102…reanuda'];
  rows.forEach((label, i) => {
    stackFrame(p, 70, 110 + i * 70, 372, 50, label, { color: i === 1 ? MAGENTA : CYAN, size: 17 });
  });
  badge(p, 256, 370, 'cursor salta lo ya hecho', { color: GREEN, size: 17, w: 290 });
  caption(p, 'reintenta solo lo pendiente', 256, 430, { color: TEXT, size: 17 });
  caption(p, 'idempotente por diseño', 256, 465, { color: MUTED, size: 15 });
}

export function queProveedoresCallerSuppliedYAlternativosAdmiteRea(p) {
  baseBg(p);
  box(p, 60, 120, 150, 110, { color: CYAN, label: 'caller' });
  caption(p, 'tú pasas el', 135, 195, { color: MUTED, size: 14 });
  caption(p, 'resultado', 135, 225, { color: MUTED, size: 14 });
  box(p, 302, 120, 150, 110, { color: VIOLET, label: 'alternativo' });
  caption(p, 'REA fabrica', 377, 195, { color: MUTED, size: 14 });
  caption(p, 'un proveedor', 377, 225, { color: MUTED, size: 14 });
  badge(p, 256, 300, 'inyección de dependencias', { color: AMBER, size: 16, w: 300 });
  caption(p, 'tests con dobles, prod con motor', 256, 360, { color: TEXT, size: 16 });
  caption(p, 'sin acoplarse a un solo engine', 256, 460, { color: MUTED, size: 15 });
}
