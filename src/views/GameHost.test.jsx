import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GameHost from './GameHost.jsx';
import { saveCustomTopic, loadCatalog } from '../core/content/catalog.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { click, fire, mount, waitFor } from '../test/render.jsx';
import {
  advanceFeedback,
  eatBack,
  forceSelfCollision,
  lives,
  rafHarness,
  setRounds,
} from '../test/serpiente.js';

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

const SERPIENTE_MD = `# Tema Serpiente
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four
- Q: cinco | A: five
- Q: seis | A: six`;

const serpienteCard = (topic, container) => {
  const front = container.querySelector('.serpiente-prompt__text').textContent;
  return topic.cards.find((card) => card.front === front);
};

const startSerpiente = (container, rounds) => {
  setRounds(container, rounds);
  click(findButton(container, 'Empezar'));
};

const wrongSerpienteBack = (container, correctBack, excluded = []) =>
  [...container.querySelectorAll('.serpiente-legend__text')]
    .map((node) => node.textContent)
    .find((back) => back !== correctBack && !excluded.includes(back));

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

const LLUVIA_MD = `# Tema Lluvia
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four
- Q: cinco | A: five
- Q: seis | A: six`;

const startLluvia = (container, rounds, rhythm) => {
  const select = container.querySelector('#lluvia-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
  if (rhythm) click(findButton(container, rhythm));
  click(findButton(container, 'Empezar'));
};

const lluviaPrompt = (container) => {
  const prompt =
    container.querySelector('.lluvia-radar__text') ||
    container.querySelector('.lluvia-capsule__text');
  return prompt ? prompt.textContent : null;
};
const lluviaOptions = (container) => [...container.querySelectorAll('.lluvia-option')];
const lluviaOptionBack = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const lluviaCard = (topic, container) =>
  topic.cards.find((card) => card.front === lluviaPrompt(container));
const lluviaCorrect = (container, card) =>
  lluviaOptions(container).find((button) => lluviaOptionBack(button) === card.back);
const lluviaWrong = (container, card) =>
  lluviaOptions(container).find((button) => lluviaOptionBack(button) !== card.back);

const CONECTA_MD = `# Tema Conecta
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four`;

const CONECTA_SIX_MD = `# Tema Conecta Seleccion
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four
- Q: cinco | A: five
- Q: seis | A: six`;

const conectaCard = (container, text) =>
  [...container.querySelectorAll('.conecta-card')].find(
    (button) => button.querySelector('.conecta-card__text')?.textContent === text
  );

const conectaQuestions = (container) => [
  ...container.querySelectorAll('section[aria-label="Preguntas"] .conecta-card'),
];

const startConecta = (container, pairs) => {
  const select = container.querySelector('#conecta-pairs');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(pairs));
  fire(select, 'change');
  click(findButton(container, 'Empezar'));
};

const matchConecta = (container, front, back) => {
  click(conectaCard(container, front));
  click(conectaCard(container, back));
};

const intrusoOptions = (container) => [...container.querySelectorAll('.intruso-option')];
const intrusoBack = (button) =>
  (button.getAttribute('aria-label') || '').replace(/^Opción \d+: /, '');
const intrusoIntruderOption = (container) =>
  intrusoOptions(container).find((button) => INTRUSO_OTHER_BACKS.includes(intrusoBack(button)));
const intrusoBaseOption = (container) =>
  intrusoOptions(container).find((button) => !INTRUSO_OTHER_BACKS.includes(intrusoBack(button)));

