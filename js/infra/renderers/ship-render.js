// --- Ship Renderer — Sci-fi Paddle ---
// Demi-hex gauche + rectangle + demi-hex droit
// Petits moteurs rectangulaires incrustés sous le paddle

export function drawShip(ctx, ship) {
  if (!ship.visible) return;
  const { x, y, width, height, color } = ship;
  const cx = x + width / 2;
  const bev = 4;       // biseau : assez pour voir l'angle, pas trop pour garder le segment vertical
  const engW = 8;      // largeur moteur
  const engH = 4;      // dépassement sous le paddle
  const engInset = 16; // distance du bord

  //  _____________________
  // /                     \
  // |                     |
  // \_____________________/
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(x + bev, y);
    ctx.lineTo(x + width - bev, y);
    ctx.lineTo(x + width, y + bev);
    ctx.lineTo(x + width, y + height - bev);
    ctx.lineTo(x + width - bev, y + height);
    ctx.lineTo(x + bev, y + height);
    ctx.lineTo(x, y + height - bev);
    ctx.lineTo(x, y + bev);
    ctx.closePath();
  }

  // --- Glow au-dessus ---
  const glow = ctx.createLinearGradient(x, y, x + width, y);
  glow.addColorStop(0, 'rgba(0, 212, 255, 0)');
  glow.addColorStop(0.2, 'rgba(0, 212, 255, 0.10)');
  glow.addColorStop(0.5, 'rgba(0, 212, 255, 0.16)');
  glow.addColorStop(0.8, 'rgba(0, 212, 255, 0.10)');
  glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x + bev, y - 2, width - bev * 2, 3);

  // --- 1. Corps ---
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + height);
  bodyGrad.addColorStop(0, '#55eeff');
  bodyGrad.addColorStop(0.35, color);
  bodyGrad.addColorStop(0.7, '#006688');
  bodyGrad.addColorStop(1, '#003344');
  ctx.fillStyle = bodyGrad;
  bodyPath();
  ctx.fill();

  // --- 2. Highlight convexe ---
  const hlGrad = ctx.createLinearGradient(x, y, x, y + height * 0.4);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hlGrad;
  ctx.beginPath();
  ctx.moveTo(x + bev + 2, y + 1);
  ctx.lineTo(x + width - bev - 2, y + 1);
  ctx.lineTo(x + width - bev - 2, y + height * 0.4);
  ctx.lineTo(x + bev + 2, y + height * 0.4);
  ctx.closePath();
  ctx.fill();

  // --- 3. Ligne d'énergie sur le dessus ---
  const eGrad = ctx.createLinearGradient(x + bev, y, x + width - bev, y);
  eGrad.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
  eGrad.addColorStop(0.3, 'rgba(0, 255, 255, 0.7)');
  eGrad.addColorStop(0.5, 'rgba(180, 255, 255, 0.9)');
  eGrad.addColorStop(0.7, 'rgba(0, 255, 255, 0.7)');
  eGrad.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
  ctx.strokeStyle = eGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + bev + 2, y + 1);
  ctx.lineTo(x + width - bev - 2, y + 1);
  ctx.stroke();

  // --- 4. Arêtes biseautées ---
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + bev, y);
  ctx.lineTo(x, y + bev);
  ctx.lineTo(x, y + height - bev);
  ctx.lineTo(x + bev, y + height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + width - bev, y);
  ctx.lineTo(x + width, y + bev);
  ctx.lineTo(x + width, y + height - bev);
  ctx.lineTo(x + width - bev, y + height);
  ctx.stroke();

  // --- 5. Détails corps ---
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (const px of [0.3, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(x + width * px, y + 3);
    ctx.lineTo(x + width * px, y + height - 3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + bev + 10, y + height * 0.55);
  ctx.lineTo(x + width - bev - 10, y + height * 0.55);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let i = 0; i < 5; i++) {
    const rx = x + width * 0.25 + i * (width * 0.5 / 4);
    ctx.beginPath();
    ctx.arc(rx, y + height * 0.3, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 6. Moteurs (petits blocs métalliques sous le paddle) ---
  const engPositions = [
    x + engInset,
    x + width - engInset - engW,
  ];
  for (const ex of engPositions) {
    const eCx = ex + engW / 2;
    const ey = y + height - 1; // ancré dans le bas du corps
    const eBot = ey + engH;

    // Bloc moteur rectangulaire métal (légèrement trapézoïdal : plus étroit en bas)
    const mGrad = ctx.createLinearGradient(ex, ey, ex, eBot);
    mGrad.addColorStop(0, '#99aabb');
    mGrad.addColorStop(0.3, '#8899aa');
    mGrad.addColorStop(0.7, '#556677');
    mGrad.addColorStop(1, '#445566');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(ex, ey);                   // haut gauche
    ctx.lineTo(ex + engW, ey);            // haut droite
    ctx.lineTo(ex + engW - 1, eBot);      // bas droite (rétréci)
    ctx.lineTo(ex + 1, eBot);             // bas gauche (rétréci)
    ctx.closePath();
    ctx.fill();

    // Reflet métal haut
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ex + 1, ey + 1);
    ctx.lineTo(ex + engW - 1, ey + 1);
    ctx.stroke();

    // Tuyère (cercle sombre en bas)
    const tX = eCx;
    const tY = eBot;
    ctx.fillStyle = '#080810';
    ctx.beginPath();
    ctx.ellipse(tX, tY, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lueur tuyère
    const flicker = 0.6 + Math.random() * 0.4;
    const tGrad = ctx.createRadialGradient(tX, tY, 0, tX, tY, 3);
    tGrad.addColorStop(0, `rgba(255, 220, 120, ${flicker})`);
    tGrad.addColorStop(0.5, `rgba(255, 100, 0, ${flicker * 0.4})`);
    tGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.arc(tX, tY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Flamme longue et dense — penche avec la vélocité (lerp)
    const flameH = 12 + Math.random() * 14;
    const targetDrift = -(ship.vx || 0) * 3;
    ship._flameDrift = ship._flameDrift || 0;
    ship._flameDrift += (targetDrift - ship._flameDrift) * 0.15; // transition douce
    const drift = ship._flameDrift;
    const fGrad = ctx.createLinearGradient(tX, tY, tX + drift, tY + flameH);
    fGrad.addColorStop(0, `rgba(255, 240, 180, ${flicker})`);
    fGrad.addColorStop(0.2, `rgba(255, 160, 30, ${flicker * 0.9})`);
    fGrad.addColorStop(0.5, 'rgba(255, 80, 0, 0.6)');
    fGrad.addColorStop(0.8, 'rgba(100, 40, 200, 0.2)');
    fGrad.addColorStop(1, 'rgba(0, 60, 255, 0)');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(tX - 4, tY);
    ctx.lineTo(tX + 4, tY);
    ctx.lineTo(tX + drift, tY + flameH);
    ctx.closePath();
    ctx.fill();
  }

  // --- 7. Voyants LED ---
  const blink = Math.sin(Date.now() * 0.005) > 0;
  ctx.fillStyle = blink ? '#ff0040' : '#660020';
  ctx.beginPath();
  ctx.arc(x + bev + 4, y + height / 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = blink ? '#00ff80' : '#006630';
  ctx.beginPath();
  ctx.arc(x + width - bev - 4, y + height / 2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // --- 8. Core central ---
  const coreGrad = ctx.createRadialGradient(cx, y + height * 0.5, 0, cx, y + height * 0.5, 4);
  coreGrad.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
  coreGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, y + height * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(cx, y + height * 0.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
