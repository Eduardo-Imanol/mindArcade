import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import CategoryView from './CategoryView.jsx';
import { mount } from '../test/render.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('CategoryView (spec-17 T4, a11y T8)', () => {
  it('unknown category renders NotFound', () => {
    const { container } = mount(<CategoryView categoryId="no-existe" />);
    expect(container.textContent).toContain('404');
    expect(container.querySelector('a[href="#/"]')).toBeTruthy();
  });

  it('empty category shows Próximamente without broken links', () => {
    const { container } = mount(<CategoryView categoryId="idiomas" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1').textContent).toBe('Idiomas');
    expect(container.textContent).toContain('Próximamente');
    expect(container.querySelector('.module')).toBeNull();
    expect(container.querySelector('a[href="#/"]')).toBeTruthy();
  });

  it('Programación shows Módulo 1 and Módulo 2 in order', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    const modules = [...container.querySelectorAll('.module')];
    expect(modules).toHaveLength(2);
    expect(modules[0].querySelector('.module__title').textContent).toContain('Módulo 1');
    expect(modules[1].querySelector('.module__title').textContent).toContain('Módulo 2');

    const firstTopics = [...modules[0].querySelectorAll('a.topic-card')].map((link) =>
      link.getAttribute('href')
    );
    expect(firstTopics).toEqual(['#/tema/funciones-en-programacion']);

    const secondTopics = [...modules[1].querySelectorAll('a.topic-card')].map((link) =>
      link.getAttribute('href')
    );
    expect(secondTopics).toEqual([
      '#/tema/estructuras-de-datos',
      '#/tema/algoritmos-y-complejidad-guia-tecnica-exhaustiva',
      '#/tema/persistencia-local-pwas-y-offline-first',
    ]);
  });

  it('topic cards are native links with metrics and accessible names', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    const links = [...container.querySelectorAll('a.topic-card')];
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^#\/tema\//);
      expect(link.textContent.trim().length).toBeGreaterThan(0);
      expect(link.querySelector('.topic-card__meta').textContent).toContain('cartas');
    }
    expect(container.querySelector('a.topic-back').getAttribute('href')).toBe('#/');
  });

  it('has keyboard-reachable back and topic links (AC-12)', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    const back = container.querySelector('a.topic-back');
    expect(back.tagName).toBe('A');
    back.focus();
    expect(document.activeElement).toBe(back);
    const firstTopic = container.querySelector('a.topic-card');
    firstTopic.focus();
    expect(document.activeElement).toBe(firstTopic);
  });

  it('styles module grid, 44px targets, focus and reduced motion (AC-12)', () => {
    const css = readTokens();
    expect(css).toMatch(/\.category\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.module__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.module__grid\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.topic-card\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.topic-card__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/a:focus-visible/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.topic-card/);
  });

  it('collapses the module grid at 360px (AC-12)', () => {
    const css = readTokens();
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.library__grid,\s*\.module__grid\s*\{\s*grid-template-columns:\s*1fr;/
    );
    expect(css).not.toMatch(/\.module(__grid|-title|-subtitle)[^{]*\{[^}]*width:\s*[4-9]\d{2}px/);
  });
});
