export class GameLoop {
  /**
   * @param {object} deps
   * @param {object} deps.render     - { ctx }
   * @param {object} deps.entities   - { ship, drones, field, capsules }
   * @param {object} deps.session    - GameSession
   * @param {object} deps.systems    - { intensity, powerUp }
   * @param {object} deps.ui         - { slowMoTimer, comboFadeTimer }
   * @param {object} deps.canvas     - { width, height }
   * @param {object} deps.hud        - HudRenderer instance
   * @param {object} deps.collisionHandler - CollisionHandler instance
   * @param {object} deps.infra      - infra adapters (stars, touch, menu, particles, shake, renderers, panels, devOverlay)
   */
  constructor({ render, entities, session, systems, ui, canvas, hud, collisionHandler, infra, progress, mapState, getLevelResult }) {
    this.render = render;
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.ui = ui;
    this.canvas = canvas;
    this.hud = hud;
    this.collisionHandler = collisionHandler;
    this.infra = infra;
    this.progress = progress;
    this.mapState = mapState;
    this.getLevelResult = getLevelResult;
    this.lastTime = 0;
    this.loop = this.loop.bind(this);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  // --- State handlers (chaque état a sa propre logique) ---

  #loopMusicLab(ctx, fx) {
    const mouse = this.infra.getMousePos();
    this.infra.handleMusicLabHover(mouse.x, mouse.y);
    this.infra.drawMusicLab(ctx);
  }

