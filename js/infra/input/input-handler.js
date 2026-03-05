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
   * @param {object} deps.infra      - infra adapters (touch, menu, devPanel, musicLab)
   */
  constructor({ entities, session, systems, canvas, gameScale, pauseBtnLayout, pauseScreenLayout, startGame, nav, progression, infra }) {
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

    infra.setupTouch();
    this.#bindTouchHandlers();
    this.#bindKeyboard();
  }

  /** Retourne le zoneId courant basé sur systemMapState. */
  #currentZoneId() {
    const zones = this.infra.getAllZones();
    const zone = zones[this.systemMapState.selectedZone];
    return zone ? zone.id : 'zone1';
  }

  #launchAllDrones() {
    const { ship, drones } = this.entities;
    const unlaunched = drones.filter(d => !d.launched);
    if (unlaunched.length === 0) return false;
    const n = unlaunched.length;
    if (n === 1) {
      // Un seul drone : launch() utilise la position sur la raquette (sticky ou centré)
      unlaunched[0].launch(ship);
    } else {
      // Multi-drone : éventail
      const spread = 0.8;
      unlaunched.forEach((d, i) => {
        const angle = -spread / 2 + (spread * i) / (n - 1);
        d.launchAtAngle(ship, angle);
      });
    }
    return true;
  }

  #backToDevPanel() {
    this.infra.resetMenu();
    this.session.backToMenu();
    this.infra.showDevPanel();
  }

  #bindTouchHandlers() {
    const infra = this.infra;

    infra.setTapHandler((x, y) => {
      if (this.session.state === 'playing') {
        const pb = this.pauseBtnLayout();
        if (x >= pb.x && x <= pb.x + pb.size &&
            y >= pb.y && y <= pb.y + pb.size) {
          this.session.pause();
          this.systems.intensity.onPause();
          return;
        }
        if (this.#launchAllDrones()) this.systems.intensity.onLaunch();
      }
      if (this.session.state === 'gameOver') {
        if (infra.isLabMode()) {
          this.#backToDevPanel();
        } else if (this.session.currentLevelId) {
          this.goToWorldMap();
        } else {
          infra.resetMenu();
          this.session.backToMenu();
        }
      }
    });

    infra.setMenuTapHandler((x, y) => {
      // Lab panels gèrent leurs propres events DOM
      if (infra.isLabHubActive()) return;
      if (infra.isMusicLabActive()) return;
      if (infra.isDevPanelActive()) return;
      if (this.session.state === 'menu') {
        const action = infra.handleMenuTap(x, y);
        if (action === 'play') this.goToSystemMap();
      }
      if (this.session.state === 'systemMap') {
        this.#handleSystemMapTap(x, y);
      }
      if (this.session.state === 'worldMap') {
        this.#handleWorldMapTap(x, y);
      }
      if (this.session.state === 'upgrade') {
        this.#handleUpgradeTap(x, y);
      }
      if (this.session.state === 'stats') {
        this.#handleStatsTap(x, y);
      }
      if (this.session.state === 'paused') {
        const { resumeBtn, mapBtn, menuBtn } = this.pauseScreenLayout();
        if (this.#hitBtn(x, y, resumeBtn)) {
          this.session.resume();
          this.systems.intensity.onResume();
        }
        if (infra.isLabMode()) {
          // En dev mode, mapBtn = "DEV PANEL", pas de menuBtn
          if (this.#hitBtn(x, y, mapBtn)) this.#backToDevPanel();
        } else {
          if (this.#hitBtn(x, y, mapBtn)) this.goToWorldMap();
          if (this.#hitBtn(x, y, menuBtn)) {
            infra.resetMenu();
            this.session.backToMenu();
          }
        }
      }
    });

    infra.setDragHandler((x, y) => {
      if (infra.isDevPanelActive()) return; // DOM handles it
      if (this.session.state === 'menu') infra.handleMenuDrag(x, y);
    });

    infra.setReleaseHandler(() => {
      if (infra.isDevPanelActive()) return; // DOM handles it
      infra.handleMenuRelease();
    });
  }

  #handleWorldMapTap(x, y) {
    // Bouton ATELIER
    const atelierBtn = this.infra.getUpgradeButtonRect(this.canvas.width, this.canvas.height);
    if (this.#hitBtn(x, y, atelierBtn)) {
      this.goToUpgrade();
      return;
    }

    const levels = this.infra.getAllLevels(this.#currentZoneId());
    const nodes = this.infra.getNodePositions(this.canvas.width, this.canvas.height, levels.length);
    const r = 22;
    for (let i = 0; i < nodes.length; i++) {
      const dx = x - nodes[i].x, dy = y - nodes[i].y;
      if (dx * dx + dy * dy < r * r && this.progress.isUnlocked(levels[i].id)) {
        this.mapState.selectedIndex = i;
        this.#launchSelectedLevel();
        return;
      }
    }
  }

  #handleSystemMapTap(x, y) {
    const zones = this.infra.getAllZones();
    const nodes = this.infra.getSystemNodePositions(this.canvas.width, this.canvas.height, zones);
    const r = 28;
    for (let i = 0; i < nodes.length; i++) {
      const dx = x - nodes[i].x, dy = y - nodes[i].y;
      if (dx * dx + dy * dy < r * r && this.progress.isZoneUnlocked(zones[i].id)) {
        this.systemMapState.selectedZone = i;
        this.#enterSelectedZone();
        return;
      }
    }
  }

  #enterSelectedZone() {
    const zones = this.infra.getAllZones();
    const zone = zones[this.systemMapState.selectedZone];
    if (zone && this.progress.isZoneUnlocked(zone.id)) {
      this.mapState.selectedIndex = 0;
      this.goToWorldMap();
    }
  }

  #handleStatsTap(x, y) {
    const btns = this.infra.getStatsButtons(this.canvas.width, this.canvas.height);
    if (this.#hitBtn(x, y, btns.next)) {
      this.#nextLevelOrMap();
    } else if (this.#hitBtn(x, y, btns.map)) {
      this.goToWorldMap();
    }
  }

  #handleUpgradeTap(x, y) {
    const infra = this.infra;
    const upgList = infra.getVisibleUpgrades();
    const btns = infra.getUpgradeScreenButtons(this.canvas.width, this.canvas.height, upgList.length);

    // Onglets catégorie
    for (let i = 0; i < btns.tabs.length; i++) {
      if (this.#hitBtn(x, y, btns.tabs[i])) {
        infra.nextCategory();
        return;
      }
    }

    // Bouton achat (testé avant les items car inclus dans la zone item)
    if (this.#hitBtn(x, y, btns.buyBtn)) {
      this.#tryBuySelectedUpgrade();
      return;
    }

    // Items → sélectionner l'item cliqué
    for (let i = 0; i < btns.items.length; i++) {
      if (this.#hitBtn(x, y, btns.items[i])) {
        infra.selectUpgrade(i);
        return;
      }
    }

    // Retour
    if (this.#hitBtn(x, y, btns.backBtn)) {
      this.goToWorldMap();
    }
  }

  #tryBuySelectedUpgrade() {
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

  #hitBtn(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }

  #launchSelectedLevel() {
    const levels = this.infra.getAllLevels(this.#currentZoneId());
    const lvl = levels[this.mapState.selectedIndex];
    if (lvl && this.progress.isUnlocked(lvl.id)) {
      // En mode progress lab → ouvrir le simulateur au lieu de lancer la partie
      if (this.infra.isProgressLabActive()) {
        this.infra.showSimulatorModal(this.mapState.selectedIndex);
        return;
      }
      this.startGame(lvl.id);
    }
  }

  #nextLevelOrMap() {
    const levels = this.infra.getAllLevels(this.#currentZoneId());
    const nextIdx = this.mapState.selectedIndex + 1;
    if (nextIdx < levels.length && this.progress.isUnlocked(levels[nextIdx].id)) {
      this.mapState.selectedIndex = nextIdx;
      this.startGame(levels[nextIdx].id);
    } else {
      this.goToWorldMap();
    }
  }

  #bindKeyboard() {
    const infra = this.infra;

    document.addEventListener('keydown', (e) => {
      // Les panels DOM gèrent leurs propres events (Escape, Enter, etc.)
      if (infra.isSimulatorOpen && infra.isSimulatorOpen()) return;
      if (infra.isMusicLabActive()) return;
      if (infra.isDevPanelActive()) return;
      if (this.session.state === 'menu') {
        const action = infra.handleMenuInput(e.key);
        if (action === 'play') this.goToSystemMap();
        return;
      }

      if (this.session.state === 'systemMap') {
        const zones = infra.getAllZones();
        if (e.key === 'ArrowLeft' && this.systemMapState.selectedZone > 0) {
          this.systemMapState.selectedZone--;
        }
        if (e.key === 'ArrowRight' && this.systemMapState.selectedZone < zones.length - 1) {
          this.systemMapState.selectedZone++;
        }
        if (e.key === ' ' || e.key === 'Enter') this.#enterSelectedZone();
        if (e.key === 'Escape' && !infra.isProgressLabActive()) {
          this.session.backToMenu();
        }
        return;
      }

      if (this.session.state === 'worldMap') {
        const levels = infra.getAllLevels(this.#currentZoneId());
        if (e.key === 'ArrowLeft' && this.mapState.selectedIndex > 0) {
          this.mapState.selectedIndex--;
        }
        if (e.key === 'ArrowRight' && this.mapState.selectedIndex < levels.length - 1) {
          this.mapState.selectedIndex++;
        }
        if (e.key === ' ' || e.key === 'Enter') this.#launchSelectedLevel();
        if (e.key === 'u' || e.key === 'U') this.goToUpgrade();
        if (e.key === 'Escape') this.goToSystemMap();
        return;
      }

      if (this.session.state === 'upgrade') {
        if (e.key === 'ArrowLeft') infra.prevCategory();
        if (e.key === 'ArrowRight') infra.nextCategory();
        if (e.key === 'ArrowUp') infra.prevUpgrade();
        if (e.key === 'ArrowDown') infra.nextUpgrade();
        if (e.key === ' ' || e.key === 'Enter') this.#tryBuySelectedUpgrade();
        if (e.key === 'Escape') this.goToWorldMap();
        return;
      }

      if (this.session.state === 'stats') {
        if (e.key === ' ' || e.key === 'Enter') this.#nextLevelOrMap();
        if (e.key === 'Escape') this.goToWorldMap();
        return;
      }

      if (this.session.state === 'playing') {
        if (e.key === 'ArrowLeft') this.entities.ship.movingLeft = true;
        if (e.key === 'ArrowRight') this.entities.ship.movingRight = true;
        if (e.key === ' ') { if (this.#launchAllDrones()) this.systems.intensity.onLaunch(); }
        if (e.key === 'Escape') { this.session.pause(); this.systems.intensity.onPause(); return; }
      }

      if (this.session.state === 'paused') {
        if (e.key === 'Escape') { this.session.resume(); this.systems.intensity.onResume(); }
        if (infra.isLabMode()) {
          if (e.key === 'r') this.#backToDevPanel();
        } else {
          if (e.key === 'c') this.goToWorldMap();
          if (e.key === 'r') { infra.resetMenu(); this.session.backToMenu(); }
        }
        return;
      }

      if (this.session.state === 'gameOver' && (e.key === 'r' || e.key === ' ')) {
        if (infra.isLabMode()) {
          this.#backToDevPanel();
        } else if (this.session.currentLevelId) {
          this.goToWorldMap();
        } else {
          infra.resetMenu();
          this.session.backToMenu();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.session.state === 'playing') {
        if (e.key === 'ArrowLeft') this.entities.ship.movingLeft = false;
        if (e.key === 'ArrowRight') this.entities.ship.movingRight = false;
      }
    });

    // Music lab scroll est géré nativement par le DOM (overflow-y: auto)
  }
}
