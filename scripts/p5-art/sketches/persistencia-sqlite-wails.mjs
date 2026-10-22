// scripts/p5-art/sketches/persistencia-sqlite-wails.mjs — sección 5: SQLite en escritorio con Wails y Go.
import { baseBg } from '../engine.mjs';
import { AMBER, CYAN, GREEN, MAGENTA, MUTED, TEXT } from '../palette.mjs';
import { badge, box, caption, fnPill, stackFrame, varChip } from '../primitives.mjs';

export function comunicacionWebviewYGoEnWails(p) {
  baseBg(p);
  box(p, 50, 110, 180, 230, { color: CYAN, label: 'WebView' });
  caption(p, 'JS', 140, 190, { color: TEXT, size: 24 });
  badge(p, 140, 240, 'async', { color: CYAN, size: 18, w: 110 });
  badge(p, 140, 290, 'events', { color: GREEN, size: 18, w: 120 });
  box(p, 282, 110, 180, 230, { color: GREEN, label: 'proceso Go' });
  caption(p, 'servicios', 372, 190, { color: TEXT, size: 24 });
  badge(p, 372, 240, 'Bind', { color: GREEN, size: 18, w: 100 });
  badge(p, 372, 290, 'SQLite', { color: MAGENTA, size: 18, w: 110 });
  p.arrow(236, 200, 276, 200, { color: AMBER });
  p.arrow(276, 250, 236, 250, { color: AMBER, dashed: true });
  caption(p, 'IPC por canales nativos', 256, 400, { color: TEXT, size: 22 });
  caption(p, 'no hay servidor HTTP local', 256, 440, { color: MUTED, size: 20 });
}

export function ipcSinNPlusUno(p) {
  baseBg(p);
  box(p, 50, 100, 190, 250, { color: MAGENTA, label: 'N+1' });
  varChip(p, 145, 170, 'fila 1', { w: 130, color: MAGENTA, size: 16 });
  varChip(p, 145, 215, 'fila 2', { w: 130, color: MAGENTA, size: 16 });
  varChip(p, 145, 260, 'fila 3', { w: 130, color: MAGENTA, size: 16 });
  caption(p, '1 llamada', 145, 310, { color: TEXT, size: 20 });
  caption(p, 'por fila', 145, 340, { color: TEXT, size: 20 });
  box(p, 272, 100, 190, 250, { color: GREEN, label: 'caso de uso' });
  fnPill(p, 367, 200, 'List(limit)', { w: 160, h: 52, size: 20, color: GREEN });
  caption(p, 'filtro + cursor', 367, 270, { color: TEXT, size: 20 });
  badge(p, 367, 320, '1 viaje', { color: GREEN, size: 18, w: 120 });
  caption(p, 'JSON en ambos sentidos', 256, 410, { color: MUTED, size: 22 });
}

export function payloadsPorElIpc(p) {
  baseBg(p);
  badge(p, 140, 130, 'base64', { color: MAGENTA, size: 20, w: 140 });
  badge(p, 140, 195, '+33 %', { color: MAGENTA, size: 18, w: 120 });
  badge(p, 372, 130, 'int64', { color: AMBER, size: 20, w: 130 });
  badge(p, 372, 195, 'como texto', { color: AMBER, size: 18, w: 140 });
  badge(p, 140, 280, 'fechas', { color: CYAN, size: 20, w: 130 });
  badge(p, 140, 335, 'epoch ms', { color: CYAN, size: 18, w: 130 });
  badge(p, 372, 280, '2^53', { color: MAGENTA, size: 20, w: 120 });
  badge(p, 372, 335, 'límite JS', { color: MAGENTA, size: 18, w: 140 });
  caption(p, 'sin zona horaria del WebView', 256, 420, { color: MUTED, size: 20 });
}

