// --- Handlers d'état du jeu (1 fonction par état) ---

import { drawScene } from './draw-scene.js';

// ── Menu ──

export function loopMenu(gl, ctx, fx) {
  if (gl.infra.isLabHubActive && gl.infra.isLabHubActive()) return;
  const mouse = gl.infra.getMousePos();
  gl.infra.updateMenuHover(mouse.x, mouse.y);
  gl.infra.updateMenu(ctx);
}

// ── System Map ──

export function loopSystemMap(gl, ctx, fx, dt) {
  if (!gl.ui.mapAnimPhase) gl.ui.mapAnimPhase = 0;
  gl.ui.mapAnimPhase += dt;

  // Init animation unlock si on arrive sur systemMap avec un zoneUnlocked
  const result = gl.getLevelResult ? gl.getLevelResult() : null;
  if (result?.zoneUnlocked && !gl.ui.zoneUnlockAnim) {
    gl.ui.zoneUnlockAnim = { zoneId: result.zoneUnlocked, frame: 0 };
  }
  // Avancer l'animation
  let unlockAnim = null;
  if (gl.ui.zoneUnlockAnim) {
    gl.ui.zoneUnlockAnim.frame += dt;
    unlockAnim = gl.ui.zoneUnlockAnim;
    if (unlockAnim.frame > 120) {
      gl.ui.zoneUnlockAnim = null;
      if (result) result.zoneUnlocked = null;
    }
  }

  gl.infra.drawSystemMap(
    ctx, gl.canvas.width, gl.canvas.height,
    gl.infra.getAllZones(), gl.progress, gl.systemMapState.selectedZone, gl.ui.mapAnimPhase, unlockAnim,
  );
}

// ── World Map ──

export function loopWorldMap(gl, ctx, fx, dt) {
  if (!gl.ui.mapAnimPhase) gl.ui.mapAnimPhase = 0;
  gl.ui.mapAnimPhase += dt;
  const zones = gl.infra.getAllZones();
  const zone = zones[gl.systemMapState.selectedZone] || zones[0];
  gl.infra.drawWorldMap(
    ctx, gl.canvas.width, gl.canvas.height,
    gl.infra.getAllLevels(zone.id), gl.progress, gl.mapState.selectedIndex, gl.ui.mapAnimPhase, zone,
  );
}

// ── Map Transition (zoom systemMap ↔ worldMap) ──

export function loopMapTransition(gl, ctx, fx, dt) {
  const tr = gl.ui.mapTransition;
  tr.frame += dt;
  const p = Math.min(tr.frame / tr.duration, 1);
  const ease = 1 - Math.pow(1 - p, 3);
  const { width: W, height: H } = gl.canvas;

  const zones = gl.infra.getAllZones();
  const nodes = gl.infra.getSystemNodePositions(W, H, zones);
  const focal = nodes[tr.zoneIdx] || { x: W / 2, y: H / 2 };

  if (tr.type === 'zoomIn') {
    if (ease < 0.5) {
      const subP = ease / 0.5;
      const scale = 1 + subP * 1.5;
      const alpha = 1 - subP;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(focal.x * (1 - scale), focal.y * (1 - scale));
      ctx.scale(scale, scale);
      drawSystemMapRaw(gl, ctx, dt);
      ctx.restore();
    } else {
      const subP = (ease - 0.5) / 0.5;
      const scale = 2.5 - subP * 1.5;
      const alpha = subP;
      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = W / 2, cy = H / 2;
      ctx.translate(cx * (1 - scale), cy * (1 - scale));
      ctx.scale(scale, scale);
      drawWorldMapRaw(gl, ctx, dt);
      ctx.restore();
    }
  } else {
    if (ease < 0.5) {
      const subP = ease / 0.5;
      const scale = 1 - subP * 0.5;
      const alpha = 1 - subP;
      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = W / 2, cy = H / 2;
      ctx.translate(cx * (1 - scale), cy * (1 - scale));
      ctx.scale(scale, scale);
      drawWorldMapRaw(gl, ctx, dt);
      ctx.restore();
    } else {
      const subP = (ease - 0.5) / 0.5;
      const scale = 2.5 - subP * 1.5;
      const alpha = subP;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(focal.x * (1 - scale), focal.y * (1 - scale));
      ctx.scale(scale, scale);
      drawSystemMapRaw(gl, ctx, dt);
      ctx.restore();
    }
  }

  if (p >= 1) gl.ui.mapTransition = null;
}

