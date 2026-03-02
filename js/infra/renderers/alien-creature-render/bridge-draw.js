// --- Ponts organiques entre corps et tentacules ---

export function drawOrganicBridge(ctx, core, tentBB, pulse) {
  const cx = core.x + core.width / 2;
  const cy = core.y + core.height / 2;
  const tx = tentBB.cx;
  const ty = tentBB.cy;

  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const coreEdgeX = cx + nx * core.width * 0.45;
  const coreEdgeY = cy + ny * core.height * 0.45;
  const tentEdgeX = tx - nx * Math.min(tentBB.w, tentBB.h) * 0.4;
  const tentEdgeY = ty - ny * Math.min(tentBB.w, tentBB.h) * 0.4;

  // Largeur proportionnelle au plus petit côté du tentacule
  const bridgeW = Math.min(tentBB.w, tentBB.h) * 0.7;

  ctx.save();
  const midX = (coreEdgeX + tentEdgeX) / 2;
  const midY = (coreEdgeY + tentEdgeY) / 2;
  const perpX = -ny;
  const perpY = nx;

  ctx.beginPath();
  ctx.moveTo(coreEdgeX + perpX * bridgeW * 0.5, coreEdgeY + perpY * bridgeW * 0.5);
  ctx.quadraticCurveTo(
    midX + perpX * bridgeW * 0.35, midY + perpY * bridgeW * 0.35,
    tentEdgeX + perpX * bridgeW * 0.45, tentEdgeY + perpY * bridgeW * 0.45,
  );
  ctx.lineTo(tentEdgeX - perpX * bridgeW * 0.45, tentEdgeY - perpY * bridgeW * 0.45);
  ctx.quadraticCurveTo(
    midX - perpX * bridgeW * 0.35, midY - perpY * bridgeW * 0.35,
    coreEdgeX - perpX * bridgeW * 0.5, coreEdgeY - perpY * bridgeW * 0.5,
  );
  ctx.closePath();

  const bridgeGrad = ctx.createLinearGradient(coreEdgeX, coreEdgeY, tentEdgeX, tentEdgeY);
  bridgeGrad.addColorStop(0, '#2a3a2a');
  bridgeGrad.addColorStop(0.5, `rgba(30,80,35,${0.8 + pulse})`);
  bridgeGrad.addColorStop(1, '#1a2a1a');
  ctx.fillStyle = bridgeGrad;
  ctx.fill();

  // Veine centrale
  ctx.beginPath();
  ctx.moveTo(coreEdgeX, coreEdgeY);
  ctx.quadraticCurveTo(midX, midY, tentEdgeX, tentEdgeY);
  ctx.strokeStyle = `rgba(80,255,120,${0.3 + pulse})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = `rgba(50,200,80,${0.1 + pulse * 0.5})`;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.restore();
}
