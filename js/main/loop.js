import { CONFIG } from '../config.js';
import { updateStars } from '../infra/stars.js';
import { getMousePos, getTouchX } from '../infra/touch.js';
import { updateMenu, updateMenuHover } from '../infra/menu/index.js';
import { spawnTrail, updateParticles } from '../infra/particles.js';
import { updateShake, setAmbientShake } from '../infra/screenshake.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/power-up-render.js';
import { isDevPanelActive, drawDevPanel, handleDevHover } from '../infra/dev-panel/index.js';
import { isMusicLabActive, drawMusicLab, handleMusicLabHover } from '../infra/music-lab/index.js';
import { updateDevOverlay } from '../infra/dev-overlay/index.js';

export class GameLoop {
  /**
   * @param {object} deps
   * @param {object} deps.render     - { ctx }
   * @param {object} deps.entities   - { ship, drones, field, capsules }
   * @param {object} deps.session    - GameSession
   * @param {object} deps.systems    - { intensity, powerUp }
   * @param {object} deps.ui         - { slowMoTimer, comboFadeTimer }
   * @param {object} deps.canvas     - CONFIG.canvas
   * @param {object} deps.hud        - HudRenderer instance
   * @param {object} deps.collisionHandler - CollisionHandler instance
   */
  constructor({ render, entities, session, systems, ui, canvas, hud, collisionHandler }) {
    this.render = render;
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.ui = ui;
    this.canvas = canvas;
    this.hud = hud;
    this.collisionHandler = collisionHandler;
    this.loop = this.loop.bind(this);
  }

  start() {
    this.loop();
  }

  loop() {
    const ctx = this.render.ctx;
    const { ship, drones, field } = this.entities;

    this.systems.intensity.update();
    const fx = this.systems.intensity.getEffects();
    setAmbientShake(fx.microShake);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    updateStars(fx.starSpeed);

    document.body.classList.toggle('menu', this.session.state === 'menu' || this.session.state === 'paused');

    if (isMusicLabActive()) {
      const mouse = getMousePos();
      handleMusicLabHover(mouse.x, mouse.y);
      drawMusicLab(ctx);
      requestAnimationFrame(this.loop);
      return;
    }

    if (isDevPanelActive()) {
      const mouse = getMousePos();
      handleDevHover(mouse.x, mouse.y);
      drawDevPanel(ctx);
      requestAnimationFrame(this.loop);
      return;
    }

    if (this.session.state === 'menu') {
      const mouse = getMousePos();
      updateMenuHover(mouse.x, mouse.y);
      updateMenu(ctx);
      requestAnimationFrame(this.loop);
      return;
    }

    if (this.session.state === 'paused') {
      field.draw(ctx);
      ship.draw(ctx);
      for (const d of drones) d.draw(ctx);
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
    ship.update(getTouchX());
    for (const d of drones) {
      d.update(ship, this.canvas.width);
      if (d.launched) spawnTrail(d.x, d.y);
    }
    for (const c of this.entities.capsules) c.update(this.canvas.height);
    this.entities.capsules = this.entities.capsules.filter(c => c.alive);
    this.collisionHandler.update();

    this.#drawScene(fx);
    updateDevOverlay();

    requestAnimationFrame(this.loop);
  }

  #drawScene(fx) {
    const ctx = this.render.ctx;
    const { ship, drones, field, capsules } = this.entities;
    const shake = updateShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    field.draw(ctx);
    updateParticles(ctx);
    for (const c of capsules) drawCapsule(ctx, c);
    if (ship.isMobile) this.hud.drawDeathLine(ship, fx);
    ship.draw(ctx);
    for (const d of drones) d.draw(ctx);
    ctx.restore();
    this.#drawVignette(ctx, fx);
    this.hud.drawHUD(fx);
    drawPowerUpHUD(ctx, this.systems.powerUp.getActive(), this.canvas.width);
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