function drawSystemMapRaw(gl, ctx, dt) {
  if (!gl.ui.mapAnimPhase) gl.ui.mapAnimPhase = 0;
  gl.ui.mapAnimPhase += dt * 0.5;
  gl.infra.drawSystemMap(
    ctx, gl.canvas.width, gl.canvas.height,
    gl.infra.getAllZones(), gl.progress, gl.systemMapState.selectedZone, gl.ui.mapAnimPhase,
  );
}

function drawWorldMapRaw(gl, ctx, dt) {
  if (!gl.ui.mapAnimPhase) gl.ui.mapAnimPhase = 0;
  gl.ui.mapAnimPhase += dt * 0.5;
  const zones = gl.infra.getAllZones();
  const zone = zones[gl.systemMapState.selectedZone] || zones[0];
  gl.infra.drawWorldMap(
    ctx, gl.canvas.width, gl.canvas.height,
    gl.infra.getAllLevels(zone.id), gl.progress, gl.mapState.selectedIndex, gl.ui.mapAnimPhase, zone,
  );
}

// ── Upgrade ──

export function loopUpgrade(gl, ctx) {
  gl.infra.drawUpgradeScreen(ctx, gl.canvas.width, gl.canvas.height, gl.wallet, gl.upgrades, gl._consumableInventory);
}

// ── Stats ──

export function loopStats(gl, ctx, fx, dt) {
  if (!gl.ui.statsAnimPhase) gl.ui.statsAnimPhase = 0;
  gl.ui.statsAnimPhase += dt;
  gl.infra.drawStatsScreen(
    ctx, gl.canvas.width, gl.canvas.height,
    gl.getLevelResult(), gl.ui.statsAnimPhase,
  );
}

// ── Paused ──

export function loopPaused(gl, ctx, fx) {
  drawScene(gl, fx);
  gl.hud.drawPauseScreen();
}

// ── Game Over ──

export function loopGameOver(gl, ctx, fx, dt) {
  const { width: W, height: H } = gl.canvas;
  const t = gl.ui.deathAnimTimer;
  const zc = gl.ui.deathZoomCenter;

  if (t > 0) {
    gl.ui.deathAnimTimer -= dt;
    const p = (240 - t) / 240;
    const scale = 1 + (1 - (1 - p) * (1 - p));
    const targetX = W / 2;
    const targetY = H * 3 / 5;
    const offsetX = (targetX - zc.x * scale);
    const offsetY = (targetY - zc.y * scale);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    drawScene(gl, fx);
    if (gl.ui.deathDebris) gl.infra.updateDebris(ctx, gl.ui.deathDebris, dt);
    ctx.restore();
    const alpha = 0.7 * (1 - t / 240);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    gl.infra.updateStars(0.2);
    if (gl.ui.deathDebris) gl.infra.updateDebris(ctx, gl.ui.deathDebris, dt);
    gl.hud.drawEndScreen('GAME OVER');
  }
}

// ── Won ──

export function loopWon(gl, ctx, fx, dt) {
  const ship = gl.entities.ship;
  const H = gl.canvas.height;
  const targetY = H / 4 - ship.height / 2;

  if (gl.ui.winAnimTimer > 0) {
    gl.ui.winAnimTimer -= dt;
    ship.y += (targetY - ship.y) * (1 - Math.pow(1 - 0.04, dt));
    drawScene(gl, fx);
  } else {
    if (gl.session.currentLevelId && gl.infra.finishLevel) {
      gl.ui.statsAnimPhase = 0;
      gl.infra.finishLevel();
    } else {
      ship.y = targetY;
      gl.hud.drawEndScreen('ZONE NETTOYÉE !');
      gl.infra.drawShip(ctx, ship);
    }
  }
}

