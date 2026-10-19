import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, isMuted, loadSettings, saveSettings } from './settings.js';

const KEY = 'sepect.settings.v1';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('settings', () => {
  it('defaults to { muted: false } when empty', () => {
    expect(loadSettings()).toEqual({ muted: false });
    expect(DEFAULT_SETTINGS).toEqual({ muted: false });
    expect(isMuted()).toBe(false);
  });

  it('persists muted and survives a reload', () => {
    const result = saveSettings({ muted: true });
    expect(result.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ muted: true });
    expect(loadSettings()).toEqual({ muted: true });
    expect(isMuted()).toBe(true);
  });

  it('falls back to defaults on corrupt or invalid JSON (no crash)', () => {
    localStorage.setItem(KEY, '{broken');
    expect(loadSettings()).toEqual({ muted: false });
    localStorage.setItem(KEY, '[1,2,3]');
    expect(loadSettings()).toEqual({ muted: false });
    localStorage.setItem(KEY, '"nope"');
    expect(loadSettings()).toEqual({ muted: false });
    localStorage.setItem(KEY, 'null');
    expect(loadSettings()).toEqual({ muted: false });
  });

  it('coerces truthy muted values to boolean', () => {
    localStorage.setItem(KEY, JSON.stringify({ muted: 'yes' }));
    expect(loadSettings()).toEqual({ muted: true });
  });

  it('is quota-safe: write failure warns and keeps the value in memory', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const result = saveSettings({ muted: true });
    expect(result.ok).toBe(false);
    expect(warn).toHaveBeenCalled();
    setItem.mockRestore();
    expect(loadSettings()).toEqual({ muted: true });
    expect(saveSettings({ muted: false }).ok).toBe(true);
  });
});
