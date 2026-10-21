// src/core/pwa/registerServiceWorker.js — registro del service worker (PWA instalable).
// Lógica pura y testeable: no toca red ni storage de la app.

export function serviceWorkerUrl(baseUrl = '/') {
  const base = String(baseUrl || '/');
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return `${withSlash}sw.js`;
}

/**
 * Registra el service worker. Nunca lanza: si el navegador no lo soporta o el
 * registro falla, la app sigue funcionando (solo se pierde el modo sin conexión).
 */
export async function registerServiceWorker({
  baseUrl = '/',
  navigatorRef = typeof navigator === 'undefined' ? undefined : navigator,
  scope = baseUrl,
} = {}) {
  const container = navigatorRef;
  if (!container || !container.serviceWorker || typeof container.serviceWorker.register !== 'function') {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const registration = await container.serviceWorker.register(serviceWorkerUrl(baseUrl), { scope });
    return { ok: true, registration };
  } catch (error) {
    return { ok: false, reason: 'error', error };
  }
}
