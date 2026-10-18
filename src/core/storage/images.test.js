import { afterEach, describe, expect, it } from 'vitest';
import { deleteImage, getImage, getObjectURL, revokeObjectURL, saveImage } from './images.js';
import { installFakeIndexedDB } from '../../test/fakeIdb.js';

let restore = null;
afterEach(() => {
  if (restore) restore();
  restore = null;
});

describe('images (IndexedDB blob store)', () => {
  it('save → reload (new transaction) resolves the same blob', async () => {
    restore = installFakeIndexedDB();
    const blob = new Blob(['pixel-bytes'], { type: 'image/png' });
    const saved = await saveImage('custom:card-1', blob);
    expect(saved).toEqual({ ok: true });
    const again = await getImage('custom:card-1');
    expect(again).toBe(blob);
  });

  it('delete removes the key', async () => {
    restore = installFakeIndexedDB();
    await saveImage('k', new Blob(['x']));
    const del = await deleteImage('k');
    expect(del).toEqual({ ok: true });
    expect(await getImage('k')).toBeNull();
  });

  it('quota/unavailable → fallback result and no crash', async () => {
    globalThis.indexedDB = undefined;
    const saved = await saveImage('k', new Blob(['x']));
    expect(saved).toEqual({ ok: false });
    expect(await getImage('k')).toBeNull();
    expect(await getObjectURL('k')).toBeNull();
    expect(() => revokeObjectURL('blob:false')).not.toThrow();
  });
});
