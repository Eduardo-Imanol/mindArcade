import { describe, it, expect } from 'vitest';
import { parseHash } from './router.js';

describe('parseHash category', () => {
  it('category route', () => {
    expect(parseHash('#/categoria/programacion')).toEqual({ view: 'category', categoryId: 'programacion' });
  });
  it('category empty/unknown stays notFound for bad shapes', () => {
    expect(parseHash('#/categoria')).toEqual({ view: 'notFound' });
  });
});
