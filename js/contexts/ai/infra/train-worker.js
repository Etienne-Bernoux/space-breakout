// --- Worker thread pour simulation d'un agent ---
// Reçoit un génome (weights + topology), simule une ou plusieurs parties,
// retourne la fitness moyenne et les détails.

import { parentPort, workerData } from 'worker_threads';
import { Genome } from '../domain/genome.js';
import { simulateAgent } from '../use-cases/simulation.js';
import { createHeadlessGame } from './headless-game.js';

// Chaque worker a son propre environnement de jeu (pas de partage)
const { startGame, tick, gameState } = createHeadlessGame();

parentPort.on('message', (msg) => {
  const { weights, topology, levelId, levels, evals } = msg;

  const genome = new Genome(topology);
  genome.brain.decode(new Float32Array(weights));

  if (evals <= 1) {
    const result = simulateAgent(genome, gameState, startGame, tick, levelId);
    parentPort.postMessage({ fitness: result.fitness, details: result });
  } else {
    let totalFitness = 0;
    let bestResult = null;
    for (let e = 0; e < evals; e++) {
      const lvl = levels && levels.length > 1 ? levels[e % levels.length] : levelId;
      const result = simulateAgent(genome, gameState, startGame, tick, lvl);
      totalFitness += result.fitness;
      if (!bestResult || result.fitness > bestResult.fitness) bestResult = result;
    }
    parentPort.postMessage({ fitness: totalFitness / evals, details: bestResult });
  }
});
