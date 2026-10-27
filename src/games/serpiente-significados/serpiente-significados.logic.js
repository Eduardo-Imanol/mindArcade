export const MIN_ROUNDS = 4;
export const MAX_ROUNDS = 10;
export const DEFAULT_ROUNDS = 8;
export const MAX_SURVIVAL_CARDS = 20;
export const APPLES = 3;
export const INITIAL_LIVES = 3;
export const FEEDBACK_MS = 1400;
export const WRONG_GROWTH = 3;
export const MODES = ['rounds', 'survival'];
export const DIFFICULTIES = ['tranquilo', 'normal', 'arcade'];
export const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
export const PHASES = ['setup', 'playing', 'paused', 'resolved', 'gameover', 'complete'];

export const STEP_MS = {
  tranquilo: 350,
  normal: 250,
  arcade: 180,
};

export const BOARD_SIZES = {
  mobile: {
    tranquilo: 13,
    normal: 15,
    arcade: 17,
  },
  desktop: {
    tranquilo: 15,
    normal: 20,
    arcade: 20,
  },
};

const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function shuffle(items, random) {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const pick = Math.floor(random() * (index + 1));
    const swap = out[index];
    out[index] = out[pick];
    out[pick] = swap;
  }
  return out;
}

function arrayOr(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

export function hasText(value) {
  return String(value ?? '').trim() !== '';
}

export function normalizeBack(text = '') {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function validCard(card) {
  return (
    !!card &&
    card.id != null &&
    hasText(card.id) &&
    hasText(card.front) &&
    hasText(card.back)
  );
}

export function uniqueBackCount(deck = []) {
  const backs = new Set();
  for (const card of Array.isArray(deck) ? deck : []) {
    if (!card || card.id == null || !hasText(card.id)) continue;
    const back = normalizeBack(card.back);
    if (back) backs.add(back);
  }
  return backs.size;
}

export function uniqueCards(cards = []) {
  const list = Array.isArray(cards) ? cards : [];
  const seenIds = new Set();
  const seenBacks = new Set();
  const out = [];
  for (const card of list) {
    if (!validCard(card)) continue;
    const id = String(card.id);
    const back = normalizeBack(card.back);
    if (seenIds.has(id) || seenBacks.has(back)) continue;
    seenIds.add(id);
    seenBacks.add(back);
    out.push(card);
  }
  return out;
}

export function clampRounds(rounds) {
  const value = Number(rounds);
  const safe = Number.isFinite(value) ? Math.trunc(value) : DEFAULT_ROUNDS;
  return clamp(safe, MIN_ROUNDS, MAX_ROUNDS);
}

export function safeDifficulty(difficulty) {
  return DIFFICULTIES.includes(difficulty) ? difficulty : 'normal';
}

export function safeViewport(viewport) {
  return viewport === 'mobile' ? 'mobile' : 'desktop';
}

export function boardSizeFor({ difficulty = 'normal', viewport = 'desktop' } = {}) {
  const safeDifficultyValue = safeDifficulty(difficulty);
  const safeViewportValue = safeViewport(viewport);
  return BOARD_SIZES[safeViewportValue][safeDifficultyValue];
}

export function buildSession({
  cards = [],
  deck,
  mode = 'rounds',
  rounds = DEFAULT_ROUNDS,
  difficulty = 'normal',
  viewport = 'desktop',
  random: _random = Math.random,
} = {}) {
  const safeMode = MODES.includes(mode) ? mode : 'rounds';
  const safeDifficultyValue = safeDifficulty(difficulty);
  const safeViewportValue = safeViewport(viewport);
  const requested =
    safeMode === 'survival' ? MAX_SURVIVAL_CARDS : clampRounds(rounds);
  const selected = uniqueCards(cards);
  const fullDeck = uniqueCards(arrayOr(deck, cards));
  const boardSize = boardSizeFor({
    difficulty: safeDifficultyValue,
    viewport: safeViewportValue,
  });
  const empty = {
    empty: true,
    total: 0,
    requested,
    mode: safeMode,
    difficulty: safeDifficultyValue,
    viewport: safeViewportValue,
    boardSize,
    stepMs: STEP_MS[safeDifficultyValue],
    cards: [],
    deck: fullDeck,
  };

  const pool = uniqueCards([...selected, ...fullDeck]);
  if (selected.length === 0 || uniqueBackCount(pool) < APPLES) {
    return { ...empty, deck: pool };
  }

  const total = Math.min(selected.length, requested);
  if (total === 0) return { ...empty, deck: pool };

  return {
    ...empty,
    empty: false,
    total,
    cards: selected.slice(0, total),
    deck: pool,
  };
}

export function createSnake(boardSize) {
  const size = Math.max(1, Math.trunc(Number(boardSize)) || 1);
  const center = Math.floor(size / 2);
  const headX = Math.min(Math.max(1, Math.ceil(size / 2)), size - 1);
  const tailX = headX > 0 ? headX - 1 : headX;
  return [
    { x: headX, y: center },
    { x: tailX, y: center },
  ];
}

function freeCells(snake, boardSize) {
  const occupied = new Set((snake || []).map((cell) => `${cell.x},${cell.y}`));
  const cells = [];
  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) cells.push({ x, y });
    }
  }
  return cells;
}

