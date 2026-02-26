// Hit testing functions

import { CONFIG } from '../config.js';
import { LAYER_NAMES } from '../music/index.js';
import { getScrollY, getCurrentTab } from './state.js';
import { HEADER_H } from './draw-header.js';
import { FOOTER_H } from './draw-footer.js';
import { TRACKS, getInstruments, getSections, getStingers } from './tab-sons.js';

export function getButtonLayout() {
  const col1 = 20;
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  const smallBtnW = 55;
  const buttons = [];

  // Onglets (position absolue, pas scrollé)
  const TABS = ['Sons', 'Gameplay', 'Mix'];
  const tabW = 100;
  const tabH = 28;
  const tabGap = 6;
  const W = CONFIG.canvas.width;
  const totalTabW = TABS.length * tabW + (TABS.length - 1) * tabGap;
  const tabX0 = (W - totalTabW) / 2;
  for (let i = 0; i < TABS.length; i++) {
    buttons.push({ id: `tab-${i}`, x: tabX0 + i * (tabW + tabGap), y: 38, w: tabW, h: tabH, fixed: true });
  }

  // Transport (dans le footer, position absolue)
  const H = CONFIG.canvas.height;
  const fy = H - FOOTER_H;
  buttons.push({ id: 'transport', x: 16, y: fy + 6, w: 90, h: 28, fixed: true });

  // Contenu par onglet (positions relatives au content area)
  let y = 16;
  const currentTab = getCurrentTab();

  if (currentTab === 0) {
    // Track selector
    y += 14; // piste label
    const trackBtnW = 130;
    for (let i = 0; i < TRACKS.length; i++) {
      buttons.push({ id: `track-${TRACKS[i].id}`, x: col1 + i * (trackBtnW + gap), y, w: trackBtnW, h: btnH });
    }
    y += btnH + gap;

    // Sections
    y += 24; // gap avant section (comme drawTabSons)
    y += 14; // sections label
    const SECTIONS = getSections();
    const secPerRow = 4;
    for (let i = 0; i < SECTIONS.length; i++) {
      const row = Math.floor(i / secPerRow);
      const col = i % secPerRow;
      buttons.push({ id: `section-${SECTIONS[i].id}`, x: col1 + col * (btnW + gap), y: y + row * (btnH + gap), w: btnW, h: btnH });
    }
    const secRows = Math.ceil(SECTIONS.length / secPerRow);
    y += secRows * (btnH + gap) + 8;

    // Instruments (dynamique par piste)
    const instruments = getInstruments();
    y += 14;
    const instPerRow = 4;
    for (let i = 0; i < instruments.length; i++) {
      const row = Math.floor(i / instPerRow);
      const col = i % instPerRow;
      buttons.push({ id: `inst-${instruments[i].id}`, x: col1 + col * (btnW + gap), y: y + row * (btnH + gap), w: btnW, h: btnH });
    }
    const instRows = Math.ceil(instruments.length / instPerRow);
    y += instRows * (btnH + gap) + 8;

    // Stingers
    const STINGERS = getStingers();
    y += 14;
    for (let i = 0; i < STINGERS.length; i++) {
      buttons.push({ id: `stinger-${STINGERS[i].id}`, x: col1 + i * (btnW + gap), y, w: btnW, h: btnH });
    }

  } else if (currentTab === 1) {
    // Intensity override
    y += 14; // label
    const ovX = col1 + 180;
    for (let i = 0; i <= 4; i++) {
      buttons.push({ id: `intensity-${i}`, x: ovX + i * (smallBtnW + 4), y, w: smallBtnW, h: btnH });
    }
    y += btnH + 20;

    // État simulé (pas de boutons, juste display)
    y += 14 + 32 + 28; // label + bar+padding + combo+padding

    // Actions row 1
    y += 14;
    buttons.push({ id: 'gp-destroy', x: col1, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-combo-up', x: col1 + btnW + gap, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-combo-reset', x: col1 + (btnW + gap) * 2, y, w: btnW, h: btnH });
    y += btnH + gap;

    // Actions row 2
    buttons.push({ id: 'gp-life', x: col1, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-powerup', x: col1 + btnW + gap, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-reset', x: col1 + (btnW + gap) * 2, y, w: btnW, h: btnH });

  } else if (currentTab === 2) {
    // Layers toggle
    y += 14;
    const layerBtnW = 110;
    for (let i = 0; i < LAYER_NAMES.length; i++) {
      buttons.push({ id: `layer-${LAYER_NAMES[i]}`, x: col1, y: y + i * (btnH + gap), w: layerBtnW, h: btnH });
    }
    y += LAYER_NAMES.length * (btnH + gap) + 8;

    // FX
    y += 14;
    buttons.push({ id: 'fx-muffle', x: col1, y, w: btnW, h: btnH });
  }

  return buttons;
}

export function hitTest(mx, my) {
  const contentTop = HEADER_H;
  const contentBottom = CONFIG.canvas.height - FOOTER_H;
  const scrollY = getScrollY();

  for (const b of getButtonLayout()) {
    if (b.fixed) {
      // Boutons fixes (tabs, transport) — coordonnées directes
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return b.id;
    } else {
      // Boutons dans la zone scrollable — compenser scroll et offset
      const by = b.y + contentTop - scrollY;
      if (by + b.h < contentTop || by > contentBottom) continue; // hors zone visible
      if (mx >= b.x && mx <= b.x + b.w && my >= by && my <= by + b.h) return b.id;
    }
  }
  return null;
}
