// render.js — every pixel of Sizzle & Serve, drawn on one canvas with flat warm colours.
// The kitchen, the order board, the stations, the food and the screens are all here.
import {
  CANVAS_H, CANVAS_W, CHOPS_NEEDED, COUNTER_ORDER, INGREDIENTS, LAYOUT,
  MAX_FAILS, RECIPES, recipeById,
} from './config.js';
import { itemLabel, matchingOrder } from './state.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, bg = '#00000033') {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fill;
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 2) {
    roundRect(ctx, x, y, fw, h, h / 2);
    ctx.fill();
  }
}

// --- Food drawing. Each ingredient is drawn from simple shapes so it reads at a glance. ---
export function drawFood(ctx, item, x, y, s) {
  const c = INGREDIENTS[item.id];
  ctx.save();
  ctx.translate(x, y);
  if (item.state === 'burnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2c1e';
    ctx.beginPath();
    ctx.arc(-s * 0.25, -s * 0.2, s * 0.3, 0, Math.PI * 2);
    ctx.arc(s * 0.3, s * 0.15, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#88888888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.9);
    ctx.quadraticCurveTo(-s * 0.5, -s * 1.5, -s * 0.2, -s * 1.8);
    ctx.moveTo(s * 0.2, -s * 0.9);
    ctx.quadraticCurveTo(s * 0.45, -s * 1.5, s * 0.15, -s * 1.9);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (item.id) {
    case 'bun': {
      ctx.fillStyle = c.dark;
      roundRect(ctx, -s, -s * 0.15, s * 2, s * 0.5, s * 0.2);
      ctx.fill();
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(0, -s * 0.1, s, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.ellipse(-s * 0.4, -s * 0.55, s * 0.18, s * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'patty': {
      ctx.fillStyle = item.state === 'cooked' ? '#6b4423' : c.color;
      roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.35);
      ctx.fill();
      ctx.fillStyle = item.state === 'cooked' ? '#4a2c14' : c.dark;
      for (const [dx, dy] of [[-0.5, -0.15], [0.1, 0.2], [0.55, -0.2], [0, 0]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      if (item.state === 'cooked') {
        ctx.strokeStyle = '#2e1a0a';
        ctx.lineWidth = s * 0.12;
        for (const dx of [-0.5, 0, 0.5]) {
          ctx.beginPath();
          ctx.moveTo(dx * s, -s * 0.4);
          ctx.lineTo(dx * s, s * 0.4);
          ctx.stroke();
        }
      }
      break;
    }
    case 'chicken': {
      ctx.fillStyle = item.state === 'cooked' ? '#c98a3d' : c.color;
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.1, s * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f7ead0';
      ctx.lineWidth = s * 0.28;
      ctx.beginPath();
      ctx.moveTo(s * 0.45, s * 0.35);
      ctx.lineTo(s * 1.05, s * 0.85);
      ctx.stroke();
      ctx.fillStyle = '#f7ead0';
      ctx.beginPath();
      ctx.arc(s * 1.05, s * 0.85, s * 0.22, 0, Math.PI * 2);
      ctx.arc(s * 1.2, s * 0.65, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      if (item.state === 'cooked') {
        ctx.strokeStyle = '#8a5a20';
        ctx.lineWidth = s * 0.1;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.3);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.moveTo(-s * 0.6, s * 0.35);
        ctx.lineTo(s * 0.4, -s * 0.35);
        ctx.stroke();
      }
      break;
    }
    case 'lettuce': {
      if (item.state === 'chopped') {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = s * 0.28;
        ctx.lineCap = 'round';
        for (const [x1, y1, x2, y2] of [[-0.8, -0.3, 0.8, 0.3], [-0.7, 0.4, 0.7, -0.4], [0, -0.6, 0, 0.6]]) {
          ctx.beginPath();
          ctx.moveTo(x1 * s, y1 * s);
          ctx.lineTo(x2 * s, y2 * s);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = c.dark;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.15, s * 0.95, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.ellipse(-s * 0.4, -s * 0.2, s * 0.55, s * 0.4, -0.3, 0, Math.PI * 2);
        ctx.ellipse(s * 0.4, -s * 0.2, s * 0.55, s * 0.4, 0.3, 0, Math.PI * 2);
        ctx.ellipse(0, -s * 0.35, s * 0.5, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'tomato': {
      if (item.state === 'chopped') {
        for (const dx of [-0.55, 0.05, 0.6]) {
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(dx * s, 0, s * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f2a49b';
          ctx.beginPath();
          ctx.arc(dx * s, 0, s * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f28b80';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.35, s * 0.3, s * 0.18, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.dark;
        ctx.beginPath();
        ctx.arc(0, -s * 0.85, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.6);
      ctx.lineTo(s, s * 0.6);
      ctx.lineTo(0, -s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c.dark;
      for (const [dx, dy] of [[-0.3, 0.25], [0.3, 0.1], [0, -0.3]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'potato': {
      if (item.state === 'fries') {
        ctx.fillStyle = '#d9382b';
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, -s * 0.2);
        ctx.lineTo(s * 0.8, -s * 0.2);
        ctx.lineTo(s * 0.6, s * 0.9);
        ctx.lineTo(-s * 0.6, s * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f5c542';
        for (let i = -2; i <= 2; i += 1) {
          ctx.fillRect((i * 0.32 - 0.09) * s, -s * (1.1 + (Math.abs(i) % 2) * 0.15), s * 0.18, s * 1.2);
        }
      } else {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.9, s * 0.65, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.dark;
        for (const [dx, dy] of [[-0.4, -0.2], [0.3, 0.25], [0.1, -0.35]]) {
          ctx.beginPath();
          ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'sauce': {
      ctx.fillStyle = '#f2e6c9';
      roundRect(ctx, -s * 0.4, -s * 0.7, s * 0.8, s * 1.4, s * 0.25);
      ctx.fill();
      ctx.fillStyle = '#d9382b';
      ctx.fillRect(-s * 0.4, -s * 1.05, s * 0.8, s * 0.4);
      ctx.fillStyle = '#b3261e';
      ctx.font = `bold ${Math.round(s * 0.5)}px Trebuchet MS, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', 0, s * 0.1);
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawProgress(ctx, x, y, w, frac, label) {
  const color = frac >= 1 ? '#d9382b' : '#2f7d32';
  bar(ctx, x, y, w, 10, frac, color);
  if (label) text(ctx, label, x + w / 2, y + 22, 12, '#5b4636', 'center');
}

// --- Station and screen drawing. ---

function drawOrderBoard(ctx, state) {
  const b = LAYOUT.orderBoard;
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#e0c9a6';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 20, 15, '#8a5a20');
  const ticketW = 250;
  const gap = 14;
  state.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = b.x + 16 + i * (ticketW + gap);
    const y = b.y + 34;
    const frac = order.timeLeft / order.maxTime;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, ticketW, 62, 8);
    ctx.fill();
    ctx.strokeStyle = frac < 0.3 ? '#d9382b' : '#d9c9a8';
    ctx.lineWidth = frac < 0.3 ? 3 : 1.5;
    ctx.stroke();
    text(ctx, recipe.name, x + 10, y + 13, 15, '#33302a');
    text(ctx, `${recipe.coins} coins`, x + ticketW - 10, y + 13, 13, '#b26a00', 'right');
    recipe.items.forEach(([id, st], j) => {
      drawFood(ctx, { id, state: st === 'plain' ? 'raw' : st }, x + 22 + j * 34, y + 40, 12);
    });
    bar(ctx, x + 10, y + 52, ticketW - 20, 6, frac, frac < 0.3 ? '#d9382b' : '#e8a94e');
  });
  for (let i = state.orders.length; i < 3; i += 1) {
    const x = b.x + 16 + i * (ticketW + gap);
    const y = b.y + 34;
    ctx.fillStyle = '#00000008';
    roundRect(ctx, x, y, ticketW, 62, 8);
    ctx.fill();
    text(ctx, 'Waiting for the next order…', x + ticketW / 2, y + 31, 13, '#a08b6d', 'center');
  }
  // Shift clock, coins, target, hearts.
  const right = b.x + b.w - 16;
  const mm = Math.max(0, Math.floor(state.timeLeft / 60));
  const ss = Math.max(0, Math.floor(state.timeLeft % 60));
  const clock = `${mm}:${String(ss).padStart(2, '0')}`;
  text(ctx, `TIME ${clock}`, right - 250, b.y + 20, 22, state.timeLeft < 30 ? '#d9382b' : '#33302a', 'right');
  text(ctx, `${state.coins} coins / ${state.target}`, right, b.y + 20, 22, '#b26a00', 'right');
  let hearts = '';
  for (let i = 0; i < MAX_FAILS; i += 1) hearts += i < MAX_FAILS - state.fails ? '♥ ' : '♡ ';
  text(ctx, hearts.trim(), right, b.y + 52, 20, '#d9382b', 'right');
  text(ctx, `Served ${state.served}  •  Streak ${state.streak}`, right - 250, b.y + 52, 14, '#7a6a55', 'right');
  text(ctx, 'Cook it, plate it, click the plate to serve.', b.x + b.w / 2, b.y + 20, 13, '#a08b6d', 'center');
}

function drawCounter(ctx, state) {
  const c = LAYOUT.counter;
  ctx.fillStyle = '#a9743f';
  roundRect(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(c.x, c.y + c.h - 10, c.w, 10);
  text(ctx, 'INGREDIENTS — click to pick up (keys 1–8)', c.x + 16, c.y + 18, 14, '#ffe9c4');
  const slotW = c.w / COUNTER_ORDER.length;
  COUNTER_ORDER.forEach((id, i) => {
    const cx = c.x + slotW * i + slotW / 2;
    const cy = c.y + 58;
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0c9a6';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawFood(ctx, { id, state: 'raw' }, cx, cy, 22);
    text(ctx, INGREDIENTS[id].name, cx, cy + 40, 11, '#ffe9c4', 'center');
    text(ctx, String(i + 1), c.x + slotW * i + 12, c.y + 58, 11, '#d9b380', 'left');
  });
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#e8d3ae';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9a86f';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'CHOPPING BOARD', b.x + 16, b.y + 20, 14, '#7a5a30');
  text(ctx, 'Click to chop (3×)', b.x + 16, b.y + 40, 12, '#a08b6d');
  const board = state.board;
  if (board.item) {
    drawFood(ctx, board.item, b.x + 150, b.y + 95, 34);
    drawProgress(ctx, b.x + 60, b.y + 118, 180, board.chops / CHOPS_NEEDED, `${board.chops}/${CHOPS_NEEDED} chops`);
  } else {
    ctx.strokeStyle = '#c9a86f';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(b.x + 150, b.y + 95, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'lettuce / tomato', b.x + 150, b.y + 95, 13, '#a08b6d', 'center');
  }
}

function drawPan(ctx, pan, x, y, w, h) {
  ctx.fillStyle = '#3c3c46';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#23232b';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 6, w / 2 - 14, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  if (pan.item) {
    const frac = pan.progress / pan.max;
    drawFood(ctx, pan.item, x + w / 2, y + h / 2 + 6, 24);
    if (pan.item.state === 'burnt') {
      text(ctx, 'BURNT!', x + w / 2, y + 16, 14, '#ff8a80', 'center');
    } else if (frac >= 1) {
      text(ctx, 'READY — click to take', x + w / 2, y + 16, 12, '#a5d6a7', 'center');
    } else {
      drawProgress(ctx, x + 14, y + h - 18, w - 28, frac, '');
    }
    // Steam puffs while cooking.
    if (pan.progress < pan.max + 1) {
      ctx.fillStyle = '#ffffff55';
      for (let i = 0; i < 3; i += 1) {
        const sx = x + w / 2 - 20 + i * 20 + Math.sin(pan.progress * 3 + i) * 4;
        ctx.beginPath();
        ctx.arc(sx, y + 26 - ((pan.progress * 8 + i * 9) % 22), 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    text(ctx, 'empty pan', x + w / 2, y + h / 2 + 6, 13, '#8a8a96', 'center');
  }
}

function drawStove(ctx, state) {
  const s = LAYOUT.stove;
  ctx.fillStyle = '#6d6d78';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  text(ctx, 'STOVE — click a pan to cook / take', s.x + 16, s.y + 20, 14, '#f0f0f0');
  drawPan(ctx, state.pans[0], LAYOUT.panA.x, LAYOUT.panA.y, LAYOUT.panA.w, LAYOUT.panA.h);
  drawPan(ctx, state.pans[1], LAYOUT.panB.x, LAYOUT.panB.y, LAYOUT.panB.w, LAYOUT.panB.h);
}

function drawFryer(ctx, state) {
  const f = LAYOUT.fryer;
  ctx.fillStyle = '#7d8aa0';
  roundRect(ctx, f.x, f.y, f.w, f.h, 12);
  ctx.fill();
  text(ctx, 'FRYER', f.x + 16, f.y + 20, 14, '#f0f0f0');
  const fry = state.fryer;
  ctx.fillStyle = '#3c4658';
  roundRect(ctx, f.x + 20, f.y + 44, f.w - 40, 70, 8);
  ctx.fill();
  if (fry.item) {
    drawFood(ctx, fry.item, f.x + f.w / 2, f.y + 79, 26);
    const frac = fry.progress / fry.max;
    if (fry.item.state === 'burnt') text(ctx, 'BURNT!', f.x + f.w / 2, f.y + 128, 13, '#ff8a80', 'center');
    else if (frac >= 1) text(ctx, 'READY — click to take', f.x + f.w / 2, f.y + 128, 12, '#a5d6a7', 'center');
    else drawProgress(ctx, f.x + 20, f.y + 124, f.w - 40, frac, '');
  } else {
    text(ctx, 'potato → fries', f.x + f.w / 2, f.y + 79, 13, '#c8d2e0', 'center');
  }
}

function drawPlate(ctx, plate, x, y, w, h, label) {
  ctx.fillStyle = '#f4ede1';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#d9c9a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 8, 42, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbb98f';
  ctx.lineWidth = 2;
  ctx.stroke();
  plate.items.forEach((item, i) => {
    drawFood(ctx, item, x + w / 2 - 24 + (i % 3) * 24, y + h / 2 + 8 + Math.floor(i / 3) * 8 - 6, 13);
  });
  text(ctx, label, x + w / 2, y + 14, 12, '#7a6a55', 'center');
}

function drawPlates(ctx, state) {
  const p = LAYOUT.plates;
  ctx.fillStyle = '#b08954';
  roundRect(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  text(ctx, 'PLATING — click a plate to serve it', p.x + 14, p.y + 20, 13, '#ffe9c4');
  state.plates.forEach((plate, i) => {
    const r = i === 0 ? LAYOUT.plateA : LAYOUT.plateB;
    const ready = plate.items.length > 0 && matchingOrder(state, plate);
    drawPlate(ctx, plate, r.x, r.y, r.w, r.h, ready ? 'READY!' : `Plate ${i + 1}`);
    if (ready) {
      ctx.strokeStyle = '#2f7d32';
      ctx.lineWidth = 3;
      roundRect(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12);
      ctx.stroke();
    }
  });
}

function drawServe(ctx, state) {
  const s = LAYOUT.serve;
  ctx.fillStyle = '#d9382b';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3f3';
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 24, 18, '#ffffff', 'center');
  text(ctx, 'WINDOW', s.x + s.w / 2, s.y + 46, 13, '#ffd9d9', 'center');
  const anyReady = state.plates.some((pl) => pl.items.length > 0 && matchingOrder(state, pl));
  text(ctx, anyReady ? 'A plate is ready!' : 'Serve a matching plate', s.x + s.w / 2, s.y + 96, 12, '#ffffff', 'center');
  text(ctx, 'click plate or window', s.x + s.w / 2, s.y + 118, 11, '#ffd9d9', 'center');
}

function drawBottomBar(ctx, state) {
  const h = LAYOUT.hands;
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#e0c9a6';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Little chef face.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(h.x + 34, h.y + 26, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(h.x + 34, h.y + 12, 17, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#33302a';
  ctx.beginPath();
  ctx.arc(h.x + 28, h.y + 26, 2, 0, Math.PI * 2);
  ctx.arc(h.x + 40, h.y + 26, 2, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'IN HAND:', h.x + 62, h.y + 26, 13, '#8a5a20');
  if (state.held) {
    drawFood(ctx, state.held, h.x + 170, h.y + 26, 16);
    text(ctx, itemLabel(state.held), h.x + 196, h.y + 26, 15, '#33302a');
  } else {
    text(ctx, 'nothing — grab an ingredient', h.x + 170, h.y + 26, 14, '#a08b6d');
  }

  const hint = LAYOUT.hint;
  ctx.fillStyle = state.hintUntil > state.now ? '#fff3d6' : '#fff8ec';
  roundRect(ctx, hint.x, hint.y, hint.w, hint.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#e0c9a6';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, state.hint, hint.x + 14, hint.y + 26, 13, '#5b4636');

  const bin = LAYOUT.bin;
  ctx.fillStyle = '#8a8a96';
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
  ctx.fill();
  text(ctx, 'BIN', bin.x + bin.w / 2, bin.y + 26, 15, '#ffffff', 'center');
}

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    text(ctx, p.text, p.x, p.y - (1.4 - p.life) * 30, 22, p.color, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawWall(ctx) {
  ctx.fillStyle = '#f7e8d0';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#e8d3ae';
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.fillRect(x, 128, 2, 160);
  }
  ctx.fillStyle = '#d9b380';
  ctx.fillRect(0, 288, CANVAS_W, 12);
  ctx.fillStyle = '#c9a86f';
  ctx.fillRect(0, 128, CANVAS_W, 4);
  text(ctx, 'SIZZLE & SERVE', 640, 152, 26, '#8a5a20', 'center');
  text(ctx, 'a tiny kitchen, a ticking clock, and very hungry customers', 640, 182, 14, '#a08b6d', 'center');
  text(ctx, 'Click ingredients to pick them up  ·  1–8 grab  ·  C chop  ·  S serve  ·  B bin  ·  P pause  ·  M mute', 640, 214, 13, '#8a7a5e', 'center');
  // Hanging pans and a shelf for charm.
  ctx.strokeStyle = '#8a5a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 200);
  ctx.lineTo(60, 240);
  ctx.moveTo(1220, 200);
  ctx.lineTo(1220, 240);
  ctx.stroke();
  ctx.fillStyle = '#3c3c46';
  ctx.beginPath();
  ctx.arc(60, 252, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1220, 252, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawTitle(ctx, state) {
  drawWall(ctx);
  ctx.fillStyle = '#00000055';
  roundRect(ctx, 290, 250, 700, 260, 16);
  ctx.fill();
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 300, 260, 680, 240, 14);
  ctx.fill();
  text(ctx, 'SIZZLE & SERVE', 640, 310, 44, '#b3261e', 'center');
  text(ctx, 'Cook to order. Chop, fry, plate — before the customer walks out.', 640, 352, 16, '#5b4636', 'center');
  text(ctx, 'Orders appear on the board. Every dish has a recipe —', 640, 384, 15, '#7a6a55', 'center');
  text(ctx, 'match it exactly, then click the plate to serve.', 640, 408, 15, '#7a6a55', 'center');
  text(ctx, `Serve ${state.target} coins worth in ${Math.floor(150 / 60)}½ minutes. 3 failed orders ends the shift.`, 640, 440, 15, '#7a6a55', 'center');
  ctx.fillStyle = '#2f7d32';
  roundRect(ctx, 490, 462, 300, 46, 10);
  ctx.fill();
  text(ctx, 'START THE SHIFT', 640, 486, 20, '#ffffff', 'center');
}

function drawEnd(ctx, state) {
  const won = state.phase === 'won';
  ctx.fillStyle = won ? '#00000044' : '#00000066';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 340, 200, 600, 320, 16);
  ctx.fill();
  text(ctx, won ? 'SHIFT COMPLETE!' : 'SHIFT OVER', 640, 260, 38, won ? '#2f7d32' : '#b3261e', 'center');
  text(ctx, won
    ? `You served ${state.served} dishes and earned ${state.coins} coins.`
    : `You earned ${state.coins} of ${state.target} coins with ${state.served} dishes served.`,
  640, 312, 17, '#5b4636', 'center');
  text(ctx, won ? 'The customers are full and happy. Well cooked!' : 'The customers walked out hungry. Try a faster route through the kitchen.', 640, 344, 15, '#7a6a55', 'center');
  text(ctx, `Best streak: ${state.streak} in a row`, 640, 380, 15, '#7a6a55', 'center');
  ctx.fillStyle = '#2f7d32';
  roundRect(ctx, 490, 420, 300, 46, 10);
  ctx.fill();
  text(ctx, 'COOK AGAIN  (R)', 640, 444, 18, '#ffffff', 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = '#00000066';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED — press P to keep cooking', 640, 360, 30, '#ffffff', 'center');
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }
  drawWall(ctx);
  drawOrderBoard(ctx, state);
  drawCounter(ctx, state);
  drawBoard(ctx, state);
  drawStove(ctx, state);
  drawFryer(ctx, state);
  drawPlates(ctx, state);
  drawServe(ctx, state);
  drawBottomBar(ctx, state);
  drawPopups(ctx, state);
  if (state.phase === 'won' || state.phase === 'lost') drawEnd(ctx, state);
  else if (state.phase === 'paused') drawPaused(ctx);
}
