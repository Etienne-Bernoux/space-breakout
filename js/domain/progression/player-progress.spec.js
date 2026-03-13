import { describe, it, expect } from 'vitest';
import { PlayerProgress } from './player-progress.js';

describe('PlayerProgress', () => {
  it('démarre avec z1-1 déverrouillé par défaut', () => {
    const p = new PlayerProgress();
    expect(p.isUnlocked('z1-1')).toBe(true);
    expect(p.isUnlocked('z1-2')).toBe(false);
  });

  it('restaure depuis des données sérialisées', () => {
    const p = new PlayerProgress({
      stars: [['z1-1', 3], ['z1-2', 1]],
      unlockedUpTo: 'z1-3',
    });
    expect(p.getStars('z1-1')).toBe(3);
    expect(p.getStars('z1-2')).toBe(1);
    expect(p.isUnlocked('z1-3')).toBe(true);
    expect(p.isUnlocked('z1-4')).toBe(false);
  });

  it('retourne 0 étoiles pour un niveau non joué', () => {
    const p = new PlayerProgress();
    expect(p.getStars('z1-5')).toBe(0);
  });

  it('compléter un niveau déverrouille le suivant', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 2);
    expect(p.getStars('z1-1')).toBe(2);
    expect(p.isUnlocked('z1-2')).toBe(true);
    expect(p.isUnlocked('z1-3')).toBe(false);
  });

  it('conserve le meilleur score d\'étoiles', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 3);
    p.complete('z1-1', 1);
    expect(p.getStars('z1-1')).toBe(3);
  });

  it('un meilleur score écrase le précédent', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 1);
    p.complete('z1-1', 3);
    expect(p.getStars('z1-1')).toBe(3);
  });

  it('compléter le dernier niveau ne plante pas', () => {
    const p = new PlayerProgress({ unlockedUpTo: 'z1-6' });
    p.complete('z1-6', 2);
    expect(p.getStars('z1-6')).toBe(2);
  });

  it('sérialise et désérialise correctement', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 3);
    p.complete('z1-2', 2);
    const json = p.toJSON();
    const restored = new PlayerProgress(json);
    expect(restored.getStars('z1-1')).toBe(3);
    expect(restored.getStars('z1-2')).toBe(2);
    expect(restored.isUnlocked('z1-3')).toBe(true);
  });
});
