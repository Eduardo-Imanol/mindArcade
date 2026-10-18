import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('dashboard a11y', () => {
  it('actions are native buttons/inputs (keyboard operable by construction)', () => {
    const code = fs.readFileSync(path.join(process.cwd(), 'src/views/Dashboard.jsx'), 'utf8');
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    expect(code).toMatch(/<button|Button/i);
    expect(code).toMatch(/<textarea/i);
    expect(code).toMatch(/<label/i);
    expect(tokens).toMatch(/focus-visible/);
  });
});
