// --- AI Trainer ---
// Orchestre l'entraînement : simule toute une génération en batch (headless),
// puis affiche le meilleur en mode "watch" avec rendu.
// L'UI est gérée par le AI Lab (js/infra/lab/ai-lab/).

import { Population } from './genome.js';
import { AIPlayer, TOPOLOGY } from './ai-player.js';
import { simulateAgent } from './simulation.js';
import { computeGenStats } from './gen-stats.js';

const POPULATION_SIZE = 50;
const MAX_FRAMES_PER_GAME = 10800; // ~3min à 60fps
const AGENTS_PER_CHUNK = 5;       // agents simulés par rAF (pour ne pas bloquer l'UI)

export class AITrainer {
  /**
   * @param {object} deps
   * @param {Function} deps.startGame - lance une partie (levelId)
   * @param {Function} deps.tick      - tick physique pur (pointerX) → sans rendu
   * @param {object} deps.entities - G.entities
   * @param {object} deps.session  - G.session
   * @param {object} deps.canvas   - CONFIG.canvas
   * @param {string} deps.levelId  - niveau d'entraînement
   */
  constructor({ startGame, tick, entities, session, canvas, levelId = 'z1-1' }) {
    this.startGame = startGame;
    this.tick = tick;
    this.gameState = { entities, session, canvas };
    this.population = new Population(POPULATION_SIZE, TOPOLOGY);
    this.currentIdx = 0;
    this.currentPlayer = null;
    this.frameCount = 0;
    this.active = false;
    this.watchBest = false;
    this.levelId = levelId;
    /** Historique des stats par génération (même format que CLI). */
    this.genHistory = [];
    /** Historiques fitness pour le graphe (best + avg par génération). */
    this.bestHistory = [];
    this.avgHistory = [];
    this.stats = {
      gen: 0, agent: 0, best: 0, current: 0,
      improvementStreak: 0,
    };
    this.onGenerationEnd = null;
    this._batchTimer = null;
  }

  /** Démarre l'entraînement. */
  start() {
    this.active = true;
    this.population.loadBest();
    this.stats.best = this.population.bestFitness > -Infinity
      ? Math.round(this.population.bestFitness) : 0;
    this.currentIdx = 0;
    this.#runBatch();
  }

  /** Arrête l'entraînement. */
  stop() {
    this.active = false;
    this.currentPlayer = null;
    if (this._batchTimer) { cancelAnimationFrame(this._batchTimer); this._batchTimer = null; }
  }

  /** Relance l'agent courant (utilisé par le lab pour watch/reset). */
  restartAgent() {
    if (this.watchBest) this.#startWatchAgent();
    else this.#runBatch();
  }

  /** Appelé chaque frame par la boucle de jeu. Actif uniquement en mode "watch". */
  update() {
    if (!this.active || !this.watchBest || !this.currentPlayer) return null;

    const state = this.gameState.session.state;

    if (state === 'won' || state === 'gameOver' || this.frameCount >= MAX_FRAMES_PER_GAME) {
      this.stats.current = Math.round(this.currentPlayer.computeFitness());
      setTimeout(() => { if (this.active && this.watchBest) this.#startWatchAgent(); }, 1500);
      this.currentPlayer = null;
      return null;
    }
    if (state !== 'playing') return null;

    this.frameCount++;
    const decision = this.currentPlayer.decide();

    const drone = this.gameState.entities.drones[0];
    if (drone && !drone.launched && (decision.shouldLaunch || this.frameCount > 60)) {
      drone.launch(this.gameState.entities.ship);
    }

    this.stats.current = Math.round(this.currentPlayer.currentFitness());
    return decision;
  }

  // ─── Simulation headless par batch ─────────────────────────

  /** Simule un agent complet (headless, synchrone). Retourne { fitness, details }. */
  #simulateAgent(genome) {
    return simulateAgent(genome, this.gameState, this.startGame.bind(this), this.tick, this.levelId);
  }

  /** Lance la simulation batch : N agents par rAF pour garder l'UI fluide. */
  #runBatch() {
    if (!this.active || this.watchBest) return;

    const end = Math.min(this.currentIdx + AGENTS_PER_CHUNK, this.population.size);

    for (let i = this.currentIdx; i < end; i++) {
      const genome = this.population.genomes[i];
      const result = this.#simulateAgent(genome);
      genome.fitness = result.fitness;
      genome._details = result;
      this.stats.agent = i + 1;
      this.stats.current = Math.round(genome.fitness);
    }

    this.currentIdx = end;
    this.stats.gen = this.population.generation;

    if (this.currentIdx >= this.population.size) {
      // Génération terminée
      this.#evolve();
      this.currentIdx = 0;
    }

    // Continuer au prochain rAF
    if (this.active && !this.watchBest) {
      this._batchTimer = requestAnimationFrame(() => this.#runBatch());
    }
  }

  #evolve() {
    const genStats = computeGenStats(this.population.genomes, this.population.generation);
    this.genHistory.push(genStats);

    // Streak d'amélioration
    const prevBest = this.stats.best;
    this.stats.best = Math.round(this.population.bestFitness);
    if (genStats.bestFitness > prevBest) {
      this.stats.improvementStreak++;
    } else {
      this.stats.improvementStreak = 0;
    }

    this.bestHistory.push(Math.round(this.population.bestFitness > -Infinity
      ? this.population.bestFitness : genStats.bestFitness));
    this.avgHistory.push(genStats.avg);

    this.population.evolve();
    this.population.saveBest({ bestHistory: this.bestHistory, avgHistory: this.avgHistory });

    if (this.onGenerationEnd) this.onGenerationEnd(this.population.bestFitness, genStats.avg);
  }

  // ─── Mode "watch" : rejouer le meilleur avec rendu ─────────

  #startWatchAgent() {
    if (!this.active || !this.population.bestGenome) return;
    this.currentPlayer = new AIPlayer(this.population.bestGenome, this.gameState);
    this.frameCount = 0;
    this.startGame(this.levelId);
    this.stats.gen = this.population.generation;
    this.stats.agent = 'best';
  }
}
