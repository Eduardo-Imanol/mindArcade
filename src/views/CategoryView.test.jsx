import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import CategoryView from './CategoryView.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { click, mount, setValue } from '../test/render.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

const byText = (container, selector, text) =>
  [...container.querySelectorAll(selector)].find((element) => element.textContent === text);

const openAll = (container) => click(byText(container, 'button', 'Abrir módulos'));

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

  it('empty Mis temas invites the user back to the library', () => {
    const { container } = mount(<CategoryView categoryId="personalizados" />);
    expect(container.textContent).toContain('Aún no tienes temas');
    expect(container.querySelector('a.btn-neon[href="#/"]')).toBeTruthy();
  });

  it('Programación shows Módulo 1 and Módulo 2 in order, collapsed by default', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    const modules = [...container.querySelectorAll('.module')];
    expect(modules).toHaveLength(2);
    expect(modules[0].querySelector('.module__title').textContent).toContain('Módulo 1');
    expect(modules[1].querySelector('.module__title').textContent).toContain('Módulo 2');

    const toggles = [...container.querySelectorAll('.module__toggle')];
    expect(toggles.map((button) => button.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    expect(container.querySelectorAll('.module__panel[hidden]')).toHaveLength(2);
    expect(container.querySelectorAll('.module__panel:not([hidden]) a.topic-card')).toHaveLength(0);
  });

  it('each module expands and collapses independently', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    const toggle = container.querySelector('.module__toggle');
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));

    click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect([...panel.querySelectorAll('a.topic-card')].map((link) => link.getAttribute('href'))).toEqual([
      '#/tema/funciones-en-programacion',
    ]);

    click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
  });

  it('opens and closes every module with the bulk action', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    openAll(container);
    expect(byText(container, 'button', 'Cerrar módulos')).toBeTruthy();
    expect(container.querySelectorAll('.module__panel:not([hidden])')).toHaveLength(2);

    click(byText(container, 'button', 'Cerrar módulos'));
    expect(byText(container, 'button', 'Abrir módulos')).toBeTruthy();
    expect(container.querySelectorAll('.module__panel:not([hidden])')).toHaveLength(0);
  });

  it('topic cards are native links with metrics and accessible names', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    openAll(container);
    const links = [...container.querySelectorAll('a.topic-card')];
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^#\/tema\//);
      expect(link.textContent.trim().length).toBeGreaterThan(0);
      expect(link.querySelector('.topic-card__meta').textContent).toContain('cartas');
    }
    expect(container.querySelector('a.topic-back').getAttribute('href')).toBe('#/');
  });

  it('has keyboard-reachable back, toggles and topic links (AC-12)', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    const back = container.querySelector('a.topic-back');
    expect(back.tagName).toBe('A');
    back.focus();
    expect(document.activeElement).toBe(back);

    const toggle = container.querySelector('.module__toggle');
    toggle.focus();
    expect(document.activeElement).toBe(toggle);

    openAll(container);
    const firstTopic = container.querySelector('a.topic-card');
    firstTopic.focus();
    expect(document.activeElement).toBe(firstTopic);
  });

  it('search shows a flat result list without modules', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    setValue(container.querySelector('#category-search'), 'algoritmos');

    expect(container.querySelectorAll('.module')).toHaveLength(0);
    expect(container.querySelector('.category__results-title').textContent).toBe('Resultados');
    const links = [...container.querySelectorAll('a.topic-card')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(
      '#/tema/algoritmos-y-complejidad-guia-tecnica-exhaustiva'
    );

    setValue(container.querySelector('#category-search'), '');
    expect(container.querySelectorAll('.module')).toHaveLength(2);
    expect(container.querySelector('.category__results')).toBeNull();
  });

  it('sort and status filters use the flat list and can be cleared', () => {
    const { container } = mount(<CategoryView categoryId="programacion" />);
    setValue(container.querySelector('select[aria-label="Ordenar temas"]'), 'name-asc');

    expect(container.querySelectorAll('.module')).toHaveLength(0);
    const titles = [...container.querySelectorAll('.topic-card__title')].map((title) => title.textContent);
    expect(titles[0]).toContain('Algoritmos');

    setValue(container.querySelector('select[aria-label="Filtrar por estado"]'), 'done');
    expect(container.textContent).toContain('Sin resultados');

    click(byText(container, 'button', 'Limpiar filtros'));
    expect(container.querySelectorAll('.module')).toHaveLength(2);
    expect(container.querySelector('#category-search').value).toBe('');
    expect(container.querySelector('select[aria-label="Ordenar temas"]').value).toBe('modules');
    expect(container.querySelector('select[aria-label="Filtrar por estado"]').value).toBe('all');
  });

  it('Mis temas lists custom topics flat, without modules', () => {
    const result = saveCustomTopic({
      title: 'Mi tema',
      md: '# Mi tema\nUn tema propio.\n\n- Q: ¿Qué es? | A: Algo | E: easy',
    });
    expect(result.ok).toBe(true);

    const { container } = mount(<CategoryView categoryId="personalizados" />);
    expect(container.querySelectorAll('.module')).toHaveLength(0);
    expect(container.querySelector('.category__results-title').textContent).toBe('Temas');
    const link = container.querySelector('a.topic-card');
    expect(link.getAttribute('href')).toBe('#/tema/mi-tema');
    expect(link.textContent).toContain('Mi tema');
  });

  it('styles the accordion with 44px targets, focus and reduced motion (AC-12)', () => {
    const css = readTokens();
    expect(css).toMatch(/\.category\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.module__toggle\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.module__toggle\[aria-expanded="true"\]/);
    expect(css).toMatch(/\.module__panel\[hidden\]\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.module__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.module__grid\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.topic-card\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.topic-card__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/a:focus-visible/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.module__toggle/);
  });

  it('collapses the module grid at 360px (AC-12)', () => {
    const css = readTokens();
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.library__grid,\s*\.module__grid\s*\{\s*grid-template-columns:\s*1fr;/
    );
    expect(css).not.toMatch(/\.module(__grid|-title|-subtitle)[^{]*\{[^}]*width:\s*[4-9]\d{2}px/);
  });
});
