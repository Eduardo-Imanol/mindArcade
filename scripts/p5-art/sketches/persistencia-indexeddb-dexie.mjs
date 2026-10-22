// scripts/p5-art/sketches/persistencia-indexeddb-dexie.mjs — secciones 3-4: IndexedDB y Dexie.js.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, fnPill, stackFrame, varChip } from '../primitives.mjs';

export function organizacionDeIndexedDB(p) {
  baseBg(p);
  badge(p, 256, 80, 'IDBFactory', { color: MAGENTA, size: 22, w: 170 });
  p.arrow(256, 105, 256, 145, { color: CYAN });
  box(p, 140, 150, 232, 90, { color: CYAN, label: 'base de datos' });
  caption(p, 'nombre + versión', 256, 210, { color: TEXT, size: 20 });
  p.arrow(256, 246, 256, 286, { color: CYAN });
  box(p, 90, 290, 150, 90, { color: GREEN, label: 'store' });
  box(p, 272, 290, 150, 90, { color: GREEN, label: 'store' });
  p.arrow(165, 386, 165, 420, { color: AMBER });
  p.arrow(347, 386, 347, 420, { color: AMBER });
  badge(p, 165, 435, 'índice', { color: AMBER, size: 16, w: 100 });
  badge(p, 347, 435, 'índice', { color: AMBER, size: 16, w: 100 });
}

export function tiposDeClaveEnIndexedDB(p) {
  baseBg(p);
  const labels = ['número', 'fecha', 'cadena', 'binario', 'arreglo'];
  labels.forEach((label, i) => {
    varChip(p, 70 + i * 95, 130, label, { w: 88, color: CYAN, size: 16 });
    if (i < 4) p.arrow(114 + i * 95, 130, 122 + i * 95, 130, { color: MUTED });
  });
  caption(p, 'orden de clasificación', 256, 190, { color: MUTED, size: 20 });
  badge(p, 256, 260, 'booleanos no son claves', { color: MAGENTA, size: 20, w: 250 });
  badge(p, 256, 320, 'null tampoco', { color: MAGENTA, size: 20, w: 180 });
  caption(p, 'undefined tampoco', 256, 380, { color: MUTED, size: 22 });
}

export function claveEnLineaYFueraDeLinea(p) {
  baseBg(p);
  box(p, 50, 120, 190, 240, { color: CYAN, label: 'en línea' });
  varChip(p, 145, 200, 'keyPath', { w: 140, color: MAGENTA });
  caption(p, 'la clave es', 145, 260, { color: TEXT, size: 20 });
  caption(p, 'del valor', 145, 295, { color: TEXT, size: 20 });
  badge(p, 145, 330, 'id', { color: GREEN, size: 18, w: 80 });
  box(p, 272, 120, 190, 240, { color: GREEN, label: 'fuera de línea' });
  varChip(p, 367, 200, 'put(k, v)', { w: 150, color: MAGENTA });
  caption(p, 'la clave se', 367, 260, { color: TEXT, size: 20 });
  caption(p, 'pasa aparte', 367, 295, { color: TEXT, size: 20 });
  badge(p, 367, 330, 'k', { color: GREEN, size: 18, w: 80 });
}

export function generadorAutoincremental(p) {
  baseBg(p);
  badge(p, 110, 130, '1', { color: CYAN, size: 24, w: 70 });
  badge(p, 210, 130, '2', { color: CYAN, size: 24, w: 70 });
  badge(p, 330, 130, '7', { color: AMBER, size: 24, w: 70 });
  p.arrow(150, 130, 170, 130, { color: MUTED });
  p.arrow(250, 130, 290, 130, { color: MUTED });
  p.arrow(370, 130, 410, 130, { color: MUTED });
  badge(p, 440, 130, '9', { color: CYAN, size: 24, w: 70 });
  caption(p, 'nunca reutiliza', 256, 220, { color: GREEN, size: 24 });
  caption(p, 'ni tras borrar', 256, 260, { color: MUTED, size: 22 });
  box(p, 110, 320, 292, 90, { color: MAGENTA, label: 'clave explícita mayor' });
  caption(p, 'el generador salta', 256, 450, { color: MUTED, size: 22 });
}

