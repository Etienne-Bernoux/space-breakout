// --- AI Trainer ---
// Orchestre l'entraînement : simule toute une génération en batch (headless),
// puis affiche le meilleur en mode "watch" avec rendu.
// L'UI est gérée par le AI Lab (js/infra/lab/ai-lab/).

import { Population } from './genome.js';
import { AIPlayer, TOPOLOGY } from './ai-player.js';
import { simulateAgent } from './simulation.js';

const POPULATION_SIZE = 50;
const MAX_FRAMES_PER_GAME = 3600; // ~60s à 60fps
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
    this.stats = {
      gen: 0, agent: 0, best: 0, current: 0, avgFitness: 0,
      genBestFitness: 0,     // meilleur fitness de la génération courante
      genBestCatches: 0,     // rattrapages du meilleur de la gen
      genBestDestroys: 0,    // destructions du meilleur de la gen
      genBestRallyScore: 0,  // score rally du meilleur de la gen
      genBestDrops: 0,       // pertes du meilleur de la gen
      genWinCount: 0,        // agents ayant gagné dans la gen
      improvementStreak: 0,  // générations consécutives avec amélioration
    };
    this.onGenerationEnd = null;
    this._batchTimer = null;
  }

  /** Démarre l'entraînement. */
  start() {
    this.active = true;
    this.population.loadBest();
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
      setTimeout(() => { if (this.active && this.watchBest) this.#startWatchAgent(); }, 300);
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

    this.stats.current = Math.round(this.currentPlayer.computeFitness());
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
    const genomes = this.population.genomes;
    const total = genomes.reduce((s, g) => s + g.fitness, 0);
    this.stats.avgFitness = Math.round(total / this.population.size);

    // Stats détaillées de la génération
    const sorted = [...genomes].sort((a, b) => b.fitness - a.fitness);
    const best = sorted[0];
    const d = best._details || {};
    this.stats.genBestFitness = Math.round(best.fitness);
    this.stats.genBestCatches = d.catches || 0;
    this.stats.genBestDestroys = d.destroys || 0;
    this.stats.genBestRallyScore = d.rallyScore || 0;
    this.stats.genBestDrops = d.drops || 0;
    this.stats.genWinCount = genomes.filter(g => g._details?.won).length;

    // Streak d'amélioration
    const prevBest = this.stats.best;
    this.stats.best = Math.round(this.population.bestFitness);
    if (Math.round(best.fitness) > prevBest) {
      this.stats.improvementStreak++;
    } else {
      this.stats.improvementStreak = 0;
    }

    this.population.evolve();
    this.population.saveBest();

    if (this.onGenerationEnd) this.onGenerationEnd(this.population.bestFitness, this.stats.avgFitness);
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
