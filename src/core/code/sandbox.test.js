import { describe, expect, it } from 'vitest';
import {
  SANDBOX_CSP,
  buildSandboxHtml,
  deepEqual,
  runCode,
} from './sandbox.js';

function createEnvironment() {
  const frames = [];
  const windowListeners = new Map();
  const timers = new Map();
  let timerId = 0;

  const window = {
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      windowListeners.get(type)?.delete(listener);
    },
  };

  const document = {
    body: {
      appendChild(element) {
        element.parentNode = this;
        frames.push(element);
      },
    },
    createElement(tagName) {
      expect(tagName).toBe('iframe');
      const frameListeners = new Map();
      const iframe = {
        tagName: 'IFRAME',
        attributes: {},
        style: {},
        parentNode: null,
        removed: false,
        contentWindow: {
          posted: [],
          postMessage(message, origin) {
            this.posted.push({ message, origin });
          },
        },
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        addEventListener(type, listener) {
          frameListeners.set(type, listener);
        },
        removeEventListener(type) {
          frameListeners.delete(type);
        },
        remove() {
          this.removed = true;
        },
        fireLoad() {
          const listener = frameListeners.get('load');
          frameListeners.delete('load');
          if (listener) listener();
        },
      };
      return iframe;
    },
  };

  const environment = {
    document,
    window,
    setTimeout(callback) {
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };

  const emitMessage = (data, source) => {
    for (const listener of windowListeners.get('message') || []) listener({ data, source });
  };

  return {
    environment,
    frames,
    timers,
    windowListeners,
    emitMessage,
    fireTimers() {
      for (const callback of [...timers.values()]) callback();
      timers.clear();
    },
  };
}

describe('buildSandboxHtml (spec-21 T3)', () => {
  it('uses a restrictive CSP without same-origin, storage or network', () => {
    const html = buildSandboxHtml();
    expect(html).toContain(`content="${SANDBOX_CSP}"`);
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("script-src 'unsafe-inline'");
    expect(html).not.toContain('allow-same-origin');
    expect(html).not.toContain('localStorage');
    expect(html).not.toContain('fetch(');
    expect(html).not.toContain('<script src');
  });

  it('is static and cannot be broken by code with a closing script tag', () => {
    const html = buildSandboxHtml();
    expect(html).toBe(buildSandboxHtml());
    expect(html).not.toContain('alert(1)');
  });
});

describe('deepEqual (spec-21 T3)', () => {
  it('compares JSON values recursively', () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(undefined, null)).toBe(false);
    expect(deepEqual('1', 1)).toBe(false);
  });
});

