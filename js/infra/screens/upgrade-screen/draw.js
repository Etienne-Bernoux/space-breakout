// --- Rendu de l'écran upgrade (fancy) ---

import { gameScale } from '../../../shared/responsive.js';
import { getMineral, MINERAL_IDS } from '../../../domain/minerals/index.js';
import state, { getSelectedCategoryKey, getVisibleUpgrades, CATEGORY_KEYS, UPGRADE_CATEGORIES } from './state.js';
import { drawUpgradeIcon } from './icons.js';

// Couleurs par catégorie d'upgrade
const CAT_COLORS = {
  ship:       { accent: '#00cc88', glow: 'rgba(0,204,136,', bg: 'rgba(0,204,136,0.08)' },
  drone:      { accent: '#ffaa00', glow: 'rgba(255,170,0,', bg: 'rgba(255,170,0,0.08)' },
  powerUp:    { accent: '#cc44ff', glow: 'rgba(204,68,255,', bg: 'rgba(204,68,255,0.08)' },
  consumable: { accent: '#ff3399', glow: 'rgba(255,51,153,', bg: 'rgba(255,51,153,0.08)' },
};

/** Arrondi au pixel entier pour la netteté du texte. */
const px = (v) => Math.round(v) | 0;

export function drawUpgradeScreen(ctx, W, H, wallet, upgrades) {
  const s = gameScale(W);

  // Fond gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#05051a');
  bgGrad.addColorStop(0.5, '#0a0a25');
  bgGrad.addColorStop(1, '#050518');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Ligne décorative en haut
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.3, '#ffd700');
  lineGrad.addColorStop(0.7, '#ffd700');
  lineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, px(46 * s), W, 1);

  // Titre
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd700';
  ctx.font = `bold ${px(24 * s)}px monospace`;
  ctx.fillText('ATELIER', px(W / 2), px(32 * s));
  // Sous-titre glow
  ctx.fillStyle = 'rgba(255,215,0,0.25)';
  ctx.font = `${px(10 * s)}px monospace`;
  ctx.fillText('AMELIORATIONS DU VAISSEAU', px(W / 2), px(43 * s));

  _drawWallet(ctx, W, s, wallet);
  _drawCategoryTabs(ctx, W, s);

  const upgList = getVisibleUpgrades();
  const listY = px(95 * s);
  const itemH = px(65 * s);

  for (let i = 0; i < upgList.length; i++) {
    const u = upgList[i];
    const y = listY + i * itemH;
    const selected = i === state.selectedUpgrade;
    _drawUpgradeItem(ctx, u, W, y, itemH, s, selected, wallet, upgrades);
  }

  _drawBackButton(ctx, W, H, s);
}

