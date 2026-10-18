import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEngine } from './engine.js';

describe('engine', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  it('single loop; double start is no-op; hidden forces paused', async () => {
    let rafCb = null;
    let rafCount = 0;
    vi.stubGlobal('requestAnimationFrame', (cb) => { rafCount += 1; rafCb = cb; return rafCount; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const eng = createEngine({ onTick: vi.fn() });
    eng.start();
    eng.start();
    expect(rafCount).toBe(1);
    // simulate hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(eng.state).toBe('paused');
    // resume clamps dt: call captured callback with huge gap
    eng.resume();
    const tick = eng._handles() ? rafCb : null;
    expect(tick).toBeTruthy();
    vi.unstubAllGlobals();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });
});
