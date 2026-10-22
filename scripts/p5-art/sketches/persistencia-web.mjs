// scripts/p5-art/sketches/persistencia-web.mjs — secciones 0-2: panorama, cuotas y offline-first.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, dashRect, dots, fnPill, stackFrame, treeNode, varChip } from '../primitives.mjs';

export function dexieVersionYComplementos(p) {
  baseBg(p);
  badge(p, 256, 110, 'Dexie 4.x', { color: CYAN, size: 30, w: 190, h: 54 });
  varChip(p, 130, 250, 'react-hooks', { w: 160, color: MAGENTA });
  varChip(p, 382, 250, 'y-dexie', { w: 130, color: MAGENTA });
  varChip(p, 130, 340, 'cloud-addon', { w: 170, color: MAGENTA });
  varChip(p, 382, 340, 'y-dexie +', { w: 150, color: MUTED });
  caption(p, 'serie 4.4.x', 256, 60, { color: MUTED, size: 20 });
  caption(p, 'complementos oficiales', 256, 420, { color: MUTED, size: 22 });
  dots(p, 200, 460, 320, { color: CYAN });
}

export function wailsEstableYBeta(p) {
  baseBg(p);
  box(p, 60, 140, 180, 230, { color: GREEN, label: 'v2' });
  caption(p, 'estable', 150, 210, { color: TEXT, size: 24 });
  caption(p, '2.14', 150, 250, { color: GREEN, size: 26 });
  badge(p, 150, 320, 'prod', { color: GREEN, size: 20, w: 96 });
  box(p, 272, 140, 180, 230, { color: AMBER, label: 'v3' });
  caption(p, 'beta', 362, 210, { color: TEXT, size: 24 });
  caption(p, '3.0.0', 362, 250, { color: AMBER, size: 26 });
  badge(p, 362, 320, 'pre', { color: AMBER, size: 20, w: 96 });
  caption(p, 'no mezclar APIs', 256, 430, { color: MUTED, size: 22 });
}

export function sqliteWasmEnNavegador(p) {
  baseBg(p);
  box(p, 80, 170, 150, 120, { color: CYAN, label: 'SQLite' });
  p.arrow(236, 230, 300, 230, { color: CYAN });
  box(p, 306, 170, 130, 120, { color: GREEN, label: 'WASM' });
  caption(p, '@sqlite.org', 256, 350, { color: MUTED, size: 24 });
  caption(p, 'build oficial', 256, 395, { color: MUTED, size: 22 });
  badge(p, 256, 100, 'en el navegador', { color: MAGENTA, size: 22, w: 190 });
}

export function localStorageVsIndexedDB(p) {
  baseBg(p);
  box(p, 50, 130, 190, 260, { color: AMBER, label: 'localStorage' });
  caption(p, 'sincrono', 145, 200, { color: TEXT, size: 22 });
  caption(p, 'solo cadenas', 145, 240, { color: TEXT, size: 22 });
  caption(p, 'bloquea hilo', 145, 280, { color: AMBER, size: 20 });
  badge(p, 145, 340, '5 MiB', { color: AMBER, size: 20, w: 110 });
  box(p, 272, 130, 190, 260, { color: CYAN, label: 'IndexedDB' });
  caption(p, 'asíncrono', 367, 200, { color: TEXT, size: 22 });
  caption(p, 'stores + índices', 367, 240, { color: TEXT, size: 22 });
  caption(p, 'structured clone', 367, 280, { color: CYAN, size: 20 });
  badge(p, 367, 340, 'cuota', { color: CYAN, size: 20, w: 110 });
}

export function cacheApiDelNavegador(p) {
  baseBg(p);
  box(p, 140, 110, 230, 290, { color: CYAN, label: 'Cache API' });
  varChip(p, 200, 200, 'Request', { w: 130, color: MAGENTA });
  p.arrow(200, 230, 200, 280, { color: CYAN });
  varChip(p, 200, 310, 'Response', { w: 140, color: GREEN });
  caption(p, 'recursos estáticos', 256, 440, { color: MUTED, size: 22 });
}

