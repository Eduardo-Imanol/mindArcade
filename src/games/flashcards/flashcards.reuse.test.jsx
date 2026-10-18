import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Flashcards from './Flashcards.jsx';
import CardImage from '../../components/CardImage.jsx';
import { parseTopic } from '../../core/parser/parser.js';
import { click, mount } from '../../test/render.jsx';

const FIXTURE_A = `# Funciones en Programación
Una función encapsula lógica reutilizable y evita repetir código.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable que realiza una tarea | E: easy
- Q: ¿Qué es un parámetro? | A: Variable que recibe valores de entrada | E: easy
- Q: ¿Qué es el valor de retorno? | A: Resultado que la función devuelve al llamador | E: hard
- LINEA SIN MARCADORES`;

const FIXTURE_B = `# Inglés básico
- Q: dog | A: perro
- Q: house | A: casa
- Q: apple | A: manzana`;

const FIXTURE_C = `# Animales
- Q: dog | A: perro | I: 🐶
- Q: house | A: casa | I: https://example.com/house.png
- Q: book | A: libro`;

const VISUAL = 'span[role="img"], img, canvas[role="img"]';

function playDeck(deck) {
  const onGrade = vi.fn(() => ({ gained: 10, total: 10 }));
  const { container, unmount } = mount(<Flashcards deck={deck} onGrade={onGrade} onExit={() => {}} />);
  const visuals = [];
  for (let i = 0; i < deck.length; i += 1) {
    expect(container.textContent).toContain(`Carta ${i + 1} de ${deck.length}`);
    expect(container.textContent).toContain(deck[i].front);
    visuals.push(container.querySelector(VISUAL));
    click(container.querySelector('.card-neon'));
    click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Fácil'));
  }
  expect(container.textContent).toContain('Sesión completada');
  expect(onGrade.mock.calls.map(([cardId]) => cardId)).toEqual(deck.map((card) => card.id));
  unmount();
  return visuals;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('flashcards reuse across decks (AC-6)', () => {
  it('programming deck (es) completes with a visual on every card', () => {
    const deck = parseTopic(FIXTURE_A).cards;
    expect(deck).toHaveLength(3);
    expect(playDeck(deck).every(Boolean)).toBe(true);
  });

  it('language deck (es→en) completes with the same module, zero code changes', () => {
    const deck = parseTopic(FIXTURE_B).cards;
    expect(deck.map((card) => card.id)).toEqual(['dog', 'house', 'apple']);
    expect(playDeck(deck).every(Boolean)).toBe(true);
  });
});

describe('image sources per deck (AC-9)', () => {
  it('asset (generated SVG), emoji, URL and fallback all render', () => {
    const asset = mount(
      <CardImage
        card={{ id: 'scope', front: 'scope léxico', image: { kind: 'asset', value: 'funciones-programacion/que-es-el-scope-lexico.svg' } }}
      />
    );
    expect(asset.container.querySelector('img').getAttribute('src')).toMatch(/que-es-el-scope-lexico/);

    const [dog, house, book] = parseTopic(FIXTURE_C).cards;
    const emojiView = mount(<CardImage card={dog} />);
    expect(emojiView.container.querySelector('span[role="img"]').textContent).toBe('🐶');

    const urlView = mount(<CardImage card={house} />);
    expect(urlView.container.querySelector('img').getAttribute('alt')).toBe('house');

    const dictView = mount(<CardImage card={book} />);
    expect(dictView.container.querySelector('span[role="img"]').textContent).toBe('📚');

    const fallbackView = mount(<CardImage card={{ id: 'zzz', front: 'misterio absoluto zzz' }} />);
    expect(fallbackView.container.querySelector('canvas[role="img"]')).toBeTruthy();
  });
});
