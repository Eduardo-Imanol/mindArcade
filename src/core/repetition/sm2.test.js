import { describe, it, expect } from 'vitest';
import { scheduleNext } from './sm2.js';

describe('sm2', () => {
  it('fail decreases interval', () => {
    const out = scheduleNext({ interval: 6, ease: 2.5, reps: 2 }, 'fail');
    expect(out.interval).toBeLessThan(6);
    expect(out.reps).toBe(0);
  });
  it('easy twice strictly increases', () => {
    const a = scheduleNext({ interval: 1, ease: 2.5, reps: 1 }, 'easy');
    const b = scheduleNext({ interval: a.interval, ease: a.ease, reps: a.reps }, 'easy');
    expect(b.interval).toBeGreaterThan(a.interval);
  });
  it('clamps dt of insanity (ease floor)', () => {
    const out = scheduleNext({ interval: 2, ease: 1.3, reps: 5 }, 'fail');
    expect(out.ease).toBeGreaterThanOrEqual(1.3);
  });
});
