import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const sourceFiles = walk(path.join(process.cwd(), 'src'))
  .filter((file) => /\.(js|jsx)$/.test(file))
  .filter((file) => !/\.test\.(js|jsx)$/.test(file) && !file.includes(`${path.sep}test${path.sep}`))
  .map((file) => path.relative(process.cwd(), file));

describe('design system gate (spec-13)', () => {
  it('keeps a single cyan and no stray legacy hex across src (AC-6)', () => {
    for (const file of sourceFiles) {
      const code = read(file);
      expect(code, `${file} must not contain #00f5d4`).not.toMatch(/#00f5d4/i);
      expect(code, `${file} must not contain #0d0d1a`).not.toMatch(/#0d0d1a/i);
    }
  });

  it('declares new spec-13 tokens in :root (AC-6)', () => {
    const root = read('src/ui/tokens.css').match(/:root\s*{([^}]*)}/s)[1];
    for (const token of ['--bg3', '--bg-deep', '--neon-violet', '--cyan-dim', '--text-dim']) {
      expect(root, token).toContain(`${token}:`);
    }
  });

  it('styles .btn-neon as a full control with hover and reduced motion (AC-7)', () => {
    const css = read('src/ui/tokens.css');
    const block = css.match(/\.btn-neon\s*{([^}]*)}/s)[1];
    expect(block).toMatch(/display:\s*inline-flex/);
    expect(block).toMatch(/cursor:\s*pointer/);
    expect(block).toMatch(/min-height:\s*44px/);
    expect(block).toMatch(/text-decoration:\s*none/);
    expect(css).toMatch(/\.btn-neon:hover\s*{/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.btn-neon/);
  });

  it('gives the search field room for the clear button (AC-8)', () => {
    const css = read('src/ui/tokens.css');
    const search = css.match(/#hub-search\s*{([^}]*)}/s)[1];
    expect(search).toMatch(/padding-right:\s*(\d+)px/);
    expect(Number(search.match(/padding-right:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(44);
  });

  it('paints html and body with the app background (AC-15)', () => {
    const css = read('src/ui/tokens.css');
    expect(css).toMatch(/html,\s*body\s*{\s*background:\s*var\(--bg\)/);
  });

  it('rhythm for error screens and shared game title (AC-16, AC-17)', () => {
    const css = read('src/ui/tokens.css');
    expect(css).toMatch(/\.error-page\s*{/);
    expect(css).toMatch(/\.game-app-title\s*{[^}]*font-size:\s*24px/);
    expect(read('src/components/NotFound.jsx')).toContain('error-page');
    expect(read('src/views/GameHost.jsx')).toContain('error-page');
  });

  it('dead Button component is gone (AC-18)', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/Button.jsx'))).toBe(false);
  });

  it('styles the snake setup select fully, not just min-height (AC-9)', () => {
    const css = read('src/ui/tokens.css');
    const block = css.match(/\.serpiente-setup-row select\s*{([^}]*)}/s)[1];
    expect(block).toMatch(/min-height:\s*44px/);
    expect(block).toMatch(/border:\s*1px solid/);
    expect(block).toMatch(/background:/);
    expect(block).toMatch(/border-radius:/);
    expect(css).toMatch(/\.serpiente-speak\s*{[^}]*cursor:\s*pointer/s);
  });

  it('uses the light violet for conecta-pares pairs (AC-10)', () => {
    const code = read('src/games/conecta-pares/ConectaPares.jsx');
    expect(code).toContain("'#b388ff'");
    expect(code).not.toContain('#7c4dff');
  });

  it('shares ProgressBar and study counts instead of copying them (AC-11, AC-12)', () => {
    for (const view of ['TopicsHub', 'TopicView', 'Dashboard']) {
      const code = read(`src/views/${view}.jsx`);
      expect(code, view).toContain('ProgressBar.jsx');
      expect(code, view).not.toMatch(/function ProgressBar\(/);
    }
    for (const view of ['TopicView', 'GameHost']) {
      const code = read(`src/views/${view}.jsx`);
      expect(code, view).toContain('useStudyCardCounts');
      expect(code, view).not.toMatch(/counts\[entry\.id\]\s*=/);
    }
    expect(fs.existsSync(path.join(process.cwd(), 'src/views/useStudyCardCounts.js'))).toBe(true);
  });

  it('page chrome comes from .topic-page, not inline PAGE (AC-13, AC-14)', () => {
    for (const file of [
      'src/views/GameHost.jsx',
      'src/views/TopicsHub.jsx',
      'src/games/conecta-pares/ConectaPares.jsx',
      'src/components/NotFound.jsx',
    ]) {
      const code = read(file);
      expect(code, file).not.toContain('const PAGE');
      expect(code, file).not.toContain('style={PAGE}');
    }
    const hub = read('src/views/TopicsHub.jsx');
    expect(hub).not.toContain('const INPUT');
    expect(hub).not.toContain('const CONTROL');
    expect(hub).toContain('hub-field');
    expect(hub).toContain('library-card');
  });

  it('announces gated games and pairs dashboard metrics by id (AC-20, AC-22)', () => {
    const topicView = read('src/views/TopicView.jsx');
    expect(topicView).toContain('aria-describedby={`game-availability-${game.id}`}');
    expect(topicView).toContain('id={`game-availability-${game.id}`}');
    const dash = read('src/views/Dashboard.jsx');
    expect(dash).not.toMatch(/global\.topics\[index\]/);
    expect(dash).toContain('getTopicMetrics(topic');
  });
});
