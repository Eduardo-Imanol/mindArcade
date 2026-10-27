import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ props: null, loads: 0 }));

vi.mock('../games/registry.js', () => ({
  getGame: (id) => {
    if (id !== 'fake' && id !== 'big') return null;
    return {
      id,
      title: id,
      status: 'available',
      minCards: id === 'big' ? 6 : 1,
      load: async () => {
        fake.loads += 1;
        return {
          default: (props) => {
            fake.props = props;
            return null;
          },
        };
      },
    };
  },
  listGames: () => [],
}));

import GameHost from './GameHost.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { ARCADE_KEY } from '../core/storage/arcade.js';
import { mount, waitFor } from '../test/render.jsx';

const md = (count) =>
  `# Tema Decks\n${Array.from(
    { length: count },
    (_, index) => `- Q: pregunta ${index + 1} | A: respuesta ${index + 1}`
  ).join('\n')}`;

afterEach(() => {
  fake.props = null;
  fake.loads = 0;
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  vi.restoreAllMocks();
});

describe('GameHost deck wiring', () => {
  it('passes every deck, all groups, best and onArcadeEnd to the game', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Decks', md: md(12) });
    const future = Date.now() + 86_400_000;
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({
        [topic.id]: {
          'pregunta-1': { reps: 3, nextReview: future },
          'pregunta-11': { reps: 1, nextReview: future },
        },
      })
    );

    mount(<GameHost topicId={topic.id} gameId="fake" />);
    await waitFor(() => fake.props);

    expect(fake.props.decks.map((deck) => deck.total)).toEqual([10, 2]);
    expect(fake.props.decks[0].cards.map((card) => card.id)).toEqual(
      topic.cards.slice(0, 10).map((card) => card.id)
    );
    expect(fake.props.decks[0].studied).toBe(1);
    expect(fake.props.decks[1].studied).toBe(1);
    expect(fake.props.decks[0]).toHaveProperty('mastery');
    expect(fake.props.decks[0]).toHaveProperty('counts');
    expect(fake.props.best).toEqual({ 'deck-1': 0, 'deck-2': 0 });
    const allGroup = fake.props.allGroups.find((entry) => entry.id === topic.id);
    expect(allGroup).toMatchObject({ id: topic.id, title: topic.title });
    expect(allGroup.cards).toHaveLength(12);
    const legacyGroup = fake.props.groups.find((entry) => entry.id === topic.id);
    expect(legacyGroup.cards).toHaveLength(
      fake.props.selectCards(topic.cards.length).length
    );
    expect(typeof fake.props.onArcadeEnd).toBe('function');
    expect(typeof fake.props.onGrade).toBe('function');
  });

  it('persists arcade runs, returns the record and never grades from the host', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Decks', md: md(3) });
    mount(<GameHost topicId={topic.id} gameId="fake" />);
    await waitFor(() => fake.props);

    const srsBefore = loadSrs();
    let result;
    act(() => {
      result = fake.props.onArcadeEnd({
        deckId: 'deck-1',
        score: 320,
        correct: 3,
        wrong: 1,
        lives: 1,
        completed: true,
      });
    });
    expect(result).toEqual({ best: 320, isRecord: true });
    expect(JSON.parse(localStorage.getItem(ARCADE_KEY))).toMatchObject({
      [`${topic.id}:fake:deck-1`]: { best: 320 },
    });
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toMatchObject({ xp: 0, history: [] });
    await waitFor(() => fake.props.best['deck-1'] === 320);

    let lower;
    act(() => {
      lower = fake.props.onArcadeEnd({
        deckId: 'deck-1',
        score: 100,
        correct: 1,
        wrong: 0,
        lives: 3,
        completed: false,
      });
    });
    expect(lower).toEqual({ best: 320, isRecord: false });
    await waitFor(() => fake.props.best['deck-1'] === 320);
  });

  it('gates a topic whose decks never reach the game minimum', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Decks', md: md(5) });
    const { container } = mount(<GameHost topicId={topic.id} gameId="big" />);
    expect(container.textContent).toContain('Juego no disponible');
    expect(container.textContent).toContain('Necesitas al menos 6 cartas');
    expect(fake.loads).toBe(0);
  });
});
