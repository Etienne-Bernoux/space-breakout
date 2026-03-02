// --- Rendu du corps alien (métal parasité) ---

export function drawCorePart(ctx, a, pulse) {
  const cx = a.x + a.width / 2 + (a.fragOffsetX || 0);
  const cy = a.y + a.height / 2 + (a.fragOffsetY || 0);
  const rx = a.width / 2;
  const ry = a.height / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Base métal
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  const metalGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
  metalGrad.addColorStop(0, '#aaaabc');
  metalGrad.addColorStop(0.3, '#888899');
  metalGrad.addColorStop(0.5, '#666677');
  metalGrad.addColorStop(0.7, '#555566');
  metalGrad.addColorStop(1, '#333344');
  ctx.fillStyle = metalGrad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  ctx.clip();

  // Reflet métallique
  const spec = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 0, -rx * 0.2, -ry * 0.3, rx * 0.35);
  spec.addColorStop(0, 'rgba(255,255,255,0.25)');
  spec.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

  // Excroissances organiques (mousse verte sur le métal)
  const mossCount = 6;
  for (let i = 0; i < mossCount; i++) {
    const angle = (i / mossCount) * Math.PI * 2 + 0.3;
    const dist = 0.4 + (i % 3) * 0.15;
    const mx = Math.cos(angle) * rx * dist;
    const my = Math.sin(angle) * ry * dist;
    const mr = Math.min(rx, ry) * (0.15 + (i % 2) * 0.08);
    const mossGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mossGrad.addColorStop(0, `rgba(40,180,60,${0.5 + pulse})`);
    mossGrad.addColorStop(0.5, `rgba(25,120,40,${0.3 + pulse * 0.5})`);
    mossGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mossGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Veines organiques par-dessus le métal
  for (const v of a.veins) {
    ctx.beginPath();
    ctx.moveTo(v.x1 * 0.8, v.y1 * 0.8);
    if (v.cpx !== undefined) {
      ctx.quadraticCurveTo(v.cpx * 0.8, v.cpy * 0.8, v.x2 * 0.8, v.y2 * 0.8);
    } else {
      ctx.lineTo(v.x2 * 0.8, v.y2 * 0.8);
    }
    ctx.strokeStyle = `rgba(30,140,50,${0.5 + pulse})`;
    ctx.lineWidth = v.width * 1.2;
    ctx.stroke();
    ctx.strokeStyle = `rgba(80,255,120,${0.2 + pulse})`;
    ctx.lineWidth = v.width * 2.5;
    ctx.stroke();
  }

  // Grand œil central (le parasite)
  const eyeR = Math.min(rx, ry) * 0.25;
  ctx.beginPath();
  ctx.arc(0, 0, eyeR * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  const irisGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeR);
  irisGrad.addColorStop(0, `rgba(150,255,100,${0.95 + pulse})`);
  irisGrad.addColorStop(0.4, `rgba(80,230,80,${0.8 + pulse})`);
  irisGrad.addColorStop(0.7, `rgba(40,180,60,${0.5 + pulse})`);
  irisGrad.addColorStop(1, 'rgba(20,80,30,0.2)');
  ctx.beginPath();
  ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, eyeR * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#001a00';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-eyeR * 0.2, -eyeR * 0.2, eyeR * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  ctx.restore();

  // Contour organique-métal
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(80,255,120,${0.25 + pulse * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Damage
  if (a.hp < a.maxHp && a.destructible) {
    const dmgRatio = 1 - a.hp / a.maxHp;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = `rgba(0,0,0,${dmgRatio * 0.3})`;
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    const cracks = Math.floor(dmgRatio * 4) + 1;
    ctx.strokeStyle = `rgba(0,0,0,${0.3 + dmgRatio * 0.4})`;
    ctx.lineWidth = 0.8 + dmgRatio;
    for (let i = 0; i < cracks; i++) {
      const angle = (i / cracks) * Math.PI * 2 + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const len = (0.3 + dmgRatio * 0.5) * Math.min(rx, ry);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Shield
  if (a.shield) {
    const sp = 0.6 + Math.sin((a.floatPhase || 0) * 3) * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(50,255,100,${0.3 * sp})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}
