export class InputHandler {
  /**
   * @param {object} deps
   * @param {object} deps.entities   - { ship, drones }
   * @param {object} deps.session    - GameSession
   * @param {object} deps.systems    - { intensity }
   * @param {object} deps.canvas     - { width, height }
   * @param {function} deps.gameScale
   * @param {function} deps.pauseBtnLayout
   * @param {function} deps.startGame
   * @param {object} deps.infra      - infra adapters (touch, menu, devPanel, musicLab)
   */
  constructor({ entities, session, systems, canvas, gameScale, pauseBtnLayout, startGame, infra }) {
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.canvas = canvas;
    this.gameScale = gameScale;
    this.pauseBtnLayout = pauseBtnLayout;
    this.startGame = startGame;
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
    const spread = 0.8;
    unlaunched.forEach((d, i) => {
      const angle = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
      d.launchAtAngle(ship, angle);
    });
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
      if (this.session.state === 'gameOver' || this.session.state === 'won') {
        infra.resetMenu();
        this.session.backToMenu();
        if (infra.isDevMode()) infra.showDevPanel();
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
        if (action === 'play') this.startGame();
      }
      if (this.session.state === 'paused') {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const s = this.gameScale();
        const halfW = Math.round(this.canvas.width * 0.4);
        const btnH = Math.round(44 * s);
        const gap = Math.round(16 * s);
        if (x >= cx - halfW && x <= cx + halfW && y >= cy && y <= cy + btnH) {
          this.session.resume();
          this.systems.intensity.onResume();
        }
        if (x >= cx - halfW && x <= cx + halfW && y >= cy + btnH + gap && y <= cy + btnH * 2 + gap) {
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
        if (action === 'play') this.startGame();
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

      if ((this.session.state === 'gameOver' || this.session.state === 'won') && e.key === 'r') {
        infra.resetMenu();
        this.session.backToMenu();
        if (infra.isDevMode()) infra.showDevPanel();
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