export function puenteIpcComoLimiteDeConfianza(p) {
  baseBg(p);
  box(p, 60, 100, 180, 120, { color: MAGENTA, label: 'XSS' });
  caption(p, 'WebView', 150, 180, { color: TEXT, size: 20 });
  p.arrow(246, 160, 316, 160, { color: MAGENTA });
  badge(p, 392, 160, 'Exec(sql)', { color: MAGENTA, size: 18, w: 150 });
  p.push();
  p.stroke(MAGENTA);
  p.strokeWeight(5);
  p.line(350, 140, 434, 180);
  p.line(434, 140, 350, 180);
  p.pop();
  caption(p, 'nunca enlazar SQL genérico', 256, 270, { color: TEXT, size: 22 });
  badge(p, 256, 330, 'validar en Go', { color: GREEN, size: 20, w: 180 });
  badge(p, 256, 385, 'superficie mínima', { color: GREEN, size: 20, w: 220 });
}

export function driversDeSqliteParaGo(p) {
  baseBg(p);
  box(p, 40, 100, 140, 240, { color: CYAN, label: 'modernc' });
  caption(p, 'Go puro', 110, 190, { color: TEXT, size: 20 });
  caption(p, 'sin CGO', 110, 225, { color: TEXT, size: 20 });
  badge(p, 110, 300, 'algo lento', { color: AMBER, size: 16, w: 120 });
  box(p, 186, 100, 140, 240, { color: GREEN, label: 'mattn' });
  caption(p, 'más maduro', 256, 190, { color: TEXT, size: 20 });
  caption(p, 'con CGO', 256, 225, { color: TEXT, size: 20 });
  badge(p, 256, 300, 'SQLCipher', { color: GREEN, size: 16, w: 130 });
  box(p, 332, 100, 140, 240, { color: MAGENTA, label: 'ncruces' });
  caption(p, 'WebAssembly', 402, 190, { color: TEXT, size: 18 });
  caption(p, 'con wazero', 402, 225, { color: TEXT, size: 18 });
  badge(p, 402, 300, 'VFS cifrado', { color: MAGENTA, size: 16, w: 120 });
  caption(p, 'mide con tus consultas', 256, 410, { color: MUTED, size: 22 });
}

export function trampaDelDsnPorDriver(p) {
  baseBg(p);
  box(p, 50, 100, 412, 100, { color: MUTED, label: 'DSN' });
  caption(p, '_journal_mode=WAL', 256, 160, { color: TEXT, size: 22 });
  p.arrow(256, 206, 256, 246, { color: MAGENTA });
  badge(p, 256, 280, 'ignorado en silencio', { color: MAGENTA, size: 20, w: 250 });
  box(p, 90, 330, 150, 80, { color: MAGENTA, label: 'delete' });
  box(p, 272, 330, 150, 80, { color: MAGENTA, label: 'busy 0' });
  caption(p, 'verificar PRAGMA al arrancar', 256, 450, { color: MUTED, size: 22 });
}

export function pragmasRecomendados(p) {
  baseBg(p);
  badge(p, 150, 110, 'WAL', { color: GREEN, size: 20, w: 110 });
  badge(p, 362, 110, 'busy 5 s', { color: AMBER, size: 20, w: 150 });
  badge(p, 150, 185, 'FK ON', { color: CYAN, size: 20, w: 140 });
  badge(p, 362, 185, 'sync NORMAL', { color: CYAN, size: 20, w: 180 });
  badge(p, 150, 260, 'cache -20M', { color: MAGENTA, size: 18, w: 160 });
  badge(p, 362, 260, 'query_only', { color: MAGENTA, size: 18, w: 160 });
  badge(p, 150, 335, 'user_version', { color: GREEN, size: 18, w: 160 });
  badge(p, 362, 335, 'temp MEM', { color: GREEN, size: 18, w: 140 });
  caption(p, 'por conexión, en el DSN', 256, 420, { color: MUTED, size: 22 });
}