  #loopDevPanel(ctx, fx) {
    const mouse = this.infra.getMousePos();
    this.infra.handleDevHover(mouse.x, mouse.y);
    this.infra.drawDevPanel(ctx);
  }

  #loopMenu(ctx, fx) {
    const mouse = this.infra.getMousePos();
    this.infra.updateMenuHover(mouse.x, mouse.y);
    this.infra.updateMenu(ctx);
  }

  #loopWorldMap(ctx, fx, dt) {
    if (!this.ui.mapAnimPhase) this.ui.mapAnimPhase = 0;
    this.ui.mapAnimPhase += dt;
    this.infra.drawWorldMap(
      ctx, this.canvas.width, this.canvas.height,
      this.infra.getAllLevels(), this.progress, this.mapState.selectedIndex, this.ui.mapAnimPhase,
    );
  }

  #loopStats(ctx, fx, dt) {
    if (!this.ui.statsAnimPhase) this.ui.statsAnimPhase = 0;
    this.ui.statsAnimPhase += dt;
    this.infra.drawStatsScreen(
      ctx, this.canvas.width, this.canvas.height,
      this.getLevelResult(), this.ui.statsAnimPhase,
    );
  }

  #loopPaused(ctx, fx) {
    this.#drawScene(fx);
    this.hud.drawPauseScreen();
  }

  #loopGameOver(ctx, fx, dt) {
    const { width: W, height: H } = this.canvas;
    const t = this.ui.deathAnimTimer;
    const zc = this.ui.deathZoomCenter;

    if (t > 0) {
      this.ui.deathAnimTimer -= dt;

      // Zoom ×1→×2 sur toute la durée (ease-out)
      const p = (240 - t) / 240;                // 0 → 1
      const scale = 1 + (1 - (1 - p) * (1 - p)); // ease-out quadratic → 1 → 2

      // Le ship doit apparaître à l'écran en (W/2, H*3/5).
      // On translate pour mapper zc (position réelle) → cible écran.
      const targetX = W / 2;
      const targetY = H * 3 / 5;
      const offsetX = (targetX - zc.x * scale);
      const offsetY = (targetY - zc.y * scale);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      this.#drawScene(fx);
      if (this.ui.deathDebris) this.infra.updateDebris(ctx, this.ui.deathDebris, dt);
      ctx.restore();

      // Overlay progressif
      const alpha = 0.7 * (1 - t / 240);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Écran game over : fond + débris + texte
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      this.infra.updateStars(0.2);
      if (this.ui.deathDebris) this.infra.updateDebris(ctx, this.ui.deathDebris, dt);
      this.hud.drawEndScreen('GAME OVER');
    }
  }

  #loopWon(ctx, fx, dt) {
    const ship = this.entities.ship;
    const H = this.canvas.height;
    const targetY = H / 4 - ship.height / 2;

    if (this.ui.winAnimTimer > 0) {
      this.ui.winAnimTimer -= dt;
      // Ease-out vers le 1/3 supérieur
      ship.y += (targetY - ship.y) * (1 - Math.pow(1 - 0.04, dt));
      this.#drawScene(fx);
    } else {
      // Animation terminée → transition vers stats (si level mode)
      if (this.session.currentLevelId && this.infra.finishLevel) {
        this.ui.statsAnimPhase = 0;
        this.infra.finishLevel();
      } else {
        ship.y = targetY;
        this.hud.drawEndScreen('ZONE NETTOYÉE !');
        this.infra.drawShip(ctx, ship);
      }
    }
  }

  #loopPlaying(ctx, fx, dt) {
    const { ship, drones, field } = this.entities;
    const infra = this.infra;

    // Slow-motion : ralentit le dt au lieu de skip des frames
    let dtEff = dt;
    if (this.ui.slowMoTimer > 0) {
      this.ui.slowMoTimer -= dt;
      dtEff = dt * 0.33;
    }

    field.update(dtEff);
    ship.update(infra.getTouchX(), dtEff);
    for (const d of drones) {
      d.update(ship, this.canvas.width, dtEff);
      if (d.launched) infra.spawnTrail(d.x, d.y);
    }
    for (const c of this.entities.capsules) c.update(this.canvas.height, dtEff);
    this.entities.capsules = this.entities.capsules.filter(c => c.alive);
    this.collisionHandler.update();

    this.#drawScene(fx, dtEff);
    infra.updateDevOverlay();
  }

  // --- Main loop ---

  loop(now = performance.now()) {
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 16.667, 3) : 1;
    this.lastTime = now;

    const ctx = this.render.ctx;

    this.systems.intensity.update();
    const fx = this.systems.intensity.getEffects();
    this.infra.setAmbientShake(fx.microShake);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.infra.updateStars(fx.starSpeed);

    document.body.classList.toggle('menu', ['menu', 'paused', 'worldMap', 'stats'].includes(this.session.state));

    // Overlays prioritaires (interceptent tous les états)
    if (this.infra.isMusicLabActive()) {
      this.#loopMusicLab(ctx, fx);
    } else if (this.infra.isDevPanelActive()) {
      this.#loopDevPanel(ctx, fx);
    } else {
      // Dispatch par état de jeu
      const handler = {
        menu:     () => this.#loopMenu(ctx, fx),
        worldMap: () => this.#loopWorldMap(ctx, fx, dt),
        stats:    () => this.#loopStats(ctx, fx, dt),
        paused:   () => this.#loopPaused(ctx, fx),
        gameOver: () => this.#loopGameOver(ctx, fx, dt),
        won:      () => this.#loopWon(ctx, fx, dt),
        playing:  () => this.#loopPlaying(ctx, fx, dt),
      }[this.session.state];
      if (handler) handler();
    }

    requestAnimationFrame(this.loop);
  }

  // --- Rendering helpers ---

  #drawScene(fx, dt = 1) {
    const ctx = this.render.ctx;
    const { ship, drones, field, capsules } = this.entities;
    const infra = this.infra;
    const shake = infra.updateShake(dt);
    ctx.save();
    ctx.translate(shake.x, shake.y);
    infra.drawField(ctx, field);
    infra.updateParticles(ctx, dt);
    for (const c of capsules) infra.drawCapsule(ctx, c);
    if (ship.isMobile) this.hud.drawDeathLine(ship, fx);
    infra.drawShip(ctx, ship);
    for (const d of drones) infra.drawDrone(ctx, d);
    ctx.restore();
    this.#drawVignette(ctx, fx);
    this.hud.drawHUD(fx);
    infra.drawPowerUpHUD(ctx, this.systems.powerUp.getActive(), this.canvas.width);
    this.hud.drawPauseButton();
    if (this.ui.comboFadeTimer > 0) this.hud.drawCombo(dt);
  }

  #drawVignette(ctx, fx) {
    if (!fx || fx.vignetteAlpha <= 0.005) return;
    const w = this.canvas.width, h = this.canvas.height;
    const [r, g, b] = fx.vignetteHue;
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(${r|0},${g|0},${b|0},${fx.vignetteAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}
