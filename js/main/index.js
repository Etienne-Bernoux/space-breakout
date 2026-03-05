import { loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from '../infra/menu/index.js';
import { loadDevConfig, isDevPanelActive, showDevPanel, hideDevPanel, initDevPanel } from '../infra/lab/dev-panel/index.js';
import { setVolume as setMusicVolume } from '../infra/music/index.js';
import { setSfxVolume, perceptualVolume } from '../infra/sfx/audio.js';
import { isMusicLabActive, showMusicLab, hideMusicLab, initMusicLab } from '../infra/lab/music-lab/index.js';
import { isProgressLabActive, initProgressLab, showProgressLab, hideProgressLab } from '../infra/lab/progress-lab/index.js';
import { isLabMode, initLabHub, showLabHub, hideLabHub, isLabHubActive } from '../infra/lab/hub/index.js';
import { getAllLevels } from '../domain/progression/level-catalog.js';
import { getAllZones } from '../domain/progression/zone-catalog.js';
import { saveProgress } from '../infra/persistence/progress-storage.js';
import { G, startGame, goToSystemMap } from './init.js';

loadSettings();
loadDevConfig();

// --- Lab Hub ---
initLabHub({
  openDev: () => { hideLabHub(); showDevPanel(); },
  openMusic: () => { hideLabHub(); showMusicLab(); },
  openProgress: () => { hideLabHub(); showProgressLab(); },
});
if (isLabMode()) showLabHub();

// Init dev panel DOM (toujours, pour que le div existe)
initDevPanel({
  onLaunch: () => startGame(),
  onBack: () => { hideDevPanel(); showLabHub(); },
});

// Init music lab DOM (toujours, pour que le div existe)
initMusicLab({
  onBack: () => { hideMusicLab(); showLabHub(); },
});

// Init progress lab DOM (toujours, pour que le div existe)
initProgressLab({
  wallet: G.wallet,
  upgrades: G.upgrades,
  progress: G.progress,
  levels: getAllLevels(),
  zones: getAllZones(),
  saveProgress,
  onBack: () => { hideProgressLab(); showLabHub(); },
  onSetSystemMap: () => { goToSystemMap(); },
  onBackToMenu: () => { G.session.backToMenu(); },
});

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
  get progressLab() { return isProgressLabActive(); },
  get labHub() { return isLabHubActive(); },
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
