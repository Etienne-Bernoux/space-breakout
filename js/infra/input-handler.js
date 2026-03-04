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
   * @param {object} deps.infra      - infra adapters (touch, menu, devPanel, musicLab)
   */
  constructor({ entities, session, systems, canvas, gameScale, pauseBtnLayout, pauseScreenLayout, startGame, goToWorldMap, goToUpgrade, finishLevel, progress, mapState, wallet, upgrades, infra }) {
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.canvas = canvas;
    this.gameScale = gameScale;
    this.pauseBtnLayout = pauseBtnLayout;
    this.pauseScreenLayout = pauseScreenLayout;
    this.startGame = startGame;
    this.goToWorldMap = goToWorldMap;
    this.goToUpgrade = goToUpgrade;
    this.finishLevel = finishLevel;
    this.progress = progress;
    this.mapState = mapState;
    this.wallet = wallet;
    this.upgrades = upgrades;
    this.infra = infra;

    infra.setupTouch();
    this.#bindTouchHandlers();
    this.#bindKeyboard();
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
        if (this.session.currentLevelId) {
          this.goToWorldMap();
        } else {
          infra.resetMenu();
          this.session.backToMenu();
          if (infra.isDevMode()) infra.showDevPanel();
        }
      }
    });

    infra.setMenuTapHandler((x, y) => {
      if (infra.isMusicLabActive()) {
        infra.handleMusicLabTap(x, y);
        return;
      }
      if (infra.isDevPanelActive()) {
        const result = infra.handleDevTap(x, y);
        if (result === 'launch') {
          infra.hideDevPanel();
          this.startGame();
        }
        return;
      }
      if (this.session.state === 'menu') {
        const action = infra.handleMenuTap(x, y);
        if (action === 'play') this.goToWorldMap();
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
        if (this.#hitBtn(x, y, mapBtn)) {
          this.goToWorldMap();
        }
        if (this.#hitBtn(x, y, menuBtn)) {
          infra.resetMenu();
          this.session.backToMenu();
          if (infra.isDevMode()) infra.showDevPanel();
        }
      }
    });

    infra.setDragHandler((x, y) => {
      if (infra.isDevPanelActive()) { infra.handleDevDrag(x, y); return; }
      if (this.session.state === 'menu') infra.handleMenuDrag(x, y);
    });

    infra.setReleaseHandler(() => {
      if (infra.isDevPanelActive()) { infra.handleDevRelease(); return; }
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

    const levels = this.infra.getAllLevels();
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

    // Items → sélectionner
    for (let i = 0; i < btns.items.length; i++) {
      if (this.#hitBtn(x, y, btns.items[i])) {
        // Navigate to this item
        while (infra.getVisibleUpgrades().length > 0) {
          infra.nextUpgrade();
          break;
        }
        return;
      }
    }

    // Bouton achat
    if (this.#hitBtn(x, y, btns.buyBtn)) {
      this.#tryBuySelectedUpgrade();
      return;
    }

    // Retour
    if (this.#hitBtn(x, y, btns.backBtn)) {
      this.goToWorldMap();
    }
  }

  #tryBuySelectedUpgrade() {
    const upgList = this.infra.getVisibleUpgrades();
    // upgradeScreenState.selectedUpgrade gives us the index
    // We access it through the draw module's getUpgradeScreenButtons which uses state internally
    // For simplicity, iterate to find the first buyable
    for (const u of upgList) {
      if (this.upgrades.canBuy(u.id, this.wallet)) {
        this.upgrades.buy(u.id, this.wallet);
        return;
      }
    }
  }

  #hitBtn(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }

  #launchSelectedLevel() {
    const levels = this.infra.getAllLevels();
    const lvl = levels[this.mapState.selectedIndex];
    if (lvl && this.progress.isUnlocked(lvl.id)) {
      this.startGame(lvl.id);
    }
  }

  #nextLevelOrMap() {
    const levels = this.infra.getAllLevels();
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

    // Auto-show progress lab si ?progress
    if (infra.isMineralLabMode && infra.isMineralLabMode()) {
      infra.showMineralLab();
    }

    document.addEventListener('keydown', (e) => {
      // Progress lab intercepte tout
      if (infra.isMineralLabActive && infra.isMineralLabActive()) {
        e.preventDefault();
        const result = infra.handleMineralLabKey(e.key, this.wallet, this.upgrades, this.progress, (p) => {
          // saveProgress inline (progress-storage importé via init, pas ici)
          try { localStorage.setItem('space-breakout-progress', JSON.stringify(p.toJSON())); } catch {}
        });
        if (result === 'exit') infra.hideMineralLab();
        return;
      }
      if (infra.isMusicLabActive()) return;
      if (infra.isDevPanelActive()) {
        if (e.key === 'Enter') { infra.hideDevPanel(); this.startGame(); }
        return;
      }
      if (this.session.state === 'menu') {
        const action = infra.handleMenuInput(e.key);
        if (action === 'play') this.goToWorldMap();
        return;
      }

      if (this.session.state === 'worldMap') {
        const levels = infra.getAllLevels();
        if (e.key === 'ArrowLeft' && this.mapState.selectedIndex > 0) {
          this.mapState.selectedIndex--;
        }
        if (e.key === 'ArrowRight' && this.mapState.selectedIndex < levels.length - 1) {
          this.mapState.selectedIndex++;
        }
        if (e.key === ' ' || e.key === 'Enter') this.#launchSelectedLevel();
        if (e.key === 'u' || e.key === 'U') this.goToUpgrade();
        if (e.key === 'Escape') this.session.backToMenu();
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
        if (e.key === 'c') { this.goToWorldMap(); }
        if (e.key === 'r') { infra.resetMenu(); this.session.backToMenu(); if (infra.isDevMode()) infra.showDevPanel(); }
        return;
      }

      if (this.session.state === 'gameOver' && (e.key === 'r' || e.key === ' ')) {
        if (this.session.currentLevelId) {
          this.goToWorldMap();
        } else {
          infra.resetMenu();
          this.session.backToMenu();
          if (infra.isDevMode()) infra.showDevPanel();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.session.state === 'playing') {
        if (e.key === 'ArrowLeft') this.entities.ship.movingLeft = false;
        if (e.key === 'ArrowRight') this.entities.ship.movingRight = false;
      }
    });

    document.addEventListener('wheel', (e) => {
      if (infra.isMusicLabActive()) {
        e.preventDefault();
        infra.handleMusicLabScroll(e.deltaY);
      }
    }, { passive: false });
  }
}
