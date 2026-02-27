import { CONFIG } from '../config.js';
import { Capsule } from '../domain/capsule.js';
import { getPowerUp } from '../domain/power-ups.js';
import { spawnExplosion } from '../infra/particles.js';
import { triggerShake } from '../infra/screenshake.js';
import { G, triggerSlowMo, COMBO_FADE_DURATION } from './init.js';

export function handleCollisions() {
  const { ship, field, totalAsteroids } = G.entities;
  const ent = G.entities; // pour drones/capsules (mutés par splice/push)

  // --- Collisions drone/vaisseau + drone/astéroïdes (tous les drones) ---
  for (const drone of ent.drones) {
    if (!drone.launched) continue;
    const ev1 = G.session.checkShipCollision(drone, ship);
    if (ev1) {
      G.ui.combo = 0;
      G.systems.intensity.onBounce();
    }

    const ev2 = G.session.checkAsteroidCollision(drone, field);
    if (ev2) {
      spawnExplosion(ev2.x, ev2.y, ev2.color);
      G.systems.intensity.onAsteroidHit();
      if (ev2.type === 'asteroidHit' || ev2.type === 'asteroidFragment') {
        G.ui.combo++;
        if (G.ui.combo >= 2) {
          G.ui.comboDisplay = G.ui.combo;
          G.ui.comboFadeTimer = COMBO_FADE_DURATION;
        }
        const shakeAmount = CONFIG.screenshake.intensity[ev2.sizeName] || CONFIG.screenshake.intensity.small;
        triggerShake(shakeAmount);
        const puId = G.systems.drop.decideDrop({ materialKey: ev2.materialKey || 'rock', sizeName: ev2.sizeName || 'small' });
        if (puId) ent.capsules.push(new Capsule(puId, ev2.x, ev2.y, CONFIG.capsule));
        G.systems.intensity.onAsteroidDestroyed(field.remaining, totalAsteroids, G.ui.combo);
        if (field.remaining === 0) triggerSlowMo();
      }
    }
  }

  // --- Capsules ramassées ---
  const gs = G.gs;
  const capEvts = G.session.checkCapsuleCollision(ent.capsules, ship);
  for (const ce of capEvts) {
    G.systems.powerUp.activate(ce.powerUpId, gs);
    G.systems.intensity.onPowerUpActivated();
    spawnExplosion(ce.x, ce.y, getPowerUp(ce.powerUpId)?.color || '#fff');
  }

  // --- Expiration des power-ups ---
  const puCountBefore = G.systems.powerUp.getActive().length;
  G.systems.powerUp.update(gs);
  if (puCountBefore > 0 && G.systems.powerUp.getActive().length === 0) {
    G.systems.intensity.onPowerUpExpired();
  }

  // --- Drones perdus (multi-drone) ---
  for (let i = ent.drones.length - 1; i >= 0; i--) {
    if (!G.session.isDroneLost(ent.drones[i])) continue;

    if (ent.drones.length > 1) {
      ent.drones.splice(i, 1);
    } else {
      const livesLeft = G.session.loseLife();
      G.ui.combo = 0;
      if (livesLeft <= 0) {
        G.session.state = 'gameOver';
        G.systems.intensity.onGameOver();
      } else {
        ent.drones[0].reset(ship);
        G.systems.intensity.onLifeChanged(livesLeft);
      }
    }
  }

  // Retarder le win pendant le slow-mo pour qu'il soit visible
  if (G.ui.slowMoTimer <= 0) {
    const ev4 = G.session.checkWin(field);
    if (ev4) { G.systems.intensity.onWin(); }
  }
}
