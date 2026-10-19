import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import GameHost from './GameHost.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { click, mount, waitFor } from '../test/render.jsx';

const FIXTURE_A = `# Tema GameHost
Una función encapsula lógica reutilizable.

- Q: ¿Qué es una función? | A: Bloque reutilizable | E: easy
- Q: ¿Qué es un parámetro? | A: Variable de entrada | E: easy
- Q: ¿Qué es el retorno? | A: Resultado que devuelve | E: hard
- LINEA ROTA`;

const findButton = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('GameHost wiring', () => {
  it('grade → SRS + XP + history persisted; survives reload; exit returns to topic', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema GameHost', md: FIXTURE_A });
    const { container, unmount } = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => container.textContent.includes('Carta 1 de 3'));

    click(container.querySelector('.card-neon'));
    click(findButton(container, 'Fácil'));

    const srs = loadSrs();
    expect(srs[topic.id]['que-es-una-funcion'].reps).toBe(1);

    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.streak).toBeGreaterThanOrEqual(1);
    expect(profile.history).toHaveLength(1);
    expect(profile.history[0]).toMatchObject({
      topicId: topic.id,
      cardId: 'que-es-una-funcion',
      grade: 'facil',
    });

    unmount();
    expect(loadSrs()).toEqual(srs);

    const reloaded = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => reloaded.container.textContent.includes('¿Qué es un parámetro?'));

    click(findButton(reloaded.container, 'Salir'));
    expect(window.location.hash).toBe(`#/tema/${topic.id}`);
  });

  it('unknown game → fallback screen with link home, unknown topic → 404', () => {
    const { topic } = saveCustomTopic({ title: 'Tema GameHost', md: FIXTURE_A });
    const badGame = mount(<GameHost topicId={topic.id} gameId="nope" />);
    expect(badGame.container.textContent).toContain('Juego no disponible');
    expect(badGame.container.querySelector('a[href="#/"]')).toBeTruthy();

    const badTopic = mount(<GameHost topicId="no-existe" gameId="flashcards" />);
    expect(badTopic.container.textContent).toContain('404');
  });

  it('XP follows the grade (facil=+10, dificil=+25, otra-vez=0), not card difficulty', async () => {
    const md = `# Tema XP
- Q: aaa | A: uno | E: easy
- Q: bbb | A: dos | E: hard
- Q: ccc | A: tres | E: easy`;
    const { topic } = saveCustomTopic({ title: 'Tema XP', md });
    const { container } = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => container.textContent.includes('Carta 1 de 3'));

    click(container.querySelector('.card-neon'));
    click(findButton(container, 'Difícil'));
    expect(createStore().load().xp).toBe(25);

    click(container.querySelector('.card-neon'));
    click(findButton(container, 'Fácil'));
    expect(createStore().load().xp).toBe(35);

    click(container.querySelector('.card-neon'));
    click(findButton(container, 'Otra vez'));
    expect(createStore().load().xp).toBe(35);
  });

  it('topic UI image override reaches gameplay (AC-9 tier-1)', async () => {
    const md = `# Tema Override
- Q: dog | A: perro
- Q: house | A: casa`;
    const { topic } = saveCustomTopic({
      title: 'Tema Override',
      md,
      images: { dog: { kind: 'emoji', value: '🦴' } },
    });
    const { container } = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => container.textContent.includes('Carta 1 de 2'));
    expect(container.querySelector('span[role="img"]').textContent).toBe('🦴');
  });

  it('memorama receives selectCards with unlearned-first selection (AC-3)', async () => {
    const md = `# Tema Seleccion
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four
- Q: cinco | A: five
- Q: seis | A: six`;
    const { topic } = saveCustomTopic({ title: 'Tema Seleccion', md });
    const now = Date.now();
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({
        [topic.id]: {
          uno: { reps: 3, nextReview: now },
          dos: { reps: 4, nextReview: now },
          tres: { reps: 1, nextReview: now + 1_000_000 },
          cuatro: { reps: 1, nextReview: now + 1_000_000 },
          cinco: { reps: 1, nextReview: now + 1_000_000 },
        },
      })
    );

    const { container } = mount(<GameHost topicId={topic.id} gameId="memorama" />);
    await waitFor(() => container.textContent.includes('Memorama'));
    click(findButton(container, 'Fácil · 4 parejas'));

    const ids = new Set(
      [...container.querySelectorAll('.memorama-tile')].map((tile) => tile.dataset.cardId)
    );
    expect(ids).toEqual(new Set(['tres', 'cuatro', 'cinco', 'seis']));
    expect(ids.has('uno')).toBe(false);
    expect(ids.has('dos')).toBe(false);
  });

  it('memorama grading persists SRS + XP + history via the existing onGrade path', async () => {
    const md = `# Tema Memorama
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four`;
    const { topic } = saveCustomTopic({ title: 'Tema Memorama', md });
    const { container } = mount(<GameHost topicId={topic.id} gameId="memorama" />);
    await waitFor(() => container.textContent.includes('Memorama'));
    click(findButton(container, 'Fácil · 4 parejas'));

    const front = container.querySelector('.memorama-tile[data-face="front"]');
    const cardId = front.dataset.cardId;
    const back = container.querySelector(
      `.memorama-tile[data-card-id="${cardId}"][data-face="back"]`
    );
    click(front);
    click(back);

    await waitFor(() => loadSrs()[topic.id] && loadSrs()[topic.id][cardId]);
    expect(loadSrs()[topic.id][cardId].reps).toBe(1);

    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.history).toHaveLength(1);
    expect(profile.history[0]).toMatchObject({ topicId: topic.id, cardId, grade: 'facil' });
  });

  it('memorama exit grades unmatched cards as otra-vez and persists them (AC-6)', async () => {
    const md = `# Tema Sin Parejas
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four`;
    const { topic } = saveCustomTopic({ title: 'Tema Sin Parejas', md });
    const { container } = mount(<GameHost topicId={topic.id} gameId="memorama" />);
    await waitFor(() => container.textContent.includes('Memorama'));
    click(findButton(container, 'Fácil · 4 parejas'));

    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded).sort()).toEqual(['cuatro', 'dos', 'tres', 'uno']);
    expect(Object.values(graded).every((entry) => entry.reps === 0)).toBe(true);

    const profile = createStore().load();
    expect(profile.xp).toBe(0);
    expect(profile.history).toHaveLength(4);
    expect(profile.history.every((entry) => entry.grade === 'otra-vez')).toBe(true);
  });
});
