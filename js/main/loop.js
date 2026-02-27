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
  constructor({ render, entities, session, systems, ui, canvas, hud, collisionHandler, infra }) {
    this.render = render;
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.ui = ui;
    this.canvas = canvas;
    this.hud = hud;
    this.collisionHandler = collisionHandler;
    this.infra = infra;
    this.loop = this.loop.bind(this);
  }

  start() {
    this.loop();
  }

  loop() {
    const ctx = this.render.ctx;
    const { ship, drones, field } = this.entities;
    const infra = this.infra;

    this.systems.intensity.update();
    const fx = this.systems.intensity.getEffects();
    infra.setAmbientShake(fx.microShake);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    infra.updateStars(fx.starSpeed);

    document.body.classList.toggle('menu', this.session.state === 'menu' || this.session.state === 'paused');

    if (infra.isMusicLabActive()) {
      const mouse = infra.getMousePos();
      infra.handleMusicLabHover(mouse.x, mouse.y);
      infra.drawMusicLab(ctx);
      requestAnimationFrame(this.loop);
      return;
    }

    if (infra.isDevPanelActive()) {
      const mouse = infra.getMousePos();
      infra.handleDevHover(mouse.x, mouse.y);
      infra.drawDevPanel(ctx);
      requestAnimationFrame(this.loop);
      return;
    }

    if (this.session.state === 'menu') {
      const mouse = infra.getMousePos();
      infra.updateMenuHover(mouse.x, mouse.y);
      infra.updateMenu(ctx);
      requestAnimationFrame(this.loop);
      return;
    }

    if (this.session.state === 'paused') {
      field.draw(ctx);
      infra.drawShip(ctx, ship);
      for (const d of drones) infra.drawDrone(ctx, d);
      this.hud.drawHUD(fx);
      this.hud.drawPauseScreen();
      requestAnimationFrame(this.loop);
      return;
    }

    if (this.session.state === 'gameOver') {
      this.hud.drawEndScreen('GAME OVER');
      requestAnimationFrame(this.loop);
      return;
    }
    if (this.session.state === 'won') {
      this.hud.drawEndScreen('ZONE NETTOYÉE !');
      requestAnimationFrame(this.loop);
      return;
    }

    // Slow-motion
    if (this.ui.slowMoTimer > 0) {
      this.ui.slowMoTimer--;
      if (this.ui.slowMoTimer % 3 !== 0) {
        this.#drawScene(fx);
        requestAnimationFrame(this.loop);
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

    requestAnimationFrame(this.loop);
  }

  #drawScene(fx) {
    const ctx = this.render.ctx;
    const { ship, drones, field, capsules } = this.entities;
    const infra = this.infra;
    const shake = infra.updateShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    field.draw(ctx);
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
