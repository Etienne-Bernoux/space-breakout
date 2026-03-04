// Sons tab - Data definitions (shared by build.js and handlers.js)
// Draw functions removed (DOM version).

import { getTrack, playWinStinger, playGameOverStinger, playPowerUpAccent } from '../../music/index.js';
import { playBounce, playAsteroidHit, playLoseLife, playLaunch, playShipExplosion, playAlienHit, playBossExplosion } from '../../sfx/audio.js';

// --- Data multi-pistes ---
export const TRACKS = [
  { id: 'main', label: 'SPACE MAIN' },
  { id: 'dark', label: 'DARK ORCH' },
];

const SECTIONS = [
  { id: 'intro',     label: 'INTRO',     color: '#4488aa' },
  { id: 'verse',     label: 'VERSE',     color: '#44aa66' },
  { id: 'chorus',    label: 'CHORUS',    color: '#cc8833' },
  { id: 'bridge',    label: 'BRIDGE',    color: '#8855cc' },
  { id: 'breakdown', label: 'BRKDWN',    color: '#668899' },
  { id: 'climax',    label: 'CLIMAX',    color: '#ff4466' },
  { id: 'outro',     label: 'OUTRO',     color: '#cc4455' },
];

export const INSTRUMENTS_MAIN = [
  { id: 'kick',  label: 'KICK',  color: '#ff6644' },
  { id: 'snare', label: 'SNARE', color: '#ffaa33' },
  { id: 'hihat', label: 'HIHAT', color: '#ffdd44' },
  { id: 'bass',  label: 'BASS',  color: '#44aaff' },
  { id: 'lead',  label: 'LEAD',  color: '#ff44aa' },
  { id: 'pad',   label: 'PAD',   color: '#aa88ff' },
  { id: 'arp',   label: 'ARP',   color: '#44ffaa' },
];

export const INSTRUMENTS_DARK = [
  { id: 'timpani', label: 'TIMPANI', color: '#ff6644' },
  { id: 'cymbal',  label: 'CYMBAL',  color: '#ffaa33' },
  { id: 'cello',   label: 'CELLO',   color: '#44aaff' },
  { id: 'brass',   label: 'BRASS',   color: '#ff44aa' },
  { id: 'strings', label: 'STRINGS', color: '#aa88ff' },
  { id: 'choir',   label: 'CHOIR',   color: '#cc66aa' },
  { id: 'harp',    label: 'HARP',    color: '#44ffaa' },
  { id: 'brassHi', label: 'BRASS HI', color: '#ffee44' },
];

export function getInstruments() {
  return getTrack() === 'dark' ? INSTRUMENTS_DARK : INSTRUMENTS_MAIN;
}

const STINGER_GROUPS = [
  { label: 'STINGERS MUSICAUX', items: [
    { id: 'win',       label: 'WIN',       color: '#44ff88', fn: playWinStinger },
    { id: 'gameover',  label: 'GAMEOVER',  color: '#ff4444', fn: playGameOverStinger },
    { id: 'powerup',   label: 'POWER-UP',  color: '#ffcc00', fn: playPowerUpAccent },
  ]},
  { label: 'SFX GAMEPLAY', items: [
    { id: 'bounce',    label: 'BOUNCE',    color: '#4488ff', fn: playBounce },
    { id: 'asthit',    label: 'AST. HIT',  color: '#aa6633', fn: playAsteroidHit },
    { id: 'launch',    label: 'LAUNCH',    color: '#88ccff', fn: playLaunch },
    { id: 'loselife',  label: 'LOSE LIFE', color: '#ff6666', fn: playLoseLife },
    { id: 'explosion', label: 'SHIP EXPL', color: '#ff8800', fn: playShipExplosion },
  ]},
  { label: 'SFX ALIEN', items: [
    { id: 'alienhit',  label: 'ALIEN HIT', color: '#33cc55', fn: playAlienHit },
    { id: 'alienexpl', label: 'ALIEN EXPL', color: '#44dd66', fn: playBossExplosion },
  ]},
];

/** Flat list (pour handlers). */
export function getStingers() {
  return STINGER_GROUPS.flatMap(g => g.items);
}

export function getStingerGroups() {
  return STINGER_GROUPS;
}

export function getSections() {
  return SECTIONS;
}
