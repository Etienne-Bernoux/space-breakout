// --- Infra adapters : regroupement des imports infra pour injection dans GameLoop / InputHandler ---
// Extrait de init.js pour alléger la composition root.

import { spawnExplosion, spawnShipExplosion, spawnAlienExplosion, spawnBossExplosion, spawnBounceFlash, spawnComboSparkle, spawnTrail, updateParticles } from '../infra/effects/particles.js';
import { playAlienShoot, playMineralPickup } from '../infra/sfx/audio.js';
import { triggerShake, updateShake, setAmbientShake } from '../infra/effects/screenshake.js';
import { isDevPanelActive, hideDevPanel, showDevPanel } from '../infra/lab/dev-panel/index.js';
import { isLabMode, isLabHubActive } from '../infra/lab/hub/index.js';
import { updateDevOverlay } from '../infra/dev-overlay/index.js';
import { updateStars } from '../infra/effects/stars.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from '../infra/input/touch.js';
import { updateMenu, updateMenuHover, handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu } from '../infra/menu/index.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/renderers/power-up-render.js';
import { drawMineralCapsule, drawMineralHUD } from '../infra/renderers/mineral-render.js';
import { isMusicLabActive } from '../infra/lab/music-lab/index.js';
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

export const loopInfra = {
  updateStars, getMousePos, getTouchX,
  updateMenu, updateMenuHover,
  spawnTrail, updateParticles,
  updateShake, setAmbientShake,
  drawCapsule, drawPowerUpHUD, drawMineralCapsule, drawMineralHUD,
  isDevPanelActive,
  isMusicLabActive,
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
  setupTouch, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler,
  handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu,
  isDevPanelActive, hideDevPanel, isLabMode, showDevPanel,
  isMusicLabActive, isLabHubActive,
  isProgressLabActive, isSimulatorOpen, showSimulatorModal, hideSimulatorModal,
  initProgressLab, showProgressLab, hideProgressLab,
  getNodePositions, getUpgradeButtonRect, getSystemNodePositions, getStatsButtons, getUpgradeScreenButtons,
  nextCategory, prevCategory, nextUpgrade, prevUpgrade, selectUpgrade, getSelectedUpgradeIndex, getVisibleUpgrades,
  getAllLevels, getAllZones,
};

export const collisionEffects = {
  spawnExplosion, spawnShipExplosion, spawnAlienExplosion, spawnBossExplosion, spawnBounceFlash, spawnComboSparkle, triggerShake, spawnDebris, playMineralPickup,
};
