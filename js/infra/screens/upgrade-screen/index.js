// --- Façade écran upgrade ---

export { drawUpgradeScreen, getUpgradeScreenButtons } from './draw.js';
export { default as upgradeScreenState, nextCategory, prevCategory, nextUpgrade, prevUpgrade, selectUpgrade, getSelectedUpgradeIndex, getVisibleUpgrades } from './state.js';
