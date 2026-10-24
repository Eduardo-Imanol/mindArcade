# Persistencia local, PWAs y offline-first: guía técnica exhaustiva

*IndexedDB · Dexie.js · SQLite con Wails y Go · Sincronización y conflictos · Seguridad · Código de referencia en TypeScript y Go*

## 0. Mapa y convenciones

Esta guía cubre la persistencia de datos en el cliente, desde las bases conceptuales del almacenamiento en el navegador hasta bases de datos embebidas en escritorio, y el diseño de aplicaciones que funcionan sin red.

1. Almacenamiento en el cliente: bases conceptuales, cuotas y expulsión
2. Arquitectura y paradigmas offline-first
3. IndexedDB a bajo nivel
4. Dexie.js: consultas, esquemas, hooks, middleware y operaciones masivas
5. SQLite en escritorio con Wails y Go
6. Estructuras para sincronización y resolución de conflictos
7. Patrón Repositorio y arquitectura multiplataforma
8. Caché e invalidación
9. Seguridad y cifrado (Web Crypto, SQLCipher, llaveros del sistema)
10. Memoria y dispositivos con recursos limitados
11. Cuándo elegir cada tecnología (incluye SQLite WASM + OPFS)
12. Lista de verificación de producción y pruebas
13. Lecturas recomendadas

**Estado de las tecnologías (verificado en octubre de 2026):** Dexie.js está en la serie 4.x (4.4.x), con los complementos `dexie-react-hooks`, `y-dexie` y `dexie-cloud-addon`. Wails v2 es la versión estable (2.14 en las versiones publicadas); Wails v3 está en beta (3.0.0-beta.x) con API que sus autores describen como estable pero aún pre-release. SQLite en el navegador cuenta con el build oficial `@sqlite.org/sqlite-wasm`. Los límites de almacenamiento provienen de la página de MDN *Storage quotas and eviction criteria* (revisada en enero de 2026); **cambian entre versiones de navegador, así que revísalos antes de tomar decisiones de capacidad.**

**Convenciones:** TypeScript en modo estricto (comillas simples) y Go 1.22 o superior con `database/sql`. El código es didáctico: prioriza la claridad del diseño sobre el manejo exhaustivo de errores. Los nombres de identificadores van en inglés y los comentarios en español.

---

## 1. Almacenamiento en el cliente: bases conceptuales

### 1.1 Panorama de tecnologías

| Tecnología | Modelo | Sincronía | Disponible en Workers | Capacidad | Úsala para |
| --- | --- | --- | --- | --- | --- |
| Cookies | Pares de texto enviados en cada petición HTTP | Síncrona | No (Service Worker: Cookie Store) | \~4 KB cada una | Sesión (HttpOnly), nunca datos |
| Web Storage (`localStorage`, `sessionStorage`) | Clave y valor, solo cadenas | **Síncrona: bloquea el hilo principal** | No | 5 MiB local + 5 MiB de sesión por origen | Preferencias mínimas |
| IndexedDB | Object stores transaccionales con índices; admite *structured clone* | Asíncrona | Sí (ventana, Worker, Service Worker) | Cuota del origen | Datos estructurados y offline-first |
| Cache API | Pares Request/Response | Asíncrona | Sí | Cuota del origen | Recursos estáticos y respuestas HTTP |
| OPFS (Origin Private File System) | Sistema de archivos privado del origen | Asíncrona; acceso síncrono solo en Workers | Sí | Cuota del origen | Archivos grandes y SQLite en WASM |
| File System Access | Archivos del usuario, con permiso explícito | Asíncrona | Parcial | Disco del usuario | Abrir y guardar documentos (Chromium) |
| Storage Buckets | Buckets con política propia de persistencia y durabilidad | Asíncrona | Sí | Cuota del origen | Separar datos críticos de la caché (Chromium) |
| WebSQL | SQLite expuesto al navegador | Asíncrona | No |  | Obsoleto y retirado; no usar |

IndexedDB, la Cache API y OPFS comparten **la misma cuota de origen**. Web Storage tiene su propio mecanismo y su propio tope.

### 1.2 Modelo de origen, particionado y alcance

- **Un origen** es esquema + host + puerto. Las cuotas y la expulsión se aplican al origen completo, aunque aloje varias aplicaciones en rutas distintas (`/site1/`, `/site2/` comparten todo).
- **Particionado del almacenamiento:** los iframes de terceros reciben almacenamiento separado por sitio de nivel superior para evitar el rastreo entre sitios. Es relevante si tu aplicación se incrusta en otra.
- **Alcance:** el almacenamiento es por perfil de navegador y por dispositivo. No viaja con el usuario, no se sincroniza y puede estar compartido entre pestañas (concurrencia real de varias pestañas sobre la misma base).
- **Modo privado:** las cuotas pueden ser distintas y los datos suelen borrarse al cerrar la sesión privada.
- **Contexto seguro:** Service Workers, Web Crypto, Storage Manager y OPFS exigen HTTPS (o `localhost`).

### 1.3 Persistencia, cuotas y expulsión

**Dos modos de almacenamiento.** Por defecto, los datos de un origen son *best-effort*: persisten mientras el origen esté bajo su cuota, el dispositivo tenga espacio y el usuario no los borre. Un origen puede pedir ser **persistente** con `navigator.storage.persist()`; solo entonces el navegador no los expulsa por presión de almacenamiento y únicamente el usuario puede borrarlos. La decisión varía por navegador: Firefox muestra un aviso al usuario, mientras que Safari y los navegadores basados en Chromium aprueban o deniegan automáticamente según el historial de interacción con el sitio (por eso conviene solicitarlo tras una acción significativa del usuario, no al cargar la página).

**Cuotas por origen** (según MDN; el valor se calcula sobre el tamaño *total* del disco para evitar el *fingerprinting*, así que puede no ser alcanzable en la práctica):

| Navegador | Modo best-effort | Modo persistente |
| --- | --- | --- |
| Chrome y basados en Chromium (Edge) | Hasta el 60 % del disco | Hasta el 60 % del disco |
| Firefox | El menor entre el 10 % del disco y 10 GiB (límite de grupo por sitio) | Hasta el 50 % del disco (máximo 8 TiB), sin límite de grupo |
| Safari (macOS 14 e iOS 17 o posteriores) | Aprox. 60 % del disco en apps de navegador; aprox. 15 % en apps que incrustan WKWebView; un sitio guardado en la pantalla de inicio o el Dock usa la cuota de navegador (aprox. 60 %) | Misma política; los iframes entre orígenes reciben alrededor de 1/10 de la cuota de su padre |

Además existen topes globales: Chrome usa como máximo alrededor del 80 % del disco para todos los orígenes combinados, y WebKit el 80 % para apps de navegador y el 20 % para apps no navegador. En versiones antiguas de Safari el origen empezaba con 1 GiB y el navegador pedía permiso al usuario para ampliar.

**Cuándo se expulsan los datos:**

1. **Presión de almacenamiento:** el dispositivo se queda sin espacio y el navegador elimina orígenes enteros en orden LRU (el menos usado recientemente primero). Los orígenes persistentes se saltan.
2. **Tope global excedido:** si la suma de todos los orígenes supera el máximo del navegador, se aplica la misma política LRU.
3. **Expulsión proactiva (solo Safari):** con la prevención de rastreo entre sitios activa, si el origen no recibe ninguna interacción del usuario (clic o toque) en siete días de uso del navegador, se borran los datos creados por script (las cookies enviadas por el servidor están exentas). WebKit documenta que las aplicaciones web añadidas a la pantalla de inicio se tratan de forma distinta de las pestañas del navegador, pero verifica el comportamiento de tu versión de iOS.

**La expulsión es todo o nada por origen:** se borran juntos IndexedDB, Cache API y el resto, para no dejar estados inconsistentes. Consecuencia de diseño: **tu aplicación debe poder arrancar desde cero y reconstruirse desde el servidor**, y debe detectar ese caso (por ejemplo, con un registro `installId` en la base que desaparece) para avisar al usuario de los cambios no sincronizados que se perdieron.

**Medición:** `navigator.storage.estimate()` devuelve uso y cuota *estimados* (el navegador añade relleno al contenido de otros orígenes). Escribir por encima de la cuota lanza `QuotaExceededError` en IndexedDB, Cache y OPFS.

```ts
export interface StorageHealth {
  supported: boolean;
  persisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageRatio: number; // 0..1
}

/** Llamar tras una acción significativa del usuario (primer guardado, instalación). */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function storageHealth(): Promise<StorageHealth> {
  if (!navigator.storage?.estimate) {
    return { supported: false, persisted: false, usageBytes: 0, quotaBytes: 0, usageRatio: 0 };
  }
  const [{ usage = 0, quota = 0 }, persisted] = await Promise.all([
    navigator.storage.estimate(),
    navigator.storage.persisted?.() ?? Promise.resolve(false),
  ]);
  return {
    supported: true,
    persisted,
    usageBytes: usage,
    quotaBytes: quota,
    usageRatio: quota ? usage / quota : 0,
  };
}

export function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
}
```

**Estrategia ante la cuota:** (1) clasifica tus datos en *críticos* (cambios sin sincronizar, borradores) y *recuperables* (cachés, catálogos); (2) vigila el uso y, al pasar de un umbral (por ejemplo, 80 %), expulsa tú mismo los recuperables por LRU antes de que lo haga el navegador; (3) captura `QuotaExceededError` en cada escritura, libera espacio y reintenta una vez; (4) si no queda espacio para datos críticos, avisa al usuario en lugar de fallar en silencio. En Chromium, la API **Storage Buckets** permite abrir un bucket con `persisted: true` para los datos críticos y otros descartables para la caché.

### 1.4 Contextos de ejecución: navegador, PWA instalada y WebView

- **PWA instalada:** manifiesto, Service Worker y HTTPS. En Chromium, instalarla, usarla con frecuencia o activar notificaciones mejora la probabilidad de que `persist()` se conceda. Las capacidades de segundo plano (Background Sync, Periodic Background Sync) son **solo de Chromium** (sección 6).
- **WebView embebida** (Wails, Electron, Tauri, Capacitor): el motor del WebView (WebView2 en Windows, WKWebView en macOS, WebKitGTK en Linux) aplica sus propias políticas de almacenamiento, y el origen que ve la página es sintético (por ejemplo `wails://wails` o `http://wails.localhost`, según plataforma y versión). Los datos viven en una carpeta de perfil del WebView que el usuario no ve ni respalda, y pueden perderse al reinstalar o limpiar el perfil. Por eso **en escritorio suele ser preferible una base SQLite en un archivo que tú controlas desde Go** (sección 5).
- **Safari e iOS:** el límite de siete días de la expulsión proactiva, el soporte parcial de varias APIs y los errores históricos de IndexedDB con `Blob` hacen necesario probar en dispositivos reales.

