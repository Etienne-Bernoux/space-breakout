import { loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from '../infra/menu/index.js';
import { loadDevConfig, isDevMode, isDevPanelActive, showDevPanel } from '../infra/dev-panel/index.js';
import { setVolume as setMusicVolume } from '../infra/music/index.js';
import { setSfxVolume } from '../infra/audio.js';
import { isMusicLab, isMusicLabActive, showMusicLab } from '../infra/music-lab/index.js';
import { G, perceptualVolume } from './init.js';

loadSettings();
loadDevConfig();
if (isDevMode()) showDevPanel();
if (isMusicLab()) showMusicLab();

setVolumeChangeCallback((music, sfx) => {
  setMusicVolume(perceptualVolume(music) * 0.3);
  setSfxVolume(perceptualVolume(sfx));
});
setSfxVolume(perceptualVolume(getSfxVolume()));

// --- Hook e2e (lecture seule) ---
window.__GAME__ = {
  get state()    { return G.session.state; },
  get lives()    { return G.session.lives; },
  get remaining(){ return G.entities.field ? G.entities.field.remaining : -1; },
  get devPanel() { return isDevPanelActive(); },
  get musicLab() { return isMusicLabActive(); },
};

// Start
G.gameLoop.start();
