// --- Rendu du corps alien (métal parasité) ---

export function drawCorePart(ctx, a, pulse, phase = 0) {
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

  // Mousse organique (lichen irrégulier colonisant le métal)
  const patchCount = 7;
  const seed = [0.73, 0.21, 0.56, 0.89, 0.34, 0.62, 0.47]; // pseudo-random stable
  for (let i = 0; i < patchCount; i++) {
    const mossPhase = phase * 1.8 + i * 1.05;
    const breathe = 1 + Math.sin(mossPhase) * 0.12;
    const angle = (i / patchCount) * Math.PI * 2 + 0.3;
    const dist = 0.35 + (i % 3) * 0.18 + Math.sin(mossPhase * 0.7) * 0.03;
    const px = Math.cos(angle) * rx * dist;
    const py = Math.sin(angle) * ry * dist;
    const patchR = Math.min(rx, ry) * (0.12 + (i % 2) * 0.06);
    const lum = 0.45 + pulse + Math.sin(mossPhase + 1) * 0.12;

    // Cluster de blobs irréguliers par patch
    const blobCount = 4 + (i % 3);
    for (let b = 0; b < blobCount; b++) {
      const ba = seed[(i + b) % 7] * Math.PI * 2 + b * 1.3;
      const bd = patchR * (0.2 + seed[(i * 3 + b) % 7] * 0.6) * breathe;
      const bx = px + Math.cos(ba) * bd;
      const by = py + Math.sin(ba) * bd * 0.7; // aplati = plus organique
      const br = patchR * (0.35 + seed[(b * 2 + i) % 7] * 0.4) * breathe;
      const bLum = lum * (0.7 + seed[(i + b * 2) % 7] * 0.3);
      const g = ctx.createRadialGradient(bx, by, br * 0.1, bx, by, br);
      g.addColorStop(0, `rgba(35,160,50,${Math.min(bLum, 0.85)})`);
      g.addColorStop(0.6, `rgba(20,110,35,${Math.min(bLum * 0.5, 0.6)})`);
      g.addColorStop(1, 'rgba(10,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(bx, by, br, br * (0.6 + seed[(i + b) % 7] * 0.4), ba * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Filaments au bord du patch (aspect "qui s'étend")
    for (let f = 0; f < 3; f++) {
      const fa = seed[(i * 2 + f) % 7] * Math.PI * 2 + f * 2.1;
      const fLen = patchR * (0.8 + seed[(f + i) % 7] * 0.5) * breathe;
      const fx = px + Math.cos(fa) * fLen;
      const fy = py + Math.sin(fa) * fLen;
      const fLum = lum * 0.6;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(fa) * patchR * 0.3, py + Math.sin(fa) * patchR * 0.3);
      ctx.quadraticCurveTo(
        px + Math.cos(fa + 0.3) * fLen * 0.6,
        py + Math.sin(fa + 0.3) * fLen * 0.6,
        fx, fy
      );
      ctx.strokeStyle = `rgba(30,130,45,${Math.min(fLum, 0.7)})`;
      ctx.lineWidth = 1.5 * breathe;
      ctx.stroke();
      // Petit blob au bout du filament
      const tipR = patchR * 0.15 * breathe;
      const tg = ctx.createRadialGradient(fx, fy, 0, fx, fy, tipR);
      tg.addColorStop(0, `rgba(40,170,55,${Math.min(fLum * 1.2, 0.7)})`);
      tg.addColorStop(1, 'rgba(10,60,20,0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(fx, fy, tipR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Veines organiques — onde lumineuse propagée
  for (let vi = 0; vi < a.veins.length; vi++) {
    const v = a.veins[vi];
    const veinWave = Math.sin(phase * 3 - vi * 0.8); // onde décalée par veine
    const thick = 1 + veinWave * 0.3; // épaisseur ±30%
    const glow = 0.5 + pulse + veinWave * 0.2;
    ctx.beginPath();
    ctx.moveTo(v.x1 * 0.8, v.y1 * 0.8);
    if (v.cpx !== undefined) {
      ctx.quadraticCurveTo(v.cpx * 0.8, v.cpy * 0.8, v.x2 * 0.8, v.y2 * 0.8);
    } else {
      ctx.lineTo(v.x2 * 0.8, v.y2 * 0.8);
    }
    ctx.strokeStyle = `rgba(30,140,50,${Math.min(glow, 0.95)})`;
    ctx.lineWidth = v.width * 1.2 * thick;
    ctx.stroke();
    ctx.strokeStyle = `rgba(80,255,120,${Math.min(0.2 + pulse + veinWave * 0.15, 0.7)})`;
    ctx.lineWidth = v.width * 2.5 * thick;
    ctx.stroke();
  }

  // Grand œil central (le parasite) — vivant
  const eyeR = Math.min(rx, ry) * 0.25;
  const irisPulse = 1 + Math.sin(phase * 2) * 0.08; // iris dilate/contracte
  const pupilScale = 0.3 + Math.sin(phase * 1.5 + 1) * 0.06; // pupille respire
  const lookAngle = phase * 0.4; // regard qui orbite lentement
  const lookDist = eyeR * 0.1;
  const lookX = Math.cos(lookAngle) * lookDist;
  const lookY = Math.sin(lookAngle) * lookDist;

  // Sclérotique (fond noir)
  ctx.beginPath();
  ctx.arc(0, 0, eyeR * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();

  // Iris (suit le regard, pulse)
  const irisR = eyeR * irisPulse;
  const irisGrad = ctx.createRadialGradient(lookX, lookY, 0, lookX, lookY, irisR);
  const irisAlpha = 0.85 + pulse;
  irisGrad.addColorStop(0, `rgba(150,255,100,${Math.min(irisAlpha, 1)})`);
  irisGrad.addColorStop(0.4, `rgba(80,230,80,${Math.min(irisAlpha * 0.85, 1)})`);
  irisGrad.addColorStop(0.7, `rgba(40,180,60,${Math.min(irisAlpha * 0.55, 1)})`);
  irisGrad.addColorStop(1, 'rgba(20,80,30,0.2)');
  ctx.beginPath();
  ctx.arc(lookX, lookY, irisR, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  // Pupille (suit le regard, respire)
  ctx.beginPath();
  ctx.arc(lookX, lookY, eyeR * pupilScale, 0, Math.PI * 2);
  ctx.fillStyle = '#001a00';
  ctx.fill();

  // Reflet (orbite autour de la pupille)
  const reflAngle = -phase * 0.6 + 0.8;
  const reflX = lookX + Math.cos(reflAngle) * eyeR * 0.22;
  const reflY = lookY + Math.sin(reflAngle) * eyeR * 0.22;
  ctx.beginPath();
  ctx.arc(reflX, reflY, eyeR * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(phase * 2.5) * 0.2})`;
  ctx.fill();

  ctx.restore();

  // Contour organique-métal — pulse vivant
  const contourGlow = 0.25 + pulse * 0.3 + Math.sin(phase * 2) * 0.1;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(80,255,120,${Math.min(contourGlow, 0.8)})`;
  ctx.lineWidth = 1.5 + Math.sin(phase * 2) * 0.5;
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