export function structuredCloneEnIndexedDB(p) {
  baseBg(p);
  varChip(p, 110, 120, 'Date', { w: 110, color: CYAN, size: 18 });
  varChip(p, 250, 120, 'Map', { w: 100, color: CYAN, size: 18 });
  varChip(p, 390, 120, 'Blob', { w: 110, color: CYAN, size: 18 });
  varChip(p, 110, 200, 'Set', { w: 100, color: CYAN, size: 18 });
  varChip(p, 250, 200, 'ArrayBuffer', { w: 160, color: CYAN, size: 18 });
  varChip(p, 390, 200, 'CryptoKey', { w: 150, color: CYAN, size: 18 });
  badge(p, 256, 300, 'no clona funciones', { color: MAGENTA, size: 20, w: 230 });
  badge(p, 256, 350, 'ni nodos del DOM', { color: MAGENTA, size: 20, w: 230 });
  caption(p, 'las clases pierden prototipo', 256, 420, { color: MUTED, size: 20 });
}

export function creacionDeIndicesEnIndexedDB(p) {
  baseBg(p);
  box(p, 120, 90, 272, 90, { color: CYAN, label: 'upgradeneeded' });
  p.arrow(256, 186, 256, 226, { color: CYAN });
  box(p, 90, 230, 150, 90, { color: GREEN, label: 'createIndex' });
  box(p, 272, 230, 150, 90, { color: MAGENTA, label: 'createIndex' });
  caption(p, 'unique', 165, 350, { color: GREEN, size: 22 });
  caption(p, 'multiEntry', 347, 350, { color: MAGENTA, size: 22 });
  caption(p, 'solo aquí se crean', 256, 410, { color: MUTED, size: 22 });
}

export function valorNoIndexableEnUnIndice(p) {
  baseBg(p);
  varChip(p, 160, 130, 'flag: true', { w: 170, color: MAGENTA });
  p.arrow(256, 166, 256, 216, { color: MUTED, dashed: true });
  box(p, 120, 220, 272, 100, { color: MUTED, label: 'índice' });
  caption(p, 'no aparece', 256, 290, { color: AMBER, size: 24 });
  badge(p, 256, 380, 'sin error', { color: AMBER, size: 20, w: 140 });
  caption(p, 'los booleanos no son claves', 256, 440, { color: MUTED, size: 20 });
}

export function eventosUpgradeneededYVersionchange(p) {
  baseBg(p);
  box(p, 50, 110, 190, 100, { color: CYAN, label: 'upgradeneeded' });
  caption(p, 'nueva versión', 145, 180, { color: TEXT, size: 20 });
  box(p, 272, 110, 190, 100, { color: AMBER, label: 'blocked' });
  caption(p, 'otra pestaña', 367, 180, { color: TEXT, size: 20 });
  p.arrow(246, 160, 266, 160, { color: MAGENTA });
  box(p, 100, 280, 312, 90, { color: GREEN, label: 'versionchange' });
  caption(p, 'cerrar conexiones antiguas', 256, 340, { color: TEXT, size: 20 });
  caption(p, 'para no bloquear la actualización', 256, 420, { color: MUTED, size: 20 });
}

export function atomicidadDeTransaccion(p) {
  baseBg(p);
  box(p, 90, 100, 332, 110, { color: CYAN, label: 'transacción' });
  varChip(p, 190, 165, 'put', { w: 100, color: GREEN });
  varChip(p, 322, 165, 'add', { w: 100, color: GREEN });
  p.arrow(256, 216, 256, 266, { color: CYAN });
  badge(p, 160, 300, 'todo', { color: GREEN, size: 22, w: 110 });
  badge(p, 352, 300, 'nada', { color: MAGENTA, size: 22, w: 110 });
  caption(p, 'se confirma o se deshace', 256, 380, { color: TEXT, size: 22 });
  caption(p, 'junta', 256, 420, { color: MUTED, size: 20 });
}

