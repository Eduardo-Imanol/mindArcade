import { describe, expect, it } from 'vitest';
import { topicCoverCard } from './cover.js';

describe('topicCoverCard (spec-12 AC-9)', () => {
  it('first card with an explicit image wins', () => {
    const topic = {
      cards: [
        { id: 'a', front: 'A' },
        { id: 'b', front: 'B', image: { kind: 'asset', value: 'x.svg' } },
        { id: 'c', front: 'C', image: { kind: 'emoji', value: '🐶' } },
      ],
    };
    expect(topicCoverCard(topic)).toBe(topic.cards[1]);
  });
  it('topic image override counts as explicit image', () => {
    const topic = {
      images: { a: { kind: 'upload', value: 'blob-1' } },
      cards: [
        { id: 'a', front: 'A' },
        { id: 'b', front: 'B', image: { kind: 'emoji', value: '🐱' } },
      ],
    };
    expect(topicCoverCard(topic)).toBe(topic.cards[0]);
  });
  it('string images count as explicit', () => {
    const topic = { cards: [{ id: 'a', front: 'A' }, { id: 'b', front: 'B', image: 'perro' }] };
    expect(topicCoverCard(topic)).toBe(topic.cards[1]);
  });
  it('no explicit image → first card (CardImage fallback)', () => {
    const topic = { cards: [{ id: 'a', front: 'A' }, { id: 'b', front: 'B' }] };
    expect(topicCoverCard(topic)).toBe(topic.cards[0]);
  });
  it('blank images are ignored when picking the cover', () => {
    const topic = {
      cards: [
        { id: 'a', front: 'A', image: '   ' },
        { id: 'b', front: 'B', image: { kind: 'emoji', value: '🐱' } },
      ],
    };
    expect(topicCoverCard(topic)).toBe(topic.cards[1]);
  });
  it('empty or garbage topic → null, never throws', () => {
    expect(topicCoverCard({ cards: [] })).toBeNull();
    expect(topicCoverCard({})).toBeNull();
    expect(topicCoverCard(null)).toBeNull();
    expect(topicCoverCard(undefined)).toBeNull();
    expect(topicCoverCard({ cards: [null] })).toBe(null);
  });
});
