export const CONFIG = {
  canvas: {
    width: 800,
    height: 600,
    baseHeight: 600,
  },

  ship: {
    width: 100,
    height: 14,
    mobileWidthRatio: 0.28,        // mobile : 28% de la largeur canvas
    speed: 7,
    color: '#00d4ff',
    bottomMargin: 10,              // desktop (fixe)
    bottomMarginMobileRatio: 0.08, // mobile : 8% de la hauteur canvas
    advance: {
      baseSpeed: 0.015,          // px/frame (dt=1)
      timeFactor: 0.008,         // accélération par seconde écoulée
      remainingFactor: 1.5,      // accélération quand il reste peu d'astéroïdes
      minY: 200,                 // le vaisseau ne monte pas au-dessus
      minDelay: 10,              // délai initial minimum (secondes)
      maxDelay: 30,              // délai initial maximum (secondes)
      maxAsteroidsRef: 80,       // seuil d'astéroïdes pour atteindre maxDelay
    },
  },

  drone: {
    radius: 6,
    mobileRadiusRatio: 0.02,       // mobile : 2% de la largeur canvas
    speed: 3,
    mobileSpeedRatio: 0.006,       // mobile : 0.6% de la hauteur canvas
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
    canvasW: 800,    // largeur canvas pour calcul auto cellW
    areaH: 400,      // hauteur zone astéroïdes pour calcul auto cellH
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

  combo: {
    fadeDuration: 90,   // frames d'affichage du combo (utilisé par collision-handler + hud-render)
    slowMoDuration: 30, // frames de slow-motion sur destruction
  },

  mineralDrop: {
    baseRate: 0.08,
    sizeMult: { large: 1.6, medium: 1.0, small: 0.5 },
  },

  mineralCapsule: {
    speedY: 1.8,
    radius: 7,
    bobSpeed: 0.05,
    bobAmplitude: 0.3,
    rotationSpeed: 0.04,
  },

  lives: 3,
  starCount: 120,
};
