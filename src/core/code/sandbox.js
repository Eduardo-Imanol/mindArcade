// src/core/code/sandbox.js — ejecutor aislado de JavaScript (spec-21 T3).
// iframe sandbox="allow-scripts" + CSP sin red/storage; protocolo postMessage.

export const SANDBOX_TIMEOUT_MS = 2000;
export const SANDBOX_CSP = "default-src 'none'; script-src 'unsafe-inline'";

const REQUEST_PREFIX = 'run';
let requestSequence = 0;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function deepEqual(left, right) {
  if (left === right) return true;
  if (typeof left === 'number' && typeof right === 'number') {
    return Number.isNaN(left) && Number.isNaN(right);
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => deepEqual(value, right[index]));
  }
  if (isObject(left) || isObject(right)) {
    if (!isObject(left) || !isObject(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every(
      (key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key])
    );
  }
  return false;
}

export function buildSandboxHtml() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">
<title>Sandbox Sepect</title>
</head>
<body>
<script>
(function () {
  var currentId = null;
  function post(message) { parent.postMessage(message, '*'); }
  function safeJson(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_error) { return null; }
  }
  function equal(left, right) {
    if (left === right) return true;
    if (typeof left === 'number' && typeof right === 'number') {
      return isNaN(left) && isNaN(right);
    }
    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
      for (var index = 0; index < left.length; index += 1) {
        if (!equal(left[index], right[index])) return false;
      }
      return true;
    }
    if (left && right && typeof left === 'object' && typeof right === 'object') {
      var leftKeys = Object.keys(left);
      var rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return false;
      for (var key = 0; key < leftKeys.length; key += 1) {
        var name = leftKeys[key];
        if (!Object.prototype.hasOwnProperty.call(right, name)) return false;
        if (!equal(left[name], right[name])) return false;
      }
      return true;
    }
    return false;
  }
  function finish(id, payload) {
    currentId = null;
    var message = { __sepectSandbox: true, type: 'result', id: id };
    for (var key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) message[key] = payload[key];
    }
    post(message);
  }
  window.__sepectSandboxRun = function (fn, cases, id) {
    if (currentId !== id) return;
    if (typeof fn !== 'function') {
      finish(id, { ok: false, error: 'function-not-found' });
      return;
    }
    var results = [];
    for (var index = 0; index < cases.length; index += 1) {
      var entry = cases[index] || {};
      var args = Array.isArray(entry.args) ? entry.args : [];
      try {
        var actual = fn.apply(null, args);
        results.push({
          ok: equal(actual, entry.expected),
          actual: safeJson(actual),
          expected: entry.expected,
          args: args
        });
      } catch (error) {
        results.push({
          ok: false,
          error: String(error && error.message ? error.message : error),
          expected: entry.expected,
          args: args
        });
      }
    }
    finish(id, { ok: true, results: results });
  };
  window.addEventListener('error', function (event) {
    if (!currentId) return;
    var id = currentId;
    var message = event && event.message ? event.message : 'sandbox-error';
    finish(id, { ok: false, error: String(message) });
  });
  window.addEventListener('message', function (event) {
    var data = event ? event.data : null;
    if (!data || data.__sepectSandbox !== true || data.type !== 'run') return;
    if (currentId) return;
    var functionName = String(data.functionName || '');
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(functionName)) {
      post({ __sepectSandbox: true, type: 'result', id: data.id, ok: false, error: 'invalid-function-name' });
      return;
    }
    currentId = data.id;
    var script = document.createElement('script');
    script.textContent =
      data.code +
      '\\n;window.__sepectSandboxRun((typeof ' + functionName + ' !== "undefined" ? ' + functionName + ' : null), ' +
      JSON.stringify(Array.isArray(data.cases) ? data.cases : []) + ', ' +
      JSON.stringify(data.id) + ');';
    script.onerror = function () {
      if (currentId === data.id) finish(data.id, { ok: false, error: 'syntax-error' });
    };
    document.body.appendChild(script);
  });
})();
</script>
</body>
</html>`;
}

function removeFrame(iframe) {
  if (!iframe) return;
  try {
    if (typeof iframe.remove === 'function') iframe.remove();
    else if (iframe.parentNode && typeof iframe.parentNode.removeChild === 'function') {
      iframe.parentNode.removeChild(iframe);
    }
  } catch {
    // El iframe ya no está en el DOM.
  }
}

export function runCode(options = {}, environment = {}) {
  const doc = environment.document !== undefined ? environment.document : typeof document !== 'undefined' ? document : null;
  const win = environment.window !== undefined ? environment.window : typeof window !== 'undefined' ? window : null;
  const setTimer =
    environment.setTimeout !== undefined
      ? environment.setTimeout
      : typeof setTimeout === 'function'
        ? setTimeout
        : null;
  const clearTimer =
    environment.clearTimeout !== undefined
      ? environment.clearTimeout
      : typeof clearTimeout === 'function'
        ? clearTimeout
        : null;

  if (
    !doc ||
    !win ||
    !setTimer ||
    !clearTimer ||
    typeof doc.createElement !== 'function' ||
    !doc.body ||
    typeof win.addEventListener !== 'function'
  ) {
    return Promise.resolve({ ok: false, error: 'sandbox-unavailable' });
  }

  if (typeof options.code !== 'string' || !Array.isArray(options.cases)) {
    return Promise.resolve({ ok: false, error: 'invalid-request' });
  }

  const requestedTimeout = Number(options.timeoutMs);
  const timeoutMs = Number.isFinite(requestedTimeout) && requestedTimeout > 0 ? requestedTimeout : SANDBOX_TIMEOUT_MS;
  const id = `${REQUEST_PREFIX}-${++requestSequence}`;

  return new Promise((resolve) => {
    let settled = false;
    let timer = null;
    let iframe = null;

    const cleanup = () => {
      if (timer !== null) clearTimer(timer);
      if (typeof win.removeEventListener === 'function') win.removeEventListener('message', onMessage);
      removeFrame(iframe);
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    function onMessage(event) {
      if (!iframe) return;
      if (event && event.source && iframe.contentWindow && event.source !== iframe.contentWindow) return;
      const data = event ? event.data : null;
      if (!data || data.__sepectSandbox !== true || data.type !== 'result' || data.id !== id) return;
      if (data.ok === true) {
        finish({ ok: true, results: Array.isArray(data.results) ? data.results : [] });
      } else {
        finish({ ok: false, error: typeof data.error === 'string' ? data.error : 'sandbox-error' });
      }
    }

    try {
      timer = setTimer(() => finish({ ok: false, error: 'timeout' }), timeoutMs);
      iframe = doc.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('title', 'Sandbox de código');
      if (iframe.style) iframe.style.display = 'none';
      iframe.srcdoc = buildSandboxHtml();
      iframe.addEventListener(
        'load',
        () => {
          if (settled) return;
          try {
            iframe.contentWindow.postMessage(
              {
                __sepectSandbox: true,
                type: 'run',
                id,
                code: options.code,
                functionName: options.functionName,
                cases: options.cases,
              },
              '*'
            );
          } catch {
            finish({ ok: false, error: 'sandbox-unavailable' });
          }
        },
        { once: true }
      );
      win.addEventListener('message', onMessage);
      doc.body.appendChild(iframe);
    } catch {
      finish({ ok: false, error: 'sandbox-unavailable' });
    }
  });
}
