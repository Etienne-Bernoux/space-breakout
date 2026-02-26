// --- Demos : lecture individuelle d'instruments (pour music-lab) ---

import { getCtx, BEAT } from './audio-core.js';
import { kick, snare, hihat, bass, lead, pad, arp } from './instruments-main.js';
import { timpani, cymbal, cello, brass, strings, choir, harp, brassHigh } from './instruments-dark.js';
import { getTrack } from './scheduler.js';

function playInstrumentDemo(name) {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime + 0.05;
  const demosMain = {
    kick:  () => kick(t),
    snare: () => snare(t),
    hihat: () => hihat(t, 0.12),
    bass:  () => bass(t, 40, BEAT * 2),
    lead:  () => lead(t, 71, BEAT * 2, 0.15),
    pad:   () => pad(t, [52, 55, 59], BEAT * 8),
    arp:   () => { [64, 67, 71, 74].forEach((n, i) => arp(t + i * BEAT * 0.5, n, BEAT * 0.5)); },
  };
  const demosDark = {
    timpani: () => timpani(t, 38, 0.4),
    cymbal:  () => cymbal(t, 0.1),
    cello:   () => cello(t, 38, BEAT * 2),
    brass:   () => brass(t, 62, BEAT * 2, 0.12),
    strings: () => strings(t, [50, 53, 57], BEAT * 6, 0.06),
    choir:   () => choir(t, [38, 45, 50, 57], BEAT * 8, 0.05),
    harp:    () => { [62, 65, 69, 74].forEach((n, i) => harp(t + i * BEAT * 0.4, n, BEAT * 0.8)); },
    brassHi: () => brassHigh(t, 62, BEAT * 2, 0.08),
  };
  const demos = getTrack() === 'dark' ? demosDark : demosMain;
  if (demos[name]) demos[name]();
}

export { playInstrumentDemo };
