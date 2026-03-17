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
   * @param {object} deps.alienCombat - AlienCombatManager instance
   */
  constructor({ render, entities, session, systems, ui, canvas, hud, collisionHandler, infra, progress, mapState, systemMapState, getLevelResult, alienCombat, wallet, upgrades }) {
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
    this.systemMapState = systemMapState;
    this.getLevelResult = getLevelResult;
    this.alienCombat = alienCombat;
    this.wallet = wallet;
    this.upgrades = upgrades;
    this.lastTime = 0;
    this._prevState = null;
    this._fadeAlpha = 0;          // overlay noir pour transition fade-in
    this.loop = this.loop.bind(this);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  // --- State handlers (chaque état a sa propre logique) ---

  #loopMenu(ctx, fx) {
    // En mode lab, ne pas dessiner le menu d'accueil
    if (this.infra.isLabHubActive && this.infra.isLabHubActive()) return;
    const mouse = this.infra.getMousePos();
    this.infra.updateMenuHover(mouse.x, mouse.y);
    this.infra.updateMenu(ctx);
  }

  #loopSystemMap(ctx, fx, dt) {
    if (!this.ui.mapAnimPhase) this.ui.mapAnimPhase = 0;
    this.ui.mapAnimPhase += dt;

    // Init animation unlock si on arrive sur systemMap avec un zoneUnlocked
    const result = this.getLevelResult ? this.getLevelResult() : null;
    if (result?.zoneUnlocked && !this.ui.zoneUnlockAnim) {
      this.ui.zoneUnlockAnim = { zoneId: result.zoneUnlocked, frame: 0 };
    }
    // Avancer l'animation
    let unlockAnim = null;
    if (this.ui.zoneUnlockAnim) {
      this.ui.zoneUnlockAnim.frame += dt;
      unlockAnim = this.ui.zoneUnlockAnim;
      if (unlockAnim.frame > 120) {
        this.ui.zoneUnlockAnim = null; // fin de l'animation
        // Nettoyer le flag pour ne pas redéclencher
        if (result) result.zoneUnlocked = null;
      }
    }

    this.infra.drawSystemMap(
      ctx, this.canvas.width, this.canvas.height,
      this.infra.getAllZones(), this.progress, this.systemMapState.selectedZone, this.ui.mapAnimPhase, unlockAnim,
    );
  }

  #loopWorldMap(ctx, fx, dt) {
    if (!this.ui.mapAnimPhase) this.ui.mapAnimPhase = 0;
    this.ui.mapAnimPhase += dt;
    const zones = this.infra.getAllZones();
    const zone = zones[this.systemMapState.selectedZone] || zones[0];
    this.infra.drawWorldMap(
      ctx, this.canvas.width, this.canvas.height,
      this.infra.getAllLevels(zone.id), this.progress, this.mapState.selectedIndex, this.ui.mapAnimPhase, zone,
    );
  }

  /** Rendu d'une transition zoom entre systemMap et worldMap. */
  #loopMapTransition(ctx, fx, dt) {
    const tr = this.ui.mapTransition;
    tr.frame += dt;
    const p = Math.min(tr.frame / tr.duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const { width: W, height: H } = this.canvas;

    // Position du nœud de zone sur la systemMap (point focal du zoom)
    const zones = this.infra.getAllZones();
    const nodes = this.infra.getSystemNodePositions(W, H, zones);
    const focal = nodes[tr.zoneIdx] || { x: W / 2, y: H / 2 };

    if (tr.type === 'zoomIn') {
      // Première moitié : systemMap qui zoome
      // Seconde moitié : worldMap qui dézoome
      if (ease < 0.5) {
        const subP = ease / 0.5; // 0→1
        const scale = 1 + subP * 1.5;
        const alpha = 1 - subP;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(focal.x * (1 - scale), focal.y * (1 - scale));
        ctx.scale(scale, scale);
        this.#drawSystemMapRaw(ctx, dt);
        ctx.restore();
      } else {
        const subP = (ease - 0.5) / 0.5; // 0→1
        const scale = 2.5 - subP * 1.5; // 2.5→1
        const alpha = subP;
        ctx.save();
        ctx.globalAlpha = alpha;
        const cx = W / 2, cy = H / 2;
        ctx.translate(cx * (1 - scale), cy * (1 - scale));
        ctx.scale(scale, scale);
        this.#drawWorldMapRaw(ctx, dt);
        ctx.restore();
      }
    } else {
      // zoomOut — inverse
      if (ease < 0.5) {
        const subP = ease / 0.5;
        const scale = 1 - subP * 0.5; // 1→0.5
        const alpha = 1 - subP;
        ctx.save();
        ctx.globalAlpha = alpha;
        const cx = W / 2, cy = H / 2;
        ctx.translate(cx * (1 - scale), cy * (1 - scale));
        ctx.scale(scale, scale);
        this.#drawWorldMapRaw(ctx, dt);
        ctx.restore();
      } else {
        const subP = (ease - 0.5) / 0.5;
        const scale = 2.5 - subP * 1.5; // 2.5→1
        const alpha = subP;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(focal.x * (1 - scale), focal.y * (1 - scale));
        ctx.scale(scale, scale);
        this.#drawSystemMapRaw(ctx, dt);
        ctx.restore();
      }
    }

    if (p >= 1) this.ui.mapTransition = null;
  }

  /** Rendu brut systemMap (sans gestion du transition state). */
  #drawSystemMapRaw(ctx, dt) {
    if (!this.ui.mapAnimPhase) this.ui.mapAnimPhase = 0;
    this.ui.mapAnimPhase += dt * 0.5;
    this.infra.drawSystemMap(
      ctx, this.canvas.width, this.canvas.height,
      this.infra.getAllZones(), this.progress, this.systemMapState.selectedZone, this.ui.mapAnimPhase,
    );
  }

  /** Rendu brut worldMap (sans gestion du transition state). */
  #drawWorldMapRaw(ctx, dt) {
    if (!this.ui.mapAnimPhase) this.ui.mapAnimPhase = 0;
    this.ui.mapAnimPhase += dt * 0.5;
    const zones = this.infra.getAllZones();
    const zone = zones[this.systemMapState.selectedZone] || zones[0];
    this.infra.drawWorldMap(
      ctx, this.canvas.width, this.canvas.height,
      this.infra.getAllLevels(zone.id), this.progress, this.mapState.selectedIndex, this.ui.mapAnimPhase, zone,
    );
  }

  #loopUpgrade(ctx) {
    this.infra.drawUpgradeScreen(ctx, this.canvas.width, this.canvas.height, this.wallet, this.upgrades);
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

  /** Tick physique seul (sans rendu) — utilisé pour l'accélération IA. */
  #tickPlaying(dt) {
    const { ship, drones, field } = this.entities;
    let dtEff = dt;
    if (this.ui.slowMoTimer > 0) { this.ui.slowMoTimer -= dt; dtEff = dt * 0.33; }

    field.update(dtEff);
    ship.update(this.infra.getPointerX(), dtEff);
    const total = this.entities.totalAsteroids;
    ship.advanceY(dtEff, total > 0 ? field.remaining / total : 1, total);
    for (const d of drones) d.update(ship, this.canvas.width, dtEff);
    for (const c of this.entities.capsules) c.update(this.canvas.height, dtEff);
    this.entities.capsules = this.entities.capsules.filter(c => c.alive);
    for (const mc of this.entities.mineralCapsules) mc.update(this.canvas.height, dtEff);
    this.entities.mineralCapsules = this.entities.mineralCapsules.filter(mc => mc.alive);
    if (this.alienCombat) {
      this.entities.projectiles = this.alienCombat.update(field, ship, this.entities.projectiles, dtEff, this.canvas);
    }
    this.collisionHandler.update();
  }

  /** Boucle playing allégée pour l'IA : physique + rendu minimal (pas d'effets). */
  #loopPlayingAI(ctx, dt) {
    this.#tickPlaying(dt);
    const { ship, drones, field, capsules, mineralCapsules, projectiles } = this.entities;
    const infra = this.infra;
    infra.drawField(ctx, field);
    for (const c of capsules) infra.drawCapsule(ctx, c);
    for (const mc of mineralCapsules) infra.drawMineralCapsule(ctx, mc);
    for (const p of projectiles) infra.drawProjectile(ctx, p);
    infra.drawShip(ctx, ship);
    for (const d of drones) infra.drawDrone(ctx, d);
    this.hud.drawHUD(null);
  }

  #loopPlaying(ctx, fx, dt) {
    const { ship, drones, field } = this.entities;
    const infra = this.infra;

    // Dev AI : l'IA décide à la place du joueur
    if (this._devAIPlayer) {
      const decision = this._devAIPlayer.decide();
      if (decision.pointerX !== null) infra.setAIPointerX(decision.pointerX);
      const drone = drones[0];
      this._devAIFrames = (this._devAIFrames || 0) + 1;
      if (drone && !drone.launched && (decision.shouldLaunch || this._devAIFrames > 30)) drone.launch(ship);
    }

    // Slow-motion : ralentit le dt au lieu de skip des frames
    let dtEff = dt;
    if (this.ui.slowMoTimer > 0) {
      this.ui.slowMoTimer -= dt;
      dtEff = dt * 0.33;
    }

    field.update(dtEff);
    ship.update(infra.getPointerX(), dtEff);
    const totalP = this.entities.totalAsteroids;
    ship.advanceY(dtEff, totalP > 0 ? field.remaining / totalP : 1, totalP);
    for (const d of drones) {
      d.update(ship, this.canvas.width, dtEff);
      if (d.launched) infra.spawnTrail(d.x, d.y, d.dx, d.dy);
    }
    for (const c of this.entities.capsules) c.update(this.canvas.height, dtEff);
    this.entities.capsules = this.entities.capsules.filter(c => c.alive);
    for (const mc of this.entities.mineralCapsules) mc.update(this.canvas.height, dtEff);
    this.entities.mineralCapsules = this.entities.mineralCapsules.filter(mc => mc.alive);

    // Combat alien (firePulse, tirs, projectiles)
    if (this.alienCombat) {
      this.entities.projectiles = this.alienCombat.update(
        field, ship, this.entities.projectiles, dtEff, this.canvas,
      );
    }

    this.collisionHandler.update();

    this.#drawScene(fx, dtEff);
  }

  // --- Main loop ---

  loop(now = performance.now()) {
    const rawDt = this.lastTime ? Math.min((now - this.lastTime) / 16.667, 3) : 1;
    const dt = rawDt * (this.timeScale || 1);
    this.lastTime = now;

    // --- AI ---
    const ai = this._aiTrainer;
    if (ai && !ai.active && this.infra.setAIPointerX) {
      this.infra.setAIPointerX(null);
      this._aiTrainer = null;
    }

    // Batch training : aucun rendu, le trainer gère tout en headless
    if (ai && ai.active && !ai.watchBest) {
      requestAnimationFrame(this.loop);
      return;
    }

    // Watch mode : le meilleur cerveau joue avec rendu
    if (ai && ai.active) {
      const decision = ai.update();
      if (decision && decision.pointerX !== null && this.infra.setAIPointerX) {
        this.infra.setAIPointerX(decision.pointerX);
      }
    }

    const ctx = this.render.ctx;
    const aiActive = ai && ai.active;

    // Intensité : désactivée pendant l'entraînement IA (pas de musique/effets)
    if (!aiActive) this.systems.intensity.update();
    const fx = aiActive ? null : this.systems.intensity.getEffects();
    if (fx) this.infra.setAmbientShake(fx.microShake);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!aiActive) this.infra.updateStars(fx.starSpeed);

    document.body.classList.toggle('menu', ['menu', 'systemMap', 'paused', 'worldMap', 'stats', 'upgrade'].includes(this.session.state));
    document.body.classList.toggle('state-systemMap', this.session.state === 'systemMap');
    document.body.classList.toggle('state-worldMap', this.session.state === 'worldMap');

    // Synchronise l'état du jeu dans le pointer (conditionne le comportement souris)
    if (this.infra.setGameState) this.infra.setGameState(this.session.state);

    // Overlays DOM prioritaires : labs qui masquent le canvas
    const labOverlay = this.infra.isLabOverlayActive();
    if (labOverlay) {
      // Labs DOM-only (music, dev, ai) → pas de rendu canvas
    } else if (this.ui.mapTransition) {
      // Transition zoom entre systemMap ↔ worldMap
      this.#loopMapTransition(ctx, fx, dt);
    } else {
      // Dispatch par état de jeu (progress lab laisse le canvas rendre normalement)
      switch (this.session.state) {
        case 'menu':      this.#loopMenu(ctx, fx); break;
        case 'systemMap': this.#loopSystemMap(ctx, fx, dt); break;
        case 'worldMap':  this.#loopWorldMap(ctx, fx, dt); break;
        case 'upgrade':   this.#loopUpgrade(ctx); break;
        case 'stats':     this.#loopStats(ctx, fx, dt); break;
        case 'paused':    this.#loopPaused(ctx, fx); break;
        case 'gameOver':  this.#loopGameOver(ctx, fx, dt); break;
        case 'won':       this.#loopWon(ctx, fx, dt); break;
        case 'playing':
          if (aiActive && ai.watchBest) this.#loopPlayingAI(ctx, dt);
          else if (!aiActive) this.#loopPlaying(ctx, fx, dt);
          // AI batch (pas watch) → pas de rendu canvas
          break;
      }
    }

    // Fade-in transition (overlay noir qui s'efface)
    const st = this.session.state;
    if (st !== this._prevState) {
      // Déclencher un fade seulement pour les transitions non-gameplay
      if (this._prevState === 'menu' && st === 'systemMap') this._fadeAlpha = 1;
      this._prevState = st;
    }
    if (this._fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this._fadeAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this._fadeAlpha = Math.max(0, this._fadeAlpha - dt * 0.04);
    }

    // Nettoyer l'IA dev quand on quitte playing
    if (this._devAIPlayer && this.session.state !== 'playing') {
      this.infra.setAIPointerX(null);
      this._devAIPlayer = null;
      this._devAIFrames = 0;
    }

    this.infra.updateDevOverlay();
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
    for (const mc of this.entities.mineralCapsules) infra.drawMineralCapsule(ctx, mc);
    for (const p of this.entities.projectiles) infra.drawProjectile(ctx, p);
    if (ship.isMobile) this.hud.drawDeathLine(ship, fx);
    infra.drawShip(ctx, ship);
    for (const d of drones) infra.drawDrone(ctx, d);
    ctx.restore();
    this.#drawVignette(ctx, fx);
    this.hud.drawHUD(fx);
    infra.drawPowerUpHUD(ctx, this.systems.powerUp.getActive(), this.canvas.width);
    if (infra.drawMineralHUD) infra.drawMineralHUD(ctx, this.canvas.width, this.canvas.height);
    this.hud.drawPauseButton();
    if (this._devAIPlayer) this.hud.drawAIBadge();
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
