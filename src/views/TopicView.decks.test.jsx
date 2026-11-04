import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TopicView from './TopicView.jsx';
import GameHost from './GameHost.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { recordArcadeRun } from '../core/storage/arcade.js';
import { click, mount, waitFor } from '../test/render.jsx';

const cardsMd = (count) =>
  `# Tema Mazos\n${Array.from(
    { length: count },
    (_, index) => `- Q: pregunta ${index + 1} | A: respuesta ${index + 1}`
  ).join('\n')}`;

const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const chip = (container, status) =>
  container.querySelector(`.deck-overview__chip[data-status="${status}"]`);

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  vi.restoreAllMocks();
});

describe('TopicView deck overview (spec-18 T14)', () => {
  it('summarizes mastery, shows the best record per game and links to games', () => {
    const { topic } = saveCustomTopic({ title: 'Tema Mazos', md: cardsMd(21) });
    const future = Date.now() + 86_400_000;
    const srs = {};
    for (const card of topic.cards.slice(0, 10)) {
      srs[card.id] = { reps: 3, nextReview: future };
    }
    for (const card of topic.cards.slice(10, 20)) {
      srs[card.id] = { reps: 1, nextReview: future };
    }
    localStorage.setItem('sepect.srs.v1', JSON.stringify({ [topic.id]: srs }));
    recordArcadeRun({
      topicId: topic.id,
      gameId: 'flashcards',
      deckId: 'deck-1',
      score: 540,
      correct: 10,
      wrong: 0,
      lives: 3,
      completed: true,
    });

    const { container } = mount(<TopicView topicId={topic.id} />);

    expect(chip(container, 'no-aprendida').textContent).toContain('1');
    expect(chip(container, 'repasar').textContent).toContain('1');
    expect(chip(container, 'aprendida').textContent).toContain('1');
    expect(container.querySelectorAll('.deck-overview__deck')).toHaveLength(3);
    expect(container.textContent).toContain('Ver detalle de los 3 mazos');
    expect(container.querySelector('[role="group"][aria-label="Elige tu mazo"]')).toBeNull();

    const record = container.querySelector('.deck-overview__record');
    expect(record.textContent).toContain('Flashcards');
    expect(record.textContent).toContain('540 puntos');
    expect(record.textContent).toContain('Mazo 1');
    expect(record.getAttribute('href')).toBe(`#/tema/${topic.id}/juego/flashcards`);
  });

  it('reflects a real deck session: perfect → Repasar, fail → No aprendida', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const md = `# Tema Integración
- Q: uno | A: one
- Q: dos | A: two`;
    const { topic } = saveCustomTopic({ title: 'Tema Integración', md });

    const first = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => buttonByText(first.container, 'Empezar mazo'));
    click(buttonByText(first.container, 'Empezar mazo'));
    await waitFor(() => first.container.textContent.includes('Carta 1 de 2'));
    click(first.container.querySelector('.flashcards-card'));
    click(buttonByText(first.container, 'Fácil'));
    click(first.container.querySelector('.flashcards-card'));
    click(buttonByText(first.container, 'Fácil'));
    await waitFor(() => first.container.textContent.includes('Mazo 1 completado'));
    first.unmount();

    const afterPerfect = mount(<TopicView topicId={topic.id} />);
    expect(chip(afterPerfect.container, 'repasar').textContent).toContain('1');
    afterPerfect.unmount();

    const second = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => buttonByText(second.container, 'Repasar mazo'));
    click(buttonByText(second.container, 'Repasar mazo'));
    await waitFor(() => second.container.textContent.includes('Carta 1 de 2'));
    click(second.container.querySelector('.flashcards-card'));
    click(buttonByText(second.container, 'Otra vez'));
    second.unmount();

    const afterFail = mount(<TopicView topicId={topic.id} />);
    expect(chip(afterFail.container, 'no-aprendida').textContent).toContain('1');
    afterFail.unmount();
  });
});
