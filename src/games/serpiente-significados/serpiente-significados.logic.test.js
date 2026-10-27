import { describe, expect, it } from 'vitest';
import {
  APPLES,
  BOARD_SIZES,
  DEFAULT_ROUNDS,
  FEEDBACK_MS,
  INITIAL_LIVES,
  MAX_SURVIVAL_CARDS,
  STEP_MS,
  WRONG_GROWTH,
  boardSizeFor,
  buildSession,
  clampRounds,
  createSnake,
  createState,
  currentCard,
  normalizeBack,
  pendingCurrent,
  reduce,
  safeDifficulty,
  safeViewport,
  spawnRound,
  summarize,
  uniqueBackCount,
  uniqueCards,
} from './serpiente-significados.logic.js';

const DECK = [
  { id: 'a', front: 'closure', back: 'captura el entorno' },
  { id: 'b', front: 'hoisting', back: 'elevación de declaraciones' },
  { id: 'c', front: 'promise', back: 'valor futuro' },
  { id: 'd', front: 'scope', back: 'ámbito de visibilidad' },
  { id: 'e', front: 'memoization', back: 'caché de resultados' },
  { id: 'f', front: 'thunk', back: 'cálculo diferido' },
  { id: 'g', front: 'currying', back: 'aplicación parcial' },
  { id: 'h', front: 'polyfill', back: 'relleno de compatibilidad' },
];

function mulberry32(seed) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playing(overrides = {}) {
  return {
    ...createState(),
    phase: 'playing',
    mode: 'rounds',
    difficulty: 'normal',
    boardSize: 10,
    stepMs: 250,
    total: 3,
    cards: DECK.slice(0, 3),
    deck: DECK,
    roundIndex: 0,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ],
    direction: 'RIGHT',
    nextDirection: null,
    apples: [],
    lives: INITIAL_LIVES,
    score: 0,
    streak: 0,
    bestStreak: 0,
    wrongEats: 0,
    results: [],
    lastGrade: null,
    feedback: null,
    feedbackSeq: 0,
    ...overrides,
  };
}

function appleAt(x, y, overrides = {}) {
  return {
    number: 1,
    cardId: 'a',
    back: 'captura el entorno',
    front: 'closure',
    correct: true,
    x,
    y,
    ...overrides,
  };
}

describe('serpiente-significados constants', () => {
  it('exposes the signed session constants', () => {
    expect(DEFAULT_ROUNDS).toBe(8);
    expect(INITIAL_LIVES).toBe(5);
    expect(APPLES).toBe(3);
    expect(WRONG_GROWTH).toBe(3);
    expect(FEEDBACK_MS).toBe(1400);
    expect(MAX_SURVIVAL_CARDS).toBe(20);
    expect(STEP_MS).toEqual({ tranquilo: 350, normal: 250, arcade: 180 });
  });
});

describe('text and card normalization', () => {
  it('normalizes accents, case and spacing', () => {
    expect(normalizeBack('  Ámbito  de   VISIBILIDAD ')).toBe('ambito de visibilidad');
    expect(normalizeBack(null)).toBe('');
  });

  it('counts unique valid backs', () => {
    expect(uniqueBackCount(DECK)).toBe(8);
    expect(uniqueBackCount([...DECK, { id: 'x', front: 'x', back: 'CAPTURA EL ENTORNO' }])).toBe(8);
    expect(uniqueBackCount([{ id: 'x', front: '', back: 'algo' }])).toBe(1);
  });

  it('filters and deduplicates by id and normalized back', () => {
    const cards = [
      { id: 'a', front: 'closure', back: 'captura el entorno' },
      { id: 'a', front: 'duplicada', back: 'otro significado' },
      { id: 'b', front: 'closure 2', back: 'captura el entorno' },
      { id: 'c', front: 'promise', back: 'valor futuro' },
      { id: '', front: 'sin id', back: 'x' },
      { id: 'd', front: '', back: 'sin front' },
      { id: 'e', front: 'sin back', back: '   ' },
    ];
    expect(uniqueCards(cards).map((card) => card.id)).toEqual(['a', 'c']);
  });
});