export function modoWalDeSqlite(p) {
  baseBg(p);
  box(p, 60, 140, 150, 120, { color: CYAN, label: 'app.db' });
  box(p, 300, 100, 160, 100, { color: MAGENTA, label: 'app.db-wal' });
  box(p, 300, 250, 160, 100, { color: AMBER, label: 'app.db-shm' });
  p.arrow(216, 180, 294, 150, { color: MAGENTA });
  p.arrow(216, 230, 294, 290, { color: AMBER });
  caption(p, 'lectores no bloquean', 256, 400, { color: TEXT, size: 22 });
  badge(p, 256, 445, 'un solo escritor', { color: GREEN, size: 20, w: 180 });
}

export function problemasDelModoWal(p) {
  baseBg(p);
  badge(p, 140, 115, 'wal crece', { color: MAGENTA, size: 18, w: 160 });
  badge(p, 372, 115, 'no copiar .db', { color: MAGENTA, size: 18, w: 180 });
  badge(p, 140, 195, 'lectura larga', { color: AMBER, size: 18, w: 170 });
  badge(p, 372, 195, 'sin NFS', { color: AMBER, size: 18, w: 140 });
  box(p, 90, 260, 332, 110, { color: CYAN, label: 'checkpoint' });
  caption(p, 'VACUUM INTO para copias', 256, 340, { color: TEXT, size: 20 });
  caption(p, 'copia cuando la app está quieta', 256, 420, { color: MUTED, size: 20 });
}

export function evitarSqliteBusy(p) {
  baseBg(p);
  box(p, 50, 100, 190, 240, { color: GREEN, label: 'pool escritura' });
  caption(p, '1 conexión', 145, 195, { color: TEXT, size: 22 });
  caption(p, 'serializa en Go', 145, 235, { color: TEXT, size: 20 });
  badge(p, 145, 300, 'BEGIN IMMEDIATE', { color: GREEN, size: 16, w: 160 });
  box(p, 272, 100, 190, 240, { color: CYAN, label: 'pool lectura' });
  caption(p, 'varias', 367, 195, { color: TEXT, size: 22 });
  caption(p, 'query_only', 367, 235, { color: TEXT, size: 20 });
  badge(p, 367, 300, 'sin bloqueos', { color: CYAN, size: 16, w: 140 });
  caption(p, 'nunca SQLITE_BUSY', 256, 410, { color: MUTED, size: 22 });
}

export function opcionStrictDeSqlite(p) {
  baseBg(p);
  box(p, 60, 100, 180, 110, { color: GREEN, label: 'STRICT' });
  caption(p, 'tipos', 150, 175, { color: TEXT, size: 22 });
  badge(p, 150, 240, 'INTEGER', { color: GREEN, size: 18, w: 130 });
  box(p, 272, 100, 180, 110, { color: CYAN, label: 'CHECK' });
  caption(p, 'invariantes', 362, 175, { color: TEXT, size: 22 });
  badge(p, 362, 240, 'dirty IN (0,1)', { color: CYAN, size: 14, w: 160 });
  caption(p, 'sin tipado flexible', 256, 330, { color: TEXT, size: 24 });
  caption(p, 'la base rechaza el error', 256, 375, { color: MUTED, size: 20 });
}

export function withoutRowid(p) {
  baseBg(p);
  box(p, 50, 110, 180, 240, { color: MUTED, label: 'rowid' });
  caption(p, 'árbol + índice', 140, 200, { color: TEXT, size: 20 });
  caption(p, 'extra', 140, 235, { color: TEXT, size: 20 });
  box(p, 272, 110, 180, 240, { color: GREEN, label: 'WITHOUT ROWID' });
  caption(p, 'la clave es', 362, 200, { color: TEXT, size: 20 });
  caption(p, 'el árbol', 362, 235, { color: TEXT, size: 20 });
  badge(p, 362, 300, 'ahorra índice', { color: GREEN, size: 16, w: 150 });
  caption(p, 'filas pequeñas con clave compuesta', 256, 410, { color: MUTED, size: 20 });
}

