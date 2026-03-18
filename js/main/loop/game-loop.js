// --- Game Loop : boucle principale + dispatch ---

import {
  loopMenu, loopSystemMap, loopWorldMap, loopMapTransition,
  loopUpgrade, loopStats, loopPaused, loopGameOver, loopWon,
  loopPlaying, loopPlayingAI,
} from './state-handlers.js';

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
  constructor(deps) {
    const { render, entities, session, systems, ui, canvas, hud, collisionHandler, infra, progress, mapState, systemMapState, getLevelResult, alienCombat, wallet, upgrades } = deps;
    this._deps = deps; // pour les getters dynamiques (consumableSession, consumableInventory, etc.)
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

  get consumableSession() { return this._deps.consumableSession; }
  get consumableActivator() { return this._deps.consumableActivator; }
  get _consumableInventory() { return this._deps._consumableInventory; }

  start() {
    requestAnimationFrame(this.loop);
  }

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
      loopMapTransition(this, ctx, fx, dt);
    } else {
      // Dispatch par état de jeu (progress lab laisse le canvas rendre normalement)
      switch (this.session.state) {
        case 'menu':      loopMenu(this, ctx, fx); break;
        case 'systemMap': loopSystemMap(this, ctx, fx, dt); break;
        case 'worldMap':  loopWorldMap(this, ctx, fx, dt); break;
        case 'upgrade':   loopUpgrade(this, ctx); break;
        case 'stats':     loopStats(this, ctx, fx, dt); break;
        case 'paused':    loopPaused(this, ctx, fx); break;
        case 'gameOver':  loopGameOver(this, ctx, fx, dt); break;
        case 'won':       loopWon(this, ctx, fx, dt); break;
        case 'playing':
          if (aiActive && ai.watchBest) loopPlayingAI(this, ctx, dt);
          else if (!aiActive) loopPlaying(this, ctx, fx, dt);
          break;
      }
    }

    // Fade-in transition (overlay noir qui s'efface)
    const st = this.session.state;
    if (st !== this._prevState) {
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
}
