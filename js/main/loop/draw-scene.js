// --- Rendu de la scène de jeu + vignette ---

export function drawScene(gl, fx, dt = 1) {
  const ctx = gl.render.ctx;
  const { ship, drones, field, capsules } = gl.entities;
  const infra = gl.infra;
  const shake = infra.updateShake(dt);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  infra.drawField(ctx, field);
  infra.updateParticles(ctx, dt);
  for (const c of capsules) infra.drawCapsule(ctx, c);
  for (const mc of gl.entities.mineralCapsules) infra.drawMineralCapsule(ctx, mc);
  for (const p of gl.entities.projectiles) infra.drawProjectile(ctx, p);
  if (gl.entities.missiles) {
    for (const m of gl.entities.missiles) infra.drawMissile?.(ctx, m);
  }
  if (ship.isMobile) gl.hud.drawDeathLine(ship, fx);
  infra.drawShip(ctx, ship);
  for (const d of drones) infra.drawDrone(ctx, d);
  ctx.restore();
  drawVignette(gl, ctx, fx);
  gl.hud.drawHUD(fx);
  infra.drawPowerUpHUD(ctx, gl.systems.powerUp.getActive(), gl.canvas.width);
  if (infra.drawMineralHUD) infra.drawMineralHUD(ctx, gl.canvas.width, gl.canvas.height);
  // Consommables HUD
  const cs = gl.consumableSession;
  if (cs) {
    infra.drawSafetyNetLine?.(ctx, gl.canvas.width, gl.canvas.height, cs.hasCharge('safetyNet'));
    infra.drawConsumableHUD?.(ctx, cs.getActiveConsumables(), gl.canvas.width, gl.canvas.height);
  }
  gl.hud.drawPauseButton();
  if (gl._devAIPlayer) gl.hud.drawAIBadge();
  if (gl.ui.comboFadeTimer > 0) gl.hud.drawCombo(dt);
}

function drawVignette(gl, ctx, fx) {
  if (!fx || fx.vignetteAlpha <= 0.005) return;
  const w = gl.canvas.width, h = gl.canvas.height;
  const [r, g, b] = fx.vignetteHue;
  const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(${r|0},${g|0},${b|0},${fx.vignetteAlpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
