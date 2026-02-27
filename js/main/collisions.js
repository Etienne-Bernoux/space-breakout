import { CONFIG } from '../config.js';
import { Capsule } from '../domain/capsule.js';
import { getPowerUp } from '../domain/power-ups.js';
import { spawnExplosion } from '../infra/particles.js';
import { triggerShake } from '../infra/screenshake.js';
import { G, triggerSlowMo, COMBO_FADE_DURATION } from './init.js';

export function handleCollisions() {
  // --- Collisions drone/vaisseau + drone/astéroïdes (tous les drones) ---
  for (const drone of G.entities.drones) {
    if (!drone.launched) continue; // sticky / en attente → pas de collision
    const ev1 = G.session.checkShipCollision(drone, G.entities.ship);
    if (ev1) {
      G.ui.combo = 0;
      G.intensityDirector.onBounce();
    }

    const ev2 = G.session.checkAsteroidCollision(drone, G.entities.field);
    if (ev2) {
      spawnExplosion(ev2.x, ev2.y, ev2.color);
      G.intensityDirector.onAsteroidHit();
      if (ev2.type === 'asteroidHit' || ev2.type === 'asteroidFragment') {
        G.ui.combo++;
        if (G.ui.combo >= 2) {
          G.ui.comboDisplay = G.ui.combo;
          G.ui.comboFadeTimer = COMBO_FADE_DURATION;
        }
        const shakeAmount = CONFIG.screenshake.intensity[ev2.sizeName] || CONFIG.screenshake.intensity.small;
        triggerShake(shakeAmount);
        const puId = G.dropSystem.decideDrop({ materialKey: ev2.materialKey || 'rock', sizeName: ev2.sizeName || 'small' });
        if (puId) G.entities.capsules.push(new Capsule(puId, ev2.x, ev2.y, CONFIG.capsule));
        G.intensityDirector.onAsteroidDestroyed(G.entities.field.remaining, G.entities.totalAsteroids, G.ui.combo);
        if (G.entities.field.remaining === 0) triggerSlowMo();
      }
    }
  }

  // --- Capsules ramassées ---
  const gs = G.gs;
  const capEvts = G.session.checkCapsuleCollision(G.entities.capsules, G.entities.ship);
  for (const ce of capEvts) {
    G.puManager.activate(ce.powerUpId, gs);
    G.intensityDirector.onPowerUpActivated();
    spawnExplosion(ce.x, ce.y, getPowerUp(ce.powerUpId)?.color || '#fff');
  }

  // --- Expiration des power-ups ---
  const puCountBefore = G.puManager.getActive().length;
  G.puManager.update(gs);
  if (puCountBefore > 0 && G.puManager.getActive().length === 0) {
    G.intensityDirector.onPowerUpExpired();
  }

  // --- Drones perdus (multi-drone) ---
  // Itérer en sens inverse pour pouvoir splice sans décaler les indices
  for (let i = G.entities.drones.length - 1; i >= 0; i--) {
    if (!G.session.isDroneLost(G.entities.drones[i])) continue;

    if (G.entities.drones.length > 1) {
      // Drone bonus perdu → juste le retirer, pas de vie perdue
      G.entities.drones.splice(i, 1);
    } else {
      // Dernier drone perdu → perte de vie
      const livesLeft = G.session.loseLife();
      G.ui.combo = 0;
      if (livesLeft <= 0) {
        G.session.state = 'gameOver';
        G.intensityDirector.onGameOver();
      } else {
        G.entities.drones[0].reset(G.entities.ship);
        G.intensityDirector.onLifeChanged(livesLeft);
      }
    }
  }

  // Retarder le win pendant le slow-mo pour qu'il soit visible
  if (G.ui.slowMoTimer <= 0) {
    const ev4 = G.session.checkWin(G.entities.field);
    if (ev4) { G.intensityDirector.onWin(); }
  }
}
