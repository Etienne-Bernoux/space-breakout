// --- Worker thread pour simulation d'un agent ---
// Reçoit un génome (weights + topology + seed), simule une ou plusieurs parties,
// retourne la fitness moyenne et les détails.
// Le seed garantit que tous les agents d'une génération jouent le même layout.

import { parentPort } from 'worker_threads';
import { Genome } from '../domain/genome.js';
import { simulateAgent } from '../use-cases/simulation.js';
import { createHeadlessGame } from './headless-game.js';

// Chaque worker a son propre environnement de jeu (pas de partage)
const { startGame, tick, gameState } = createHeadlessGame();

/** PRNG déterministe (mulberry32). */
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Exécute fn avec Math.random remplacé par un PRNG seedé. */
function withSeed(seed, fn) {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try { return fn(); }
  finally { Math.random = original; }
}

parentPort.on('message', (msg) => {
  const { weights, topology, levelId, levels, evals, seed } = msg;

  const genome = new Genome(topology);
  genome.brain.decode(new Float32Array(weights));

  if (evals <= 1) {
    // Seed le layout pour que tous les agents de la gen jouent le même
    const result = withSeed(seed, () =>
      simulateAgent(genome, gameState, startGame, tick, levelId),
    );
    parentPort.postMessage({ fitness: result.fitness, details: result });
  } else {
    let totalFitness = 0;
    let bestResult = null;
    for (let e = 0; e < evals; e++) {
      const lvl = levels && levels.length > 1 ? levels[e % levels.length] : levelId;
      // Seed différent par eval mais identique pour tous les agents
      const result = withSeed(seed + e * 99991, () =>
        simulateAgent(genome, gameState, startGame, tick, lvl),
      );
      totalFitness += result.fitness;
      if (!bestResult || result.fitness > bestResult.fitness) bestResult = result;
    }
    parentPort.postMessage({ fitness: totalFitness / evals, details: bestResult });
  }
});
