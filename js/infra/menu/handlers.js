import state from './state.js';
import { layout, menuItemLayout } from './draw-menu.js';
import { hitSlider, updateSliderValue, settingsBackBtnLayout } from './draw-settings.js';
import { creditsBackBtnLayout } from './draw-credits.js';

export function handleMenuInput(key) {
  const showSettings = state.showSettings();
  const showCredits = state.showCredits();
  const menuItems = state.menuItems;
  let selected = state.selected();

  if (showSettings) {
    if (key === 'Escape') state.setShowSettings(false);
    return null;
  }
  if (showCredits) {
    if (key === 'Escape') state.setShowCredits(false);
    return null;
  }

  if (key === 'ArrowUp') selected = (selected - 1 + menuItems.length) % menuItems.length;
  if (key === 'ArrowDown') selected = (selected + 1) % menuItems.length;
  state.setSelected(selected);

  if (key === ' ' || key === 'Enter') {
    const action = menuItems[selected].action;
    if (action === 'settings') { state.setShowSettings(true); return null; }
    if (action === 'credits') { state.setShowCredits(true); return null; }
    return action;
  }
  return null;
}

export function handleMenuTap(x, y) {
  const { cx } = layout();
  const showSettings = state.showSettings();
  const showCredits = state.showCredits();
  const menuItems = state.menuItems;

  if (showSettings) {
    const { btnX, btnY, btnW, btnH } = settingsBackBtnLayout();
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      state.setShowSettings(false);
      return null;
    }
    const s = hitSlider(x, y);
    if (s) {
      state.setDraggingSlider(s);
      updateSliderValue(s, x);
    }
    return null;
  }

  if (showCredits) {
    const { btnX, btnY, btnW, btnH } = creditsBackBtnLayout();
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      state.setShowCredits(false);
    }
    return null;
  }

  // Détection tap sur les items
  for (let i = 0; i < menuItems.length; i++) {
    const { y: itemY, itemH, halfW } = menuItemLayout(i);
    if (x >= cx - halfW && x <= cx + halfW && y >= itemY - itemH * 0.55 && y <= itemY + itemH * 0.45) {
      const action = menuItems[i].action;
      if (action === 'settings') { state.setShowSettings(true); return null; }
      if (action === 'credits') { state.setShowCredits(true); return null; }
      return action;
    }
  }
  return null;
}

export function handleMenuDrag(x, y) {
  const draggingSlider = state.draggingSlider();
  if (draggingSlider) {
    updateSliderValue(draggingSlider, x);
  }
}

export function handleMenuRelease() {
  state.setDraggingSlider(null);
}

export function updateMenuHover(mx, my) {
  const showSettings = state.showSettings();
  const showCredits = state.showCredits();
  const menuItems = state.menuItems;

  if (showSettings || showCredits || mx === null || my === null) return;
  const { cx } = layout();
  for (let i = 0; i < menuItems.length; i++) {
    const { y: itemY, itemH, halfW } = menuItemLayout(i);
    if (mx >= cx - halfW && mx <= cx + halfW && my >= itemY - itemH * 0.55 && my <= itemY + itemH * 0.45) {
      state.setSelected(i);
      return;
    }
  }
}

export function resetMenu() {
  state.setSelected(0);
  state.setShowCredits(false);
  state.setShowSettings(false);
  state.setDraggingSlider(null);
}
