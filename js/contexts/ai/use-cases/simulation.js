// --- Simulation headless d'un agent ---
// Utilisé par AITrainer (browser) et train-cli.js (Node).

import { AIPlayer } from './ai-player.js';

const MAX_FRAMES = 10800; // ~3min à 60fps

/**
 * Simule un agent complet (headless, synchrone).
 * @param {object} genome - Genome à évaluer
 * @param {object} gameState - { entities, session, canvas }
 * @param {Function} startGame - (levelId) → initialise la partie
 * @param {Function} tick - (pointerX) → un tick physique (dt=1)
 * @param {string} levelId - niveau à jouer
 * @returns {{ fitness, catches, destroys, drops, rallyScore, won }}
 */
export function simulateAgent(genome, gameState, startGame, tick, levelId) {
  const player = new AIPlayer(genome, gameState);
  startGame(levelId);

  for (let frame = 0; frame < MAX_FRAMES; frame++) {
    const state = gameState.session.state;
    if (state === 'won' || state === 'gameOver') break;
    if (state !== 'playing') continue;

    const decision = player.decide();

    const drone = gameState.entities.drones[0];
    if (drone && !drone.launched && (decision.shouldLaunch || frame > 10)) {
      drone.launch(gameState.entities.ship);
    }

    tick(decision.pointerX);
  }

  const won = gameState.session.state === 'won';
  const timeSec = player.framesSurvived / 60;
  const stars = !won ? 0
    : player.dropCount > 0 ? 1
    : timeSec <= 60 ? 3
    : 2;

  return {
    fitness: player.computeFitness(),
    catches: player.catchCount,
    destroys: player.asteroidsDestroyed,
    drops: player.dropCount,
    rallyScore: Math.round(player.rallyScore),
    capsules: player.capsulesCaught,
    stars,
    won,
  };
}