export function spawnRound({
  card,
  deck = [],
  snake = [],
  boardSize = BOARD_SIZES.desktop.normal,
  random = Math.random,
} = {}) {
  if (!validCard(card)) return null;
  const size = Math.max(1, Math.trunc(Number(boardSize)) || 1);
  const correctBack = normalizeBack(card.back);
  if (!correctBack) return null;

  const seenIds = new Set([String(card.id)]);
  const seenBacks = new Set([correctBack]);
  const distractors = [];
  for (const entry of Array.isArray(deck) ? deck : []) {
    if (!validCard(entry)) continue;
    const id = String(entry.id);
    if (seenIds.has(id)) continue;
    const back = normalizeBack(entry.back);
    if (!back || seenBacks.has(back)) continue;
    seenIds.add(id);
    seenBacks.add(back);
    distractors.push(entry);
  }

  const picks = shuffle(distractors, random).slice(0, APPLES - 1);
  if (picks.length < APPLES - 1) return null;

  const total = APPLES;
  const cells = shuffle(freeCells(snake, size), random).slice(0, total);
  if (cells.length < total) return null;

  const entries = shuffle(
    [
      { card, correct: true },
      ...picks.map((entry) => ({ card: entry, correct: false })),
    ],
    random
  );

  return {
    card,
    apples: entries.map((entry, index) => ({
      number: index + 1,
      cardId: entry.card.id,
      back: entry.card.back,
      front: entry.card.front,
      correct: entry.correct,
      eaten: false,
      x: cells[index].x,
      y: cells[index].y,
    })),
  };
}

export function createState() {
  return {
    phase: 'setup',
    mode: 'rounds',
    requested: DEFAULT_ROUNDS,
    difficulty: 'normal',
    viewport: 'desktop',
    boardSize: BOARD_SIZES.desktop.normal,
    stepMs: STEP_MS.normal,
    total: 0,
    cards: [],
    deck: [],
    roundIndex: 0,
    snake: [],
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
    resumePhase: null,
    endReason: null,
  };
}

function currentCardOf(state) {
  if (!state || !Array.isArray(state.cards)) return null;
  return state.cards[state.roundIndex] || null;
}

function isOpposite(a, b) {
  return OPPOSITE[a] === b;
}

function moveHead(head, direction, boardSize) {
  const next = { x: head.x, y: head.y };
  if (direction === 'UP') next.y -= 1;
  else if (direction === 'DOWN') next.y += 1;
  else if (direction === 'LEFT') next.x -= 1;
  else if (direction === 'RIGHT') next.x += 1;

  if (next.x < 0) next.x = boardSize - 1;
  if (next.x >= boardSize) next.x = 0;
  if (next.y < 0) next.y = boardSize - 1;
  if (next.y >= boardSize) next.y = 0;
  return next;
}

function findRespawn({ apples = [], boardSize }) {
  const size = Math.max(1, Math.trunc(Number(boardSize)) || 1);
  const occupied = new Set(apples.map((apple) => `${apple.x},${apple.y}`));
  const isFree = (x, y) => !occupied.has(`${x},${y}`);
  const center = (size - 1) / 2;
  const candidates = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isFree(x, y)) continue;
      if (x - 1 >= 0 && isFree(x - 1, y)) {
        candidates.push({
          head: { x, y },
          tail: { x: x - 1, y },
          direction: 'RIGHT',
          distance: Math.abs(x - center) + Math.abs(y - center),
        });
      } else if (x + 1 < size && isFree(x + 1, y)) {
        candidates.push({
          head: { x, y },
          tail: { x: x + 1, y },
          direction: 'LEFT',
          distance: Math.abs(x - center) + Math.abs(y - center),
        });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) => a.distance - b.distance || a.head.y - b.head.y || a.head.x - b.head.x
  );
  const chosen = candidates[0];
  return {
    snake: [chosen.head, chosen.tail],
    direction: chosen.direction,
  };
}