// ── Playing ──

export function tickPlaying(gl, dt) {
  const { ship, drones, field } = gl.entities;
  let dtEff = dt;
  if (gl.ui.slowMoTimer > 0) { gl.ui.slowMoTimer -= dt; dtEff = dt * 0.33; }

  field.update(dtEff);
  ship.update(gl.infra.getPointerX(), dtEff);
  const total = gl.entities.totalAsteroids;
  ship.advanceY(dtEff, total > 0 ? field.remaining / total : 1, total);
  for (const d of drones) d.update(ship, gl.canvas.width, dtEff);
  for (const c of gl.entities.capsules) c.update(gl.canvas.height, dtEff);
  gl.entities.capsules = gl.entities.capsules.filter(c => c.alive);
  for (const mc of gl.entities.mineralCapsules) mc.update(gl.canvas.height, dtEff);
  gl.entities.mineralCapsules = gl.entities.mineralCapsules.filter(mc => mc.alive);
  if (gl.alienCombat) {
    gl.entities.projectiles = gl.alienCombat.update(field, ship, gl.entities.projectiles, dtEff, gl.canvas);
  }
  if (gl.entities.missiles) {
    for (const m of gl.entities.missiles) m.update(dtEff);
    gl.entities.missiles = gl.entities.missiles.filter(m => m.alive);
  }
  gl.collisionHandler.update();
}

export function loopPlayingAI(gl, ctx, dt) {
  tickPlaying(gl, dt);
  const { ship, drones, field, capsules, mineralCapsules, projectiles } = gl.entities;
  const infra = gl.infra;
  infra.drawField(ctx, field);
  for (const c of capsules) infra.drawCapsule(ctx, c);
  for (const mc of mineralCapsules) infra.drawMineralCapsule(ctx, mc);
  for (const p of projectiles) infra.drawProjectile(ctx, p);
  infra.drawShip(ctx, ship);
  for (const d of drones) infra.drawDrone(ctx, d);
  gl.hud.drawHUD(null);
}

export function loopPlaying(gl, ctx, fx, dt) {
  const { ship, drones, field } = gl.entities;
  const infra = gl.infra;

  // Dev AI : l'IA décide à la place du joueur
  if (gl._devAIPlayer) {
    const decision = gl._devAIPlayer.decide();
    if (decision.pointerX !== null) infra.setAIPointerX(decision.pointerX);
    const drone = drones[0];
    gl._devAIFrames = (gl._devAIFrames || 0) + 1;
    if (drone && !drone.launched && (decision.shouldLaunch || gl._devAIFrames > 30)) drone.launch(ship);
  }

  // Slow-motion
  let dtEff = dt;
  if (gl.ui.slowMoTimer > 0) {
    gl.ui.slowMoTimer -= dt;
    dtEff = dt * 0.33;
  }

  field.update(dtEff);
  ship.update(infra.getPointerX(), dtEff);
  const totalP = gl.entities.totalAsteroids;
  ship.advanceY(dtEff, totalP > 0 ? field.remaining / totalP : 1, totalP);
  for (const d of drones) {
    d.update(ship, gl.canvas.width, dtEff);
    if (d.launched) infra.spawnTrail(d.x, d.y, d.dx, d.dy);
  }
  for (const c of gl.entities.capsules) c.update(gl.canvas.height, dtEff);
  gl.entities.capsules = gl.entities.capsules.filter(c => c.alive);
  for (const mc of gl.entities.mineralCapsules) mc.update(gl.canvas.height, dtEff);
  gl.entities.mineralCapsules = gl.entities.mineralCapsules.filter(mc => mc.alive);

  if (gl.alienCombat) {
    gl.entities.projectiles = gl.alienCombat.update(
      field, ship, gl.entities.projectiles, dtEff, gl.canvas,
    );
  }

  gl.collisionHandler.update();

  drawScene(gl, fx, dtEff);
}
