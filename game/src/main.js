// main.js — boot: build the state, wire input, run the loop, expose the state for tests.
import { CANVAS_H, CANVAS_W } from './config.js';
import { bindInput } from './input.js';
import { render } from './render.js';
import { applyShot, readShotParams } from './shots.js';
import { newState, tick } from './state.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const { shot, seed } = readShotParams();
const state = newState(seed);
applyShot(state, shot);
bindInput(canvas, state);

// Exposed for the screenshot probe and for play-testing from the console.
window.__sizzleServe = { state };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(state, dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