export function opfsYSusUsos(p) {
  baseBg(p);
  box(p, 120, 110, 270, 190, { color: CYAN, label: 'OPFS' });
  treeNode(p, 200, 200, 'file', { r: 28, color: MAGENTA });
  treeNode(p, 310, 200, 'db', { r: 28, color: MAGENTA });
  caption(p, 'archivos grandes', 256, 350, { color: TEXT, size: 24 });
  badge(p, 256, 405, 'SQLite WASM', { color: GREEN, size: 22, w: 180 });
  caption(p, 'síncrono solo en Workers', 256, 465, { color: MUTED, size: 20 });
}

export function websqlObsoleto(p) {
  baseBg(p);
  box(p, 110, 170, 290, 140, { color: MAGENTA, label: 'WebSQL' });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(6);
  p.line(140, 200, 370, 285);
  p.line(370, 200, 140, 285);
  p.pop();
  caption(p, 'obsoleto y retirado', 256, 370, { color: MAGENTA, size: 26 });
  caption(p, 'no usar', 256, 420, { color: MUTED, size: 22 });
}

export function cuotaCompartidaDelOrigen(p) {
  baseBg(p);
  dashRect(p, 45, 90, 422, 340, { color: MUTED });
  caption(p, 'cuota del origen', 256, 120, { color: MUTED, size: 22 });
  box(p, 70, 160, 110, 110, { color: CYAN, label: 'IDB' });
  box(p, 200, 160, 110, 110, { color: CYAN, label: 'Cache' });
  box(p, 330, 160, 110, 110, { color: CYAN, label: 'OPFS' });
  box(p, 70, 300, 370, 90, { color: AMBER, label: 'Web Storage' });
  caption(p, 'tope propio', 256, 355, { color: TEXT, size: 22 });
  caption(p, 'Web Storage no comparte cuota', 256, 465, { color: MUTED, size: 20 });
}

export function origenDeAlmacenamiento(p) {
  baseBg(p);
  varChip(p, 110, 150, 'https', { w: 110, color: MAGENTA });
  varChip(p, 240, 150, 'host', { w: 110, color: MAGENTA });
  varChip(p, 370, 150, 'puerto', { w: 120, color: MAGENTA });
  p.arrow(256, 190, 256, 240, { color: CYAN });
  box(p, 110, 250, 292, 130, { color: CYAN, label: 'origen' });
  caption(p, 'cuota y expulsión', 256, 320, { color: TEXT, size: 22 });
  caption(p, 'se aplican al origen completo', 256, 430, { color: MUTED, size: 22 });
}

export function almacenamientoPorPerfil(p) {
  baseBg(p);
  box(p, 60, 160, 170, 150, { color: CYAN, label: 'dispositivo A' });
  badge(p, 145, 250, 'perfil', { color: CYAN, size: 20, w: 100 });
  box(p, 282, 160, 170, 150, { color: MUTED, label: 'dispositivo B' });
  badge(p, 367, 250, 'perfil', { color: MUTED, size: 20, w: 100 });
  p.arrow(240, 235, 272, 235, { color: MAGENTA, dashed: true });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(248, 225, 264, 245);
  p.line(264, 225, 248, 245);
  p.pop();
  caption(p, 'no se sincroniza', 256, 380, { color: MAGENTA, size: 26 });
  caption(p, 'sí se comparte entre pestañas', 256, 430, { color: MUTED, size: 22 });
}

export function bestEffortVsPersistente(p) {
  baseBg(p);
  box(p, 55, 130, 190, 250, { color: AMBER, label: 'best-effort' });
  caption(p, 'puede expirar', 150, 210, { color: TEXT, size: 22 });
  caption(p, 'si hay presión', 150, 250, { color: TEXT, size: 22 });
  caption(p, 'de espacio', 150, 290, { color: TEXT, size: 22 });
  badge(p, 150, 340, 'LRU', { color: AMBER, size: 20, w: 100 });
  box(p, 267, 130, 190, 250, { color: GREEN, label: 'persistente' });
  caption(p, 'solo el usuario', 362, 220, { color: TEXT, size: 22 });
  caption(p, 'lo borra', 362, 260, { color: TEXT, size: 22 });
  badge(p, 362, 340, 'persist()', { color: GREEN, size: 20, w: 140 });
}

