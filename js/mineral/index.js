// --- Façade Mineral ---
// Contexte minerais : drop, collection, wallet, rendu.

// Domain
export { MINERALS, MINERAL_IDS, getMineral } from './domain/minerals.js';
export { DROP_TABLE, getDropWeights } from './domain/mineral-drop-table.js';
export { MineralCapsule } from './domain/mineral-capsule.js';

// Use cases
export { MineralDropSystem } from './use-cases/mineral-drop-system.js';
export { MineralWallet } from './use-cases/mineral-wallet.js';

// Infra
export { drawMineralCapsule, drawMineralHUD, initMineralHUD, resetMineralSessionGains, addMineralSessionGain } from './infra/mineral-render.js';
