import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Flashcards from './Flashcards.jsx';
import { click, keydown, mount, waitFor } from '../../test/render.jsx';

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


describe('Flashcards decks (spec-16)', () => {
  const deck = [
    { id: 'c1', front: 'uno', back: 'one' },
    { id: 'c2', front: 'dos', back: 'two' },
    { id: 'c3', front: 'tres', back: 'three' },
    { id: 'c4', front: 'cuatro', back: 'four' },
    { id: 'c5', front: 'cinco', back: 'five' },
    { id: 'c6', front: 'seis', back: 'six' },
    { id: 'c7', front: 'siete', back: 'seven' },
    { id: 'c8', front: 'ocho', back: 'eight' },
    { id: 'c9', front: 'nueve', back: 'nine' },
    { id: 'c10', front: 'diez', back: 'ten' },
    { id: 'c11', front: 'once', back: 'eleven' },
  ];
  const decks = [
    {
      id: 'deck-1',
      number: 1,
      label: '1–10',
      from: 1,
      to: 10,
      cards: deck.slice(0, 10),
      total: 10,
      studied: 2,
      studiedIds: ['c1', 'c2'],
      pending: 8,
      complete: false,
    },
    {
      id: 'deck-2',
      number: 2,
      label: '11–11',
      from: 11,
      to: 11,
      cards: deck.slice(10, 11),
      total: 1,
      studied: 0,
      studiedIds: [],
      pending: 1,
      complete: false,
    },
  ];

  it('shows setup with decks and starts a partial session', async () => {
    const onGrade = vi.fn(() => ({ gained: 10 }));
    const { container } = mount(<Flashcards decks={decks} deck={deck} onGrade={onGrade} onExit={() => {}} />);
    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('Reanudar mazo');
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Reanudar mazo'));
    await waitFor(() => container.textContent.includes('Mazo 1'));
    await waitFor(() => container.textContent.includes('Carta 1 de'));
    expect(container.textContent).not.toContain('Carta 1 de 11');
  });

  it('can exit to topic from setup', () => {
    const onExit = vi.fn();
    const { container } = mount(<Flashcards decks={decks} deck={deck} onGrade={() => ({})} onExit={onExit} />);
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Volver al tema'));
    expect(onExit).toHaveBeenCalled();
  });
});
