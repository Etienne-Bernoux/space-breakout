// --- Handlers du mineral lab ---

import { MINERAL_IDS } from '../../domain/mineral/index.js';
import { UPGRADE_IDS } from '../../use-cases/upgrade/upgrade-catalog.js';
import state from './state.js';

const TABS = ['wallet', 'upgrades', 'reset'];

/**
 * Gère l'input clavier dans le mineral lab.
 * @param {string} key
 * @param {object} wallet - MineralWallet
 * @param {object} upgrades - UpgradeManager
 * @param {object} progress - PlayerProgress
 * @param {function} saveProgress
 * @returns {string|null} 'exit' pour quitter le lab
 */
export function handleMineralLabKey(key, wallet, upgrades, progress, saveProgress) {
  if (key === 'Escape') return 'exit';

  // Tab switching
  if (key === 'Tab') {
    const idx = TABS.indexOf(state.tab);
    state.tab = TABS[(idx + 1) % TABS.length];
    return null;
  }

  if (state.tab === 'wallet') {
    if (key === 'ArrowUp') state.selectedMineral = Math.max(0, state.selectedMineral - 1);
    if (key === 'ArrowDown') state.selectedMineral = Math.min(MINERAL_IDS.length - 1, state.selectedMineral + 1);
    if (key === '+' || key === '=') {
      wallet.add(MINERAL_IDS[state.selectedMineral], 10);
      wallet.save();
    }
    if (key === '-') {
      const id = MINERAL_IDS[state.selectedMineral];
      const qty = wallet.get(id);
      if (qty > 0) {
        wallet.add(id, -Math.min(10, qty));
        wallet.save();
      }
    }
  }

  if (state.tab === 'upgrades') {
    if (key === 'ArrowUp') state.selectedUpgrade = Math.max(0, state.selectedUpgrade - 1);
    if (key === 'ArrowDown') state.selectedUpgrade = Math.min(UPGRADE_IDS.length - 1, state.selectedUpgrade + 1);
    if (key === '+' || key === '=') {
      const id = UPGRADE_IDS[state.selectedUpgrade];
      // Force-buy (bypass cost) for testing
      if (!upgrades.isMaxed(id)) {
        upgrades._levels.set(id, upgrades.getLevel(id) + 1);
        upgrades.save();
      }
    }
    if (key === '-') {
      const id = UPGRADE_IDS[state.selectedUpgrade];
      if (upgrades.getLevel(id) > 0) {
        upgrades._levels.set(id, upgrades.getLevel(id) - 1);
        upgrades.save();
      }
    }
  }

  if (state.tab === 'reset') {
    if (key === 'r' || key === 'R' || key === 'Enter') {
      wallet.reset();
      wallet.save();
      upgrades.reset();
      upgrades.save();
      progress.reset();
      saveProgress(progress);
    }
  }

  return null;
}
