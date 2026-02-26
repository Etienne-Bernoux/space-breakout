import { expect } from 'chai';
import { EffectDirector } from './effect-director.js';

describe('EffectDirector', () => {
  describe('état initial', () => {
    it('démarre au preset calm (level 0)', () => {
      const ed = new EffectDirector();
      const fx = ed.getEffects();
      expect(fx.starSpeed).to.equal(1.0);
      expect(fx.vignetteAlpha).to.equal(0);
      expect(fx.microShake).to.equal(0);
      expect(fx.scoreGlow).to.equal(0);
      expect(fx.scoreColor).to.equal('#ffffff');
    });
  });

  describe('setIntensity', () => {
    it('change la cible vers le preset demandé', () => {
      const ed = new EffectDirector();
      ed.setIntensity(4);
      // Avant update, _current est toujours calm
      expect(ed.getEffects().starSpeed).to.equal(1.0);
      // Après beaucoup d'updates, on converge vers climax
      for (let i = 0; i < 500; i++) ed.update();
      const fx = ed.getEffects();
      expect(fx.starSpeed).to.be.closeTo(2.5, 0.01);
      expect(fx.vignetteAlpha).to.be.closeTo(0.20, 0.01);
      expect(fx.microShake).to.be.closeTo(1.5, 0.05);
      expect(fx.scoreGlow).to.be.closeTo(12, 0.1);
      expect(fx.scoreColor).to.equal('#ffaa44');
    });

    it('level invalide fallback sur preset 0', () => {
      const ed = new EffectDirector();
      ed.setIntensity(99);
      for (let i = 0; i < 500; i++) ed.update();
      expect(ed.getEffects().starSpeed).to.be.closeTo(1.0, 0.01);
    });
  });

  describe('lerp progressif', () => {
    it('un seul update ne saute pas directement à la cible', () => {
      const ed = new EffectDirector();
      ed.setIntensity(4);
      ed.update();
      const fx = ed.getEffects();
      // Un seul frame : starSpeed devrait être ~1.0 + (2.5-1.0)*0.06 = 1.09
      expect(fx.starSpeed).to.be.greaterThan(1.0);
      expect(fx.starSpeed).to.be.lessThan(1.2);
    });

    it('les couleurs RGB lerpent aussi', () => {
      const ed = new EffectDirector();
      const before = [...ed.getEffects().deathLine];
      ed.setIntensity(4); // deathLine [255, 50, 30]
      ed.update();
      const after = ed.getEffects().deathLine;
      // Le rouge augmente (0 → 255)
      expect(after[0]).to.be.greaterThan(before[0]);
      // Mais pas encore à destination
      expect(after[0]).to.be.lessThan(255);
    });
  });

  describe('retour au calm', () => {
    it('redescend vers le preset 0 après setIntensity(0)', () => {
      const ed = new EffectDirector();
      ed.setIntensity(4);
      for (let i = 0; i < 500; i++) ed.update();
      // Maintenant on est à climax
      expect(ed.getEffects().starSpeed).to.be.closeTo(2.5, 0.01);
      // Retour au calm
      ed.setIntensity(0);
      for (let i = 0; i < 500; i++) ed.update();
      expect(ed.getEffects().starSpeed).to.be.closeTo(1.0, 0.01);
      expect(ed.getEffects().vignetteAlpha).to.be.closeTo(0, 0.01);
    });
  });
});
