// --- Sync DOM ← state pour le progress lab ---

import { MINERAL_IDS } from '../../../domain/mineral/index.js';
import { UPGRADE_IDS, getUpgrade } from '../../../use-cases/upgrade/upgrade-catalog.js';
import state from './state.js';

/** Rafraîchit le panel gauche (wallet minerais). */
export function updateLeftPanel(refs, wallet) {
  for (const id of MINERAL_IDS) {
    refs.wallet.rows[id].textContent = wallet.get(id);
  }
}

/** Rafraîchit le panel droit (upgrade levels). */
export function updateRightPanel(refs, upgrades) {
  for (const id of UPGRADE_IDS) {
    const u = getUpgrade(id);
    refs.upgrades.rows[id].textContent = `${upgrades.getLevel(id)}/${u.maxLevel}`;
  }
}

/** Rafraîchit le panel zones (systemMap). */
export function updateZonePanel(refs, zones, progress) {
  if (!refs.zone) return;
  for (const z of zones) {
    const row = refs.zone.rows[z.id];
    if (!row) continue;
    const unlocked = progress.isZoneUnlocked(z.id);
    row.lockBtn.textContent = unlocked ? '🔓' : '🔒';
    row.lockBtn.title = unlocked ? 'Verrouiller' : 'Débloquer';
    row.progress.textContent = unlocked ? 'Débloquée' : 'Verrouillée';
    row.progress.style.color = unlocked ? '#6c6' : '#666';
  }
}

/** Rafraîchit le modal simulateur. */
export function updateSimulator(refs) {
  const sim = state.sim;
  const sr = refs.simulator;

  sr.select.value = sim.levelIndex;

  sr.victoryBtn.classList.toggle('pl-btn-active', sim.result === 'victory');
  sr.defeatBtn.classList.toggle('pl-btn-active', sim.result === 'defeat');

  // Stars visibility
  sr.starsRow.style.opacity = sim.result === 'victory' ? '1' : '0.3';
  for (const btn of sr.starBtns) {
    btn.classList.toggle('pl-btn-active', Number(btn.dataset.value) === sim.stars);
    btn.disabled = sim.result !== 'victory';
  }

  // Minerals
  for (const id of MINERAL_IDS) {
    sr.mineralInputs[id].textContent = sim.minerals[id];
  }

  sr.livesSpan.textContent = sim.livesLost;
}
