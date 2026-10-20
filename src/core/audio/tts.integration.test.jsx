import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Memorama from '../../games/memorama/Memorama.jsx';
import Flashcards from '../../games/flashcards/Flashcards.jsx';
import Ahorcado from '../../games/ahorcado/Ahorcado.jsx';
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

const HANGMAN_DECK = [
  { id: 'gato', front: 'gato', back: 'felino doméstico', difficulty: 'easy' },
  { id: 'perro', front: 'perro', back: 'mejor amigo', difficulty: 'easy' },
  { id: 'luna', front: 'luna', back: 'satélite natural', difficulty: 'easy' },
];

const HANGMAN_BACK_TO_CARD = {
  'felino doméstico': { id: 'gato', front: 'gato' },
  'mejor amigo': { id: 'perro', front: 'perro' },
  'satélite natural': { id: 'luna', front: 'luna' },
};

const HANGMAN_WRONG = {
  gato: ['B', 'C', 'D', 'F', 'H', 'J'],
  perro: ['B', 'C', 'D', 'F', 'G', 'H'],
  luna: ['B', 'C', 'D', 'F', 'G', 'H'],
};

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent.trim() === text);

const guessLetter = (container, letter) =>
  click(
    [...container.querySelectorAll('.ahorcado-key')].find((button) => button.textContent === letter)
  );

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
    expect(synth.speak.mock.calls[0][0].text).toBe(tile.getAttribute('data-text'));
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

describe('ahorcado TTS (AC-4)', () => {
  it('reads the hint on round start, repeats it with 🔊 and reads the word on loss', () => {
    installSpeech();
    const { container } = mount(
      <Ahorcado deck={HANGMAN_DECK} onGrade={() => {}} onExit={() => {}} />
    );
    click(buttonByText(container, 'Empezar'));

    const hint = container.querySelector('.ahorcado-hint__text').textContent;
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe(hint);

    click(container.querySelector('[aria-label="Escuchar la pista"]'));
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toBe(hint);

    const card = HANGMAN_BACK_TO_CARD[hint];
    for (const letter of HANGMAN_WRONG[card.id]) guessLetter(container, letter);
    expect(synth.speak).toHaveBeenCalledTimes(3);
    expect(synth.speak.mock.calls[2][0].text).toBe(card.front);
  });

  it('suppresses playback on start, repeat and loss when the global toggle is muted', () => {
    installSpeech();
    saveSettings({ muted: true });
    const { container } = mount(
      <Ahorcado deck={HANGMAN_DECK} onGrade={() => {}} onExit={() => {}} />
    );
    click(buttonByText(container, 'Empezar'));

    click(container.querySelector('[aria-label="Escuchar la pista"]'));
    const card = HANGMAN_BACK_TO_CARD[container.querySelector('.ahorcado-hint__text').textContent];
    for (const letter of HANGMAN_WRONG[card.id]) guessLetter(container, letter);

    expect(synth.speak).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.ahorcado-key')).toHaveLength(0);
    expect(container.textContent).toContain('Ronda perdida');
  });

  it('cancels pending speech on unmount without cancelling on normal re-renders', () => {
    installSpeech();
    const view = mount(<Ahorcado deck={HANGMAN_DECK} onGrade={() => {}} onExit={() => {}} />);
    click(buttonByText(view.container, 'Empezar'));
    const cancels = synth.cancel.mock.calls.length;

    guessLetter(view.container, 'B');
    guessLetter(view.container, 'C');
    expect(synth.cancel.mock.calls.length).toBe(cancels);

    view.unmount();
    expect(synth.cancel.mock.calls.length).toBe(cancels + 1);
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