function gradeCurrent(state, grade, points = 0) {
  const card = currentCardOf(state);
  const seq = state.results.length + 1;
  if (!card) return { results: state.results, lastGrade: state.lastGrade };
  const result = { seq, cardId: card.id, grade, points };
  return {
    results: [...state.results, result],
    lastGrade: { seq, cardId: card.id, grade },
  };
}

function finishGame(state, base, endReason) {
  const graded = gradeCurrent(state, 'otra-vez');
  const feedbackSeq = (base.feedbackSeq || state.feedbackSeq) + 1;
  const previous = base.feedback || state.feedback || null;
  return {
    ...base,
    ...graded,
    phase: 'gameover',
    endReason,
    resumePhase: null,
    feedbackSeq,
    feedback: {
      seq: feedbackSeq,
      type: 'gameover',
      reason: endReason,
      back: previous && previous.back ? previous.back : null,
      cause: previous && previous.type ? previous.type : null,
    },
  };
}

function handleCollision(state, direction) {
  const lives = Math.max(0, state.lives - 1);
  const feedbackSeq = state.feedbackSeq + 1;
  const base = {
    ...state,
    direction,
    nextDirection: null,
    lives,
    streak: 0,
    score: state.mode === 'rounds' ? state.score : 0,
    feedback: { seq: feedbackSeq, type: 'collision' },
    feedbackSeq,
    resumePhase: null,
  };

  if (lives <= 0) return finishGame(state, base, 'lives');

  const respawn = findRespawn({ apples: state.apples, boardSize: state.boardSize });
  if (!respawn) return finishGame(state, base, 'no-space');

  return {
    ...base,
    phase: 'playing',
    snake: respawn.snake,
    direction: respawn.direction,
    score: state.mode === 'rounds' ? state.score : respawn.snake.length,
  };
}

