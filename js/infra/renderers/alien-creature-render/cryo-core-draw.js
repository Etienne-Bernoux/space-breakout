// --- Rendu du core Cryovore (flocon fractal cristallin) ---

export function drawCryoCore(ctx, a, pulse, phase = 0) {
  const cx = a.x + a.width / 2 + (a.fragOffsetX || 0);
  const cy = a.y + a.height / 2 + (a.fragOffsetY || 0);
  const rx = a.width / 2;
  const ry = a.height / 2;
  const r = Math.min(rx, ry) * 0.9;

  ctx.save();
  ctx.translate(cx, cy);

  // Rotation lente du flocon
  const rot = phase * 0.1;
  ctx.rotate(rot);

  // Glow externe diffus
  const outerGlow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.3);
  outerGlow.addColorStop(0, `rgba(91,192,235,${0.15 + pulse * 0.1})`);
  outerGlow.addColorStop(0.5, `rgba(91,192,235,${0.06 + pulse * 0.05})`);
  outerGlow.addColorStop(1, 'rgba(91,192,235,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Disque de fond sombre (base du flocon)
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  const baseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.85);
  baseGrad.addColorStop(0, '#0a2a4a');
  baseGrad.addColorStop(0.6, '#061a2e');
  baseGrad.addColorStop(1, '#030d18');
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Clip au cercle pour les branches
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
  ctx.clip();

  // 6 branches principales + sous-branches fractales
  const branchCount = 6;
  const dmgRatio = (a.hp < a.maxHp && a.destructible) ? 1 - a.hp / a.maxHp : 0;
  // Branches s'éteignent progressivement avec les dégâts
  const branchDim = 1 - dmgRatio * 0.7;
  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2;
    const shimmer = 0.5 + Math.sin(phase * 2.5 + i * 1.05) * 0.3;
    // Certaines branches s'éteignent en premier (décalé par index)
    const branchDmg = Math.min(1, dmgRatio * 1.5 - (i % 3) * 0.15);
    const branchFade = branchDmg > 0 ? Math.max(0.1, 1 - branchDmg) : 1;
    const alpha = (0.4 + pulse + shimmer * 0.3) * branchDim * branchFade;

    _drawBranch(ctx, angle, r * 0.82, alpha, phase, i);
  }

  // Glow central pulsant (s'affaiblit avec les dégâts)
  const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35);
  const glowAlpha = (0.5 + Math.sin(phase * 2) * 0.2 + pulse) * branchDim;
  centerGlow.addColorStop(0, `rgba(220,240,255,${Math.min(glowAlpha, 0.9)})`);
  centerGlow.addColorStop(0.3, `rgba(91,192,235,${Math.min(glowAlpha * 0.6, 0.7)})`);
  centerGlow.addColorStop(0.7, `rgba(51,153,204,${Math.min(glowAlpha * 0.2, 0.4)})`);
  centerGlow.addColorStop(1, 'rgba(10,42,74,0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Nœuds lumineux aux intersections (6 points)
  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2;
    const nodeDist = r * 0.4;
    const nx = Math.cos(angle) * nodeDist;
    const ny = Math.sin(angle) * nodeDist;
    const nodeAlpha = 0.4 + Math.sin(phase * 3 + i * 0.9) * 0.25;
    const nodeGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 0.08);
    nodeGrad.addColorStop(0, `rgba(255,255,255,${Math.min(nodeAlpha, 0.8)})`);
    nodeGrad.addColorStop(0.5, `rgba(170,221,255,${Math.min(nodeAlpha * 0.5, 0.5)})`);
    nodeGrad.addColorStop(1, 'rgba(91,192,235,0)');
    ctx.fillStyle = nodeGrad;
    ctx.beginPath();
    ctx.arc(nx, ny, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // fin clip

  // Contour givré
  const contourAlpha = 0.2 + pulse * 0.2 + Math.sin(phase * 1.5) * 0.1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(170,221,255,${Math.min(contourAlpha, 0.6)})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Damage — fractures + voile + branches déjà atténuées via branchDim
  if (dmgRatio > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.clip();
    // Voile sombre croissant
    ctx.fillStyle = `rgba(0,0,10,${dmgRatio * 0.45})`;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    // Fractures larges et lumineuses (glace qui craque)
    const cracks = Math.floor(dmgRatio * 6) + 1;
    for (let i = 0; i < cracks; i++) {
      const angle = (i / cracks) * Math.PI * 2 + 0.7;
      const len = (0.4 + dmgRatio * 0.5) * r;
      // Glow de fissure
      ctx.strokeStyle = `rgba(91,192,235,${0.15 + dmgRatio * 0.2})`;
      ctx.lineWidth = 3 + dmgRatio * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
      // Trait central sombre
      ctx.strokeStyle = `rgba(0,10,20,${0.5 + dmgRatio * 0.4})`;
      ctx.lineWidth = 1 + dmgRatio;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Shield givré
  if (a.shield) {
    const sp = 0.6 + Math.sin((a.floatPhase || 0) * 3) * 0.15;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(91,192,235,${0.3 * sp})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Helpers ───

function _drawBranch(ctx, angle, maxLen, alpha, phase, branchIdx) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Branche principale
  const mainLen = maxLen * 0.95;
  _drawLine(ctx, 0, 0, cos * mainLen, sin * mainLen, alpha, 2.2);

  // Sous-branches niveau 1 (à 40% et 70% de la longueur)
  const subAngles = [0.5, -0.5]; // ±~30°
  for (let lvl = 0; lvl < 2; lvl++) {
    const t = lvl === 0 ? 0.4 : 0.7;
    const ox = cos * mainLen * t;
    const oy = sin * mainLen * t;
    const subLen = mainLen * (lvl === 0 ? 0.45 : 0.3);
    const subAlpha = alpha * (0.6 + Math.sin(phase * 2 + branchIdx + lvl * 2) * 0.2);

    for (const sa of subAngles) {
      const subAngle = angle + sa;
      const sx = ox + Math.cos(subAngle) * subLen;
      const sy = oy + Math.sin(subAngle) * subLen;
      _drawLine(ctx, ox, oy, sx, sy, subAlpha, 1.4);

      // Sous-branches niveau 2 (micro-fractales)
      if (lvl === 0) {
        const microLen = subLen * 0.45;
        const microAlpha = subAlpha * 0.5;
        const microAngle = subAngle + sa * 0.6;
        const mx = sx + Math.cos(microAngle) * microLen;
        const my = sy + Math.sin(microAngle) * microLen;
        _drawLine(ctx, sx, sy, mx, my, microAlpha, 0.8);
      }
    }
  }
}

function _drawLine(ctx, x1, y1, x2, y2, alpha, width) {
  const a = Math.min(alpha, 1);
  // Glow extérieur
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(91,192,235,${a * 0.3})`;
  ctx.lineWidth = width * 2.5;
  ctx.stroke();
  // Ligne interne brillante
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(200,235,255,${a})`;
  ctx.lineWidth = width;
  ctx.stroke();
}