export function planificacionDeTransacciones(p) {
  baseBg(p);
  box(p, 60, 100, 180, 80, { color: MUTED, label: 'tab A' });
  box(p, 272, 100, 180, 80, { color: MUTED, label: 'tab B' });
  p.arrow(150, 186, 150, 230, { color: CYAN });
  p.arrow(362, 186, 362, 230, { color: CYAN });
  box(p, 60, 235, 180, 80, { color: MAGENTA, label: 'readwrite' });
  box(p, 272, 235, 180, 80, { color: MAGENTA, label: 'readwrite' });
  badge(p, 256, 350, 'serializables', { color: CYAN, size: 20, w: 170 });
  caption(p, 'mismo store = bloquean', 256, 410, { color: MUTED, size: 22 });
  caption(p, 'lectores: no se bloquean', 256, 450, { color: MUTED, size: 20 });
}

export function durabilidadesDeIndexedDB(p) {
  baseBg(p);
  box(p, 50, 120, 190, 220, { color: GREEN, label: 'strict' });
  caption(p, 'espera al', 145, 195, { color: TEXT, size: 22 });
  caption(p, 'disco', 145, 235, { color: TEXT, size: 22 });
  badge(p, 145, 300, 'crítico', { color: GREEN, size: 18, w: 120 });
  box(p, 272, 120, 190, 220, { color: AMBER, label: 'relaxed' });
  caption(p, 'no espera', 367, 205, { color: TEXT, size: 22 });
  badge(p, 367, 300, 'default', { color: AMBER, size: 18, w: 120 });
  caption(p, 'Chromium usa relaxed', 256, 400, { color: MUTED, size: 22 });
  caption(p, 'puede perder lo último', 256, 440, { color: MUTED, size: 20 });
}

export function autoCommitDeTransaccion(p) {
  baseBg(p);
  box(p, 100, 100, 312, 100, { color: CYAN, label: 'transacción' });
  fnPill(p, 200, 250, 'await fetch()', { w: 190, h: 56, size: 20, color: MAGENTA });
  p.arrow(256, 206, 256, 216, { color: MAGENTA });
  badge(p, 256, 330, 'TransactionInactiveError', { color: MAGENTA, size: 18, w: 300 });
  caption(p, 'prepara los datos antes', 256, 400, { color: TEXT, size: 22 });
  caption(p, 'de abrir la transacción', 256, 440, { color: MUTED, size: 20 });
}

export function lecturaModificacionEscrituraEnUnaTransaccion(p) {
  baseBg(p);
  box(p, 50, 110, 170, 90, { color: MUTED, label: 'tab A' });
  box(p, 292, 110, 170, 90, { color: MUTED, label: 'tab B' });
  varChip(p, 135, 250, 'leer 1', { w: 130, color: CYAN });
  varChip(p, 377, 250, 'leer 1', { w: 130, color: CYAN });
  p.arrow(135, 286, 135, 330, { color: CYAN });
  p.arrow(377, 286, 377, 330, { color: CYAN });
  varChip(p, 135, 355, 'escribir 0', { w: 150, color: MAGENTA });
  varChip(p, 377, 355, 'escribir 0', { w: 150, color: MAGENTA });
  badge(p, 256, 430, 'lost update', { color: MAGENTA, size: 20, w: 180 });
}

