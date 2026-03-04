import { loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from '../infra/menu/index.js';
import { loadDevConfig, isDevMode, isDevPanelActive, showDevPanel } from '../infra/dev-panel/index.js';
import { setVolume as setMusicVolume } from '../infra/music/index.js';
import { setSfxVolume, perceptualVolume } from '../infra/audio.js';
import { isMusicLab, isMusicLabActive, showMusicLab } from '../infra/music-lab/index.js';
import { isProgressLabMode, isProgressLabActive, initProgressLab, showProgressLab } from '../infra/progress-lab/index.js';
import { getAllLevels } from '../domain/progression/level-catalog.js';
import { saveProgress } from '../infra/persistence/progress-storage.js';
import { G } from './init.js';

loadSettings();
loadDevConfig();
if (isDevMode()) showDevPanel();
if (isMusicLab()) showMusicLab();

// Init progress lab DOM (toujours, pour que le div existe)
initProgressLab({
  wallet: G.wallet,
  upgrades: G.upgrades,
  progress: G.progress,
  levels: getAllLevels(),
  saveProgress,
});
if (isProgressLabMode()) showProgressLab();

setVolumeChangeCallback((music, sfx) => {
  setMusicVolume(perceptualVolume(music) * 0.3);
  setSfxVolume(perceptualVolume(sfx));
});
setSfxVolume(perceptualVolume(getSfxVolume()));

// --- Hook e2e (lecture seule + forceWin) ---
window.__GAME__ = {
  get state()    { return G.session.state; },
  get lives()    { return G.session.lives; },
  get remaining(){ return G.entities.field ? G.entities.field.remaining : -1; },
  get devPanel() { return isDevPanelActive(); },
  get musicLab() { return isMusicLabActive(); },
  get mineralLab() { return isProgressLabActive(); },
  get wallet() { return G.wallet; },
  get upgrades() { return G.upgrades; },
  /** Force la victoire en tuant tous les astéroïdes (usage e2e / dev). */
  forceWin() {
    if (!G.entities.field) return;
    for (const a of G.entities.field.grid) a.alive = false;
  },
};

// Start
G.gameLoop.start();
