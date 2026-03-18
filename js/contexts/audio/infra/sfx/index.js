// --- Façade SFX : re-export tous les sons ---

export { setSfxVolume, unlockAudio, perceptualVolume } from './audio-core.js';
export { playBounce, playAsteroidHit, playAlienHit, playLoseLife, playWin, playGameOver, playLaunch } from './sfx-gameplay.js';
export { playShipExplosion, playBossExplosion } from './sfx-explosions.js';
export { playAlienShoot } from './sfx-combat.js';
export { playMineralPickup, playForgePurchase } from './sfx-economy.js';
export { playSafetyNetBounce, playShockwave, playMissileLaunch, playFireballActivate } from './sfx-consumables.js';