export function ordenDeIndiceCompuesto(p) {
  baseBg(p);
  badge(p, 150, 120, 'status', { color: CYAN, size: 20, w: 140 });
  badge(p, 290, 120, 'updatedAt', { color: GREEN, size: 20, w: 170 });
  p.arrow(220, 120, 202, 120, { color: MUTED });
  caption(p, 'igualdad', 150, 175, { color: CYAN, size: 20 });
  caption(p, 'rango', 290, 175, { color: GREEN, size: 20 });
  box(p, 90, 240, 332, 110, { color: MUTED, label: 'orden lexicográfico' });
  caption(p, 'rango solo al final', 256, 320, { color: TEXT, size: 22 });
  badge(p, 256, 400, 'pending · 24 h', { color: AMBER, size: 18, w: 200 });
}

export function indiceDisperso(p) {
  baseBg(p);
  stackFrame(p, 60, 120, 200, 40, 'fila A', { color: GREEN, size: 18 });
  stackFrame(p, 60, 168, 200, 40, 'fila B', { color: MUTED, size: 18 });
  stackFrame(p, 60, 216, 200, 40, 'fila C', { color: MUTED, size: 18 });
  badge(p, 300, 180, 'dirty: 1', { color: MAGENTA, size: 20, w: 150 });
  p.arrow(266, 180, 220, 180, { color: MAGENTA });
  caption(p, 'solo las pendientes', 256, 300, { color: TEXT, size: 22 });
  caption(p, 'índice diminuto', 256, 340, { color: MUTED, size: 22 });
  badge(p, 256, 400, 'se borra al sincronizar', { color: GREEN, size: 18, w: 250 });
}

export function operacionesMasivasEnIndexedDB(p) {
  baseBg(p);
  box(p, 60, 110, 170, 100, { color: CYAN, label: 'delete' });
  caption(p, 'por rango', 145, 180, { color: TEXT, size: 20 });
  box(p, 272, 110, 170, 100, { color: GREEN, label: 'count' });
  caption(p, 'sin traer filas', 357, 180, { color: TEXT, size: 18 });
  box(p, 60, 240, 170, 100, { color: MAGENTA, label: 'getAll' });
  caption(p, 'por lotes', 145, 310, { color: TEXT, size: 20 });
  box(p, 272, 240, 170, 100, { color: AMBER, label: 'cursor' });
  caption(p, 'ida y vuelta', 357, 310, { color: TEXT, size: 18 });
  caption(p, 'getAll gana en lotes', 256, 410, { color: MUTED, size: 22 });
}

export function paginacionPorOffsetYPorClaves(p) {
  baseBg(p);
  box(p, 50, 110, 190, 230, { color: MAGENTA, label: 'offset' });
  badge(p, 145, 190, 'O(n)', { color: MAGENTA, size: 24, w: 110 });
  caption(p, 'avanza n', 145, 250, { color: TEXT, size: 20 });
  caption(p, 'posiciones', 145, 285, { color: TEXT, size: 20 });
  box(p, 272, 110, 190, 230, { color: GREEN, label: 'keyset' });
  badge(p, 367, 190, 'O(log n)', { color: GREEN, size: 24, w: 130 });
  caption(p, 'reanuda desde', 367, 250, { color: TEXT, size: 20 });
  caption(p, 'la última clave', 367, 285, { color: TEXT, size: 20 });
  caption(p, 'clave vista, no offset', 256, 410, { color: MUTED, size: 22 });
}

export function erroresFrecuentesDeIndexedDB(p) {
  baseBg(p);
  const errs = ['TransactionInactive', 'Constraint', 'Version', 'InvalidState'];
  errs.forEach((label, i) => {
    badge(p, 130 + (i % 2) * 250, 120 + Math.floor(i / 2) * 70, label, { color: MAGENTA, size: 16, w: 230, h: 44 });
  });
  const errs2 = ['QuotaExceeded', 'DataClone', 'NotFound'];
  errs2.forEach((label, i) => {
    badge(p, 130 + (i % 2) * 250, 260 + Math.floor(i / 2) * 70, label, { color: AMBER, size: 16, w: 230, h: 44 });
  });
  badge(p, 380, 330, 'Unknown', { color: MUTED, size: 16, w: 230, h: 44 });
  caption(p, 'si la conexión se pierde, reabre', 256, 430, { color: MUTED, size: 20 });
}

