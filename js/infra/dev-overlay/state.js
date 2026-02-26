// --- Dev Overlay State ---
// Overlay in-game pour activer les power-ups manuellement (?dev desktop only)

import { POWER_UP_IDS } from '../../domain/power-ups.js';

const BTN_W = 90;
const BTN_H = 22;
const GAP = 4;
const PAD_X = 6;
const PAD_Y = 40; // sous le score

// Construire les boutons : 1 par power-up + vie+/vie-
function buildButtons() {
  const btns = [];
  let y = PAD_Y;

  for (const puId of POWER_UP_IDS) {
    btns.push({ id: puId, type: 'powerup', x: PAD_X, y, w: BTN_W, h: BTN_H });
    y += BTN_H + GAP;
  }

  y += GAP; // espace avant les boutons vie
  btns.push({ id: 'lifeUp', type: 'life', label: 'Vie +', delta: 1, x: PAD_X, y, w: BTN_W / 2 - 2, h: BTN_H });
  btns.push({ id: 'lifeDown', type: 'life', label: 'Vie -', delta: -1, x: PAD_X + BTN_W / 2 + 2, y, w: BTN_W / 2 - 2, h: BTN_H });

  return btns;
}

const state = {
  buttons: buildButtons(),
  hovered: null, // id du bouton survolé
};

export default state;
export { BTN_W, BTN_H, GAP, PAD_X, PAD_Y };
