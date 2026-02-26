import { CONFIG } from '../config.js';
import { updateStars } from '../infra/stars.js';
import { getMousePos, getTouchX } from '../infra/touch.js';
import { updateMenu, updateMenuHover } from '../infra/menu/index.js';
import { spawnTrail, updateParticles } from '../infra/particles.js';
import { updateShake, setAmbientShake } from '../infra/screenshake.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/power-up-render.js';
import { isDevPanelActive, drawDevPanel, handleDevHover } from '../infra/dev-panel/index.js';
import { isMusicLabActive, drawMusicLab, handleMusicLabHover } from '../infra/music-lab/index.js';
import { isDevOverlayActive, drawDevOverlay, handleOverlayHover } from '../infra/dev-overlay/index.js';
import { G, SLOW_MO_DURATION } from './init.js';
import { handleCollisions } from './collisions.js';
import { drawHUD, drawCombo, drawDeathLine, drawPauseButton, drawPauseScreen, drawEndScreen } from './hud.js';

function drawVignette(ctx, fx) {
  if (!fx || fx.vignetteAlpha <= 0.005) return;
  const w = CONFIG.canvas.width, h = CONFIG.canvas.height;
  const [r, g, b] = fx.vignetteHue;
  const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(${r|0},${g|0},${b|0},${fx.vignetteAlpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function loop() {
  // Update intensity effects (lerp)
  G.intensityDirector.update();
  const fx = G.intensityDirector.getEffects();
  setAmbientShake(fx.microShake);

  G.ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  updateStars(fx.starSpeed);

  // Curseur adapté à l'état
  document.body.classList.toggle('menu', G.session.state === 'menu' || G.session.state === 'paused');

  if (isMusicLabActive()) {
    const mouse = getMousePos();
    handleMusicLabHover(mouse.x, mouse.y);
    drawMusicLab(G.ctx);
    requestAnimationFrame(loop);
    return;
  }

  if (isDevPanelActive()) {
    const mouse = getMousePos();
    handleDevHover(mouse.x, mouse.y);
    drawDevPanel(G.ctx);
    requestAnimationFrame(loop);
    return;
  }

  if (G.session.state === 'menu') {
    const mouse = getMousePos();
    updateMenuHover(mouse.x, mouse.y);
    updateMenu(G.ctx);
    requestAnimationFrame(loop);
    return;
  }

  if (G.session.state === 'paused') {
    G.field.draw(G.ctx);
    G.ship.draw(G.ctx);
    for (const d of G.drones) d.draw(G.ctx);
    drawHUD(fx);
    drawPauseScreen();
    requestAnimationFrame(loop);
    return;
  }

  if (G.session.state === 'gameOver') {
    drawEndScreen('GAME OVER');
    requestAnimationFrame(loop);
    return;
  }
  if (G.session.state === 'won') {
    drawEndScreen('ZONE NETTOYÉE !');
    requestAnimationFrame(loop);
    return;
  }

  // Slow-motion : on skip des frames pour ralentir le gameplay
  if (G.slowMoTimer > 0) {
    G.slowMoTimer--;
    // En slow-mo, on n'update qu'1 frame sur 3
    if (G.slowMoTimer % 3 !== 0) {
      // Mais on dessine quand même (pour l'effet visuel)
      const shake = updateShake();
      G.ctx.save();
      G.ctx.translate(shake.x, shake.y);
      G.field.draw(G.ctx);
      updateParticles(G.ctx);
      for (const c of G.capsules) drawCapsule(G.ctx, c);
      if (G.ship.isMobile) drawDeathLine(G.ship, fx);
      G.ship.draw(G.ctx);
      for (const d of G.drones) d.draw(G.ctx);
      G.ctx.restore();
      drawVignette(G.ctx, fx);
      drawHUD(fx);
      drawPowerUpHUD(G.ctx, G.puManager.getActive(), CONFIG.canvas.width);
      drawPauseButton();
      if (G.comboFadeTimer > 0) drawCombo();
      requestAnimationFrame(loop);
      return;
    }
  }

  G.field.update();
  G.ship.update(getTouchX());
  for (const d of G.drones) {
    d.update(G.ship, CONFIG.canvas.width);
    if (d.launched) spawnTrail(d.x, d.y);
  }
  for (const c of G.capsules) c.update(CONFIG.canvas.height);
  G.capsules = G.capsules.filter(c => c.alive);
  handleCollisions();

  const shake = updateShake();
  G.ctx.save();
  G.ctx.translate(shake.x, shake.y);

  G.field.draw(G.ctx);
  updateParticles(G.ctx);
  for (const c of G.capsules) drawCapsule(G.ctx, c);
  if (G.ship.isMobile) drawDeathLine(G.ship, fx);
  G.ship.draw(G.ctx);
  for (const d of G.drones) d.draw(G.ctx);

  G.ctx.restore();

  drawVignette(G.ctx, fx);
  drawHUD(fx);
  drawPowerUpHUD(G.ctx, G.puManager.getActive(), CONFIG.canvas.width);
  drawPauseButton();
  if (G.comboFadeTimer > 0) drawCombo();
  if (isDevOverlayActive()) {
    const mouse = getMousePos();
    handleOverlayHover(mouse.x, mouse.y);
    drawDevOverlay(G.ctx);
  }

  requestAnimationFrame(loop);
}
