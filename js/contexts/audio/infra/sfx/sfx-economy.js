// --- SFX économie : ramassage minerai, achat upgrade ---

import { getCtx, getSfxGain } from './audio-core.js';

/** Ramassage minerai : tink métallique court (fréquence selon rareté) */
export function playMineralPickup(mineralKey) {
  const freqs = { copper: 800, silver: 1000, gold: 1200, platinum: 1500 };
  const freq = freqs[mineralKey] || 900;
  const ctx = getCtx();
  const sfxGain = getSfxGain();
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
  const sfxGain = getSfxGain();
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