export function pedirPersistenciaAlNavegador(p) {
  baseBg(p);
  fnPill(p, 256, 120, 'persist()', { w: 190, h: 62, size: 28 });
  p.arrow(256, 156, 256, 210, { color: CYAN });
  box(p, 116, 215, 280, 110, { color: CYAN, label: 'navegador' });
  caption(p, 'avisa o decide', 256, 285, { color: TEXT, size: 22 });
  badge(p, 256, 390, 'tras acción del usuario', { color: MAGENTA, size: 20, w: 260 });
  caption(p, 'no al cargar la página', 256, 440, { color: MUTED, size: 22 });
}

export function cuotaPorNavegador(p) {
  baseBg(p);
  box(p, 60, 130, 130, 230, { color: CYAN, label: 'Chrome' });
  badge(p, 125, 250, '60 %', { color: CYAN, size: 24, w: 100 });
  caption(p, 'del disco', 125, 310, { color: MUTED, size: 18 });
  box(p, 191, 130, 130, 230, { color: MAGENTA, label: 'Firefox' });
  badge(p, 256, 250, '10 %', { color: MAGENTA, size: 24, w: 100 });
  caption(p, 'o 10 GiB', 256, 310, { color: MUTED, size: 18 });
  box(p, 322, 130, 130, 230, { color: GREEN, label: 'Safari' });
  badge(p, 387, 250, '60 %', { color: GREEN, size: 24, w: 100 });
  caption(p, '15 % en WebView', 387, 310, { color: MUTED, size: 16 });
  caption(p, 'modo best-effort', 256, 420, { color: MUTED, size: 22 });
}

export function expulsionDeDatosDelOrigen(p) {
  baseBg(p);
  box(p, 60, 110, 180, 110, { color: AMBER, label: 'presión' });
  box(p, 272, 110, 180, 110, { color: AMBER, label: 'tope global' });
  p.arrow(150, 226, 220, 300, { color: MAGENTA });
  p.arrow(362, 226, 292, 300, { color: MAGENTA });
  stackFrame(p, 140, 300, 230, 40, 'origen viejo', { color: MAGENTA, size: 18 });
  stackFrame(p, 140, 348, 230, 40, 'origen menos usado', { color: MAGENTA, size: 18 });
  p.arrow(370, 329, 440, 329, { color: MAGENTA });
  badge(p, 400, 400, 'borrado', { color: MAGENTA, size: 18, w: 110 });
  caption(p, 'en orden LRU', 256, 440, { color: MUTED, size: 20 });
}

export function expulsionTodoONada(p) {
  baseBg(p);
  box(p, 60, 120, 130, 110, { color: MAGENTA, label: 'IDB' });
  box(p, 191, 120, 130, 110, { color: MAGENTA, label: 'Cache' });
  box(p, 322, 120, 130, 110, { color: MAGENTA, label: 'OPFS' });
  p.arrow(256, 240, 256, 300, { color: AMBER });
  box(p, 120, 305, 272, 90, { color: AMBER, label: 'todo o nada' });
  caption(p, 'arrancar desde cero', 256, 440, { color: TEXT, size: 24 });
  caption(p, 'y avisar de lo perdido', 256, 475, { color: MUTED, size: 20 });
}

export function storageEstimate(p) {
  baseBg(p);
  box(p, 80, 130, 352, 80, { color: MUTED, label: 'uso' });
  p.push();
  p.fill('rgba(0, 255, 204, 0.25)');
  p.stroke(CYAN);
  p.strokeWeight(2);
  p.rect(96, 150, 200, 40, 8);
  p.pop();
  caption(p, '45 %', 196, 170, { color: TEXT, size: 20 });
  box(p, 80, 240, 352, 80, { color: MUTED, label: 'cuota' });
  p.push();
  p.fill('rgba(255, 0, 127, 0.18)');
  p.stroke(MAGENTA);
  p.strokeWeight(2);
  p.rect(96, 260, 320, 40, 8);
  p.pop();
  caption(p, 'estimado', 256, 280, { color: TEXT, size: 20 });
  badge(p, 256, 380, 'QuotaExceededError', { color: AMBER, size: 20, w: 240 });
}

