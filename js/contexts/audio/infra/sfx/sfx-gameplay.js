// --- SFX gameplay : rebond, astéroïde, alien, vie, lancer, victoire, game over ---

import { getCtx, getSfxGain, playTone, playNoise } from './audio-core.js';

export function playBounce() {
  playTone(600, 0.08, 'square', 0.15, 900);
}

export function playAsteroidHit() {
  playNoise(0.2, 0.2);
  playTone(150, 0.15, 'sawtooth', 0.1, 60);
}

/** Impact alien : grincement organique (2 oscs désaccordés + vibrato) */
export function playAlienHit() {
  const ctx = getCtx();
  const sfxGain = getSfxGain();
  const now = ctx.currentTime;
  const dur = 0.25;

  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(400, now);
  osc1.frequency.exponentialRampToValueAtTime(180, now + dur);

  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(430, now);
  osc2.frequency.exponentialRampToValueAtTime(150, now + dur);

  // Vibrato via LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 30;
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(sfxGain);
  lfo.start(now);
  osc1.start(now);
  osc2.start(now);
  lfo.stop(now + dur);
  osc1.stop(now + dur);
  osc2.stop(now + dur);
}

export function playLoseLife() {
  playTone(400, 0.4, 'sawtooth', 0.2, 80);
}

export function playWin() {
  [400, 500, 600, 800].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 120);
  });
}

export function playGameOver() {
  [300, 250, 200, 120].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.2), i * 150);
  });
}

export function playLaunch() {
  playTone(200, 0.12, 'sine', 0.15, 500);
}