export function protectorDeEscrituraPorCuota(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'escribir()', { w: 180, h: 56, size: 24 });
  p.arrow(256, 142, 256, 185, { color: CYAN });
  badge(p, 256, 215, 'QuotaExceededError', { color: MAGENTA, size: 18, w: 250 });
  p.arrow(256, 245, 180, 300, { color: MAGENTA });
  p.arrow(330, 245, 380, 300, { color: GREEN });
  box(p, 90, 305, 180, 80, { color: AMBER, label: 'evict LRU' });
  box(p, 300, 305, 160, 80, { color: GREEN, label: 'reintenta' });
  caption(p, 'la cola de cambios no se toca', 256, 430, { color: MUTED, size: 20 });
}

export function costeDeBase64(p) {
  baseBg(p);
  box(p, 50, 110, 180, 110, { color: MAGENTA, label: 'base64' });
  badge(p, 140, 185, '+33 %', { color: MAGENTA, size: 24, w: 130 });
  box(p, 272, 110, 180, 110, { color: GREEN, label: 'Blob' });
  badge(p, 362, 185, 'binario', { color: GREEN, size: 20, w: 130 });
  caption(p, 'mejor en crudo', 256, 290, { color: TEXT, size: 24 });
  caption(p, 'pruébalo en iOS', 256, 340, { color: MUTED, size: 20 });
  badge(p, 256, 410, 'ArrayBuffer', { color: CYAN, size: 18, w: 180 });
}

export function queResuelveDexie(p) {
  baseBg(p);
  box(p, 60, 100, 392, 90, { color: MAGENTA, label: 'IndexedDB' });
  p.arrow(256, 196, 256, 236, { color: CYAN });
  box(p, 130, 240, 252, 90, { color: CYAN, label: 'Dexie' });
  varChip(p, 180, 380, 'promesas', { w: 130, color: GREEN, size: 16 });
  varChip(p, 332, 380, 'liveQuery', { w: 150, color: GREEN, size: 16 });
  varChip(p, 180, 440, 'hooks', { w: 120, color: GREEN, size: 16 });
  varChip(p, 332, 440, 'bulk', { w: 120, color: GREEN, size: 16 });
}

export function queNoResuelveDexie(p) {
  baseBg(p);
  box(p, 60, 100, 392, 100, { color: MUTED, label: 'Dexie' });
  badge(p, 256, 260, 'sin JOIN', { color: MAGENTA, size: 22, w: 170 });
  badge(p, 130, 330, 'sin agregaciones', { color: MAGENTA, size: 18, w: 210 });
  badge(p, 382, 330, 'sin optimizador', { color: MAGENTA, size: 18, w: 210 });
  caption(p, 'tú eliges el índice', 256, 410, { color: TEXT, size: 24 });
}

export function esquemaDeTablaEnDexie(p) {
  baseBg(p);
  box(p, 50, 90, 412, 150, { color: CYAN, label: 'orders' });
  badge(p, 150, 175, 'id', { color: MAGENTA, size: 18, w: 100 });
  badge(p, 290, 175, '&email', { color: GREEN, size: 18, w: 130 });
  badge(p, 150, 290, '*tags', { color: AMBER, size: 18, w: 110 });
  badge(p, 330, 290, '[a+b]', { color: MAGENTA, size: 18, w: 130 });
  caption(p, 'solo se listan los indexados', 256, 390, { color: MUTED, size: 22 });
  caption(p, 'el primero es la clave primaria', 256, 430, { color: MUTED, size: 20 });
}

