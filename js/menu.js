import { CONFIG } from './config.js';

const menuItems = [
  { label: 'JOUER', action: 'play' },
  { label: 'CRÉDITS', action: 'credits' },
];

let selected = 0;
let showCredits = false;

// Astéroïdes décoratifs flottants
const floatingRocks = Array.from({ length: 6 }, () => ({
  x: Math.random() * CONFIG.canvas.width,
  y: Math.random() * CONFIG.canvas.height,
  size: 10 + Math.random() * 20,
  speed: 0.2 + Math.random() * 0.3,
  angle: 0,
  rotSpeed: (Math.random() - 0.5) * 0.02,
  color: CONFIG.asteroids.colors[Math.floor(Math.random() * 4)],
}));

function drawFloatingRocks(ctx) {
  for (const r of floatingRocks) {
    r.y += r.speed;
    r.angle += r.rotSpeed;
    if (r.y > CONFIG.canvas.height + 30) {
      r.y = -30;
      r.x = Math.random() * CONFIG.canvas.width;
    }

    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);
    ctx.fillStyle = r.color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, r.size, r.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTitle(ctx) {
  const w = CONFIG.canvas.width;
  const cx = w / 2;

  // Titre principal
  ctx.save();
  ctx.textAlign = 'center';

  // Ombre
  ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('SPACE BREAKOUT', cx + 3, 153);

  // Texte
  const titleGrad = ctx.createLinearGradient(cx - 200, 120, cx + 200, 160);
  titleGrad.addColorStop(0, '#00d4ff');
  titleGrad.addColorStop(0.5, '#ffffff');
  titleGrad.addColorStop(1, '#00d4ff');
  ctx.fillStyle = titleGrad;
  ctx.fillText('SPACE BREAKOUT', cx, 150);

  // Sous-titre
  ctx.font = '14px monospace';
  ctx.fillStyle = '#667788';
  ctx.fillText('MISSION : NETTOYAGE DE ZONE', cx, 180);

  ctx.restore();
}

function drawMenu(ctx) {
  const w = CONFIG.canvas.width;
  const cx = w / 2;

  if (showCredits) {
    drawCreditsScreen(ctx);
    return;
  }

  drawTitle(ctx);

  // Items du menu
  ctx.save();
  ctx.textAlign = 'center';

  for (let i = 0; i < menuItems.length; i++) {
    const itemY = 280 + i * 50;
    const isSelected = i === selected;

    if (isSelected) {
      // Fond sélection
      ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.fillRect(cx - 120, itemY - 20, 240, 36);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 120, itemY - 20, 240, 36);

      // Curseur
      ctx.fillStyle = '#ffcc00';
      ctx.font = '16px monospace';
      ctx.fillText('▸', cx - 100, itemY);
    }

    ctx.fillStyle = isSelected ? '#ffffff' : '#556677';
    ctx.font = isSelected ? 'bold 20px monospace' : '18px monospace';
    ctx.fillText(menuItems[i].label, cx, itemY);
  }

  // Instructions (adaptées au device)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#445566';
  const isMobile = 'ontouchstart' in window;
  ctx.fillText(
    isMobile ? 'APPUIE POUR SÉLECTIONNER' : '↑↓ NAVIGUER  ·  ESPACE SÉLECTIONNER',
    cx, 450
  );

  ctx.restore();
}

function drawCreditsScreen(ctx) {
  const cx = CONFIG.canvas.width / 2;

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('CRÉDITS', cx, 150);

  ctx.fillStyle = '#aabbcc';
  ctx.font = '16px monospace';
  ctx.fillText('Développé par Etienne Bernoux', cx, 220);

  ctx.fillStyle = '#667788';
  ctx.font = '14px monospace';
  ctx.fillText('Inspiré du casse-briques d\'Adibou', cx, 260);
  ctx.fillText('Construit avec Canvas API', cx, 290);

  // Bouton retour
  ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
  ctx.fillRect(cx - 80, 380, 160, 36);
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 80, 380, 160, 36);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#667788';
  ctx.fillText('RETOUR', cx, 403);

  ctx.restore();
}

export function updateMenu(ctx) {
  drawFloatingRocks(ctx);
  drawMenu(ctx);
}

export function handleMenuInput(key) {
  if (showCredits) {
    if (key === 'Escape') showCredits = false;
    return null;
  }

  if (key === 'ArrowUp') selected = (selected - 1 + menuItems.length) % menuItems.length;
  if (key === 'ArrowDown') selected = (selected + 1) % menuItems.length;

  if (key === ' ' || key === 'Enter') {
    const action = menuItems[selected].action;
    if (action === 'credits') {
      showCredits = true;
      return null;
    }
    return action;
  }
  return null;
}

export function handleMenuTap(x, y) {
  const cx = CONFIG.canvas.width / 2;

  if (showCredits) {
    // Bouton retour
    if (x >= cx - 80 && x <= cx + 80 && y >= 380 && y <= 416) {
      showCredits = false;
    }
    return null;
  }

  // Détection tap sur les items
  for (let i = 0; i < menuItems.length; i++) {
    const itemY = 280 + i * 50;
    if (x >= cx - 120 && x <= cx + 120 && y >= itemY - 20 && y <= itemY + 16) {
      const action = menuItems[i].action;
      if (action === 'credits') {
        showCredits = true;
        return null;
      }
      return action;
    }
  }
  return null;
}

export function resetMenu() {
  selected = 0;
  showCredits = false;
}
