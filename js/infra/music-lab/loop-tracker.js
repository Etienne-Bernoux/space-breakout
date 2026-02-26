// Loop section tracking

import { isPlaying } from '../music/index.js';
import { getLoopStartTime } from './state.js';

const BPM = 110;
const BEAT = 60 / BPM;
const SECTION_DUR = 16 * BEAT;

const LOOP_ORDER = [
  'intro', 'verse', 'chorus', 'verse',
  'breakdown', 'chorus', 'bridge', 'climax',
  'verse', 'bridge', 'chorus', 'outro',
];

export function getActiveLoopSection() {
  if (!isPlaying()) return null;
  const loopStartTime = getLoopStartTime();
  const elapsed = (Date.now() - loopStartTime) / 1000;
  const totalDur = SECTION_DUR * LOOP_ORDER.length;
  const pos = elapsed % totalDur;
  const idx = Math.floor(pos / SECTION_DUR);
  return idx < LOOP_ORDER.length ? LOOP_ORDER[idx] : null;
}

export { LOOP_ORDER, BPM, BEAT, SECTION_DUR };