export function reduce(state, action = {}) {
  if (!state) return state;

  if (action.type === 'start') {
    const session = buildSession({
      cards: action.cards,
      deck: action.deck,
      mode: action.mode,
      rounds: action.rounds,
      difficulty: action.difficulty,
      viewport: action.viewport,
      random: action.random || Math.random,
    });
    const base = {
      ...createState(),
      mode: session.mode,
      requested: session.requested,
      difficulty: session.difficulty,
      viewport: session.viewport,
      boardSize: session.boardSize,
      stepMs: session.stepMs,
      total: session.total,
      cards: session.cards,
      deck: session.deck,
    };

    if (session.empty || session.total === 0) {
      return { ...base, phase: 'complete', endReason: 'empty' };
    }

    const snake = createSnake(session.boardSize);
    const round = spawnRound({
      card: session.cards[0],
      deck: session.deck,
      snake,
      boardSize: session.boardSize,
      random: action.random || Math.random,
    });
    if (!round) return { ...base, phase: 'complete', endReason: 'no-space' };

    return {
      ...base,
      phase: 'playing',
      snake,
      apples: round.apples,
    };
  }

  if (action.type === 'reset') return createState();

  if (action.type === 'direction') {
    if (state.phase !== 'playing') return state;
    if (!DIRECTIONS.includes(action.direction)) return state;
    if (isOpposite(state.direction, action.direction)) return state;
    return { ...state, nextDirection: action.direction };
  }

  if (action.type === 'step') {
    if (state.phase !== 'playing') return state;
    if (!Array.isArray(state.snake) || state.snake.length === 0) return state;

    let direction = state.direction;
    if (state.nextDirection && !isOpposite(state.direction, state.nextDirection)) {
      direction = state.nextDirection;
    }

    const boardSize = state.boardSize;
    const head = moveHead(state.snake[0], direction, boardSize);
    const appleIndex = state.apples.findIndex(
      (apple) => !apple.eaten && apple.x === head.x && apple.y === head.y
    );
    const apple = appleIndex >= 0 ? state.apples[appleIndex] : null;
    const body = apple ? state.snake : state.snake.slice(0, -1);
    const collision = body.some(
      (segment) => segment.x === head.x && segment.y === head.y
    );
    if (collision) return handleCollision(state, direction);

    const moved = [head, ...state.snake];
    if (!apple) {
      moved.pop();
      return {
        ...state,
        snake: moved,
        direction,
        nextDirection: null,
        score: state.mode === 'rounds' ? state.score : moved.length,
      };
    }

    if (apple.correct) {
      const grade = state.wrongEats === 0 ? 'facil' : 'dificil';
      const seq = state.results.length + 1;
      const streak = state.streak + 1;
      const points = state.mode === 'rounds' ? 100 : 0;
      const result = { seq, cardId: apple.cardId, grade, points };
      const feedbackSeq = state.feedbackSeq + 1;
      return {
        ...state,
        phase: 'resolved',
        snake: moved,
        direction,
        nextDirection: null,
        score: state.mode === 'rounds' ? state.score + points : moved.length,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        results: [...state.results, result],
        lastGrade: { seq, cardId: apple.cardId, grade },
        feedback: {
          seq: feedbackSeq,
          type: 'correct',
          number: apple.number,
          back: apple.back,
          cardId: apple.cardId,
          points,
        },
        feedbackSeq,
        resumePhase: null,
      };
    }

    const tail = state.snake[state.snake.length - 1];
    const grown = [...moved];
    for (let index = 0; index < WRONG_GROWTH - 1; index += 1) {
      grown.push({ x: tail.x, y: tail.y });
    }
    const lives = Math.max(0, state.lives - 1);
    const wrongEats = state.wrongEats + 1;
    const apples = state.apples.map((entry, index) =>
      index === appleIndex ? { ...entry, eaten: true } : entry
    );
    const feedbackSeq = state.feedbackSeq + 1;
    const base = {
      ...state,
      snake: grown,
      direction,
      nextDirection: null,
      apples,
      lives,
      wrongEats,
      streak: 0,
      score: state.mode === 'rounds' ? state.score : grown.length,
      feedback: {
        seq: feedbackSeq,
        type: 'wrong',
        number: apple.number,
        back: apple.back,
        cardId: apple.cardId,
      },
      feedbackSeq,
      resumePhase: null,
    };

    if (lives <= 0) return finishGame(state, base, 'lives');
    return { ...base, phase: 'playing' };
  }

  if (action.type === 'next') {
    if (state.phase !== 'resolved') return state;
    const nextIndex = state.roundIndex + 1;
    if (nextIndex >= state.total) {
      return {
        ...state,
        phase: 'complete',
        feedback: null,
        resumePhase: null,
        endReason: 'rounds',
      };
    }

    const card = state.cards[nextIndex];
    const round = spawnRound({
      card,
      deck: state.deck,
      snake: state.snake,
      boardSize: state.boardSize,
      random: action.random || Math.random,
    });
    if (!round) {
      return {
        ...state,
        phase: 'complete',
        roundIndex: nextIndex,
        feedback: null,
        resumePhase: null,
        endReason: 'no-space',
      };
    }

    return {
      ...state,
      phase: 'playing',
      roundIndex: nextIndex,
      apples: round.apples,
      nextDirection: null,
      wrongEats: 0,
      feedback: null,
      resumePhase: null,
      endReason: null,
    };
  }

  if (action.type === 'pause') {
    if (state.phase !== 'playing' && state.phase !== 'resolved') return state;
    return { ...state, phase: 'paused', resumePhase: state.phase };
  }

  if (action.type === 'resume') {
    if (state.phase !== 'paused') return state;
    return { ...state, phase: state.resumePhase || 'playing', resumePhase: null };
  }

  return state;
}

export function currentCard(state) {
  return currentCardOf(state);
}

export function pendingCurrent(state) {
  if (!state || !['playing', 'paused', 'resolved'].includes(state.phase)) return [];
  const card = currentCardOf(state);
  if (!card) return [];
  if ((state.results || []).some((result) => result.cardId === card.id)) return [];
  return [{ cardId: card.id, grade: 'otra-vez' }];
}

export function summarize(state) {
  const results = (state && state.results) || [];
  const firstTry = results.filter((result) => result.grade === 'facil').length;
  const hard = results.filter((result) => result.grade === 'dificil').length;
  const fails = results.filter((result) => result.grade === 'otra-vez').length;
  const length = state && Array.isArray(state.snake) ? state.snake.length : 0;
  return {
    hits: firstTry + hard,
    fails,
    firstTry,
    hard,
    total: results.length,
    score: state && state.mode === 'rounds' ? state.score : length,
    length,
    bestStreak: (state && state.bestStreak) || 0,
    xp: firstTry * 10 + hard * 25,
    lives: (state && state.lives) || 0,
    mode: (state && state.mode) || 'rounds',
  };
}
