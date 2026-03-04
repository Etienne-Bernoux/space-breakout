// --- Infra adapters : regroupement des imports infra pour injection dans GameLoop / InputHandler ---
// Extrait de init.js pour alléger la composition root.

import { spawnExplosion, spawnShipExplosion, spawnAlienExplosion, spawnBossExplosion, spawnBounceFlash, spawnComboSparkle, spawnTrail, updateParticles } from '../infra/particles.js';
import { playAlienShoot } from '../infra/audio.js';
import { triggerShake, updateShake, setAmbientShake } from '../infra/screenshake.js';
import { isDevMode, isDevPanelActive, drawDevPanel, handleDevHover, handleDevTap, handleDevDrag, handleDevRelease, hideDevPanel, showDevPanel } from '../infra/dev-panel/index.js';
import { updateDevOverlay } from '../infra/dev-overlay/index.js';
import { updateStars } from '../infra/stars.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from '../infra/touch.js';
import { updateMenu, updateMenuHover, handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu } from '../infra/menu/index.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/power-up-render.js';
import { isMusicLabActive, drawMusicLab, handleMusicLabHover, handleMusicLabTap, handleMusicLabScroll } from '../infra/music-lab/index.js';
import { drawShip } from '../infra/renderers/ship-render.js';
import { drawDrone } from '../infra/renderers/drone-render.js';
import { drawField } from '../infra/renderers/field-render.js';
import { spawnDebris, updateDebris } from '../infra/renderers/debris-render.js';
import { drawProjectile } from '../infra/renderers/projectile-render.js';
import { drawWorldMap, getNodePositions } from '../infra/screens/world-map.js';
import { drawStatsScreen, getStatsButtons } from '../infra/screens/stats-screen.js';
import { AlienProjectile } from '../domain/projectile/index.js';
import { getAllLevels } from '../domain/progression/level-catalog.js';

export const loopInfra = {
  updateStars, getMousePos, getTouchX,
  updateMenu, updateMenuHover,
  spawnTrail, updateParticles,
  updateShake, setAmbientShake,
  drawCapsule, drawPowerUpHUD,
  isDevPanelActive, drawDevPanel, handleDevHover,
  isMusicLabActive, drawMusicLab, handleMusicLabHover,
  updateDevOverlay,
  drawShip, drawDrone, drawField,
  updateDebris,
  drawWorldMap, drawStatsScreen, getAllLevels,
  AlienProjectile,
  drawProjectile,
  playAlienShoot,
};

export const inputInfra = {
  setupTouch, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler,
  handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu,
  isDevPanelActive, handleDevTap, handleDevDrag, handleDevRelease, hideDevPanel, isDevMode, showDevPanel,
  isMusicLabActive, handleMusicLabTap, handleMusicLabScroll,
  getNodePositions, getStatsButtons, getAllLevels,
};

export const collisionEffects = {
  spawnExplosion, spawnShipExplosion, spawnAlienExplosion, spawnBossExplosion, spawnBounceFlash, spawnComboSparkle, triggerShake, spawnDebris,
};