export function operacionesDelWhereClause(p) {
  baseBg(p);
  box(p, 50, 90, 412, 110, { color: MUTED, label: 'where(índice)' });
  badge(p, 130, 250, 'equals', { color: CYAN, size: 18, w: 130 });
  badge(p, 280, 250, 'between', { color: CYAN, size: 18, w: 140 });
  badge(p, 430, 250, 'anyOf', { color: CYAN, size: 18, w: 120 });
  badge(p, 130, 320, 'startsWith', { color: GREEN, size: 18, w: 150 });
  badge(p, 290, 320, 'noneOf', { color: GREEN, size: 18, w: 140 });
  badge(p, 430, 320, 'reverse', { color: GREEN, size: 18, w: 120 });
  caption(p, 'y Colección: limit, orderBy, or', 256, 410, { color: MUTED, size: 22 });
}

export function andYFilterSeEjecutanEnJavaScript(p) {
  baseBg(p);
  box(p, 60, 90, 392, 90, { color: CYAN, label: 'índice acotado' });
  p.arrow(256, 186, 256, 226, { color: CYAN });
  box(p, 60, 230, 392, 90, { color: AMBER, label: 'filter en JS' });
  caption(p, 'recorre lo que ya salió', 256, 295, { color: TEXT, size: 20 });
  badge(p, 256, 380, 'sin where = tabla entera', { color: MAGENTA, size: 20, w: 300 });
}

export function orderByYsortBy(p) {
  baseBg(p);
  box(p, 50, 110, 190, 240, { color: GREEN, label: 'orderBy' });
  caption(p, 'usa el índice', 145, 195, { color: TEXT, size: 22 });
  caption(p, 'puede parar', 145, 235, { color: TEXT, size: 20 });
  caption(p, 'antes', 145, 270, { color: TEXT, size: 20 });
  badge(p, 145, 320, 'limit', { color: GREEN, size: 18, w: 100 });
  box(p, 272, 110, 190, 240, { color: AMBER, label: 'sortBy' });
  caption(p, 'carga todo', 367, 195, { color: TEXT, size: 22 });
  caption(p, 'y ordena', 367, 235, { color: TEXT, size: 22 });
  caption(p, 'en memoria', 367, 275, { color: TEXT, size: 20 });
  badge(p, 367, 320, 'O(n)', { color: AMBER, size: 18, w: 100 });
}

export function reglasDeTransaccionEnDexie(p) {
  baseBg(p);
  box(p, 80, 90, 352, 100, { color: CYAN, label: 'db.transaction' });
  caption(p, "modo 'rw' + tablas", 256, 160, { color: TEXT, size: 22 });
  varChip(p, 170, 250, 'await put', { w: 150, color: GREEN, size: 18 });
  varChip(p, 342, 250, 'await add', { w: 150, color: GREEN, size: 18 });
  badge(p, 256, 340, 'excepción → revierte', { color: MAGENTA, size: 20, w: 250 });
  caption(p, 'await solo sobre operaciones Dexie', 256, 410, { color: MUTED, size: 20 });
}

export function dexieWaitFor(p) {
  baseBg(p);
  box(p, 70, 100, 372, 110, { color: CYAN, label: 'transacción' });
  fnPill(p, 256, 260, 'Dexie.waitFor', { w: 210, h: 58, size: 24, color: MAGENTA });
  p.arrow(256, 216, 256, 226, { color: CYAN });
  caption(p, 'espera promesas cortas', 256, 325, { color: TEXT, size: 22 });
  caption(p, 'no sustituye preparar antes', 256, 365, { color: MUTED, size: 20 });
  badge(p, 256, 430, 'fetch sigue prohibido', { color: MAGENTA, size: 18, w: 240 });
}

