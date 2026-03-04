// --- Rendu du mineral lab ---

import { gameScale } from '../../shared/responsive.js';
import { MINERAL_IDS, getMineral } from '../../domain/mineral/index.js';
import { UPGRADE_IDS } from '../../use-cases/upgrade/upgrade-catalog.js';
import { getUpgrade } from '../../use-cases/upgrade/upgrade-catalog.js';
import state from './state.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {object} wallet - MineralWallet
 * @param {object} upgrades - UpgradeManager
 */
export function drawMineralLab(ctx, W, H, wallet, upgrades) {
  const s = gameScale(W);
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  // Titre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = `bold ${Math.round(20 * s)}px monospace`;
  ctx.fillText('PROGRESS LAB (?progress)', W / 2, 30 * s);

  // Onglets
  const tabs = ['wallet', 'upgrades', 'reset'];
  const tabLabels = ['Portefeuille', 'Upgrades', 'Reset'];
  const tabW = Math.round(W / 3);
  for (let i = 0; i < tabs.length; i++) {
    const sel = state.tab === tabs[i];
    ctx.fillStyle = sel ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(i * tabW + 2, 45 * s, tabW - 4, 22 * s);
    if (sel) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(i * tabW + 2, 65 * s, tabW - 4, 2 * s);
    }
    ctx.fillStyle = sel ? '#ffd700' : '#888';
    ctx.font = `bold ${Math.round(11 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(tabLabels[i], i * tabW + tabW / 2, 59 * s);
  }

  const y0 = 80 * s;

  if (state.tab === 'wallet') {
    _drawWalletTab(ctx, W, y0, s, wallet);
  } else if (state.tab === 'upgrades') {
    _drawUpgradesTab(ctx, W, y0, s, upgrades);
  } else {
    _drawResetTab(ctx, W, H, y0, s);
  }

  // Instructions
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `${Math.round(10 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('TAB: onglet  |  ↑↓: sélection  |  +/-: modifier  |  R: reset  |  ESC: quitter', W / 2, H - 15 * s);
}

function _drawWalletTab(ctx, W, y0, s, wallet) {
  ctx.textAlign = 'left';
  for (let i = 0; i < MINERAL_IDS.length; i++) {
    const id = MINERAL_IDS[i];
    const m = getMineral(id);
    const qty = wallet.get(id);
    const y = y0 + i * 40 * s;
    const sel = i === state.selectedMineral;

    if (sel) {
      ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.fillRect(20 * s, y - 5 * s, W - 40 * s, 32 * s);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(20 * s, y - 5 * s, W - 40 * s, 32 * s);
    }

    // Icône
    ctx.fillStyle = m.color;
    ctx.fillRect(30 * s, y + 3 * s, 12 * s, 12 * s);

    // Nom
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(13 * s)}px monospace`;
    ctx.fillText(m.name, 50 * s, y + 14 * s);

    // Quantité
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`${qty}`, W - 40 * s, y + 14 * s);
    ctx.textAlign = 'left';

    // Boutons +/- (si sélectionné)
    if (sel) {
      ctx.fillStyle = '#00d4ff';
      ctx.font = `bold ${Math.round(16 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('[ - ]', W - 100 * s, y + 14 * s);
      ctx.fillText('[ + ]', W - 60 * s, y + 14 * s);
      ctx.textAlign = 'left';
    }
  }
}

function _drawUpgradesTab(ctx, W, y0, s, upgrades) {
  ctx.textAlign = 'left';
  for (let i = 0; i < UPGRADE_IDS.length; i++) {
    const id = UPGRADE_IDS[i];
    const u = getUpgrade(id);
    const level = upgrades.getLevel(id);
    const y = y0 + i * 30 * s;
    const sel = i === state.selectedUpgrade;

    if (sel) {
      ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.fillRect(20 * s, y - 3 * s, W - 40 * s, 24 * s);
    }

    ctx.fillStyle = '#aaaaaa';
    ctx.font = `${Math.round(11 * s)}px monospace`;
    ctx.fillText(`${u.name}`, 30 * s, y + 12 * s);

    // Barres de niveau
    for (let l = 0; l < u.maxLevel; l++) {
      ctx.fillStyle = l < level ? '#ffd700' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(W * 0.55 + l * 14 * s, y + 3 * s, 10 * s, 10 * s);
    }

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`${level}/${u.maxLevel}`, W - 30 * s, y + 12 * s);
    ctx.textAlign = 'left';
  }
}

function _drawResetTab(ctx, W, H, y0, s) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff4444';
  ctx.font = `bold ${Math.round(14 * s)}px monospace`;
  ctx.fillText('RESET COMPLET', W / 2, y0 + 30 * s);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.fillText('Remet à zéro : minerais + upgrades + progression', W / 2, y0 + 55 * s);

  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  const btnW = 160 * s;
  const btnH = 36 * s;
  const btnX = W / 2 - btnW / 2;
  const btnY = y0 + 80 * s;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#ff4444';
  ctx.font = `bold ${Math.round(13 * s)}px monospace`;
  ctx.fillText('CONFIRMER RESET', W / 2, btnY + btnH / 2 + 1);
}
