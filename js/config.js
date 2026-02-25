export const CONFIG = {
  canvas: {
    width: 800,
    height: 600,
    baseHeight: 600,
  },

  ship: {
    width: 100,
    height: 20,
    speed: 7,
    color: '#00d4ff',
  },

  drone: {
    radius: 6,
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

  lives: 3,
  starCount: 120,
};