### 1.5 Límites de seguridad del almacenamiento del navegador

Cualquier JavaScript que se ejecute en tu origen (propio o inyectado por XSS) lee y escribe todo el almacenamiento. Los datos no están cifrados por la aplicación (solo por el cifrado de disco del sistema), pueden ser borrados por el usuario («borrar datos del sitio») y no tienen respaldo. Estas son las razones por las que el diseño offline-first debe asumir que **la copia local es una réplica, no el único ejemplar**, y por las que la sección 9 trata el cifrado.

---

## 2. Arquitectura y paradigmas offline-first

### 2.1 Definiciones

- **Offline-capable:** la aplicación sigue mostrando algo sin red (una caché). Las escrituras fallan o se pierden.
- **Offline-first:** la aplicación se diseña para funcionar *contra una base de datos local*; la red es un canal de replicación en segundo plano. Leer y escribir nunca esperan al servidor.
- **Local-first** (Kleppmann et al., 2019): además, el usuario es el dueño de sus datos; siete ideales: rapidez, multidispositivo, offline, colaboración, longevidad, privacidad y control del usuario.

### 2.2 Arquitectura por capas

```
  UI (componentes)
    │  lee y escribe SOLO contra el repositorio local (consultas reactivas)
    ▼
  Repositorio / dominio ───────► BD local (IndexedDB o SQLite)
    │ escribe entidad + outbox          ▲        │
    │ en UNA transacción                │        │ aplica cambios remotos
    ▼                                   │        ▼
  Motor de sincronización ◄────► Red ◄────► API (fuente de verdad compartida)
```

Reglas de oro:

1. **La BD local es la fuente de verdad de la interfaz.** Ningún componente espera una respuesta de red para pintar.
2. **Las escrituras son locales y optimistas por construcción:** se confirman en la BD local y se encolan para el servidor. No es una capa de «UI optimista» sobre la red.
3. **La sincronización es un proceso aparte** (pull + push) con reintentos, idempotencia y estado observable.
4. **El servidor valida y arbitra:** el cliente puede estar desactualizado o ser hostil.

### 2.3 Modelado de datos para trabajar sin red

- **Identificadores generados en el cliente.** El servidor no puede asignar IDs mientras no hay red. Usa UUID v7 o ULID (ordenados por tiempo: mejor localidad en índices B-tree que UUID v4, que es aleatorio y fragmenta). `crypto.randomUUID()` produce v4; v7 requiere una librería. Evita secuencias autoincrementales del servidor y el *remapeo de IDs temporales*, que es una fuente de errores.
- **Metadatos por entidad:** `id`, `createdAt`, `updatedAt` (UTC en milisegundos), `deletedAt` (lápida), `rev` (versión asignada por el servidor), `baseRev` (versión sobre la que se editó), `syncState` y, si hay multiusuario, `ownerId` o `tenantId`.
- **Borrado lógico (tombstones).** Un borrado debe propagarse: se marca `deletedAt` y se sincroniza. Las lápidas se purgan tras una ventana de retención; un cliente que estuvo offline más tiempo que esa ventana debe hacer una resincronización completa.
- **Referencias por ID, sin integridad referencial estricta entre entidades que llegan en orden arbitrario.** Un pedido puede llegar antes que su cliente; tolera referencias colgantes temporales.
- **Unidad de sincronización = agregado.** Sincroniza juntos un pedido y sus líneas para preservar invariantes; un agregado demasiado grande aumenta los conflictos y uno demasiado pequeño rompe invariantes.
- **Tiempo:** UTC en milisegundos; no confíes en el reloj del cliente para el orden causal (sección 6.5 presenta los relojes híbridos).
- **Importes y precisión:** enteros en la unidad mínima, nunca `number` de coma flotante.
- **Clasifica los datos por patrón de sincronización:** datos de referencia (catálogos: solo descarga y caché), datos de usuario (bidireccionales), eventos inmutables (solo se agregan: los más fáciles de sincronizar) y estado efímero de la interfaz (no se sincroniza).
- **Versiona el esquema local y el protocolo de sincronización por separado.**

### 2.4 Estados de red y de la aplicación

`navigator.onLine` y los eventos `online` y `offline` indican si hay una *interfaz de red*, no si hay Internet (redes cautivas, *lie-fi*). **`false` es fiable; `true` no.** La detección debe ser activa: sondear con una petición ligera, con *timeout*, y combinar señales (eventos, fallos de `fetch`, `visibilitychange`). `navigator.connection` (Chromium) sirve para ajustar el comportamiento (modo ahorro de datos), no para decidir si hay conexión.

```ts
type Listener = (online: boolean) => void;

export class ConnectivityMonitor {
  private online = navigator.onLine;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;

  constructor(private probeUrl = '/health', private timeoutMs = 3000) {
    addEventListener('online', () => void this.check());
    addEventListener('offline', () => this.set(false)); // offline sí es fiable
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.check();
    });
    void this.check();
  }

  get isOnline(): boolean {
    return this.online;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  /** `onLine === true` no basta: se comprueba con una petición real. */
  async check(): Promise<boolean> {
    if (this.timer) clearTimeout(this.timer);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.probeUrl, { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
      this.failures = 0;
      this.set(res.status < 500); // cualquier respuesta no-5xx implica alcanzabilidad
    } catch {
      this.failures++;
      this.set(false);
    } finally {
      clearTimeout(t);
    }
    if (!this.online) {
      // Sondeo con retroceso exponencial y jitter solo mientras estemos offline.
      const delay = Math.min(30_000, 1000 * 2 ** this.failures) * (0.5 + Math.random() / 2);
      this.timer = setTimeout(() => void this.check(), delay);
    }
    return this.online;
  }

  private set(v: boolean): void {
    if (v === this.online) return;
    this.online = v;
    this.listeners.forEach((fn) => fn(v));
  }
}
```

Separa dos máquinas de estados y expónlas a la interfaz:

- **Conectividad:** `offline → probing → online → degraded` (con histéresis para no oscilar).
- **Sincronización:** `idle → pulling → pushing → backoff → blocked (sesión expirada) → error`. La interfaz debe mostrar el número de cambios pendientes, la hora de la última sincronización y los errores accionables.

### 2.5 Modelos de consistencia

- **Consistencia eventual:** si dejan de llegar cambios, todas las réplicas convergen al mismo estado. Con funciones de fusión conmutativas, asociativas e idempotentes (CRDTs) se obtiene *convergencia fuerte*.
- **Leer tus propias escrituras:** la BD local lo da gratis.
- **Lecturas monótonas:** una réplica nunca debe retroceder a un estado anterior; ignora cambios remotos con una revisión menor que la local y usa cursores de sincronización monótonos.
- **Causalidad:** si B depende de A, nadie debe ver B sin A (relojes lógicos, sección 6.5).
- **Teorema CAP:** sin red hay partición, así que una aplicación offline elige disponibilidad. Los invariantes que **exigen coordinación global** (unicidad de un nombre de usuario, stock no negativo, saldo mínimo) *no pueden* garantizarse offline. Patrones: reservas o *escrow* de cantidades por dispositivo, validación en el servidor con rechazo y flujo de reconciliación en la interfaz, y acciones compensatorias. El teorema CALM resume el criterio: las operaciones **monótonas** (que solo agregan información) no necesitan coordinación.

### 2.6 Patrones centrales

| Patrón | Idea | Para qué |
| --- | --- | --- |
| Outbox transaccional | Escribir la entidad y la operación pendiente en la misma transacción local | Nunca perder ni duplicar un cambio |
| Idempotencia | Cada mutación lleva un ID único (`mutationId` o `Idempotency-Key`); el servidor ignora repeticiones | Reintentos seguros |
| Sincronización por estado | Marcar filas sucias (`syncState`) y enviar el estado actual | Simplicidad |
| Sincronización por operaciones | Encolar comandos o parches con su intención | Preservar la intención y fusionar mejor |
| Sincronización delta | Pedir al servidor solo lo cambiado desde un cursor | Eficiencia |
| Event sourcing local | Log de eventos más proyecciones reconstruibles | Auditoría, deshacer, sincronización natural |
| Backoff con jitter y *dead-letter* | Reintentos espaciados; las mutaciones imposibles se aíslan | Resiliencia |
| Compensación (saga) | Deshacer lógicamente lo que el servidor rechazó | Invariantes que requieren coordinación |

### 2.7 Ciclo de vida y arranque

- **Sincronización inicial:** descarga por páginas, reanudable, con indicador de progreso; muestra primero lo imprescindible (arranque parcial) en lugar de bloquear la interfaz.
- **Migraciones al arrancar:** abre la base, migra el esquema y solo entonces monta la interfaz.
- **Arranque desde cero tras expulsión:** detecta la base vacía con un registro `meta`, dispara una sincronización completa e informa de lo perdido.
- **Varias pestañas:** elige un único líder de sincronización con la API **Web Locks** (`navigator.locks.request`) y difunde los cambios con `BroadcastChannel`.
- **Cierre de sesión:** borra la base local y las claves de cifrado. Los datos de un usuario no deben sobrevivir a su sesión en un dispositivo compartido.

---

## 3. IndexedDB a bajo nivel

### 3.1 Modelo de datos

Jerarquía: `IDBFactory` (`indexedDB`) → **base de datos** (nombre y versión entera) → **object stores** → **índices**. Un registro es un par (clave, valor).

**Claves.** Tipos válidos: número (sin NaN), `Date`, cadena, datos binarios (`ArrayBuffer` y vistas) y **arreglos de claves válidas**. El orden de clasificación entre tipos es: números < fechas < cadenas < binarios < arreglos. **Los booleanos, `null`, `undefined` y los objetos no son claves válidas.**

- **Clave en línea** (`keyPath: 'id'`): la clave es una propiedad del valor. **Clave fuera de línea:** se pasa como segundo argumento de `put` o `add`.
- **Generador de claves** (`autoIncrement: true`): enteros crecientes desde 1 que **nunca se reutilizan**, ni siquiera tras borrar; si insertas una clave explícita mayor, el generador salta por encima.
- **`keyPath` compuesto:** un arreglo de rutas (`['tenantId', 'id']`) produce claves-arreglo.

