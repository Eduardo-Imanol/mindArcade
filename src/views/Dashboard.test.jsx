import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const catalog = vi.hoisted(() => ({ topics: [] }));
vi.mock('../core/content/catalog.js', () => ({
  loadCatalog: () => catalog.topics,
  saveCustomTopic: vi.fn(),
}));

import Dashboard from './Dashboard.jsx';
import { saveSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { parseTopic } from '../core/parser/parser.js';
import { mount } from '../test/render.jsx';

const FIXTURE_A = `# Inglés básico
- Q: dog | A: perro
- Q: house | A: casa
- Q: apple | A: manzana`;

const FIXTURE_B = `# Francés básico
- Q: chien | A: perro
- Q: maison | A: casa
- Q: pomme | A: manzana`;

const topic = (id, title, md) => ({
  id,
  source: 'custom',
  title,
  description: '',
  cards: parseTopic(md).cards,
  errors: [],
  images: {},
  addedAt: '2026-10-01T00:00:00.000Z',
});

const future = () => Date.now() + 86_400_000;

function seedHistory() {
  const store = createStore();
  store.save({
    xp: 120,
    streak: 3,
    lastDay: '2026-10-20',
    history: [
      { topicId: 'ingles-basico', cardId: 'dog', grade: 'facil', xp: 10, at: '2026-10-19T10:00:00.000Z' },
      { topicId: 'ingles-basico', cardId: 'house', grade: 'dificil', xp: 25, at: '2026-10-19T10:05:00.000Z' },
      { topicId: 'ingles-basico', cardId: 'apple', grade: 'otra-vez', xp: 0, at: '2026-10-20T10:00:00.000Z' },
    ],
  });
}

afterEach(() => {
  catalog.topics = [];
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('Dashboard', () => {
  it('empty catalog → empty state with link home (AC-25)', () => {
    catalog.topics = [];
    const { container } = mount(<Dashboard />);
    expect(container.textContent).toContain('Progreso');
    expect(container.textContent).toContain('Aún no hay temas');
    expect(container.querySelector('a[href="#/"]')).toBeTruthy();
  });

  it('renders KPIs from a fixed profile fixture (AC-22)', () => {
    catalog.topics = [topic('ingles-basico', 'Inglés básico', FIXTURE_A)];
    seedHistory();
    const { container } = mount(<Dashboard />);
    expect(container.textContent).toContain('XP total');
    expect(container.textContent).toContain('120');
    expect(container.textContent).toContain('Racha actual');
    expect(container.textContent).toContain('3 días');
    expect(container.textContent).toContain('Días de estudio');
    expect(container.textContent).toContain('Precisión');
    expect(container.textContent).toContain('67%');
    expect(container.textContent).toContain('Cartas aprendidas');
    expect(container.textContent).toContain('Progreso global');
    expect(container.textContent).toContain('Por repasar');
  });

  it('lists topics ordered by pending cards, tie by title (AC-23)', () => {
    catalog.topics = [
      topic('ingles-basico', 'Inglés básico', FIXTURE_A),
      topic('frances-basico', 'Francés básico', FIXTURE_B),
    ];
    saveSrs({
      'ingles-basico': {
        dog: { reps: 3, nextReview: future() },
        house: { reps: 3, nextReview: future() },
        apple: { reps: 3, nextReview: future() },
      },
    });
    const { container } = mount(<Dashboard />);
    const titles = [...container.querySelectorAll('.dash-topic__title')].map((node) => node.textContent);
    expect(titles).toEqual(['Francés básico', 'Inglés básico']);
    const ingles = [...container.querySelectorAll('.dash-topic')].find((item) =>
      item.textContent.includes('Inglés básico')
    );
    expect(ingles.textContent).toContain('3 cartas · 3 aprendidas');
    expect(ingles.textContent).toContain('de estudio');
  });

  it('shows 14-day activity with a textual alternative (AC-24)', () => {
    catalog.topics = [topic('ingles-basico', 'Inglés básico', FIXTURE_A)];
    seedHistory();
    const { container } = mount(<Dashboard />);
    const days = container.querySelectorAll('.dash-activity__day');
    expect(days).toHaveLength(14);
    expect(container.textContent).toContain('Actividad (14 días)');
    const table = container.querySelector('.dash-activity__table table');
    expect(table).toBeTruthy();
    expect(table.querySelectorAll('tbody tr')).toHaveLength(14);
  });

  it('progressbars expose role and aria values (AC-26)', () => {
    catalog.topics = [topic('ingles-basico', 'Inglés básico', FIXTURE_A)];
    const { container } = mount(<Dashboard />);
    const bars = [...container.querySelectorAll('[role="progressbar"]')];
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar.getAttribute('aria-valuemin')).toBe('0');
      expect(bar.getAttribute('aria-valuemax')).toBe('100');
      expect(Number.isFinite(Number(bar.getAttribute('aria-valuenow')))).toBe(true);
    }
  });

  it('never throws with corrupt profile/history/storage (AC-25)', () => {
    catalog.topics = [topic('ingles-basico', 'Inglés básico', FIXTURE_A)];
    localStorage.setItem('sepect.profile.v1', '{not-json');
    localStorage.setItem('sepect.srs.v1', 'corrupt');
    expect(() => mount(<Dashboard />)).not.toThrow();
  });

  it('route #/progreso is wired in App (AC-21)', () => {
    const code = fs.readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8');
    const router = fs.readFileSync(path.join(process.cwd(), 'src/app/router.js'), 'utf8');
    expect(code).toMatch(/route\.view === 'progress'/);
    expect(router).toMatch(/view: 'progress'/);
  });
});

