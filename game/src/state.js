// state.js — the whole game state: orders, stations, plates, held item, score.
// One item is an object { id, state } where state is raw | chopped | cooked | fries | burnt.
// A plate holds items; an order is served when a plate's items match its recipe exactly.
import {
  BURN_SECONDS, CHOPS_NEEDED, COOK_SECONDS, FRY_SECONDS, INGREDIENTS,
  MAX_FAILS, MAX_ORDERS, ORDER_PATIENCE_SECONDS, ORDER_SPAWN_SECONDS,
  RECIPES, SHIFT_SECONDS, TARGET_COINS, recipeById,
} from './config.js';
import { mulberry32, pick } from './random.js';

let orderSeq = 0;

export function freshItem(id) {
  return { id, state: 'raw' };
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.state === 'raw') return base;
  if (item.state === 'chopped') return `Chopped ${base}`;
  if (item.state === 'cooked') return `Cooked ${base}`;
  if (item.state === 'fries') return 'Golden Fries';
  if (item.state === 'burnt') return `Burnt ${base}`;
  return base;
}

// The state an ingredient must reach to count for a recipe slot.
export function preppedState(id) {
  const prep = INGREDIENTS[id].prep;
  if (prep === 'chop') return 'chopped';
  if (prep === 'cook') return 'cooked';
  if (prep === 'fry') return 'fries';
  return 'plain';
}

export function newState(seed = 1) {
  return {
    phase: 'title', // title | playing | paused | won | lost
    rng: mulberry32(seed),
    seed,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    target: TARGET_COINS,
    streak: 0,
    fails: 0,
    served: 0,
    held: null,
    orders: [],
    spawnIn: 4,
    board: { item: null, chops: 0 },
    pans: [
      { item: null, progress: 0, max: COOK_SECONDS },
      { item: null, progress: 0, max: COOK_SECONDS },
    ],
    fryer: { item: null, progress: 0, max: FRY_SECONDS },
    plates: [{ items: [] }, { items: [] }],
    popups: [],
    hint: 'Click an ingredient on the counter to pick it up.',
    hintUntil: 0,
    now: 0,
    sizzle: 0,
  };
}

export function startShift(state) {
  const fresh = newState(state.seed);
  Object.assign(state, fresh, { phase: 'playing' });
  spawnOrder(state);
  spawnOrder(state);
}

function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const recipe = pick(state.rng, RECIPES);
  orderSeq += 1;
  state.orders.push({
    uid: orderSeq,
    recipeId: recipe.id,
    timeLeft: ORDER_PATIENCE_SECONDS,
    maxTime: ORDER_PATIENCE_SECONDS,
  });
  state.spawnIn = ORDER_SPAWN_SECONDS;
}

function popup(state, x, y, text, color = '#2f7d32') {
  state.popups.push({ x, y, text, color, life: 1.4 });
}

function setHint(state, text, seconds = 4) {
  state.hint = text;
  state.hintUntil = state.now + seconds;
}

export function matchingOrder(state, plate) {
  const plateSig = plate.items.map((it) => `${it.id}:${preppedState(it.id) === 'plain' ? 'plain' : it.state}`).sort().join('|');
  return state.orders.find((order) => {
    const recipe = recipeById(order.recipeId);
    const want = recipe.items.map(([id, st]) => `${id}:${st}`).sort().join('|');
    return want === plateSig;
  });
}

export function serveFirstMatching(state) {
  if (state.phase !== 'playing') return false;
  for (let i = 0; i < state.plates.length; i += 1) {
    if (state.plates[i].items.length > 0 && matchingOrder(state, state.plates[i])) {
      return servePlate(state, i);
    }
  }
  setHint(state, 'No plate matches an order yet — check the recipe on the order board.');
  return false;
}

