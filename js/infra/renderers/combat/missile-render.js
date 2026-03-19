// --- Rendu des missiles (projectiles joueur) ---

export function drawMissile(ctx, m) {
  if (!m.alive) return;
  const { x, y, radius: r, color } = m;
  const t = Date.now() * 0.001;

  const h = r * 5;   // hauteur totale du corps
  const w = r * 1.1; // demi-largeur du corps

  // --- Flamme crépitante (plusieurs langues) ---
  const flameBaseY = y + h * 0.35;
  for (let i = 0; i < 5; i++) {
    const spread = (i - 2) * w * 0.3;
    const flicker = Math.sin(t * 25 + i * 1.7) * 0.3 + 0.7;
    const len = (12 + Math.sin(t * 30 + i * 2.3) * 6) * flicker;
    const fw = w * (0.35 - Math.abs(i - 2) * 0.08);
    const grad = ctx.createLinearGradient(x + spread, flameBaseY, x + spread, flameBaseY + len);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#ffdd44');
    grad.addColorStop(0.6, '#ff6600');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x + spread - fw, flameBaseY);
    ctx.quadraticCurveTo(x + spread, flameBaseY + len * 1.1, x + spread + fw, flameBaseY);
    ctx.fill();
  }

  // --- Traînée de fumée (particules statiques simulées) ---
  for (let i = 0; i < 4; i++) {
    const py = flameBaseY + 10 + i * 5;
    const px = x + Math.sin(t * 8 + i * 3) * 3;
    const alpha = 0.15 - i * 0.03;
    ctx.fillStyle = `rgba(200, 180, 160, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2 + i * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Corps allongé (capsule arrondie) ---
  const bodyTop = y - h * 0.45;
  const bodyBot = y + h * 0.35;
  const bodyGrad = ctx.createLinearGradient(x - w, 0, x + w, 0);
  bodyGrad.addColorStop(0, '#882233');
  bodyGrad.addColorStop(0.3, color);
  bodyGrad.addColorStop(0.7, color);
  bodyGrad.addColorStop(1, '#882233');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(x - w, bodyBot);
  ctx.lineTo(x - w, bodyTop + w);
  ctx.quadraticCurveTo(x - w, bodyTop, x, bodyTop);
  ctx.quadraticCurveTo(x + w, bodyTop, x + w, bodyTop + w);
  ctx.lineTo(x + w, bodyBot);
  ctx.closePath();
  ctx.fill();

  // --- Bande décorative ---
  const stripeY = bodyTop + h * 0.35;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(x - w + 1, stripeY, w * 2 - 2, 2);
  ctx.fillRect(x - w + 1, stripeY + 4, w * 2 - 2, 1);

  // --- Ogive (nez arrondi plus lumineux) ---
  const noseGrad = ctx.createLinearGradient(x, bodyTop, x, bodyTop - r * 1.5);
  noseGrad.addColorStop(0, color);
  noseGrad.addColorStop(1, '#ffaaaa');
  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.moveTo(x - w, bodyTop + w * 0.3);
  ctx.quadraticCurveTo(x, bodyTop - r * 2.2, x + w, bodyTop + w * 0.3);
  ctx.closePath();
  ctx.fill();

  // --- Ailerons ---
  ctx.fillStyle = '#aa3344';
  // Gauche
  ctx.beginPath();
  ctx.moveTo(x - w, bodyBot);
  ctx.lineTo(x - w - r * 1.2, bodyBot + r);
  ctx.lineTo(x - w, bodyBot - r * 1.5);
  ctx.fill();
  // Droit
  ctx.beginPath();
  ctx.moveTo(x + w, bodyBot);
  ctx.lineTo(x + w + r * 1.2, bodyBot + r);
  ctx.lineTo(x + w, bodyBot - r * 1.5);
  ctx.fill();

  // --- Tuyère (base) ---
  ctx.fillStyle = '#553333';
  ctx.fillRect(x - w * 0.7, bodyBot, w * 1.4, r * 0.6);

  // --- Lueur ambiante ---
  const pulse = 0.25 + Math.sin(t * 10) * 0.1;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
  glow.addColorStop(0, `rgba(255, 100, 50, ${pulse})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 5, 0, Math.PI * 2);
  ctx.fill();
}
