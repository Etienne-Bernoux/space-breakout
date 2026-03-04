// Gameplay tab - Logic (simRecalcIntensity, simApply)
// Draw function removed (DOM version).

import { setLayerVolume, getCurrentSection, requestNextSection } from '../music/index.js';

// Constants for intensity mapping
const INTENSITY_LAYERS = [
  { drums: 0, bass: 0, pad: 1, lead: 0, high: 0 },
  { drums: 0, bass: 1, pad: 1, lead: 0, high: 0 },
  { drums: 1, bass: 1, pad: 1, lead: 0, high: 0 },
  { drums: 1, bass: 1, pad: 1, lead: 1, high: 0 },
  { drums: 1, bass: 1, pad: 1, lead: 1, high: 1 },
];

const INTENSITY_SECTIONS = [
  ['intro', 'verse'], ['verse'], ['chorus'], ['bridge', 'breakdown'], ['climax'],
];

export function simRecalcIntensity(sim) {
  const ratio = sim.total > 0 ? sim.remaining / sim.total : 0;
  let level = 0;
  if (ratio <= 0.10) level = 4;
  else if (ratio <= 0.30) level = 3;
  else if (ratio <= 0.50) level = 2;
  else if (ratio <= 0.80) level = 1;

  if (sim.combo >= 6) level = Math.min(4, level + 2);
  else if (sim.combo >= 3) level = Math.min(4, level + 1);

  if (sim.powerUp) level = Math.min(4, Math.max(level, 2));
  if (sim.lives <= 1) level = Math.min(4, Math.max(level, 3));

  sim.intensity = Math.min(4, Math.max(0, level));
}

export function simApply(sim) {
  const prev = sim.intensity;
  simRecalcIntensity(sim);
  const config = INTENSITY_LAYERS[sim.intensity];
  for (const [layer, vol] of Object.entries(config)) {
    setLayerVolume(layer, vol, 0.5);
  }
  if (sim.intensity !== prev) {
    const candidates = INTENSITY_SECTIONS[sim.intensity];
    const cur = getCurrentSection();
    const filtered = candidates.filter(s => s !== cur);
    const pick = filtered.length > 0 ? filtered : candidates;
    requestNextSection(pick[Math.floor(Math.random() * pick.length)]);
  }
}