export function estrategiaDeCuota(p) {
  baseBg(p);
  box(p, 50, 120, 190, 230, { color: GREEN, label: 'críticos' });
  caption(p, 'no se tocan', 145, 200, { color: TEXT, size: 22 });
  caption(p, 'cambios y', 145, 240, { color: TEXT, size: 22 });
  caption(p, 'borradores', 145, 280, { color: TEXT, size: 22 });
  box(p, 272, 120, 190, 230, { color: AMBER, label: 'recuperables' });
  caption(p, 'cachés', 367, 200, { color: TEXT, size: 22 });
  caption(p, 'catálogos', 367, 240, { color: TEXT, size: 22 });
  badge(p, 367, 300, 'LRU', { color: AMBER, size: 20, w: 100 });
  p.arrow(256, 400, 256, 360, { color: MAGENTA });
  caption(p, 'expulsa y reintenta una vez', 256, 440, { color: MAGENTA, size: 22 });
}

export function storageBuckets(p) {
  baseBg(p);
  box(p, 60, 120, 190, 240, { color: GREEN, label: 'bucket' });
  caption(p, 'persisted:', 155, 200, { color: TEXT, size: 20 });
  caption(p, 'true', 155, 235, { color: GREEN, size: 24 });
  caption(p, 'datos críticos', 155, 300, { color: MUTED, size: 20 });
  box(p, 262, 120, 190, 240, { color: AMBER, label: 'bucket' });
  caption(p, 'cache', 357, 200, { color: TEXT, size: 20 });
  caption(p, 'descartable', 357, 240, { color: TEXT, size: 22 });
  badge(p, 357, 310, 'Chromium', { color: AMBER, size: 18, w: 130 });
  caption(p, 'separar lo que no se puede perder', 256, 430, { color: MUTED, size: 20 });
}

export function datosExpuestosAlJavascript(p) {
  baseBg(p);
  box(p, 60, 130, 180, 120, { color: MAGENTA, label: 'JS' });
  p.arrow(246, 190, 320, 190, { color: MAGENTA });
  box(p, 326, 130, 130, 120, { color: AMBER, label: 'storage' });
  badge(p, 256, 320, 'sin cifrar', { color: MAGENTA, size: 22, w: 160 });
  caption(p, 'el usuario puede borrarlo', 256, 390, { color: MUTED, size: 22 });
  caption(p, 'solo lo protege el disco', 256, 430, { color: MUTED, size: 20 });
}

export function webviewVsSqliteEnArchivo(p) {
  baseBg(p);
  box(p, 45, 120, 200, 250, { color: AMBER, label: 'WebView' });
  caption(p, 'perfil invisible', 145, 200, { color: TEXT, size: 20 });
  caption(p, 'se pierde al', 145, 240, { color: TEXT, size: 20 });
  caption(p, 'reinstalar', 145, 275, { color: TEXT, size: 20 });
  badge(p, 145, 330, 'origen sintético', { color: AMBER, size: 16, w: 170 });
  box(p, 267, 120, 200, 250, { color: GREEN, label: 'app.db' });
  caption(p, 'archivo que', 367, 200, { color: TEXT, size: 20 });
  caption(p, 'tú controlas', 367, 240, { color: TEXT, size: 20 });
  badge(p, 367, 330, 'SQLite', { color: GREEN, size: 18, w: 110 });
}

export function offlineCapableOfflineFirstLocalFirst(p) {
  baseBg(p);
  box(p, 70, 90, 372, 100, { color: AMBER, label: 'offline-capable' });
  caption(p, 'muestra algo sin red', 256, 155, { color: TEXT, size: 22 });
  box(p, 70, 210, 372, 100, { color: CYAN, label: 'offline-first' });
  caption(p, 'la base local es la verdad', 256, 275, { color: TEXT, size: 22 });
  box(p, 70, 330, 372, 100, { color: GREEN, label: 'local-first' });
  caption(p, 'el usuario es dueño', 256, 395, { color: TEXT, size: 22 });
}

