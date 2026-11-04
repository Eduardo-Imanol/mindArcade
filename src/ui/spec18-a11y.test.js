import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
const css = () => read('src/ui/tokens.css');

describe('deck + arcade visual contract (spec-18 T15)', () => {
  it('keeps 44px targets and a visible focus ring on deck controls', () => {
    const tokens = css();
    const deck = tokens.match(/\.deck-picker__deck\s*{([^}]*)}/s)[1];
    expect(deck).toMatch(/min-height:\s*44px/);
    expect(tokens).toMatch(
      /\.deck-picker__deck:focus-visible\s*{[^}]*outline:\s*2px solid var\(--neon-green\)/s
    );
    expect(tokens).toMatch(/\.deck-overview__summary\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/\.deck-overview__record\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/a:focus-visible/);
    expect(tokens).toMatch(/summary:focus-visible/);
    expect(tokens).toMatch(/details:focus-visible/);
  });

  it('wraps deck text and stacks the mode switch at 360px', () => {
    const tokens = css();
    expect(tokens).toMatch(/\.deck-picker__meta\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(tokens).toMatch(/\.deck-picker__foot\s*{[^}]*flex-wrap:\s*wrap/s);
    expect(tokens).toMatch(/\.game-mode__options\s*{[^}]*grid-template-columns:\s*repeat\(2/s);
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{\s*\.game-mode__options\s*{\s*grid-template-columns:\s*minmax\(0, 1fr\)/s
    );
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{\s*\.deck-overview__mastery\s*{\s*grid-template-columns:\s*repeat\(2/s
    );
    expect(tokens).toMatch(/\.deck-overview__record-list\s*{[^}]*minmax\(min\(100%, 220px\)/s);
  });

  it('wraps the arcade HUD and hides its live summary visually', () => {
    const tokens = css();
    expect(tokens).toMatch(/\.arcade-hud\s*{[^}]*flex-wrap:\s*wrap/s);
    expect(tokens).toMatch(/\.arcade-hud__stats\s*{[^}]*flex-wrap:\s*wrap/s);
    const live = tokens.match(/\.arcade-hud__live\s*{([^}]*)}/s)[1];
    expect(live).toMatch(/position:\s*absolute/);
    expect(live).toMatch(/width:\s*1px/);
    expect(live).toMatch(/clip:\s*rect\(0 0 0 0\)/);
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{\s*\.arcade-hud\s*{\s*align-items:\s*flex-start/s
    );
  });

  it('keeps arcade summary actions usable at 360px', () => {
    const tokens = css();
    expect(tokens).toMatch(/\.result-panel__actions\s*{[^}]*flex-wrap:\s*wrap/s);
    expect(tokens).toMatch(/\.arcade-summary__score\s*{[^}]*flex-wrap:\s*wrap/s);
    expect(tokens).toMatch(/\.arcade-summary__badge\s*{[^}]*white-space:\s*nowrap/s);
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{[\s\S]*?\.result-panel__actions\s*{\s*display:\s*grid/s
    );
    expect(tokens).toMatch(
      /@media \(max-width: 479px\)\s*{[\s\S]*?\.arcade-summary__badge\s*{\s*margin-left:\s*0/s
    );
  });

  it('disables deck, mode and record motion when reduced motion is requested', () => {
    const tokens = css();
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.deck-picker__deck\s*{\s*transition:\s*none/s
    );
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.game-mode__option\s*{\s*transition:\s*none/s
    );
    expect(tokens).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.deck-overview__record\s*{\s*transition:\s*none/s
    );
  });
});