**Valores y *structured clone*.** Se pueden guardar primitivos, `Date`, `RegExp`, `Blob`, `File`, `ArrayBuffer` y vistas, `Map`, `Set`, errores nativos, estructuras anidadas e incluso referencias cíclicas, y `CryptoKey` (permite guardar claves no extraíbles, sección 9). **No** se clonan funciones ni nodos del DOM (`DataCloneError`), y las instancias de clase pierden su prototipo (vuelven a ser objetos planos). La clonación ocurre **de forma síncrona en el hilo que llama a `put()`**, así que un objeto enorme bloquea ese hilo.

**Índices.** Se crean solo dentro de `upgradeneeded` y el motor los mantiene automáticamente. Opciones: `unique` (viola → `ConstraintError`) y `multiEntry` (si el valor indexado es un arreglo, cada elemento genera una entrada, útil para etiquetas). **Si el valor de la ruta de un registro no es una clave válida, el registro simplemente no aparece en el índice, sin error.** Es una trampa frecuente (un `boolean` indexado no devuelve nada) y, usada con intención, una técnica útil (índices dispersos, 3.3).

**Versiones y esquema.** `indexedDB.open(nombre, versión)` con una versión superior a la almacenada dispara `upgradeneeded`, donde se ejecuta una transacción especial `versionchange` en la que se crean y modifican stores e índices. Si otra pestaña mantiene abierta una conexión antigua, la actualización queda en `blocked` hasta que esa conexión se cierre; por eso las conexiones deben escuchar `versionchange` y cerrarse.

### 3.2 Transacciones: atomicidad, aislamiento y durabilidad

`db.transaction(almacenes, modo, { durability })`, con modo `readonly` o `readwrite` (y `versionchange`, solo durante la actualización del esquema).

**Atomicidad.** Todas las peticiones de una transacción se confirman juntas o se deshacen juntas. Se aborta cuando una petición falla sin que se llame a `event.preventDefault()`, con `tx.abort()`, ante un `ConstraintError` o ante un `QuotaExceededError`. Esto permite escribir una entidad y su registro de sincronización *outbox* en dos stores distintos con garantía de que existen ambos o ninguno.

**Aislamiento.** El motor planifica por *alcance* (los stores nombrados): las transacciones cuyo alcance se solapa y que incluyen al menos una `readwrite` **no se ejecutan en paralelo** y se inician en el orden de creación; las `readonly` con alcance solapado pueden ejecutarse a la vez; las `readwrite` con alcances disjuntos también. El resultado se comporta como una ejecución **serializable por bloqueo de stores** (no es aislamiento por *snapshot*), y no hay interbloqueos porque se respeta el orden de creación. Consecuencia práctica: **una transacción de escritura larga bloquea a las demás que toquen esos stores**, incluso las de otras pestañas; manténlas cortas.

**Durabilidad.** El evento `complete` indica que la transacción se confirmó, pero no necesariamente que los bytes llegaron al disco. La opción `durability` admite `'default'`, `'strict'` (espera al vaciado a disco, más lenta) y `'relaxed'` (no espera). Chromium usa `relaxed` por defecto, de modo que un fallo de energía o del sistema puede perder las últimas confirmaciones; usa `strict` para escrituras críticas (por ejemplo, un cobro registrado offline) y `relaxed` para importaciones masivas. El soporte y los valores por defecto varían entre navegadores: comprueba tu matriz de destino. También existe `tx.commit()` para confirmar de inmediato sin esperar el cierre automático.

**Ciclo de vida y auto-commit.** Una transacción está *activa* solo durante la tarea que la creó y durante los callbacks de sus peticiones; cuando no quedan peticiones pendientes, se confirma sola. **Si dentro de una transacción esperas trabajo asíncrono ajeno a IndexedDB (`fetch`, `setTimeout`), la transacción se confirma o queda inactiva y la siguiente petición lanza `TransactionInactiveError`.** Esperar promesas que envuelven peticiones de IndexedDB sí funciona en los navegadores modernos. Regla: **prepara los datos (incluida la red) antes de abrir la transacción y deja dentro solo operaciones de IndexedDB.**

**Lectura-modificación-escritura.** Hazla dentro de una sola transacción `readwrite`. Separar la lectura y la escritura en transacciones distintas produce *lost updates* entre pestañas.

```ts
export function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new DOMException('Transaction aborted', 'AbortError'));
    tx.onerror = () => reject(tx.error);
  });
}

type Step = (db: IDBDatabase, tx: IDBTransaction) => void;

// Una función por versión; se aplican en orden desde oldVersion.
const steps: Step[] = [
  (db) => {
    // v1
    const orders = db.createObjectStore('orders', { keyPath: 'id' });
    orders.createIndex('byStatusUpdated', ['status', 'updatedAt']);
  },
  (db, tx) => {
    // v2
    tx.objectStore('orders').createIndex('byCustomer', 'customerId');
    db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
  },
];

export function openDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, steps.length);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      const tx = req.transaction!;
      for (let v = ev.oldVersion; v < steps.length; v++) steps[v](db, tx);
    };
    req.onblocked = () => console.warn('Cierra otras pestañas con una versión anterior');
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close(); // deja actualizar el esquema a otra pestaña
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Entidad y outbox en una sola transacción: o se guardan ambas o ninguna. */
export async function saveOrder(db: IDBDatabase, order: { id: string; status: string; updatedAt: number }) {
  const tx = db.transaction(['orders', 'outbox'], 'readwrite', { durability: 'strict' });
  tx.objectStore('orders').put(order);
  tx.objectStore('outbox').add({ entity: 'order', entityId: order.id, op: 'upsert', createdAt: Date.now() });
  await txDone(tx);
}
```

### 3.3 Diseño de claves e índices (incluidos los compuestos)

**Clave primaria.** Elige una clave estable y con buena localidad: un UUID v7 o ULID como cadena (ordenado por tiempo) es mejor que un UUID v4 aleatorio. Una clave compuesta (`[tenantId, id]`) agrupa físicamente los registros de un mismo inquilino.

**Índices compuestos.** Un `keyPath` de arreglo (`['status', 'updatedAt']`) crea un índice cuyo orden es **lexicográfico**: primero por `status`, y dentro de cada `status` por `updatedAt`. Regla de oro: **igualdad en los primeros componentes y rango solo en el último.**

```ts
// Pedidos 'pending' actualizados en las últimas 24 h, ordenados por fecha:
const since = Date.now() - 24 * 3600_000;
const range = IDBKeyRange.bound(['pending', since], ['pending', Number.MAX_SAFE_INTEGER]);
const idx = db.transaction('orders').objectStore('orders').index('byStatusUpdated');
const rows = await reqToPromise(idx.getAll(range));
```

**Qué no puede hacer IndexedDB** (y cómo se resuelve):

| Necesidad | Solución |
| --- | --- |
| OR / IN | Varias consultas por rango y unión en memoria (o un índice `multiEntry`) |
| Joins | Desnormalizar, o resolver las referencias con `getAll` por lotes |
| Agregaciones (suma, promedio) | Recorrer con cursor o mantener contadores precalculados |
| Búsqueda sin distinguir mayúsculas | Guardar un campo normalizado (minúsculas, sin acentos) e indexarlo |
| Prefijo de cadena | `IDBKeyRange.bound(p, p + String.fromCharCode(0xffff))` |
| Texto completo | Índice `multiEntry` sobre tokens, o una librería externa |
| Ordenar por varios campos | Un índice compuesto en ese orden (y `'prev'` para descendente) |
| Filtrar por booleano | Guardar 0 y 1 (los booleanos no son claves) |

**Índice disperso (técnica).** Como los registros sin clave válida no entran en el índice, puedes guardar `dirty: 1` solo en las filas pendientes y **eliminar la propiedad** cuando se sincronizan. El índice sobre `dirty` contiene únicamente las filas pendientes y es diminuto, aunque la tabla tenga millones.

**Coste de los índices.** Cada índice es otro árbol que se actualiza en cada escritura: más índices, más lentas las escrituras y mayor el tamaño en disco. Crea solo los que respaldan consultas reales.

### 3.4 Cursores y consultas masivas

- **Cursor** (`openCursor(rango, dirección)`): itera registros en orden de clave o de índice, con `continue()`, `advance(n)`, y `continuePrimaryKey(clave, clavePrimaria)` para reanudar en índices no únicos. `openKeyCursor` recorre solo claves sin traer valores. Direcciones: `'next'`, `'prev'`, `'nextunique'`, `'prevunique'`.
- **Cada `continue()` es un viaje de ida y vuelta** al bucle de eventos (y, en Chromium, entre procesos). Para lotes grandes es mucho más rápido `getAll(rango, cantidad)` o `getAllKeys` que un cursor por registro.
- **Borrado y recuento por rango:** `store.delete(IDBKeyRange)` elimina un rango en **una sola petición**; `count(rango)` cuenta sin traer los registros; `clear()` vacía el store.
- **Modificación en el sitio:** `cursor.update(valor)` y `cursor.delete()`. Para actualizaciones masivas suele ser más rápido leer por lotes y hacer `put`.
- **Paginación por claves (*keyset*)** en lugar de por desplazamiento (*offset*): avanzar `n` posiciones con `advance` cuesta O(n) por página; reanudar desde la última clave vista cuesta O(log n + página).

Recorrido de millones de registros sin retener memoria ni bloquear a otras transacciones (cada lote usa su propia transacción de lectura; **no es un *snapshot* global**, sino consistente por lote):

```ts
export async function* scanInChunks<T>(
  db: IDBDatabase,
  store: string,
  keyOf: (row: T) => IDBValidKey,
  chunkSize = 500,
): AsyncGenerator<T[]> {
  let last: IDBValidKey | undefined;
  for (;;) {
    const tx = db.transaction(store, 'readonly');
    const range = last === undefined ? undefined : IDBKeyRange.lowerBound(last, true);
    const rows = (await reqToPromise(tx.objectStore(store).getAll(range, chunkSize))) as T[];
    if (rows.length === 0) return;
    yield rows;
    last = keyOf(rows[rows.length - 1]);
    if (rows.length < chunkSize) return;
    await new Promise((r) => setTimeout(r, 0)); // cede el hilo a la interfaz
  }
}

// Uso: procesa 1 000 000 de filas sin cargarlas todas
// for await (const chunk of scanInChunks<Order>(db, 'orders', (o) => o.id)) process(chunk);
```

