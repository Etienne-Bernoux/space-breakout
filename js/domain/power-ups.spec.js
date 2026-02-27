import { expect } from 'chai';
import { POWER_UPS, POWER_UP_IDS, getPowerUp } from './power-ups.js';

describe('power-ups definitions', () => {
  it('définit 12 power-ups', () => {
    expect(POWER_UP_IDS).to.have.length(12);
  });

  it('chaque power-up a les champs requis', () => {
    for (const id of POWER_UP_IDS) {
      const pu = POWER_UPS[id];
      expect(pu, id).to.have.property('id', id);
      expect(pu, id).to.have.property('name').that.is.a('string');
      expect(pu, id).to.have.property('type').that.is.oneOf(['bonus', 'malus']);
      expect(pu, id).to.have.property('duration').that.is.a('number');
      expect(pu, id).to.have.property('color').that.is.a('string');
      expect(pu, id).to.have.property('effect').that.is.an('object');
      expect(pu, id).to.have.property('dropWeight').that.is.an('object');
    }
  });

  it('les instants (duration 0) ont un delta ou action', () => {
    for (const id of POWER_UP_IDS) {
      const pu = POWER_UPS[id];
      if (pu.duration === 0) {
        const hasAction = 'action' in pu.effect || 'delta' in pu.effect;
        expect(hasAction, `${id} devrait avoir action ou delta`).to.be.true;
      }
    }
  });

  it('getPowerUp retourne null pour id inconnu', () => {
    expect(getPowerUp('nope')).to.be.null;
  });

  it('getPowerUp retourne la bonne définition', () => {
    expect(getPowerUp('shipWide').name).to.equal('Vaisseau élargi');
  });
});
