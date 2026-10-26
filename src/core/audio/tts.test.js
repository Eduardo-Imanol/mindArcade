import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chunkSpeechText,
  isSpeechPaused,
  isSupported,
  pauseSpeech,
  resumeSpeech,
  speak,
  speakSequence,
  stopSpeech,
} from './tts.js';
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
    pause: vi.fn(() => {
      synth.paused = true;
    }),
    resume: vi.fn(() => {
      synth.paused = false;
    }),
    paused: false,
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

describe('tts sequence (spec-19 T3)', () => {
  const utterances = () => synth.speak.mock.calls.map(([utterance]) => utterance);

  it('speaks parts in order and calls onEnd after the last one', () => {
    const onEnd = vi.fn();
    const control = speakSequence(['uno', 'dos'], { onEnd });
    expect(control).toBeTruthy();
    expect(utterances().map((utterance) => utterance.text)).toEqual(['uno']);

    utterances()[0].onend();
    expect(utterances().map((utterance) => utterance.text)).toEqual(['uno', 'dos']);
    expect(onEnd).not.toHaveBeenCalled();

    utterances()[1].onend();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('chunks long text around 200 characters without losing content', () => {
    const text = `${'frase corta. '.repeat(30)}final`;
    const chunks = chunkSpeechText(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 200)).toBe(true);
    expect(chunks.join(' ')).toContain('final');
  });

  it('pauses and resumes the active sequence', () => {
    const control = speakSequence(['uno']);
    expect(control.pause()).toBe(true);
    expect(synth.pause).toHaveBeenCalledTimes(1);
    expect(isSpeechPaused()).toBe(true);
    expect(control.resume()).toBe(true);
    expect(synth.resume).toHaveBeenCalledTimes(1);
    expect(isSpeechPaused()).toBe(false);
  });

  it('exposes standalone pause/resume wrappers', () => {
    expect(pauseSpeech()).toBe(true);
    expect(resumeSpeech()).toBe(true);
    expect(synth.pause).toHaveBeenCalledTimes(1);
    expect(synth.resume).toHaveBeenCalledTimes(1);
  });

  it('stops and cancels without orphan utterances or trailing callbacks', () => {
    const onEnd = vi.fn();
    const control = speakSequence(['uno', 'dos'], { onEnd });
    const first = utterances()[0];
    control.stop();
    expect(synth.cancel).toHaveBeenCalled();
    first.onend();
    expect(utterances()).toHaveLength(1);
    expect(onEnd).not.toHaveBeenCalled();
    expect(control.pause()).toBe(false);
  });

  it('stopSpeech cancels an active sequence', () => {
    const onEnd = vi.fn();
    speakSequence(['uno', 'dos'], { onEnd });
    const first = utterances()[0];
    stopSpeech();
    first.onend();
    expect(utterances()).toHaveLength(1);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('does not start when muted or unsupported', () => {
    saveSettings({ muted: true });
    expect(speakSequence(['uno'])).toBeNull();
    expect(synth.speak).not.toHaveBeenCalled();

    saveSettings({ muted: false });
    delete window.speechSynthesis;
    expect(speakSequence(['uno'])).toBeNull();
  });

  it('reports unsupported pause/resume safely', () => {
    delete window.speechSynthesis;
    expect(pauseSpeech()).toBe(false);
    expect(resumeSpeech()).toBe(false);
    expect(isSpeechPaused()).toBe(false);
  });

  it('falls back when pause/resume are unavailable', () => {
    delete synth.pause;
    delete synth.resume;
    const control = speakSequence(['uno']);
    expect(control.pause()).toBe(false);
    expect(control.resume()).toBe(false);
  });
});
