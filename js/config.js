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
    rows: 4,
    cols: 8,
    width: 80,
    height: 25,
    padding: 10,
    offsetTop: 50,
    offsetLeft: 35,
    colors: ['#8b4513', '#a0522d', '#6b3a2a', '#7a4530'],
  },

  lives: 3,
  starCount: 120,
};
