// audio.js — synthesized sounds only (WebAudio oscillators, no audio files).
// Every sound is a short blip so the game stays silent until the player acts.
let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  unlock() { ensureCtx(); },
  click() { tone(660, 0.06, 'triangle', 0.08); },
  pickup() { tone(520, 0.07, 'sine', 0.1); tone(780, 0.07, 'sine', 0.08, 0.05); },
  chop() { tone(180, 0.08, 'square', 0.12); tone(120, 0.06, 'square', 0.1, 0.03); },
  sizzle() { tone(2400, 0.12, 'sawtooth', 0.015); },
  ding() { tone(880, 0.18, 'sine', 0.12); tone(1320, 0.22, 'sine', 0.1, 0.09); },
  serve() { tone(523, 0.1, 'triangle', 0.12); tone(659, 0.1, 'triangle', 0.12, 0.08); tone(784, 0.2, 'triangle', 0.12, 0.16); },
  fail() { tone(220, 0.25, 'sawtooth', 0.08); tone(165, 0.3, 'sawtooth', 0.08, 0.12); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11)); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
};
