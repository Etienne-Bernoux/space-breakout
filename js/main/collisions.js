import { CONFIG } from '../config.js';
import { Capsule } from '../domain/capsule.js';
import { getPowerUp } from '../domain/power-ups.js';
import { spawnExplosion } from '../infra/particles.js';
import { playBounce, playAsteroidHit, playLoseLife, playWin, playGameOver } from '../infra/audio.js';
import { fadeOutMusic, playWinStinger, playGameOverStinger, playPowerUpAccent, playComboAccent } from '../infra/music/index.js';
import { triggerShake } from '../infra/screenshake.js';
import { G, triggerSlowMo, COMBO_FADE_DURATION } from './init.js';

export function handleCollisions() {
  const ev1 = G.session.checkShipCollision(G.drone, G.ship);
  if (ev1) { playBounce(); G.combo = 0; G.musicDirector.onComboReset(); }

  const ev2 = G.session.checkAsteroidCollision(G.drone, G.field);
  if (ev2) {
    spawnExplosion(ev2.x, ev2.y, ev2.color);
    playAsteroidHit();
    // Screenshake + combo + drop de power-up sur destruction
    if (ev2.type === 'asteroidHit' || ev2.type === 'asteroidFragment') {
      G.combo++;
      if (G.combo >= 2) {
        G.comboDisplay = G.combo;
        G.comboFadeTimer = COMBO_FADE_DURATION;
        playComboAccent(G.combo);
      }
      const shakeAmount = CONFIG.screenshake.intensity[ev2.sizeName] || CONFIG.screenshake.intensity.small;
      triggerShake(shakeAmount);
      const puId = G.dropSystem.decideDrop({ materialKey: ev2.materialKey || 'rock', sizeName: ev2.sizeName || 'small' });
      if (puId) G.capsules.push(new Capsule(puId, ev2.x, ev2.y, CONFIG.capsule));
      // Music director : destruction
      G.musicDirector.onAsteroidDestroyed(G.field.remaining, G.totalAsteroids);
      // Slow-motion sur le dernier astéroïde
      if (G.field.remaining === 0) triggerSlowMo();
    }
  }

  // Capsules ramassées
  const capEvts = G.session.checkCapsuleCollision(G.capsules, G.ship);
  for (const ce of capEvts) {
    const gs = { ship: G.ship, drone: G.drone, session: G.session, field: G.field };
    G.puManager.activate(ce.powerUpId, gs);
    G.musicDirector.onPowerUpActivated();
    playPowerUpAccent();
    spawnExplosion(ce.x, ce.y, getPowerUp(ce.powerUpId)?.color || '#fff');
  }

  // Expiration des power-ups
  const puCountBefore = G.puManager.getActive().length;
  G.puManager.update({ ship: G.ship, drone: G.drone, session: G.session, field: G.field });
  if (puCountBefore > 0 && G.puManager.getActive().length === 0) {
    G.musicDirector.onPowerUpExpired();
  }

  const ev3 = G.session.checkDroneLost(G.drone, G.ship);
  if (ev3 && ev3.type === 'gameOver') { playGameOver(); G.musicDirector.disable(); fadeOutMusic(0.8, () => playGameOverStinger()); }
  if (ev3 && ev3.type === 'loseLife') { playLoseLife(); G.combo = 0; G.musicDirector.onComboReset(); G.musicDirector.onLifeChanged(ev3.livesLeft); }

  // Retarder le win pendant le slow-mo pour qu'il soit visible
  if (G.slowMoTimer <= 0) {
    const ev4 = G.session.checkWin(G.field);
    if (ev4) { playWin(); G.musicDirector.disable(); fadeOutMusic(0.8, () => playWinStinger()); }
  }
}
