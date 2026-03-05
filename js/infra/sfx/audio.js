import { synthSfxr } from './sfxr-synth.js';

let audioCtx = null;
let sfxGain = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function setSfxVolume(v) {
  getCtx();
  sfxGain.gain.value = v;
}

function playTone(freq, duration, type = 'sine', volume = 0.3, freqEnd = null) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== null) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.15) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  source.start();
}

// --- Sons du jeu ---

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
  const ctx = getCtx();
  [400, 500, 600, 800].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 120);
  });
}

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

export function playGameOver() {
  const ctx = getCtx();
  [300, 250, 200, 120].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.2), i * 150);
  });
}

export function playLaunch() {
  playTone(200, 0.12, 'sine', 0.15, 500);
}

/** Tir alien : zap sci-fi dissonant (2 oscillateurs désaccordés + filtre) */
export function playAlienShoot() {
  const ctx = getCtx();
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

/** Ramassage minerai : tink métallique court (fréquence selon rareté) */
export function playMineralPickup(mineralKey) {
  const freqs = { copper: 800, silver: 1000, gold: 1200, platinum: 1500 };
  const freq = freqs[mineralKey] || 900;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const dur = 0.12;

  // Tink métallique : triangle aigu + harmonique
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + dur);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.5, now);
  osc2.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.08, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);

  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(sfxGain);
  gain2.connect(sfxGain);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + dur);
  osc2.stop(now + dur);
}

/** Achat upgrade : frappe d'enclume métallique (harmoniques inharmoniques + impact) */
export function playForgePurchase() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // A. Impact : bruit court filtré passe-haut (claquement marteau)
  const impLen = ctx.sampleRate * 0.04;
  const impBuf = ctx.createBuffer(1, impLen, ctx.sampleRate);
  const impData = impBuf.getChannelData(0);
  for (let i = 0; i < impLen; i++) impData[i] = Math.random() * 2 - 1;
  const imp = ctx.createBufferSource();
  imp.buffer = impBuf;
  const impF = ctx.createBiquadFilter();
  impF.type = 'highpass';
  impF.frequency.value = 2000;
  impF.Q.value = 1;
  const impG = ctx.createGain();
  impG.gain.setValueAtTime(0.4, now);
  impG.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  imp.connect(impF);
  impF.connect(impG);
  impG.connect(sfxGain);
  imp.start(now);

  // B. Résonance enclume : harmoniques inharmoniques (métal = non-multiples)
  const partials = [
    { freq: 800,  vol: 0.12, decay: 0.5  },
    { freq: 1340, vol: 0.08, decay: 0.35 },
    { freq: 2120, vol: 0.05, decay: 0.25 },
    { freq: 3050, vol: 0.03, decay: 0.15 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(p.vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + p.decay);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + p.decay);
  }
}

// Débloquer l'audio au premier tap/clic (politique navigateur)
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

// --- Utilitaire volume ---
export function perceptualVolume(v) {
  return v * v;
}
