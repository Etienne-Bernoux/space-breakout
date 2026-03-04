// --- État du progress lab (?progress) ---

const state = {
  active: false,
  tab: 'wallet',  // 'wallet' | 'upgrades' | 'simulator' | 'reset'
  // Simulator
  sim: {
    levelIndex: 0,
    result: 'victory',   // 'victory' | 'defeat'
    stars: 3,
    minerals: { copper: 0, silver: 0, gold: 0, platinum: 0 },
    livesLost: 0,
  },
};

export default state;
