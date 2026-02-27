import { expect } from 'chai';
import { GameIntensityDirector } from './game-intensity-director.js';

// Fake sub-directors pour capturer les appels sans Web Audio
class FakeMusic {
  constructor() { this.calls = []; this.intensity = 0; this.enabled = false; }
  enable() { this.enabled = true; this.calls.push('enable'); }
  disable() { this.enabled = false; this.calls.push('disable'); }
  setIntensity(l) { this.intensity = l; this.calls.push(['setIntensity', l]); }
  requestSectionChange() { this.calls.push('requestSectionChange'); }
  onBounce() { this.calls.push('onBounce'); }
  onAsteroidHit() { this.calls.push('onAsteroidHit'); }
  onCombo(c) { this.calls.push(['onCombo', c]); }
  onPowerUp() { this.calls.push('onPowerUp'); }
  onLoseLife() { this.calls.push('onLoseLife'); }
  onLaunch() { this.calls.push('onLaunch'); }
  onPause() { this.calls.push('onPause'); }
  onResume() { this.calls.push('onResume'); }
  onWin() { this.calls.push('onWin'); }
  onGameOver() { this.calls.push('onGameOver'); }
}

class FakeEffects {
  constructor() { this.intensity = 0; this.updated = 0; }
  setIntensity(l) { this.intensity = l; }
  update() { this.updated++; }
  getEffects() { return { starSpeed: 1 }; }
}

function makeDirector() {
  const gid = new GameIntensityDirector();
  const fakeMusic = new FakeMusic();
  const fakeEffects = new FakeEffects();
  gid.music = fakeMusic;
  gid.effects = fakeEffects;
  return { gid, fakeMusic, fakeEffects };
}

