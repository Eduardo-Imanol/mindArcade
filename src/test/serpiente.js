import { act } from 'react';
import { vi } from 'vitest';
import { click, fire, keydown } from './render.jsx';

export const KEY_FOR = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
};

export const buttonByText = (container, text) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === text);

export const buttonByLabel = (container, label) =>
  [...container.querySelectorAll('button')].find(
    (button) => button.getAttribute('aria-label') === label
  );

export function setRounds(container, rounds) {
  const select = container.querySelector('#serpiente-rounds');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(select, String(rounds));
  fire(select, 'change');
}

export function startGame(container, { rounds, difficulty, mode } = {}) {
  if (rounds) setRounds(container, rounds);
  if (difficulty) click(buttonByText(container, difficulty));
  if (mode) click(buttonByText(container, mode));
  click(buttonByText(container, 'Empezar'));
}

export function rafHarness() {
  let nextId = 0;
  let baseline = null;
  const pending = new Map();

  vi.stubGlobal('requestAnimationFrame', (callback) => {
    nextId += 1;
    pending.set(nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    pending.delete(id);
  });

  return {
    step(ms = 90, times = 1) {
      for (let index = 0; index < times; index += 1) {
        if (baseline == null) baseline = performance.now();
        baseline += ms;
        const callbacks = [...pending.values()];
        pending.clear();
        act(() => {
          for (const callback of callbacks) callback(baseline);
        });
      }
    },
    pendingCount: () => pending.size,
  };
}

export const FRAME = 90;

export function advanceOneCell(harness, container) {
  if (!container.querySelector('.serpiente-board')) return;
  const beforeHead = headCell(container);
  const beforeLives = lives(container);
  for (let index = 0; index < 8; index += 1) {
    harness.step(FRAME, 1);
    if (!container.querySelector('.serpiente-board')) return;
    const head = headCell(container);
    if (lives(container) !== beforeLives) return;
    if (head.x !== beforeHead.x || head.y !== beforeHead.y) return;
  }
}

export function advanceFeedback(harness) {
  harness.step(FRAME, 16);
}

const boardSize = (container) => {
  const label = container.querySelector('.serpiente-board').getAttribute('aria-label');
  return Number(label.match(/de (\d+) por (\d+)/)[1]);
};

function cellFromStyle(element, size) {
  const unit = 100 / size;
  return {
    x: Math.round(parseFloat(element.style.left) / unit),
    y: Math.round(parseFloat(element.style.top) / unit),
  };
}

export const headCell = (container) => {
  const size = boardSize(container);
  return cellFromStyle(container.querySelector('.serpiente-segment.is-head'), size);
};

export const appleNumberFor = (container, back) => {
  const row = [...container.querySelectorAll('.serpiente-legend__row')].find(
    (item) => item.querySelector('.serpiente-legend__text').textContent === back
  );
  return Number(row.querySelector('.serpiente-legend__badge').textContent);
};

const appleCell = (container, number) => {
  const size = boardSize(container);
  const apple = [...container.querySelectorAll('.serpiente-apple')].find(
    (element) => element.textContent.trim() === String(number)
  );
  return cellFromStyle(apple, size);
};

export const lives = (container) => {
  const node = container.querySelector('[aria-label^="Vidas:"]');
  return Number(node.getAttribute('aria-label').match(/Vidas: (\d+) de/)[1]);
};

export const snakeLength = (container) =>
  container.querySelectorAll('.serpiente-segment').length;

export const status = (container) => container.querySelector('.serpiente-status');

function planPath(start, target, size, blocked) {
  const key = (cell) => `${cell.x},${cell.y}`;
  const directions = [
    ['RIGHT', 1, 0],
    ['DOWN', 0, 1],
    ['LEFT', -1, 0],
    ['UP', 0, -1],
  ];
  const queue = [start];
  const cameFrom = new Map([[key(start), null]]);

  while (queue.length) {
    const cell = queue.shift();
    if (cell.x === target.x && cell.y === target.y) {
      const path = [];
      let cursor = key(cell);
      while (cameFrom.get(cursor)) {
        const { previous, direction } = cameFrom.get(cursor);
        path.push(direction);
        cursor = previous;
      }
      return path.reverse();
    }
    for (const [direction, dx, dy] of directions) {
      const next = { x: cell.x + dx, y: cell.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= size || next.y >= size) continue;
      if (blocked.has(key(next)) || cameFrom.has(key(next))) continue;
      cameFrom.set(key(next), { previous: key(cell), direction });
      queue.push(next);
    }
  }
  return null;
}

function driveTo(container, harness, target) {
  const size = boardSize(container);
  const blocked = new Set(
    [...container.querySelectorAll('.serpiente-segment')].map((segment) => {
      const cell = cellFromStyle(segment, size);
      return `${cell.x},${cell.y}`;
    })
  );
  for (const apple of container.querySelectorAll('.serpiente-apple')) {
    const cell = cellFromStyle(apple, size);
    if (cell.x === target.x && cell.y === target.y) continue;
    blocked.add(`${cell.x},${cell.y}`);
  }
  const start = headCell(container);
  const path = planPath(start, target, size, blocked);
  if (!path) throw new Error('no path to apple');
  for (const direction of path) {
    keydown(window, KEY_FOR[direction]);
    advanceOneCell(harness, container);
    if (!container.querySelector('.serpiente-board')) break;
    if (container.querySelector('.serpiente-status.is-correct')) break;
  }
}

export function eatBack(container, harness, back) {
  const number = appleNumberFor(container, back);
  driveTo(container, harness, appleCell(container, number));
}

const DELTA = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const TURN_RIGHT = { UP: 'RIGHT', RIGHT: 'DOWN', DOWN: 'LEFT', LEFT: 'UP' };
const TURN_LEFT = { UP: 'LEFT', LEFT: 'DOWN', DOWN: 'RIGHT', RIGHT: 'UP' };
const cellKey = (cell) => `${cell.x},${cell.y}`;

function wrappedCell(head, direction, size) {
  const delta = DELTA[direction];
  return {
    x: (((head.x + delta.x) % size) + size) % size,
    y: (((head.y + delta.y) % size) + size) % size,
  };
}

function inferDirection(segments) {
  const [head, neck] = segments;
  let dx = head.x - neck.x;
  let dy = head.y - neck.y;
  if (dx > 1) dx = -1;
  if (dx < -1) dx = 1;
  if (dy > 1) dy = -1;
  if (dy < -1) dy = 1;
  if (dx === 1) return 'RIGHT';
  if (dx === -1) return 'LEFT';
  if (dy === 1) return 'DOWN';
  return 'UP';
}

function findCollisionSquare(head, current, size, apples, body) {
  for (const first of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
    if (first === OPPOSITE[current]) continue;
    for (const turn of [TURN_RIGHT, TURN_LEFT]) {
      const directions = [first, turn[first], turn[turn[first]], turn[turn[turn[first]]]];
      const p1 = wrappedCell(head, directions[0], size);
      const p2 = wrappedCell(p1, directions[1], size);
      const p3 = wrappedCell(p2, directions[2], size);
      const p4 = wrappedCell(p3, directions[3], size);
      if (p4.x !== head.x || p4.y !== head.y) continue;
      const cells = [p1, p2, p3];
      if (cells.some((cell) => apples.has(cellKey(cell)) || body.has(cellKey(cell)))) {
        continue;
      }
      return directions;
    }
  }
  return null;
}

export function forceSelfCollision(container, harness) {
  const before = lives(container);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const size = boardSize(container);
    const segments = [...container.querySelectorAll('.serpiente-segment')].map((segment) =>
      cellFromStyle(segment, size)
    );
    const head = segments[0];
    const current = inferDirection(segments);
    const apples = new Set(
      [...container.querySelectorAll('.serpiente-apple')].map((apple) =>
        cellKey(cellFromStyle(apple, size))
      )
    );
    const body = new Set(segments.map(cellKey));
    const square = findCollisionSquare(head, current, size, apples, body);
    if (square) {
      for (const direction of square) {
        keydown(window, KEY_FOR[direction]);
        advanceOneCell(harness, container);
        if (lives(container) < before) return;
      }
      throw new Error('self-collision square did not collide');
    }

    const escape = ['UP', 'DOWN', 'LEFT', 'RIGHT']
      .filter((direction) => direction !== OPPOSITE[current])
      .find((direction) => {
        const cell = wrappedCell(head, direction, size);
        return !apples.has(cellKey(cell)) && !body.has(cellKey(cell));
      });
    if (!escape) throw new Error('no safe escape to set up a collision');
    keydown(window, KEY_FOR[escape]);
    advanceOneCell(harness, container);
  }
  throw new Error('could not set up a self-collision');
}
