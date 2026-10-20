import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Memorama from './Memorama.jsx';
import { click, mount } from '../../test/render.jsx';

const DECK = [
  { id: 'a', front: 'perro', back: 'dog', difficulty: 'easy' },
  { id: 'b', front: 'gato', back: 'cat', difficulty: 'easy' },
  { id: 'c', front: 'sol', back: 'sun', difficulty: 'easy' },
  { id: 'd', front: 'luna', back: 'moon', difficulty: 'easy' },
];

const tiles = (container) => [...container.querySelectorAll('.memorama-tile')];
const tile = (container, cardId, face) =>
  tiles(container).find((el) => el.dataset.cardId === cardId && el.dataset.face === face);
const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent.startsWith(text));
const start = (container, label = 'Fácil') => click(buttonByText(container, label));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Memorama setup + board (AC-2, AC-4)', () => {
  it('offers the difficulty ladder and builds 2 tiles per selected card', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    const labels = [...view.container.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(
      expect.arrayContaining(['Fácil · 4 parejas', 'Medio · 4 parejas', 'Difícil · 4 parejas'])
    );
    start(view.container);
    expect(tiles(view.container)).toHaveLength(8);
    view.unmount();
  });

  it('uses selectCards for the chosen difficulty (min with available deck)', () => {
    const selectCards = vi.fn((count) => DECK.slice(0, count));
    const view = mount(
      <Memorama deck={DECK} selectCards={selectCards} onGrade={() => ({})} onExit={() => {}} />
    );
    start(view.container, 'Medio');
    expect(selectCards).toHaveBeenCalledWith(6);
    expect(tiles(view.container)).toHaveLength(8);
    view.unmount();
  });

  it('renders a CardImage on every tile (AC-4)', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    const visuals = view.container.querySelectorAll('img, canvas[role="img"], span[role="img"]');
    expect(visuals.length).toBe(tiles(view.container).length);
    view.unmount();
  });
});

describe('Memorama flip logic (AC-5, AC-6)', () => {
  it('matching a pair keeps it face up and grades facil', () => {
    const onGrade = vi.fn(() => ({ gained: 10 }));
    const view = mount(<Memorama deck={DECK} onGrade={onGrade} onExit={() => {}} />);
    start(view.container);
    click(tile(view.container, 'a', 'front'));
    click(tile(view.container, 'a', 'back'));
    expect(tile(view.container, 'a', 'front').dataset.matched).toBe('true');
    expect(tile(view.container, 'a', 'back').dataset.matched).toBe('true');
    expect(onGrade).toHaveBeenCalledWith('a', 'facil');
    view.unmount();
  });

  it('a mismatch locks the board and ignores further clicks', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    click(tile(view.container, 'a', 'front'));
    click(tile(view.container, 'b', 'front'));
    expect(tile(view.container, 'a', 'front').dataset.open).toBe('true');
    expect(tile(view.container, 'b', 'front').dataset.open).toBe('true');
    expect(view.container.textContent).toContain('no coinciden');
    click(tile(view.container, 'c', 'front'));
    expect(tile(view.container, 'c', 'front').dataset.open).toBe('false');
    view.unmount();
  });

  it('completes a session and shows the summary', () => {
    const two = DECK.slice(0, 2);
    const onGrade = vi.fn(() => ({}));
    const view = mount(<Memorama deck={two} onGrade={onGrade} onExit={() => {}} />);
    start(view.container);
    expect(tiles(view.container)).toHaveLength(4);
    click(tile(view.container, 'a', 'front'));
    click(tile(view.container, 'a', 'back'));
    click(tile(view.container, 'b', 'front'));
    click(tile(view.container, 'b', 'back'));
    expect(view.container.textContent).toContain('Sesión completada');
    expect(onGrade.mock.calls.map(([cardId]) => cardId).sort()).toEqual(['a', 'b']);
    view.unmount();
  });

  it('exiting grades never-found cards as otra-vez and calls onExit', () => {
    const onGrade = vi.fn(() => ({}));
    const onExit = vi.fn();
    const view = mount(<Memorama deck={DECK} onGrade={onGrade} onExit={onExit} />);
    start(view.container);
    click(buttonByText(view.container, 'Salir'));
    expect(onGrade).toHaveBeenCalledTimes(4);
    expect(onGrade.mock.calls.every(([, grade]) => grade === 'otra-vez')).toBe(true);
    expect(onExit).toHaveBeenCalled();
    view.unmount();
  });
});