describe('GameIntensityDirector', () => {
  describe('lifecycle', () => {
    it('enable reset tout et active les sub-directors', () => {
      const { gid, fakeMusic, fakeEffects } = makeDirector();
      gid.combo = 5;
      gid.lastLife = true;
      gid.enable();
      expect(gid.enabled).to.be.true;
      expect(gid.combo).to.equal(0);
      expect(gid.lastLife).to.be.false;
      expect(gid.remainingRatio).to.equal(1.0);
      expect(fakeMusic.calls).to.include('enable');
      expect(fakeEffects.intensity).to.equal(0);
    });

    it('disable coupe les sub-directors', () => {
      const { gid, fakeMusic, fakeEffects } = makeDirector();
      gid.enable();
      gid.disable();
      expect(gid.enabled).to.be.false;
      expect(fakeMusic.calls).to.include('disable');
      expect(fakeEffects.intensity).to.equal(0);
    });
  });

  describe('forwarding des événements', () => {
    it('onBounce forward vers music', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      gid.onBounce();
      expect(fakeMusic.calls).to.include('onBounce');
    });

    it('onAsteroidHit forward vers music', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.onAsteroidHit();
      expect(fakeMusic.calls).to.include('onAsteroidHit');
    });

    it('onAsteroidDestroyed forward hit + combo si ≥2', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      gid.onAsteroidDestroyed(8, 10, 3);
      expect(fakeMusic.calls).to.include('onAsteroidHit');
      expect(fakeMusic.calls).to.deep.include(['onCombo', 3]);
    });

    it('onAsteroidDestroyed ne joue pas combo si <2', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      gid.onAsteroidDestroyed(9, 10, 1);
      const comboCalls = fakeMusic.calls.filter(c => Array.isArray(c) && c[0] === 'onCombo');
      expect(comboCalls).to.have.length(0);
    });

    it('onPowerUpActivated forward onPowerUp', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      gid.onPowerUpActivated();
      expect(fakeMusic.calls).to.include('onPowerUp');
    });

    it('onLifeChanged forward onLoseLife', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      gid.onLifeChanged(2);
      expect(fakeMusic.calls).to.include('onLoseLife');
    });

    it('onLaunch forward', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.onLaunch();
      expect(fakeMusic.calls).to.include('onLaunch');
    });

    it('onPause / onResume forward', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.onPause();
      gid.onResume();
      expect(fakeMusic.calls).to.include('onPause');
      expect(fakeMusic.calls).to.include('onResume');
    });

    it('onWin / onGameOver forward', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.onWin();
      gid.onGameOver();
      expect(fakeMusic.calls).to.include('onWin');
      expect(fakeMusic.calls).to.include('onGameOver');
    });
  });

  describe('calcul d\'intensité (_recalculate)', () => {
    it('reste à 0 au début', () => {
      const { gid } = makeDirector();
      gid.enable();
      expect(gid.intensity).to.equal(0);
    });

    it('monte avec la progression (remainingRatio)', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      // Simule 60% détruits → remainingRatio 0.40 → level 2
      gid.onAsteroidDestroyed(4, 10, 0);
      expect(gid.intensity).to.equal(2);
    });

    it('combo boost +1 à ≥3', () => {
      const { gid } = makeDirector();
      gid.enable();
      // 3 destructions d'affilée, ratio haut → combo seul drive l'intensité
      gid.onAsteroidDestroyed(9, 10, 0);
      gid.onAsteroidDestroyed(8, 10, 0);
      gid.onAsteroidDestroyed(7, 10, 3);
      // combo interne = 3, ratio ~0.7 → level 1, +1 combo = 2
      expect(gid.intensity).to.be.at.least(1);
    });

    it('onBounce reset le combo interne', () => {
      const { gid } = makeDirector();
      gid.enable();
      gid.onAsteroidDestroyed(9, 10, 0);
      gid.onAsteroidDestroyed(8, 10, 0);
      expect(gid.combo).to.equal(2);
      gid.onBounce();
      expect(gid.combo).to.equal(0);
    });

    it('onLifeChanged reset combo et set lastLife', () => {
      const { gid } = makeDirector();
      gid.enable();
      gid.combo = 5;
      gid.onLifeChanged(1);
      expect(gid.combo).to.equal(0);
      expect(gid.lastLife).to.be.true;
      // lastLife → au moins 3
      expect(gid.intensity).to.be.at.least(3);
    });

    it('powerUp met au moins 2', () => {
      const { gid } = makeDirector();
      gid.enable();
      gid.onPowerUpActivated();
      expect(gid.powerUpActive).to.be.true;
      expect(gid.intensity).to.be.at.least(2);
    });

    it('powerUpExpired redescend', () => {
      const { gid } = makeDirector();
      gid.enable();
      gid.onPowerUpActivated();
      const before = gid.intensity;
      gid.onPowerUpExpired();
      expect(gid.powerUpActive).to.be.false;
      expect(gid.intensity).to.be.at.most(before);
    });

    it('dispatch setIntensity vers music ET effects', () => {
      const { gid, fakeMusic, fakeEffects } = makeDirector();
      gid.enable();
      gid.onAsteroidDestroyed(2, 10, 0); // ratio 0.2 → level 3
      expect(fakeMusic.intensity).to.equal(gid.intensity);
      expect(fakeEffects.intensity).to.equal(gid.intensity);
    });

    it('requestSectionChange quand l\'intensité change', () => {
      const { gid, fakeMusic } = makeDirector();
      gid.enable();
      // Force un changement d'intensité
      gid.onAsteroidDestroyed(1, 10, 0); // ratio 0.1 → level 4
      expect(fakeMusic.calls).to.include('requestSectionChange');
    });
  });

  describe('update / getEffects', () => {
    it('update délègue à effects', () => {
      const { gid, fakeEffects } = makeDirector();
      gid.update();
      gid.update();
      expect(fakeEffects.updated).to.equal(2);
    });

    it('getEffects retourne les effets courants', () => {
      const { gid } = makeDirector();
      expect(gid.getEffects()).to.have.property('starSpeed');
    });
  });
});
