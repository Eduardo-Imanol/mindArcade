import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { mount, waitFor } from '../test/render.jsx';
import { saveSettings } from '../core/storage/settings.js';
import SourceReader from './SourceReader.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

const accessibleName = (element) =>
  (element.getAttribute('aria-label') || element.textContent || '').trim();

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

let synth;

function installSpeech() {
  synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
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

describe('SourceReader a11y (spec-19 AC-11)', () => {
  it('renders one h1, real heading levels and labelled native controls', async () => {
    installSpeech();
    const { container } = mount(<SourceReader topicId="funciones-en-programacion" />);
    await waitFor(() => container.querySelector('.source-reader__doc'));

    const pageTitle = container.querySelector('h1.source-reader__title');
    expect(pageTitle.textContent).toContain('Funciones');

    const markdownHeadings = [...container.querySelectorAll('.md-heading')];
    expect(markdownHeadings.length).toBeGreaterThan(2);
    expect(container.querySelector('.md-heading--1').tagName).toBe('H1');
    for (const heading of markdownHeadings) {
      expect(heading.tagName).toMatch(/^H[1-6]$/);
    }

    const article = container.querySelector('article.source-reader__doc');
    expect(article.getAttribute('aria-label')).toContain('Funciones');

    for (const link of container.querySelectorAll('a[href]')) {
      expect(accessibleName(link).length).toBeGreaterThan(0);
    }
    for (const button of container.querySelectorAll('button')) {
      expect(accessibleName(button).length).toBeGreaterThan(0);
    }
  });

  it('announces state changes and keeps controls out of the tab order when disabled', async () => {
    installSpeech();
    const { container } = mount(<SourceReader topicId="funciones-en-programacion" />);
    await waitFor(() => container.querySelector('.source-reader__doc'));

    const status = container.querySelector('.source-reader__tts-status');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('Listo para leer');

    expect(container.querySelector('[aria-label="Pausar lectura"]').disabled).toBe(true);
    expect(container.querySelector('[aria-label="Reanudar lectura"]').disabled).toBe(true);
    expect(container.querySelector('[aria-label="Detener lectura"]').disabled).toBe(true);
  });

  it('keeps long content readable at 360px with wrapping and code scroll', () => {
    const css = readTokens();
    expect(css).toMatch(/\.source-reader__doc\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.md-paragraph\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.md-pre\s*\{[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.md-pre\s*\{[^}]*max-width:\s*100%/);
    expect(css).toMatch(/\.source-reader__btn\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.source-reader__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{[\s\S]*?\.source-reader__header\s*\{\s*flex-direction:\s*column;/
    );
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{[\s\S]*?\.source-reader__tts-actions\s*\{\s*width:\s*100%;/
    );
    expect(css).toMatch(/a:focus-visible/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.source-reader__tts-status/
    );
  });

  it('keeps the skeleton and status non-noisy for assistive tech', async () => {
    const { container } = mount(<SourceReader topicId="funciones-en-programacion" />);
    const state = container.querySelector('.source-reader__state');
    expect(state.getAttribute('role')).toBe('status');
    expect(state.getAttribute('aria-live')).toBe('polite');
    expect(container.querySelector('.source-reader__skeleton').getAttribute('aria-hidden')).toBe(
      'true'
    );
    await waitFor(() => container.querySelector('.source-reader__doc'));
  });
});