function servePlate(state, plateIndex) {
  const plate = state.plates[plateIndex];
  if (plate.items.length === 0) {
    setHint(state, 'That plate is empty — add ingredients first.');
    return false;
  }
  const order = matchingOrder(state, plate);
  if (!order) {
    setHint(state, 'No order matches this plate yet — check the recipe on the order board.');
    return false;
  }
  const recipe = recipeById(order.recipeId);
  const timeBonus = Math.round((order.timeLeft / order.maxTime) * 10);
  const earned = recipe.coins + timeBonus;
  state.coins += earned;
  state.served += 1;
  state.streak += 1;
  state.orders = state.orders.filter((o) => o.uid !== order.uid);
  plate.items = [];
  popup(state, 980, 470, `+${earned} coins`, '#2f7d32');
  if (state.streak >= 3) popup(state, 980, 500, `${state.streak} in a row!`, '#b26a00');
  setHint(state, `${recipe.name} served! +${earned} coins.`);
  return true;
}

function failOrder(state, order) {
  state.orders = state.orders.filter((o) => o.uid !== order.uid);
  state.fails += 1;
  state.streak = 0;
  popup(state, 640, 70, 'Order walked out!', '#b3261e');
  setHint(state, `An order timed out. ${MAX_FAILS - state.fails} mistakes left.`);
  if (state.fails >= MAX_FAILS) endShift(state, false);
}

function endShift(state, won) {
  state.phase = won ? 'won' : 'lost';
  state.held = null;
}

export function tick(state, dt) {
  state.now += dt;
  for (const p of state.popups) p.life -= dt;
  state.popups = state.popups.filter((p) => p.life > 0);
  if (state.phase !== 'playing') return;

  state.timeLeft -= dt;
  state.sizzle += dt;

  // Cooking progresses; done items change state, overcooking burns.
  for (const pan of state.pans) {
    if (!pan.item) continue;
    pan.progress += dt;
    if (pan.item.state === 'raw' && pan.progress >= pan.max) {
      pan.item.state = 'cooked';
    }
    if (pan.progress >= pan.max + BURN_SECONDS && pan.item.state !== 'burnt') {
      pan.item.state = 'burnt';
      setHint(state, 'Something burnt on the stove! Bin it and start over.');
    }
  }
  const fryer = state.fryer;
  if (fryer.item) {
    fryer.progress += dt;
    if (fryer.item.state === 'raw' && fryer.progress >= fryer.max) {
      fryer.item.state = 'fries';
    }
    if (fryer.progress >= fryer.max + BURN_SECONDS && fryer.item.state !== 'burnt') {
      fryer.item.state = 'burnt';
      setHint(state, 'The fries burnt! Bin them and start over.');
    }
  }

  // Orders age and spawn.
  for (const order of [...state.orders]) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) failOrder(state, order);
  }
  if (state.phase !== 'playing') return;
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) spawnOrder(state);

  if (state.timeLeft <= 0) {
    endShift(state, state.coins >= state.target);
  } else if (state.coins >= state.target) {
    endShift(state, true);
  }
}

// --- Player actions. Each returns true when it did something. ---

export function pickIngredient(state, id) {
  if (state.phase !== 'playing') return false;
  if (state.held) {
    setHint(state, 'Your hands are full — put this down first (click a station or the bin).');
    return false;
  }
  state.held = freshItem(id);
  setHint(state, `${INGREDIENTS[id].name} in hand. ${describeNext(state.held)}`);
  return true;
}

function describeNext(item) {
  const prep = INGREDIENTS[item.id].prep;
  if (prep === 'chop') return 'Take it to the chopping board.';
  if (prep === 'cook') return 'Take it to a pan on the stove.';
  if (prep === 'fry') return 'Take it to the fryer.';
  return 'Take it to a plate.';
}

export function useBoard(state) {
  if (state.phase !== 'playing') return false;
  const board = state.board;
  if (board.item) {
    // Chop what is on the board.
    board.chops += 1;
    if (board.chops >= CHOPS_NEEDED) {
      board.item.state = 'chopped';
      state.held = board.item;
      board.item = null;
      board.chops = 0;
      setHint(state, `${itemLabel(state.held)} ready. Take it to a plate.`);
    } else {
      setHint(state, `Chopping… ${board.chops}/${CHOPS_NEEDED}. Click again.`);
    }
    return true;
  }
  if (state.held && INGREDIENTS[state.held.id].prep === 'chop' && state.held.state === 'raw') {
    board.item = state.held;
    board.chops = 0;
    state.held = null;
    setHint(state, 'On the board. Click the board to chop.');
    return true;
  }
  if (state.held) {
    setHint(state, 'That does not need chopping — try the stove, fryer or a plate.');
    return false;
  }
  setHint(state, 'The board is empty. Bring lettuce or tomato to chop.');
  return false;
}

