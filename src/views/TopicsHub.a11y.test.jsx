import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import TopicsHub from './TopicsHub.jsx';
import { click, keydown, mount } from '../test/render.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

const accessibleName = (element) =>
  (element.getAttribute('aria-label') || element.textContent || '').trim();

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicsHub a11y (AC-11)', () => {
  it('has one h1 and accessible names for every native control', () => {
    const { container } = mount(<TopicsHub />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1').textContent).toBe('Biblioteca');

    const controls = [
      ...container.querySelectorAll('a[href], button, input:not([type="hidden"]), select'),
    ];
    expect(controls.length).toBeGreaterThan(3);
    for (const control of controls) {
      expect(accessibleName(control).length).toBeGreaterThan(0);
    }
    for (const select of container.querySelectorAll('select')) {
      expect(select.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('shows the arcade cover as a described image (spec-15 AC-8)', () => {
    const { container } = mount(<TopicsHub />);
    const cover = container.querySelector('img.hub-cover');
    expect(cover).toBeTruthy();
    expect(cover.getAttribute('src')).toContain('cover/arcade-cover.png');
    expect(cover.getAttribute('alt').length).toBeGreaterThan(20);
    expect(cover.getAttribute('width')).toBe('1200');
    expect(cover.getAttribute('height')).toBe('630');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('exposes progressbar semantics on each category card', () => {
    const { container } = mount(<TopicsHub />);
    const bar = container.querySelector('a.library-card [role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toMatch(/^\d+$/);
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toContain('Progreso de');
  });

  it('declares the Spanish document language for screen readers', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    expect(html).toMatch(/<html lang="es">/);
    expect(html).toMatch(/name="viewport"/);
  });

  it('create dialog is a labelled modal with focus management (AC-1..AC-4)', () => {
    const { container } = mount(<TopicsHub />);
    const opener = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Crear tema'
    );
    opener.focus();
    click(opener);

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const label = document.getElementById(labelId);
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Crear tema');
    expect(dialog.contains(document.activeElement) || document.activeElement === dialog).toBe(
      true
    );

    dialog.focus();
    keydown(document, 'Escape');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe('');
  });

  it('traps Tab inside the dialog and closes on backdrop click (AC-3, AC-4)', () => {
    const { container } = mount(<TopicsHub />);
    click([...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Crear tema'
    ));
    const dialog = document.querySelector('[role="dialog"]');
    const focusables = [
      ...dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
      ),
    ];
    expect(focusables.length).toBeGreaterThan(1);

    focusables[focusables.length - 1].focus();
    keydown(dialog, 'Tab');
    expect(document.activeElement).toBe(focusables[0]);

    focusables[0].focus();
    keydown(dialog, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);

    const overlay = dialog.parentElement;
    click(overlay);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('styles library cards with focus, 44px targets, wrapping and reduced motion (AC-12)', () => {
    const css = readTokens();
    expect(css).toMatch(/\.btn-neon\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.library-card\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.library-card__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.library-card__desc\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/a:focus-visible/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.library-card/);
  });

  it('reflows the library grid at 360px without horizontal overflow (AC-12)', () => {
    const css = readTokens();
    expect(css).toMatch(
      /\.library__grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill, minmax\(min\(100%, 240px\), 1fr\)\)/
    );
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.library__grid,\s*\.module__grid\s*\{\s*grid-template-columns:\s*1fr;/
    );
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.hub-header__actions\s*\{\s*width:\s*100%;/
    );
    expect(css).not.toMatch(/\.library(__grid|-card)[^{]*\{[^}]*width:\s*[4-9]\d{2}px/);
  });
});
