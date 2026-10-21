import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

describe('dashboard a11y', () => {
  it('uses native controls and exposes progressbar semantics (AC-26)', () => {
    const code = read('src/views/Dashboard.jsx');
    const bar = read('src/components/ProgressBar.jsx');
    const tokens = read('src/ui/tokens.css');
    expect(bar).toMatch(/role="progressbar"/);
    expect(bar).toMatch(/aria-valuenow/);
    expect(bar).toMatch(/aria-valuemin/);
    expect(bar).toMatch(/aria-valuemax/);
    expect(bar).toMatch(/aria-label=\{label\}/);
    expect(code).toMatch(/<ProgressBar[^>]*label=\{`Progreso de/);
    expect(code).toMatch(/<a /);
    expect(code).toMatch(/<details/);
    expect(code).toMatch(/<summary>/);
    expect(tokens).toMatch(/focus-visible/);
    expect(tokens).toMatch(/prefers-reduced-motion/);
  });

  it('activity has a textual/tabular alternative, no chart library', () => {
    const code = read('src/views/Dashboard.jsx');
    expect(code).toMatch(/<table/);
    expect(code).not.toMatch(/chart|recharts|d3/i);
  });

  it('styles 44px targets, scroll-safe activity table and reduced motion (AC-26)', () => {
    const tokens = read('src/ui/tokens.css');
    expect(tokens).toMatch(/\.dash-back\s*\{[^}]*min-height:\s*44px/);
    expect(tokens).toMatch(/\.dash-topic__link\s*\{[^}]*min-height:\s*44px/);
    expect(tokens).toMatch(/\.dash-activity__table summary\s*\{[^}]*min-height:\s*44px/);
    expect(tokens).toMatch(/\.dash-activity__table\s*\{[^}]*overflow-x:\s*auto/);
    expect(tokens).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.dash-activity__bar/);
  });

  it('reflows KPIs, topics and bars at 360px without horizontal scroll (AC-26)', () => {
    const tokens = read('src/ui/tokens.css');
    expect(tokens).toMatch(
      /@media \(max-width: 640px\)\s*\{\s*\.dash-activity__bars\s*\{\s*grid-template-columns:\s*repeat\(7, 1fr\)/
    );
    expect(tokens).toMatch(
      /@media \(max-width: 640px\)\s*\{[\s\S]*?\.dash-topic\s*\{\s*flex-direction:\s*column;/
    );
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*\{\s*\.dash-kpis\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/
    );
    expect(tokens).toMatch(/\.dash-topic__title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(tokens).toMatch(/\.dash-topic__meta\s*\{[^}]*overflow-wrap:\s*anywhere/);
  });
});
