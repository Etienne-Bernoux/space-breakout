// --- État du progress lab (?progress) ---

const state = {
  active: false,
  selectedMineral: 0,    // index dans MINERAL_IDS
  selectedUpgrade: 0,    // index dans UPGRADE_IDS
  tab: 'wallet',         // 'wallet' | 'upgrades' | 'reset'
  hoveredBtn: null,
};

export default state;
