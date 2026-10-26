import { describe, expect, it } from 'vitest';
import {
  blocksToSpeech,
  inlineToText,
  parseInline,
  parseSourceMarkdown,
  safeHref,
} from './markdown.js';

describe('parseSourceMarkdown (spec-19 T2)', () => {
  it('parses headings, paragraphs, lists, quotes, hr and fenced code', () => {
    const md = [
      '# Título',
      '',
      'Primer párrafo',
      'en dos líneas.',
      '',
      '- uno',
      '- dos',
      '',
      '1. primero',
      '2. segundo',
      '',
      '> cita **fuerte**',
      '',
      '---',
      '',
      '```dart',
      'void main() {}',
      '```',
      '',
      '## Subtítulo',
    ].join('\n');
    const blocks = parseSourceMarkdown(md);
    expect(blocks.map((block) => block.type)).toEqual([
      'heading',
      'paragraph',
      'list',
      'list',
      'blockquote',
      'hr',
      'code',
      'heading',
    ]);
    expect(blocks[0]).toMatchObject({ level: 1, text: 'Título' });
    expect(blocks[1].text).toBe('Primer párrafo en dos líneas.');
    expect(blocks[2]).toMatchObject({ ordered: false, items: [{ text: 'uno' }, { text: 'dos' }] });
    expect(blocks[3]).toMatchObject({ ordered: true, items: [{ text: 'primero' }, { text: 'segundo' }] });
    expect(blocks[4].text).toBe('cita fuerte');
    expect(blocks[6]).toMatchObject({ language: 'dart', code: 'void main() {}' });
    expect(blocks[7]).toMatchObject({ level: 2, text: 'Subtítulo' });
  });

  it('parses inline bold, italic, code and safe links', () => {
    const nodes = parseInline('**fuerte** *cursiva* `código` [docs](https://example.com)');
    expect(nodes.map((node) => node.type)).toEqual(['strong', 'text', 'em', 'text', 'code', 'text', 'link']);
    expect(nodes[0].children[0].value).toBe('fuerte');
    expect(nodes[2].children[0].value).toBe('cursiva');
    expect(nodes[4].value).toBe('código');
    expect(nodes[6]).toMatchObject({ href: 'https://example.com' });
    expect(inlineToText(nodes)).toBe('fuerte cursiva código docs');
  });

  it('never treats raw HTML as markup', () => {
    const blocks = parseSourceMarkdown('<script>alert("xss")</script>');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toContain('<script>');
    expect(blocks[0].text).toContain('alert("xss")');
  });

  it('rejects unsafe link schemes but keeps their label as text', () => {
    expect(safeHref('https://sepect.app')).toBe('https://sepect.app');
    expect(safeHref('/tema/x')).toBe('/tema/x');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,x')).toBeNull();
    expect(safeHref('//evil.example')).toBeNull();
    const nodes = parseInline('[malo](javascript:alert(1))');
    expect(nodes[0]).toMatchObject({ type: 'link', href: null, rawHref: 'javascript:alert(1)' });
  });

  it('handles empty input, CRLF and unclosed fences', () => {
    expect(parseSourceMarkdown('')).toEqual([]);
    expect(parseSourceMarkdown(null)).toEqual([]);
    expect(parseSourceMarkdown('# Hola\r\n\r\nTexto')).toMatchObject([
      { type: 'heading', text: 'Hola' },
      { type: 'paragraph', text: 'Texto' },
    ]);
    expect(parseSourceMarkdown('```js\nconst a = 1;')).toMatchObject([
      { type: 'code', language: 'js', code: 'const a = 1;' },
    ]);
  });
});

describe('blocksToSpeech (spec-19 AC-6)', () => {
  it('reads text blocks in order and omits code and hr', () => {
    const blocks = parseSourceMarkdown(
      '# Título\n\nIntro con **énfasis**.\n\n- punto uno\n- punto dos\n\n```js\nno leer\n```\n\n> cita\n\n---\n\nFinal.'
    );
    expect(blocksToSpeech(blocks)).toEqual([
      'Título',
      'Intro con énfasis.',
      'punto uno',
      'punto dos',
      'cita',
      'Final.',
    ]);
  });

  it('tolerates invalid input', () => {
    expect(blocksToSpeech(null)).toEqual([]);
    expect(blocksToSpeech([null, {}, { type: 'code', code: 'x' }])).toEqual([]);
  });
});
