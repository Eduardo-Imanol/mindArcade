// src/core/storage/images.js — IndexedDB blob store for custom topic uploads
const DB_NAME = 'sepect.images.v1';
const STORE = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const idb = globalThis.indexedDB;
    if (!idb) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = idb.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

async function withStore(mode, operation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    let tx;
    try {
      tx = db.transaction(STORE, mode);
    } catch (e) {
      reject(e);
      return;
    }
    let result;
    let req;
    try {
      req = operation(tx.objectStore(STORE));
    } catch (e) {
      reject(e);
      return;
    }
    if (req) {
      req.onsuccess = () => {
        result = req.result;
      };
      req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('IndexedDB tx failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB tx aborted'));
  });
}

export async function saveImage(key, blob) {
  try {
    await withStore('readwrite', (store) => store.put(blob, key));
    return { ok: true };
  } catch {
    console.warn('Sepect: no se pudo guardar la imagen (IndexedDB no disponible o sin cuota)');
    return { ok: false };
  }
}

export async function getImage(key) {
  try {
    const blob = await withStore('readonly', (store) => store.get(key));
    return blob ?? null;
  } catch {
    return null;
  }
}

export async function deleteImage(key) {
  try {
    await withStore('readwrite', (store) => store.delete(key));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function getObjectURL(key) {
  const blob = await getImage(key);
  if (!blob) return null;
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return null;
  try {
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function revokeObjectURL(url) {
  if (!url) return;
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* noop */
  }
}
