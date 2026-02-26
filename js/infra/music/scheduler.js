// --- Scheduler : boucle de sections, mode adaptatif, contrôle lecture ---

import { getCtx, getBeat, LAYER_NAMES, getMasterGain, resetAudio as coreResetAudio } from './audio-core.js';
import { playSectionConfig, SECTIONS } from './section-engine.js';
import { shouldFill, playSnareRoll, playArpRise } from './fills.js';

const TRACK_NAMES = ['main', 'dark'];
let currentTrack = 'main';

function setTrack(name) {
  if (TRACK_NAMES.includes(name)) currentTrack = name;
}
function getTrack() { return currentTrack; }

const FULL_LOOP_NAMES = [
  'intro', 'verse', 'chorus', 'verse',
  'breakdown', 'chorus', 'bridge', 'climax',
  'verse', 'bridge', 'chorus', 'outro',
];

function sectionLen() { return 16 * getBeat(); }

// --- Mode adaptatif : le MusicDirector peut demander la prochaine section ---
let adaptiveMode = false;
let nextRequestedSection = null;
let currentSectionName = null;
let currentSectionStartTime = 0;
let loopIndex = 0;
let playing = false;
let loopTimer = null;
let fillTimer = null;

function enableAdaptiveMode() { adaptiveMode = true; }
function disableAdaptiveMode() { adaptiveMode = false; }

/** Demande une section pour la prochaine transition. */
function requestNextSection(name) { nextRequestedSection = name; }

/** Retourne le nom de la section en cours. */
function getCurrentSection() { return currentSectionName; }

/** Retourne le temps restant avant la prochaine transition (en secondes). */
function getTimeToNextSection() {
  const c = getCtx();
  if (!c || !playing) return 0;
  const elapsed = c.currentTime - currentSectionStartTime;
  return Math.max(0, sectionLen() - elapsed);
}

function peekNextSectionName() {
  if (adaptiveMode && nextRequestedSection) return nextRequestedSection;
  return FULL_LOOP_NAMES[loopIndex % FULL_LOOP_NAMES.length];
}

function scheduleFill() {
  if (!playing) return;
  const nextName = peekNextSectionName();
  if (currentSectionName && shouldFill(currentSectionName, nextName)) {
    const c = getCtx();
    const fillStart = currentSectionStartTime + sectionLen() - getBeat() * 2;
    // Alterner snare roll et arp rise
    if (Math.random() > 0.5) playSnareRoll(fillStart);
    else playArpRise(fillStart);
  }
}

function scheduleNextSection() {
  if (!playing) return;
  const c = getCtx();
  const now = c.currentTime + 0.05;

  let sectionName;
  if (adaptiveMode && nextRequestedSection) {
    sectionName = nextRequestedSection;
    nextRequestedSection = null;
  } else {
    sectionName = FULL_LOOP_NAMES[loopIndex % FULL_LOOP_NAMES.length];
    loopIndex++;
  }

  const map = SECTIONS[currentTrack] || SECTIONS.main;
  const config = map[sectionName];
  if (config) playSectionConfig(config, now);
  currentSectionName = sectionName;
  currentSectionStartTime = now;

  // Programmer le fill 2 beats avant la fin de cette section
  const fillDelay = (sectionLen() - getBeat() * 2.5) * 1000;
  if (fillTimer) clearTimeout(fillTimer);
  fillTimer = setTimeout(scheduleFill, fillDelay);

  loopTimer = setTimeout(scheduleNextSection, sectionLen() * 1000 - 100);
}

function startMusic() {
  if (playing) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  playing = true;
  loopIndex = 0;
  scheduleNextSection();
}

function stopMusic() {
  const mg = getMasterGain();
  const savedVol = mg ? mg.gain.value : 0.3;
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  if (fillTimer) clearTimeout(fillTimer);
  if (mg) {
    const c = getCtx();
    mg.gain.linearRampToValueAtTime(0, c.currentTime + 1);
    setTimeout(() => {
      if (mg) mg.gain.value = savedVol;
    }, 1200);
  }
}

/** Fade out la musique puis exécute un callback. Ne remet pas le volume. */
function fadeOutMusic(duration = 1.0, onDone) {
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  if (fillTimer) clearTimeout(fillTimer);
  loopTimer = null;
  fillTimer = null;
  const mg = getMasterGain();
  const c = getCtx();
  if (mg && c) {
    mg.gain.cancelScheduledValues(c.currentTime);
    mg.gain.setValueAtTime(mg.gain.value, c.currentTime);
    mg.gain.linearRampToValueAtTime(0, c.currentTime + duration);
  }
  if (onDone) setTimeout(onDone, duration * 1000);
}

function isPlaying() {
  return playing;
}

/** Reset complet audio + scheduler state. */
function resetAudio() {
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  if (fillTimer) clearTimeout(fillTimer);
  loopTimer = null;
  fillTimer = null;
  coreResetAudio();
}

/** Joue une section par nom (pour le music lab). */
function playSectionByName(name) {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime + 0.05;
  const map = SECTIONS[currentTrack] || SECTIONS.main;
  if (map[name]) playSectionConfig(map[name], t);
}

export {
  TRACK_NAMES, setTrack, getTrack,
  enableAdaptiveMode, disableAdaptiveMode,
  requestNextSection, getCurrentSection, getTimeToNextSection,
  startMusic, stopMusic, fadeOutMusic, isPlaying,
  resetAudio, playSectionByName,
};