export function clavesForaneasDeferrables(p) {
  baseBg(p);
  varChip(p, 150, 120, 'pedido', { w: 140, color: MAGENTA });
  varChip(p, 362, 120, 'cliente', { w: 140, color: MAGENTA });
  p.arrow(226, 120, 300, 120, { color: AMBER, dashed: true });
  caption(p, 'llega después', 256, 170, { color: AMBER, size: 20 });
  badge(p, 256, 240, 'DEFERRED', { color: GREEN, size: 20, w: 150 });
  caption(p, 'se comprueba al confirmar', 256, 300, { color: TEXT, size: 22 });
  caption(p, 'no al insertar', 256, 340, { color: MUTED, size: 20 });
  box(p, 120, 390, 272, 70, { color: CYAN, label: 'mismo orden libre' });
}

export function indicesParciales(p) {
  baseBg(p);
  box(p, 50, 100, 200, 250, { color: MUTED, label: 'orders' });
  varChip(p, 150, 175, '1.000.000', { w: 170, color: MUTED, size: 18 });
  caption(p, 'filas', 150, 235, { color: TEXT, size: 20 });
  box(p, 282, 100, 180, 250, { color: GREEN, label: 'índice' });
  caption(p, 'WHERE', 372, 175, { color: TEXT, size: 20 });
  caption(p, 'dirty = 1', 372, 215, { color: GREEN, size: 20 });
  badge(p, 372, 300, 'diminuto', { color: GREEN, size: 18, w: 130 });
  caption(p, 'el índice disperso de IndexedDB', 256, 410, { color: MUTED, size: 20 });
}

export function migracionesDeEsquemaEnSqlite(p) {
  baseBg(p);
  badge(p, 140, 110, 'user_version', { color: CYAN, size: 18, w: 170 });
  badge(p, 372, 110, 'go:embed', { color: MAGENTA, size: 18, w: 150 });
  stackFrame(p, 80, 180, 200, 40, '0001_init.sql', { color: GREEN, size: 16 });
  stackFrame(p, 80, 226, 200, 40, '0002_outbox.sql', { color: GREEN, size: 16 });
  stackFrame(p, 80, 272, 200, 40, '0003_index.sql', { color: GREEN, size: 16 });
  p.arrow(286, 246, 316, 246, { color: MAGENTA });
  badge(p, 372, 246, 'atómicas', { color: GREEN, size: 18, w: 140 });
  caption(p, 'solo hacia delante', 256, 350, { color: TEXT, size: 22 });
  caption(p, 'copia antes de migrar', 256, 395, { color: MUTED, size: 20 });
}

export function reconstruccionDeTabla(p) {
  baseBg(p);
  box(p, 40, 100, 140, 90, { color: CYAN, label: 'crear' });
  box(p, 186, 100, 140, 90, { color: CYAN, label: 'copiar' });
  box(p, 332, 100, 140, 90, { color: CYAN, label: 'borrar' });
  p.arrow(186, 145, 180, 145, { color: MUTED });
  p.arrow(332, 145, 326, 145, { color: MUTED });
  box(p, 186, 230, 140, 90, { color: GREEN, label: 'renombrar' });
  p.arrow(256, 196, 256, 224, { color: GREEN });
  badge(p, 256, 380, 'foreign_keys = OFF', { color: AMBER, size: 18, w: 250 });
  caption(p, 'fuera de la transacción', 256, 425, { color: MUTED, size: 20 });
}

export function transaccionDeEscrituraEnGo(p) {
  baseBg(p);
  box(p, 70, 90, 372, 260, { color: CYAN, label: 'transacción' });
  varChip(p, 170, 170, 'entidad', { w: 140, color: GREEN, size: 18 });
  varChip(p, 342, 170, 'líneas', { w: 130, color: GREEN, size: 18 });
  varChip(p, 170, 260, 'outbox', { w: 140, color: MAGENTA, size: 18 });
  varChip(p, 342, 260, 'idempot', { w: 140, color: MAGENTA, size: 18 });
  badge(p, 256, 400, 'todo o nada', { color: GREEN, size: 22, w: 180 });
}