describe('runCode (spec-21 T3)', () => {
  it('returns sandbox-unavailable without a document/window', async () => {
    expect(await runCode({ code: 'function f() {}', cases: [] }, { document: null, window: null })).toEqual({
      ok: false,
      error: 'sandbox-unavailable',
    });
    expect(await runCode({}, createEnvironment().environment)).toEqual({
      ok: false,
      error: 'invalid-request',
    });
  });

  it('creates a hidden allow-scripts iframe, posts the run and resolves results', async () => {
    const runtime = createEnvironment();
    const code = 'function sumar(a, b) { return a + b; }';
    const cases = [{ args: [2, 3], expected: 5 }];
    const promise = runCode(
      { code, functionName: 'sumar', cases, timeoutMs: 2000 },
      runtime.environment
    );

    expect(runtime.frames).toHaveLength(1);
    const frame = runtime.frames[0];
    expect(frame.attributes.sandbox).toBe('allow-scripts');
    expect(frame.attributes['aria-hidden']).toBe('true');
    expect(frame.style.display).toBe('none');
    expect(frame.srcdoc).toBe(buildSandboxHtml());
    expect(runtime.timers.size).toBe(1);

    frame.fireLoad();
    expect(frame.contentWindow.posted).toHaveLength(1);
    const request = frame.contentWindow.posted[0];
    expect(request.origin).toBe('*');
    expect(request.message).toMatchObject({
      __sepectSandbox: true,
      type: 'run',
      code,
      functionName: 'sumar',
      cases,
    });

    runtime.emitMessage(
      {
        __sepectSandbox: true,
        type: 'result',
        id: request.message.id,
        ok: true,
        results: [{ ok: true, actual: 5, expected: 5, args: [2, 3] }],
      },
      frame.contentWindow
    );

    await expect(promise).resolves.toEqual({
      ok: true,
      results: [{ ok: true, actual: 5, expected: 5, args: [2, 3] }],
    });
    expect(frame.removed).toBe(true);
    expect(runtime.timers.size).toBe(0);
    expect(runtime.windowListeners.get('message').size).toBe(0);
  });

  it('propagates case failures and sandbox errors', async () => {
    const runtime = createEnvironment();
    const promise = runCode(
      { code: 'function f() {}', functionName: 'f', cases: [{ args: [], expected: 1 }] },
      runtime.environment
    );
    const frame = runtime.frames[0];
    frame.fireLoad();
    const { id } = frame.contentWindow.posted[0].message;
    runtime.emitMessage(
      {
        __sepectSandbox: true,
        type: 'result',
        id,
        ok: true,
        results: [{ ok: false, actual: 2, expected: 1, args: [] }],
      },
      frame.contentWindow
    );
    await expect(promise).resolves.toEqual({
      ok: true,
      results: [{ ok: false, actual: 2, expected: 1, args: [] }],
    });

    const errorRuntime = createEnvironment();
    const errorPromise = runCode(
      { code: 'function roto( {', functionName: 'roto', cases: [] },
      errorRuntime.environment
    );
    const errorFrame = errorRuntime.frames[0];
    errorFrame.fireLoad();
    const errorId = errorFrame.contentWindow.posted[0].message.id;
    errorRuntime.emitMessage(
      { __sepectSandbox: true, type: 'result', id: errorId, ok: false, error: 'syntax-error' },
      errorFrame.contentWindow
    );
    await expect(errorPromise).resolves.toEqual({ ok: false, error: 'syntax-error' });
  });

  it('ignores unexpected messages until the matching result arrives', async () => {
    const runtime = createEnvironment();
    const promise = runCode(
      { code: 'function f() { return 1; }', functionName: 'f', cases: [] },
      runtime.environment
    );
    const frame = runtime.frames[0];
    frame.fireLoad();
    const { id } = frame.contentWindow.posted[0].message;

    runtime.emitMessage({ type: 'otro' }, frame.contentWindow);
    runtime.emitMessage({ __sepectSandbox: true, type: 'result', id: 'otro', ok: true }, frame.contentWindow);
    runtime.emitMessage(
      { __sepectSandbox: true, type: 'result', id, ok: true },
      { postMessage() {} }
    );
    runtime.emitMessage(
      { __sepectSandbox: true, type: 'result', id, ok: true, results: [] },
      frame.contentWindow
    );

    await expect(promise).resolves.toEqual({ ok: true, results: [] });
  });

  it('times out, removes the iframe and ignores late replies', async () => {
    const runtime = createEnvironment();
    const promise = runCode(
      { code: 'while (true) {}', functionName: 'f', cases: [], timeoutMs: 50 },
      runtime.environment
    );
    const frame = runtime.frames[0];
    runtime.fireTimers();
    await expect(promise).resolves.toEqual({ ok: false, error: 'timeout' });
    expect(frame.removed).toBe(true);
    frame.fireLoad();
    expect(frame.contentWindow.posted).toHaveLength(0);
  });

  it('never puts user code in srcdoc, even with script-breaking input', async () => {
    const runtime = createEnvironment();
    const code = '</script><script>parent.alert(1)</script>';
    const promise = runCode(
      { code, functionName: 'f', cases: [{ args: [], expected: null }] },
      runtime.environment
    );
    const frame = runtime.frames[0];
    expect(frame.srcdoc).not.toContain(code);
    expect(frame.srcdoc).not.toContain('parent.alert');
    frame.fireLoad();
    expect(frame.contentWindow.posted[0].message.code).toBe(code);
    const { id } = frame.contentWindow.posted[0].message;
    runtime.emitMessage(
      { __sepectSandbox: true, type: 'result', id, ok: true, results: [] },
      frame.contentWindow
    );
    await promise;
  });
});
