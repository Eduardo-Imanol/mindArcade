import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker, serviceWorkerUrl } from './registerServiceWorker.js';

describe('serviceWorkerUrl', () => {
  it('normaliza la base para apuntar al sw del deploy', () => {
    expect(serviceWorkerUrl('/')).toBe('/sw.js');
    expect(serviceWorkerUrl('/sepect/')).toBe('/sepect/sw.js');
    expect(serviceWorkerUrl('/sepect')).toBe('/sepect/sw.js');
    expect(serviceWorkerUrl('')).toBe('/sw.js');
  });
});

describe('registerServiceWorker', () => {
  it('registra el sw con el scope de la app', async () => {
    const register = vi.fn().mockResolvedValue({ scope: '/sepect/' });
    const result = await registerServiceWorker({
      baseUrl: '/sepect/',
      navigatorRef: { serviceWorker: { register } },
    });
    expect(result.ok).toBe(true);
    expect(register).toHaveBeenCalledWith('/sepect/sw.js', { scope: '/sepect/' });
  });

  it('no rompe la app cuando el navegador no soporta service workers', async () => {
    const result = await registerServiceWorker({ navigatorRef: {} });
    expect(result).toEqual({ ok: false, reason: 'unsupported' });
  });

  it('captura el fallo del registro sin lanzar', async () => {
    const register = vi.fn().mockRejectedValue(new Error('boom'));
    const result = await registerServiceWorker({ navigatorRef: { serviceWorker: { register } } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('error');
    expect(result.error).toBeInstanceOf(Error);
  });
});
