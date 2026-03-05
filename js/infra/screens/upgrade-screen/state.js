// --- État de l'écran upgrade ---

import { UPGRADE_CATEGORIES, getUpgradesByCategory } from '../../../use-cases/upgrade/upgrade-catalog.js';

const CATEGORY_KEYS = Object.keys(UPGRADE_CATEGORIES);

const state = {
  selectedCategory: 0,
  selectedUpgrade: 0,
  hoveredBtn: null, // 'buy' | 'back' | null
};

export default state;

export function getSelectedCategoryKey() {
  return CATEGORY_KEYS[state.selectedCategory] || CATEGORY_KEYS[0];
}

export function getVisibleUpgrades() {
  return getUpgradesByCategory(getSelectedCategoryKey());
}

export function nextCategory() {
  state.selectedCategory = (state.selectedCategory + 1) % CATEGORY_KEYS.length;
  state.selectedUpgrade = 0;
}

export function prevCategory() {
  state.selectedCategory = (state.selectedCategory - 1 + CATEGORY_KEYS.length) % CATEGORY_KEYS.length;
  state.selectedUpgrade = 0;
}

export function getSelectedUpgradeIndex() {
  return state.selectedUpgrade;
}

export function selectUpgrade(index) {
  const upgrades = getVisibleUpgrades();
  if (index >= 0 && index < upgrades.length) {
    state.selectedUpgrade = index;
  }
}

export function nextUpgrade() {
  const upgrades = getVisibleUpgrades();
  if (upgrades.length > 0) {
    state.selectedUpgrade = (state.selectedUpgrade + 1) % upgrades.length;
  }
}

export function prevUpgrade() {
  const upgrades = getVisibleUpgrades();
  if (upgrades.length > 0) {
    state.selectedUpgrade = (state.selectedUpgrade - 1 + upgrades.length) % upgrades.length;
  }
}

export { CATEGORY_KEYS, UPGRADE_CATEGORIES };
