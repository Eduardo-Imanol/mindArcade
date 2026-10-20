import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GameHost from './GameHost.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { click, fire, mount, waitFor } from '../test/render.jsx';

const FIXTURE_A = `# Tema GameHost
Una función encapsula lógica reutilizable.

- Q: ¿Qué es una función? | A: Bloque reutilizable | E: easy
- Q: ¿Qué es un parámetro? | A: Variable de entrada | E: easy
- Q: ¿Qué es el retorno? | A: Resultado que devuelve | E: hard
- LINEA ROTA`;

const AHORCADO_MD = `# Tema Ahorcado
- Q: gato | A: felino doméstico
- Q: perro | A: mejor amigo
- Q: luna | A: satélite natural
- Q: sol | A: estrella del sistema solar
- Q: mar | A: masa de agua salada
- Q: flor | A: parte de la planta`;

const AHORCADO_GRADES_MD = `# Tema Ahorcado Grades
- Q: gato | A: felino doméstico
- Q: perro | A: mejor amigo
- Q: luna | A: satélite natural`;

const AHORCADO_BACK_TO_CARD = {
  'felino doméstico': { id: 'gato', front: 'GATO' },
  'mejor amigo': { id: 'perro', front: 'PERRO' },
  'satélite natural': { id: 'luna', front: 'LUNA' },
  'estrella del sistema solar': { id: 'sol', front: 'SOL' },
  'masa de agua salada': { id: 'mar', front: 'MAR' },
  'parte de la planta': { id: 'flor', front: 'FLOR' },
};

const AHORCADO_LETTERS = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];
const AHORCADO_MISTAKES = { gato: 0, perro: 2, luna: 6, sol: 0, mar: 2, flor: 6 };
const AHORCADO_XP = { facil: 10, dificil: 25, 'otra-vez': 0 };

const QUIZ_MD = `# Tema Quiz
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four`;
const QUIZ_BACK = { uno: 'one', dos: 'two', tres: 'three', cuatro: 'four' };

const findButton = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

