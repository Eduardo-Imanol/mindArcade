// src/test/fakeIdb.js — minimal in-memory IndexedDB fake for tests (no deps)
export function createFakeIndexedDB() {
  const databases = new Map();

  function makeStore() {
    const data = new Map();
    return {
      data,
      api: {
        put: (value, key) => request(() => {
          data.set(key, value);
          return key;
        }),
        get: (key) => request(() => data.get(key)),
        delete: (key) => request(() => {
          data.delete(key);
          return undefined;
        }),
        clear: () => request(() => {
          data.clear();
          return undefined;
        }),
      },
    };
  }

  function request(fn) {
    const req = { result: undefined, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => {
      try {
        req.result = fn();
        if (req.onsuccess) req.onsuccess();
      } catch (e) {
        req.error = e;
        if (req.onerror) req.onerror();
      }
    });
    return req;
  }

  function makeDB() {
    const stores = new Map();
    return {
      objectStoreNames: {
        contains: (name) => stores.has(name),
      },
      createObjectStore: (name) => {
        const store = makeStore();
        stores.set(name, store);
        return store.api;
      },
      transaction: (name) => {
        const store = stores.get(name);
        const tx = { oncomplete: null, onerror: null, onabort: null, error: null };
        return {
          objectStore: () => {
            const api = store.api;
            const wrap = (method) => (...args) => {
              const inner = method(...args);
              const req = { result: undefined, error: null, onsuccess: null, onerror: null };
              inner.onsuccess = () => {
                req.result = inner.result;
                if (req.onsuccess) req.onsuccess();
                queueMicrotask(() => tx.oncomplete && tx.oncomplete());
              };
              inner.onerror = () => {
                req.error = inner.error;
                if (req.onerror) req.onerror();
                queueMicrotask(() => tx.onerror && tx.onerror());
              };
              return req;
            };
            return { put: wrap(api.put), get: wrap(api.get), delete: wrap(api.delete), clear: wrap(api.clear) };
          },
          set oncomplete(fn) {
            tx.oncomplete = fn;
          },
          set onerror(fn) {
            tx.onerror = fn;
          },
          set onabort(fn) {
            tx.onabort = fn;
          },
        };
      },
    };
  }

  return {
    open(name) {
      const req = { result: null, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
      queueMicrotask(() => {
        let db = databases.get(name);
        const fresh = !db;
        if (!db) {
          db = makeDB();
          databases.set(name, db);
        }
        req.result = db;
        if (fresh && req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
}

export function installFakeIndexedDB() {
  const previous = globalThis.indexedDB;
  globalThis.indexedDB = createFakeIndexedDB();
  return () => {
    globalThis.indexedDB = previous;
  };
}
