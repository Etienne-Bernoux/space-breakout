import { loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from '../infra/menu/index.js';
import { loadDevConfig, isDevPanelActive, showDevPanel, hideDevPanel, initDevPanel } from '../infra/lab/dev-panel/index.js';
import { setVolume as setMusicVolume } from '../infra/music/index.js';
import { setSfxVolume, perceptualVolume } from '../infra/sfx/audio.js';
import { isMusicLabActive, showMusicLab, hideMusicLab, initMusicLab } from '../infra/lab/music-lab/index.js';
import { isProgressLabActive, initProgressLab, showProgressLab, hideProgressLab } from '../infra/lab/progress-lab/index.js';
import { isAILabActive, isAILabOpen, initAILab, showAILab, hideAILab } from '../infra/lab/ai-lab/index.js';
import { isLabMode, initLabHub, showLabHub, hideLabHub, isLabHubActive } from '../infra/lab/hub/index.js';
import { getAllLevels } from '../domain/progression/level-catalog.js';
import { getAllZones } from '../domain/progression/zone-catalog.js';
import { ZONE_1 } from '../domain/progression/level-catalog.js';
import { saveProgress } from '../infra/persistence/progress-storage.js';
import { G, startGame, goToSystemMap } from './init.js';
import { menuItemLayout } from '../infra/menu/draw-menu.js';
import { getSystemNodePositions } from '../infra/screens/system-map/index.js';
import { getNodePositions } from '../infra/screens/world-map/index.js';
import { CONFIG } from '../config.js';
import { AITrainer } from '../ai/index.js';

loadSettings();
loadDevConfig();

// --- Lab Hub ---
initLabHub({
  openDev: () => { hideLabHub(); showDevPanel(); },
  openMusic: () => { hideLabHub(); showMusicLab(); },
  openProgress: () => { hideLabHub(); showProgressLab(); },
  ai: () => { hideLabHub(); showAILab(); },
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
  onZoneUnlocked: (zoneId) => {
    G.ui.zoneUnlockAnim = { zoneId, frame: 0 };
  },
});

// Init AI Lab DOM
initAILab({
  onBack: () => { hideAILab(); showLabHub(); },
  levels: ZONE_1.levels,
  createTrainer: (levelId) => {
    const trainer = new AITrainer({
      startGame,
      entities: G.entities,
      session: G.session,
      canvas: CONFIG.canvas,
      levelId,
      /** Tick physique pur (sans rendu). Le ship reçoit pointerX directement. */
      tick: (pointerX) => {
        const { ship, drones, field } = G.entities;
        field.update(1);
        ship.update(pointerX, 1);
        for (const d of drones) d.update(ship, CONFIG.canvas.width, 1);
        for (const c of G.entities.capsules) c.update(CONFIG.canvas.height, 1);
        G.entities.capsules = G.entities.capsules.filter(c => c.alive);
        for (const mc of G.entities.mineralCapsules) mc.update(CONFIG.canvas.height, 1);
        G.entities.mineralCapsules = G.entities.mineralCapsules.filter(mc => mc.alive);
        if (G.alienCombat) {
          G.entities.projectiles = G.alienCombat.update(field, ship, G.entities.projectiles, 1, CONFIG.canvas);
        }
        G.collisionHandler.update();
      },
    });
    // Injecte le trainer dans la boucle de jeu pour le mode "watch"
    G.gameLoop._aiTrainer = trainer;
    return trainer;
  },
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
  get aiLab() { return isAILabOpen(); },
  get labHub() { return isLabHubActive(); },
  get wallet() { return G.wallet; },
  get upgrades() { return G.upgrades; },
  /** Force la victoire en tuant tous les astéroïdes (usage e2e / dev). */
  forceWin() {
    if (!G.entities.field) return;
    for (const a of G.entities.field.grid) a.alive = false;
  },
  /** Lance un niveau spécifique par son id (usage e2e / dev). */
  startLevel(levelId) {
    startGame(levelId);
  },
  /** Retourne les hitZones cliquables (coordonnées canvas) selon l'état courant. */
  get hitZones() {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const state = G.session.state;
    if (state === 'menu') {
      const items = ['play', 'settings', 'credits'];
      return items.map((id, i) => {
        const { y, itemH, halfW } = menuItemLayout(i);
        return { id, x: W / 2, y, w: halfW * 2, h: itemH };
      });
    }
    if (state === 'systemMap') {
      const zones = getAllZones();
      const nodes = getSystemNodePositions(W, H, zones);
      return nodes.map((n, i) => ({ id: `zone-${i}`, x: n.x, y: n.y, r: 30 }));
    }
    if (state === 'worldMap') {
      const zones = getAllZones();
      const zone = zones[G.systemMapState.selectedZone] || zones[0];
      const levels = getAllLevels(zone.id);
      const nodes = getNodePositions(W, H, levels.length);
      return nodes.map((n, i) => ({ id: `level-${i}`, x: n.x, y: n.y, r: 20 }));
    }
    return [];
  },
};

// Start
G.gameLoop.start();