const startAhorcado = (container, rounds) => {
  const select = container.querySelector('#ahorcado-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  click(findButton(container, 'Empezar'));
};

const currentAhorcadoCard = (container) => {
  const hint = container.querySelector('.ahorcado-hint__text').textContent;
  return AHORCADO_BACK_TO_CARD[hint];
};

const guessLetter = (container, letter) => {
  const button = [...container.querySelectorAll('.ahorcado-key')].find(
    (candidate) => candidate.textContent === letter
  );
  click(button);
};

const solveAhorcadoRound = (container, mistakes) => {
  const card = currentAhorcadoCard(container);
  const wrong = AHORCADO_LETTERS.filter((letter) => !card.front.includes(letter));
  for (const letter of wrong.slice(0, mistakes)) guessLetter(container, letter);
  if (mistakes >= 6) return card;
  for (const letter of [...new Set(card.front)]) guessLetter(container, letter);
  return card;
};

const startQuiz = (container, rounds) => {
  const select = container.querySelector('#quiz-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  click(findButton(container, 'Empezar'));
};

const quizOptions = (container) => [...container.querySelectorAll('.quiz-option')];
const quizFront = (container) => container.querySelector('.quiz-question__text').textContent;
const quizCorrect = (container) =>
  quizOptions(container).find((button) =>
    button.getAttribute('aria-label').endsWith(`: ${QUIZ_BACK[quizFront(container)]}`)
  );
const quizWrong = (container) => {
  const correct = quizCorrect(container);
  return quizOptions(container).filter((button) => button !== correct && !button.disabled);
};

const INTRUSO_ANCHOR_ID = 'funciones-en-programacion';
const INTRUSO_OTHER_MD = `# Tema Intruso
- Q: alfa | A: significado alfa
- Q: beta | A: significado beta
- Q: gamma | A: significado gamma
- Q: delta | A: significado delta`;
const INTRUSO_OTHER_BACKS = [
  'significado alfa',
  'significado beta',
  'significado gamma',
  'significado delta',
];

const startIntruso = (container, rounds) => {
  const select = container.querySelector('#intruso-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  click(findButton(container, 'Empezar'));
};

const intrusoOptions = (container) => [...container.querySelectorAll('.intruso-option')];
const intrusoBack = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const intrusoIntruderOption = (container) =>
  intrusoOptions(container).find((button) => INTRUSO_OTHER_BACKS.includes(intrusoBack(button)));
const intrusoBaseOption = (container) =>
  intrusoOptions(container).find((button) => !INTRUSO_OTHER_BACKS.includes(intrusoBack(button)));

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  vi.restoreAllMocks();
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

  it('ahorcado receives selectCards with unlearned-first selection (AC-3)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Ahorcado', md: AHORCADO_MD });
    const now = Date.now();
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({ [topic.id]: { sol: { reps: 3, nextReview: now + 1_000 } } })
    );
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { container } = mount(<GameHost topicId={topic.id} gameId="ahorcado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startAhorcado(container, 3);
    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded).sort()).toEqual(['luna', 'mar', 'perro', 'sol']);
    expect(graded.luna.reps).toBe(0);
    expect(graded.mar.reps).toBe(0);
    expect(graded.perro.reps).toBe(0);
    expect(graded.sol).toEqual({ reps: 3, nextReview: now + 1_000 });
    expect(graded.gato).toBeUndefined();
    expect(graded.flor).toBeUndefined();

    const profile = createStore().load();
    expect(profile.xp).toBe(0);
    expect(profile.history.map((entry) => entry.cardId).sort()).toEqual(['luna', 'mar', 'perro']);
    expect(profile.history.every((entry) => entry.grade === 'otra-vez')).toBe(true);
  });

  it('ahorcado grades facil/dificil/otra-vez and persists SRS + XP + history across reload (AC-9)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Ahorcado Grades', md: AHORCADO_GRADES_MD });
    const { container, unmount } = mount(<GameHost topicId={topic.id} gameId="ahorcado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startAhorcado(container, 3);

    const played = [];
    for (let round = 0; round < 3; round += 1) {
      const card = currentAhorcadoCard(container);
      const mistakes = AHORCADO_MISTAKES[card.id];
      solveAhorcadoRound(container, mistakes);
      const grade = mistakes >= 6 ? 'otra-vez' : mistakes <= 1 ? 'facil' : 'dificil';
      played.push({ ...card, grade, mistakes });
      click(findButton(container, round === 2 ? 'Ver resumen' : 'Siguiente ronda'));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect([...played].map((card) => card.grade).sort()).toEqual(['dificil', 'facil', 'otra-vez']);
    const expectedXp = played.reduce((sum, card) => sum + AHORCADO_XP[card.grade], 0);
    const srsBefore = loadSrs();
    const profileBefore = createStore().load();

    expect(profileBefore.xp).toBe(expectedXp);
    expect(profileBefore.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual(
      played.map(({ id, grade }) => ({ cardId: id, grade }))
    );
    for (const card of played) {
      expect(srsBefore[topic.id][card.id]).toMatchObject({
        reps: card.grade === 'otra-vez' ? 0 : 1,
        interval: 1,
        ease: card.grade === 'facil' ? 2.65 : card.grade === 'dificil' ? 2.35 : 2.3,
      });
    }

    unmount();
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);

    const reloaded = mount(<GameHost topicId={topic.id} gameId="ahorcado" />);
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);
  });

  it('ahorcado exit mid-session grades unresolved rounds as otra-vez (AC-10)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Ahorcado', md: AHORCADO_MD });
    const { container } = mount(<GameHost topicId={topic.id} gameId="ahorcado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startAhorcado(container, 4);

    const card = solveAhorcadoRound(container, 0);
    expect(findButton(container, 'Siguiente ronda')).toBeTruthy();
    click(findButton(container, 'Salir'));
    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(graded[card.id].reps).toBe(1);
    const pending = Object.keys(graded).filter((cardId) => cardId !== card.id);
    expect(pending).toHaveLength(3);
    expect(pending.every((cardId) => graded[cardId].reps === 0)).toBe(true);

    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.history).toHaveLength(4);
    expect(profile.history[0]).toMatchObject({ cardId: card.id, grade: 'facil' });
    expect(
      profile.history.slice(1).every((entry) => entry.grade === 'otra-vez')
    ).toBe(true);
  });

  it('quiz-significado receives selectCards with unlearned-first selection (AC-3)', async () => {
    const md = `# Tema Seleccion Quiz
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four
- Q: cinco | A: five
- Q: seis | A: six`;
    const { topic } = saveCustomTopic({ title: 'Tema Seleccion Quiz', md });
    const now = Date.now();
    const learned = {
      uno: { reps: 3, nextReview: now },
      dos: { reps: 4, nextReview: now },
    };
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({
        [topic.id]: {
          ...learned,
          tres: { reps: 1, nextReview: now + 1_000_000 },
          cuatro: { reps: 1, nextReview: now + 1_000_000 },
          cinco: { reps: 1, nextReview: now + 1_000_000 },
        },
      })
    );
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { container } = mount(<GameHost topicId={topic.id} gameId="quiz-significado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startQuiz(container, 3);
    click(findButton(container, 'Salir'));

    const profile = createStore().load();
    expect(profile.xp).toBe(0);
    expect(profile.history).toHaveLength(3);
    expect(profile.history.every((entry) => entry.grade === 'otra-vez')).toBe(true);
    const selectedIds = profile.history.map(({ cardId }) => cardId);
    expect(new Set(selectedIds).size).toBe(3);
    expect(selectedIds.every((cardId) => ['tres', 'cuatro', 'cinco', 'seis'].includes(cardId))).toBe(
      true
    );

    const graded = loadSrs()[topic.id];
    expect(graded.uno).toEqual(learned.uno);
    expect(graded.dos).toEqual(learned.dos);
    for (const cardId of selectedIds) expect(graded[cardId].reps).toBe(0);
  });

  it('quiz-significado grades facil/dificil/otra-vez and persists SRS + XP + history across reload', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Quiz', md: QUIZ_MD });
    const { container, unmount } = mount(<GameHost topicId={topic.id} gameId="quiz-significado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startQuiz(container, 3);

    const played = [];
    for (let round = 0; round < 3; round += 1) {
      const id = quizFront(container);
      if (round === 0) {
        click(quizCorrect(container));
        played.push({ id, grade: 'facil' });
      } else if (round === 1) {
        click(quizWrong(container)[0]);
        click(quizCorrect(container));
        played.push({ id, grade: 'dificil' });
      } else {
        click(quizWrong(container)[0]);
        click(quizWrong(container)[0]);
        played.push({ id, grade: 'otra-vez' });
      }
      click(findButton(container, round === 2 ? 'Ver resumen' : 'Siguiente'));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('+35 XP');
    expect([...played].map((card) => card.grade).sort()).toEqual([
      'dificil',
      'facil',
      'otra-vez',
    ]);

    const srsBefore = loadSrs();
    const profileBefore = createStore().load();
    expect(profileBefore.xp).toBe(35);
    expect(profileBefore.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual(
      played.map(({ id, grade }) => ({ cardId: id, grade }))
    );
    for (const card of played) {
      expect(srsBefore[topic.id][card.id]).toMatchObject({
        reps: card.grade === 'otra-vez' ? 0 : 1,
        interval: 1,
        ease: card.grade === 'facil' ? 2.65 : card.grade === 'dificil' ? 2.35 : 2.3,
      });
    }

    unmount();
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);

    const reloaded = mount(<GameHost topicId={topic.id} gameId="quiz-significado" />);
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);
  });

  it('quiz-significado exit mid-session persists pending otra-vez without re-emitting resolved rounds', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Quiz', md: QUIZ_MD });
    const { container } = mount(<GameHost topicId={topic.id} gameId="quiz-significado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startQuiz(container, 3);

    click(quizCorrect(container));
    click(findButton(container, 'Siguiente'));
    const resolved = loadSrs()[topic.id];
    const resolvedIds = Object.keys(resolved);
    expect(resolvedIds).toHaveLength(1);
    expect(resolved[resolvedIds[0]].reps).toBe(1);

    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded)).toHaveLength(3);
    expect(graded[resolvedIds[0]].reps).toBe(1);
    const pending = Object.keys(graded).filter((cardId) => cardId !== resolvedIds[0]);
    expect(pending).toHaveLength(2);
    expect(pending.every((cardId) => graded[cardId].reps === 0)).toBe(true);

    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.history).toHaveLength(3);
    expect(profile.history[0]).toMatchObject({ cardId: resolvedIds[0], grade: 'facil' });
    expect(profile.history.slice(1).every((entry) => entry.grade === 'otra-vez')).toBe(true);
  });

  it('intruso receives the anchor plus eligible topics with image overrides', async () => {
    saveCustomTopic({
      title: 'Tema Intruso',
      md: INTRUSO_OTHER_MD,
      images: {
        alfa: { kind: 'emoji', value: '🦴' },
        beta: { kind: 'emoji', value: '🦴' },
        gamma: { kind: 'emoji', value: '🦴' },
        delta: { kind: 'emoji', value: '🦴' },
      },
    });

    const { container } = mount(<GameHost topicId={INTRUSO_ANCHOR_ID} gameId="intruso" />);
    await waitFor(() => findButton(container, 'Empezar'));
    expect(container.textContent).toContain('Tema ancla:');
    expect(container.textContent).toContain('Funciones en Programación');
    expect(container.textContent).toContain('1 tema disponible como intruso');

    startIntruso(container, 3);
    expect(container.textContent).toContain(
      '¿Cuál no pertenece al tema «Funciones en Programación»?'
    );
    expect(intrusoOptions(container)).toHaveLength(4);
    expect(intrusoBaseOption(container)).toBeTruthy();
    expect(intrusoIntruderOption(container).textContent).toContain('🦴');
  });

  it('intruso grades facil/otra-vez under the intruder topic and persists across reload', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Intruso', md: INTRUSO_OTHER_MD });
    const { container, unmount } = mount(
      <GameHost topicId={INTRUSO_ANCHOR_ID} gameId="intruso" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startIntruso(container, 3);

    const played = [];
    for (let round = 0; round < 3; round += 1) {
      const intruder = intrusoIntruderOption(container);
      const back = intrusoBack(intruder);
      const card = topic.cards.find((entry) => entry.back === back);
      if (round === 1) {
        click(intrusoBaseOption(container));
        played.push({ id: card.id, grade: 'otra-vez' });
      } else {
        click(intruder);
        played.push({ id: card.id, grade: 'facil' });
      }
      click(findButton(container, round === 2 ? 'Ver resumen' : 'Siguiente'));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('2 de 3 aciertos · 1 fallos · +20 XP');

    const srsBefore = loadSrs();
    const profileBefore = createStore().load();
    expect(profileBefore.xp).toBe(20);
    expect(profileBefore.history).toHaveLength(3);
    expect(
      profileBefore.history.map(({ topicId, cardId, grade }) => ({ topicId, cardId, grade }))
    ).toEqual(
      played.map(({ id, grade }) => ({ topicId: topic.id, cardId: id, grade }))
    );
    expect(new Set(played.map(({ id }) => id)).size).toBe(3);
    for (const card of played) {
      expect(srsBefore[topic.id][card.id]).toMatchObject({
        reps: card.grade === 'otra-vez' ? 0 : 1,
      });
    }
    expect(srsBefore[INTRUSO_ANCHOR_ID]).toBeUndefined();

    unmount();
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);

    const reloaded = mount(<GameHost topicId={INTRUSO_ANCHOR_ID} gameId="intruso" />);
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);
  });

  it('intruso exit mid-round grades only the current intruder as otra-vez', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Intruso', md: INTRUSO_OTHER_MD });
    const { container } = mount(<GameHost topicId={INTRUSO_ANCHOR_ID} gameId="intruso" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startIntruso(container, 3);

    const resolvedIntruder = intrusoIntruderOption(container);
    const resolvedCard = topic.cards.find(
      (entry) => entry.back === intrusoBack(resolvedIntruder)
    );
    click(resolvedIntruder);
    click(findButton(container, 'Siguiente'));
    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded)).toHaveLength(2);
    expect(graded[resolvedCard.id].reps).toBe(1);
    const pending = Object.keys(graded).filter((cardId) => cardId !== resolvedCard.id);
    expect(pending).toHaveLength(1);
    expect(graded[pending[0]].reps).toBe(0);

    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.history).toHaveLength(2);
    expect(profile.history[0]).toMatchObject({
      topicId: topic.id,
      cardId: resolvedCard.id,
      grade: 'facil',
    });
    expect(profile.history[1]).toMatchObject({
      topicId: topic.id,
      cardId: pending[0],
      grade: 'otra-vez',
    });
  });

  it('intruso direct URL below minCards shows the safe gate without loading the game', () => {
    const md = `# Tema Corto
- Q: uno | A: one
- Q: dos | A: two`;
    const { topic } = saveCustomTopic({ title: 'Tema Corto', md });
    const { container } = mount(<GameHost topicId={topic.id} gameId="intruso" />);

    expect(container.textContent).toContain('Juego no disponible');
    expect(container.textContent).toContain('Necesitas al menos 3 cartas');
    expect(container.textContent).not.toContain('Cargando juego');
    expect(container.querySelector(`a[href="#/tema/${topic.id}"]`)).toBeTruthy();
    expect(findButton(container, 'Empezar')).toBeUndefined();
  });
});