### 3.5 Rendimiento: qué cuesta de verdad

- **Motor interno:** cada navegador implementa IndexedDB sobre su propio motor de almacenamiento (Chromium sobre LevelDB históricamente, con migración a SQLite en curso; Firefox y Safari sobre SQLite). No dependas de ese detalle, pero ten presente que cada petición cruza límites de proceso en Chromium.
- **No esperes cada petición dentro de un bucle:** encola todas y espera al final de la transacción.

```ts
// MAL: serializa un viaje de ida y vuelta por registro
for (const r of rows) await reqToPromise(store.put(r));

// BIEN: encola todo y espera el cierre de la transacción
for (const r of rows) store.put(r);
await txDone(tx);
```

- **Coste de clonación:** crece con el tamaño del objeto y bloquea el hilo; guarda binarios grandes como `Blob` o `ArrayBuffer` y no como cadenas base64 (el base64 añade 33 % de tamaño y coste de procesamiento). En iOS hay un historial de errores con `Blob` en IndexedDB: pruébalo en dispositivos reales.
- **Trabajo en un Worker:** IndexedDB está disponible en Workers; mover la persistencia fuera del hilo principal evita *jank* durante lotes grandes.
- **Evita escrituras redundantes:** compara antes de hacer `put` si la fila cambió realmente (cada escritura actualiza todos los índices).
- **Una conexión por pestaña, abierta durante toda la vida de la aplicación.** Abrir y cerrar por operación es caro.
- **`relaxed` durante importaciones masivas**, y una confirmación final `strict` si necesitas durabilidad.
- `getAll` devuelve valores clonados: un `getAll` de 100 000 objetos duplica temporalmente la memoria; usa lotes (3.4).

### 3.6 Errores y casos límite frecuentes

| Error | Causa habitual | Respuesta |
| --- | --- | --- |
| `TransactionInactiveError` | Se esperó `fetch`, `setTimeout` u otra promesa ajena dentro de la transacción | Reordena: datos primero, transacción después |
| `ConstraintError` | Clave duplicada con `add`, o violación de un índice `unique` | Usa `put`, o maneja el conflicto |
| `VersionError` | Se abrió con una versión menor que la almacenada (otra pestaña ya actualizó) | Recarga con el código más reciente |
| `InvalidStateError` | Se usó una conexión cerrada (por `versionchange` o por pérdida de conexión) | Reabre la base y reintenta |
| `QuotaExceededError` | Se superó la cuota; la transacción se aborta completa | Libera espacio y reintenta (3.7) |
| `DataCloneError` | El valor contiene funciones o nodos del DOM | Serializa a datos simples |
| `NotFoundError` | El store no está en el alcance de la transacción | Añade el store a la lista |
| `UnknownError` | Fallos internos del motor (se han visto en Safari/iOS) | Reintenta; ofrece restaurar desde el servidor |

En iOS hubo versiones donde la conexión a IndexedDB se perdía al pasar la aplicación a segundo plano; **envuelve el acceso en una capa que reabra la base ante `InvalidStateError`**.

### 3.7 Cuotas en la práctica: un protector de escritura

Un `QuotaExceededError` aborta la transacción entera (nada se escribió), así que se reintenta el trabajo completo tras liberar espacio. La política de expulsión debe afectar solo a datos *recuperables*, nunca a la cola de cambios pendientes.

```ts
export async function writeWithQuotaGuard<T>(
  work: () => Promise<T>,
  evict: (bytesToFree: number) => Promise<void>,
): Promise<T> {
  try {
    return await work();
  } catch (e) {
    if (!isQuotaError(e)) throw e;
    await evict(5 * 1024 * 1024); // libera caché recuperable (LRU por lastAccess)
    return work(); // un único reintento; si falla, informa al usuario
  }
}
```

Para la expulsión LRU, guarda un campo `lastAccess` en los stores de caché, indíxalo y borra los más antiguos con `delete` por rango o por lotes. Combina esto con la solicitud de persistencia (sección 1.3) y con el monitoreo de `storageHealth()` para actuar antes de llegar al límite.

---

## 4. Dexie.js: consultas, esquemas, hooks, middleware y operaciones masivas

### 4.1 Qué resuelve (y qué no)

Dexie es una capa fina sobre IndexedDB (no una base de datos distinta). Resuelve los puntos dolorosos de la API nativa:

| Limitación nativa | Qué aporta Dexie |
| --- | --- |
| API basada en eventos, verbosa | Promesas y `async/await` |
| Ciclo de vida frágil de las transacciones | Transacciones con ámbito (`db.transaction`) que funcionan con `await` dentro de ellas |
| Sin consultas declarativas | `where().equals().and().orderBy()`, `or()`, rangos, `startsWith`, etc. |
| Esquemas y migraciones manuales | Esquema declarativo con comparación automática de índices y funciones `upgrade` |
| Sin observabilidad | `liveQuery`: consultas reactivas, también entre pestañas |
| Sin hooks | Hooks `creating`, `reading`, `updating`, `deleting` |
| Sin extensibilidad | Middleware (DBCore) y complementos |
| Operaciones masivas lentas | `bulkAdd`, `bulkPut`, `bulkDelete`, `bulkGet` |
| Peculiaridades entre navegadores | Rodea errores conocidos (por ejemplo de Safari) |

**Lo que Dexie no cambia:** sigue sin haber `JOIN`s, agregaciones ni optimizador de consultas; tú eliges el índice. Dexie 4.x declara soporte para navegadores, PWAs, Electron y Capacitor.

### 4.2 Esquema y tipado

El esquema es un objeto `tabla → cadena de índices`. **Solo se listan las propiedades que se indexan**; el resto de campos se guardan igualmente. El primer elemento es la clave primaria.

| Sintaxis | Significado |
| --- | --- |
| `id` | Clave primaria en línea, no autoincremental |
| `++id` | Clave primaria autoincremental |
| `[a+b]` como primer elemento | Clave primaria compuesta |
| `name` | Índice simple |
| `&email` | Índice único |
| `*tags` | Índice `multiEntry` (indexa cada elemento de un arreglo) |
| `[status+updatedAt]` | Índice compuesto (orden lexicográfico) |

```ts
import Dexie, { type EntityTable } from 'dexie';

interface Order {
  id: string; // UUID v7 generado en el cliente
  customerId: string;
  status: 'draft' | 'pending' | 'paid';
  totalCents: number;
  tags: string[];
  updatedAt: number;
  rev?: number; // versión asignada por el servidor
  dirty?: 1; // presente solo con cambios sin sincronizar (índice disperso)
  deletedAt?: number;
}

interface OutboxItem {
  seq?: number;
  entity: string;
  entityId: string;
  op: 'upsert' | 'delete';
  mutationId: string;
  createdAt: number;
  attempts: number;
}

export const db = new Dexie('shop') as Dexie & {
  orders: EntityTable<Order, 'id'>;
  outbox: EntityTable<OutboxItem, 'seq'>;
};

db.version(1).stores({
  orders: 'id, customerId, [status+updatedAt], *tags, dirty',
  outbox: '++seq, entityId',
});
```

`EntityTable<T, 'pk'>` (Dexie 4) tipa la clave primaria y evita exigir un campo autoincremental al insertar.

### 4.3 Consultas declarativas

`table.where('indice')` devuelve un `WhereClause` con `equals`, `above`, `aboveOrEqual`, `below`, `belowOrEqual`, `between(a, b, incluirInf, incluirSup)`, `startsWith`, `startsWithIgnoreCase`, `equalsIgnoreCase`, `anyOf`, `noneOf`, `notEqual` e `inAnyRange`. El resultado es una `Collection` que admite `reverse()`, `limit()`, `offset()`, `orderBy()`, `and()`/`filter()`, `or()`, `toArray()`, `first()`, `count()`, `each()`, `primaryKeys()`, `keys()`, `modify()` y `delete()`.

```ts
// 1) Igualdad + rango sobre un índice compuesto, más recientes primero
const since = Date.now() - 24 * 3600_000;
const recent = await db.orders
  .where('[status+updatedAt]')
  .between(['pending', since], ['pending', Dexie.maxKey])
  .reverse()
  .limit(50)
  .toArray();

// 2) OR entre dos índices: Dexie ejecuta ambas consultas y deduplica
const mine = await db.orders.where('customerId').equals('c-42').or('status').equals('draft').toArray();

// 3) multiEntry: pedidos con la etiqueta 'urgente'
const urgent = await db.orders.where('tags').equals('urgente').toArray();

// 4) Paginación por claves (keyset) sobre la clave primaria
const nextPage = await db.orders.where('id').above(lastId).limit(100).toArray();

// 5) Solo pendientes de sincronizar (índice disperso)
const dirtyRows = await db.orders.where('dirty').equals(1).toArray();
```

**Reglas de rendimiento:**

- `and()` y `filter()` se ejecutan **en JavaScript** sobre los registros que ya devolvió el índice. Úsalos solo después de acotar con un índice; un `filter()` sin `where()` recorre toda la tabla.
- `sortBy(campo)` carga el resultado en memoria y ordena allí; `orderBy('indice')` usa el índice y puede detenerse antes con `limit()`.
- `offset(n)` cuesta O(n); para listas largas usa paginación por claves.
- `count()`, `primaryKeys()` y `keys()` evitan materializar los valores.
- Con un objeto, `where({ status: 'pending', customerId: 'c-42' })` usa un índice compuesto `[status+customerId]` si existe; si no, usa un índice simple y filtra el resto: define el compuesto si la consulta es frecuente.

### 4.4 Transacciones en Dexie

```ts
await db.transaction('rw', db.orders, db.outbox, async () => {
  await db.orders.put({ ...order, updatedAt: Date.now(), dirty: 1 });
  await db.outbox.add({
    entity: 'order',
    entityId: order.id,
    op: 'upsert',
    mutationId: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
  });
}); // atomicidad: o se guardan ambas escrituras o ninguna
```

