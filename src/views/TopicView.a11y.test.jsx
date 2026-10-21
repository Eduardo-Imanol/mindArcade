import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import TopicView from './TopicView.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { mount } from '../test/render.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

const FIXTURE = `# Tema accesible
Una función encapsula lógica reutilizable y evita repetir código.

- Q: perro | A: dog
- Q: gato | A: cat
- Q: sol | A: sun
- Q: luna | A: moon`;

const accessibleName = (element) =>
  (element.getAttribute('aria-label') || element.getAttribute('alt') || element.textContent || '').trim();

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicView a11y (AC-10, AC-11)', () => {
  it('renders native links/buttons with accessible names and one h1', () => {
    const { topic } = saveCustomTopic({ title: 'Tema accesible', md: FIXTURE });
    const { container } = mount(<TopicView topicId={topic.id} />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1').textContent).toBe('Tema accesible');

    const links = [...container.querySelectorAll('a[href]')];
    expect(links.length).toBeGreaterThan(2);
    for (const link of links) {
      expect(accessibleName(link).length).toBeGreaterThan(0);
    }
    for (const button of container.querySelectorAll('button')) {
      expect(accessibleName(button).length).toBeGreaterThan(0);
      expect(button.disabled).toBe(true);
    }
  });

  it('keeps the full description wrapping without truncation (AC-2)', () => {
    const { topic } = saveCustomTopic({ title: 'Tema accesible', md: FIXTURE });
    const { container } = mount(<TopicView topicId={topic.id} />);
    const desc = container.querySelector('.topic-description');
    expect(desc.textContent).toContain('evita repetir código.');

    const css = readTokens();
    expect(css).toMatch(/\.topic-description\s*\{[^}]*white-space:\s*pre-line/);
    expect(css).toMatch(/\.topic-description\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).not.toMatch(/\.topic-description\s*\{[^}]*line-clamp/);
    expect(css).not.toMatch(/\.topic-description\s*\{[^}]*text-overflow/);
    expect(css).not.toMatch(/\.topic-description\s*\{[^}]*max-height/);
  });

  it('exposes progressbar values from the topic metrics (AC-19, AC-26)', () => {
    const { topic } = saveCustomTopic({ title: 'Tema accesible', md: FIXTURE });
    const { container } = mount(<TopicView topicId={topic.id} />);
    const bar = container.querySelector('.topic-metrics [role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toMatch(/^\d+$/);
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('Progreso de Tema accesible');
  });

  it('styles 44px targets, visible focus and reduced motion (AC-11)', () => {
    const css = readTokens();
    expect(css).toMatch(/\.topic-back\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.topic-progress-link\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.game-tile__cta\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/a:focus-visible/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.game-tile/);
  });

  it('collapses the game grid and side header at 360px (AC-11)', () => {
    const css = readTokens();
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.game-grid\s*\{\s*grid-template-columns:\s*1fr;/
    );
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{[\s\S]*?\.topic-header__side\s*\{[\s\S]*?width:\s*100%;/
    );
    expect(css).toMatch(/\.topic-title\s*\{[^}]*font-size:\s*clamp\(/);
  });
});