export function fuenteDeVerdadLocal(p) {
  baseBg(p);
  box(p, 140, 90, 232, 90, { color: CYAN, label: 'UI' });
  p.arrow(256, 186, 256, 250, { color: CYAN });
  box(p, 120, 255, 272, 100, { color: GREEN, label: 'base local' });
  caption(p, 'lee y escribe aquí', 256, 320, { color: TEXT, size: 22 });
  p.arrow(392, 305, 460, 305, { color: MUTED, dashed: true });
  badge(p, 430, 260, 'red', { color: MUTED, size: 18, w: 90 });
  caption(p, 'nadie espera a la red', 256, 420, { color: MUTED, size: 22 });
}

export function outboxTransaccional(p) {
  baseBg(p);
  box(p, 90, 120, 332, 260, { color: CYAN, label: 'transacción' });
  varChip(p, 190, 220, 'entidad', { w: 150, color: GREEN });
  varChip(p, 330, 220, 'outbox', { w: 150, color: MAGENTA });
  p.arrow(256, 300, 256, 340, { color: CYAN });
  badge(p, 256, 340, 'todo o nada', { color: GREEN, size: 20, w: 170 });
  caption(p, 'nunca se pierde ni se duplica', 256, 430, { color: MUTED, size: 20 });
}

export function idempotenciaEnSincronizacion(p) {
  baseBg(p);
  varChip(p, 140, 150, 'mutationId', { w: 190, color: MAGENTA });
  p.arrow(140, 185, 140, 240, { color: CYAN });
  box(p, 40, 245, 200, 110, { color: CYAN, label: 'servidor' });
  p.arrow(246, 300, 300, 300, { color: MAGENTA, dashed: true });
  badge(p, 350, 300, 'ignora', { color: MAGENTA, size: 20, w: 130 });
  caption(p, 'reintentos seguros', 256, 420, { color: MUTED, size: 22 });
}

export function idsGeneradosEnElCliente(p) {
  baseBg(p);
  box(p, 50, 120, 190, 230, { color: CYAN, label: 'cliente' });
  varChip(p, 145, 210, 'UUID v7', { w: 150, color: GREEN });
  caption(p, 'ordenado', 145, 270, { color: TEXT, size: 20 });
  caption(p, 'por tiempo', 145, 305, { color: TEXT, size: 20 });
  box(p, 272, 120, 190, 230, { color: MUTED, label: 'servidor' });
  badge(p, 367, 210, 'offline', { color: MAGENTA, size: 20, w: 130 });
  caption(p, 'no puede', 367, 270, { color: TEXT, size: 20 });
  caption(p, 'asignar ids', 367, 305, { color: TEXT, size: 20 });
  caption(p, 'v4 aleatorio fragmenta índices', 256, 420, { color: MUTED, size: 20 });
}

export function metadatosDeEntidad(p) {
  baseBg(p);
  box(p, 90, 90, 332, 300, { color: CYAN, label: 'entidad' });
  varChip(p, 180, 165, 'id', { w: 120, color: MAGENTA });
  varChip(p, 330, 165, 'rev', { w: 120, color: MAGENTA });
  varChip(p, 180, 235, 'updatedAt', { w: 160, color: GREEN });
  varChip(p, 330, 235, 'baseRev', { w: 150, color: GREEN });
  varChip(p, 180, 305, 'syncState', { w: 160, color: AMBER });
  varChip(p, 330, 305, 'deletedAt', { w: 160, color: AMBER });
  caption(p, 'UTC en milisegundos', 256, 440, { color: MUTED, size: 22 });
}

export function borradoLogicoConLapidas(p) {
  baseBg(p);
  box(p, 80, 130, 200, 110, { color: MAGENTA, label: 'borrado' });
  caption(p, 'deletedAt', 180, 205, { color: TEXT, size: 22 });
  p.arrow(286, 185, 330, 185, { color: CYAN });
  badge(p, 400, 185, 'lápida', { color: CYAN, size: 20, w: 130 });
  caption(p, 'se propaga y se purga', 256, 300, { color: TEXT, size: 22 });
  caption(p, 'tras una ventana', 256, 340, { color: MUTED, size: 20 });
  box(p, 120, 380, 272, 70, { color: AMBER, label: 'resync completa' });
}