export function migracionesAutomaticasYUpgrade(p) {
  baseBg(p);
  box(p, 50, 100, 190, 230, { color: GREEN, label: 'automático' });
  caption(p, 'alta/baja de', 145, 185, { color: TEXT, size: 20 });
  caption(p, 'tablas e índices', 145, 220, { color: TEXT, size: 20 });
  box(p, 272, 100, 190, 230, { color: MAGENTA, label: 'upgrade' });
  caption(p, 'migrar', 367, 185, { color: TEXT, size: 20 });
  caption(p, 'los datos', 367, 220, { color: TEXT, size: 20 });
  badge(p, 367, 300, 'modify()', { color: MAGENTA, size: 18, w: 130 });
  caption(p, 'euros → céntimos', 256, 400, { color: MUTED, size: 22 });
}

export function cambiarClavePrimariaEnDexie(p) {
  baseBg(p);
  box(p, 50, 100, 180, 110, { color: CYAN, label: 'versión n' });
  caption(p, 'tabla nueva', 140, 175, { color: TEXT, size: 20 });
  badge(p, 140, 245, 'copiar', { color: GREEN, size: 18, w: 110 });
  box(p, 282, 100, 180, 110, { color: MAGENTA, label: 'versión n+1' });
  caption(p, 'borrar antigua', 372, 175, { color: TEXT, size: 20 });
  badge(p, 372, 245, 'null', { color: MAGENTA, size: 18, w: 100 });
  p.arrow(236, 155, 276, 155, { color: CYAN });
  caption(p, 'nunca en un solo paso', 256, 330, { color: MUTED, size: 22 });
}

export function migracionPerezosa(p) {
  baseBg(p);
  box(p, 70, 100, 372, 120, { color: CYAN, label: 'registro' });
  varChip(p, 160, 170, 'schemaVersion', { w: 190, color: MAGENTA, size: 18 });
  varChip(p, 350, 170, 'datos', { w: 120, color: GREEN, size: 18 });
  p.arrow(256, 226, 256, 266, { color: CYAN });
  box(p, 120, 270, 272, 90, { color: GREEN, label: 'transformar al leer' });
  caption(p, 'reescritura oportunista', 256, 410, { color: MUTED, size: 22 });
}

export function liveQueryEnDexie(p) {
  baseBg(p);
  fnPill(p, 256, 100, 'liveQuery()', { w: 190, h: 56, size: 24 });
  p.arrow(256, 132, 256, 180, { color: CYAN });
  box(p, 130, 185, 252, 90, { color: CYAN, label: 'consulta' });
  p.arrow(256, 281, 256, 325, { color: MAGENTA });
  badge(p, 256, 350, 'cambia → re-ejecuta', { color: MAGENTA, size: 20, w: 250 });
  caption(p, 'otra pestaña o Worker', 256, 420, { color: MUTED, size: 22 });
}

export function hooksDeDexie(p) {
  baseBg(p);
  box(p, 60, 90, 392, 100, { color: CYAN, label: 'orders' });
  badge(p, 256, 240, 'hook creating', { color: MAGENTA, size: 20, w: 190 });
  p.arrow(256, 196, 256, 210, { color: MAGENTA });
  box(p, 110, 290, 292, 90, { color: GREEN, label: 'outbox' });
  p.arrow(256, 270, 256, 284, { color: GREEN });
  caption(p, 'escritura atómica con trans', 256, 420, { color: MUTED, size: 20 });
}

export function precaucionesDeLosHooks(p) {
  baseBg(p);
  badge(p, 256, 120, 'solo la pestaña que escribe', { color: MAGENTA, size: 18, w: 300 });
  badge(p, 256, 185, 'reading en cada lectura', { color: AMBER, size: 18, w: 260 });
  badge(p, 256, 250, 'error → aborta', { color: MAGENTA, size: 18, w: 200 });
  badge(p, 256, 315, 'nunca red dentro', { color: MAGENTA, size: 18, w: 230 });
  caption(p, 'hook reading es costoso', 256, 400, { color: MUTED, size: 22 });
}

