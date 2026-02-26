import { loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from '../infra/menu/index.js';
import { loadDevConfig, isDevMode, showDevPanel } from '../infra/dev-panel/index.js';
import { setVolume as setMusicVolume } from '../infra/music/index.js';
import { setSfxVolume } from '../infra/audio.js';
import { isMusicLab, showMusicLab } from '../infra/music-lab/index.js';
import { G, perceptualVolume } from './init.js';
import './input.js';
import { loop } from './loop.js';

// --- Chargement des réglages audio ---
// Courbe perceptuelle : x² pour que 50% du slider ≈ moitié du volume perçu

loadSettings();
loadDevConfig();
// En mode dev, afficher le panel avant le menu
if (isDevMode()) showDevPanel();
// Music lab : ?music=1
if (isMusicLab()) showMusicLab();

setVolumeChangeCallback((music, sfx) => {
  setMusicVolume(perceptualVolume(music) * 0.3);
  setSfxVolume(perceptualVolume(sfx));
});
// Appliquer les volumes sauvegardés
setSfxVolume(perceptualVolume(getSfxVolume()));

// Start the main loop
loop();
