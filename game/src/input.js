// input.js — mouse clicks and keyboard shortcuts, mapped onto the state actions.
// Clicking is the main way to play; keys 1-8 grab ingredients, C chops, S serves,
// B bins what is held, M mutes, R restarts, P pauses.
import { COUNTER_ORDER, LAYOUT } from './config.js';
import * as actions from './state.js';
import { sfx } from './audio.js';

function inside(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function counterSlot(x, y) {
  const { counter } = LAYOUT;
  if (!inside(x, y, counter)) return -1;
  const slotW = counter.w / COUNTER_ORDER.length;
  const i = Math.floor((x - counter.x) / slotW);
  return i >= 0 && i < COUNTER_ORDER.length ? i : -1;
}

export function bindInput(canvas, state) {
  const rectOf = () => canvas.getBoundingClientRect();
  const toGame = (e) => {
    const r = rectOf();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  };

  canvas.addEventListener('click', (e) => {
    sfx.unlock();
    const { x, y } = toGame(e);
    handleClick(state, x, y);
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (state.phase === 'title' && (key === 'enter' || key === ' ')) {
      sfx.unlock();
      actions.startShift(state);
      return;
    }
    if ((state.phase === 'won' || state.phase === 'lost') && key === 'r') {
      actions.startShift(state);
      return;
    }
    if (state.phase !== 'playing' && key !== 'p') return;
    if (key === 'p' || key === 'escape') {
      if (state.phase === 'playing') state.phase = 'paused';
      else if (state.phase === 'paused') state.phase = 'playing';
      return;
    }
    if (key === 'm') {
      sfx.toggleMute();
      return;
    }
    if (key === 'r') {
      actions.startShift(state);
      return;
    }
    if (key === 'b') {
      if (actions.useBin(state)) sfx.click();
      return;
    }
    if (key === 'c') {
      if (actions.useBoard(state)) sfx.chop();
      return;
    }
    if (key === 's') {
      if (actions.serveFirstMatching(state)) sfx.serve();
      return;
    }
    const n = Number.parseInt(key, 10);
    if (n >= 1 && n <= COUNTER_ORDER.length) {
      if (actions.pickIngredient(state, COUNTER_ORDER[n - 1])) sfx.pickup();
    }
  });
}

export function handleClick(state, x, y) {
  if (state.phase === 'title') {
    actions.startShift(state);
    sfx.ding();
    return;
  }
  if (state.phase === 'won' || state.phase === 'lost') {
    if (y > 480 && y < 540 && x > 490 && x < 790) actions.startShift(state);
    return;
  }
  if (state.phase === 'paused') {
    state.phase = 'playing';
    return;
  }
  if (state.phase !== 'playing') return;

  const slot = counterSlot(x, y);
  if (slot >= 0) {
    if (actions.pickIngredient(state, COUNTER_ORDER[slot])) sfx.pickup();
    return;
  }
  if (inside(x, y, LAYOUT.board)) {
    if (actions.useBoard(state)) sfx.chop();
    return;
  }
  if (inside(x, y, LAYOUT.panA)) {
    if (actions.usePan(state, 0)) sfx.sizzle();
    return;
  }
  if (inside(x, y, LAYOUT.panB)) {
    if (actions.usePan(state, 1)) sfx.sizzle();
    return;
  }
  if (inside(x, y, LAYOUT.fryer)) {
    if (actions.useFryer(state)) sfx.sizzle();
    return;
  }
  if (inside(x, y, LAYOUT.plateA)) {
    if (actions.usePlate(state, 0)) sfx.serve();
    return;
  }
  if (inside(x, y, LAYOUT.plateB)) {
    if (actions.usePlate(state, 1)) sfx.serve();
    return;
  }
  if (inside(x, y, LAYOUT.serve)) {
    // The serve window: serve the first plate that matches an order, even with full hands.
    if (actions.serveFirstMatching(state)) sfx.serve();
    return;
  }
  if (inside(x, y, LAYOUT.bin)) {
    if (actions.useBin(state)) sfx.click();
  }
}
