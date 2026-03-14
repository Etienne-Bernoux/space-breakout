// --- Rendu de l'écran upgrade ---

import { gameScale } from '../../../shared/responsive.js';
import { getMineral, MINERAL_IDS } from '../../../contexts/mineral/domain/index.js';
import state, { getSelectedCategoryKey, getVisibleUpgrades, CATEGORY_KEYS, UPGRADE_CATEGORIES } from './state.js';

/**
 * Dessine l'écran d'upgrade.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W - largeur canvas
 * @param {number} H - hauteur canvas
 * @param {object} wallet - MineralWallet
 * @param {object} upgrades - UpgradeManager
 */
export function drawUpgradeScreen(ctx, W, H, wallet, upgrades) {
  const s = gameScale(W);

  // Fond
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, W, H);

  // Titre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = `bold ${Math.round(22 * s)}px monospace`;
  ctx.fillText('ATELIER', W / 2, 35 * s);

  // --- Wallet (en haut à droite) ---
  _drawWallet(ctx, W, s, wallet);

  // --- Onglets catégories ---
  _drawCategoryTabs(ctx, W, s);

  // --- Liste upgrades ---
  const upgList = getVisibleUpgrades();
  const listY = 90 * s;
  const itemH = Math.round(60 * s);

  for (let i = 0; i < upgList.length; i++) {
    const u = upgList[i];
    const y = listY + i * itemH;
    const selected = i === state.selectedUpgrade;
    _drawUpgradeItem(ctx, u, W, y, itemH, s, selected, wallet, upgrades);
  }

  // --- Bouton retour ---
  _drawBackButton(ctx, W, H, s);
}

function _drawWallet(ctx, W, s, wallet) {
  const startX = W - 15 * s;
  const y = 18 * s;
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.textAlign = 'right';

  for (let i = 0; i < MINERAL_IDS.length; i++) {
    const id = MINERAL_IDS[i];
    const mineral = getMineral(id);
    const qty = wallet.get(id);
    const xPos = startX - i * 70 * s;

    // Icône
    ctx.fillStyle = mineral.color;
    ctx.fillRect(xPos - 50 * s, y - 4 * s, 8 * s, 8 * s);

    // Quantité
    ctx.fillStyle = qty > 0 ? '#ffffff' : '#555555';
    ctx.fillText(`${qty}`, xPos, y + 3 * s);
  }
}

function _drawCategoryTabs(ctx, W, s) {
  const tabY = 55 * s;
  const tabW = Math.round(W / CATEGORY_KEYS.length);

  ctx.font = `bold ${Math.round(12 * s)}px monospace`;
  ctx.textBaseline = 'middle';

  for (let i = 0; i < CATEGORY_KEYS.length; i++) {
    const cat = UPGRADE_CATEGORIES[CATEGORY_KEYS[i]];
    const x = i * tabW;
    const selected = i === state.selectedCategory;

    // Fond onglet
    ctx.fillStyle = selected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x + 2, tabY, tabW - 4, 24 * s);

    // Bordure basse
    if (selected) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x + 2, tabY + 22 * s, tabW - 4, 2 * s);
    }

    // Texte
    ctx.fillStyle = selected ? '#ffd700' : '#888888';
    ctx.textAlign = 'center';
    ctx.fillText(cat.name, x + tabW / 2, tabY + 12 * s);
  }
}

function _drawUpgradeItem(ctx, upgrade, W, y, h, s, selected, wallet, upgManager) {
  const pad = 20 * s;
  const level = upgManager.getLevel(upgrade.id);
  const maxed = upgManager.isMaxed(upgrade.id);
  const nextCost = upgManager.getNextCost(upgrade.id);
  const canBuy = nextCost && wallet.canAfford(nextCost);

  // Fond
  ctx.fillStyle = selected ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)';
  ctx.fillRect(pad, y, W - pad * 2, h - 4 * s);

  if (selected) {
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, y, W - pad * 2, h - 4 * s);
  }

  // Nom
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(13 * s)}px monospace`;
  ctx.fillText(upgrade.name, pad + 10 * s, y + 18 * s);

  // Description
  ctx.fillStyle = '#aaaaaa';
  ctx.font = `${Math.round(10 * s)}px monospace`;
  ctx.fillText(upgrade.description, pad + 10 * s, y + 34 * s);

  // Niveau (barres)
  const barX = W * 0.55;
  const barW = 12 * s;
  const barH = 10 * s;
  const barGap = 4 * s;
  for (let i = 0; i < upgrade.maxLevel; i++) {
    const filled = i < level;
    ctx.fillStyle = filled ? '#ffd700' : 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(barX + i * (barW + barGap), y + 12 * s, barW, barH);
  }

  // Coût ou MAX
  ctx.textAlign = 'right';
  const costX = W - pad - 10 * s;
  if (maxed) {
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(12 * s)}px monospace`;
    ctx.fillText('MAX', costX, y + 18 * s);
  } else if (nextCost) {
    ctx.font = `${Math.round(10 * s)}px monospace`;
    let cy = y + 14 * s;
    for (const [mineralKey, amount] of Object.entries(nextCost)) {
      const mineral = getMineral(mineralKey);
      const has = wallet.get(mineralKey);
      ctx.fillStyle = has >= amount ? mineral.color : '#ff4444';
      ctx.fillText(`${amount} ${mineral.name}`, costX, cy);
      cy += 12 * s;
    }
  }

  // Bouton achat (si sélectionné et achetable)
  if (selected && !maxed && nextCost) {
    const btnW = 70 * s;
    const btnH = 22 * s;
    const btnX = W - pad - btnW - 5 * s;
    const btnY = y + h - btnH - 8 * s;
    ctx.fillStyle = canBuy ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = canBuy ? '#00d4ff' : '#555555';
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = canBuy ? '#00d4ff' : '#555555';
    ctx.font = `bold ${Math.round(11 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('ACHETER', btnX + btnW / 2, btnY + btnH / 2 + 1);
  }
}

function _drawBackButton(ctx, W, H, s) {
  const btnW = 120 * s;
  const btnH = 32 * s;
  const btnX = W / 2 - btnW / 2;
  const btnY = H - 50 * s;

  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#8b6914';
  ctx.font = `bold ${Math.round(13 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RETOUR', btnX + btnW / 2, btnY + btnH / 2);
}

/** Retourne les hitboxes pour le tap handler. */
export function getUpgradeScreenButtons(W, H, upgradeCount) {
  const s = gameScale(W);
  const pad = 20 * s;
  const listY = 90 * s;
  const itemH = Math.round(60 * s);
  const tabY = 55 * s;
  const tabW = Math.round(W / CATEGORY_KEYS.length);

  const tabs = CATEGORY_KEYS.map((_, i) => ({
    x: i * tabW + 2, y: tabY, w: tabW - 4, h: 24 * s,
  }));

  const items = [];
  for (let i = 0; i < upgradeCount; i++) {
    items.push({ x: pad, y: listY + i * itemH, w: W - pad * 2, h: itemH - 4 * s });
  }

  // Bouton achat (de l'item sélectionné)
  const selY = listY + state.selectedUpgrade * itemH;
  const btnW = 70 * s;
  const btnH = 22 * s;
  const buyBtn = {
    x: W - pad - btnW - 5 * s,
    y: selY + itemH - btnH - 8 * s,
    w: btnW, h: btnH,
  };

  // Bouton retour
  const backBtnW = 120 * s;
  const backBtn = {
    x: W / 2 - backBtnW / 2, y: H - 50 * s, w: backBtnW, h: 32 * s,
  };

  return { tabs, items, buyBtn, backBtn };
}