export function repositorioVSservicioEnlazado(p) {
  baseBg(p);
  box(p, 50, 100, 190, 230, { color: GREEN, label: 'servicio' });
  caption(p, 'valida', 145, 190, { color: TEXT, size: 20 });
  caption(p, 'orquesta', 145, 225, { color: TEXT, size: 20 });
  caption(p, 'devuelve DTO', 145, 260, { color: TEXT, size: 20 });
  p.arrow(246, 215, 296, 215, { color: CYAN });
  box(p, 302, 100, 160, 230, { color: CYAN, label: 'repositorio' });
  caption(p, 'datos', 382, 190, { color: TEXT, size: 20 });
  caption(p, 'SQL', 382, 225, { color: TEXT, size: 20 });
  caption(p, 'y nada más', 382, 260, { color: TEXT, size: 20 });
  caption(p, 'sin tipos genéricos', 256, 400, { color: MUTED, size: 22 });
}

export function paginacionPorClavesEnElRepositorio(p) {
  baseBg(p);
  varChip(p, 140, 120, 'cursor', { w: 130, color: MAGENTA });
  varChip(p, 372, 120, 'opaco', { w: 120, color: MAGENTA });
  p.arrow(206, 165, 206, 205, { color: CYAN });
  badge(p, 206, 235, '(fecha, id)', { color: CYAN, size: 18, w: 160 });
  caption(p, 'WHERE (fecha, id) <', 256, 310, { color: TEXT, size: 22 });
  badge(p, 256, 370, 'ORDER BY fecha, id', { color: GREEN, size: 18, w: 240 });
  caption(p, 'el frontend no interpreta', 256, 420, { color: MUTED, size: 20 });
}

export function queProtegeElCifradoEnReposo(p) {
  baseBg(p);
  box(p, 50, 100, 190, 240, { color: GREEN, label: 'protegido' });
  caption(p, 'robo del', 145, 190, { color: TEXT, size: 20 });
  caption(p, 'equipo', 145, 225, { color: TEXT, size: 20 });
  caption(p, 'copias filtradas', 145, 265, { color: TEXT, size: 18 });
  box(p, 272, 100, 190, 240, { color: MAGENTA, label: 'no protege' });
  caption(p, 'malware con', 367, 190, { color: TEXT, size: 20 });
  caption(p, 'la sesión abierta', 367, 225, { color: TEXT, size: 20 });
  caption(p, 'WebView comprometido', 367, 265, { color: TEXT, size: 16 });
  caption(p, 'la clave vive en memoria', 256, 400, { color: MUTED, size: 22 });
}

export function sqlCipherFrenteAAlternativas(p) {
  baseBg(p);
  box(p, 40, 100, 150, 250, { color: GREEN, label: 'SQLCipher' });
  badge(p, 115, 185, 'AES-256', { color: GREEN, size: 16, w: 120 });
  badge(p, 115, 235, 'HMAC', { color: GREEN, size: 16, w: 110 });
  caption(p, 'autentica', 115, 295, { color: TEXT, size: 20 });
  caption(p, 'las páginas', 115, 325, { color: TEXT, size: 20 });
  box(p, 196, 100, 140, 250, { color: AMBER, label: 'VFS' });
  caption(p, 'cifra', 266, 195, { color: TEXT, size: 20 });
  caption(p, 'pero no', 266, 230, { color: TEXT, size: 20 });
  caption(p, 'autentica', 266, 265, { color: TEXT, size: 20 });
  box(p, 342, 100, 130, 250, { color: MAGENTA, label: 'app' });
  caption(p, 'no se', 407, 195, { color: TEXT, size: 20 });
  caption(p, 'indexa', 407, 230, { color: TEXT, size: 20 });
  caption(p, 'el cifrado', 407, 265, { color: TEXT, size: 18 });
  caption(p, 'elegir por amenaza, no por moda', 256, 410, { color: MUTED, size: 20 });
}

