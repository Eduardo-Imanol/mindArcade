import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import MarkdownBlocks from './MarkdownBlocks.jsx';
import { parseSourceMarkdown } from '../core/content/markdown.js';
import { mount } from '../test/render.jsx';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MarkdownBlocks (spec-19 AC-2, AC-10)', () => {
  it('renders semantic headings, lists, code, quote and hr', () => {
    const blocks = parseSourceMarkdown(
      '# Título\n\nTexto **fuerte** y [enlace](https://example.com).\n\n- uno\n\n```js\nconst x = 1;\n```\n\n> cita\n\n---'
    );
    const { container } = mount(<MarkdownBlocks blocks={blocks} />);
    expect(container.querySelector('h1.md-heading').textContent).toBe('Título');
    expect(container.querySelector('strong').textContent).toBe('fuerte');
    expect(container.querySelector('a.md-link').getAttribute('href')).toBe('https://example.com');
    expect(container.querySelector('ul.md-list li').textContent).toBe('uno');
    expect(container.querySelector('pre code.language-js').textContent).toBe('const x = 1;');
    expect(container.querySelector('blockquote.md-quote').textContent).toBe('cita');
    expect(container.querySelector('hr.md-hr')).toBeTruthy();
  });

  it('escapes raw HTML instead of injecting it', () => {
    const blocks = parseSourceMarkdown('<script>alert(1)</script>');
    const { container } = mount(<MarkdownBlocks blocks={blocks} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });

  it('does not create anchors for unsafe links', () => {
    const blocks = parseSourceMarkdown('[malo](javascript:alert(1))');
    const { container } = mount(<MarkdownBlocks blocks={blocks} />);
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('malo');
    expect(container.textContent).toContain('javascript:alert(1)');
  });
});
