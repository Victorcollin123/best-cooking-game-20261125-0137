// config.js — Sizzle & Serve: every recipe, ingredient and tuning number in one place.
// Nothing here is copied from another game: the dishes, names and numbers are original.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const TARGET_COINS = 120;
export const MAX_FAILS = 3;
export const MAX_ORDERS = 3;
export const ORDER_SPAWN_SECONDS = 9;
export const ORDER_PATIENCE_SECONDS = 50;
export const CHOPS_NEEDED = 3;
export const COOK_SECONDS = 6;
export const FRY_SECONDS = 6;
export const BURN_SECONDS = 4;

// Ingredients. prep: 'none' | 'chop' | 'cook' | 'fry'.
// state names: raw -> chopped | cooked | fries ; anything overcooked -> burnt.
export const INGREDIENTS = {
  bun: { name: 'Bun', prep: 'none', color: '#e8a94e', dark: '#b97e2e' },
  patty: { name: 'Patty', prep: 'cook', color: '#8a5a33', dark: '#5d3a1e' },
  chicken: { name: 'Chicken', prep: 'cook', color: '#e0a458', dark: '#a87434' },
  lettuce: { name: 'Lettuce', prep: 'chop', color: '#6fbf4a', dark: '#4a8f2f' },
  tomato: { name: 'Tomato', prep: 'chop', color: '#e05244', dark: '#a83228' },
  cheese: { name: 'Cheese', prep: 'none', color: '#f5c542', dark: '#c99a1e' },
  potato: { name: 'Potato', prep: 'fry', color: '#d9b380', dark: '#a8824f' },
  sauce: { name: 'Sauce', prep: 'none', color: '#f2e6c9', dark: '#c9b183' },
};

// Counter order, left to right. Keys 1-8 pick them.
export const COUNTER_ORDER = ['bun', 'patty', 'chicken', 'lettuce', 'tomato', 'cheese', 'potato', 'sauce'];

// Recipes: items are [ingredientId, requiredState].
// state: 'plain' (no prep needed), 'chopped', 'cooked', 'fries'.
export const RECIPES = [
  {
    id: 'sunny-burger', name: 'Sunny Burger', coins: 30,
    items: [['bun', 'plain'], ['patty', 'cooked'], ['lettuce', 'chopped'], ['tomato', 'chopped']],
  },
  {
    id: 'cheesy-melt', name: 'Cheesy Melt', coins: 34,
    items: [['bun', 'plain'], ['patty', 'cooked'], ['cheese', 'plain'], ['cheese', 'plain']],
  },
  {
    id: 'crispy-chicken', name: 'Crispy Chicken', coins: 36,
    items: [['bun', 'plain'], ['chicken', 'cooked'], ['lettuce', 'chopped'], ['sauce', 'plain']],
  },
  {
    id: 'golden-fries', name: 'Golden Fries', coins: 18,
    items: [['potato', 'fries'], ['sauce', 'plain']],
  },
  {
    id: 'garden-stack', name: 'Garden Stack', coins: 26,
    items: [['bun', 'plain'], ['lettuce', 'chopped'], ['tomato', 'chopped'], ['cheese', 'plain']],
  },
  {
    id: 'double-sizzle', name: 'Double Sizzle', coins: 44,
    items: [['bun', 'plain'], ['patty', 'cooked'], ['patty', 'cooked'], ['cheese', 'plain'], ['sauce', 'plain']],
  },
];

// Layout rectangles (canvas 1280x720). Shared by input hit-testing and rendering.
export const LAYOUT = {
  orderBoard: { x: 16, y: 12, w: 1248, h: 108 },
  counter: { x: 16, y: 300, w: 1248, h: 110 },
  board: { x: 16, y: 412, w: 300, h: 150 },
  stove: { x: 332, y: 412, w: 300, h: 150 },
  fryer: { x: 648, y: 412, w: 200, h: 150 },
  plates: { x: 864, y: 412, w: 240, h: 150 },
  serve: { x: 1120, y: 412, w: 144, h: 150 },
  bin: { x: 1120, y: 578, w: 144, h: 52 },
  hands: { x: 16, y: 578, w: 620, h: 52 },
  hint: { x: 652, y: 578, w: 452, h: 52 },
  panA: { x: 352, y: 452, w: 120, h: 84 },
  panB: { x: 492, y: 452, w: 120, h: 84 },
  plateA: { x: 880, y: 452, w: 100, h: 84 },
  plateB: { x: 988, y: 452, w: 100, h: 84 },
};

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}