export function trampaDeLaEtiquetaSqlcipher(p) {
  baseBg(p);
  box(p, 50, 100, 190, 240, { color: MAGENTA, label: 'mattn' });
  caption(p, '-tags sqlcipher', 145, 190, { color: TEXT, size: 18 });
  caption(p, 'enlaza SQLite', 145, 225, { color: TEXT, size: 20 });
  caption(p, 'normal', 145, 260, { color: TEXT, size: 20 });
  box(p, 272, 100, 190, 240, { color: AMBER, label: 'PRAGMA key' });
  badge(p, 367, 185, 'sin efecto', { color: MAGENTA, size: 18, w: 150 });
  caption(p, 'la base queda', 367, 250, { color: TEXT, size: 20 });
  caption(p, 'sin cifrar', 367, 285, { color: TEXT, size: 20 });
  badge(p, 256, 390, 'y sin ningún error', { color: MAGENTA, size: 20, w: 250 });
}

export function comprobarQueElCifradoEstaActivo(p) {
  baseBg(p);
  fnPill(p, 256, 110, 'PRAGMA cipher_version', { w: 280, h: 54, size: 20, color: GREEN });
  p.arrow(256, 140, 256, 180, { color: CYAN });
  box(p, 90, 185, 160, 90, { color: GREEN, label: 'strings' });
  caption(p, 'sin texto', 170, 245, { color: TEXT, size: 18 });
  box(p, 262, 185, 160, 90, { color: GREEN, label: 'sqlite3' });
  caption(p, 'no es una db', 342, 245, { color: TEXT, size: 16 });
  caption(p, 'comprobar el archivo', 256, 330, { color: TEXT, size: 24 });
  caption(p, 'y no solo el código', 256, 375, { color: MUTED, size: 20 });
}

export function gestionDeClavesDeCifrado(p) {
  baseBg(p);
  box(p, 40, 100, 200, 240, { color: CYAN, label: 'llavero del SO' });
  caption(p, 'clave aleatoria', 140, 190, { color: TEXT, size: 20 });
  caption(p, 'de 256 bits', 140, 225, { color: TEXT, size: 20 });
  caption(p, 'Keychain · DPAPI', 140, 265, { color: MUTED, size: 16 });
  box(p, 256, 100, 216, 240, { color: MAGENTA, label: 'contraseña' });
  caption(p, 'Argon2id', 364, 190, { color: TEXT, size: 20 });
  caption(p, 'protege con la', 364, 225, { color: TEXT, size: 18 });
  caption(p, 'sesión abierta', 364, 260, { color: TEXT, size: 18 });
  caption(p, 'nunca junto a la base', 256, 400, { color: MUTED, size: 22 });
}

export function copiaDeSeguridadConsistente(p) {
  baseBg(p);
  box(p, 50, 100, 190, 120, { color: MUTED, label: 'app.db' });
  box(p, 50, 240, 190, 120, { color: MUTED, label: 'app.db-wal' });
  p.arrow(246, 160, 296, 160, { color: MAGENTA });
  p.arrow(246, 300, 296, 300, { color: MAGENTA });
  box(p, 302, 170, 160, 120, { color: GREEN, label: 'VACUUM INTO' });
  caption(p, 'copia compacta', 382, 250, { color: TEXT, size: 18 });
  caption(p, 'nunca copiar el .db', 256, 410, { color: MAGENTA, size: 22 });
  caption(p, 'con la app en marcha', 256, 450, { color: MUTED, size: 20 });
}

export function mantenimientoDeLaBaseLocal(p) {
  baseBg(p);
  badge(p, 150, 105, 'optimize', { color: GREEN, size: 18, w: 160 });
  badge(p, 362, 105, 'checkpoint', { color: GREEN, size: 18, w: 160 });
  badge(p, 150, 175, 'purga lápidas', { color: CYAN, size: 18, w: 170 });
  badge(p, 362, 175, 'quick_check', { color: CYAN, size: 18, w: 170 });
  badge(p, 150, 245, 'VACUUM', { color: AMBER, size: 18, w: 150 });
  badge(p, 362, 245, 'auto_vacuum', { color: AMBER, size: 18, w: 170 });
  box(p, 100, 320, 312, 90, { color: MAGENTA, label: 'fuera del arranque' });
  caption(p, 'integridad en segundo plano', 256, 450, { color: MUTED, size: 20 });
}
