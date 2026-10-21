import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { listGames } from './registry.js';
import { parseTopic } from '../core/parser/parser.js';
import { mount } from '../test/render.jsx';

const DECK_A = `# Programación
- Q: variable | A: contenedor con un valor
- Q: función | A: bloque reutilizable de código
- Q: bucle | A: repite instrucciones varias veces
- Q: array | A: colección ordenada de elementos
- Q: objeto | A: par clave–valor agrupado
- Q: módulo | A: archivo con lógica exportada`;

const DECK_B = `# Inglés básico
- Q: dog | A: perro
- Q: house | A: casa
- Q: apple | A: manzana
- Q: book | A: libro
- Q: water | A: agua
- Q: fire | A: fuego`;

const PROGRAMMING = parseTopic(DECK_A).cards;
const LANGUAGES = parseTopic(DECK_B).cards;

const GROUPS = [
  { id: 'programacion', title: 'Programación', cards: PROGRAMMING },
  { id: 'idiomas', title: 'Idiomas', cards: LANGUAGES },
];

afterEach(() => {
  document.body.innerHTML = '';
});

function propsFor(game, deck) {
  const props = {
    deck,
    selectCards: (count) => deck.slice(0, count),
    onGrade: () => ({ gained: 10, total: 10 }),
    onExit: () => {},
  };
  if (game.id === 'intruso') {
    props.groups = GROUPS;
    props.anchorTopicId = 'programacion';
  }
  return props;
}

async function loadComponent(game) {
  const module = await game.load();
  const Component = module.default;
  expect(typeof Component).toBe('function');
  return Component;
}

async function mountGame(game, deck) {
  const Component = await loadComponent(game);
  return mount(<Component {...propsFor(game, deck)} />);
}

describe('game reuse matrix — 8 games × 2 topic decks (AC-29)', () => {
  it('every game reaches its setup or game screen with the programming deck', async () => {
    expect(PROGRAMMING).toHaveLength(6);
    for (const game of listGames()) {
      const view = await mountGame(game, PROGRAMMING);
      const heading = view.container.querySelector('h1');
      expect(heading, `${game.id}: sin pantalla inicial`).toBeTruthy();
      expect(heading.textContent).toContain(game.title);
      view.unmount();
    }
  });

  it('every game reaches its setup or game screen with the languages deck', async () => {
    expect(LANGUAGES).toHaveLength(6);
    for (const game of listGames()) {
      const view = await mountGame(game, LANGUAGES);
      const heading = view.container.querySelector('h1');
      expect(heading, `${game.id}: sin pantalla inicial`).toBeTruthy();
      expect(heading.textContent).toContain(game.title);
      view.unmount();
    }
  });

  it('flashcards renders deck-driven content for both decks (no topic hardcoding)', async () => {
    const game = listGames().find((entry) => entry.id === 'flashcards');
    for (const deck of [PROGRAMMING, LANGUAGES]) {
      const view = await mountGame(game, deck);
      expect(view.container.textContent).toContain('Carta 1 de 6');
      expect(view.container.textContent).toContain(deck[0].front);
      view.unmount();
    }
  });

  it('intruso reads group titles from props, never from code', async () => {
    const game = listGames().find((entry) => entry.id === 'intruso');
    const view = await mountGame(game, PROGRAMMING);
    expect(view.container.textContent).toContain('Tema ancla:');
    expect(view.container.textContent).toContain('Programación');
    expect(view.container.textContent).toContain('1 tema disponible como intruso');
    view.unmount();

    const Intruso = await loadComponent(game);
    const single = mount(
      <Intruso
        deck={LANGUAGES}
        groups={[
          { id: 'idiomas', title: 'Idiomas', cards: LANGUAGES },
          { id: 'programacion', title: 'Programación', cards: PROGRAMMING },
        ]}
        anchorTopicId="idiomas"
        selectCards={(count) => LANGUAGES.slice(0, count)}
        onGrade={() => ({ gained: 10, total: 10 })}
        onExit={() => {}}
      />
    );
    expect(single.container.textContent).toContain('Idiomas');
    single.unmount();
  });
});

describe('no hardcoded topic text in game sources (AC-29/AC-20)', () => {
  it('src/games/** never mentions topic titles like «Funciones»', () => {
    const root = path.join(process.cwd(), 'src/games');
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(js|jsx)$/.test(entry.name) || entry.name.includes('.test.')) continue;
        const source = fs.readFileSync(full, 'utf8');
        if (/Funciones|Programación|Inglés/.test(source)) offenders.push(full);
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
