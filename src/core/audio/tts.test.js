import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSupported, speak } from './tts.js';
import { saveSettings } from '../storage/settings.js';

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

let synth;

beforeEach(() => {
  synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [
      { name: 'Monica', lang: 'es-ES' },
      { name: 'Samantha', lang: 'en-US' },
    ]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: FakeUtterance,
    configurable: true,
  });
  saveSettings({ muted: false });
});

afterEach(() => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
});

describe('tts', () => {
  it('queues an utterance with the contract params and cancels the previous one', () => {
    const utter = speak('función');
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).toHaveBeenCalledWith(utter);
    expect(utter.text).toBe('función');
    expect(utter.rate).toBe(0.9);
    expect(utter.pitch).toBe(1.1);
    expect(utter.lang).toBe('es-ES');
    expect(utter.voice).toMatchObject({ lang: 'es-ES' });
  });

  it('selects a voice by language prefix', () => {
    const utter = speak('hello', { lang: 'en-US' });
    expect(utter.voice).toMatchObject({ lang: 'en-US' });
  });

  it('does not queue anything when muted', () => {
    saveSettings({ muted: true });
    expect(speak('función')).toBeNull();
    expect(synth.speak).not.toHaveBeenCalled();
    expect(synth.cancel).not.toHaveBeenCalled();
  });

  it('is a no-op for empty text', () => {
    expect(speak('   ')).toBeNull();
    expect(speak()).toBeNull();
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('isSupported() is false without speechSynthesis and speak never crashes', () => {
    delete window.speechSynthesis;
    expect(isSupported()).toBe(false);
    expect(speak('función')).toBeNull();
  });

  it('retries voice selection onvoiceschanged when voices are not ready', () => {
    let voices = [];
    let handler = null;
    synth.getVoices.mockImplementation(() => voices);
    synth.addEventListener.mockImplementation((event, callback) => {
      if (event === 'voiceschanged') handler = callback;
    });
    synth.removeEventListener.mockImplementation((event) => {
      if (event === 'voiceschanged') handler = null;
    });

    const utter = speak('función');
    expect(utter.voice).toBeUndefined();

    voices = [{ name: 'Monica', lang: 'es-ES' }];
    handler();
    expect(utter.voice).toMatchObject({ lang: 'es-ES' });
    expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function));
  });

  it('uses the onvoiceschanged property when addEventListener is unavailable', () => {
    let voices = [];
    delete synth.addEventListener;
    delete synth.removeEventListener;
    synth.getVoices.mockImplementation(() => voices);

    const utter = speak('función');
    expect(typeof synth.onvoiceschanged).toBe('function');

    voices = [{ name: 'Monica', lang: 'es-ES' }];
    synth.onvoiceschanged();
    expect(utter.voice).toMatchObject({ lang: 'es-ES' });
  });
});
