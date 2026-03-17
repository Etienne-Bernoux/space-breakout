// --- Infra adapters : regroupement des imports infra pour injection dans GameLoop / InputHandler ---
// Extrait de init.js pour alléger la composition root.

import { spawnExplosion, spawnShipExplosion, spawnAlienExplosion, spawnBossExplosion, spawnBounceFlash, spawnComboSparkle, spawnTrail, updateParticles } from '../contexts/audio/infra/effects/particles.js';
import { playAlienShoot, playMineralPickup } from '../contexts/audio/infra/sfx/audio.js';
import { triggerShake, updateShake, setAmbientShake } from '../contexts/audio/infra/effects/screenshake.js';
import { isDevPanelActive, hideDevPanel, showDevPanel } from '../infra/lab/dev-panel/index.js';
import { isLabMode, isLabHubActive } from '../infra/lab/hub/index.js';
import { updateDevOverlay } from '../infra/dev-overlay/index.js';
import { updateStars, setBodyTheme } from '../contexts/audio/infra/effects/stars.js';
import { setupPointer, getPointerX, setAIPointerX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos, setGameState } from '../infra/input/pointer.js';
import { updateMenu, updateMenuHover, handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu } from '../infra/menu/index.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/renderers/power-up-render.js';
import { drawMineralCapsule, drawMineralHUD, resetMineralSessionGains, addMineralSessionGain } from '../infra/renderers/mineral-render.js';
import { isMusicLabActive } from '../infra/lab/music-lab/index.js';
import { isAILabActive } from '../infra/lab/ai-lab/index.js';
import { isProgressLabActive, isSimulatorOpen, showSimulatorModal, hideSimulatorModal, initProgressLab, showProgressLab, hideProgressLab } from '../infra/lab/progress-lab/index.js';
import { drawShip } from '../infra/renderers/ship-render.js';
import { drawDrone } from '../infra/renderers/drone-render.js';
import { drawField } from '../infra/renderers/field-render.js';
import { spawnDebris, updateDebris } from '../infra/renderers/debris-render.js';
import { drawProjectile } from '../infra/renderers/projectile-render.js';
import { drawWorldMap, getNodePositions, getUpgradeButtonRect } from '../infra/screens/world-map/index.js';
import { drawSystemMap, getSystemNodePositions } from '../infra/screens/system-map/index.js';
import { drawStatsScreen, getStatsButtons } from '../infra/screens/stats-screen.js';
import { drawUpgradeScreen, getUpgradeScreenButtons, nextCategory, prevCategory, nextUpgrade, prevUpgrade, selectUpgrade, getSelectedUpgradeIndex, getVisibleUpgrades } from '../infra/screens/upgrade-screen/index.js';
import { AlienProjectile } from '../domain/projectile/index.js';
import { getAllLevels } from '../domain/progression/level-catalog.js';
import { getAllZones } from '../domain/progression/zone-catalog.js';

/** Vérifie si un lab DOM-only est actif (masque le canvas). */
function isLabOverlayActive() {
  return isMusicLabActive() || isDevPanelActive() || isAILabActive();
}

export const loopInfra = {
  updateStars, getMousePos, getPointerX, setAIPointerX, setGameState, isLabOverlayActive,
  updateMenu, updateMenuHover,
  spawnTrail, updateParticles,
  updateShake, setAmbientShake,
  drawCapsule, drawPowerUpHUD, drawMineralCapsule, drawMineralHUD,
  isDevPanelActive,
  isMusicLabActive,
  isAILabActive,
  isProgressLabActive,
  isLabHubActive,
  updateDevOverlay,
  drawShip, drawDrone, drawField,
  updateDebris,
  drawWorldMap, drawSystemMap, getSystemNodePositions, drawStatsScreen, drawUpgradeScreen, getAllLevels, getAllZones,
  AlienProjectile,
  drawProjectile,
  playAlienShoot,
};

export const inputInfra = {
  setupPointer, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler,
  handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu,
  isDevPanelActive, hideDevPanel, isLabMode, showDevPanel,
  isMusicLabActive, isAILabActive, isLabHubActive,
  isProgressLabActive, isSimulatorOpen, showSimulatorModal, hideSimulatorModal,
  initProgressLab, showProgressLab, hideProgressLab,
  getNodePositions, getUpgradeButtonRect, getSystemNodePositions, getStatsButtons, getUpgradeScreenButtons,
  nextCategory, prevCategory, nextUpgrade, prevUpgrade, selectUpgrade, getSelectedUpgradeIndex, getVisibleUpgrades,
  getAllLevels, getAllZones,
};

export const collisionEffects = {
  spawnExplosion, spawnShipExplosion, spawnAlienExplosion, spawnBossExplosion, spawnBounceFlash, spawnComboSparkle, triggerShake, spawnDebris, playMineralPickup, addMineralSessionGain,
};

export { resetMineralSessionGains, setBodyTheme };
