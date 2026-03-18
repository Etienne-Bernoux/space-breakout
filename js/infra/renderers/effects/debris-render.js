// --- Debris Renderer ---
// Vrais morceaux du vaisseau : bord gauche, bord droit, core, moteurs.

const BEV = 4;

/**
 * Génère 5 débris correspondant à des parties du vaisseau.
 */
export function spawnDebris(shipX, shipY, shipW, shipH, color) {
  const cx = shipX + shipW / 2;
  const cy = shipY + shipH / 2;
  const engW = 8, engInset = 16;

  const parts = [
    { id: 'left',    ox: -shipW * 0.3, oy: -2,  w: shipW * 0.35, h: shipH },
    { id: 'right',   ox:  shipW * 0.1, oy:  2,  w: shipW * 0.35, h: shipH },
    { id: 'core',    ox: -6,           oy: -4,  w: 12,           h: shipH },
    { id: 'engL',    ox: -shipW * 0.25,oy:  6,  w: engW + 4,     h: 8 },
    { id: 'engR',    ox:  shipW * 0.2, oy:  5,  w: engW + 4,     h: 8 },
  ];

  return parts.map((p, i) => {
    const angle = (Math.PI * 2 * i) / parts.length + (Math.random() - 0.5) * 0.5;
    return {
      id: p.id,
      x: cx + p.ox,
      y: cy + p.oy,
      dx: Math.cos(angle) * (0.2 + Math.random() * 0.3),
      dy: Math.sin(angle) * (0.2 + Math.random() * 0.3),
      w: p.w, h: p.h,
      rot: 0,
      dRot: (Math.random() - 0.5) * 0.015,
      color,
      shipW, shipH,
    };
  });
}

/**
 * Met à jour et dessine les débris.
 */
export function updateDebris(ctx, debris, dt = 1) {
  for (const d of debris) {
    d.x += d.dx * dt;
    d.y += d.dy * dt;
    d.rot += d.dRot * dt;

    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = 0.75;

    if (d.id === 'left')       drawLeftChunk(ctx, d);
    else if (d.id === 'right') drawRightChunk(ctx, d);
    else if (d.id === 'core')  drawCoreChunk(ctx, d);
    else                        drawEngineChunk(ctx, d);

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// --- Morceaux individuels (dessinés centrés sur 0,0) ---

function drawLeftChunk(ctx, d) {
  const hw = d.w / 2, hh = d.h / 2;
  // Forme biseautée gauche
  ctx.beginPath();
  ctx.moveTo(-hw + BEV, -hh);
  ctx.lineTo(hw, -hh);
  ctx.lineTo(hw, hh);
  ctx.lineTo(-hw + BEV, hh);
  ctx.lineTo(-hw, hh - BEV);
  ctx.lineTo(-hw, -hh + BEV);
  ctx.closePath();
  // Gradient corps
  const g = ctx.createLinearGradient(0, -hh, 0, hh);
  g.addColorStop(0, '#55eeff');
  g.addColorStop(0.35, d.color);
  g.addColorStop(0.7, '#006688');
  g.addColorStop(1, '#003344');
  ctx.fillStyle = g;
  ctx.fill();
  // Arête biseautée
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-hw + BEV, -hh);
  ctx.lineTo(-hw, -hh + BEV);
  ctx.lineTo(-hw, hh - BEV);
  ctx.lineTo(-hw + BEV, hh);
  ctx.stroke();
  // LED rouge
  ctx.fillStyle = '#ff0040';
  ctx.beginPath();
  ctx.arc(-hw + BEV + 3, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawRightChunk(ctx, d) {
  const hw = d.w / 2, hh = d.h / 2;
  ctx.beginPath();
  ctx.moveTo(-hw, -hh);
  ctx.lineTo(hw - BEV, -hh);
  ctx.lineTo(hw, -hh + BEV);
  ctx.lineTo(hw, hh - BEV);
  ctx.lineTo(hw - BEV, hh);
  ctx.lineTo(-hw, hh);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -hh, 0, hh);
  g.addColorStop(0, '#55eeff');
  g.addColorStop(0.35, d.color);
  g.addColorStop(0.7, '#006688');
  g.addColorStop(1, '#003344');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(hw - BEV, -hh);
  ctx.lineTo(hw, -hh + BEV);
  ctx.lineTo(hw, hh - BEV);
  ctx.lineTo(hw - BEV, hh);
  ctx.stroke();
  // LED verte
  ctx.fillStyle = '#00ff80';
  ctx.beginPath();
  ctx.arc(hw - BEV - 3, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoreChunk(ctx, d) {
  const hw = d.w / 2, hh = d.h / 2;
  // Morceau central avec core lumineux
  ctx.fillStyle = '#004455';
  ctx.fillRect(-hw, -hh, d.w, d.h);
  // Ligne d'énergie cassée
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-hw, -hh + 1);
  ctx.lineTo(hw, -hh + 1);
  ctx.stroke();
  // Core glow
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
  cg.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
  cg.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawEngineChunk(ctx, d) {
  const hw = d.w / 2, hh = d.h / 2;
  // Bloc moteur métal
  const mg = ctx.createLinearGradient(0, -hh, 0, hh);
  mg.addColorStop(0, '#99aabb');
  mg.addColorStop(0.3, '#8899aa');
  mg.addColorStop(0.7, '#556677');
  mg.addColorStop(1, '#445566');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(-hw, -hh);
  ctx.lineTo(hw, -hh);
  ctx.lineTo(hw - 1, hh);
  ctx.lineTo(-hw + 1, hh);
  ctx.closePath();
  ctx.fill();
  // Reflet
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-hw + 1, -hh + 1);
  ctx.lineTo(hw - 1, -hh + 1);
  ctx.stroke();
  // Tuyère éteinte
  ctx.fillStyle = '#080810';
  ctx.beginPath();
  ctx.ellipse(0, hh, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
}