describe('round and board scaling', () => {
  it('clamps rounds to 4..10 with default 8', () => {
    expect(clampRounds(undefined)).toBe(8);
    expect(clampRounds(1)).toBe(4);
    expect(clampRounds(11)).toBe(10);
    expect(clampRounds('7')).toBe(7);
    expect(clampRounds('nope')).toBe(8);
  });

  it('resolves safe difficulty and viewport', () => {
    expect(safeDifficulty('arcade')).toBe('arcade');
    expect(safeDifficulty('nope')).toBe('normal');
    expect(safeViewport('mobile')).toBe('mobile');
    expect(safeViewport('tablet')).toBe('desktop');
  });

  it('maps mobile and desktop board sizes', () => {
    expect(boardSizeFor({ difficulty: 'tranquilo', viewport: 'mobile' })).toBe(13);
    expect(boardSizeFor({ difficulty: 'normal', viewport: 'mobile' })).toBe(15);
    expect(boardSizeFor({ difficulty: 'arcade', viewport: 'mobile' })).toBe(17);
    expect(boardSizeFor({ difficulty: 'tranquilo', viewport: 'desktop' })).toBe(15);
    expect(boardSizeFor({ difficulty: 'normal', viewport: 'desktop' })).toBe(20);
    expect(boardSizeFor({ difficulty: 'arcade', viewport: 'desktop' })).toBe(20);
    expect(BOARD_SIZES.mobile.arcade).toBe(17);
  });
});

describe('buildSession', () => {
  it('builds a rounds session with selectCards order and desktop normal board', () => {
    const session = buildSession({
      cards: DECK,
      deck: DECK,
      mode: 'rounds',
      rounds: 10,
      difficulty: 'normal',
      viewport: 'desktop',
    });
    expect(session.empty).toBe(false);
    expect(session.total).toBe(8);
    expect(session.cards.map((card) => card.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(session.boardSize).toBe(20);
    expect(session.stepMs).toBe(250);
    expect(session.requested).toBe(10);
  });

  it('clamps rounds and limits to available unique cards', () => {
    expect(buildSession({ cards: DECK.slice(0, 6), deck: DECK, rounds: 10 }).total).toBe(6);
    expect(buildSession({ cards: DECK.slice(0, 6), deck: DECK, rounds: 1 }).total).toBe(4);
  });

  it('caps survival at 20 cards', () => {
    const many = Array.from({ length: 25 }, (_, index) => ({
      id: `c${index}`,
      front: `front ${index}`,
      back: `back ${index}`,
    }));
    const session = buildSession({ cards: many, deck: many, mode: 'survival' });
    expect(session.total).toBe(20);
    expect(session.requested).toBe(20);
  });

  it('uses mobile board sizes and step durations', () => {
    const arcade = buildSession({
      cards: DECK,
      deck: DECK,
      difficulty: 'arcade',
      viewport: 'mobile',
    });
    expect(arcade.boardSize).toBe(17);
    expect(arcade.stepMs).toBe(180);

    const tranquilo = buildSession({
      cards: DECK,
      deck: DECK,
      difficulty: 'tranquilo',
      viewport: 'mobile',
    });
    expect(tranquilo.boardSize).toBe(13);
    expect(tranquilo.stepMs).toBe(350);
  });

  it('returns a safe empty session with fewer than 3 unique backs', () => {
    const cards = [
      { id: 'a', front: 'a', back: 'mismo' },
      { id: 'b', front: 'b', back: 'MISMO' },
      { id: 'c', front: 'c', back: 'otro' },
    ];
    const session = buildSession({ cards, deck: cards });
    expect(session.empty).toBe(true);
    expect(session.total).toBe(0);
    expect(session.cards).toEqual([]);
  });

  it('returns a safe empty session without valid cards', () => {
    const session = buildSession({ cards: [{ id: '', front: '', back: '' }], deck: [] });
    expect(session.empty).toBe(true);
    expect(session.total).toBe(0);
  });

  it('deduplicates selected cards by id and back', () => {
    const cards = [
      { id: 'a', front: 'a', back: 'uno' },
      { id: 'a', front: 'a2', back: 'dos' },
      { id: 'b', front: 'b', back: 'UNO' },
      { id: 'c', front: 'c', back: 'tres' },
      { id: 'd', front: 'd', back: 'cuatro' },
    ];
    const session = buildSession({ cards, deck: cards, rounds: 10 });
    expect(session.cards.map((card) => card.id)).toEqual(['a', 'c', 'd']);
    expect(session.total).toBe(3);
  });
});

describe('createSnake and spawnRound', () => {
  it('creates a centered two-segment snake facing right', () => {
    const snake = createSnake(15);
    expect(snake).toEqual([
      { x: 8, y: 7 },
      { x: 7, y: 7 },
    ]);
  });

  it('spawns exactly 3 numbered apples with one correct and free cells', () => {
    const random = mulberry32(7);
    const snake = createSnake(10);
    const round = spawnRound({
      card: DECK[0],
      deck: DECK,
      snake,
      boardSize: 10,
      random,
    });
    expect(round).not.toBeNull();
    expect(round.apples).toHaveLength(3);
    expect(round.apples.map((apple) => apple.number)).toEqual([1, 2, 3]);
    expect(round.apples.filter((apple) => apple.correct)).toHaveLength(1);
    expect(round.apples.find((apple) => apple.correct).cardId).toBe('a');
    const backs = round.apples.map((apple) => normalizeBack(apple.back));
    expect(new Set(backs).size).toBe(3);
    const positions = round.apples.map((apple) => `${apple.x},${apple.y}`);
    expect(new Set(positions).size).toBe(3);
    const occupied = new Set(snake.map((cell) => `${cell.x},${cell.y}`));
    for (const position of positions) expect(occupied.has(position)).toBe(false);
  });

  it('is deterministic with the same seed', () => {
    const first = spawnRound({
      card: DECK[0],
      deck: DECK,
      snake: createSnake(10),
      boardSize: 10,
      random: mulberry32(42),
    });
    const second = spawnRound({
      card: DECK[0],
      deck: DECK,
      snake: createSnake(10),
      boardSize: 10,
      random: mulberry32(42),
    });
    expect(first).toEqual(second);
  });

  it('returns null when there are not enough free cells', () => {
    const snake = [];
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        if (x === 0 && y === 0) continue;
        snake.push({ x, y });
      }
    }
    expect(
      spawnRound({ card: DECK[0], deck: DECK, snake, boardSize: 3, random: () => 0.5 })
    ).toBeNull();
  });
});

