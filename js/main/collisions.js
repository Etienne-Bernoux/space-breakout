import { CONFIG } from '../config.js';
import { Capsule } from '../domain/capsule.js';
import { getPowerUp } from '../domain/power-ups.js';
import { spawnExplosion } from '../infra/particles.js';
import { triggerShake } from '../infra/screenshake.js';
import { G, triggerSlowMo, COMBO_FADE_DURATION } from './init.js';

export function handleCollisions() {
  const ev1 = G.session.checkShipCollision(G.drone, G.ship);
  if (ev1) {
    G.combo = 0;
    G.intensityDirector.onBounce();
  }

  const ev2 = G.session.checkAsteroidCollision(G.drone, G.field);
  if (ev2) {
    spawnExplosion(ev2.x, ev2.y, ev2.color);
    G.intensityDirector.onAsteroidHit();
    // Screenshake + combo + drop de power-up sur destruction
    if (ev2.type === 'asteroidHit' || ev2.type === 'asteroidFragment') {
      G.combo++;
      if (G.combo >= 2) {
        G.comboDisplay = G.combo;
        G.comboFadeTimer = COMBO_FADE_DURATION;
      }
      const shakeAmount = CONFIG.screenshake.intensity[ev2.sizeName] || CONFIG.screenshake.intensity.small;
      triggerShake(shakeAmount);
      const puId = G.dropSystem.decideDrop({ materialKey: ev2.materialKey || 'rock', sizeName: ev2.sizeName || 'small' });
      if (puId) G.capsules.push(new Capsule(puId, ev2.x, ev2.y, CONFIG.capsule));
      G.intensityDirector.onAsteroidDestroyed(G.field.remaining, G.totalAsteroids, G.combo);
      if (G.field.remaining === 0) triggerSlowMo();
    }
  }

  // Capsules ramassées
  const capEvts = G.session.checkCapsuleCollision(G.capsules, G.ship);
  for (const ce of capEvts) {
    const gs = { ship: G.ship, drone: G.drone, session: G.session, field: G.field };
    G.puManager.activate(ce.powerUpId, gs);
    G.intensityDirector.onPowerUpActivated();
    spawnExplosion(ce.x, ce.y, getPowerUp(ce.powerUpId)?.color || '#fff');
  }

  // Expiration des power-ups
  const puCountBefore = G.puManager.getActive().length;
  G.puManager.update({ ship: G.ship, drone: G.drone, session: G.session, field: G.field });
  if (puCountBefore > 0 && G.puManager.getActive().length === 0) {
    G.intensityDirector.onPowerUpExpired();
  }

  const ev3 = G.session.checkDroneLost(G.drone, G.ship);
  if (ev3 && ev3.type === 'gameOver') { G.intensityDirector.onGameOver(); }
  if (ev3 && ev3.type === 'loseLife') { G.combo = 0; G.intensityDirector.onLifeChanged(ev3.livesLeft); }

  // Retarder le win pendant le slow-mo pour qu'il soit visible
  if (G.slowMoTimer <= 0) {
    const ev4 = G.session.checkWin(G.field);
    if (ev4) { G.intensityDirector.onWin(); }
  }
}