- **Ámbito por zona:** dentro del callback, cualquier llamada a Dexie (incluida la de funciones que llamas) usa la transacción actual sin pasarla como argumento. `async/await` funciona dentro de la transacción **mientras lo que esperas sean operaciones de Dexie**.
- **La regla de IndexedDB sigue vigente:** esperar `fetch` o `setTimeout` dentro de la transacción la deja confirmarse antes de tiempo (error de transacción inactiva o cerrada). Dexie ofrece `Dexie.waitFor()` para casos puntuales con promesas muy cortas; no es un sustituto de preparar los datos antes.
- **Anidamiento:** una transacción anidada compatible se une a la actual; lanzar una excepción dentro del callback aborta y revierte todo.
- **Durabilidad:** el constructor admite la opción `chromeTransactionDurability` (`'default'`, `'strict'`, `'relaxed'`) para controlar el compromiso entre latencia y durabilidad en Chromium; verifica su disponibilidad en tu versión.

### 4.5 Esquemas y migraciones

Dexie compara el esquema declarado con el instalado y **aplica por sí mismo** los cambios de índices; no necesitas función `upgrade` para: añadir una tabla, añadir o quitar un índice, o añadir propiedades sin índice. Internamente la versión de Dexie se multiplica por 10 en IndexedDB.

```ts
db.version(2)
  .stores({
    orders: 'id, customerId, [status+updatedAt], *tags, dirty',
    outbox: '++seq, entityId',
  })
  .upgrade((tx) =>
    // Migración de datos: de euros decimales a céntimos enteros
    tx.table('orders').toCollection().modify((o: any) => {
      if (o.total !== undefined) {
        o.totalCents = Math.round(o.total * 100);
        delete o.total;
      }
    }),
  );
```

**Cambios que IndexedDB no permite directamente:**

- **Cambiar la clave primaria o renombrar una tabla:** receta en dos versiones. En la versión *n* declara la tabla nueva y copia los datos en `upgrade`; en la versión *n+1* elimina la antigua con `tabla: null`.
- **Migraciones pesadas:** corren dentro de la transacción `versionchange` y bloquean el arranque. Con tablas enormes, usa **migración perezosa**: guarda `schemaVersion` en cada registro y transforma al leer (hook `reading` o capa de mapeo), y reescribe de forma oportunista.
- **Varias pestañas:** por defecto Dexie cierra su conexión ante `versionchange`, permitiendo que otra pestaña actualice; personalízalo con `db.on('versionchange', ...)` y avisa al usuario de que recargue.
- **Datos iniciales:** `db.on('populate', tx => ...)` se ejecuta solo al crear la base.
- **Pruebas:** conserva muestras de bases creadas con esquemas anteriores y comprueba cada ruta de migración (con `fake-indexeddb` en CI).

### 4.6 `liveQuery`: consultas reactivas

`liveQuery(() => consulta)` devuelve un *observable* que se vuelve a ejecutar automáticamente cuando cambian los datos que la consulta tocó (Dexie rastrea los rangos leídos), **incluso si el cambio lo hizo otra pestaña o un Worker**. Integración: `useLiveQuery` en `dexie-react-hooks` (React), contrato de *store* en Svelte, y suscripción a observables en Vue o Angular.

```ts
import { liveQuery } from 'dexie';

const pendingCount$ = liveQuery(() => db.orders.where('dirty').equals(1).count());
const sub = pendingCount$.subscribe({
  next: (n) => (badge.textContent = String(n)),
  error: (e) => console.error(e),
});
// sub.unsubscribe() al desmontar el componente
```

**Reglas:** la función de consulta solo debe usar Dexie (sin red ni efectos secundarios) y devolver datos; los resultados se tratan como inmutables (Dexie 4.4.4 los clona en profundidad al leer para aislarlos de mutaciones del consumidor). Es también el mecanismo de **invalidación de caché de la interfaz**: la sincronización escribe en la base y la UI se actualiza sola, sin acoplarla al motor de red. Muchas `liveQuery` simultáneas se reejecutan en cada escritura relevante: estrecha sus consultas.

### 4.7 Hooks

Los hooks (`creating`, `reading`, `updating`, `deleting`) son **síncronos**, se ejecutan **dentro de la transacción de la operación** y reciben el objeto `trans`, de modo que cualquier escritura que hagan a través de `trans` es atómica con la operación original. Eso los hace ideales para centralizar el *outbox*: el código de la aplicación no puede olvidarse de encolar.

```ts
import type { Transaction } from 'dexie';

// Transacciones que aplican cambios del servidor: no deben marcar filas como sucias
const remoteTx = new WeakSet<object>();

function enqueue(trans: Transaction, op: 'upsert' | 'delete', entityId: string) {
  return trans.table('outbox').add({
    entity: 'order',
    entityId,
    op,
    mutationId: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
  });
}

db.orders.hook('creating', (_pk, obj, trans) => {
  if (remoteTx.has(trans)) return;
  obj.updatedAt = Date.now();
  obj.dirty = 1;
  void enqueue(trans, 'upsert', obj.id);
});

db.orders.hook('updating', (_mods, pk, _obj, trans) => {
  if (remoteTx.has(trans)) return;
  void enqueue(trans, 'upsert', pk as string);
  return { updatedAt: Date.now(), dirty: 1 }; // modificaciones adicionales
});

db.orders.hook('deleting', (pk, _obj, trans) => {
  if (remoteTx.has(trans)) return;
  void enqueue(trans, 'delete', pk as string);
});
```

**Precauciones:** los hooks se ejecutan en la pestaña que escribe (no se disparan por escrituras de otra pestaña ni por IndexedDB «crudo»); un `reading` se aplica en *cada* lectura y es costoso; un error lanzado aborta la transacción; nunca hagas red dentro de un hook. Con soft-delete, es preferible convertir los borrados en `put` con `deletedAt` en tu repositorio y dejar `deleting` para el borrado físico.

### 4.8 Middleware (DBCore)

DBCore es la capa justo encima de IndexedDB: intercepta todas las peticiones (`mutate` con tipo `add`, `put`, `delete`, `deleteRange`; `query`, `get`, `getMany`, `count`, `openCursor`) **incluidas las operaciones masivas y las consultas**. Los hooks operan a nivel de objeto; el middleware, a nivel de petición. Usos: métricas, registro de consultas lentas, cifrado o transformación transparente, filtros multiinquilino, modo solo lectura.

```ts
db.use({
  stack: 'dbcore',
  name: 'slowQueryLogger',
  create(down) {
    return {
      ...down,
      table(name) {
        const table = down.table(name);
        return {
          ...table,
          async query(req) {
            const t0 = performance.now();
            try {
              return await table.query(req);
            } finally {
              const ms = performance.now() - t0;
              if (ms > 50) console.warn(`[dexie] ${name}.query ${ms.toFixed(1)} ms`, req.query.index.name);
            }
          },
        };
      },
    };
  },
});
```

(Los tipos de DBCore se importan de `dexie`; ajusta las firmas a tu versión.) Los middlewares se encadenan y el orden de registro importa.

### 4.9 Rendimiento y operaciones masivas

- **`bulkAdd`, `bulkPut`, `bulkDelete`, `bulkGet`:** una sola transacción y peticiones encoladas sin esperar cada una; suelen ser de una a dos órdenes de magnitud más rápidas que un bucle con `await db.t.put(x)`. Con `{ allKeys: true }` devuelven todas las claves. Ante fallos parciales lanzan `BulkError` (con la lista `failures`); **captura el error dentro del callback de la transacción**, porque una excepción que escapa de `db.transaction` aborta y revierte todo.
- **Trocea:** lotes de 1 000 a 5 000 objetos (según su tamaño), una transacción por lote, cediendo el hilo entre lotes. Un solo lote gigante dispara la memoria y bloquea otras transacciones.
- **`modify()` sobre conjuntos grandes** recorre con cursor y es lento; para decenas de miles de filas compara `modify()` contra *leer por lotes + `bulkPut`*.
- **Hooks y bulk:** cada elemento pasa por los hooks; protege el camino caliente con el *flag* `remoteTx` (una consulta a un `WeakSet` es barata) para que las importaciones desde el servidor no paguen el coste del *outbox*.
- **Lecturas:** evita `toArray()` sobre tablas enormes; usa `each()`, `primaryKeys()` y paginación por claves.
- **Índices:** cada índice ralentiza cada escritura; indexa solo lo que consultas.
- **Workers:** Dexie funciona en Workers y `liveQuery` propaga cambios entre contextos; mueve allí las sincronizaciones y las importaciones grandes.

```ts
export async function importOrders(rows: Order[], chunk = 2000, onProgress?: (done: number) => void) {
  let failed = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    await db.transaction('rw', db.orders, async (tx) => {
      remoteTx.add(tx); // vienen del servidor: no generan outbox
      try {
        await db.orders.bulkPut(slice);
      } catch (e) {
        if (!(e instanceof Dexie.BulkError)) throw e;
        failed += e.failures.length; // los demás registros del lote sí se escriben
      }
    });
    onProgress?.(Math.min(i + chunk, rows.length));
    await new Promise((r) => setTimeout(r, 0)); // cede el hilo
  }
  return { total: rows.length, failed };
}
```

### 4.10 Ecosistema

- **`dexie-react-hooks`:** `useLiveQuery`, y `useDocument` para documentos Y.js.
- **`dexie-export-import`:** `exportDB` e `importInto` para copias de seguridad y migraciones de dispositivo (formato JSON de Dexie, con Blobs).
- **`y-dexie`:** integra Y.js (CRDT de texto colaborativo) con Dexie; **`dexie-cloud-addon`:** servicio gestionado de sincronización, autenticación y control de acceso con modo offline-first (las versiones 4.4.x añaden descarga diferida de blobs y cadenas grandes). Es una dependencia de un servicio externo: evalúa coste, residencia de datos y lock-in antes de adoptarlo; la alternativa es construir tu propio motor de sincronización (sección 6).
- **Heredados:** `dexie-observable` y `dexie-syncable` fueron sustituidos por `liveQuery` y por Dexie Cloud respectivamente.

---

## 5. SQLite en escritorio con Wails y Go

### 5.1 Arquitectura de Wails y comunicación IPC

Wails combina un **proceso Go** (lógica, acceso a datos, sistema operativo) con un **WebView nativo** que muestra la interfaz web: WebView2 en Windows, WKWebView en macOS y WebKitGTK en Linux. No incluye Chromium. En producción la comunicación usa los canales nativos del WebView (mensajes y esquemas personalizados), no un servidor HTTP local.