export function ordenDeLlegadaArbitrario(p) {
  baseBg(p);
  varChip(p, 120, 140, 'pedido', { w: 140, color: MAGENTA });
  varChip(p, 380, 140, 'cliente', { w: 140, color: MAGENTA });
  p.arrow(190, 140, 300, 140, { color: MUTED, dashed: true });
  caption(p, 'referencia colgante', 256, 190, { color: AMBER, size: 20 });
  badge(p, 256, 250, 'tolerada', { color: AMBER, size: 20, w: 130 });
  caption(p, 'sin integridad referencial', 256, 330, { color: MUTED, size: 20 });
  caption(p, 'estricta entre entidades', 256, 365, { color: MUTED, size: 20 });
}

export function unidadDeSincronizacion(p) {
  baseBg(p);
  box(p, 80, 110, 352, 260, { color: CYAN, label: 'agregado' });
  varChip(p, 180, 200, 'pedido', { w: 140, color: GREEN });
  varChip(p, 330, 200, 'línea 1', { w: 140, color: GREEN });
  varChip(p, 180, 280, 'línea 2', { w: 140, color: GREEN });
  varChip(p, 330, 280, 'línea 3', { w: 140, color: GREEN });
  caption(p, 'se sincronizan juntos', 256, 420, { color: MUTED, size: 22 });
}

export function clasificacionDeDatos(p) {
  baseBg(p);
  box(p, 60, 100, 180, 110, { color: CYAN, label: 'referencia' });
  caption(p, 'solo descarga', 150, 175, { color: TEXT, size: 20 });
  box(p, 272, 100, 180, 110, { color: GREEN, label: 'usuario' });
  caption(p, 'ida y vuelta', 362, 175, { color: TEXT, size: 20 });
  box(p, 60, 240, 180, 110, { color: MAGENTA, label: 'eventos' });
  caption(p, 'solo se agregan', 150, 315, { color: TEXT, size: 20 });
  box(p, 272, 240, 180, 110, { color: MUTED, label: 'efímero' });
  caption(p, 'no se sincroniza', 362, 315, { color: TEXT, size: 20 });
  caption(p, 'cuatro patrones', 256, 420, { color: MUTED, size: 22 });
}

export function fiabilidadDeNavigatorOnLine(p) {
  baseBg(p);
  badge(p, 140, 140, 'onLine true', { color: AMBER, size: 20, w: 180 });
  caption(p, 'puede mentir', 140, 200, { color: AMBER, size: 22 });
  caption(p, 'red cautiva', 140, 240, { color: MUTED, size: 20 });
  badge(p, 372, 140, 'onLine false', { color: GREEN, size: 20, w: 180 });
  caption(p, 'fiable', 372, 200, { color: GREEN, size: 22 });
  caption(p, 'sin interfaz', 372, 240, { color: MUTED, size: 20 });
  box(p, 120, 320, 272, 90, { color: CYAN, label: 'sondeo real' });
  caption(p, 'no decidir con onLine', 256, 450, { color: MUTED, size: 22 });
}

export function deteccionActivaDeConectividad(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'HEAD /health', { w: 210, h: 56, size: 24 });
  p.arrow(256, 142, 256, 195, { color: CYAN });
  badge(p, 256, 225, 'timeout 3 s', { color: AMBER, size: 20, w: 170 });
  varChip(p, 108, 320, 'eventos', { w: 128, color: MAGENTA, size: 18 });
  varChip(p, 256, 320, 'fallos fetch', { w: 152, color: MAGENTA, size: 18 });
  varChip(p, 404, 320, 'visibility', { w: 130, color: MAGENTA, size: 18 });
  caption(p, 'combinar señales', 256, 400, { color: TEXT, size: 22 });
  caption(p, 'navigator.connection solo ajusta', 256, 440, { color: MUTED, size: 20 });
}

