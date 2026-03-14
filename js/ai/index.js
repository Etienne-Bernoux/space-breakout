// --- Façade AI ---
// Module d'IA auto-apprenante (neuroévolution).
// Activé via le AI Lab dans le hub (?lab).

export { AITrainer } from './use-cases/ai-trainer.js';
export { AIPlayer, TOPOLOGY } from './use-cases/ai-player.js';
export { NeuralNetwork } from './domain/neural-network.js';
export { Population, Genome } from './domain/genome.js';
export { localStorageAdapter, nullStorageAdapter } from './infra/population-storage.js';