export function usePan(state, index) {
  if (state.phase !== 'playing') return false;
  const pan = state.pans[index];
  if (pan.item) {
    if (pan.progress < pan.max) {
      setHint(state, 'Still cooking — wait for the pan to finish.');
      return false;
    }
    if (state.held) {
      setHint(state, 'Your hands are full — put this down first.');
      return false;
    }
    state.held = pan.item;
    pan.item = null;
    pan.progress = 0;
    setHint(state, `${itemLabel(state.held)} ready. Take it to a plate.`);
    return true;
  }
  if (state.held && INGREDIENTS[state.held.id].prep === 'cook' && state.held.state === 'raw') {
    pan.item = state.held;
    pan.progress = 0;
    state.held = null;
    setHint(state, 'On the stove. Watch the pan — take it off before it burns.');
    return true;
  }
  if (state.held) {
    setHint(state, 'That does not cook in a pan — try the board, fryer or a plate.');
    return false;
  }
  setHint(state, 'An empty pan. Bring a patty or chicken to cook.');
  return false;
}

export function useFryer(state) {
  if (state.phase !== 'playing') return false;
  const fryer = state.fryer;
  if (fryer.item) {
    if (fryer.progress < fryer.max) {
      setHint(state, 'Still frying — wait for the basket to finish.');
      return false;
    }
    if (state.held) {
      setHint(state, 'Your hands are full — put this down first.');
      return false;
    }
    state.held = fryer.item;
    fryer.item = null;
    fryer.progress = 0;
    setHint(state, `${itemLabel(state.held)} ready. Take it to a plate.`);
    return true;
  }
  if (state.held && INGREDIENTS[state.held.id].prep === 'fry' && state.held.state === 'raw') {
    fryer.item = state.held;
    fryer.progress = 0;
    state.held = null;
    setHint(state, 'In the fryer. Watch it — take it out before it burns.');
    return true;
  }
  if (state.held) {
    setHint(state, 'That does not fry — try the board, stove or a plate.');
    return false;
  }
  setHint(state, 'The fryer is empty. Bring a potato to fry.');
  return false;
}

export function usePlate(state, index) {
  if (state.phase !== 'playing') return false;
  const plate = state.plates[index];
  if (!state.held) {
    // Empty hands: click a full plate to serve it.
    if (plate.items.length > 0) return servePlate(state, index);
    setHint(state, 'That plate is empty. Bring ingredients to it.');
    return false;
  }
  if (state.held.state === 'burnt') {
    setHint(state, 'That is burnt — bin it, do not serve it.');
    return false;
  }
  if (state.held.state === 'raw' && INGREDIENTS[state.held.id].prep !== 'none') {
    setHint(state, `${INGREDIENTS[state.held.id].name} still needs prep — board, stove or fryer first.`);
    return false;
  }
  plate.items.push(state.held);
  const placed = state.held;
  state.held = null;
  const order = matchingOrder(state, plate);
  setHint(state, order
    ? `${itemLabel(placed)} on the plate — it matches ${recipeById(order.recipeId).name}! Click the plate to serve.`
    : `${itemLabel(placed)} on the plate.`);
  return true;
}

export function useBin(state) {
  if (state.phase !== 'playing') return false;
  if (state.held) {
    state.held = null;
    setHint(state, 'Binned. Grab something fresh from the counter.');
    return true;
  }
  setHint(state, 'Nothing in hand to bin.');
  return false;
}

export function takeFromPanOrFryer(state) {
  // Clicking a finished pan/fryer with empty hands collects it (handled in usePan/useFryer).
  return false;
}