```
  WebView (HTML, JS, TS)                           Proceso Go (un solo proceso)
  +-------------------------+   JSON, puente     +------------------------------+
  | UI + Repositorio TS     | <---- IPC -------> | Servicios enlazados (Bind)   |
  | wailsjs/go/... (async)  |                    |  └─ Casos de uso (DTOs)       |
  +-------------------------+                    |      └─ Repositorios          |
        ^  EventsOn                              |          └─ database/sql       |
        +------------ EventsEmit <---------------|              └─ SQLite (WAL)    |
                                                 +------------------------------+
```

**Cómo funciona (Wails v2):** los métodos exportados de las estructuras que registras en `Bind` se exponen al frontend; Wails genera funciones `async` en `frontend/wailsjs/go/<paquete>/<Tipo>.js` (con tipos `.d.ts`) que devuelven una `Promise`. Argumentos y resultados viajan serializados como JSON; si el método devuelve un `error`, la promesa se rechaza. Para empujar datos de Go hacia JS se usan **eventos** (`runtime.EventsEmit(ctx, nombre, datos)` en Go y `EventsOn(nombre, callback)` en JS). Las llamadas pueden ejecutarse de forma concurrente: diseña tus servicios para ser seguros ante concurrencia.

| Aspecto | Wails v2 (estable) | Wails v3 (beta) |
| --- | --- | --- |
| Exposición de Go | `Bind: []interface{}{svc}` | `Services: []application.Service{application.NewService(svc)}` |
| Bindings TypeScript | `frontend/wailsjs/go/<paquete>/<Tipo>` | `frontend/bindings/<ruta-del-paquete>/...` |
| Eventos y runtime | `runtime.EventsEmit(ctx, ...)`, con el contexto guardado en `OnStartup` | Métodos de la aplicación y de la ventana, sin pasar contexto |
| CLI | `wails` | `wails3` (build con Taskfile) |

No mezcles APIs de ambas versiones: elige una por proyecto. Wails v3 añade ventanas múltiples y bindings con comentarios y nombres de parámetros, pero sigue en beta. Los ejemplos de esta guía usan v2; el diseño (servicios, DTOs, repositorios) es idéntico en v3.

**Costes del IPC y cómo diseñar la frontera:**

- **Cada llamada serializa a JSON en ambos sentidos** y cruza el puente nativo: cuesta del orden de cientos de microsegundos a milisegundos. Evita el patrón **N+1 sobre IPC** (una llamada por fila): diseña métodos orientados a casos de uso (`ListOrders(filtro, cursor, limite)`) y no a tablas.
- **Nunca envíes 100 000 filas en una respuesta:** pagina por claves, devuelve DTOs ligeros (no entidades completas) e hidrata el detalle bajo demanda.
- **Datos binarios:** un `[]byte` viaja como base64 dentro del JSON (+33 % y coste de decodificación). Para archivos o imágenes, sirve los bytes con un `http.Handler` registrado en el `AssetServer` (`/files/{id}`), de modo que `<img src>` y `fetch` los transmitan sin pasar por el puente.
- **Enteros grandes:** JavaScript solo representa de forma exacta enteros hasta 2^53. Envía IDs de 64 bits y cantidades que podrían superarlo como cadenas; los importes en céntimos suelen caber, pero comprueba el dominio.
- **Fechas:** envía milisegundos desde la época (`int64`) o cadenas RFC 3339; no dependas de la zona horaria del WebView.
- **Progreso y flujos largos** (importación, sincronización): lanza la tarea en una goroutine, devuelve de inmediato un identificador y emite eventos de progreso.
- **La frontera es un límite de confianza.** El código del WebView puede estar comprometido por XSS o por contenido remoto cargado. Expone **la superficie mínima**, valida todas las entradas en Go y **no enlaces nunca un método genérico del tipo `Exec(sql string)` o `Query(sql string)`**. Aplica una CSP estricta y no cargues contenido remoto en el WebView.

### 5.2 Elección del driver de SQLite para Go

| Driver | CGO | Características | Cifrado | Notas |
| --- | --- | --- | --- | --- |
| `modernc.org/sqlite` | No (C transpilado a Go) | Compila cruzado fácilmente; DSN con `_pragma=nombre(valor)` | Sin SQLCipher | Suele ser algo más lento que las variantes con CGO en cargas intensivas |
| `github.com/mattn/go-sqlite3` | Sí | El más maduro y extendido; DSN con `_journal_mode=WAL` | SQLCipher solo enlazando `libsqlcipher` con la etiqueta `libsqlite3` | Compilar cruzado a Windows exige un toolchain C (mingw) |
| `github.com/ncruces/go-sqlite3` | No (WebAssembly con wazero) | `database/sql`, VFS propios (memoria, solo lectura, checksums) | VFS `xts` y `adiantum` (cifrado en reposo sin autenticación de páginas) | Rendimiento algo menor en funciones definidas por el usuario |

**Consideraciones específicas de Wails:** en macOS y Linux, Wails ya requiere CGO (WebKit), así que usar `mattn` no añade fricción; en Windows el binario puede compilarse sin CGO, y usar `modernc` o `ncruces` mantiene esa propiedad y simplifica la compilación cruzada y la integración continua. Elige `mattn` + SQLCipher si necesitas cifrado de página estándar de la industria y aceptas el costo de empaquetado; en caso contrario, `modernc` o `ncruces`. Mide con tus consultas reales antes de decidir por rendimiento.

**Trampa conocida:** cada driver tiene su propia sintaxis de DSN y **los parámetros desconocidos se ignoran en silencio**. Un DSN con `_journal_mode=WAL&_busy_timeout=5000` (sintaxis de `mattn`) abierto con `modernc` deja la base en modo `delete` y con `busy_timeout=0`, y las escrituras concurrentes fallan al instante con `SQLITE_BUSY`. **Verifica en el arranque que los PRAGMA se aplicaron** (ver código en 5.4).

### 5.3 PRAGMAs, modo WAL y almacenamiento

| PRAGMA | Valor sugerido | Por qué |
| --- | --- | --- |
| `journal_mode` | `WAL` | Los lectores no bloquean al escritor ni al revés; es persistente (queda en el archivo) |
| `synchronous` | `NORMAL` con WAL | Durable ante un cierre de la app; ante un corte de energía puede perder las últimas transacciones pero **no corrompe**. `FULL` da máxima durabilidad con más latencia |
| `foreign_keys` | `ON` | Viene desactivado por defecto y es **por conexión** |
| `busy_timeout` | `5000` | Espera el bloqueo en lugar de devolver `SQLITE_BUSY` de inmediato |
| `cache_size` | `-20000` (≈ 20 MiB) | El valor negativo son KiB; reduce en dispositivos de poca memoria |
| `mmap_size` | `0` a 256 MiB | Lecturas por memoria mapeada; cuidado en equipos limitados |
| `temp_store` | `MEMORY` o `FILE` | Dónde se hacen las ordenaciones temporales |
| `wal_autocheckpoint` | 1000 páginas (por defecto) | Frecuencia de los *checkpoints* |
| `journal_size_limit` | p. ej. 64 MiB | Limita el tamaño del archivo `-wal` tras un checkpoint |
| `user_version` | entero | Número de versión del esquema para las migraciones |
| `query_only` | `ON` en lectores | Evita escrituras accidentales |
| `trusted_schema` | `OFF` | Endurece frente a esquemas no confiables |

**Sintaxis de DSN por driver:**

- `modernc`: `?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_txlock=immediate` (el parámetro `_pragma` se repite una vez por PRAGMA).
- `mattn`: `?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=1&_synchronous=NORMAL&_txlock=immediate`.
- `ncruces`: admite `_pragma` y `_txlock` en el DSN de `database/sql`.

**Funcionamiento del WAL.** Las escrituras se anexan a un archivo `app.db-wal` y los lectores consultan el `-wal` junto a la base mediante un índice en memoria compartida (`app.db-shm`); un *checkpoint* copia las páginas del `-wal` a la base. Modos: `PASSIVE` (no espera), `FULL`, `RESTART` y `TRUNCATE` (vacía el archivo). Hay **un solo escritor a la vez**, pero los lectores ven una instantánea consistente del momento en que empezaron su lectura y no se bloquean.

Consecuencias prácticas:

- **Una lectura de larga duración impide reciclar el `-wal`**, que crece sin límite. Mantén las transacciones de lectura cortas y haz un `PRAGMA wal_checkpoint(TRUNCATE)` en momentos ociosos y al cerrar.
- **No copies el archivo `.db` mientras la app corre**: puede faltarle contenido que está en el `-wal`. Usa `VACUUM INTO 'copia.db'` o la API de respaldo (5.9).
- El WAL **no es apto para sistemas de archivos de red** (la memoria compartida exige un solo host).
- `BEGIN DEFERRED` (el valor por defecto) que empieza leyendo y luego escribe puede fallar al instante con `SQLITE_BUSY` si otro escritor confirmó entre medias. Usa **`BEGIN IMMEDIATE`** en las transacciones de escritura (parámetro `_txlock=immediate`).

### 5.4 Concurrencia en Go: un escritor y varios lectores

`database/sql` mantiene un *pool* de conexiones y SQLite admite un solo escritor. El patrón que evita `SQLITE_BUSY` y aprovecha el WAL es usar **dos pools**: uno de escritura con una sola conexión (todas las escrituras se serializan en Go, sin esperas de bloqueo) y otro de lectura con varias conexiones en modo `query_only`.

```go
package store

import (
	"context"
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite" // driver puro Go: registra "sqlite"
)

// Parámetros por conexión: el pool abre y cierra conexiones, así que los PRAGMA
// deben viajar en el DSN y no ejecutarse una sola vez.
const commonParams = "_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)" +
	"&_pragma=synchronous(NORMAL)&_pragma=temp_store(MEMORY)"

type Store struct {
	W *sql.DB // un único escritor
	R *sql.DB // varios lectores concurrentes
}

func Open(path string) (*Store, error) {
	w, err := sql.Open("sqlite", path+"?_txlock=immediate&_pragma=journal_mode(WAL)&"+commonParams)
	if err != nil {
		return nil, err
	}
	w.SetMaxOpenConns(1) // SQLite admite un solo escritor a la vez

	// El modo WAL es persistente: el escritor lo establece primero y se verifica.
	if err := verifyWAL(w); err != nil {
		return nil, err
	}

	r, err := sql.Open("sqlite", path+"?_pragma=query_only(1)&"+commonParams)
	if err != nil {
		return nil, err
	}
	r.SetMaxOpenConns(4)
	return &Store{W: w, R: r}, nil
}

// Los parámetros desconocidos del DSN se ignoran en silencio: se comprueba el resultado.
func verifyWAL(db *sql.DB) error {
	var mode string
	if err := db.QueryRow(`PRAGMA journal_mode`).Scan(&mode); err != nil {
		return err
	}
	if mode != "wal" {
		return fmt.Errorf("journal_mode=%q: se esperaba wal; revisa la sintaxis del DSN de tu driver", mode)
	}
	return nil
}

func (s *Store) Close() error {
	_, _ = s.W.Exec(`PRAGMA optimize`)
	_, _ = s.W.Exec(`PRAGMA wal_checkpoint(TRUNCATE)`)
	_ = s.R.Close()
	return s.W.Close()
}

// WithTx ejecuta fn en una transacción de escritura (BEGIN IMMEDIATE).
// Revierte ante error o panic y confirma en caso contrario.
func (s *Store) WithTx(ctx context.Context, fn func(*sql.Tx) error) (err error) {
	tx, err := s.W.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
		if err != nil {
			_ = tx.Rollback()
		}
	}()
	if err = fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}
```

