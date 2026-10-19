import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Memorama from '../../games/memorama/Memorama.jsx';
import Flashcards from '../../games/flashcards/Flashcards.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { click, mount } from '../../test/render.jsx';
import { loadSettings, saveSettings } from '../../core/storage/settings.js';

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

const DECK = [
  { id: 'uno', front: 'uno', back: 'one', difficulty: 'easy' },
  { id: 'dos', front: 'dos', back: 'two', difficulty: 'easy' },
  { id: 'tres', front: 'tres', back: 'three', difficulty: 'easy' },
  { id: 'cuatro', front: 'cuatro', back: 'four', difficulty: 'easy' },
];

let synth;

function installSpeech() {
  synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ name: 'Monica', lang: 'es-ES' }]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: FakeUtterance,
    configurable: true,
  });
}

beforeEach(() => {
  saveSettings({ muted: false });
});

afterEach(() => {
  document.body.innerHTML = '';
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('memorama TTS (AC-9)', () => {
  it('reads the tile text aloud once on reveal, from a user gesture', () => {
    installSpeech();
    const { container } = mount(<Memorama deck={DECK} onGrade={() => {}} onExit={() => {}} />);
    click([...container.querySelectorAll('button')].find((b) => b.textContent.includes('Fácil')));
    const tile = container.querySelector('.memorama-tile');
    click(tile);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe(tile.querySelector('.memorama-tile__text').textContent);
    click(tile);
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('exposes one 🔊 repeat button per revealed card that re-speaks its text', () => {
    installSpeech();
    const { container } = mount(<Memorama deck={DECK} onGrade={() => {}} onExit={() => {}} />);
    click([...container.querySelectorAll('button')].find((b) => b.textContent.includes('Fácil')));
    expect(container.querySelectorAll('.memorama-speak')).toHaveLength(0);
    click(container.querySelector('.memorama-tile'));
    const speaker = container.querySelector('.memorama-speak');
    expect(speaker).toBeTruthy();
    click(speaker);
    expect(synth.speak).toHaveBeenCalledTimes(2);
  });

  it('hides every 🔊 control and stays playable without speechSynthesis', () => {
    const { container } = mount(<Memorama deck={DECK} onGrade={() => {}} onExit={() => {}} />);
    click([...container.querySelectorAll('button')].find((b) => b.textContent.includes('Fácil')));
    expect(container.querySelector('.memorama-speak')).toBeNull();
    expect(container.textContent).not.toContain('🔊 Resumen');
    click(container.querySelector('.memorama-tile'));
    expect(container.querySelector('.memorama-tile').getAttribute('data-open')).toBe('true');
  });
});

describe('flashcards TTS (AC-9)', () => {
  it('exposes a 🔊 button that speaks only after a user clicks it', () => {
    installSpeech();
    const { container } = mount(<Flashcards deck={DECK} onGrade={() => ({ gained: 10 })} onExit={() => {}} />);
    expect(synth.speak).not.toHaveBeenCalled();
    const speaker = container.querySelector('button[aria-label="Escuchar la carta"]');
    expect(speaker).toBeTruthy();
    click(speaker);
    expect(synth.speak.mock.calls[0][0].text).toBe('uno');
  });
});

describe('global sound toggle (AC-9)', () => {
  it('persists muted in sepect.settings.v1 and suppresses playback', () => {
    installSpeech();
    const { container } = mount(<SoundToggle />);
    const toggle = container.querySelector('button');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    click(toggle);
    expect(loadSettings()).toEqual({ muted: true });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    click(toggle);
    expect(loadSettings()).toEqual({ muted: false });
  });

  it('renders nothing when the browser has no speech support', () => {
    const { container } = mount(<SoundToggle />);
    expect(container.querySelector('button')).toBeNull();
  });
});