describe('reduce start / direction / step', () => {
  it('starts a session with 5 lives, 3 apples and a centered snake', () => {
    const state = reduce(createState(), {
      type: 'start',
      cards: DECK,
      deck: DECK,
      mode: 'rounds',
      rounds: 8,
      difficulty: 'normal',
      viewport: 'desktop',
      random: mulberry32(1),
    });
    expect(state.phase).toBe('playing');
    expect(state.total).toBe(8);
    expect(state.lives).toBe(5);
    expect(state.snake).toHaveLength(2);
    expect(state.apples).toHaveLength(3);
    expect(state.cards[0].id).toBe('a');
    expect(currentCard(state).id).toBe('a');
  });

  it('starts safe when the deck has fewer than 3 unique backs', () => {
    const cards = [
      { id: 'a', front: 'a', back: 'uno' },
      { id: 'b', front: 'b', back: 'dos' },
    ];
    const state = reduce(createState(), {
      type: 'start',
      cards,
      deck: cards,
      random: mulberry32(1),
    });
    expect(state.phase).toBe('complete');
    expect(state.endReason).toBe('empty');
    expect(state.total).toBe(0);
  });

  it('blocks a 180-degree reversal and applies a valid turn on the next step', () => {
    const state = playing();
    const reversed = reduce(state, { type: 'direction', direction: 'LEFT' });
    expect(reversed).toBe(state);

    const up = reduce(state, { type: 'direction', direction: 'UP' });
    expect(up.nextDirection).toBe('UP');

    const turned = reduce(up, { type: 'direction', direction: 'LEFT' });
    expect(turned.nextDirection).toBe('UP');

    const moved = reduce(turned, { type: 'step' });
    expect(moved.direction).toBe('UP');
    expect(moved.snake[0]).toEqual({ x: 2, y: 1 });
    expect(moved.nextDirection).toBeNull();
  });

  it('moves, pops the tail and wraps around the edges', () => {
    const state = playing({
      snake: [
        { x: 9, y: 5 },
        { x: 8, y: 5 },
      ],
    });
    const moved = reduce(state, { type: 'step' });
    expect(moved.snake).toEqual([
      { x: 0, y: 5 },
      { x: 9, y: 5 },
    ]);
    expect(moved.snake).toHaveLength(2);

    const up = playing({
      snake: [
        { x: 5, y: 0 },
        { x: 4, y: 0 },
      ],
      direction: 'UP',
    });
    expect(reduce(up, { type: 'step' }).snake[0]).toEqual({ x: 5, y: 9 });
  });

  it('ignores actions in the wrong phase', () => {
    const setup = createState();
    expect(reduce(setup, { type: 'step' })).toBe(setup);
    expect(reduce(setup, { type: 'direction', direction: 'UP' })).toBe(setup);
    expect(reduce(setup, { type: 'next' })).toBe(setup);
    expect(reduce(setup, { type: 'resume' })).toBe(setup);
  });
});

