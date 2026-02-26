export const CONFIG = {
  canvas: {
    width: 800,
    height: 600,
    baseHeight: 600,
  },

  ship: {
    width: 100,
    height: 20,
    mobileWidthRatio: 0.28,        // mobile : 28% de la largeur canvas
    speed: 7,
    color: '#00d4ff',
    bottomMargin: 10,              // desktop (fixe)
    bottomMarginMobileRatio: 0.08, // mobile : 8% de la hauteur canvas
  },

  drone: {
    radius: 6,
    mobileRadiusRatio: 0.02,       // mobile : 2% de la largeur canvas
    speed: 3,
    color: '#ffcc00',
  },

  asteroids: {
    rows: 6,
    cols: 10,
    cellW: 70,
    cellH: 28,
    padding: 6,
    offsetTop: 45,
    offsetLeft: 25,
    density: 0.6,
    colors: ['#8b4513', '#a0522d', '#6b3a2a', '#7a4530'],
  },

  scoring: {
    basePoints: { large: 40, medium: 20, small: 10 },
  },

  capsule: {
    speedY: 1.5,
    radius: 10,
    bobSpeed: 0.06,
    bobAmplitude: 0.4,
    rotationSpeed: 0.03,
  },

  drop: {
    baseRate: 0.012,
    sizeMult: { large: 1.4, medium: 1.0, small: 0.6 },
  },

  screenshake: {
    intensity: { large: 6, medium: 3, small: 1.5 },
    decay: 0.85,
  },

  lives: 3,
  starCount: 120,
};
