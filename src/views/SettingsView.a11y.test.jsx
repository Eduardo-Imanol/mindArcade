import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import SettingsView from './SettingsView.jsx';
import { mount } from '../test/render.jsx';

const readTokens = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');

const accessibleName = (element) =>
  (element.getAttribute('aria-label') || element.textContent || '').trim();

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('SettingsView a11y (spec-23 AC-6)', () => {
  it('renders one h1, labelled sections and native controls', () => {
    const { container } = mount(<SettingsView />);

    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1').textContent).toBe('Configuración');

    const nav = container.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBeTruthy();
    expect(accessibleName(nav).length).toBeGreaterThan(0);

    const sections = [...container.querySelectorAll('section')];
    expect(sections).toHaveLength(2);
    for (const section of sections) {
      const labelId = section.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(container.querySelector(`#${labelId}`)).toBeTruthy();
    }

    for (const link of container.querySelectorAll('a[href]')) {
      expect(accessibleName(link).length).toBeGreaterThan(0);
    }
  });

  it('announces the missing voice once without an extra live region', () => {
    const { container } = mount(<SettingsView />);
    const liveRegions = [
      ...container.querySelectorAll('[role="status"], [role="alert"], [aria-live]'),
    ];
    expect(liveRegions).toHaveLength(1);
    expect(liveRegions[0].getAttribute('role')).toBe('status');
    expect(liveRegions[0].textContent).toContain('Este navegador no ofrece voz del sistema');
  });

  it('keeps 44px targets, wrapping and focus styles at 360px', () => {
    const css = readTokens();
    expect(css).toMatch(/\.btn-neon\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.settings-progress-link\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.settings-card\s*\{[^}]*min-width:\s*0/s);
    expect(css).toMatch(/\.settings-fact__value\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(css).toMatch(
      /\.settings-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 300px\), 1fr\)\)/s
    );
    expect(css).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.settings-footer\s*\{\s*display:\s*grid/s
    );
    expect(css).toMatch(/a:focus-visible/);
    expect(css).not.toMatch(/\.settings-[^{]*\{[^}]*animation:/s);
  });
});
