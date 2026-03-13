// --- InputHandler : façade (dossier-module) ---
// Orchestre pointer + keyboard handlers via DI groupée.

import { bindPointerHandlers, hitBtn } from './pointer-handlers.js';
import { bindKeyboardHandlers } from './keyboard-handlers.js';

export class InputHandler {
  /**
   * @param {object} deps
   * @param {object} deps.entities   - { ship, drones }
   * @param {object} deps.session    - GameSession
   * @param {object} deps.systems    - { intensity }
   * @param {object} deps.canvas     - { width, height }
   * @param {function} deps.gameScale
   * @param {function} deps.pauseBtnLayout
   * @param {function} deps.pauseScreenLayout
   * @param {function} deps.startGame
   * @param {object} deps.nav        - { goToWorldMap, goToUpgrade, goToSystemMap, finishLevel }
   * @param {object} deps.progression - { progress, mapState, systemMapState, wallet, upgrades }
   * @param {object} deps.infra      - infra adapters
   */
  constructor({ entities, session, systems, canvas, gameScale, pauseBtnLayout, pauseScreenLayout, startGame, nav, progression, infra, getLevelResult }) {
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.canvas = canvas;
    this.gameScale = gameScale;
    this.pauseBtnLayout = pauseBtnLayout;
    this.pauseScreenLayout = pauseScreenLayout;
    this.startGame = startGame;
    this.goToWorldMap = nav.goToWorldMap;
    this.goToUpgrade = nav.goToUpgrade;
    this.goToSystemMap = nav.goToSystemMap;
    this.finishLevel = nav.finishLevel;
    this.progress = progression.progress;
    this.mapState = progression.mapState;
    this.systemMapState = progression.systemMapState;
    this.wallet = progression.wallet;
    this.upgrades = progression.upgrades;
    this.infra = infra;
    this.getLevelResult = getLevelResult || (() => null);

    infra.setupPointer();
    bindPointerHandlers(this);
    bindKeyboardHandlers(this);
  }

  // --- Méthodes publiques utilisées par les handlers ---

  /** Retourne le zoneId courant basé sur systemMapState. */
  currentZoneId() {
    const zones = this.infra.getAllZones();
    const zone = zones[this.systemMapState.selectedZone];
    return zone ? zone.id : 'zone1';
  }

  launchAllDrones() {
    const { ship, drones } = this.entities;
    const unlaunched = drones.filter(d => !d.launched);
    if (unlaunched.length === 0) return false;
    const n = unlaunched.length;
    if (n === 1) {
      unlaunched[0].launch(ship);
    } else {
      const spread = 0.8;
      unlaunched.forEach((d, i) => {
        const angle = -spread / 2 + (spread * i) / (n - 1);
        d.launchAtAngle(ship, angle);
      });
    }
    return true;
  }

  backToDevPanel() {
    this.infra.resetMenu();
    this.session.backToMenu();
    this.infra.showDevPanel();
  }

  enterSelectedZone() {
    const zones = this.infra.getAllZones();
    const zone = zones[this.systemMapState.selectedZone];
    if (zone && this.progress.isZoneUnlocked(zone.id)) {
      this.mapState.selectedIndex = 0;
      this.goToWorldMap();
    }
  }

  launchSelectedLevel() {
    const levels = this.infra.getAllLevels(this.currentZoneId());
    const lvl = levels[this.mapState.selectedIndex];
    if (lvl && this.progress.isUnlocked(lvl.id)) {
      if (this.infra.isProgressLabActive()) {
        this.infra.showSimulatorModal(this.mapState.selectedIndex);
        return;
      }
      this.startGame(lvl.id);
    }
  }

  tryBuySelectedUpgrade() {
    const upgList = this.infra.getVisibleUpgrades();
    const idx = this.infra.getSelectedUpgradeIndex();
    const u = upgList[idx];
    if (!u) return;
    if (this.upgrades.canBuy(u.id, this.wallet)) {
      if (this.upgrades.buy(u.id, this.wallet)) {
        this.systems.intensity.onUpgradePurchased();
      }
    }
  }

  statsToMap() {
    const result = this.getLevelResult();
    if (result?.zoneUnlocked) {
      const zones = this.infra.getAllZones();
      const idx = zones.findIndex(z => z.id === result.zoneUnlocked);
      if (idx >= 0) this.systemMapState.selectedZone = idx;
      this.goToSystemMap();
    } else {
      this.goToWorldMap();
    }
  }

  nextLevelOrMap() {
    const result = this.getLevelResult();
    if (result?.zoneUnlocked) {
      this.statsToMap();
      return;
    }
    const levels = this.infra.getAllLevels(this.currentZoneId());
    const nextIdx = this.mapState.selectedIndex + 1;
    if (nextIdx < levels.length && this.progress.isUnlocked(levels[nextIdx].id)) {
      this.mapState.selectedIndex = nextIdx;
      this.startGame(levels[nextIdx].id);
    } else {
      this.goToWorldMap();
    }
  }
}
