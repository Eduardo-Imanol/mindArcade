import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ props: null }));

vi.mock('../games/registry.js', async (importOriginal) => {
  const actual = await importOriginal();
  const game = {
    id: 'codigo-test',
    title: 'Código test',
    status: 'available',
    minCards: 1,
    categories: ['programacion'],
    needsExercises: true,
    minExercises: 2,
    load: async () => ({
      default: (props) => {
        fake.props = props;
        return null;
      },
    }),
  };
  return {
    ...actual,
    getGame: (id) => (id === 'codigo-test' ? game : actual.getGame(id)),
  };
});

import GameHost from './GameHost.jsx';
import { mount, waitFor } from '../test/render.jsx';

const TOPIC_ID = 'funciones-en-programacion';

afterEach(() => {
  fake.props = null;
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('GameHost exercise integration (spec-21 T19)', () => {
  it('loads the lazy document, validates the deck and passes exercise props', async () => {
    mount(<GameHost topicId={TOPIC_ID} gameId="codigo-test" />);
    await waitFor(() => fake.props);

    expect(fake.props.exercises).toBeTruthy();
    expect(fake.props.exercises.errors).toEqual([]);
    expect(fake.props.exercises.decks).toHaveLength(10);
    expect(fake.props.exercises.decks[0].exercises).toHaveLength(6);
    expect(fake.props.exerciseProgress).toEqual({});
    expect(typeof fake.props.onExerciseResult).toBe('function');
    expect(fake.props.topic.id).toBe(TOPIC_ID);
    expect(fake.props.deck.length).toBeGreaterThan(0);
    expect(typeof fake.props.onGrade).toBe('function');
    expect(typeof fake.props.onArcadeEnd).toBe('function');
  });

  it('persists exercise results in sepect.exercises.v1 without touching the SRS', async () => {
    mount(<GameHost topicId={TOPIC_ID} gameId="codigo-test" />);
    await waitFor(() => fake.props);

    act(() => {
      fake.props.onExerciseResult({
        topicId: TOPIC_ID,
        deckNumber: 1,
        exerciseId: 'suma-basica',
        correct: true,
      });
    });

    const stored = JSON.parse(localStorage.getItem('sepect.exercises.v1'));
    expect(stored[TOPIC_ID]['1']['suma-basica']).toMatchObject({
      attempts: 1,
      correct: 1,
      done: true,
    });
    expect(localStorage.getItem('sepect.srs.v1')).toBeNull();
    await waitFor(() => fake.props.exerciseProgress?.[TOPIC_ID]?.['1']?.['suma-basica']);
    expect(fake.props.exerciseProgress[TOPIC_ID]['1']['suma-basica'].done).toBe(true);
  });

  it('keeps code games upcoming when the topic has no manifest', () => {
    const { container } = mount(
      <GameHost topicId="estructuras-de-datos" gameId="codigo-test" />
    );

    expect(container.textContent).toContain('Juego no disponible');
    expect(container.textContent).toContain('Próximamente');
    expect(fake.props).toBeNull();
  });
});