function _drawWallet(ctx, W, s, wallet) {
  const startX = W - px(12 * s);
  const y = px(16 * s);
  ctx.textBaseline = 'alphabetic';

  for (let i = 0; i < MINERAL_IDS.length; i++) {
    const id = MINERAL_IDS[i];
    const mineral = getMineral(id);
    const qty = wallet.get(id);
    const xPos = startX - i * px(72 * s);

    // Pastille colorée
    ctx.beginPath();
    ctx.arc(xPos - px(46 * s), y, px(4 * s), 0, Math.PI * 2);
    ctx.fillStyle = mineral.color;
    ctx.fill();
    // Glow
    ctx.beginPath();
    ctx.arc(xPos - px(46 * s), y, px(7 * s), 0, Math.PI * 2);
    ctx.fillStyle = mineral.color.slice(0, 7) + '30';
    ctx.fill();

    ctx.font = `bold ${px(12 * s)}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillStyle = qty > 0 ? '#ffffff' : '#444444';
    ctx.fillText(`${qty}`, xPos, y + px(4 * s));
  }
}

function _drawCategoryTabs(ctx, W, s) {
  const tabY = px(52 * s);
  const tabW = px(W / CATEGORY_KEYS.length);
  const tabH = px(28 * s);

  for (let i = 0; i < CATEGORY_KEYS.length; i++) {
    const catKey = CATEGORY_KEYS[i];
    const cat = UPGRADE_CATEGORIES[catKey];
    const x = i * tabW;
    const selected = i === state.selectedCategory;
    const col = CAT_COLORS[catKey] || CAT_COLORS.ship;

    if (selected) {
      // Fond onglet actif avec gradient
      const tabGrad = ctx.createLinearGradient(x, tabY, x, tabY + tabH);
      tabGrad.addColorStop(0, col.glow + '0.2)');
      tabGrad.addColorStop(1, col.glow + '0.05)');
      ctx.fillStyle = tabGrad;
      ctx.fillRect(x + 3, tabY, tabW - 6, tabH);
      // Ligne du bas
      ctx.fillStyle = col.accent;
      ctx.fillRect(x + 3, tabY + tabH - px(2 * s), tabW - 6, px(2 * s));
    }

    ctx.font = `bold ${px(13 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = selected ? col.accent : '#555555';
    ctx.fillText(cat.name, px(x + tabW / 2), px(tabY + tabH / 2));
  }
}

function _drawUpgradeItem(ctx, upgrade, W, y, h, s, selected, wallet, upgManager) {
  const pad = px(15 * s);
  const level = upgManager.getLevel(upgrade.id);
  const maxed = upgManager.isMaxed(upgrade.id);
  const nextCost = upgManager.getNextCost(upgrade.id);
  const canBuy = nextCost && wallet.canAfford(nextCost);
  const catKey = getSelectedCategoryKey();
  const col = CAT_COLORS[catKey] || CAT_COLORS.ship;

  // Fond item
  const itemW = W - pad * 2;
  if (selected) {
    const itemGrad = ctx.createLinearGradient(pad, y, pad + itemW, y);
    itemGrad.addColorStop(0, col.glow + '0.12)');
    itemGrad.addColorStop(0.7, col.glow + '0.04)');
    itemGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = itemGrad;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
  }
  _roundRect(ctx, pad, y + 2, itemW, h - 6, px(4 * s));
  ctx.fill();

  // Bordure sélection
  if (selected) {
    ctx.strokeStyle = col.accent;
    ctx.lineWidth = 1.5;
    _roundRect(ctx, pad, y + 2, itemW, h - 6, px(4 * s));
    ctx.stroke();
  }

  // --- Badge icône (cercle coloré avec glow) ---
  const badgeR = px(16 * s);
  const badgeX = pad + px(20 * s);
  const badgeY = y + px(h / 2);

  // Glow derrière le badge
  const glowGrad = ctx.createRadialGradient(badgeX, badgeY, badgeR * 0.3, badgeX, badgeY, badgeR * 1.8);
  glowGrad.addColorStop(0, col.glow + (maxed ? '0.3)' : '0.15)'));
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Cercle badge
  const badgeBg = ctx.createRadialGradient(badgeX, badgeY - badgeR * 0.2, 0, badgeX, badgeY, badgeR);
  badgeBg.addColorStop(0, col.glow + '0.35)');
  badgeBg.addColorStop(1, col.glow + '0.1)');
  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fill();
  // Contour badge
  ctx.strokeStyle = maxed ? '#ffd700' : col.accent;
  ctx.lineWidth = maxed ? 2 : 1;
  ctx.stroke();

  // Icône dans le badge
  const iconS = px(9 * s);
  ctx.save();
  ctx.translate(badgeX, badgeY);
  drawUpgradeIcon(ctx, upgrade.id, iconS, maxed ? '#ffd700' : col.accent);
  ctx.restore();

  // --- Texte ---
  const textLeft = pad + px(44 * s);

  // Nom
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = maxed ? '#ffd700' : '#eeeeff';
  ctx.font = `bold ${px(14 * s)}px monospace`;
  ctx.fillText(upgrade.name, textLeft, px(y + 22 * s));

  // Description
  ctx.fillStyle = '#777799';
  ctx.font = `${px(10 * s)}px monospace`;
  ctx.fillText(upgrade.description, textLeft, px(y + 38 * s));

  // --- Barres de niveau (losanges) ---
  const barX = px(W * 0.54);
  const barSize = px(8 * s);
  const barGap = px(6 * s);
  for (let i = 0; i < upgrade.maxLevel; i++) {
    const filled = i < level;
    const bx = barX + i * (barSize + barGap);
    const by = px(y + 15 * s);
    ctx.save();
    ctx.translate(bx + barSize / 2, by + barSize / 2);
    ctx.rotate(Math.PI / 4);
    if (filled) {
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(-barSize / 2 + 1, -barSize / 2 + 1, barSize - 2, barSize - 2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = filled ? '#ffd700' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barSize / 2 + 1, -barSize / 2 + 1, barSize - 2, barSize - 2);
    ctx.restore();
  }

  // --- Coût ou MAX ---
  const costX = px(W - pad - 8 * s);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  if (maxed) {
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${px(14 * s)}px monospace`;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.fillText('MAX', costX, px(y + 22 * s));
    ctx.shadowBlur = 0;
  } else if (nextCost) {
    ctx.font = `${px(11 * s)}px monospace`;
    let cy = px(y + 18 * s);
    for (const [mineralKey, amount] of Object.entries(nextCost)) {
      const mineral = getMineral(mineralKey);
      const has = wallet.get(mineralKey);
      ctx.fillStyle = has >= amount ? mineral.color : '#ff4466';
      ctx.fillText(`${amount} ${mineral.name}`, costX, cy);
      cy += px(13 * s);
    }
  }

  // --- Bouton achat ---
  if (selected && !maxed && nextCost) {
    const btnW = px(80 * s);
    const btnH = px(24 * s);
    const btnX = px(W - pad - btnW - 4 * s);
    const btnY = px(y + h - btnH - 9 * s);
    if (canBuy) {
      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
      btnGrad.addColorStop(0, col.glow + '0.4)');
      btnGrad.addColorStop(1, col.glow + '0.15)');
      ctx.fillStyle = btnGrad;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
    }
    _roundRect(ctx, btnX, btnY, btnW, btnH, px(3 * s));
    ctx.fill();
    ctx.strokeStyle = canBuy ? col.accent : '#333344';
    ctx.lineWidth = 1;
    _roundRect(ctx, btnX, btnY, btnW, btnH, px(3 * s));
    ctx.stroke();
    ctx.fillStyle = canBuy ? '#ffffff' : '#444455';
    ctx.font = `bold ${px(12 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ACHETER', px(btnX + btnW / 2), px(btnY + btnH / 2));
  }
}

function _drawBackButton(ctx, W, H, s) {
  const btnW = px(130 * s);
  const btnH = px(34 * s);
  const btnX = px(W / 2 - btnW / 2);
  const btnY = px(H - 52 * s);

  const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  grad.addColorStop(0, 'rgba(139,105,20,0.3)');
  grad.addColorStop(1, 'rgba(139,105,20,0.1)');
  ctx.fillStyle = grad;
  _roundRect(ctx, btnX, btnY, btnW, btnH, px(4 * s));
  ctx.fill();
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 1.5;
  _roundRect(ctx, btnX, btnY, btnW, btnH, px(4 * s));
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = `bold ${px(14 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RETOUR', px(btnX + btnW / 2), px(btnY + btnH / 2));
}

/** Helper : trace un rectangle arrondi (path only, pas de fill/stroke). */
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Retourne les hitboxes pour le tap handler. */
export function getUpgradeScreenButtons(W, H, upgradeCount) {
  const s = gameScale(W);
  const pad = px(15 * s);
  const listY = px(95 * s);
  const itemH = px(65 * s);
  const tabY = px(52 * s);
  const tabW = px(W / CATEGORY_KEYS.length);
  const tabH = px(28 * s);

  const tabs = CATEGORY_KEYS.map((_, i) => ({
    x: i * tabW + 3, y: tabY, w: tabW - 6, h: tabH,
  }));

  const items = [];
  for (let i = 0; i < upgradeCount; i++) {
    items.push({ x: pad, y: listY + i * itemH, w: W - pad * 2, h: itemH - 6 });
  }

  const selY = listY + state.selectedUpgrade * itemH;
  const btnW = px(80 * s);
  const btnH = px(24 * s);
  const buyBtn = {
    x: px(W - pad - btnW - 4 * s),
    y: px(selY + itemH - btnH - 9 * s),
    w: btnW, h: btnH,
  };

  const backBtnW = px(130 * s);
  const backBtn = {
    x: px(W / 2 - backBtnW / 2), y: px(H - 52 * s), w: backBtnW, h: px(34 * s),
  };

  return { tabs, items, buyBtn, backBtn };
}
