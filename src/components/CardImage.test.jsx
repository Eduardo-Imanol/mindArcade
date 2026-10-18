import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import CardImage from './CardImage.jsx';
import { fire, mount } from '../test/render.jsx';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CardImage', () => {
  it('URL image → <img> with accessible alt', () => {
    const { container } = mount(
      <CardImage card={{ id: 'casa', front: 'house', image: { kind: 'url', value: 'https://example.com/house.png' } }} />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('alt')).toBe('house');
    expect(img.getAttribute('src')).toBe('https://example.com/house.png');
  });

  it('MD token emoji → emoji glyph with alt', () => {
    const { container } = mount(
      <CardImage card={{ id: 'perro', front: 'dog', image: { kind: 'emoji', value: '🐶' } }} />
    );
    const glyph = container.querySelector('span[role="img"]');
    expect(glyph).not.toBeNull();
    expect(glyph.textContent).toBe('🐶');
    expect(glyph.getAttribute('aria-label')).toBe('dog');
  });

  it('broken URL → fallback tile with alt, never a broken icon', () => {
    const { container } = mount(
      <CardImage card={{ id: 'casa', front: 'house', image: { kind: 'url', value: 'https://example.com/missing.png' } }} />
    );
    fire(container.querySelector('img'), 'error');
    expect(container.querySelector('img')).toBeNull();
    const tile = container.querySelector('canvas[role="img"]');
    expect(tile).not.toBeNull();
    expect(tile.getAttribute('aria-label')).toBe('house');
  });

  it('no image + dictionary word → auto emoji', () => {
    const { container } = mount(<CardImage card={{ id: 'libro', front: 'book' }} />);
    const glyph = container.querySelector('span[role="img"]');
    expect(glyph).not.toBeNull();
    expect(glyph.textContent).toBe('📚');
  });

  it('no image + unknown word → fallback tile', () => {
    const { container } = mount(<CardImage card={{ id: 'xyz-1', front: 'concepto abstracto' }} />);
    const tile = container.querySelector('canvas[role="img"]');
    expect(tile).not.toBeNull();
    expect(tile.getAttribute('aria-label')).toBe('concepto abstracto');
  });

  it('missing asset → fallback tile (no crash)', () => {
    const { container } = mount(
      <CardImage card={{ id: 'nope', front: 'cosa', image: { kind: 'asset', value: 'no-existe/nope.svg' } }} />
    );
    expect(container.querySelector('canvas[role="img"]')).not.toBeNull();
  });

  it('UI override wins over MD token', () => {
    const { container } = mount(
      <CardImage
        card={{ id: 'perro', front: 'dog', image: { kind: 'emoji', value: '🐶' } }}
        overrides={{ perro: { kind: 'emoji', value: '🦴' } }}
      />
    );
    expect(container.querySelector('span[role="img"]').textContent).toBe('🦴');
  });
});
