// src/test/render.jsx — minimal React test harness (no new deps)
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}

export function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return {
    container,
    rerender(next) {
      act(() => {
        root.render(next);
      });
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

export async function flush(times = 8) {
  await act(async () => {
    for (let i = 0; i < times; i += 1) {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

export async function waitFor(predicate, { timeout = 4000, interval = 25 } = {}) {
  const start = Date.now();
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    const result = predicate();
    if (result) return result;
    if (Date.now() - start > timeout) throw new Error('waitFor: timeout');
  }
}

export function fire(element, type, init = {}) {
  act(() => {
    element.dispatchEvent(new Event(type, { bubbles: true, ...init }));
  });
}

export function click(element) {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

export function setValue(element, value) {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(element, value);
  fire(element, 'input');
}

export function keydown(target, key) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}
