import { expect } from 'chai';
import { MATERIALS, getMaterial } from './materials.js';

describe('materials', () => {
  it('définit 6 matériaux', () => {
    expect(Object.keys(MATERIALS)).to.have.length(6);
  });

  it('chaque matériau a les champs requis', () => {
    for (const [key, mat] of Object.entries(MATERIALS)) {
      expect(mat, key).to.have.property('hp');
      expect(mat, key).to.have.property('destructible');
      expect(mat, key).to.have.property('colors').that.is.an('array').with.length.greaterThan(0);
      expect(mat, key).to.have.property('style').that.is.a('string');
      expect(mat, key).to.have.property('pointsMult').that.is.a('number');
    }
  });

  it('obsidian est indestructible (hp Infinity)', () => {
    expect(MATERIALS.obsidian.hp).to.equal(Infinity);
    expect(MATERIALS.obsidian.destructible).to.be.false;
  });

  it('getMaterial retourne rock en fallback', () => {
    expect(getMaterial('unknown')).to.equal(MATERIALS.rock);
  });

  it('getMaterial retourne le bon matériau', () => {
    expect(getMaterial('ice')).to.equal(MATERIALS.ice);
  });
});
