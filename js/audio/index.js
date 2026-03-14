// --- Façade Audio ---
// Contexte audio/intensité : SFX, musique procédurale, effets visuels, intensité.

// Use cases
export { GameIntensityDirector } from './use-cases/intensity/game-intensity-director.js';

// Infra — orchestrators
export { MusicDirector } from './infra/orchestrators/music-director.js';
export { EffectDirector } from './infra/orchestrators/effect-director.js';