// El catálogo built-in puede crecer (N temas): se bloquean los built-in distintos
// del ancla para que estos tests dependan solo de los topics que ellos crean.
const lockOtherBuiltinTopics = (keepId) => {
  const srs = JSON.parse(localStorage.getItem('sepect.srs.v1') || '{}');
  const future = Date.now() + 30 * 86_400_000;
  for (const entry of loadCatalog()) {
    if (entry.id === keepId || entry.source !== 'builtin') continue;
    srs[entry.id] = Object.fromEntries(
      entry.cards.map((card) => [card.id, { reps: 3, nextReview: future }])
    );
  }
  localStorage.setItem('sepect.srs.v1', JSON.stringify(srs));
};

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GameHost wiring', () => {
  it('grade → SRS + XP + history persisted; survives reload; exit returns to topic', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const { topic } = saveCustomTopic({ title: 'Tema GameHost', md: FIXTURE_A });
    const { container, unmount } = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => findButton(container, 'Empezar mazo'));
    click(findButton(container, 'Empezar mazo'));
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
      xp: 10,
    });
    expect(typeof profile.history[0].at).toBe('string');

    unmount();
    expect(loadSrs()).toEqual(srs);

    const reloaded = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => findButton(reloaded.container, 'Reanudar mazo'));
    click(findButton(reloaded.container, 'Reanudar mazo'));
    await waitFor(() => reloaded.container.textContent.includes('Carta 1 de'));

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
    await waitFor(() => findButton(container, 'Empezar mazo'));
    click(findButton(container, 'Empezar mazo'));
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
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const md = `# Tema Override
- Q: dog | A: perro
- Q: house | A: casa`;
    const { topic } = saveCustomTopic({
      title: 'Tema Override',
      md,
      images: { dog: { kind: 'emoji', value: '🦴' } },
    });
    const { container } = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => findButton(container, 'Empezar mazo'));
    click(findButton(container, 'Empezar mazo'));
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
    lockOtherBuiltinTopics(INTRUSO_ANCHOR_ID);

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
    lockOtherBuiltinTopics(INTRUSO_ANCHOR_ID);
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
    lockOtherBuiltinTopics(INTRUSO_ANCHOR_ID);
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

  it('lluvia-meteoros loads through GameHost and plays with the shared contract (AC-19)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Lluvia', md: LLUVIA_MD });
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="lluvia-meteoros" />
    );
    await waitFor(() => findButton(container, 'Empezar'));

    startLluvia(container, 3);
    expect(container.textContent).toContain('Meteoro 1 de 3');
    expect(lluviaOptions(container)).toHaveLength(3);

    const card = lluviaCard(topic, container);
    click(lluviaCorrect(container, card));
    expect(loadSrs()[topic.id][card.id].reps).toBe(1);
    expect(createStore().load().history).toHaveLength(1);

    click(findButton(container, 'Salir'));
    expect(window.location.hash).toBe(`#/tema/${topic.id}`);
    unmount();
  });

  it('lluvia-meteoros receives selectCards with unlearned-first selection (AC-19)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Lluvia Seleccion', md: LLUVIA_MD });
    const now = Date.now();
    const learned = {
      uno: { reps: 3, nextReview: now },
      dos: { reps: 4, nextReview: now },
    };
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({ [topic.id]: { ...learned } })
    );
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="lluvia-meteoros" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startLluvia(container, 3);

    const played = [];
    for (let round = 0; round < 3; round += 1) {
      const card = lluviaCard(topic, container);
      played.push(card.id);
      click(lluviaCorrect(container, card));
      click(findButton(container, round === 2 ? 'Ver resumen' : 'Siguiente'));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(played).toEqual(['cuatro', 'cinco', 'seis']);

    const graded = loadSrs()[topic.id];
    expect(graded.uno).toEqual(learned.uno);
    expect(graded.dos).toEqual(learned.dos);
    expect(graded.tres).toBeUndefined();
    for (const cardId of played) expect(graded[cardId].reps).toBe(1);

    const profile = createStore().load();
    expect(profile.xp).toBe(30);
    expect(profile.history.map(({ cardId }) => cardId)).toEqual(played);
    unmount();
  });

  it('lluvia-meteoros grades facil/otra-vez and persists SRS + XP + history across reload (AC-19)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Lluvia Grades', md: LLUVIA_MD });
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="lluvia-meteoros" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startLluvia(container, 3);

    const played = [];
    for (let round = 0; round < 3; round += 1) {
      const card = lluviaCard(topic, container);
      if (round === 1) {
        click(lluviaWrong(container, card));
        played.push({ id: card.id, grade: 'otra-vez' });
      } else {
        click(lluviaCorrect(container, card));
        played.push({ id: card.id, grade: 'facil' });
      }
      click(findButton(container, round === 2 ? 'Ver resumen' : 'Siguiente'));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('2 aciertos');
    expect(container.textContent).toContain('1 fallos');
    expect(container.textContent).toContain('+20 XP');

    const srsBefore = loadSrs();
    const profileBefore = createStore().load();
    expect(profileBefore.xp).toBe(20);
    expect(profileBefore.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual(
      played.map(({ id, grade }) => ({ cardId: id, grade }))
    );
    for (const card of played) {
      expect(srsBefore[topic.id][card.id]).toMatchObject({
        reps: card.grade === 'otra-vez' ? 0 : 1,
        interval: 1,
        ease: card.grade === 'facil' ? 2.65 : 2.3,
      });
    }

    unmount();
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);

    const reloaded = mount(<GameHost topicId={topic.id} gameId="lluvia-meteoros" />);
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);
    reloaded.unmount();
  });

  it('lluvia-meteoros exit mid-meteor grades only the current card as otra-vez (AC-19)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Lluvia Exit', md: LLUVIA_MD });
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="lluvia-meteoros" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startLluvia(container, 3);

    const resolved = lluviaCard(topic, container);
    click(lluviaCorrect(container, resolved));
    click(findButton(container, 'Siguiente'));
    const pending = lluviaCard(topic, container);
    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded).sort()).toEqual([resolved.id, pending.id].sort());
    expect(graded[resolved.id].reps).toBe(1);
    expect(graded[pending.id].reps).toBe(0);

    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.history).toHaveLength(2);
    expect(profile.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual([
      { cardId: resolved.id, grade: 'facil' },
      { cardId: pending.id, grade: 'otra-vez' },
    ]);
    expect(new Set(profile.history.map(({ cardId }) => cardId)).size).toBe(2);
    unmount();
  });

  it('lluvia-meteoros survival game over does not grade unshown rounds (AC-19)', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Lluvia Survival', md: LLUVIA_MD });
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="lluvia-meteoros" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startLluvia(container, 5, 'Supervivencia');

    const played = [];
    for (let round = 0; round < 3; round += 1) {
      const card = lluviaCard(topic, container);
      played.push(card.id);
      click(lluviaWrong(container, card));
      if (round < 2) click(findButton(container, 'Siguiente'));
    }

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('0 aciertos');
    expect(container.textContent).toContain('3 fallos');

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded).sort()).toEqual([...played].sort());
    expect(graded[played[0]].reps).toBe(0);
    expect(graded[played[1]].reps).toBe(0);
    expect(graded[played[2]].reps).toBe(0);

    const profile = createStore().load();
    expect(profile.xp).toBe(0);
    expect(profile.history).toHaveLength(3);
    expect(profile.history.map(({ cardId }) => cardId)).toEqual(played);
    expect(profile.history.every((entry) => entry.grade === 'otra-vez')).toBe(true);
    unmount();
  });

  it('conecta-pares loads through GameHost and persists facil grades across reload (AC-11, AC-18)', async () => {
    const md = `# Tema Conecta
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three`;
    const { topic } = saveCustomTopic({ title: 'Tema Conecta', md });
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="conecta-pares" />
    );
    await waitFor(() => findButton(container, 'Empezar'));

    startConecta(container, 3);
    expect(conectaQuestions(container)).toHaveLength(3);
    expect(container.querySelector('[aria-label="Significados"]')).toBeTruthy();

    matchConecta(container, 'uno', 'one');
    matchConecta(container, 'dos', 'two');
    matchConecta(container, 'tres', 'three');

    expect(container.textContent).toContain('Sesión completada');
    expect(container.textContent).toContain('Pares emparejados: 3 de 3');
    expect(container.textContent).toContain('+30 XP');

    const srsBefore = loadSrs();
    const profileBefore = createStore().load();
    expect(Object.keys(srsBefore[topic.id]).sort()).toEqual(['dos', 'tres', 'uno']);
    for (const cardId of ['uno', 'dos', 'tres']) {
      expect(srsBefore[topic.id][cardId]).toMatchObject({
        reps: 1,
        interval: 1,
        ease: 2.65,
      });
    }
    expect(profileBefore.xp).toBe(30);
    expect(profileBefore.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual([
      { cardId: 'uno', grade: 'facil' },
      { cardId: 'dos', grade: 'facil' },
      { cardId: 'tres', grade: 'facil' },
    ]);

    unmount();
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);

    const reloaded = mount(<GameHost topicId={topic.id} gameId="conecta-pares" />);
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()).toEqual(srsBefore);
    expect(createStore().load()).toEqual(profileBefore);
    reloaded.unmount();
  });

  it('conecta-pares grades dificil after an error and otra-vez for pending cards on exit', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Conecta', md: CONECTA_MD });
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="conecta-pares" />
    );
    await waitFor(() => findButton(container, 'Empezar'));

    startConecta(container, 4);
    matchConecta(container, 'uno', 'one');

    click(conectaCard(container, 'dos'));
    click(conectaCard(container, 'three'));
    expect(container.textContent).toContain('1 error');
    click(conectaCard(container, 'dos'));
    click(conectaCard(container, 'two'));

    click(findButton(container, 'Salir'));

    const graded = loadSrs()[topic.id];
    expect(Object.keys(graded).sort()).toEqual(['cuatro', 'dos', 'tres', 'uno']);
    expect(graded.uno).toMatchObject({ reps: 1, interval: 1, ease: 2.65 });
    expect(graded.dos).toMatchObject({ reps: 1, interval: 1, ease: 2.35 });
    expect(graded.tres).toMatchObject({ reps: 0, interval: 1, ease: 2.3 });
    expect(graded.cuatro).toMatchObject({ reps: 0, interval: 1, ease: 2.3 });

    const profile = createStore().load();
    expect(profile.xp).toBe(35);
    expect(profile.history).toHaveLength(4);
    expect(profile.history[0]).toMatchObject({ cardId: 'uno', grade: 'facil' });
    expect(profile.history[1]).toMatchObject({ cardId: 'dos', grade: 'dificil' });
    const pendingGrades = profile.history
      .slice(2)
      .map(({ cardId, grade }) => ({ cardId, grade }));
    expect(pendingGrades).toHaveLength(2);
    expect(pendingGrades).toEqual(
      expect.arrayContaining([
        { cardId: 'tres', grade: 'otra-vez' },
        { cardId: 'cuatro', grade: 'otra-vez' },
      ])
    );
    unmount();
  });

  it('conecta-pares receives the chosen pair count from selectCards with unlearned-first selection', async () => {
    const { topic } = saveCustomTopic({
      title: 'Tema Conecta Seleccion',
      md: CONECTA_SIX_MD,
    });
    const now = Date.now();
    const learned = {
      uno: { reps: 3, nextReview: now },
      dos: { reps: 4, nextReview: now },
    };
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({ [topic.id]: { ...learned } })
    );
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="conecta-pares" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startConecta(container, 3);

    expect(conectaQuestions(container)).toHaveLength(3);
    click(findButton(container, 'Salir'));

    const profile = createStore().load();
    expect(profile.xp).toBe(0);
    expect(profile.history).toHaveLength(3);
    expect(profile.history.every((entry) => entry.grade === 'otra-vez')).toBe(true);
    const selectedIds = profile.history.map(({ cardId }) => cardId);
    expect(new Set(selectedIds).size).toBe(3);
    expect(selectedIds).not.toContain('uno');
    expect(selectedIds).not.toContain('dos');
    expect(selectedIds.every((cardId) => ['tres', 'cuatro', 'cinco', 'seis'].includes(cardId))).toBe(
      true
    );

    const graded = loadSrs()[topic.id];
    expect(graded.uno).toEqual(learned.uno);
    expect(graded.dos).toEqual(learned.dos);
    for (const cardId of selectedIds) expect(graded[cardId].reps).toBe(0);
    unmount();
  });

  it('conecta-pares direct URL below minCards shows the safe gate without loading the game', () => {
    const md = `# Tema Corto Conecta
- Q: uno | A: one
- Q: dos | A: two`;
    const { topic } = saveCustomTopic({ title: 'Tema Corto Conecta', md });
    const { container } = mount(<GameHost topicId={topic.id} gameId="conecta-pares" />);

    expect(container.textContent).toContain('Juego no disponible');
    expect(container.textContent).toContain('Necesitas al menos 3 cartas');
    expect(container.textContent).not.toContain('Cargando juego');
    expect(container.querySelector(`a[href="#/tema/${topic.id}"]`)).toBeTruthy();
    expect(findButton(container, 'Empezar')).toBeUndefined();
  });
  it('serpiente-significados loads through GameHost, selects unlearned cards and persists facil', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Serpiente', md: SERPIENTE_MD });
    const now = Date.now();
    const learned = {
      uno: { reps: 3, nextReview: now },
      dos: { reps: 4, nextReview: now },
    };
    localStorage.setItem('sepect.srs.v1', JSON.stringify({ [topic.id]: learned }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const harness = rafHarness();

    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="serpiente-significados" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startSerpiente(container, 4);
    expect(container.textContent).toContain('Ronda 1 de 4');

    const card = serpienteCard(topic, container);
    expect(['tres', 'cuatro', 'cinco', 'seis']).toContain(card.id);
    eatBack(container, harness, card.back);

    const graded = loadSrs()[topic.id];
    expect(graded[card.id]).toMatchObject({ reps: 1, interval: 1, ease: 2.65 });
    expect(graded.uno).toEqual(learned.uno);
    expect(graded.dos).toEqual(learned.dos);
    const profile = createStore().load();
    expect(profile.xp).toBe(10);
    expect(profile.history).toHaveLength(1);
    expect(profile.history[0]).toMatchObject({
      topicId: topic.id,
      cardId: card.id,
      grade: 'facil',
    });

    click(findButton(container, 'Salir'));
    expect(window.location.hash).toBe(`#/tema/${topic.id}`);
    expect(Object.keys(loadSrs()[topic.id]).sort()).toEqual(['dos', 'uno', card.id].sort());
    expect(createStore().load().history).toHaveLength(1);
    unmount();

    const reloaded = mount(
      <GameHost topicId={topic.id} gameId="serpiente-significados" />
    );
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()[topic.id]).toEqual(graded);
    expect(createStore().load().xp).toBe(10);
    reloaded.unmount();
  });

  it('serpiente-significados persists dificil and mid-round otra-vez without re-emitting', async () => {
    const { topic } = saveCustomTopic({ title: 'Tema Serpiente Dificil', md: SERPIENTE_MD });
    const harness = rafHarness();
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="serpiente-significados" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startSerpiente(container, 4);

    const first = serpienteCard(topic, container);
    eatBack(container, harness, wrongSerpienteBack(container, first.back));
    expect(lives(container)).toBe(4);
    eatBack(container, harness, first.back);

    const firstGraded = loadSrs()[topic.id][first.id];
    expect(firstGraded).toMatchObject({ reps: 1, interval: 1, ease: 2.35 });
    expect(createStore().load().xp).toBe(25);

    advanceFeedback(harness);
    expect(container.textContent).toContain('Ronda 2 de 4');
    const second = serpienteCard(topic, container);
    expect(second.id).not.toBe(first.id);

    click(findButton(container, 'Salir'));
    const graded = loadSrs()[topic.id];
    expect(graded[first.id]).toMatchObject({ reps: 1, interval: 1, ease: 2.35 });
    expect(graded[second.id]).toMatchObject({ reps: 0, interval: 1, ease: 2.3 });
    expect(Object.keys(graded)).toHaveLength(2);
    const profile = createStore().load();
    expect(profile.xp).toBe(25);
    expect(profile.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual([
      { cardId: first.id, grade: 'dificil' },
      { cardId: second.id, grade: 'otra-vez' },
    ]);
    unmount();

    const reloaded = mount(
      <GameHost topicId={topic.id} gameId="serpiente-significados" />
    );
    await waitFor(() => findButton(reloaded.container, 'Empezar'));
    expect(loadSrs()[topic.id]).toEqual(graded);
    expect(createStore().load()).toEqual(profile);
    reloaded.unmount();
  });

  it('serpiente-significados game over grades only the current card and not unshown rounds', async () => {
    const { topic } = saveCustomTopic({
      title: 'Tema Serpiente Game Over',
      md: SERPIENTE_MD,
    });
    const harness = rafHarness();
    const { container, unmount } = mount(
      <GameHost topicId={topic.id} gameId="serpiente-significados" />
    );
    await waitFor(() => findButton(container, 'Empezar'));
    startSerpiente(container, 4);

    const first = serpienteCard(topic, container);
    eatBack(container, harness, wrongSerpienteBack(container, first.back));
    eatBack(container, harness, first.back);
    advanceFeedback(harness);
    expect(container.textContent).toContain('Ronda 2 de 4');

    const second = serpienteCard(topic, container);
    expect(second.id).not.toBe(first.id);
    forceSelfCollision(container, harness);
    expect(lives(container)).toBe(3);

    const wrongA = wrongSerpienteBack(container, second.back);
    eatBack(container, harness, wrongA);
    expect(lives(container)).toBe(2);
    forceSelfCollision(container, harness);
    expect(lives(container)).toBe(1);

    const wrongB = wrongSerpienteBack(container, second.back, [wrongA]);
    eatBack(container, harness, wrongB);
    expect(container.textContent).toContain('Partida terminada');

    const graded = loadSrs()[topic.id];
    expect(graded[first.id]).toMatchObject({ reps: 1, interval: 1, ease: 2.35 });
    expect(graded[second.id]).toMatchObject({ reps: 0, interval: 1, ease: 2.3 });
    expect(Object.keys(graded)).toHaveLength(2);
    const profile = createStore().load();
    expect(profile.xp).toBe(25);
    expect(profile.history.map(({ cardId, grade }) => ({ cardId, grade }))).toEqual([
      { cardId: first.id, grade: 'dificil' },
      { cardId: second.id, grade: 'otra-vez' },
    ]);
    unmount();
  });

  it('serpiente-significados direct URL below minCards shows the safe gate without loading', () => {
    const md = `# Tema Corto Serpiente
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three`;
    const { topic } = saveCustomTopic({ title: 'Tema Corto Serpiente', md });
    const { container } = mount(
      <GameHost topicId={topic.id} gameId="serpiente-significados" />
    );

    expect(container.textContent).toContain('Juego no disponible');
    expect(container.textContent).toContain('Necesitas al menos 4 cartas');
    expect(container.textContent).not.toContain('Cargando juego');
    expect(container.querySelector(`a[href="#/tema/${topic.id}"]`)).toBeTruthy();
    expect(findButton(container, 'Empezar')).toBeUndefined();
  });

  it('offers unlearned plus only due learned cards, never not-due ones (AC-14)', async () => {
    const md = `# Tema Elegibles
- Q: aaa | A: uno
- Q: bbb | A: dos
- Q: ccc | A: tres
- Q: ddd | A: cuatro`;
    const { topic } = saveCustomTopic({ title: 'Tema Elegibles', md });
    const now = Date.now();
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({
        [topic.id]: {
          aaa: { reps: 3, nextReview: now - 2000 },
          bbb: { reps: 4, nextReview: now - 1000 },
          ccc: { reps: 3, nextReview: now + 60_000 },
        },
      })
    );
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);

    const { container, unmount } = mount(<GameHost topicId={topic.id} gameId="ahorcado" />);
    await waitFor(() => findButton(container, 'Empezar'));
    startAhorcado(container, 3);
    click(findButton(container, 'Salir'));

    const profile = createStore().load();
    const selected = profile.history.map((entry) => entry.cardId);
    expect(profile.history).toHaveLength(3);
    expect(new Set(selected)).toEqual(new Set(['aaa', 'bbb', 'ddd']));
    expect(profile.history.every((entry) => entry.grade === 'otra-vez')).toBe(true);

    const graded = loadSrs()[topic.id];
    expect(graded.ccc).toMatchObject({ reps: 3, nextReview: now + 60_000 });
    for (const cardId of selected) expect(graded[cardId].reps).toBe(0);
    unmount();
  });

  it('offers deck play even when every card is learned and not due (AC-31)', async () => {
    const md = `# Tema Al Dia
- Q: uno | A: one
- Q: dos | A: two
- Q: tres | A: three
- Q: cuatro | A: four`;
    const { topic } = saveCustomTopic({ title: 'Tema Al Dia', md });
    const now = Date.now();
    const future = now + 30 * 86_400_000;
    const locked = {};
    for (const card of topic.cards) locked[card.id] = { reps: 3, nextReview: future };
    localStorage.setItem('sepect.srs.v1', JSON.stringify({ [topic.id]: locked }));

    const { container } = mount(<GameHost topicId={topic.id} gameId="flashcards" />);
    await waitFor(() => findButton(container, 'Repasar mazo'));
    expect(container.textContent).not.toContain('Todo al día');
    expect(container.textContent).toContain('Mazo 1');
    expect(container.textContent).toContain('Completado');
  });

  it('no longer gates intruso by SRS eligibility in deck mode (AC-31)', async () => {
    const { topic: other } = saveCustomTopic({ title: 'Tema Intruso Vacio', md: INTRUSO_OTHER_MD });
    const future = Date.now() + 30 * 86_400_000;
    const locked = {};
    for (const card of other.cards) locked[card.id] = { reps: 3, nextReview: future };
    localStorage.setItem('sepect.srs.v1', JSON.stringify({ [other.id]: locked }));
    lockOtherBuiltinTopics(INTRUSO_ANCHOR_ID);

    const { container } = mount(<GameHost topicId={INTRUSO_ANCHOR_ID} gameId="intruso" />);
    await waitFor(() => container.textContent.includes('El intruso'));
    expect(container.textContent).not.toContain('Juego no disponible');
    expect(container.textContent).not.toContain('Todo al día');
    expect(container.textContent).not.toContain('En mantenimiento');
  });

  it('builds intruso groups only from topics with enough eligible cards (AC-20)', async () => {
    saveCustomTopic({ title: 'Tema Listo Intruso', md: INTRUSO_OTHER_MD });
    const { topic: short } = saveCustomTopic({ title: 'Tema Corto Intruso', md: INTRUSO_OTHER_MD });
    const future = Date.now() + 30 * 86_400_000;
    localStorage.setItem(
      'sepect.srs.v1',
      JSON.stringify({
        [short.id]: {
          alfa: { reps: 3, nextReview: future },
          beta: { reps: 3, nextReview: future },
        },
      })
    );
    lockOtherBuiltinTopics(INTRUSO_ANCHOR_ID);

    const { container } = mount(<GameHost topicId={INTRUSO_ANCHOR_ID} gameId="intruso" />);
    await waitFor(() => findButton(container, 'Empezar'));
    expect(container.textContent).toContain('1 tema disponible como intruso');
    expect(container.textContent).not.toContain('2 temas disponibles como intruso');
  });

});