describe('eating apples', () => {
  it('eats the correct apple, grows 1, resolves facil and adds 100 points', () => {
    const state = playing({
      apples: [
        appleAt(3, 2, { number: 1 }),
        appleAt(8, 8, { number: 2, cardId: 'b', back: 'elevación de declaraciones', correct: false }),
        appleAt(9, 9, { number: 3, cardId: 'c', back: 'valor futuro', correct: false }),
      ],
    });
    const next = reduce(state, { type: 'step' });
    expect(next.phase).toBe('resolved');
    expect(next.snake).toHaveLength(3);
    expect(next.score).toBe(100);
    expect(next.streak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.results).toHaveLength(1);
    expect(next.results[0]).toEqual({ seq: 1, cardId: 'a', grade: 'facil', points: 100 });
    expect(next.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'facil' });
    expect(next.feedback).toMatchObject({
      type: 'correct',
      number: 1,
      back: 'captura el entorno',
      cardId: 'a',
    });
  });

  it('eats a wrong apple, loses a life, grows 3 and removes the apple', () => {
    const wrong = appleAt(3, 2, {
      number: 2,
      cardId: 'b',
      back: 'elevación de declaraciones',
      correct: false,
    });
    const state = playing({
      apples: [wrong, appleAt(8, 8, { number: 1 }), appleAt(9, 9, { number: 3 })],
    });
    const next = reduce(state, { type: 'step' });
    expect(next.phase).toBe('playing');
    expect(next.lives).toBe(2);
    expect(next.wrongEats).toBe(1);
    expect(next.streak).toBe(0);
    expect(next.snake).toHaveLength(2 + WRONG_GROWTH);
    expect(next.apples).toHaveLength(3);
    expect(next.apples.find((apple) => apple.cardId === 'b')).toMatchObject({ eaten: true });
    expect(next.score).toBe(0);
    expect(next.feedback).toMatchObject({ type: 'wrong', number: 2, cardId: 'b' });
  });

  it('grades dificil when the correct apple is eaten after a wrong one', () => {
    const state = playing({
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      apples: [
        appleAt(3, 2, { number: 2, cardId: 'b', back: 'elevación de declaraciones', correct: false }),
        appleAt(8, 8, { number: 1 }),
        appleAt(9, 9, { number: 3, cardId: 'c', back: 'valor futuro', correct: false }),
      ],
    });
    const afterWrong = reduce(state, { type: 'step' });
    expect(afterWrong.wrongEats).toBe(1);

    const corrected = {
      ...afterWrong,
      apples: [...afterWrong.apples, appleAt(4, 2, { number: 3, correct: true })],
    };
    const next = reduce(corrected, { type: 'step' });
    expect(next.phase).toBe('resolved');
    expect(next.results[0].grade).toBe('dificil');
    expect(next.score).toBe(100);
  });

  it('ends the game when the last life is lost with a wrong apple', () => {
    const state = playing({
      lives: 1,
      apples: [
        appleAt(3, 2, { number: 2, cardId: 'b', back: 'elevación de declaraciones', correct: false }),
      ],
    });
    const next = reduce(state, { type: 'step' });
    expect(next.phase).toBe('gameover');
    expect(next.lives).toBe(0);
    expect(next.endReason).toBe('lives');
    expect(next.lastGrade).toEqual({ seq: 1, cardId: 'a', grade: 'otra-vez' });
    expect(pendingCurrent(next)).toEqual([]);
  });

  it('keeps the survival score equal to the snake length', () => {
    const state = playing({
      mode: 'survival',
      apples: [appleAt(3, 2)],
    });
    const next = reduce(state, { type: 'step' });
    expect(next.score).toBe(3);
    expect(summarize(next).score).toBe(3);
  });
});

describe('self-collision and respawn', () => {
  it('loses a life, respawns with 2 segments and keeps the round and apples', () => {
    const apples = [appleAt(8, 8, { number: 1 }), appleAt(9, 9, { number: 2 })];
    const state = playing({
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ],
      apples,
    });
    const next = reduce(state, { type: 'step' });
    expect(next.phase).toBe('playing');
    expect(next.lives).toBe(2);
    expect(next.snake).toHaveLength(2);
    expect(next.apples).toEqual(apples);
    expect(next.feedback).toMatchObject({ type: 'collision' });
    expect(next.score).toBe(0);
  });

  it('ends the game when the collision consumes the last life', () => {
    const state = playing({
      lives: 1,
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ],
    });
    const next = reduce(state, { type: 'step' });
    expect(next.phase).toBe('gameover');
    expect(next.endReason).toBe('lives');
    expect(next.results.at(-1)).toMatchObject({ cardId: 'a', grade: 'otra-vez' });
  });

  it('ends safely when there is no room to respawn', () => {
    const state = playing({
      boardSize: 1,
      snake: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      apples: [],
      lives: 3,
    });
    const next = reduce(state, { type: 'step' });
    expect(next.phase).toBe('gameover');
    expect(next.endReason).toBe('no-space');
  });
});