export function estadosDeRedYSincronizacion(p) {
  baseBg(p);
  const a = ['offline', 'probing', 'online', 'degraded'];
  a.forEach((label, i) => {
    badge(p, 80 + i * 118, 140, label, { color: CYAN, size: 16, w: 108, h: 34 });
    if (i < 3) p.arrow(134 + i * 118, 140, 156 + i * 118, 140, { color: MUTED });
  });
  caption(p, 'conectividad', 256, 95, { color: MUTED, size: 20 });
  const b = ['idle', 'pulling', 'pushing', 'backoff', 'blocked'];
  b.forEach((label, i) => {
    badge(p, 66 + i * 96, 260, label, { color: MAGENTA, size: 14, w: 88, h: 34 });
    if (i < 4) p.arrow(110 + i * 96, 260, 126 + i * 96, 260, { color: MUTED });
  });
  caption(p, 'sincronización', 256, 215, { color: MUTED, size: 20 });
  badge(p, 256, 340, 'pendientes · última sync · error', { color: GREEN, size: 18, w: 330 });
  caption(p, 'estado observable', 256, 410, { color: MUTED, size: 20 });
}

export function consistenciaEventualYConvergenciaFuerte(p) {
  baseBg(p);
  box(p, 50, 140, 150, 110, { color: CYAN, label: 'réplica A' });
  box(p, 312, 140, 150, 110, { color: CYAN, label: 'réplica B' });
  p.arrow(206, 175, 306, 175, { color: MAGENTA });
  p.arrow(306, 235, 206, 235, { color: GREEN });
  badge(p, 256, 120, 'convergen', { color: GREEN, size: 20, w: 150 });
  badge(p, 256, 300, 'eventual', { color: AMBER, size: 20, w: 130 });
  caption(p, 'fusión conmutativa', 256, 380, { color: MUTED, size: 22 });
  caption(p, 'idempotente · asociativa', 256, 420, { color: MUTED, size: 20 });
}

export function lecturasMonotonas(p) {
  baseBg(p);
  varChip(p, 140, 150, 'rev 5', { w: 120, color: GREEN });
  varChip(p, 372, 150, 'rev 3', { w: 120, color: MAGENTA });
  p.arrow(206, 195, 320, 195, { color: MAGENTA, dashed: true });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(330, 175, 346, 215);
  p.line(346, 175, 330, 215);
  p.pop();
  caption(p, 'se ignora', 372, 240, { color: MAGENTA, size: 20 });
  badge(p, 256, 330, 'nunca retrocede', { color: GREEN, size: 20, w: 190 });
  caption(p, 'cursores monótonos', 256, 400, { color: MUTED, size: 22 });
}

export function invariantesQueExigenCoordinacion(p) {
  baseBg(p);
  box(p, 60, 110, 180, 130, { color: MAGENTA, label: 'partición' });
  box(p, 272, 110, 180, 130, { color: CYAN, label: 'disponibilidad' });
  box(p, 60, 270, 180, 130, { color: AMBER, label: 'consistencia' });
  badge(p, 360, 300, 'no garantizada', { color: MAGENTA, size: 18, w: 190 });
  caption(p, 'unicidad · stock · saldo', 256, 440, { color: MUTED, size: 22 });
}

export function teoremaCALM(p) {
  baseBg(p);
  box(p, 60, 130, 180, 250, { color: GREEN, label: 'monótona' });
  caption(p, 'solo agrega', 150, 210, { color: TEXT, size: 22 });
  caption(p, 'información', 150, 250, { color: TEXT, size: 22 });
  badge(p, 150, 330, 'sin coord.', { color: GREEN, size: 20, w: 130 });
  box(p, 272, 130, 180, 250, { color: AMBER, label: 'con coord.' });
  caption(p, 'requiere', 362, 210, { color: TEXT, size: 22 });
  caption(p, 'consenso', 362, 250, { color: TEXT, size: 22 });
  badge(p, 362, 330, 'bloquea', { color: AMBER, size: 20, w: 130 });
  caption(p, 'CALM', 256, 440, { color: MUTED, size: 22 });
}

export function coordinacionDeStockOffline(p) {
  baseBg(p);
  box(p, 50, 120, 180, 100, { color: CYAN, label: 'dispositivo' });
  badge(p, 140, 185, 'reserva 2', { color: GREEN, size: 18, w: 130 });
  p.arrow(236, 170, 296, 170, { color: CYAN });
  box(p, 302, 120, 160, 100, { color: MAGENTA, label: 'servidor' });
  caption(p, 'valida y rechaza', 382, 190, { color: TEXT, size: 18 });
  box(p, 90, 280, 332, 90, { color: AMBER, label: 'reconciliación' });
  caption(p, 'nunca stock negativo', 256, 420, { color: MUTED, size: 22 });
}

