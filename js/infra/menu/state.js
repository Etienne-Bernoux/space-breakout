import { CONFIG } from '../../config.js';

// Menu items
const menuItems = [
  { label: 'JOUER', action: 'play' },
  { label: 'RÉGLAGES', action: 'settings' },
  { label: 'CRÉDITS', action: 'credits' },
];

// Menu UI state
let selected = 0;
let showCredits = false;
let showSettings = false;

// Volume settings (0..1)
const STORAGE_KEY = 'space-breakout-settings';
let musicVolume = 0.5;
let sfxVolume = 1.0;
let draggingSlider = null; // 'music' | 'sfx' | null
let onVolumeChange = null; // callback set from main.js

// Floating rocks decoration
const floatingRocks = Array.from({ length: 6 }, () => ({
  x: Math.random() * CONFIG.canvas.width,
  y: Math.random() * CONFIG.canvas.height,
  size: 10 + Math.random() * 20,
  speed: 0.2 + Math.random() * 0.3,
  angle: 0,
  rotSpeed: (Math.random() - 0.5) * 0.02,
  color: CONFIG.asteroids.colors[Math.floor(Math.random() * 4)],
}));

export function setVolumeChangeCallback(cb) {
  onVolumeChange = cb;
}

export function getMusicVolume() {
  return musicVolume;
}

export function getSfxVolume() {
  return sfxVolume;
}

export function loadSettings() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      musicVolume = data.music ?? 0.5;
      sfxVolume = data.sfx ?? 1.0;
    }
  } catch (_) {}
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ music: musicVolume, sfx: sfxVolume }));
}

// Default state object
const state = {
  menuItems,
  selected: () => selected,
  setSelected: (v) => { selected = v; },
  showCredits: () => showCredits,
  setShowCredits: (v) => { showCredits = v; },
  showSettings: () => showSettings,
  setShowSettings: (v) => { showSettings = v; },
  musicVolume: () => musicVolume,
  setMusicVolume: (v) => { musicVolume = v; },
  sfxVolume: () => sfxVolume,
  setSfxVolume: (v) => { sfxVolume = v; },
  draggingSlider: () => draggingSlider,
  setDraggingSlider: (v) => { draggingSlider = v; },
  getOnVolumeChange: () => onVolumeChange,
  floatingRocks,
  STORAGE_KEY,
  saveSettings,
};

export default state;