describe('next round, completion and pause', () => {
  it('advances to the next round and resets wrongEats and feedback', () => {
    const state = playing({
      apples: [appleAt(3, 2)],
    });
    const resolved = reduce(state, { type: 'step' });
    const next = reduce(resolved, { type: 'next', random: mulberry32(3) });
    expect(next.phase).toBe('playing');
    expect(next.roundIndex).toBe(1);
    expect(next.wrongEats).toBe(0);
    expect(next.feedback).toBeNull();
    expect(next.apples).toHaveLength(3);
    expect(next.snake).toHaveLength(3);
  });

  it('completes after the last resolved round', () => {
    const state = playing({
      roundIndex: 2,
      apples: [appleAt(3, 2)],
    });
    const resolved = reduce(state, { type: 'step' });
    const next = reduce(resolved, { type: 'next', random: mulberry32(3) });
    expect(next.phase).toBe('complete');
    expect(next.endReason).toBe('rounds');
    expect(next.feedback).toBeNull();
  });

  it('completes safely when the next round cannot place apples', () => {
    const state = playing({
      boardSize: 2,
      roundIndex: 1,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      apples: [],
      phase: 'resolved',
      results: [{ seq: 1, cardId: 'a', grade: 'facil', points: 100 }],
      lastGrade: { seq: 1, cardId: 'a', grade: 'facil' },
    });
    const next = reduce(state, { type: 'next', random: mulberry32(3) });
    expect(next.phase).toBe('complete');
    expect(next.endReason).toBe('no-space');
    expect(next.roundIndex).toBe(2);
  });

  it('pauses and resumes playing and resolved phases', () => {
    const state = playing();
    const paused = reduce(state, { type: 'pause' });
    expect(paused.phase).toBe('paused');
    expect(paused.resumePhase).toBe('playing');
    expect(reduce(paused, { type: 'resume' }).phase).toBe('playing');

    const resolved = playing({ phase: 'resolved' });
    const pausedResolved = reduce(resolved, { type: 'pause' });
    expect(pausedResolved.resumePhase).toBe('resolved');
    expect(reduce(pausedResolved, { type: 'resume' }).phase).toBe('resolved');
  });

  it('resets to setup', () => {
    expect(reduce(playing(), { type: 'reset' })).toEqual(createState());
  });
});

describe('pendingCurrent and summarize', () => {
  it('returns only the unresolved current card', () => {
    const state = playing({ results: [] });
    expect(pendingCurrent(state)).toEqual([{ cardId: 'a', grade: 'otra-vez' }]);

    const resolved = playing({
      phase: 'resolved',
      results: [{ seq: 1, cardId: 'a', grade: 'facil', points: 100 }],
    });
    expect(pendingCurrent(resolved)).toEqual([]);

    const paused = playing({ phase: 'paused', resumePhase: 'playing' });
    expect(pendingCurrent(paused)).toEqual([{ cardId: 'a', grade: 'otra-vez' }]);
  });

  it('returns no pending grades outside a live round', () => {
    expect(pendingCurrent(createState())).toEqual([]);
    expect(pendingCurrent(playing({ phase: 'complete' }))).toEqual([]);
    expect(
      pendingCurrent(
        playing({
          phase: 'gameover',
          results: [{ seq: 1, cardId: 'a', grade: 'otra-vez', points: 0 }],
        })
      )
    ).toEqual([]);
  });

  it('summarizes rounds with XP and arcade points', () => {
    const state = playing({
      score: 200,
      bestStreak: 3,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 6, y: 0 },
      ],
      results: [
        { seq: 1, cardId: 'a', grade: 'facil', points: 100 },
        { seq: 2, cardId: 'b', grade: 'dificil', points: 100 },
        { seq: 3, cardId: 'c', grade: 'otra-vez', points: 0 },
      ],
    });
    expect(summarize(state)).toEqual({
      hits: 2,
      fails: 1,
      firstTry: 1,
      hard: 1,
      total: 3,
      score: 200,
      length: 7,
      bestStreak: 3,
      xp: 35,
      lives: 3,
      mode: 'rounds',
    });
  });

  it('summarizes survival with snake length as score', () => {
    const state = playing({
      mode: 'survival',
      score: 4,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      results: [{ seq: 1, cardId: 'a', grade: 'facil', points: 0 }],
    });
    const stats = summarize(state);
    expect(stats.score).toBe(4);
    expect(stats.mode).toBe('survival');
    expect(stats.hits).toBe(1);
  });
});
