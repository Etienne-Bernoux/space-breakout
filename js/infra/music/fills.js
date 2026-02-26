// --- Fills de transition : roulements et montées entre sections ---

import { getCtx, freq, getBeat } from './audio-core.js';

// Transitions qui méritent un fill
const FILL_TRANSITIONS = new Set([
  'verse→chorus', 'breakdown→chorus', 'bridge→climax',
  'verse→bridge', 'intro→verse',
]);

/** Retourne true si la transition from→to mérite un fill. */
export function shouldFill(from, to) {
  return FILL_TRANSITIONS.has(`${from}→${to}`);
}

/**
 * Roulement de snare (8 hits en accéléré sur ~2 beats).
 * Appelé ~2 beats avant la fin de la section en cours.
 */
export function playSnareRoll(startTime) {
  const c = getCtx();
  const hits = 8;
  const totalDur = getBeat() * 2;

  for (let i = 0; i < hits; i++) {
    // Accéléré : espacement décroissant (quadratique)
    const ratio = i / hits;
    const t = startTime + ratio * ratio * totalDur;
    const vol = 0.04 + ratio * 0.06; // crescendo

    const len = c.sampleRate * 0.04;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < len; j++) data[j] = (Math.random() * 2 - 1);

    const src = c.createBufferSource();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    src.buffer = buf;
    f.type = 'bandpass';
    f.frequency.value = 800 + i * 200; // pitch monte
    f.Q.value = 1.5;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(t);
  }
}

/**
 * Montée d'arp (8 notes ascendantes sur ~2 beats).
 */
export function playArpRise(startTime) {
  const c = getCtx();
  const notes = [52, 55, 59, 62, 64, 67, 71, 76]; // Em montant sur 2 octaves
  const totalDur = getBeat() * 2;

  for (let i = 0; i < notes.length; i++) {
    const t = startTime + (i / notes.length) * totalDur;
    const vol = 0.03 + (i / notes.length) * 0.05;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq(notes[i]);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + getBeat() * 0.4);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + getBeat() * 0.5);
  }
}