export function sincronizacionPorEstadoYPorOperaciones(p) {
  baseBg(p);
  box(p, 50, 110, 190, 260, { color: CYAN, label: 'por estado' });
  varChip(p, 145, 190, 'dirty', { w: 120, color: MAGENTA });
  caption(p, 'envía el', 145, 250, { color: TEXT, size: 20 });
  caption(p, 'estado actual', 145, 285, { color: TEXT, size: 20 });
  box(p, 272, 110, 190, 260, { color: GREEN, label: 'por operaciones' });
  varChip(p, 367, 190, 'patch', { w: 120, color: GREEN });
  caption(p, 'conserva la', 367, 250, { color: TEXT, size: 20 });
  caption(p, 'intención', 367, 285, { color: TEXT, size: 20 });
  caption(p, 'fusiona mejor', 256, 430, { color: MUTED, size: 22 });
}

export function eventSourcingLocal(p) {
  baseBg(p);
  stackFrame(p, 60, 120, 200, 38, 'evento 1', { color: CYAN, size: 18 });
  stackFrame(p, 60, 164, 200, 38, 'evento 2', { color: CYAN, size: 18 });
  stackFrame(p, 60, 208, 200, 38, 'evento 3', { color: CYAN, size: 18 });
  p.arrow(266, 182, 316, 182, { color: GREEN });
  box(p, 322, 130, 140, 110, { color: GREEN, label: 'proyección' });
  caption(p, 'auditoría · deshacer', 256, 300, { color: TEXT, size: 22 });
  caption(p, 'log + proyecciones', 256, 340, { color: MUTED, size: 20 });
}

export function backoffYDeadLetter(p) {
  baseBg(p);
  badge(p, 100, 140, '1 s', { color: CYAN, size: 18, w: 90 });
  badge(p, 210, 140, '2 s', { color: CYAN, size: 18, w: 90 });
  badge(p, 320, 140, '4 s', { color: CYAN, size: 18, w: 90 });
  badge(p, 430, 140, '8 s', { color: AMBER, size: 18, w: 90 });
  p.arrow(150, 140, 160, 140, { color: MUTED });
  p.arrow(260, 140, 270, 140, { color: MUTED });
  p.arrow(370, 140, 380, 140, { color: MUTED });
  caption(p, 'reintentos con jitter', 256, 210, { color: TEXT, size: 22 });
  box(p, 130, 260, 252, 100, { color: MAGENTA, label: 'dead letter' });
  caption(p, 'mutación imposible', 256, 330, { color: MAGENTA, size: 20 });
  caption(p, 'aislada, no bloquea', 256, 420, { color: MUTED, size: 20 });
}

export function variasPestanasConWebLocks(p) {
  baseBg(p);
  box(p, 50, 120, 120, 100, { color: GREEN, label: 'tab 1' });
  caption(p, 'líder', 110, 185, { color: TEXT, size: 20 });
  box(p, 196, 120, 120, 100, { color: MUTED, label: 'tab 2' });
  box(p, 342, 120, 120, 100, { color: MUTED, label: 'tab 3' });
  p.arrow(176, 170, 190, 170, { color: MAGENTA });
  p.arrow(322, 170, 336, 170, { color: MAGENTA });
  badge(p, 256, 280, 'BroadcastChannel', { color: CYAN, size: 20, w: 220 });
  caption(p, 'Web Locks elige un líder', 256, 350, { color: TEXT, size: 22 });
  caption(p, 'y difunde cambios', 256, 390, { color: MUTED, size: 20 });
}

export function cierreDeSesion(p) {
  baseBg(p);
  box(p, 70, 120, 160, 100, { color: CYAN, label: 'base' });
  box(p, 282, 120, 160, 100, { color: MAGENTA, label: 'claves' });
  p.arrow(150, 226, 200, 300, { color: MAGENTA });
  p.arrow(362, 226, 312, 300, { color: MAGENTA });
  box(p, 176, 305, 160, 90, { color: MAGENTA, label: 'borrar' });
  caption(p, 'los datos no sobreviven', 256, 440, { color: MUTED, size: 22 });
}