export function middlewareDbcore(p) {
  baseBg(p);
  box(p, 60, 90, 392, 90, { color: MUTED, label: 'IndexedDB' });
  p.arrow(256, 186, 256, 226, { color: CYAN });
  box(p, 60, 230, 392, 90, { color: CYAN, label: 'DBCore' });
  p.arrow(256, 326, 256, 366, { color: CYAN });
  varChip(p, 150, 400, 'petición', { w: 140, color: MAGENTA, size: 18 });
  varChip(p, 362, 400, 'objeto', { w: 140, color: GREEN, size: 18 });
  caption(p, 'intercepta todo', 256, 460, { color: MUTED, size: 20 });
}

export function operacionesMasivasDeDexie(p) {
  baseBg(p);
  box(p, 50, 100, 190, 230, { color: GREEN, label: 'bulkPut' });
  caption(p, '1 transacción', 145, 185, { color: TEXT, size: 20 });
  caption(p, 'peticiones', 145, 220, { color: TEXT, size: 20 });
  caption(p, 'encoladas', 145, 255, { color: TEXT, size: 20 });
  badge(p, 145, 300, '100x', { color: GREEN, size: 20, w: 100 });
  box(p, 272, 100, 190, 230, { color: MAGENTA, label: 'bucle await' });
  caption(p, 'ida y vuelta', 367, 185, { color: TEXT, size: 20 });
  caption(p, 'por registro', 367, 220, { color: TEXT, size: 20 });
  badge(p, 367, 300, '1x', { color: MAGENTA, size: 20, w: 100 });
  caption(p, 'esperar al final', 256, 400, { color: MUTED, size: 22 });
}

export function troceadoDeImportacionMasiva(p) {
  baseBg(p);
  box(p, 50, 100, 180, 90, { color: CYAN, label: 'lote 1' });
  box(p, 252, 100, 180, 90, { color: CYAN, label: 'lote 2' });
  box(p, 50, 220, 180, 90, { color: CYAN, label: 'lote 3' });
  box(p, 252, 220, 180, 90, { color: CYAN, label: 'lote 4' });
  p.arrow(236, 145, 246, 145, { color: MUTED });
  p.arrow(342, 196, 342, 214, { color: MUTED });
  p.arrow(236, 265, 246, 265, { color: MUTED });
  badge(p, 256, 370, '1.000 – 5.000 objetos', { color: GREEN, size: 20, w: 260 });
  caption(p, 'una transacción por lote', 256, 430, { color: MUTED, size: 22 });
}

export function fallosParcialesDeBulkPut(p) {
  baseBg(p);
  box(p, 60, 100, 392, 100, { color: CYAN, label: 'bulkPut' });
  p.arrow(256, 206, 256, 246, { color: MAGENTA });
  badge(p, 256, 280, 'BulkError', { color: MAGENTA, size: 22, w: 160 });
  varChip(p, 150, 360, 'fallo 1', { w: 130, color: MAGENTA, size: 18 });
  varChip(p, 362, 360, 'fallo 2', { w: 130, color: MAGENTA, size: 18 });
  caption(p, 'captura dentro de la transacción', 256, 430, { color: MUTED, size: 20 });
}

export function complementosDelEcosistemaDexie(p) {
  baseBg(p);
  varChip(p, 130, 120, 'react-hooks', { w: 170, color: CYAN, size: 18 });
  varChip(p, 382, 120, 'y-dexie', { w: 140, color: GREEN, size: 18 });
  varChip(p, 130, 210, 'export-import', { w: 190, color: MAGENTA, size: 18 });
  varChip(p, 382, 210, 'cloud-addon', { w: 170, color: AMBER, size: 18 });
  caption(p, 'useLiveQuery · Y.js · copias · sync', 256, 320, { color: TEXT, size: 20 });
  badge(p, 256, 390, 'dependencia externa', { color: AMBER, size: 20, w: 240 });
}
