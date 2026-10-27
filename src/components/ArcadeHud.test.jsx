import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import ArcadeHud from './ArcadeHud.jsx';
import { mount } from '../test/render.jsx';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ArcadeHud', () => {
  it('shows lives, score, streak and best in an aria-live region', () => {
    const { container } = mount(<ArcadeHud lives={2} score={240} streak={3} best={500} />);
    const hud = container.querySelector('.arcade-hud');
    expect(hud.getAttribute('aria-label')).toBe('Marcador arcade');
    expect(hud.textContent).toContain('2/3');
    expect(hud.textContent).toContain('240');
    expect(hud.textContent).toContain('500');
    const live = container.querySelector('[aria-live="polite"]');
    expect(live.getAttribute('role')).toBe('status');
    expect(live.textContent).toBe(
      'Vidas 2 de 3. Puntuación 240. Racha 3. Mejor marca 500.'
    );
    expect(container.querySelectorAll('.arcade-hud__life.is-on')).toHaveLength(2);
    expect(container.querySelectorAll('.arcade-hud__life')).toHaveLength(3);
  });

  it('clamps invalid values safely', () => {
    const { container } = mount(<ArcadeHud lives={99} score={-5} streak="x" best={null} />);
    expect(container.textContent).toContain('3/3');
    expect(container.querySelector('[aria-live="polite"]').textContent).toBe(
      'Vidas 3 de 3. Puntuación 0. Racha 0. Mejor marca 0.'
    );
  });

  it('renders nothing in normal mode', () => {
    const { container } = mount(<ArcadeHud mode="normal" />);
    expect(container.querySelector('.arcade-hud')).toBeNull();
  });
});
