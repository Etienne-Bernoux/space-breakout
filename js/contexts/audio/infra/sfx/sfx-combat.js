// --- SFX combat : tir alien ---

import { getCtx, getSfxGain } from './audio-core.js';

/** Tir alien : zap sci-fi dissonant (2 oscillateurs désaccordés + filtre) */
export function playAlienShoot() {
  const ctx = getCtx();
  const sfxGain = getSfxGain();
  const now = ctx.currentTime;
  const dur = 0.18;

  // Oscillateur principal : sweep descendant
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(1200, now);
  osc1.frequency.exponentialRampToValueAtTime(300, now + dur);

  // Oscillateur désaccordé (dissonance)
  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1350, now);
  osc2.frequency.exponentialRampToValueAtTime(250, now + dur);

  // Filtre passe-bas pour le côté énergie
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4000, now);
  filter.frequency.exponentialRampToValueAtTime(600, now + dur);
  filter.Q.value = 8;

  // Enveloppe
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + dur);
  osc2.stop(now + dur);
}
