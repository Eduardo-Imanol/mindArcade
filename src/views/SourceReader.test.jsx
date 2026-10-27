import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { click, fire, flush, mount, waitFor } from '../test/render.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { saveSettings } from '../core/storage/settings.js';

const mocks = vi.hoisted(() => ({ loadSource: vi.fn(), hasSource: vi.fn() }));

vi.mock('../core/content/sources.js', async (importOriginal) => {
  const actual = await importOriginal();
  mocks.actualLoadSource = actual.loadSource;
  mocks.actualHasSource = actual.hasSource;
  return {
    ...actual,
    hasSource: (...args) => mocks.hasSource(...args),
    loadSource: (...args) => mocks.loadSource(...args),
  };
});

import SourceReader from './SourceReader.jsx';

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

const BUILTIN = 'funciones-en-programacion';
const FIXTURE = `# Tema de prueba
Una función encapsula lógica reutilizable.

- Q: perro | A: dog
- Q: gato | A: cat`;

const byLabel = (container, label) =>
  container.querySelector(`[aria-label="${label}"]`);

let synth;

function installSpeech() {
  synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(() => { synth.paused = true; }),
    resume: vi.fn(() => { synth.paused = false; }),
    paused: false,
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
  mocks.loadSource.mockReset();
  mocks.hasSource.mockReset();
  mocks.loadSource.mockImplementation((...args) => mocks.actualLoadSource(...args));
  mocks.hasSource.mockImplementation((...args) => mocks.actualHasSource(...args));
  saveSettings({ muted: false });
});

afterEach(() => {
  window.getSelection?.().removeAllRanges();
  document.body.innerHTML = '';
  localStorage.clear();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  vi.restoreAllMocks();
});

describe('SourceReader (spec-19 T4)', () => {
  it('loads and renders the real source of a built-in topic', async () => {
    installSpeech();
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.querySelector('.source-reader__doc'));

    expect(container.querySelector('h1').textContent).toContain('Funciones');
    expect(container.querySelectorAll('.md-heading').length).toBeGreaterThan(2);
    expect(container.querySelector('.md-pre code')).toBeTruthy();
    expect(container.querySelector('.source-reader__meta').textContent).toContain('palabras');
    expect(container.querySelector(`a[href="#/tema/${BUILTIN}"]`).textContent).toContain('Volver');
    expect(container.querySelector('.source-reader__tts')).toBeTruthy();
  });

  it('shows loading, then ready, without throwing', async () => {
    let resolveLoad;
    mocks.loadSource.mockImplementationOnce(
      () => new Promise((resolve) => { resolveLoad = resolve; })
    );
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    expect(container.textContent).toContain('Abriendo el documento');

    await flush();
    resolveLoad('# Título\n\nTexto de prueba.');
    await flush();
    await waitFor(() => container.querySelector('.source-reader__doc'));
    expect(container.querySelector('.md-heading').textContent).toBe('Título');
  });

  it('shows an error state with retry when the source fails', async () => {
    mocks.loadSource.mockResolvedValueOnce(null);
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.textContent.includes('No se pudo abrir el documento'));
    expect(container.textContent).toContain('Reintentar');
    expect(container.querySelector(`a[href="#/tema/${BUILTIN}"]`)).toBeTruthy();
  });

  it('shows an empty state for personalized topics', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema propio', md: FIXTURE });
    const { container } = mount(<SourceReader topicId={topic.id} />);
    await waitFor(() => container.textContent.includes('Documento no disponible'));
    expect(container.textContent).toContain('temas personalizados');
    expect(container.querySelector(`a[href="#/tema/${topic.id}"]`)).toBeTruthy();
  });

  it('shows an empty state when a declared source is missing', async () => {
    mocks.hasSource.mockReturnValue(false);
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.textContent.includes('Documento no disponible'));
    expect(container.textContent).toContain('no está disponible');
  });

  it('shows 404 for an unknown topic', () => {
    const { container } = mount(<SourceReader topicId="no-existe" />);
    expect(container.textContent).toContain('404');
  });
});

describe('SourceReader TTS (spec-19 AC-5..AC-9)', () => {
  it('plays, pauses, resumes and stops with visible state', async () => {
    installSpeech();
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.querySelector('.source-reader__doc'));

    click(byLabel(container, 'Leer documento en voz alta'));
    expect(synth.speak).toHaveBeenCalled();
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Leyendo en voz alta'
    );

    click(byLabel(container, 'Pausar lectura'));
    expect(synth.pause).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Lectura en pausa'
    );

    click(byLabel(container, 'Reanudar lectura'));
    expect(synth.resume).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Leyendo en voz alta'
    );

    click(byLabel(container, 'Detener lectura'));
    expect(synth.cancel).toHaveBeenCalled();
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Listo para leer'
    );
  });

  it('mute stops playback and disables controls without auto-resuming', async () => {
    installSpeech();
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.querySelector('.source-reader__doc'));

    click(byLabel(container, 'Leer documento en voz alta'));
    click(byLabel(container, 'Sonido'));
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Sonido silenciado'
    );
    expect(byLabel(container, 'Leer documento en voz alta').disabled).toBe(true);

    click(byLabel(container, 'Sonido'));
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Listo para leer'
    );
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('reads the selected fragment automatically and can repeat it', async () => {
    installSpeech();
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.querySelector('.source-reader__doc'));

    const paragraph = [...container.querySelectorAll('.md-paragraph')].find((node) =>
      node.textContent.includes('bloque de código con nombre')
    );
    expect(paragraph).toBeTruthy();

    const range = document.createRange();
    range.selectNodeContents(paragraph);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    fire(document, 'selectionchange');

    await waitFor(() => synth.speak.mock.calls.length > 0);
    expect(synth.speak.mock.calls.some(([utter]) => utter.text.includes('bloque de código con nombre'))).toBe(
      true
    );
    expect(container.querySelector('.source-reader__tts-status').textContent).toBe(
      'Leyendo la selección'
    );

    const repeat = byLabel(container, 'Leer texto seleccionado');
    expect(repeat).toBeTruthy();
    synth.speak.mockClear();
    click(repeat);
    expect(synth.speak).toHaveBeenCalled();
    expect(synth.speak.mock.calls[0][0].text).toContain('bloque de código con nombre');
  });

  it('cancels speech on unmount', async () => {
    installSpeech();
    const view = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => view.container.querySelector('.source-reader__doc'));
    click(byLabel(view.container, 'Leer documento en voz alta'));
    const cancels = synth.cancel.mock.calls.length;
    view.unmount();
    expect(synth.cancel.mock.calls.length).toBeGreaterThan(cancels);
  });

  it('hides TTS controls when speech is unsupported', async () => {
    const { container } = mount(<SourceReader topicId={BUILTIN} />);
    await waitFor(() => container.querySelector('.source-reader__doc'));
    expect(container.querySelector('.source-reader__tts')).toBeNull();
    expect(container.textContent).toContain('no permite lectura en voz alta');
  });
});
