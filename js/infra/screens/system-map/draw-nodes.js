// Rendu des nœuds (astres) sur la system map.
// Chaque type de zone a un style visuel distinct.

/** Dessine un nœud de zone sur la system map. */
export function drawSystemNode(ctx, pos, zone, unlocked, selected, s, t) {
  const R = getNodeRadius(zone.type, s);
  ctx.save();
  ctx.translate(pos.x, pos.y);

  if (!unlocked) {
    drawLockedNode(ctx, R, s, t);
  } else {
    const drawer = NODE_DRAWERS[zone.type] || drawDefaultNode;
    drawer(ctx, R, zone, s, t);
  }

  // Glow sélection
  if (selected && unlocked) {
    ctx.shadowColor = zone.accent;
    ctx.shadowBlur = 16 + Math.sin(t * 3) * 6;
    ctx.strokeStyle = zone.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/** Rayon du nœud selon le type de zone. */
export function getNodeRadius(type, s) {
  const radii = { belt: 14, moon: 16, station: 18, planet: 22, nebula: 20, core: 24 };
  return Math.round((radii[type] || 16) * s);
}

const NODE_DRAWERS = {
  belt: drawBeltNode,
  moon: drawMoonNode,
  station: drawStationNode,
  planet: drawPlanetNode,
  nebula: drawNebulaNode,
  core: drawCoreNode,
};

// --- Drawers par type ---

function drawLockedNode(ctx, R, s, t) {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Cadenas
  ctx.fillStyle = '#666';
  ctx.font = `${Math.round(12 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔒', 0, 0);
}

function drawBeltNode(ctx, R, zone, s, t) {
  // Petits rochers épars en cercle
  const grad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
  grad.addColorStop(0, '#a08040');
  grad.addColorStop(1, '#604820');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  // Cratères
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + t * 0.2;
    const d = R * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * d, Math.sin(angle) * d, R * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMoonNode(ctx, R, zone, s, t) {
  const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  grad.addColorStop(0, '#c8e8ff');
  grad.addColorStop(0.6, '#6baed6');
  grad.addColorStop(1, '#2a5a80');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  // Reflet glacé
  ctx.globalAlpha = 0.3 + Math.sin(t * 2) * 0.1;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-R * 0.25, -R * 0.25, R * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawStationNode(ctx, R, zone, s, t) {
  // Forme géométrique (hexagone)
  ctx.fillStyle = '#555';
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](Math.cos(angle) * R, Math.sin(angle) * R);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Lumière clignotante
  const blink = Math.sin(t * 4) > 0.5 ? 1 : 0.2;
  ctx.fillStyle = `rgba(255, 100, 100, ${blink})`;
  ctx.beginPath();
  ctx.arc(0, -R * 0.4, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlanetNode(ctx, R, zone, s, t) {
  const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  grad.addColorStop(0, '#ffaa44');
  grad.addColorStop(0.5, '#ff6b35');
  grad.addColorStop(1, '#8b2500');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  // Bandes atmosphériques
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.2;
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = i % 2 ? '#ff4400' : '#ffcc00';
    ctx.fillRect(-R, i * R * 0.3 - 2, R * 2, 4);
  }
  ctx.restore();
}

function drawNebulaNode(ctx, R, zone, s, t) {
  // Halo diffus
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  grad.addColorStop(0, 'rgba(160, 60, 200, 0.8)');
  grad.addColorStop(0.5, 'rgba(100, 30, 140, 0.5)');
  grad.addColorStop(1, 'rgba(60, 10, 80, 0.1)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.3, 0, Math.PI * 2);
  ctx.fill();
  // Noyau
  ctx.fillStyle = '#9b4dca';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Particules
  for (let i = 0; i < 5; i++) {
    const angle = t * 0.5 + (i / 5) * Math.PI * 2;
    const d = R * (0.5 + Math.sin(t + i) * 0.2);
    ctx.fillStyle = `rgba(200, 120, 255, ${0.4 + Math.sin(t * 2 + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * d, Math.sin(angle) * d, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoreNode(ctx, R, zone, s, t) {
  // Forme organique pulsante
  const pulse = 1 + Math.sin(t * 3) * 0.08;
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * pulse);
  grad.addColorStop(0, '#00ff66');
  grad.addColorStop(0.5, '#008833');
  grad.addColorStop(1, '#003311');
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const wobble = R * pulse * (0.85 + Math.sin(angle * 3 + t * 2) * 0.15);
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](Math.cos(angle) * wobble, Math.sin(angle) * wobble);
  }
  ctx.closePath();
  ctx.fill();
  // Œil central
  ctx.fillStyle = '#ff0044';
  ctx.beginPath();
  ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawDefaultNode(ctx, R, zone, s, t) {
  ctx.fillStyle = zone.accent;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
}
