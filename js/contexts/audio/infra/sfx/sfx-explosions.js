// --- SFX explosions : vaisseau + boss ---

import { synthSfxr } from './sfxr-synth.js';
import { getCtx, getSfxGain } from './audio-core.js';

// Params sfxr explosion (générés sur sfxr.me)
const EXPLOSION_SFXR = {
  p_env_attack: 0, p_env_sustain: 0.3672485374573341,
  p_env_punch: 0.620889340391127, p_env_decay: 0.1984798119077068,
  p_base_freq: 0.15660990346413736, p_freq_limit: 0,
  p_freq_ramp: -0.34092310379782853, p_freq_dramp: 0,
  p_vib_strength: 0.42636208279456644, p_vib_speed: 0.5145269624160903,
  p_arp_mod: 0.5030122924389628, p_arp_speed: 0.6630336150439109,
  p_duty: 0, p_duty_ramp: 0, p_repeat_speed: 0,
  p_pha_offset: -0.24450737744696963, p_pha_ramp: -0.0776111794548913,
  p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0,
  p_hpf_freq: 0, p_hpf_ramp: 0, sound_vol: 0.25,
};

export function playShipExplosion() {
  const ctx = getCtx();
  const sfxGain = getSfxGain();
  const now = ctx.currentTime;

  // --- A. Couche sfxr : le souffle de l'explosion ---
  const samples = synthSfxr(EXPLOSION_SFXR, ctx.sampleRate);
  const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buf.getChannelData(0).set(samples);
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.connect(sfxGain);
  noise.start(now);

  // --- B. Kick d'impact — sinus grave avec pitch drop rapide ---
  const kick = ctx.createOscillator();
  const kickGain = ctx.createGain();
  kick.type = 'sine';
  kick.frequency.setValueAtTime(160, now);
  kick.frequency.exponentialRampToValueAtTime(35, now + 0.15);
  kickGain.gain.setValueAtTime(0.6, now);
  kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  kick.connect(kickGain);
  kickGain.connect(sfxGain);
  kick.start(now);
  kick.stop(now + 0.5);

  // --- C. Sous-explosion (deuxième boom décalé) ---
  const bufLen2 = ctx.sampleRate * 1.0;
  const buf2 = ctx.createBuffer(1, bufLen2, ctx.sampleRate);
  const data2 = buf2.getChannelData(0);
  for (let i = 0; i < bufLen2; i++) {
    data2[i] = Math.random() * 2 - 1;
  }
  const noise2 = ctx.createBufferSource();
  noise2.buffer = buf2;
  const n2Gain = ctx.createGain();
  n2Gain.gain.setValueAtTime(0.001, now);
  n2Gain.gain.setValueAtTime(0.4, now + 0.25);
  n2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  const n2Filter = ctx.createBiquadFilter();
  n2Filter.type = 'lowpass';
  n2Filter.frequency.setValueAtTime(500, now + 0.25);
  n2Filter.frequency.exponentialRampToValueAtTime(80, now + 0.9);
  noise2.connect(n2Filter);
  n2Filter.connect(n2Gain);
  n2Gain.connect(sfxGain);
  noise2.start(now);

  // Kick de la sous-explosion
  const kick2 = ctx.createOscillator();
  const kick2Gain = ctx.createGain();
  kick2.type = 'sine';
  kick2.frequency.setValueAtTime(130, now + 0.25);
  kick2.frequency.exponentialRampToValueAtTime(30, now + 0.4);
  kick2Gain.gain.setValueAtTime(0.35, now + 0.25);
  kick2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  kick2.connect(kick2Gain);
  kick2Gain.connect(sfxGain);
  kick2.start(now + 0.25);
  kick2.stop(now + 0.6);
}

/** Explosion boss : double boom grave + bruit filtré + harmonique alien */
export function playBossExplosion() {
  const ctx = getCtx();
  const sfxGain = getSfxGain();
  const now = ctx.currentTime;

  // Kick grave principal
  const kick = ctx.createOscillator();
  const kickG = ctx.createGain();
  kick.type = 'sine';
  kick.frequency.setValueAtTime(100, now);
  kick.frequency.exponentialRampToValueAtTime(25, now + 0.4);
  kickG.gain.setValueAtTime(0.7, now);
  kickG.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  kick.connect(kickG);
  kickG.connect(sfxGain);
  kick.start(now);
  kick.stop(now + 0.6);

  // Second boom décalé
  const kick2 = ctx.createOscillator();
  const kick2G = ctx.createGain();
  kick2.type = 'sine';
  kick2.frequency.setValueAtTime(80, now + 0.2);
  kick2.frequency.exponentialRampToValueAtTime(20, now + 0.6);
  kick2G.gain.setValueAtTime(0.5, now + 0.2);
  kick2G.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  kick2.connect(kick2G);
  kick2G.connect(sfxGain);
  kick2.start(now + 0.2);
  kick2.stop(now + 0.8);

  // Bruit filtré (souffle)
  const bufLen = ctx.sampleRate * 1.2;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const nG = ctx.createGain();
  nG.gain.setValueAtTime(0.35, now);
  nG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  const nF = ctx.createBiquadFilter();
  nF.type = 'lowpass';
  nF.frequency.setValueAtTime(600, now);
  nF.frequency.exponentialRampToValueAtTime(60, now + 1.0);
  noise.connect(nF);
  nF.connect(nG);
  nG.connect(sfxGain);
  noise.start(now);

  // Grincement alien aigu (harmonique organique)
  const alien = ctx.createOscillator();
  const alienG = ctx.createGain();
  alien.type = 'sawtooth';
  alien.frequency.setValueAtTime(800, now + 0.05);
  alien.frequency.exponentialRampToValueAtTime(200, now + 0.5);
  alienG.gain.setValueAtTime(0.1, now + 0.05);
  alienG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  alien.connect(alienG);
  alienG.connect(sfxGain);
  alien.start(now + 0.05);
  alien.stop(now + 0.5);
}