describe('Memorama a11y + responsive contract (AC-7, AC-8)', () => {
  it('every tile is a native focusable button with an accessible label', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    expect(view.container.querySelectorAll('[role="button"]:not(button)').length).toBe(0);
    for (const el of tiles(view.container)) {
      expect(el.tagName).toBe('BUTTON');
      expect(el.getAttribute('type')).toBe('button');
      expect(el.getAttribute('aria-label')).toBeTruthy();
    }
    expect(tile(view.container, 'a', 'front').getAttribute('aria-label')).toBe('Carta boca abajo');
    click(tile(view.container, 'a', 'front'));
    expect(tile(view.container, 'a', 'front').getAttribute('aria-label')).toBe('Término: perro');
    view.unmount();
  });

  it('resultados de par y resumen viven en una región aria-live', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    expect(view.container.querySelector('[aria-live="polite"]')).toBeTruthy();
    click(tile(view.container, 'a', 'front'));
    click(tile(view.container, 'a', 'back'));
    expect(view.container.textContent).toContain('Par encontrado');
    view.unmount();
  });

  it('no re-announces a stale pair after a later mismatch resolves (AC-8)', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    const status = () => view.container.querySelector('[aria-live="polite"]').textContent;

    click(tile(view.container, 'a', 'front'));
    click(tile(view.container, 'a', 'back'));
    expect(status()).toContain('Par encontrado');

    click(tile(view.container, 'b', 'front'));
    click(tile(view.container, 'c', 'front'));
    expect(status()).toContain('no coinciden');

    click(buttonByText(view.container, '🔄 Voltear'));
    expect(status()).not.toContain('Par encontrado');
    view.unmount();
  });

  it('keeps the mismatch text visible and only flips back on demand', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    const info = () => view.container.querySelector('.memorama-info');

    click(tile(view.container, 'a', 'front'));
    click(tile(view.container, 'b', 'front'));
    const a = tile(view.container, 'a', 'front');
    const b = tile(view.container, 'b', 'front');
    expect(a.dataset.open).toBe('true');
    expect(b.dataset.open).toBe('true');
    expect(info().textContent).toContain(a.getAttribute('data-text'));
    expect(info().textContent).toContain(b.getAttribute('data-text'));

    const flip = buttonByText(view.container, '🔄 Voltear');
    expect(flip).toBeTruthy();
    click(flip);
    expect(a.dataset.open).toBe('false');
    expect(b.dataset.open).toBe('false');
    expect(info().textContent).toContain('Toca una carta');
    view.unmount();
  });

  it('responsive contract: exactly 3 cols, square tiles, info panel below the board', () => {
    const tokens = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const code = fs.readFileSync(path.join(process.cwd(), 'src/games/memorama/Memorama.jsx'), 'utf8');

    const board = tokens.match(/\.memorama-board\s*{([^}]*)}/s)[1];
    expect(board).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(board).toMatch(/gap:\s*10px/);

    const tile = tokens.match(/\.memorama-tile\s*{([^}]*)}/s)[1];
    expect(tile).toMatch(/min-height:\s*44px/);
    expect(tile).toMatch(/min-width:\s*44px/);
    expect(tile).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);

    const page = tokens.match(/\.memorama-page\s*{([^}]*)}/s)[1];
    expect(page).toMatch(/max-width:\s*100%/);

    const stage = tokens.match(/\.game-stage\s*{([^}]*)}/s)[1];
    expect(stage).toMatch(/max-width:\s*960px/);
    expect(stage).toMatch(/margin:\s*0 auto/);

    expect(tokens).toMatch(/\.memorama-info\s*{/);
    expect(tokens).toMatch(/prefers-reduced-motion[\s\S]*?transition:\s*none/);
    expect(code).toMatch(/memorama-info/);
    expect(code).not.toMatch(/memorama-tile__text/);
    expect(code).not.toMatch(/width:\s*\d{4,}/);
  });

  it('info panel shows the revealed card text and updates on each flip', () => {
    const view = mount(<Memorama deck={DECK} onGrade={() => ({})} onExit={() => {}} />);
    start(view.container);
    const info = () => view.container.querySelector('.memorama-info');

    expect(info().textContent).toContain('Toca una carta');

    const first = tiles(view.container)[0];
    click(first);
    expect(info().textContent).toContain(first.getAttribute('data-text'));

    const second = tiles(view.container).find(
      (el) => el !== first && el.dataset.open === 'false' && el.dataset.cardId !== first.dataset.cardId
    );
    click(second);
    expect(info().textContent).toContain(first.getAttribute('data-text'));
    expect(info().textContent).toContain(second.getAttribute('data-text'));
    view.unmount();
  });
});
