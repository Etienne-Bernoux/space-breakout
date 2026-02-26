// --- Stingers : motifs courts (win, game over, power-up) ---

import { getCtx, freq, BEAT } from './audio-core.js';

function stingerGain(vol, dur) {
  const c = getCtx();
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
  g.connect(c.destination);
  return g;
}

function playWinStinger() {
  const c = getCtx();
  const t = c.currentTime;
  const tempo = 0.14;

  // --- Fanfare mélodique (square, brillant) ---
  const melody = [
    [64, 0, 1], [67, 1, 1], [71, 2, 1], [76, 3, 1],
    [79, 4, 1], [83, 5, 1.5], [88, 7, 5],
  ];
  for (const [n, beat, dur] of melody) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'square';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.value = 2500;
    const vol = beat < 7 ? 0.1 : 0.13;
    const start = t + beat * tempo;
    const length = dur * tempo;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.015);
    g.gain.setValueAtTime(vol, start + length * 0.7);
    g.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  // --- Doublage octave basse (triangle, corps) ---
  const bassNotes = [
    [52, 0, 1], [55, 1, 1], [59, 2, 1], [64, 3, 1],
    [67, 4, 1], [71, 5, 1.5], [76, 7, 5],
  ];
  for (const [n, beat, dur] of bassNotes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq(n);
    const start = t + beat * tempo;
    const length = dur * tempo;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.08, start + 0.02);
    g.gain.setValueAtTime(0.08, start + length * 0.6);
    g.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  // --- Accord final majeur tenu (nappe brillante) ---
  const chordStart = t + 7 * tempo;
  const chordDur = 5 * tempo;
  const chord = [64, 68, 71, 76, 80];
  for (const n of chord) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1800, chordStart);
    f.frequency.exponentialRampToValueAtTime(400, chordStart + chordDur);
    g.gain.setValueAtTime(0, chordStart);
    g.gain.linearRampToValueAtTime(0.04, chordStart + 0.1);
    g.gain.setValueAtTime(0.04, chordStart + chordDur * 0.5);
    g.gain.linearRampToValueAtTime(0, chordStart + chordDur);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(chordStart);
    osc.stop(chordStart + chordDur + 0.05);
  }

  // --- Petit roulement percussif (celebration) ---
  for (let i = 0; i < 6; i++) {
    const noiseLen = c.sampleRate * 0.04;
    const buf = c.createBuffer(1, noiseLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < noiseLen; j++) data[j] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    src.buffer = buf;
    f.type = 'highpass';
    f.frequency.value = 4000;
    g.gain.setValueAtTime(0.06, t + i * tempo * 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * tempo * 0.8 + 0.06);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(t + i * tempo * 0.8);
  }
}

function playGameOverStinger() {
  const c = getCtx();
  const t = c.currentTime;

  // --- Impact sourd (boom percussif) ---
  const impactOsc = c.createOscillator();
  const impactGain = c.createGain();
  impactOsc.type = 'sine';
  impactOsc.frequency.setValueAtTime(80, t);
  impactOsc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
  impactGain.gain.setValueAtTime(0.35, t);
  impactGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  impactOsc.connect(impactGain);
  impactGain.connect(c.destination);
  impactOsc.start(t);
  impactOsc.stop(t + 1.3);

  // --- Noise burst (texture d'impact) ---
  const noiseLen = c.sampleRate * 0.3;
  const noiseBuf = c.createBuffer(1, noiseLen, c.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  const noiseSrc = c.createBufferSource();
  const noiseGain = c.createGain();
  const noiseFilter = c.createBiquadFilter();
  noiseSrc.buffer = noiseBuf;
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 400;
  noiseGain.gain.setValueAtTime(0.15, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(c.destination);
  noiseSrc.start(t);

  // --- Nappe sombre (Em grave, s'éteint lentement) ---
  const chordNotes = [40, 43, 47, 52, 55];
  for (const n of chordNotes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(600, t + 0.1);
    f.frequency.exponentialRampToValueAtTime(150, t + 2.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.15);
    g.gain.setValueAtTime(0.06, t + 1.0);
    g.gain.linearRampToValueAtTime(0, t + 2.8);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + 3.0);
  }

  // --- Mélodie de mort (3 notes lentes, descendantes) ---
  const deathMelody = [[64, 0.2, 0.6], [62, 0.9, 0.6], [59, 1.6, 1.0]];
  for (const [n, start, dur] of deathMelody) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1200, t + start);
    f.frequency.exponentialRampToValueAtTime(300, t + start + dur);
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(0.12, t + start + 0.04);
    g.gain.setValueAtTime(0.12, t + start + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + start + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(t + start);
    osc.stop(t + start + dur + 0.1);
  }
}

function playPowerUpAccent() {
  const c = getCtx();
  const t = c.currentTime;
  const notes = [83, 86, 88];
  for (let i = 0; i < notes.length; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq(notes[i]);
    g.gain.setValueAtTime(0, t + i * 0.06);
    g.gain.linearRampToValueAtTime(0.1, t + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.25);
  }
}

export { playWinStinger, playGameOverStinger, playPowerUpAccent };
