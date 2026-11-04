import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ARCADE_KEY,
  loadArcadeRecords,
  recordArcadeRun,
  saveArcadeRecords,
} from './arcade.js';
import {
  EXERCISES_KEY,
  loadExerciseProgress,
  recordExerciseResult,
  saveExerciseProgress,
} from './exercises.js';
import { createStore } from './store.js';
import { loadSettings, saveSettings } from './settings.js';
import { applyGrade, loadSrs, saveSrs } from '../repetition/srs.js';
import { loadCatalog, saveCustomTopic } from '../content/catalog.js';
import { hasSource } from '../content/sources.js';

const TOPIC_ID = 'funciones-en-programacion';
const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const CUSTOM_MD = `# Mi rutina
Rutina personal para practicar cada mañana.

- Q: ¿Qué hago al despertar? | A: Estirar cinco minutos | E: easy
- Q: ¿Qué bebo antes de estudiar? | A: Un vaso de agua | E: easy`;

function snapshot() {
  return Object.keys(localStorage)
    .sort()
    .map((key) => [key, localStorage.getItem(key)]);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('compatibilidad de storage (spec-23 T2, AC-4)', () => {
  it('añadir ejercicios no altera SRS, perfil, ajustes ni arcade', () => {
    createStore().save({
      xp: 75,
      streak: 3,
      lastDay: '2026-10-31',
      history: [{ topicId: TOPIC_ID, cardId: 'c1', grade: 'facil', at: '2026-10-31T09:00:00.000Z' }],
    });
    saveSrs(applyGrade({}, TOPIC_ID, 'c1', 'facil', NOW));
    saveSettings({ muted: true });
    recordArcadeRun(
      {
        topicId: TOPIC_ID,
        gameId: 'flashcards',
        deckId: 'deck-1',
        score: 300,
        correct: 3,
        wrong: 0,
        lives: 2,
        completed: true,
        at: '2026-10-31T09:10:00.000Z',
      },
      localStorage
    );

    const before = snapshot();
    const result = recordExerciseResult(
      { topicId: TOPIC_ID, deckNumber: 1, exerciseId: 'ex1', correct: true },
      localStorage,
      NOW
    );
    const after = snapshot();

    expect(result.ok).toBe(true);
    expect(after.filter(([key]) => key !== EXERCISES_KEY)).toEqual(before);
    expect(after.map(([key]) => key)).toEqual([
      'sepect.arcade.v1',
      EXERCISES_KEY,
      'sepect.profile.v1',
      'sepect.settings.v1',
      'sepect.srs.v1',
    ]);
    expect(createStore().load()).toMatchObject({ xp: 75, streak: 3 });
    expect(loadSrs()).toEqual(
      JSON.parse(before.find(([key]) => key === 'sepect.srs.v1')[1])
    );
    expect(loadSettings()).toEqual({ muted: true });
    expect(loadArcadeRecords()).toEqual(
      JSON.parse(before.find(([key]) => key === ARCADE_KEY)[1])
    );
    expect(loadExerciseProgress()).toEqual(result.progress);
    expect(Object.keys(loadSrs()[TOPIC_ID])).toEqual(['c1']);
  });

  it('actualiza datos antiguos sin perder progreso', () => {
    localStorage.setItem('sepect.profile.v1', JSON.stringify({ xp: 40 }));
    localStorage.setItem('sepect.settings.v1', JSON.stringify({ muted: 'yes' }));
    localStorage.setItem(
      ARCADE_KEY,
      JSON.stringify({ [`${TOPIC_ID}:flashcards:deck-1`]: { best: 210 } })
    );
    localStorage.setItem(
      EXERCISES_KEY,
      JSON.stringify({
        [TOPIC_ID]: { '1': { ex1: { attempts: 1, correct: 1 } } },
      })
    );
    localStorage.setItem('sepect.srs.v1', JSON.stringify(applyGrade({}, TOPIC_ID, 'c1', 'facil', NOW)));
    const saved = saveCustomTopic({ title: 'Mi rutina', md: CUSTOM_MD });

    expect(saved.ok).toBe(true);
    expect(createStore().load()).toMatchObject({ xp: 40, streak: 0, history: [] });
    expect(loadSettings()).toEqual({ muted: true });
    expect(loadArcadeRecords()[`${TOPIC_ID}:flashcards:deck-1`]).toMatchObject({
      best: 210,
      runs: [],
    });
    expect(loadExerciseProgress()[TOPIC_ID]['1'].ex1).toMatchObject({
      attempts: 1,
      correct: 1,
      done: true,
    });
    expect(Object.keys(loadSrs()[TOPIC_ID])).toEqual(['c1']);

    const custom = loadCatalog().find((topic) => topic.id === 'mi-rutina');
    expect(custom).toMatchObject({
      source: 'custom',
      categoryId: 'personalizados',
      moduleId: null,
      sourcePath: null,
    });
    expect(hasSource(custom.sourcePath)).toBe(false);
  });

  it('storage corrupto devuelve valores seguros y la app sigue usable', () => {
    for (const key of [
      'sepect.profile.v1',
      'sepect.srs.v1',
      'sepect.settings.v1',
      ARCADE_KEY,
      EXERCISES_KEY,
      'sepect.topics.custom.v1',
    ]) {
      localStorage.setItem(key, '{roto');
    }
    expect(createStore().load()).toEqual({ xp: 0, streak: 0, lastDay: null, history: [] });
    expect(loadSrs()).toEqual({});
    expect(loadSettings()).toEqual({ muted: false });
    expect(loadArcadeRecords()).toEqual({});
    expect(loadExerciseProgress()).toEqual({});
    expect(() => loadCatalog()).not.toThrow();
  });

  it('cuota llena no rompe las escrituras y avisa una sola vez por capa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(createStore().save({ xp: 1, history: [] })).toMatchObject({ ok: false });
    expect(saveSrs({})).toMatchObject({ ok: false });
    expect(saveExerciseProgress({})).toMatchObject({ ok: false });
    expect(saveArcadeRecords({})).toMatchObject({ ok: false });
    expect(saveSettings({ muted: true })).toMatchObject({ ok: false });
    expect(warn).toHaveBeenCalled();

    setItem.mockRestore();
    expect(saveSettings({ muted: false }).ok).toBe(true);
  });
});
