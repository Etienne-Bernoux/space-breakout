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
    this.loop = this.loop.bind(this);
  }

  start() {
    this.loop();
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

  #loopWorldMap(ctx, fx) {
    if (!this.ui.mapAnimPhase) this.ui.mapAnimPhase = 0;
    this.ui.mapAnimPhase++;
    this.infra.drawWorldMap(
      ctx, this.canvas.width, this.canvas.height,
      this.infra.getAllLevels(), this.progress, this.mapState.selectedIndex, this.ui.mapAnimPhase,
    );
  }

  #loopStats(ctx, fx) {
    if (!this.ui.statsAnimPhase) this.ui.statsAnimPhase = 0;
    this.ui.statsAnimPhase++;
    this.infra.drawStatsScreen(
      ctx, this.canvas.width, this.canvas.height,
      this.getLevelResult(), this.ui.statsAnimPhase,
    );
  }

  #loopPaused(ctx, fx) {
    this.#drawScene(fx);
    this.hud.drawPauseScreen();
  }

  #loopGameOver(ctx, fx) {
    const { width: W, height: H } = this.canvas;
    const t = this.ui.deathAnimTimer;
    const zc = this.ui.deathZoomCenter;

    if (t > 0) {
      this.ui.deathAnimTimer--;

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
      if (this.ui.deathDebris) this.infra.updateDebris(ctx, this.ui.deathDebris);
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
      if (this.ui.deathDebris) this.infra.updateDebris(ctx, this.ui.deathDebris);
      this.hud.drawEndScreen('GAME OVER');
    }
  }

  #loopWon(ctx, fx) {
    const ship = this.entities.ship;
    const H = this.canvas.height;
    const targetY = H / 4 - ship.height / 2;

    if (this.ui.winAnimTimer > 0) {
      this.ui.winAnimTimer--;
      // Ease-out vers le 1/3 supérieur
      ship.y += (targetY - ship.y) * 0.04;
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

  #loopPlaying(ctx, fx) {
    const { ship, drones, field } = this.entities;
    const infra = this.infra;

    // Slow-motion : skip update 2 frames sur 3
    if (this.ui.slowMoTimer > 0) {
      this.ui.slowMoTimer--;
      if (this.ui.slowMoTimer % 3 !== 0) {
        this.#drawScene(fx);
        return;
      }
    }

    field.update();
    ship.update(infra.getTouchX());
    for (const d of drones) {
      d.update(ship, this.canvas.width);
      if (d.launched) infra.spawnTrail(d.x, d.y);
    }
    for (const c of this.entities.capsules) c.update(this.canvas.height);
    this.entities.capsules = this.entities.capsules.filter(c => c.alive);
    this.collisionHandler.update();

    this.#drawScene(fx);
    infra.updateDevOverlay();
  }

  // --- Main loop ---

  loop() {
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
        worldMap: () => this.#loopWorldMap(ctx, fx),
        stats:    () => this.#loopStats(ctx, fx),
        paused:   () => this.#loopPaused(ctx, fx),
        gameOver: () => this.#loopGameOver(ctx, fx),
        won:      () => this.#loopWon(ctx, fx),
        playing:  () => this.#loopPlaying(ctx, fx),
      }[this.session.state];
      if (handler) handler();
    }

    requestAnimationFrame(this.loop);
  }

  // --- Rendering helpers ---

  #drawScene(fx) {
    const ctx = this.render.ctx;
    const { ship, drones, field, capsules } = this.entities;
    const infra = this.infra;
    const shake = infra.updateShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    infra.drawField(ctx, field);
    infra.updateParticles(ctx);
    for (const c of capsules) infra.drawCapsule(ctx, c);
    if (ship.isMobile) this.hud.drawDeathLine(ship, fx);
    infra.drawShip(ctx, ship);
    for (const d of drones) infra.drawDrone(ctx, d);
    ctx.restore();
    this.#drawVignette(ctx, fx);
    this.hud.drawHUD(fx);
    infra.drawPowerUpHUD(ctx, this.systems.powerUp.getActive(), this.canvas.width);
    this.hud.drawPauseButton();
    if (this.ui.comboFadeTimer > 0) this.hud.drawCombo();
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
