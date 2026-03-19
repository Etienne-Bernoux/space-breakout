// --- SFX consommables ---

import { getCtx, getSfxGain } from './audio-core.js';

export function playSafetyNetBounce() {
  const ctx = getCtx(); const sfxGain = getSfxGain(); const now = ctx.currentTime;
  // Son de filet : sweep descendant + réverb courte
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g); g.connect(sfxGain);
  osc.start(now); osc.stop(now + 0.3);
}

export function playShockwave() {
  const ctx = getCtx(); const sfxGain = getSfxGain(); const now = ctx.currentTime;
  // Boom : bruit filtré passe-bas + sub bass
  const len = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(now);
  // Sub bass
  const sub = ctx.createOscillator(); sub.type = 'sine';
  sub.frequency.setValueAtTime(60, now);
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.4, now);
  sg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  sub.connect(sg); sg.connect(sfxGain);
  sub.start(now); sub.stop(now + 0.5);
}

export function playMissileLaunch() {
  const ctx = getCtx(); const sfxGain = getSfxGain(); const now = ctx.currentTime;
  // Whoosh montant
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(g); g.connect(sfxGain);
  osc.start(now); osc.stop(now + 0.2);
  // Bruit de propulsion
  const len = ctx.sampleRate * 0.1;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.2, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  src.connect(f); f.connect(ng); ng.connect(sfxGain);
  src.start(now);
}

export function playMissileImpact() {
  const ctx = getCtx(); const sfxGain = getSfxGain(); const now = ctx.currentTime;
  // Explosion courte : bruit passe-bas + craquement
  const len = ctx.sampleRate * 0.12;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(now);
  // Impact tonal descendant
  const osc = ctx.createOscillator(); osc.type = 'square';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.12, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(og); og.connect(sfxGain);
  osc.start(now); osc.stop(now + 0.15);
}

export function playFireballActivate() {
  const ctx = getCtx(); const sfxGain = getSfxGain(); const now = ctx.currentTime;
  // Whoosh de feu
  const len = ctx.sampleRate * 0.2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(now);
  // Sweep montant
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.15, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(og); og.connect(sfxGain);
  osc.start(now); osc.stop(now + 0.25);
}
