import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import SettingsView from './SettingsView.jsx';
import { loadCatalog } from '../core/content/catalog.js';
import { mount } from '../test/render.jsx';

const TOPIC_ID = 'funciones-en-programacion';
const NOW = Date.now();

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

function seedProgress() {
  const topic = loadCatalog().find((entry) => entry.id === TOPIC_ID);
  const cardId = topic.cards[0].id;
  localStorage.setItem(
    'sepect.srs.v1',
    JSON.stringify({
      [TOPIC_ID]: {
        [cardId]: { interval: 6, ease: 2.5, reps: 3, nextReview: NOW + 86400000 },
      },
    })
  );
  localStorage.setItem(
    'sepect.profile.v1',
    JSON.stringify({
      xp: 120,
      streak: 2,
      lastDay: '2026-10-30',
      history: [
        { topicId: TOPIC_ID, cardId, grade: 'facil', at: '2026-10-30T10:00:00.000Z' },
        { topicId: TOPIC_ID, cardId, grade: 'facil', at: '2026-10-30T10:01:00.000Z' },
      ],
    })
  );
  localStorage.setItem(
    'sepect.exercises.v1',
    JSON.stringify({
      [TOPIC_ID]: {
        '1': {
          ex1: { attempts: 1, correct: 1, done: true },
          ex2: { attempts: 1, correct: 1, done: true },
          ex3: { attempts: 1, correct: 0, done: false },
        },
      },
    })
  );
  localStorage.setItem(
    'sepect.arcade.v1',
    JSON.stringify({
      [`${TOPIC_ID}:flashcards:deck-1`]: {
        best: 300,
        runs: [
          {
            topicId: TOPIC_ID,
            gameId: 'flashcards',
            deckId: 'deck-1',
            score: 300,
            correct: 3,
            wrong: 0,
            lives: 2,
            completed: true,
            at: '2026-10-30T10:02:00.000Z',
          },
          {
            topicId: TOPIC_ID,
            gameId: 'flashcards',
            deckId: 'deck-1',
            score: 200,
            correct: 2,
            wrong: 1,
            lives: 1,
            completed: true,
            at: '2026-10-30T10:03:00.000Z',
          },
        ],
      },
    })
  );
  return topic;
}

describe('SettingsView (spec-23 AC-2)', () => {
  it('resume los datos locales sin escribir storage', () => {
    seedProgress();
    const totalCards = loadCatalog().reduce((total, entry) => total + entry.cards.length, 0);
    const before = Object.keys(localStorage)
      .sort()
      .map((key) => [key, localStorage.getItem(key)]);
    const { container } = mount(<SettingsView />);
    const facts = [...container.querySelectorAll('.settings-fact')].map((row) => [
      row.querySelector('dt').textContent,
      row.querySelector('dd').textContent,
    ]);
    expect(facts).toEqual([
      ['Temas', '4'],
      ['Cartas aprendidas', `1 / ${totalCards}`],
      ['Ejercicios aprendidos', '2'],
      ['Rondas arcade', '2'],
      ['Intentos', '2'],
      ['XP total', '120'],
    ]);
    const after = Object.keys(localStorage)
      .sort()
      .map((key) => [key, localStorage.getItem(key)]);
    expect(after).toEqual(before);
  });

  it('ofrece volver a la biblioteca y al progreso', () => {
    const { container } = mount(<SettingsView />);
    expect(container.querySelector('a[href="#/"]')).toBeTruthy();
    expect(container.querySelector('a[href="#/progreso"]')).toBeTruthy();
    expect(container.querySelector('.settings-title').textContent).toBe('Configuración');
  });

  it('muestra el aviso de voz cuando el navegador no la soporta', () => {
    const { container } = mount(<SettingsView />);
    const status = container.querySelector('.settings-card__note[role="status"]');
    expect(status.textContent).toContain('Este navegador no ofrece voz del sistema');
  });
});
