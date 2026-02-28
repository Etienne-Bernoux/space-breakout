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
  constructor({ entities, session, systems, canvas, gameScale, pauseBtnLayout, pauseScreenLayout, startGame, goToWorldMap, finishLevel, progress, mapState, infra }) {
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.canvas = canvas;
    this.gameScale = gameScale;
    this.pauseBtnLayout = pauseBtnLayout;
    this.pauseScreenLayout = pauseScreenLayout;
    this.startGame = startGame;
    this.goToWorldMap = goToWorldMap;
    this.finishLevel = finishLevel;
    this.progress = progress;
    this.mapState = mapState;
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
      if (this.session.state === 'stats') {
        this.#handleStatsTap(x, y);
      }
      if (this.session.state === 'paused') {
        const { resumeBtn, menuBtn } = this.pauseScreenLayout();
        if (x >= resumeBtn.x && x <= resumeBtn.x + resumeBtn.w && y >= resumeBtn.y && y <= resumeBtn.y + resumeBtn.h) {
          this.session.resume();
          this.systems.intensity.onResume();
        }
        if (x >= menuBtn.x && x <= menuBtn.x + menuBtn.w && y >= menuBtn.y && y <= menuBtn.y + menuBtn.h) {
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

    document.addEventListener('keydown', (e) => {
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
        if (e.key === 'Escape') this.session.backToMenu();
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
