import state from './state.js';
import { drawFloatingRocks, drawMenu } from './draw-menu.js';
import { drawSettingsScreen } from './draw-settings.js';
import { drawCreditsScreen } from './draw-credits.js';
import {
  handleMenuInput,
  handleMenuTap,
  handleMenuDrag,
  handleMenuRelease,
  updateMenuHover,
  resetMenu,
} from './handlers.js';

// Public API - re-exported from state
export {
  setVolumeChangeCallback,
  getMusicVolume,
  getSfxVolume,
  loadSettings,
} from './state.js';

// Public API - re-exported from handlers
export {
  handleMenuInput,
  handleMenuTap,
  handleMenuDrag,
  handleMenuRelease,
  updateMenuHover,
  resetMenu,
};

export function updateMenu(ctx) {
  const showSettings = state.showSettings();
  const showCredits = state.showCredits();

  drawFloatingRocks(ctx);

  if (showSettings) {
    drawSettingsScreen(ctx);
  } else if (showCredits) {
    drawCreditsScreen(ctx);
  } else {
    drawMenu(ctx);
  }
}
