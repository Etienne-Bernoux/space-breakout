// --- Instruments piste Main (Space Synth) ---

import { getCtx, freq, layers } from './audio-core.js';

function kick(time) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(25, time + 0.15);
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(gain);
  gain.connect(layers.drums || getCtx().destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

function snare(time) {
  const c = getCtx();
  const bufLen = c.sampleRate * 0.1;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3000;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  src.connect(bp);
  bp.connect(gain);
  gain.connect(layers.drums || getCtx().destination);
  src.start(time);
}

function hihat(time, vol = 0.08) {
  const c = getCtx();
  const bufLen = c.sampleRate * 0.04;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 9000;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  src.connect(hp);
  hp.connect(gain);
  gain.connect(layers.drums || getCtx().destination);
  src.start(time);
}

function bass(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.value = freq(note);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, time);
  filter.frequency.exponentialRampToValueAtTime(120, time + dur);
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.setValueAtTime(0.22, time + dur - 0.03);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.bass || getCtx().destination);
  osc.start(time);
  osc.stop(time + dur);
}

function lead(time, note, dur, vol = 0.12) {
  const c = getCtx();
  const osc1 = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc1.type = 'square';
  osc2.type = 'square';
  osc1.frequency.value = freq(note);
  osc2.frequency.value = freq(note) * 1.004;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.frequency.exponentialRampToValueAtTime(600, time + dur);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
  gain.gain.setValueAtTime(vol, time + dur - 0.05);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(layers.lead || getCtx().destination);
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur);
  osc2.stop(time + dur);
}

function pad(time, notes, dur) {
  const c = getCtx();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 450;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.06, time + 1);
  gain.gain.setValueAtTime(0.06, time + dur - 1.5);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  for (const n of notes) {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq(n);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + dur);
  }
  filter.connect(gain);
  gain.connect(layers.pad || getCtx().destination);
}

function arp(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq(note);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.07, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(layers.lead || getCtx().destination);
  osc.start(time);
  osc.stop(time + dur);
}

function arpFast(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq(note);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.05, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(layers.high || getCtx().destination);
  osc.start(time);
  osc.stop(time + dur);
}

function leadOctave(time, note, dur, vol = 0.06) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'square';
  osc.frequency.value = freq(note + 12);
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
  gain.gain.setValueAtTime(vol, time + dur - 0.04);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.high || getCtx().destination);
  osc.start(time);
  osc.stop(time + dur);
}

export { kick, snare, hihat, bass, lead, pad, arp, arpFast, leadOctave };