**Reglas de uso:** mantén las transacciones de escritura cortas y **sin E/S externa dentro** (nada de red ni diálogos); no mantengas un `*sql.Rows` abierto mientras esperas otra cosa; cierra siempre los `Rows` (o un lector colgado bloquea el *checkpoint*); y reutiliza sentencias preparadas (`tx.PrepareContext`) dentro de bucles de inserción.

### 5.5 Esquema relacional, índices avanzados y migraciones

```sql
-- Esquema de ejemplo (SQLite 3.37 o superior por STRICT).
CREATE TABLE customers (
  id          TEXT PRIMARY KEY,              -- UUID v7 generado en el cliente
  name        TEXT NOT NULL,
  email       TEXT,
  updated_at  INTEGER NOT NULL,              -- epoch ms UTC
  deleted_at  INTEGER,                       -- lápida (borrado lógico)
  rev         INTEGER,                       -- versión asignada por el servidor
  dirty       INTEGER NOT NULL DEFAULT 0 CHECK (dirty IN (0, 1))
) STRICT;

CREATE TABLE orders (
  id           TEXT PRIMARY KEY,
  customer_id  TEXT NOT NULL REFERENCES customers(id) DEFERRABLE INITIALLY DEFERRED,
  status       TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid')),
  total_cents  INTEGER NOT NULL CHECK (total_cents >= 0),
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  rev          INTEGER,
  dirty        INTEGER NOT NULL DEFAULT 0 CHECK (dirty IN (0, 1))
) STRICT;

CREATE TABLE order_lines (
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  line_no      INTEGER NOT NULL,
  sku          TEXT NOT NULL,
  qty          INTEGER NOT NULL CHECK (qty > 0),
  price_cents  INTEGER NOT NULL,
  PRIMARY KEY (order_id, line_no)
) STRICT, WITHOUT ROWID;

-- Índice parcial: solo filas vivas; cubre el orden y el desempate de la paginación por claves
CREATE INDEX idx_orders_status_updated
  ON orders(status, updated_at DESC, id DESC) WHERE deleted_at IS NULL;
-- Índice parcial diminuto: solo las filas pendientes de sincronizar
CREATE INDEX idx_orders_dirty ON orders(id) WHERE dirty = 1;
CREATE INDEX idx_orders_customer ON orders(customer_id, updated_at DESC);

CREATE TABLE outbox (
  seq          INTEGER PRIMARY KEY AUTOINCREMENT,
  mutation_id  TEXT NOT NULL UNIQUE,         -- clave de idempotencia
  entity       TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  op           TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
  payload      TEXT,                         -- JSON opcional (sincronización por operaciones)
  base_rev     INTEGER,                      -- revisión sobre la que se editó
  created_at   INTEGER NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  next_try_at  INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT
) STRICT;
CREATE INDEX idx_outbox_ready ON outbox(next_try_at, seq);

CREATE TABLE sync_state (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT; -- p. ej. 'pull_cursor'
```

**Decisiones de diseño:**

- **`STRICT`** hace que SQLite aplique los tipos declarados (por defecto SQLite es de tipado flexible y acepta un texto en una columna entera). Los **`CHECK`** codifican invariantes dentro de la base.
- **Fechas** como entero (milisegundos UTC) o texto ISO 8601; **importes** como entero en la unidad mínima.
- **UUID** como `TEXT` es sencillo y depurable; como `BLOB(16)` ocupa menos (índices más pequeños) y mantiene el orden de un UUID v7.
- **`WITHOUT ROWID`:** una tabla con clave primaria no entera guarda por defecto un árbol por `rowid` más un índice de la clave; con `WITHOUT ROWID` la clave primaria *es* el árbol (agrupado) y se ahorra un índice. Conviene en filas pequeñas con clave compuesta; no en filas anchas.
- **Claves foráneas `DEFERRABLE INITIALLY DEFERRED`:** se comprueban al *confirmar* la transacción, no al insertar. Permiten aplicar un lote de cambios del servidor en cualquier orden (el pedido antes que su cliente) dentro de la misma transacción.
- **Índices parciales** (`WHERE ...`) indexan solo las filas que cumplen la condición: `idx_orders_dirty` es la versión SQL del índice disperso de IndexedDB. **Índices de expresión** (`CREATE INDEX ... ON t(lower(name))`) y **índices de cobertura** (que incluyen todas las columnas que lee la consulta, evitando consultar la tabla) completan la caja de herramientas. Verifica siempre con `EXPLAIN QUERY PLAN` y ejecuta `PRAGMA optimize` para mantener las estadísticas.
- **JSON y columnas generadas:** `json_extract` más una columna generada indexada permite campos semiestructurados sin abandonar el modelo relacional.
- **Búsqueda de texto:** el módulo **FTS5** (tabla virtual, con `bm25` para ranking) cubre lo que IndexedDB no puede.
- **Disparadores (*triggers*):** podrías poner `dirty = 1` y el alta en `outbox` en triggers SQL para que sea imposible olvidarlos; el precio es lógica oculta y más difícil de probar. En esta guía se hace en el repositorio (5.6).

**Migraciones.** Usa `PRAGMA user_version` como contador y archivos SQL incrustados con `go:embed`. El DDL de SQLite es transaccional: cada migración se aplica de forma atómica. Haz **solo migraciones hacia delante** y haz una copia (`VACUUM INTO`) antes de migrar. `ALTER TABLE` es limitado; para cambios complejos sigue el procedimiento de reconstrucción de tabla (crear, copiar, borrar, renombrar) y ejecuta `PRAGMA foreign_keys = OFF` **fuera** de la transacción (dentro no tiene efecto), seguido de `PRAGMA foreign_key_check`. Herramientas existentes: `goose`, `golang-migrate`, `atlas`.

```go
//go:embed migrations/*.sql
var migrationsFS embed.FS // 0001_init.sql, 0002_add_outbox.sql, ...

func Migrate(ctx context.Context, db *sql.DB) error {
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })

	var current int
	if err := db.QueryRowContext(ctx, `PRAGMA user_version`).Scan(&current); err != nil {
		return err
	}
	for i, e := range entries {
		version := i + 1
		if version <= current {
			continue
		}
		body, err := migrationsFS.ReadFile("migrations/" + e.Name())
		if err != nil {
			return err
		}
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, string(body)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("migración %s: %w", e.Name(), err)
		}
		// PRAGMA no admite parámetros; version es un entero propio, no una entrada externa.
		if _, err := tx.ExecContext(ctx, fmt.Sprintf(`PRAGMA user_version = %d`, version)); err != nil {
			_ = tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}
```

Ejecuta `Migrate` sobre el pool de escritura (`store.W`) durante el arranque, antes de montar la interfaz.

### 5.6 Transacciones ACID locales y repositorio en Go

SQLite ofrece ACID completo: **atomicidad** (WAL o journal), **consistencia** (restricciones y claves foráneas), **aislamiento serializable** (un solo escritor; con WAL cada lector ve una instantánea estable desde que empieza) y **durabilidad** (según `synchronous`). Usa `SAVEPOINT` para anidar operaciones parciales dentro de una transacción.

El **repositorio** escribe la entidad, sus líneas y el registro del *outbox* en **una sola transacción**: o se confirma todo o nada. Inserciones masivas: una transacción por lote y sentencias preparadas pueden superar las 100 000 filas por segundo; un `INSERT` suelto con autocommit paga un vaciado a disco por fila.

```go
func (r *sqliteOrderRepo) Save(ctx context.Context, o Order) error {
	return r.s.WithTx(ctx, func(tx *sql.Tx) error {
		now := time.Now().UnixMilli()

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO orders (id, customer_id, status, total_cents, updated_at, dirty)
			VALUES (?, ?, ?, ?, ?, 1)
			ON CONFLICT(id) DO UPDATE SET
				customer_id = excluded.customer_id,
				status      = excluded.status,
				total_cents = excluded.total_cents,
				updated_at  = excluded.updated_at,
				dirty       = 1`,
			o.ID, o.CustomerID, o.Status, o.TotalCents, now); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `DELETE FROM order_lines WHERE order_id = ?`, o.ID); err != nil {
			return err
		}
		stmt, err := tx.PrepareContext(ctx, `
			INSERT INTO order_lines (order_id, line_no, sku, qty, price_cents) VALUES (?, ?, ?, ?, ?)`)
		if err != nil {
			return err
		}
		defer stmt.Close()
		for i, l := range o.Lines {
			if _, err := stmt.ExecContext(ctx, o.ID, i+1, l.SKU, l.Qty, l.PriceCents); err != nil {
				return err
			}
		}

		// Outbox transaccional: la mutación queda registrada junto con el cambio.
		_, err = tx.ExecContext(ctx, `
			INSERT INTO outbox (mutation_id, entity, entity_id, op, created_at)
			VALUES (?, 'order', ?, 'upsert', ?)`,
			newMutationID(), o.ID, now)
		return err
	})
}
```

### 5.7 Servicio enlazado de Wails: API gruesa, paginación y eventos

La capa enlazada no es el repositorio: es un **servicio de aplicación** que valida, orquesta casos de uso y devuelve DTOs. Evita tipos genéricos en los métodos enlazados (el generador de bindings de Wails v2 puede no representarlos bien) y usa tipos concretos.

```go
type OrderDTO struct {
	ID         string `json:"id"`
	CustomerID string `json:"customerId"`
	Status     string `json:"status"`
	TotalCents int64  `json:"totalCents"`
	UpdatedAt  int64  `json:"updatedAt"`
	Dirty      bool   `json:"dirty"`
}

