import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Flashcards from './Flashcards.jsx';
import { click, keydown, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'c1', front: 'dog', back: 'perro', difficulty: 'easy' },
  { id: 'c2', front: 'house', back: 'casa', difficulty: 'hard' },
];

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Flashcards a11y + keyboard', () => {
  it('flip via Space/Enter (no pointer) and reveal grades', () => {
    const { container } = mount(<Flashcards deck={DECK} onGrade={() => ({ gained: 0 })} onExit={() => {}} />);
    expect(container.textContent).toContain('Carta 1 de 2');
    expect(container.textContent).not.toContain('perro');

    keydown(document, ' ');

    expect(container.textContent).toContain('perro');
    const gradeButtons = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(gradeButtons).toEqual(expect.arrayContaining(['Otra vez', 'Difícil', 'Fácil']));
  });

  it('grade buttons call onGrade(cardId, grade) and advance the session', () => {
    const onGrade = vi.fn(() => ({ gained: 10, total: 10 }));
    const { container } = mount(<Flashcards deck={DECK} onGrade={onGrade} onExit={() => {}} />);
    click(container.querySelector('.card-neon'));
    const facil = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Fácil');
    click(facil);
    expect(onGrade).toHaveBeenCalledWith('c1', 'facil');
    expect(container.textContent).toContain('Carta 2 de 2');
  });

  it('summary after grading last card + exit control exists', () => {
    const onExit = vi.fn();
    const { container } = mount(<Flashcards deck={[DECK[0]]} onGrade={() => ({ gained: 10 })} onExit={onExit} />);
    click(container.querySelector('.card-neon'));
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Fácil'));
    expect(container.textContent).toContain('Sesión completada');
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Volver al tema'));
    expect(onExit).toHaveBeenCalled();
  });

  it('every interactive control is a native focusable button (keyboard by construction)', () => {
    const { container } = mount(<Flashcards deck={DECK} onGrade={() => ({ gained: 0 })} onExit={() => {}} />);
    expect(container.querySelectorAll('div[onclick], span[onclick]').length).toBe(0);
    for (const button of container.querySelectorAll('button')) {
      expect(button.getAttribute('type')).toBe('button');
    }
    const card = container.querySelector('.card-neon');
    expect(card.tagName).toBe('BUTTON');
    expect(card.getAttribute('aria-label')).toMatch(/Carta 1 de 2/);
  });

  it('360px mobile contract: >=44px targets, focus ring, fluid full-width layout', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(path.join(process.cwd(), 'src/games/flashcards/Flashcards.jsx'), 'utf8');
    expect(tokens).toMatch(/\.btn-neon\s*{[^}]*min-height:\s*44px/s);
    expect(tokens).toMatch(/focus-visible/);
    expect(code).toMatch(/maxWidth:\s*'100%'/);
    expect(code).toMatch(/game-stage/);
    expect(code).not.toMatch(/width:\s*\d{4,}/);
  });
});
