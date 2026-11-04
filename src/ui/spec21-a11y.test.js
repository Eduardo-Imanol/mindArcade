import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
const css = () => read('src/ui/tokens.css');

describe('code games visual contract (spec-21 T20)', () => {
  it('keeps 44px targets and visible focus on code controls', () => {
    const tokens = css();
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.code-difficulty__option\s*{[^}]*min-height:\s*56px/s);
    expect(tokens).toMatch(/\.ordena-piece\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(
      /\.ordena-answer__actions \.btn-neon\s*{[^}]*min-height:\s*44px/s
    );
    expect(tokens).toMatch(/\.completa-blank__input\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/button:focus-visible/);
    expect(tokens).toMatch(/textarea:focus-visible/);
    expect(tokens).toMatch(/input:focus-visible/);
    expect(tokens).toMatch(
      /\.code-editor__area:focus-visible\s*{[^}]*outline:\s*3px solid var\(--neon-green\)/s
    );
  });

  it('shows exercise progress and the completed level without overflow', () => {
    const tokens = css();
    expect(tokens).toMatch(/\.code-progress__head\s*{[^}]*flex-wrap:\s*wrap/s);
    expect(tokens).toMatch(/\.code-progress__head span\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.code-progress__head strong\s*{[^}]*color:\s*var\(--neon-green\)/s);
    expect(tokens).toMatch(/\.code-game-page\s*{[^}]*overflow-x:\s*clip/s);
    expect(tokens).toMatch(/\.code-exercise\s*{[^}]*min-width:\s*0/s);
    expect(tokens).toMatch(/\.code-mechanic\s*{[^}]*min-width:\s*0/s);
  });

  it('wraps editor, pieces and blanks at 360px', () => {
    const tokens = css();
    expect(tokens).toMatch(/\.code-editor\s*{[^}]*max-width:\s*100%/s);
    expect(tokens).toMatch(/\.ordena-piece__code[\s\S]*?overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.completa-code-wrap\s*{[^}]*overflow:\s*hidden/s);
    expect(tokens).toMatch(/\.completa-code\s*{[^}]*white-space:\s*pre-wrap/s);
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{[\s\S]*?\.code-difficulty__options\s*{\s*grid-template-columns:\s*minmax\(0, 1fr\)/s
    );
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{[\s\S]*?\.ordena-answer__item\s*{\s*grid-template-columns:\s*auto minmax\(0, 1fr\)/s
    );
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{[\s\S]*?\.completa-actions\s*{\s*display:\s*grid/s
    );
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{[\s\S]*?\.escribe-actions\s*{\s*display:\s*grid/s
    );
  });

  it('honours reduced motion in the code games', () => {
    const tokens = css();
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*?\.code-difficulty__option,\s*\.ordena-piece,\s*\.code-editor__area\s*{\s*transition:\s*none/s
    );
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*?\.code-difficulty__option:hover:not\(:disabled\)\s*{\s*transform:\s*none/s
    );
  });
});
