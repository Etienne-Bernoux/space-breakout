import { expect } from 'chai';
import { DropSystem } from './drop-system.js';
import { POWER_UP_IDS } from '../../domain/power-ups.js';

function makeAsteroid(overrides = {}) {
  return { materialKey: 'rock', sizeName: 'medium', ...overrides };
}

describe('DropSystem', () => {
  it('retourne un powerUpId ou null', () => {
    const ds = new DropSystem({ baseRate: 0.05 });
    let gotDrop = false, gotNull = false;
    for (let i = 0; i < 1000; i++) {
      const r = ds.decideDrop(makeAsteroid());
      if (r === null) gotNull = true;
      else gotDrop = true;
      if (gotDrop && gotNull) break;
    }
    expect(gotDrop).to.be.true;
    expect(gotNull).to.be.true;
  });

  it('retourne uniquement des IDs valides', () => {
    const ds = new DropSystem({ baseRate: 1 });
    for (let i = 0; i < 100; i++) {
      const id = ds.decideDrop(makeAsteroid());
      if (id !== null) {
        expect(POWER_UP_IDS).to.include(id);
      }
    }
  });

  it('large astéroïdes droppent plus souvent', () => {
    const ds = new DropSystem({ baseRate: 0.05 });
    let dropsLarge = 0, dropsSmall = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (ds.decideDrop(makeAsteroid({ sizeName: 'large' }))) dropsLarge++;
      if (ds.decideDrop(makeAsteroid({ sizeName: 'small' }))) dropsSmall++;
    }
    expect(dropsLarge).to.be.above(dropsSmall);
  });

  it('obsidian ne drop rien (poids 0)', () => {
    const ds = new DropSystem({ baseRate: 1 });
    let drops = 0;
    for (let i = 0; i < 100; i++) {
      if (ds.decideDrop(makeAsteroid({ materialKey: 'obsidian' }))) drops++;
    }
    expect(drops).to.equal(0);
  });
});
