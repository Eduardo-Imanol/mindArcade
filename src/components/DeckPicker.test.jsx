import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeckPicker from './DeckPicker.jsx';
import { click, mount } from '../test/render.jsx';

const deck = (overrides = {}) => ({
  id: 'deck-1',
  number: 1,
  label: '1–10',
  from: 1,
  to: 10,
  total: 10,
  studied: 3,
  pending: 7,
  mastery: 'repasar',
  counts: { new: 2, learning: 1, learned: 7, due: 1, studied: 3, pending: 7, total: 10 },
  ...overrides,
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('DeckPicker', () => {
  it('renders mastery, progress and best score for each deck', () => {
    const decks = [
      deck(),
      deck({ id: 'deck-2', number: 2, label: '11–20', mastery: 'aprendida', studied: 10, pending: 0 }),
    ];
    const { container } = mount(
      <DeckPicker decks={decks} selectedDeckId="deck-1" best={{ 'deck-1': 420 }} gameId="quiz" />
    );
    const buttons = [...container.querySelectorAll('.deck-picker__deck')];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].textContent).toContain('Repasar');
    expect(buttons[0].textContent).toContain('Mejor marca: 420 puntos');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].textContent).toContain('Aprendida');
    expect(buttons[1].textContent).toContain('Sin récord todavía');
    expect(container.querySelector('[role="group"]').getAttribute('aria-label')).toBe(
      'Elige tu mazo'
    );
  });

  it('selects a deck with the keyboard-friendly button controls', () => {
    const onSelect = vi.fn();
    const { container } = mount(
      <DeckPicker decks={[deck(), deck({ id: 'deck-2' })]} onSelect={onSelect} />
    );
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.every((button) => button.tabIndex === 0)).toBe(true);
    click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('deck-2', expect.objectContaining({ id: 'deck-2' }));
  });

  it('disables an insufficient deck and explains why', () => {
    const onSelect = vi.fn();
    const decks = [deck(), deck({ id: 'deck-2', number: 2, label: '11–12', total: 2 })];
    const { container } = mount(
      <DeckPicker
        decks={decks}
        onSelect={onSelect}
        disabledReason={(entry) => (entry.total < 4 ? 'Necesitas al menos 4 cartas' : '')}
      />
    );
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[1].textContent).toContain('Necesitas al menos 4 cartas');
    expect(buttons[1].getAttribute('aria-label')).toContain('No disponible');
    click(buttons[1]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows an empty state instead of crashing without decks', () => {
    const { container } = mount(<DeckPicker decks={[]} />);
    expect(container.textContent).toContain('Este tema todavía no tiene mazos');
  });
});
