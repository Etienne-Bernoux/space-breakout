import { CONFIG } from '../config.js';
import { updateStars } from '../infra/stars.js';
import { updateMenu, updateMenuHover, getMousePos } from '../infra/touch.js';
import { spawnTrail, updateParticles } from '../infra/particles.js';
import { updateShake } from '../infra/screenshake.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/power-up-render.js';
import { getTouchX } from '../infra/touch.js';
import { isDevPanelActive, drawDevPanel, handleDevHover } from '../infra/dev-panel/index.js';
import { isMusicLabActive, drawMusicLab, handleMusicLabHover } from '../infra/music-lab/index.js';
import { G, SLOW_MO_DURATION } from './init.js';
import { handleCollisions } from './collisions.js';
import { drawHUD, drawCombo, drawDeathLine, drawPauseButton, drawPauseScreen, drawEndScreen } from './hud.js';

export function loop() {
  G.ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  updateStars();

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
    G.drone.draw(G.ctx);
    drawHUD();
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
      if (G.ship.isMobile) drawDeathLine(G.ship);
      G.ship.draw(G.ctx);
      G.drone.draw(G.ctx);
      G.ctx.restore();
      drawHUD();
      drawPowerUpHUD(G.ctx, G.puManager.getActive(), CONFIG.canvas.width);
      drawPauseButton();
      if (G.comboFadeTimer > 0) drawCombo();
      requestAnimationFrame(loop);
      return;
    }
  }

  G.field.update();
  G.ship.update(getTouchX());
  G.drone.update(G.ship, CONFIG.canvas.width);
  if (G.drone.launched) spawnTrail(G.drone.x, G.drone.y);
  for (const c of G.capsules) c.update(CONFIG.canvas.height);
  G.capsules = G.capsules.filter(c => c.alive);
  handleCollisions();

  const shake = updateShake();
  G.ctx.save();
  G.ctx.translate(shake.x, shake.y);

  G.field.draw(G.ctx);
  updateParticles(G.ctx);
  for (const c of G.capsules) drawCapsule(G.ctx, c);
  if (G.ship.isMobile) drawDeathLine(G.ship);
  G.ship.draw(G.ctx);
  G.drone.draw(G.ctx);

  G.ctx.restore();

  drawHUD();
  drawPowerUpHUD(G.ctx, G.puManager.getActive(), CONFIG.canvas.width);
  drawPauseButton();
  if (G.comboFadeTimer > 0) drawCombo();

  requestAnimationFrame(loop);
}
