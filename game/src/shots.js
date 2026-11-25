// shots.js — deterministic screenshot presets, read from ?shot= and ?seed=.
// Every preset is a real state of the game, reached by setting the same fields the
// game itself sets — never a picture drawn for the screenshot alone.
import { newState, startShift } from './state.js';
import { recipeById } from './config.js';

function setOrder(state, slot, recipeId, timeLeft) {
  const recipe = recipeById(recipeId);
  state.orders[slot] = {
    uid: 100 + slot,
    recipeId,
    timeLeft,
    maxTime: 50,
  };
  return recipe;
}

// A busy kitchen: orders on the board, a dish mid-assembly, a pan cooking,
// something chopping, a plate ready to serve, and the clock running.
export function applyKitchenShot(state) {
  startShift(state);
  state.timeLeft = 74;
  state.coins = 86;
  state.streak = 3;
  state.served = 4;
  state.orders = [];
  setOrder(state, 0, 'sunny-burger', 38);
  setOrder(state, 1, 'cheesy-melt', 21);
  setOrder(state, 2, 'golden-fries', 44);
  state.board.item = { id: 'tomato', state: 'raw' };
  state.board.chops = 2;
  state.pans[0].item = { id: 'patty', state: 'raw' };
  state.pans[0].progress = 4.2;
  state.pans[1].item = { id: 'chicken', state: 'raw' };
  state.pans[1].progress = 2.4;
  state.fryer.item = { id: 'potato', state: 'raw' };
  state.fryer.progress = 4.8;
  state.plates[0].items = [
    { id: 'bun', state: 'raw' },
    { id: 'patty', state: 'cooked' },
    { id: 'lettuce', state: 'chopped' },
  ];
  state.plates[1].items = [
    { id: 'bun', state: 'raw' },
    { id: 'patty', state: 'cooked' },
    { id: 'cheese', state: 'raw' },
    { id: 'cheese', state: 'raw' },
  ];
  state.held = { id: 'tomato', state: 'chopped' };
  state.hint = 'Cheesy Melt is ready — click its plate to serve!';
  state.hintUntil = 999;
}

// Chopping close-up: the board is mid-chop with a queue behind it.
export function applyChopShot(state) {
  startShift(state);
  state.timeLeft = 112;
  state.coins = 34;
  state.orders = [];
  setOrder(state, 0, 'garden-stack', 41);
  setOrder(state, 1, 'crispy-chicken', 18);
  state.board.item = { id: 'lettuce', state: 'raw' };
  state.board.chops = 1;
  state.pans[0].item = { id: 'patty', state: 'raw' };
  state.pans[0].progress = 1.5;
  state.plates[0].items = [{ id: 'bun', state: 'raw' }];
  state.held = null;
  state.hint = 'Chopping the lettuce — click the board twice more.';
  state.hintUntil = 999;
}

// The win screen after a finished shift.
export function applyServedShot(state) {
  startShift(state);
  state.timeLeft = 0;
  state.coins = 132;
  state.served = 6;
  state.streak = 4;
  state.phase = 'won';
  state.hint = '';
}

export function applyShot(state, shot) {
  if (shot === 'kitchen') applyKitchenShot(state);
  else if (shot === 'chop') applyChopShot(state);
  else if (shot === 'served') applyServedShot(state);
  else if (shot === 'start') state.phase = 'title';
  else startShift(state);
}

export function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') || '',
    seed: Number.parseInt(q.get('seed') || '7', 10) || 7,
  };
}
