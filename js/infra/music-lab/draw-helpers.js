// Drawing helper functions

export function drawBtn(ctx, x, y, w, h, label, color, isHovered, isActive) {
  const alpha = isActive ? 0.35 : isHovered ? 0.15 : 0.06;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = isActive ? color : isHovered ? color : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = isHovered || isActive ? '#ffffff' : color;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = 'left';
}

export function drawLabel(ctx, text, x, y) {
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(text, x, y);
}

export function drawSmallText(ctx, text, x, y, color) {
  ctx.fillStyle = color || '#556666';
  ctx.font = '11px monospace';
  ctx.fillText(text, x, y);
}
