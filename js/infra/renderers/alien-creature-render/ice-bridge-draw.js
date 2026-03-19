// --- Ponts cristallins entre core Cryovore et éperons de glace ---

export function drawIceBridge(ctx, core, spireBB, pulse) {
  const cx = core.x + core.width / 2;
  const cy = core.y + core.height / 2;
  const tx = spireBB.cx;
  const ty = spireBB.cy;

  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const perpX = -ny;
  const perpY = nx;

  const coreEdgeX = cx + nx * core.width * 0.45;
  const coreEdgeY = cy + ny * core.height * 0.45;
  const spireEdgeX = tx - nx * Math.min(spireBB.w, spireBB.h) * 0.4;
  const spireEdgeY = ty - ny * Math.min(spireBB.w, spireBB.h) * 0.4;

  // Pont fin, légèrement pincé au milieu (comme une membrane cristalline)
  const bridgeW = Math.min(spireBB.w, spireBB.h) * 0.35;
  const midX = (coreEdgeX + spireEdgeX) / 2;
  const midY = (coreEdgeY + spireEdgeY) / 2;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(coreEdgeX + perpX * bridgeW * 0.5, coreEdgeY + perpY * bridgeW * 0.5);
  ctx.quadraticCurveTo(
    midX + perpX * bridgeW * 0.3, midY + perpY * bridgeW * 0.3,
    spireEdgeX + perpX * bridgeW * 0.45, spireEdgeY + perpY * bridgeW * 0.45,
  );
  ctx.lineTo(spireEdgeX - perpX * bridgeW * 0.45, spireEdgeY - perpY * bridgeW * 0.45);
  ctx.quadraticCurveTo(
    midX - perpX * bridgeW * 0.3, midY - perpY * bridgeW * 0.3,
    coreEdgeX - perpX * bridgeW * 0.5, coreEdgeY - perpY * bridgeW * 0.5,
  );
  ctx.closePath();

  const grad = ctx.createLinearGradient(coreEdgeX, coreEdgeY, spireEdgeX, spireEdgeY);
  grad.addColorStop(0, 'rgba(8,25,55,0.9)');
  grad.addColorStop(0.5, `rgba(20,60,110,${0.85 + pulse * 0.1})`);
  grad.addColorStop(1, 'rgba(30,80,140,0.8)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Veine centrale lumineuse (courbe douce)
  ctx.beginPath();
  ctx.moveTo(coreEdgeX, coreEdgeY);
  ctx.quadraticCurveTo(midX, midY, spireEdgeX, spireEdgeY);
  ctx.strokeStyle = `rgba(170,221,255,${0.4 + pulse * 0.25})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = `rgba(91,192,235,${0.12 + pulse * 0.1})`;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.restore();
}