type OrderPage struct {
	Items      []OrderDTO `json:"items"`
	NextCursor string     `json:"nextCursor"` // opaco para el frontend
}

type OrdersService struct {
	ctx  context.Context // se asigna en OnStartup
	repo OrderRepository
}

func (s *OrdersService) Startup(ctx context.Context) { s.ctx = ctx }

func (s *OrdersService) List(status, cursor string, limit int) (OrderPage, error) {
	if limit <= 0 || limit > 200 { // validar siempre del lado Go
		limit = 50
	}
	if status != "" && !validStatus(status) {
		return OrderPage{}, errors.New("estado inválido")
	}
	return s.repo.List(s.ctx, status, cursor, limit)
}

func (s *OrdersService) Save(in OrderInput) (OrderDTO, error) {
	if err := in.Validate(); err != nil {
		return OrderDTO{}, err
	}
	dto, err := s.repo.Save(s.ctx, in.ToDomain())
	if err != nil {
		return OrderDTO{}, err
	}
	runtime.EventsEmit(s.ctx, "orders:changed", []string{dto.ID}) // la UI se invalida
	return dto, nil
}
```

Paginación por claves en el repositorio (los fragmentos concatenados son constantes; los valores siempre van enlazados, sin riesgo de inyección):

```go
func (r *sqliteOrderRepo) List(ctx context.Context, status, cursor string, limit int) (OrderPage, error) {
	where := `deleted_at IS NULL`
	var args []any
	if status != "" {
		where += ` AND status = ?`
		args = append(args, status)
	}
	if cursor != "" {
		ts, id, err := decodeCursor(cursor)
		if err != nil {
			return OrderPage{}, err
		}
		where += ` AND (updated_at, id) < (?, ?)` // comparación de valores de fila
		args = append(args, ts, id)
	}
	args = append(args, limit+1) // una fila extra indica si hay otra página

	rows, err := r.s.R.QueryContext(ctx, `
		SELECT id, customer_id, status, total_cents, updated_at, dirty
		FROM orders WHERE `+where+`
		ORDER BY updated_at DESC, id DESC
		LIMIT ?`, args...)
	if err != nil {
		return OrderPage{}, err
	}
	defer rows.Close()
	// ... escanear en []OrderDTO; si hay limit+1 filas, recortar y codificar el cursor
	// con (updated_at, id) de la última fila devuelta.
	return scanPage(rows, limit)
}
```

Registro en `main.go` (Wails v2) y consumo desde el frontend:

```go
//go:embed all:frontend/dist
var assets embed.FS

func main() {
	st, err := store.Open(dbPath())
	if err != nil {
		log.Fatal(err)
	}
	if err := store.Migrate(context.Background(), st.W); err != nil {
		log.Fatal(err)
	}
	svc := &OrdersService{repo: NewSQLiteOrderRepo(st)}

	err = wails.Run(&options.App{
		Title: "Shop",
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: filesHandler(st), // sirve /files/{id} sin pasar por el puente IPC
		},
		OnStartup:  svc.Startup,
		OnShutdown: func(ctx context.Context) { _ = st.Close() },
		Bind:       []interface{}{svc},
	})
	if err != nil {
		log.Fatal(err)
	}
}
```

```ts
import { List, Save } from '../wailsjs/go/main/OrdersService';
import { EventsOn } from '../wailsjs/runtime/runtime';

EventsOn('orders:changed', (ids: string[]) => invalidateOrders(ids)); // refresca vistas
const page = await List('pending', '', 50);
```

### 5.8 Seguridad: cifrado a nivel de base de datos

**Modelo de amenazas.** El cifrado en reposo protege ante el robo o pérdida del equipo, copias de seguridad filtradas o un adversario con acceso al disco. **No protege** de malware con los privilegios del usuario mientras la aplicación está desbloqueada (la clave está en memoria), ni de un WebView comprometido que llame a tus servicios.

| Opción | Qué es | Cuidado |
| --- | --- | --- |
| **SQLCipher** | Cifrado transparente de **páginas completas**: AES-256, HMAC por página (integridad) y derivación de clave PBKDF2 (valores por defecto de SQLCipher 4) | Requiere enlazar `libsqlcipher` (CGO); empaquetarlo en Windows es laborioso |
| **VFS `xts` o `adiantum`** (`ncruces/go-sqlite3`) | Cifrado de disco determinista, sin CGO | **No autentica las páginas** (no detecta manipulación) y es más débil que SQLCipher según su propia documentación |
| **Cifrado a nivel de aplicación** | Cifrar columnas o blobs sensibles (AES-GCM o XChaCha20-Poly1305) antes de escribir | No se pueden indexar ni consultar por esos campos (salvo índices ciegos con HMAC) |
| **Cifrado de disco del SO** (BitLocker, FileVault, LUKS) | Protege el disco completo | No sustituye al cifrado por aplicación: el archivo es legible para cualquier proceso con la sesión abierta |

**Trampa crítica con `mattn`:** la rama principal de `go-sqlite3` no tiene una etiqueta `sqlcipher` ni enlaza `sqlite3_key`; con `-tags sqlcipher` enlaza SQLite normal y **`PRAGMA key` se convierte en una operación sin efecto: la base queda sin cifrar sin ningún error**. Para usar SQLCipher hay que compilar con `CGO_ENABLED=1 -tags libsqlite3` enlazando contra `libsqlcipher`. **Comprueba siempre que el cifrado está activo** (`PRAGMA cipher_version` devuelve un valor) y que el archivo es ilegible: `strings app.db` no debe mostrar texto, y el CLI normal de `sqlite3` debe responder «file is not a database».

```go
//go:build cgo

package secure

import (
	"database/sql"
	"errors"
	"fmt"
	"regexp"

	sqlite3 "github.com/mattn/go-sqlite3"
)

var hex64 = regexp.MustCompile(`^[0-9a-fA-F]{64}$`)

// Se fija antes de abrir y debe vivir lo mínimo posible en memoria.
var currentKey string

// Compilar con: CGO_ENABLED=1 go build -tags libsqlite3  (enlazando libsqlcipher)
func init() {
	sql.Register("sqlite3_sqlcipher", &sqlite3.SQLiteDriver{
		ConnectHook: func(c *sqlite3.SQLiteConn) error {
			// La clave debe aplicarse ANTES de cualquier otra operación de la conexión.
			_, err := c.Exec(`PRAGMA key = "x'`+currentKey+`'"`, nil)
			return err
		},
	})
}

func Open(path, hexKey string) (*sql.DB, error) {
	if !hex64.MatchString(hexKey) {
		return nil, errors.New("la clave debe ser de 32 bytes en hexadecimal")
	}
	currentKey = hexKey
	db, err := sql.Open("sqlite3_sqlcipher", path+"?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=1")
	if err != nil {
		return nil, err
	}
	var version string
	if err := db.QueryRow(`PRAGMA cipher_version`).Scan(&version); err != nil || version == "" {
		_ = db.Close()
		return nil, errors.New("este binario no incluye SQLCipher: PRAGMA key se habría ignorado y la base quedaría sin cifrar")
	}
	if _, err := db.Exec(`SELECT count(*) FROM sqlite_master`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("clave incorrecta o base dañada: %w", err)
	}
	return db, nil
}
```

**Gestión de claves** (la parte difícil): nunca incrustes la clave en el binario ni la guardes junto a la base. Dos patrones habituales, combinables:

1. **Clave aleatoria de 256 bits guardada en el llavero del sistema operativo** (Credential Manager o DPAPI en Windows, Keychain en macOS, Secret Service en Linux). La base se abre sin pedir nada al usuario, pero queda ligada a su sesión del SO.
2. **Contraseña del usuario → Argon2id** para derivar la clave: protege incluso con la sesión del SO abierta, a costa de pedir la contraseña y de que olvidarla signifique perder los datos (necesitas un flujo de recuperación).

```go
import (
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/zalando/go-keyring"
	"golang.org/x/crypto/argon2"
)

// Derivación desde contraseña: parámetros Argon2id (t=3, m=64 MiB, p=4, clave de 32 bytes).
func deriveKey(password, salt []byte) []byte {
	return argon2.IDKey(password, salt, 3, 64*1024, 4, 32)
}

// Clave aleatoria guardada en el llavero del sistema.
func loadOrCreateDBKey(service, user string) ([]byte, error) {
	s, err := keyring.Get(service, user)
	if errors.Is(err, keyring.ErrNotFound) {
		k := make([]byte, 32)
		if _, err := rand.Read(k); err != nil {
			return nil, err
		}
		if err := keyring.Set(service, user, hex.EncodeToString(k)); err != nil {
			return nil, err
		}
		return k, nil
	}
	if err != nil {
		return nil, err
	}
	return hex.DecodeString(s)
}
```

Otras prácticas: rotación con `PRAGMA rekey`; cerrar la base y borrar la clave tras un periodo de inactividad (en Go no se puede garantizar el borrado de memoria por las copias del recolector, así que minimiza su vida); permisos de archivo `0600` y directorio `0700`; **consultas siempre parametrizadas**; y cifrar también las copias de seguridad.

### 5.9 Operación: copias, mantenimiento y observabilidad

- **Ubicación:** el directorio de datos de usuario del sistema (`os.UserConfigDir()` o el equivalente de la plataforma), no un directorio temporal ni el de instalación.
- **Copias de seguridad:** `VACUUM INTO 'copia.db'` genera una copia consistente y compactada; también existe la API de respaldo en línea. **Nunca copies `app.db` sin su `-wal`** con la app en marcha. Rota las copias, cúdalas antes de cada migración y prueba su restauración.
- **Integridad:** `PRAGMA quick_check` o `integrity_check` en segundo plano (cuestan O(tamaño)), no en el camino de arranque.
- **Mantenimiento:** `PRAGMA optimize` periódico y al cerrar; checkpoint `TRUNCATE` en reposo; purga de lápidas antiguas; `VACUUM` solo ocasionalmente (reescribe el archivo y necesita espacio libre equivalente) o `auto_vacuum=INCREMENTAL` desde la creación junto con `PRAGMA incremental_vacuum`.
- **Observabilidad:** envuelve `ExecContext` y `QueryContext` para registrar consultas lentas, usa `EXPLAIN QUERY PLAN` en desarrollo y expone `db.Stats()` (conexiones abiertas y esperas) en tus métricas.
